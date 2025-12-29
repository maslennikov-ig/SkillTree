import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
  Logger,
} from "@nestjs/common";
import { EmailService } from "./email.service";

interface SendVerificationDto {
  userId: string;
  email: string;
}

interface ConfirmVerificationDto {
  userId: string;
  code: string;
}

interface SendVerificationResponse {
  success: boolean;
  message: string;
  expiresAt: Date;
}

interface ConfirmVerificationResponse {
  success: boolean;
  message: string;
}

/**
 * Email verification controller
 *
 * Endpoints:
 * - POST /email/verify - Send verification code to email
 * - POST /email/confirm - Confirm verification code
 *
 * Security:
 * - Rate limiting: max 3 verification requests per hour per user
 * - Code expiration: 15 minutes
 * - Single-use codes (marked as verified after use)
 */
@Controller("email")
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(private readonly emailService: EmailService) {}

  /**
   * Send verification code to email
   *
   * POST /email/verify
   * Body: { userId: string, email: string }
   *
   * Creates verification code, stores in database, and sends email via SendPulse
   *
   * @param body Request body with userId and email
   * @returns Success status, message, and expiration date
   */
  @Post("verify")
  @HttpCode(HttpStatus.OK)
  async sendVerification(
    @Body() body: SendVerificationDto,
  ): Promise<SendVerificationResponse> {
    const { userId, email } = body;

    // Validate input
    if (!userId || !email) {
      throw new BadRequestException("userId and email are required");
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new BadRequestException("Invalid email format");
    }

    try {
      // Create verification record
      const result = await this.emailService.createVerification(userId, email);

      // Check if validation failed
      if (!result.success) {
        throw new BadRequestException(result.message || "Invalid email format");
      }

      // Send verification email
      const emailSent = await this.emailService.sendVerificationEmail(
        email,
        result.code!,
      );

      if (!emailSent) {
        this.logger.error(`Failed to send verification email to ${email}`);
        throw new BadRequestException(
          "Failed to send verification email. Please try again later.",
        );
      }

      this.logger.log(`Verification email sent to ${email} for user ${userId}`);

      return {
        success: true,
        message: "Verification code sent to your email",
        expiresAt: result.expiresAt!,
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(
        `Error sending verification email: ${errorMessage}`,
        errorStack,
      );

      // Re-throw BadRequestException (from rate limiting)
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException(
        "Failed to send verification code. Please try again.",
      );
    }
  }

  /**
   * Confirm verification code
   *
   * POST /email/confirm
   * Body: { userId: string, code: string }
   *
   * Verifies the code and updates parent emailVerified status
   *
   * @param body Request body with userId and code
   * @returns Success status and message
   */
  @Post("confirm")
  @HttpCode(HttpStatus.OK)
  async confirmVerification(
    @Body() body: ConfirmVerificationDto,
  ): Promise<ConfirmVerificationResponse> {
    const { userId, code } = body;

    // Validate input
    if (!userId || !code) {
      throw new BadRequestException("userId and code are required");
    }

    // Validate code format (4 digits)
    if (!/^\d{4}$/.test(code)) {
      throw new BadRequestException("Code must be 4 digits");
    }

    try {
      // Verify code
      const result = await this.emailService.verifyCode(userId, code);

      if (!result.success) {
        this.logger.warn(
          `Failed verification attempt for user ${userId}: ${result.error}`,
        );
        throw new BadRequestException(result.error);
      }

      this.logger.log(`Email verified successfully for user ${userId}`);

      return {
        success: true,
        message: "Email verified successfully",
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : "Unknown error";
      const errorStack = error instanceof Error ? error.stack : undefined;

      this.logger.error(`Error verifying code: ${errorMessage}`, errorStack);

      // Re-throw BadRequestException
      if (error instanceof BadRequestException) {
        throw error;
      }

      // Generic error
      throw new BadRequestException("Failed to verify code. Please try again.");
    }
  }
}
