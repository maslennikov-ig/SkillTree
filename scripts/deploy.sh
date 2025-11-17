#!/bin/bash

################################################################################
# SkillTree Deployment Script
# Automated deployment pipeline with zero-downtime restarts and automatic rollback
#
# Usage: /opt/skilltree/scripts/deploy.sh
# Logs: /opt/skilltree/logs/deploy-YYYYMMDD-HHMMSS.log
#
# Features:
# - Git pull latest changes from main branch
# - Install dependencies with frozen lockfile
# - Build all packages
# - Run database migrations
# - Reload PM2 with zero-downtime
# - Verify health endpoint
# - Automatic rollback on failure
################################################################################

set -e  # Exit immediately on error

# =============================================================================
# Configuration
# =============================================================================

REPO_DIR="/opt/skilltree/repa-maks"
SCRIPTS_DIR="/opt/skilltree/scripts"
LOGS_DIR="/opt/skilltree/logs"
HEALTH_URL="https://api.skilltree.app/health"
HEALTH_TIMEOUT=10  # seconds
DEPLOY_TIMEOUT=300  # 5 minutes

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Set up log file
LOG_FILE="$LOGS_DIR/deploy-$(date +%Y%m%d-%H%M%S).log"

# =============================================================================
# Helper Functions
# =============================================================================

log() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log_error() {
  echo "[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1" | tee -a "$LOG_FILE" >&2
}

log_section() {
  echo "" | tee -a "$LOG_FILE"
  log "==== $1 ===="
  echo "" | tee -a "$LOG_FILE"
}

# =============================================================================
# Main Deployment
# =============================================================================

log_section "Deployment Started"
log "Repository: $REPO_DIR"
log "Log file: $LOG_FILE"

cd "$REPO_DIR" || {
  log_error "Failed to change directory to $REPO_DIR"
  exit 1
}

# Save current commit for rollback
PREVIOUS_COMMIT=$(git rev-parse HEAD)
log "Current commit: $PREVIOUS_COMMIT"

# Get commit message for notification
COMMIT_MESSAGE=$(git log -1 --pretty=%B "$PREVIOUS_COMMIT" 2>/dev/null || echo "unknown")

# =============================================================================
# Step 1: Pull Latest Changes
# =============================================================================

log_section "Pulling Latest Changes"
if ! git pull origin main >> "$LOG_FILE" 2>&1; then
  log_error "Failed to pull latest changes"
  exit 1
fi
log "✅ Latest changes pulled successfully"

# Get new commit after pull
NEW_COMMIT=$(git rev-parse HEAD)
if [ "$PREVIOUS_COMMIT" = "$NEW_COMMIT" ]; then
  log "No new commits to deploy"
else
  log "Deploying new commit: $NEW_COMMIT"
fi

# =============================================================================
# Step 2: Install Dependencies
# =============================================================================

log_section "Installing Dependencies"
if ! pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1; then
  log_error "Failed to install dependencies"
  exit 1
fi
log "✅ Dependencies installed successfully"

# =============================================================================
# Step 3: Build All Packages
# =============================================================================

log_section "Building All Packages"
if ! pnpm build >> "$LOG_FILE" 2>&1; then
  log_error "Build failed"
  exit 1
fi
log "✅ Build completed successfully"

# =============================================================================
# Step 4: Run Database Migrations
# =============================================================================

log_section "Running Database Migrations"
if ! cd "$REPO_DIR/packages/database" && pnpm prisma migrate deploy >> "$LOG_FILE" 2>&1; then
  log_error "Database migrations failed"
  cd "$REPO_DIR"
  exit 1
fi
cd "$REPO_DIR"
log "✅ Database migrations completed successfully"

# =============================================================================
# Step 5: Reload PM2 (Zero-Downtime Restart)
# =============================================================================

log_section "Reloading PM2 Processes"
if ! pm2 reload ecosystem.config.js >> "$LOG_FILE" 2>&1; then
  log_error "PM2 reload failed"
  exit 1
fi
log "✅ PM2 processes reloaded successfully"

# Wait for services to be ready
log "Waiting for services to become ready..."
sleep 5

# =============================================================================
# Step 6: Health Check Verification
# =============================================================================

log_section "Verifying Health Status"

# Function to check health
check_health() {
  local max_attempts=5
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    response=$(curl -s -w "\n%{http_code}" -m "$HEALTH_TIMEOUT" "$HEALTH_URL" 2>/dev/null || echo "error")

    if [ $? -eq 0 ]; then
      http_code=$(echo "$response" | tail -n 1)
      body=$(echo "$response" | sed '$d')

      if [ "$http_code" = "200" ]; then
        log "✅ Health check passed (attempt $attempt/$max_attempts)"
        log "Response: $body"
        return 0
      else
        log "⚠️  Health check returned HTTP $http_code (attempt $attempt/$max_attempts)"
      fi
    else
      log "⚠️  Health check request failed (attempt $attempt/$max_attempts)"
    fi

    if [ $attempt -lt $max_attempts ]; then
      sleep 3
    fi

    attempt=$((attempt + 1))
  done

  return 1
}

# Try health check
if check_health; then
  log_section "Deployment Successful"
  log "✅ All systems healthy. Deployment completed successfully!"
  exit 0
else
  log_error "Health check failed. Initiating automatic rollback..."

  # =============================================================================
  # Rollback on Health Check Failure
  # =============================================================================

  log_section "Rolling Back to Previous Commit"

  # Reset to previous commit
  if ! git reset --hard "$PREVIOUS_COMMIT" >> "$LOG_FILE" 2>&1; then
    log_error "CRITICAL: Failed to reset to previous commit. Manual intervention required!"
    exit 1
  fi
  log "⚠️ Reverted to commit $PREVIOUS_COMMIT"

  # Reinstall dependencies
  if ! pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1; then
    log_error "CRITICAL: Failed to reinstall dependencies during rollback"
    exit 1
  fi
  log "Reinstalled dependencies"

  # Rebuild
  if ! pnpm build >> "$LOG_FILE" 2>&1; then
    log_error "CRITICAL: Failed to rebuild during rollback"
    exit 1
  fi
  log "Rebuilt packages"

  # Reload PM2 again
  if ! pm2 reload ecosystem.config.js >> "$LOG_FILE" 2>&1; then
    log_error "CRITICAL: Failed to reload PM2 during rollback"
    exit 1
  fi
  log "Reloaded PM2"

  # Wait for services
  sleep 5

  # Verify rollback
  log_section "Verifying Rollback"

  if check_health; then
    log_section "Rollback Successful"
    log "✅ Rolled back successfully. Services restored to previous version."
    exit 1  # Exit with error code to indicate deployment failure
  else
    log_error "CRITICAL: Rollback verification failed. Manual intervention required!"
    log "Health check still failing. System may be in unstable state."
    log "Logs available at: $LOG_FILE"
    exit 1
  fi
fi
