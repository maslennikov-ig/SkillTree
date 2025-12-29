/**
 * User Data Anonymization Script (FR-039)
 *
 * Anonymizes expired user data after 3-year retention period while preserving
 * TestResult analytics data.
 *
 * Usage:
 *   cd packages/database
 *   pnpm db:anonymize [OPTIONS]
 *
 * Options:
 *   --dry-run         Show what would be anonymized without making changes
 *   --limit=N         Process at most N users (default: unlimited)
 *   --batch-size=N    Process N users per batch (default: 10)
 *
 * Examples:
 *   pnpm db:anonymize --dry-run
 *   pnpm db:anonymize --limit=50
 *   pnpm db:anonymize --limit=1000 --batch-size=20
 *
 * Anonymization Process (FR-039):
 * 1. Replace PII with hashed placeholders:
 *    - telegramId → hash of original (prevents collisions)
 *    - telegramUsername → null
 *    - firstName → "ANONYMIZED"
 *    - lastName → null
 *    - email (in Parent) → "anonymized-{hash}@deleted.local"
 * 2. Preserve TestResult data for analytics (riasecProfile, personalityType, hollandCode)
 * 3. Delete sensitive relations:
 *    - EmailVerification records
 *    - ParentLinkCode records
 *    - ReferralTracking records (both as referrer and referee)
 * 4. Clear retentionExpiresAt to prevent re-processing
 *
 * Schema Note:
 * - TestResult is preserved (NOT deleted) - only the link to user is anonymized
 * - Student/Parent records are NOT deleted - they remain for TestResult integrity
 * - DailyStreak and Achievement are preserved (anonymized user's historical data)
 */

import { PrismaClient } from "@prisma/client";
import * as crypto from "crypto";

const prisma = new PrismaClient();

// ============================================================================
// Types and Interfaces
// ============================================================================

interface AnonymizationOptions {
  dryRun: boolean;
  limit?: number;
  batchSize: number;
}

interface AnonymizationStats {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ userId: string; error: string }>;
  startTime: Date;
  endTime?: Date;
}

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Create SHA-256 hash of value (truncated to 16 chars for readability)
 */
function hashValue(value: string | bigint): string {
  return crypto
    .createHash("sha256")
    .update(String(value))
    .digest("hex")
    .slice(0, 16);
}

/**
 * Convert hashed string to BigInt for telegramId field
 * Uses first 15 hex chars to stay within safe BigInt range
 */
function hashToBigInt(value: string | bigint): bigint {
  const hash = hashValue(value);
  // Use 15 chars (60 bits) to avoid BigInt overflow
  return BigInt("0x" + hash.slice(0, 15));
}

/**
 * Format duration in human-readable format
 */
function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  } else {
    return `${seconds}s`;
  }
}

// ============================================================================
// Core Anonymization Logic
// ============================================================================

/**
 * Anonymize a single user with all related data
 *
 * Uses transaction for atomicity - if any step fails, all changes are rolled back.
 *
 * @param userId - User ID to anonymize
 * @returns true if successful, false if user not found
 * @throws Error if anonymization fails
 */
async function anonymizeUser(userId: string): Promise<boolean> {
  return await prisma.$transaction(
    async (tx) => {
      // 1. Get user data with relations
      const user = await tx.user.findUnique({
        where: { id: userId },
        include: {
          parent: true,
          student: true,
        },
      });

      if (!user) {
        console.warn(`⚠️  User ${userId} not found - may have been deleted`);
        return false;
      }

      // Skip if already anonymized
      if (user.firstName === "ANONYMIZED") {
        console.log(`ℹ️  User ${userId} already anonymized - skipping`);
        return true;
      }

      console.log(
        `   Processing user ${userId} (Telegram: ${user.telegramId})`,
      );

      // 2. Delete sensitive relations
      // Note: Use deleteMany for relations that may not exist

      // Delete EmailVerification records
      const emailVerificationCount = await tx.emailVerification.deleteMany({
        where: { userId },
      });
      if (emailVerificationCount.count > 0) {
        console.log(
          `   → Deleted ${emailVerificationCount.count} EmailVerification record(s)`,
        );
      }

      // Delete ParentLinkCode (if user is a student)
      if (user.student) {
        const linkCodeCount = await tx.parentLinkCode.deleteMany({
          where: { studentId: user.student.id },
        });
        if (linkCodeCount.count > 0) {
          console.log(
            `   → Deleted ${linkCodeCount.count} ParentLinkCode record(s)`,
          );
        }
      }

      // Delete ReferralTracking (both as referrer and referee)
      const referralCount = await tx.referralTracking.deleteMany({
        where: {
          OR: [{ referrerId: userId }, { refereeId: userId }],
        },
      });
      if (referralCount.count > 0) {
        console.log(
          `   → Deleted ${referralCount.count} ReferralTracking record(s)`,
        );
      }

      // 3. Anonymize User PII
      const hashedTelegramId = hashToBigInt(user.telegramId);
      await tx.user.update({
        where: { id: userId },
        data: {
          telegramId: hashedTelegramId,
          telegramUsername: null,
          firstName: "ANONYMIZED",
          lastName: null,
          retentionExpiresAt: null, // Clear to prevent re-processing
        },
      });
      console.log(
        `   → Anonymized User record (telegramId: ${user.telegramId} → ${hashedTelegramId})`,
      );

      // 4. Anonymize Parent email (if exists)
      if (user.parent) {
        const anonymizedEmail = `anonymized-${hashValue(userId)}@deleted.local`;
        await tx.parent.update({
          where: { id: user.parent.id },
          data: {
            email: anonymizedEmail,
            emailVerified: false,
          },
        });
        console.log(
          `   → Anonymized Parent email (${user.parent.email || "null"} → ${anonymizedEmail})`,
        );
      }

      // 5. Anonymize Student phone (if exists)
      if (user.student && user.student.phone) {
        await tx.student.update({
          where: { id: user.student.id },
          data: {
            phone: null,
          },
        });
        console.log(`   → Cleared Student phone number`);
      }

      // Note: TestResult, DailyStreak, Achievement are preserved
      // TestResult remains linked via TestSession → Student → User (anonymized)
      // This preserves analytics data while removing PII

      return true;
    },
    {
      timeout: 30000, // 30 second timeout per user
    },
  );
}

/**
 * Find users eligible for anonymization
 *
 * Criteria (FR-039):
 * - retentionExpiresAt is set and in the past
 * - firstName is NOT "ANONYMIZED" (skip already processed)
 */
async function findExpiredUsers(
  limit?: number,
): Promise<
  Array<{ id: string; telegramId: bigint; firstName: string | null }>
> {
  return await prisma.user.findMany({
    where: {
      retentionExpiresAt: {
        not: null,
        lt: new Date(),
      },
      firstName: {
        not: "ANONYMIZED",
      },
    },
    select: {
      id: true,
      telegramId: true,
      firstName: true,
    },
    take: limit,
    orderBy: {
      retentionExpiresAt: "asc", // Process oldest expirations first
    },
  });
}

/**
 * Anonymize expired users in batches
 *
 * @param options - Anonymization options
 * @returns Anonymization statistics
 */
async function anonymizeExpiredUsers(
  options: AnonymizationOptions,
): Promise<AnonymizationStats> {
  const stats: AnonymizationStats = {
    totalProcessed: 0,
    successCount: 0,
    errorCount: 0,
    errors: [],
    startTime: new Date(),
  };

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║        USER DATA ANONYMIZATION SCRIPT (FR-039)            ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  console.log(
    `Mode:       ${options.dryRun ? "🔍 DRY-RUN (no changes)" : "⚠️  LIVE (will modify data)"}`,
  );
  console.log(`Limit:      ${options.limit || "unlimited"} user(s)`);
  console.log(`Batch Size: ${options.batchSize} user(s) per batch`);
  console.log(`Started:    ${stats.startTime.toISOString()}\n`);

  // Find expired users
  console.log("📊 Scanning for expired users...\n");
  const expiredUsers = await findExpiredUsers(options.limit);

  if (expiredUsers.length === 0) {
    console.log("✅ No users require anonymization.\n");
    stats.endTime = new Date();
    return stats;
  }

  console.log(
    `Found ${expiredUsers.length} user(s) eligible for anonymization:\n`,
  );

  // Preview users to be anonymized
  expiredUsers.slice(0, 5).forEach((user) => {
    console.log(
      `  • User ${user.id} - Telegram: ${user.telegramId} - Name: ${user.firstName || "null"}`,
    );
  });
  if (expiredUsers.length > 5) {
    console.log(`  ... and ${expiredUsers.length - 5} more\n`);
  } else {
    console.log("");
  }

  if (options.dryRun) {
    console.log("🔍 DRY-RUN MODE: No changes will be made.\n");
    stats.totalProcessed = expiredUsers.length;
    stats.endTime = new Date();
    return stats;
  }

  // Process users in batches
  console.log("⚙️  Processing users in batches...\n");

  for (let i = 0; i < expiredUsers.length; i += options.batchSize) {
    const batch = expiredUsers.slice(
      i,
      Math.min(i + options.batchSize, expiredUsers.length),
    );
    const batchNum = Math.floor(i / options.batchSize) + 1;
    const totalBatches = Math.ceil(expiredUsers.length / options.batchSize);

    console.log(
      `\n📦 Batch ${batchNum}/${totalBatches} (${batch.length} user(s)):`,
    );
    console.log("─".repeat(60));

    for (const user of batch) {
      stats.totalProcessed++;

      try {
        const success = await anonymizeUser(user.id);

        if (success) {
          stats.successCount++;
          console.log(`   ✅ User ${user.id} anonymized successfully`);
        } else {
          // User not found (may have been deleted externally)
          stats.successCount++;
          console.log(`   ⚠️  User ${user.id} not found (skipped)`);
        }
      } catch (error) {
        stats.errorCount++;
        const errorMessage =
          error instanceof Error ? error.message : String(error);
        stats.errors.push({ userId: user.id, error: errorMessage });
        console.error(`   ❌ User ${user.id} failed: ${errorMessage}`);
      }
    }

    // Progress update
    console.log(
      `\n   Progress: ${stats.successCount + stats.errorCount}/${expiredUsers.length} (${Math.round(((stats.successCount + stats.errorCount) / expiredUsers.length) * 100)}%)`,
    );
  }

  stats.endTime = new Date();
  return stats;
}

// ============================================================================
// Reporting and CLI
// ============================================================================

/**
 * Print final anonymization report
 */
function printReport(stats: AnonymizationStats): void {
  const duration = stats.endTime
    ? stats.endTime.getTime() - stats.startTime.getTime()
    : 0;

  console.log(
    "\n╔════════════════════════════════════════════════════════════╗",
  );
  console.log("║                   ANONYMIZATION REPORT                     ║");
  console.log(
    "╚════════════════════════════════════════════════════════════╝\n",
  );

  console.log("📊 Summary:");
  console.log(`   Total Processed: ${stats.totalProcessed}`);
  console.log(
    `   Successful:      ${stats.successCount} (${stats.totalProcessed > 0 ? Math.round((stats.successCount / stats.totalProcessed) * 100) : 0}%)`,
  );
  console.log(
    `   Failed:          ${stats.errorCount} (${stats.totalProcessed > 0 ? Math.round((stats.errorCount / stats.totalProcessed) * 100) : 0}%)`,
  );
  console.log(`   Duration:        ${formatDuration(duration)}\n`);

  if (stats.errors.length > 0) {
    console.log("❌ Errors:");
    stats.errors.forEach((err, idx) => {
      console.log(`   ${idx + 1}. User ${err.userId}: ${err.error}`);
    });
    console.log("");
  }

  if (stats.successCount > 0) {
    console.log("✅ Anonymization completed successfully.");
  } else if (stats.errorCount > 0) {
    console.log("⚠️  Anonymization completed with errors.");
  }

  console.log("\n📝 Notes:");
  console.log("   • TestResult data preserved for analytics");
  console.log("   • Student/Parent records preserved (PII removed)");
  console.log("   • DailyStreak and Achievement records preserved");
  console.log(
    "   • Sensitive relations deleted (EmailVerification, ParentLinkCode, ReferralTracking)",
  );
  console.log("");
}

/**
 * Parse CLI arguments
 */
function parseArgs(): AnonymizationOptions {
  const args = process.argv.slice(2);

  const options: AnonymizationOptions = {
    dryRun: args.includes("--dry-run"),
    batchSize: 10, // Default batch size
  };

  // Parse --limit=N
  const limitArg = args.find((a) => a.startsWith("--limit="));
  if (limitArg) {
    const limitValue = limitArg.split("=")[1];
    if (!limitValue) {
      console.error(
        "❌ Invalid --limit format. Use --limit=N where N is a positive integer.",
      );
      process.exit(1);
    }
    const limit = parseInt(limitValue, 10);
    if (isNaN(limit) || limit <= 0) {
      console.error("❌ Invalid --limit value. Must be a positive integer.");
      process.exit(1);
    }
    options.limit = limit;
  }

  // Parse --batch-size=N
  const batchArg = args.find((a) => a.startsWith("--batch-size="));
  if (batchArg) {
    const batchValue = batchArg.split("=")[1];
    if (!batchValue) {
      console.error(
        "❌ Invalid --batch-size format. Use --batch-size=N where N is a positive integer.",
      );
      process.exit(1);
    }
    const batchSize = parseInt(batchValue, 10);
    if (isNaN(batchSize) || batchSize <= 0) {
      console.error(
        "❌ Invalid --batch-size value. Must be a positive integer.",
      );
      process.exit(1);
    }
    options.batchSize = batchSize;
  }

  return options;
}

// ============================================================================
// Main Entry Point
// ============================================================================

async function main() {
  try {
    const options = parseArgs();
    const stats = await anonymizeExpiredUsers(options);
    printReport(stats);

    // Exit with error code if any errors occurred
    if (stats.errorCount > 0) {
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Fatal error during anonymization:");
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

// Run script
main();
