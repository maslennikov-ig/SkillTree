#!/bin/bash

################################################################################
# SkillTree Manual Rollback Script
# Allows manual rollback to a specific commit with full rebuild and PM2 reload
#
# Usage: /opt/skilltree/scripts/rollback.sh <COMMIT_SHA>
# Example: /opt/skilltree/scripts/rollback.sh abc1234
#
# Features:
# - Reset repository to specified commit
# - Rebuild all packages
# - Reload PM2 services
# - Verify health endpoint
# - Detailed logging
################################################################################

set -e  # Exit immediately on error

# =============================================================================
# Argument Validation
# =============================================================================

if [ $# -ne 1 ]; then
  echo "Usage: $0 <COMMIT_SHA>"
  echo "Example: $0 abc1234"
  echo ""
  echo "This script will rollback the deployment to the specified commit."
  echo "The commit SHA can be abbreviated (first 7 characters)."
  exit 1
fi

ROLLBACK_COMMIT="$1"

# =============================================================================
# Configuration
# =============================================================================

REPO_DIR="/opt/skilltree/repa-maks"
LOGS_DIR="/opt/skilltree/logs"
HEALTH_URL="https://api.skilltree.app/health"
HEALTH_TIMEOUT=10  # seconds

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Set up log file
LOG_FILE="$LOGS_DIR/rollback-$(date +%Y%m%d-%H%M%S).log"

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
# Main Rollback
# =============================================================================

log_section "Manual Rollback Started"
log "Repository: $REPO_DIR"
log "Target commit: $ROLLBACK_COMMIT"
log "Log file: $LOG_FILE"

cd "$REPO_DIR" || {
  log_error "Failed to change directory to $REPO_DIR"
  exit 1
}

# Get current commit
CURRENT_COMMIT=$(git rev-parse HEAD)
log "Current commit: $CURRENT_COMMIT"

# =============================================================================
# Step 1: Validate Commit
# =============================================================================

log_section "Validating Target Commit"

# Try to get full commit SHA
if ! FULL_COMMIT=$(git rev-parse "$ROLLBACK_COMMIT" 2>/dev/null); then
  log_error "Invalid commit SHA: $ROLLBACK_COMMIT"
  log "Run 'git log --oneline' to see available commits"
  exit 1
fi

log "✅ Target commit is valid: $FULL_COMMIT"

# Get commit info
COMMIT_MESSAGE=$(git log -1 --pretty=%B "$FULL_COMMIT" 2>/dev/null || echo "unknown")
COMMIT_AUTHOR=$(git log -1 --pretty=%an "$FULL_COMMIT" 2>/dev/null || echo "unknown")
COMMIT_DATE=$(git log -1 --pretty=%ai "$FULL_COMMIT" 2>/dev/null || echo "unknown")

log "Commit author: $COMMIT_AUTHOR"
log "Commit date: $COMMIT_DATE"
log "Commit message: $COMMIT_MESSAGE"

if [ "$CURRENT_COMMIT" = "$FULL_COMMIT" ]; then
  log "ℹ️  Already at target commit. No rollback necessary."
  exit 0
fi

# Confirm rollback
echo ""
log "⚠️  WARNING: This will reset to the above commit and reload all services."
log "Current unsaved changes will be lost."
echo ""
read -p "Do you want to proceed with rollback? (yes/no): " -r
echo ""

if [[ ! $REPLY =~ ^[Yy][Ee][Ss]$ ]]; then
  log "Rollback cancelled"
  exit 0
fi

# =============================================================================
# Step 2: Reset to Target Commit
# =============================================================================

log_section "Resetting to Target Commit"

if ! git reset --hard "$FULL_COMMIT" >> "$LOG_FILE" 2>&1; then
  log_error "Failed to reset to commit $FULL_COMMIT"
  exit 1
fi

log "✅ Repository reset to commit $FULL_COMMIT"

# =============================================================================
# Step 3: Install Dependencies
# =============================================================================

log_section "Installing Dependencies"

if ! pnpm install --frozen-lockfile >> "$LOG_FILE" 2>&1; then
  log_error "Failed to install dependencies"
  exit 1
fi

log "✅ Dependencies installed successfully"

# =============================================================================
# Step 4: Rebuild All Packages
# =============================================================================

log_section "Rebuilding All Packages"

if ! pnpm build >> "$LOG_FILE" 2>&1; then
  log_error "Build failed"
  exit 1
fi

log "✅ Build completed successfully"

# =============================================================================
# Step 5: Run Database Migrations
# =============================================================================

log_section "Running Database Migrations"

if ! cd "$REPO_DIR/packages/database" && pnpm prisma migrate deploy >> "$LOG_FILE" 2>&1; then
  log "⚠️  Database migration step (may not be necessary for older commits)"
  cd "$REPO_DIR"
else
  cd "$REPO_DIR"
  log "✅ Database migrations applied"
fi

# =============================================================================
# Step 6: Reload PM2
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
# Step 7: Health Check Verification
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
  log_section "Rollback Successful"
  log "✅ Rollback completed successfully!"
  log "Now running commit: $FULL_COMMIT"
  log "Services are healthy and operational."
  exit 0
else
  log_error "Health check failed after rollback!"
  log "Services may not be operational. Check logs at $LOG_FILE"
  exit 1
fi
