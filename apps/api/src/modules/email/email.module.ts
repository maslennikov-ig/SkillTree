import { Module } from "@nestjs/common";
import { EmailController } from "./email.controller";
import { EmailService } from "./email.service";

/**
 * Email module providing SendPulse integration and email verification
 *
 * Features:
 * - SendPulse SMTP email sending (12K free emails/month)
 * - Email verification with 4-digit codes
 * - Rate limiting (max 3 requests per hour per user)
 * - Code expiration (15 minutes)
 * - Parent email verification status management
 *
 * Environment Variables Required:
 * - SENDPULSE_API_USER_ID: SendPulse API user ID
 * - SENDPULSE_API_SECRET: SendPulse API secret
 * - SENDPULSE_FROM_EMAIL: Sender email (default: noreply@skilltree.ru)
 * - SENDPULSE_FROM_NAME: Sender name (default: SkillTree)
 *
 * Controllers:
 * - EmailController: REST API endpoints for email verification
 *
 * Exports:
 * - EmailService: For use in other modules (e.g., parent verification flow)
 */
@Module({
  controllers: [EmailController],
  providers: [EmailService],
  exports: [EmailService],
})
export class EmailModule {}
