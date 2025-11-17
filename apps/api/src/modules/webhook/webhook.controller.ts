import {
  Controller,
  Post,
  Body,
  UnauthorizedException,
  Logger,
  Req,
} from "@nestjs/common";
import * as crypto from "crypto";
import { Request } from "express";
import { exec } from "child_process";
import { promisify } from "util";
import { telegramNotifier } from "../../common/telegram-notifier";

const execAsync = promisify(exec);

interface GitHubWebhookPayload {
  ref: string;
  repository?: {
    full_name: string;
  };
  pusher?: {
    name: string;
  };
  head_commit?: {
    id: string;
    message: string;
  };
}

/**
 * Webhook controller for GitHub push events
 * Handles automatic deployments triggered by GitHub webhooks
 */
@Controller("webhook")
export class WebhookController {
  private readonly logger = new Logger(WebhookController.name);

  /**
   * POST /webhook/deploy
   * GitHub webhook endpoint for automatic deployment
   *
   * Verifies GitHub signature, filters for main branch,
   * and triggers deployment script asynchronously
   */
  @Post("deploy")
  async handleDeploy(
    @Req() request: Request,
    @Body() payload: GitHubWebhookPayload,
  ): Promise<{ message: string }> {
    // Extract signature from headers
    const signature = request.headers["x-hub-signature-256"] as string;
    // Verify GitHub signature
    this.verifyGitHubSignature(signature, payload);

    // Log webhook received
    this.logger.log(
      `GitHub webhook received from repository: ${payload.repository?.full_name}`,
    );

    // Filter for main branch only
    if (payload.ref !== "refs/heads/main") {
      this.logger.debug(
        `Ignoring push to branch: ${payload.ref} (not main branch)`,
      );
      return {
        message: `Ignored: push to ${payload.ref} (main branch only)`,
      };
    }

    // Log the commit being deployed
    const commitId = payload.head_commit?.id || "unknown";
    const commitMessage = payload.head_commit?.message || "no message";
    this.logger.log(`Deploying commit ${commitId}: ${commitMessage}`);

    // Trigger deployment script asynchronously (non-blocking)
    this.triggerDeployment();

    return {
      message: "Deployment triggered successfully",
    };
  }

  /**
   * Verify GitHub webhook signature using HMAC SHA-256
   * Prevents unauthorized deployment triggers
   *
   * @private
   */
  private verifyGitHubSignature(
    signature: string,
    payload: GitHubWebhookPayload,
  ): void {
    const secret = process.env.GITHUB_WEBHOOK_SECRET;

    if (!secret) {
      this.logger.warn(
        "GITHUB_WEBHOOK_SECRET not configured, skipping signature verification",
      );
      return;
    }

    if (!signature) {
      throw new UnauthorizedException("Missing x-hub-signature-256 header");
    }

    // Compute expected signature
    const hash =
      "sha256=" +
      crypto
        .createHmac("sha256", secret)
        .update(JSON.stringify(payload))
        .digest("hex");

    // Constant-time comparison to prevent timing attacks
    if (!crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(hash))) {
      this.logger.warn("GitHub webhook signature verification failed");
      throw new UnauthorizedException("Invalid webhook signature");
    }

    this.logger.debug("GitHub webhook signature verified successfully");
  }

  /**
   * Trigger deployment script asynchronously
   * Runs /opt/skilltree/scripts/deploy.sh without blocking the response
   *
   * @private
   */
  private async triggerDeployment(): Promise<void> {
    const deployScript = "/opt/skilltree/scripts/deploy.sh";

    // Schedule deployment without awaiting (fire and forget)
    setImmediate(async () => {
      try {
        this.logger.log(`Starting deployment with script: ${deployScript}`);
        const { stdout, stderr } = await execAsync(deployScript, {
          timeout: 5 * 60 * 1000, // 5 minute timeout
          maxBuffer: 10 * 1024 * 1024, // 10MB buffer for logs
        });

        if (stdout) {
          this.logger.log(`Deployment script output:\n${stdout}`);
        }

        if (stderr) {
          this.logger.warn(`Deployment script warnings:\n${stderr}`);
        }

        this.logger.log("Deployment completed successfully");
      } catch (error) {
        this.logger.error(
          `Deployment script failed: ${error instanceof Error ? error.message : "Unknown error"}`,
          error instanceof Error ? error.stack : undefined,
        );

        // Send Telegram notification on deployment failure
        try {
          const message = telegramNotifier.formatDeploymentFailure(
            error instanceof Error ? error.message : String(error),
          );
          await telegramNotifier.sendAlert(message);
        } catch (notificationError) {
          this.logger.error(
            `Failed to send Telegram notification: ${
              notificationError instanceof Error
                ? notificationError.message
                : "Unknown error"
            }`,
          );
        }
      }
    });
  }
}
