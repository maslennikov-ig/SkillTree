#!/bin/bash

################################################################################
# SkillTree Disk Space Monitoring Script
# Monitors disk usage and sends Telegram alerts when threshold is exceeded
#
# Usage: /opt/skilltree/scripts/check-disk-space.sh
# Logs: /opt/skilltree/logs/disk-check-YYYYMMDD-HHMMSS.log
#
# Features:
# - Check disk usage on root partition (/)
# - Send Telegram alert if usage exceeds threshold (default: 80%)
# - Log all checks for audit trail
# - Environment variables: TELEGRAM_BOT_TOKEN, ADMIN_CHAT_ID
#
# Installation (crontab for hourly checks):
# crontab -e
# Add line: 0 * * * * /opt/skilltree/scripts/check-disk-space.sh
################################################################################

set -e  # Exit immediately on error

# =============================================================================
# Configuration
# =============================================================================

THRESHOLD=80  # Disk usage percentage threshold for alerts
LOGS_DIR="/opt/skilltree/logs"
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
ADMIN_CHAT_ID="${ADMIN_CHAT_ID:-}"

# Create logs directory if it doesn't exist
mkdir -p "$LOGS_DIR"

# Set up log file
LOG_FILE="$LOGS_DIR/disk-check-$(date +%Y%m%d-%H%M%S).log"

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
# Telegram Alert Function
# =============================================================================

send_telegram_alert() {
  local usage=$1
  local partition=$2
  local available=$3
  local used=$4
  local total=$5

  if [ -z "$TELEGRAM_BOT_TOKEN" ] || [ -z "$ADMIN_CHAT_ID" ]; then
    log "⚠️  Telegram credentials not set (TELEGRAM_BOT_TOKEN or ADMIN_CHAT_ID) - skipping alert"
    return 0
  fi

  local message="<b>⚠️ Disk Space Warning</b>

<b>Partition:</b> ${partition}
<b>Usage:</b> ${usage}%
<b>Used:</b> ${used} / ${total}
<b>Available:</b> ${available}
<b>Time:</b> $(date -Iseconds)

Disk usage is above ${THRESHOLD}%. Consider cleaning up old logs or backups."

  # Send via Telegram Bot API with retry logic
  local max_attempts=3
  local attempt=1

  while [ $attempt -le $max_attempts ]; do
    response=$(curl -s -w "\n%{http_code}" -X POST \
      "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
      -d chat_id="${ADMIN_CHAT_ID}" \
      -d parse_mode="HTML" \
      -d text="${message}" 2>/dev/null || echo "error")

    if [ $? -eq 0 ]; then
      http_code=$(echo "$response" | tail -n 1)
      body=$(echo "$response" | sed '$d')

      if [ "$http_code" = "200" ]; then
        log "✅ Telegram alert sent successfully (attempt $attempt/$max_attempts)"
        return 0
      else
        log "⚠️  Telegram API returned HTTP $http_code (attempt $attempt/$max_attempts)"
        log "Response: $body"
      fi
    else
      log "⚠️  Telegram request failed (attempt $attempt/$max_attempts)"
    fi

    if [ $attempt -lt $max_attempts ]; then
      sleep 2
    fi

    attempt=$((attempt + 1))
  done

  log_error "Failed to send Telegram alert after $max_attempts attempts"
  return 1
}

# =============================================================================
# Main Disk Space Check
# =============================================================================

log_section "Disk Space Check Started"

# Get disk usage for root partition
# Format: Filesystem Size Used Avail Use% Mounted
disk_info=$(df -h / | tail -n 1)
usage_percent=$(echo "$disk_info" | awk '{print $5}' | sed 's/%//')
available=$(echo "$disk_info" | awk '{print $4}')
used=$(echo "$disk_info" | awk '{print $3}')
total=$(echo "$disk_info" | awk '{print $2}')
partition=$(echo "$disk_info" | awk '{print $6}')

log "Partition: $partition"
log "Total: $total"
log "Used: $used"
log "Available: $available"
log "Usage: ${usage_percent}%"

# Check if usage exceeds threshold
if [ "$usage_percent" -gt "$THRESHOLD" ]; then
  log_section "Threshold Exceeded - Sending Alert"
  log "⚠️  Disk usage ${usage_percent}% exceeds threshold ${THRESHOLD}%"

  if send_telegram_alert "$usage_percent" "$partition" "$available" "$used" "$total"; then
    log "✅ Alert notification sent successfully"
  else
    log_error "Failed to send alert notification"
  fi

  log_section "Disk Usage Recommendations"
  log "Consider the following cleanup actions:"
  log "1. Clean old log files: find /opt/skilltree/logs -name '*.log' -mtime +30 -delete"
  log "2. Clean old backups: find /opt/skilltree/backups -name '*.tar.gz' -mtime +90 -delete"
  log "3. Clean PM2 logs: pm2 flush"
  log "4. Clean package manager cache: pnpm store prune"
  log "5. Check Docker if installed: docker system prune -a"

else
  log "✅ Disk usage OK: ${usage_percent}% (threshold: ${THRESHOLD}%)"
fi

log_section "Check Completed"
log "Log file: $LOG_FILE"

exit 0
