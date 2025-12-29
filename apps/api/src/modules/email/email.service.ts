import {
  Injectable,
  OnModuleInit,
  Logger,
  BadRequestException,
} from "@nestjs/common";
import { PrismaService } from "../prisma/prisma.service";
import * as sendpulse from "sendpulse-api";
import * as fs from "fs/promises";
import * as path from "path";
import type { RIASECScores } from "@skilltree/shared";

export interface VerificationResult {
  success: boolean;
  code?: string;
  expiresAt?: Date;
  message?: string;
}

export interface VerificationCheckResult {
  success: boolean;
  error?: string;
}

export interface ParentReportData {
  parentName: string;
  studentName: string;
  testDate: Date;
  hollandCode: string;
  archetype: { name: string; emoji: string; description: string };
  riasecScores: RIASECScores;
  topCareers: Array<{
    title: string;
    description: string;
    matchPercentage: number;
  }>;
}

/**
 * Email service for handling SendPulse integration and email verification
 *
 * Features:
 * - SendPulse SMTP email sending (12K free emails/month)
 * - 4-digit verification code generation
 * - Email verification record management
 * - Code expiration (15 minutes)
 * - Rate limiting (max 3 requests per hour per user)
 */
@Injectable()
export class EmailService implements OnModuleInit {
  private readonly logger = new Logger(EmailService.name);
  private readonly EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  private sendPulseInitialized = false;
  private sendPulseReady: Promise<boolean> = Promise.resolve(false);
  private rateLimitStore = new Map<string, number[]>(); // userId -> timestamps[]

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Initialize SendPulse API with credentials from environment
   */
  async onModuleInit() {
    const apiUserId = process.env.SENDPULSE_API_USER_ID;
    const apiSecret = process.env.SENDPULSE_API_SECRET;

    if (!apiUserId || !apiSecret) {
      this.logger.warn(
        "SendPulse credentials not configured - email service disabled",
      );
      this.sendPulseReady = Promise.resolve(false);
      return;
    }

    // Ensure token directory exists (CRIT-003 fix)
    const tokenDir =
      process.env.SENDPULSE_TOKEN_DIR || path.join(process.cwd(), ".cache");
    const tokenPath = path.join(tokenDir, "sendpulse-token");

    try {
      await fs.mkdir(tokenDir, { recursive: true });
    } catch (error) {
      this.logger.error(
        { error, tokenDir },
        "Failed to create SendPulse token directory",
      );
      this.sendPulseReady = Promise.resolve(false);
      return;
    }

    // Promisify initialization (CRIT-002 fix)
    this.sendPulseReady = new Promise<boolean>((resolve) => {
      sendpulse.init(apiUserId, apiSecret, tokenPath, (token: unknown) => {
        const success = !!(
          token && (token as { access_token?: string }).access_token
        );
        this.sendPulseInitialized = success;

        if (success) {
          this.logger.log("SendPulse API initialized successfully");
        } else {
          this.logger.error(
            "Failed to initialize SendPulse API - invalid token response",
          );
        }

        resolve(success);
      });
    });

    // Wait for initialization to complete before onModuleInit returns
    await this.sendPulseReady;
  }

  /**
   * Generate a random 4-digit verification code
   * @returns String with 4 digits (0000-9999)
   */
  generateVerificationCode(): string {
    const code = Math.floor(Math.random() * 10000);
    return code.toString().padStart(4, "0");
  }

  /**
   * Check rate limiting for email verification requests
   * Max 3 requests per hour per user
   *
   * @param userId User ID to check
   * @returns true if rate limit exceeded, false otherwise
   */
  private isRateLimited(userId: string): boolean {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000; // 1 hour in milliseconds

    // Get timestamps for this user
    const timestamps = this.rateLimitStore.get(userId) || [];

    // Filter out timestamps older than 1 hour
    const recentTimestamps = timestamps.filter((ts) => ts > oneHourAgo);

    // Update store with filtered timestamps
    if (recentTimestamps.length === 0) {
      this.rateLimitStore.delete(userId);
    } else {
      this.rateLimitStore.set(userId, recentTimestamps);
    }

    // Check if user exceeded rate limit (3 requests per hour)
    if (recentTimestamps.length >= 3) {
      this.logger.warn(
        `Rate limit exceeded for user ${userId}: ${recentTimestamps.length} requests in the last hour`,
      );
      return true;
    }

    return false;
  }

  /**
   * Record a new verification request timestamp
   *
   * @param userId User ID
   */
  private recordVerificationRequest(userId: string): void {
    const now = Date.now();
    const timestamps = this.rateLimitStore.get(userId) || [];
    timestamps.push(now);
    this.rateLimitStore.set(userId, timestamps);
  }

  /**
   * Create email verification record in database
   * Deletes any existing unverified codes for the same user
   *
   * @param userId User ID
   * @param email Email address
   * @returns Verification code and expiration date
   */
  async createVerification(
    userId: string,
    email: string,
  ): Promise<VerificationResult> {
    // Validate email format
    if (!email || !this.EMAIL_REGEX.test(email)) {
      this.logger.warn({ email }, "Invalid email format provided");
      return {
        success: false,
        message: "Некорректный формат email",
      };
    }

    // Normalize email (lowercase, trim)
    const normalizedEmail = email.toLowerCase().trim();

    // Check rate limiting
    if (this.isRateLimited(userId)) {
      throw new BadRequestException(
        "Rate limit exceeded. Maximum 3 verification requests per hour.",
      );
    }

    // Generate new code
    const code = this.generateVerificationCode();
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

    // Delete old unverified codes for this user
    await this.prisma.emailVerification.deleteMany({
      where: {
        userId,
        verified: false,
      },
    });

    // Create new verification record
    await this.prisma.emailVerification.create({
      data: {
        userId,
        email: normalizedEmail,
        code,
        expiresAt,
        verified: false,
      },
    });

    // Record request for rate limiting
    this.recordVerificationRequest(userId);

    this.logger.log(
      `Created verification code for user ${userId}, email ${normalizedEmail}, expires at ${expiresAt.toISOString()}`,
    );

    return { success: true, code, expiresAt };
  }

  /**
   * Verify a verification code for a user
   *
   * @param userId User ID
   * @param code 4-digit verification code
   * @returns Success status and error message if failed
   */
  async verifyCode(
    userId: string,
    code: string,
  ): Promise<VerificationCheckResult> {
    // Find verification record
    const verification = await this.prisma.emailVerification.findFirst({
      where: {
        userId,
        code,
      },
    });

    if (!verification) {
      return {
        success: false,
        error: "Invalid verification code",
      };
    }

    // Check if already verified
    if (verification.verified) {
      return {
        success: false,
        error: "Code already used",
      };
    }

    // Check if expired
    if (verification.expiresAt < new Date()) {
      return {
        success: false,
        error: "Verification code expired",
      };
    }

    // Mark as verified
    await this.prisma.emailVerification.update({
      where: { id: verification.id },
      data: { verified: true },
    });

    // Update parent emailVerified status
    await this.prisma.parent.updateMany({
      where: { userId },
      data: { emailVerified: true, email: verification.email },
    });

    this.logger.log(
      `Successfully verified email for user ${userId}: ${verification.email}`,
    );

    return { success: true };
  }

  /**
   * Send verification email via SendPulse SMTP
   *
   * @param to Recipient email address
   * @param code 4-digit verification code
   * @returns true if sent successfully, false otherwise
   */
  async sendVerificationEmail(to: string, code: string): Promise<boolean> {
    // Wait for initialization to complete
    await this.sendPulseReady;

    if (!this.sendPulseInitialized) {
      this.logger.error(
        "SendPulse not initialized - cannot send verification email",
      );
      return false;
    }

    const fromEmail =
      process.env.SENDPULSE_FROM_EMAIL || "noreply@skilltree.ru";
    const fromName = process.env.SENDPULSE_FROM_NAME || "SkillTree";

    const email = {
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <style>
              body {
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
                line-height: 1.6;
                color: #333;
                max-width: 600px;
                margin: 0 auto;
                padding: 20px;
              }
              .header {
                text-align: center;
                padding: 20px 0;
                border-bottom: 2px solid #4CAF50;
              }
              .content {
                padding: 30px 0;
              }
              .code-box {
                background-color: #f5f5f5;
                border: 2px dashed #4CAF50;
                border-radius: 8px;
                padding: 20px;
                text-align: center;
                margin: 20px 0;
              }
              .code {
                font-size: 32px;
                font-weight: bold;
                color: #4CAF50;
                letter-spacing: 8px;
                font-family: 'Courier New', monospace;
              }
              .footer {
                text-align: center;
                padding: 20px 0;
                border-top: 1px solid #eee;
                color: #999;
                font-size: 12px;
              }
            </style>
          </head>
          <body>
            <div class="header">
              <h1>SkillTree - Подтверждение email</h1>
            </div>
            <div class="content">
              <p>Здравствуйте!</p>
              <p>Вы запросили подтверждение email адреса для платформы SkillTree.</p>
              <p>Ваш код подтверждения:</p>
              <div class="code-box">
                <div class="code">${code}</div>
              </div>
              <p><strong>Важно:</strong> Код действителен в течение 15 минут.</p>
              <p>Если вы не запрашивали этот код, просто проигнорируйте это письмо.</p>
            </div>
            <div class="footer">
              <p>SkillTree - Платформа профориентации для подростков</p>
              <p>Это автоматическое письмо, пожалуйста, не отвечайте на него.</p>
            </div>
          </body>
        </html>
      `,
      text: `SkillTree - Подтверждение email\n\nВаш код подтверждения: ${code}\n\nКод действителен в течение 15 минут.\n\nЕсли вы не запрашивали этот код, просто проигнорируйте это письмо.`,
      subject: "SkillTree - Код подтверждения email",
      from: {
        name: fromName,
        email: fromEmail,
      },
      to: [
        {
          name: "User",
          email: to,
        },
      ],
    };

    return new Promise((resolve) => {
      sendpulse.smtpSendMail((data: unknown) => {
        if (data && (data as { result?: boolean }).result === true) {
          this.logger.log(`Verification email sent successfully to ${to}`);
          resolve(true);
        } else {
          this.logger.error(
            `Failed to send verification email to ${to}: ${JSON.stringify(data)}`,
          );
          resolve(false);
        }
      }, email);
    });
  }

  /**
   * Clean up rate limit store periodically (remove old entries)
   * This method can be called by a cron job if needed
   */
  cleanupRateLimitStore(): void {
    const now = Date.now();
    const oneHourAgo = now - 60 * 60 * 1000;

    for (const [userId, timestamps] of this.rateLimitStore.entries()) {
      const recentTimestamps = timestamps.filter((ts) => ts > oneHourAgo);
      if (recentTimestamps.length === 0) {
        this.rateLimitStore.delete(userId);
      } else {
        this.rateLimitStore.set(userId, recentTimestamps);
      }
    }

    this.logger.debug("Rate limit store cleaned up");
  }

  /**
   * Generate a text-based progress bar for plain text emails
   * @param percentage Value from 0-100
   * @returns String like "████████░░" (8 filled, 2 empty for 80%)
   */
  private generateTextProgressBar(percentage: number): string {
    const barLength = 20;
    const filled = Math.round((percentage / 100) * barLength);
    const empty = barLength - filled;
    return "█".repeat(filled) + "░".repeat(empty);
  }

  /**
   * Format date to Russian locale string (DD.MM.YYYY)
   * @param date Date to format
   * @returns Formatted date string
   */
  private formatDate(date: Date): string {
    return new Intl.DateTimeFormat("ru-RU", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    }).format(date);
  }

  /**
   * Load and populate email template with data
   * @param templateName Template file name (without extension)
   * @param data Data to populate template with
   * @param isHtml Whether this is HTML or text template
   * @returns Populated template string
   */
  private async loadTemplate(
    templateName: string,
    data: ParentReportData,
    isHtml: boolean,
  ): Promise<string> {
    const extension = isHtml ? "html" : "txt";
    const templatePath = path.join(
      __dirname,
      "templates",
      `${templateName}.${extension}`,
    );

    let template = await fs.readFile(templatePath, "utf-8");

    // Format date
    const formattedDate = this.formatDate(data.testDate);

    // Replace placeholders
    const replacements: Record<string, string> = {
      "{{parentName}}": data.parentName,
      "{{studentName}}": data.studentName,
      "{{testDate}}": formattedDate,
      "{{hollandCode}}": data.hollandCode,
      "{{archetypeName}}": data.archetype.name,
      "{{archetypeEmoji}}": data.archetype.emoji,
      "{{archetypeDescription}}": data.archetype.description,
      "{{riasecR}}": Math.round(data.riasecScores.R).toString(),
      "{{riasecI}}": Math.round(data.riasecScores.I).toString(),
      "{{riasecA}}": Math.round(data.riasecScores.A).toString(),
      "{{riasecS}}": Math.round(data.riasecScores.S).toString(),
      "{{riasecE}}": Math.round(data.riasecScores.E).toString(),
      "{{riasecC}}": Math.round(data.riasecScores.C).toString(),
    };

    // Add text progress bars for plain text template
    if (!isHtml) {
      replacements["{{riasecRBar}}"] = this.generateTextProgressBar(
        data.riasecScores.R,
      );
      replacements["{{riasecIBar}}"] = this.generateTextProgressBar(
        data.riasecScores.I,
      );
      replacements["{{riasecABar}}"] = this.generateTextProgressBar(
        data.riasecScores.A,
      );
      replacements["{{riasecSBar}}"] = this.generateTextProgressBar(
        data.riasecScores.S,
      );
      replacements["{{riasecEBar}}"] = this.generateTextProgressBar(
        data.riasecScores.E,
      );
      replacements["{{riasecCBar}}"] = this.generateTextProgressBar(
        data.riasecScores.C,
      );
    }

    // Add top 3 careers (pad with empty values if less than 3)
    for (let i = 0; i < 3; i++) {
      const career = data.topCareers[i];
      const index = i + 1;

      if (career) {
        replacements[`{{career${index}Title}}`] = career.title;
        replacements[`{{career${index}Description}}`] = career.description;
        replacements[`{{career${index}Match}}`] = Math.round(
          career.matchPercentage,
        ).toString();
      } else {
        // Fallback for missing careers
        replacements[`{{career${index}Title}}`] = "Нет данных";
        replacements[`{{career${index}Description}}`] =
          "Дополнительные профессии не определены.";
        replacements[`{{career${index}Match}}`] = "0";
      }
    }

    // Replace all placeholders
    for (const [placeholder, value] of Object.entries(replacements)) {
      template = template.replace(new RegExp(placeholder, "g"), value);
    }

    return template;
  }

  /**
   * Send parent report email via SendPulse SMTP
   *
   * @param to Recipient email address
   * @param data Report data
   * @returns true if sent successfully, false otherwise
   */
  async sendParentReport(to: string, data: ParentReportData): Promise<boolean> {
    // Wait for initialization to complete
    await this.sendPulseReady;

    if (!this.sendPulseInitialized) {
      this.logger.error(
        "SendPulse not initialized - cannot send parent report",
      );
      return false;
    }

    try {
      const fromEmail =
        process.env.SENDPULSE_FROM_EMAIL || "noreply@skilltree.ru";
      const fromName = process.env.SENDPULSE_FROM_NAME || "SkillTree";

      // Load and populate templates
      const htmlContent = await this.loadTemplate("parent-report", data, true);
      const textContent = await this.loadTemplate("parent-report", data, false);

      const email = {
        html: htmlContent,
        text: textContent,
        subject: `Результаты профориентационного теста — ${data.studentName}`,
        from: {
          name: fromName,
          email: fromEmail,
        },
        to: [
          {
            name: data.parentName,
            email: to,
          },
        ],
      };

      return new Promise((resolve) => {
        sendpulse.smtpSendMail((response: unknown) => {
          if (response && (response as { result?: boolean }).result === true) {
            this.logger.log(
              `Parent report email sent successfully to ${to} for student ${data.studentName}`,
            );
            resolve(true);
          } else {
            this.logger.error(
              `Failed to send parent report email to ${to}: ${JSON.stringify(response)}`,
            );
            resolve(false);
          }
        }, email);
      });
    } catch (error) {
      this.logger.error(
        `Error sending parent report email to ${to}: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      return false;
    }
  }
}
