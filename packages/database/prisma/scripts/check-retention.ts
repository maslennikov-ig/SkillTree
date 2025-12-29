/**
 * Data Retention Check Script
 *
 * Implementation of FR-038: 3-Year Data Retention Policy
 *
 * Identifies users with expired retention periods (retentionExpiresAt < NOW).
 * Used to audit compliance before running anonymize-users.ts script.
 *
 * Usage:
 *   ts-node check-retention.ts              # Standard report
 *   ts-node check-retention.ts --dry-run    # Same as standard (informational only)
 *   ts-node check-retention.ts --json       # Machine-readable JSON output
 *
 * Requirements:
 * - DATABASE_URL environment variable must be set
 * - Run from packages/database directory or with proper env setup
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

/**
 * Report structure for retention check
 */
interface RetentionReport {
  totalExpired: number;
  expiredUserIds: string[];
  oldestExpiration: Date | null;
  newestExpiration: Date | null;
  checkTimestamp: Date;
}

/**
 * User details for reporting
 */
interface ExpiredUser {
  id: string;
  telegramId: bigint;
  retentionExpiresAt: Date;
  createdAt: Date;
  daysExpired: number;
}

/**
 * Check for users with expired retention periods
 *
 * @param options - CLI options
 * @returns Report with expired user statistics
 */
async function checkRetention(options: {
  dryRun: boolean;
  json: boolean;
}): Promise<RetentionReport> {
  const now = new Date();

  // Query users with expired retention
  const expiredUsers = await prisma.user.findMany({
    where: {
      retentionExpiresAt: {
        not: null,
        lt: now,
      },
    },
    select: {
      id: true,
      telegramId: true,
      retentionExpiresAt: true,
      createdAt: true,
    },
    orderBy: { retentionExpiresAt: "asc" },
  });

  // Build user details array
  const userDetails: ExpiredUser[] = expiredUsers.map((user) => {
    const expiresAt = user.retentionExpiresAt!;
    const daysExpired = Math.floor(
      (now.getTime() - expiresAt.getTime()) / (1000 * 60 * 60 * 24),
    );

    return {
      id: user.id,
      telegramId: user.telegramId,
      retentionExpiresAt: expiresAt,
      createdAt: user.createdAt,
      daysExpired,
    };
  });

  // Generate report
  const report: RetentionReport = {
    totalExpired: expiredUsers.length,
    expiredUserIds: expiredUsers.map((u) => u.id),
    oldestExpiration:
      userDetails.length > 0 ? userDetails[0]!.retentionExpiresAt : null,
    newestExpiration:
      userDetails.length > 0
        ? userDetails[userDetails.length - 1]!.retentionExpiresAt
        : null,
    checkTimestamp: now,
  };

  // Output based on format
  if (options.json) {
    outputJSON(report, userDetails);
  } else {
    outputStandard(report, userDetails, options.dryRun);
  }

  return report;
}

/**
 * Output report in standard human-readable format
 */
function outputStandard(
  report: RetentionReport,
  userDetails: ExpiredUser[],
  dryRun: boolean,
): void {
  console.log("=== Data Retention Check Report ===");
  console.log(`Timestamp: ${report.checkTimestamp.toISOString()}`);

  if (dryRun) {
    console.log("Mode: DRY-RUN");
  }

  console.log("");
  console.log(`Expired Users: ${report.totalExpired}`);

  if (report.totalExpired > 0) {
    console.log(
      `Oldest Expiration: ${report.oldestExpiration!.toISOString().split("T")[0]}`,
    );
    console.log(
      `Newest Expiration: ${report.newestExpiration!.toISOString().split("T")[0]}`,
    );
    console.log("");
    console.log("User IDs:");

    userDetails.forEach((user) => {
      const expirationDate = user.retentionExpiresAt
        .toISOString()
        .split("T")[0];
      console.log(
        `- ${user.id} (expired: ${expirationDate}, days overdue: ${user.daysExpired})`,
      );
    });

    console.log("");
    console.log(
      "Action Required: Run anonymize-users.ts to process these users",
    );
  } else {
    console.log("");
    console.log("No expired users found. Retention policy compliance: OK");
  }
}

/**
 * Output report in JSON format
 */
function outputJSON(report: RetentionReport, userDetails: ExpiredUser[]): void {
  const output = {
    status: "success",
    timestamp: report.checkTimestamp.toISOString(),
    summary: {
      totalExpired: report.totalExpired,
      oldestExpiration: report.oldestExpiration?.toISOString() || null,
      newestExpiration: report.newestExpiration?.toISOString() || null,
    },
    expiredUsers: userDetails.map((user) => ({
      userId: user.id,
      telegramId: user.telegramId.toString(),
      retentionExpiresAt: user.retentionExpiresAt.toISOString(),
      createdAt: user.createdAt.toISOString(),
      daysExpired: user.daysExpired,
    })),
  };

  console.log(JSON.stringify(output, null, 2));
}

/**
 * CLI entry point
 */
async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const json = args.includes("--json");

  try {
    await checkRetention({ dryRun, json });
  } catch (error) {
    if (json) {
      console.error(
        JSON.stringify(
          {
            status: "error",
            timestamp: new Date().toISOString(),
            error: error instanceof Error ? error.message : "Unknown error",
          },
          null,
          2,
        ),
      );
    } else {
      console.error("❌ Error checking retention:", error);
    }
    process.exit(1);
  }
}

main()
  .catch((error) => {
    console.error("Fatal error:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
