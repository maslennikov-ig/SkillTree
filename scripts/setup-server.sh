#!/bin/bash

###############################################################################
# SkillTree VDS Server Provisioning Script
#
# Purpose: Automated setup of Ubuntu 22.04 VDS server with Node.js, Redis,
#          Caddy, security hardening, and application infrastructure
#
# Usage:
#   sudo bash setup-server.sh
#
# Prerequisites:
#   - Fresh Ubuntu 22.04 LTS server
#   - Root or sudo privileges
#   - Internet connectivity
#
# What this script does:
#   1. Installs Node.js 18.x LTS, pnpm, PM2
#   2. Installs and configures Redis 7.x (localhost, password auth)
#   3. Installs Caddy 2.x reverse proxy
#   4. Configures UFW firewall (SSH, HTTP, HTTPS only)
#   5. Hardens SSH (disable password auth, pubkey only)
#   6. Installs and configures fail2ban
#   7. Creates application directory structure
#
###############################################################################

set -e  # Exit immediately if any command fails
set -u  # Exit on undefined variable
set -o pipefail  # Catch errors in pipes

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Logging function with timestamp
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')]${NC} $1"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR:${NC} $1" >&2
}

warning() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING:${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    error "This script must be run as root (use sudo)"
    exit 1
fi

log "Starting SkillTree VDS server provisioning..."

###############################################################################
# 1. SYSTEM UPDATE
###############################################################################

log "Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq
log "System packages updated successfully"

###############################################################################
# 2. NODE.JS INSTALLATION (T061)
###############################################################################

log "Installing Node.js 18.x LTS..."

# Remove old Node.js versions if present
apt-get remove -y nodejs npm || true

# Install Node.js 18.x via NodeSource repository
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Verify installation
NODE_VERSION=$(node --version)
NPM_VERSION=$(npm --version)
log "Node.js installed: $NODE_VERSION"
log "npm installed: $NPM_VERSION"

###############################################################################
# 3. PNPM AND PM2 INSTALLATION (T062)
###############################################################################

log "Installing pnpm and PM2 globally..."

# Install pnpm and PM2
npm install -g pnpm pm2

# Verify installation
PNPM_VERSION=$(pnpm --version)
PM2_VERSION=$(pm2 --version)
log "pnpm installed: $PNPM_VERSION"
log "PM2 installed: $PM2_VERSION"

###############################################################################
# 4. REDIS INSTALLATION (T063)
###############################################################################

log "Installing Redis 7.x..."

# Install Redis from official Ubuntu repository
apt-get install -y redis-server

# Verify installation
REDIS_VERSION=$(redis-server --version | head -n1)
log "Redis installed: $REDIS_VERSION"

###############################################################################
# 5. REDIS CONFIGURATION (T064, T065)
###############################################################################

log "Configuring Redis for localhost-only access with password authentication..."

# Backup original config
cp /etc/redis/redis.conf /etc/redis/redis.conf.backup

# Bind to localhost only (security: only local apps can access)
sed -i 's/^bind .*/bind 127.0.0.1 ::1/' /etc/redis/redis.conf

# Require password authentication
sed -i 's/^# requirepass foobared/requirepass skilltree_redis_2024/' /etc/redis/redis.conf
# Also handle cases where requirepass is not commented
if ! grep -q "^requirepass" /etc/redis/redis.conf; then
    echo "requirepass skilltree_redis_2024" >> /etc/redis/redis.conf
fi

# Enable Redis as systemd service
systemctl enable redis-server
systemctl restart redis-server

# Verify Redis is running
if systemctl is-active --quiet redis-server; then
    log "Redis service started successfully"
else
    error "Redis service failed to start"
    exit 1
fi

###############################################################################
# 6. CADDY INSTALLATION (T066)
###############################################################################

log "Installing Caddy 2.x reverse proxy..."

# Install dependencies for Caddy repository
apt-get install -y debian-keyring debian-archive-keyring apt-transport-https curl

# Add Caddy GPG key
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/gpg.key' | gpg --dearmor -o /usr/share/keyrings/caddy-stable-archive-keyring.gpg

# Add Caddy repository
curl -1sLf 'https://dl.cloudsmith.io/public/caddy/stable/debian.deb.txt' | tee /etc/apt/sources.list.d/caddy-stable.list

# Update package list and install Caddy
apt-get update -qq
apt-get install -y caddy

# Verify installation
CADDY_VERSION=$(caddy version | head -n1)
log "Caddy installed: $CADDY_VERSION"

###############################################################################
# 7. UFW FIREWALL SETUP (T067)
###############################################################################

log "Configuring UFW firewall..."

# Install UFW if not present
apt-get install -y ufw

# Reset UFW to default configuration (deny incoming, allow outgoing)
ufw --force reset

# Allow SSH (port 22) - CRITICAL: Don't lock yourself out!
ufw allow 22/tcp comment 'SSH'

# Allow HTTP (port 80) - Required for Let's Encrypt HTTP-01 challenge
ufw allow 80/tcp comment 'HTTP'

# Allow HTTPS (port 443) - Production traffic
ufw allow 443/tcp comment 'HTTPS'

# Enable firewall (--force skips confirmation prompt)
ufw --force enable

log "Firewall enabled with rules: SSH (22), HTTP (80), HTTPS (443)"

# Show firewall status
ufw status verbose

###############################################################################
# 8. SSH HARDENING (T067.5)
###############################################################################

log "Hardening SSH configuration..."

# Backup original SSH config
cp /etc/ssh/sshd_config /etc/ssh/sshd_config.backup

# Disable password authentication (require SSH keys only)
sed -i 's/^#*PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
sed -i 's/^#*PasswordAuthentication no/PasswordAuthentication no/' /etc/ssh/sshd_config

# Enable public key authentication
sed -i 's/^#*PubkeyAuthentication yes/PubkeyAuthentication yes/' /etc/ssh/sshd_config
sed -i 's/^#*PubkeyAuthentication no/PubkeyAuthentication yes/' /etc/ssh/sshd_config

# Disable root login via SSH (best practice)
sed -i 's/^#*PermitRootLogin yes/PermitRootLogin prohibit-password/' /etc/ssh/sshd_config

# Restart SSH service to apply changes
systemctl restart sshd

log "SSH hardened: password authentication disabled, pubkey authentication enabled"
warning "Ensure you have SSH key configured before logging out!"

###############################################################################
# 9. FAIL2BAN INSTALLATION AND CONFIGURATION (T082.5)
###############################################################################

log "Installing and configuring fail2ban..."

# Install fail2ban
apt-get install -y fail2ban

# Create custom SSH jail configuration
cat > /etc/fail2ban/jail.local <<'EOF'
[DEFAULT]
# Ban for 10 minutes (600 seconds)
bantime = 600

# Allow 3 retries before ban
maxretry = 3

# Check for failures in last 10 minutes
findtime = 600

[sshd]
enabled = true
port = ssh
logpath = %(sshd_log)s
backend = systemd
maxretry = 3
bantime = 600
EOF

# Enable and start fail2ban service
systemctl enable fail2ban
systemctl restart fail2ban

log "fail2ban configured for SSH protection (maxretry=3, bantime=600s)"

# Show fail2ban status
fail2ban-client status sshd || log "fail2ban SSH jail active"

###############################################################################
# 10. APPLICATION DIRECTORY STRUCTURE (T068)
###############################################################################

log "Creating application directory structure..."

# Create main application directory with subdirectories
mkdir -p /opt/skilltree/logs
mkdir -p /opt/skilltree/backups
mkdir -p /opt/skilltree/scripts

# Set proper permissions (adjust user:group as needed for your deployment user)
# For now, root owns these directories - change to app user in production
chmod 755 /opt/skilltree
chmod 755 /opt/skilltree/logs
chmod 755 /opt/skilltree/backups
chmod 755 /opt/skilltree/scripts

log "Application directories created at /opt/skilltree/{logs,backups,scripts}"

###############################################################################
# COMPLETION SUMMARY
###############################################################################

echo ""
log "========================================="
log "VDS Server Provisioning Complete!"
log "========================================="
echo ""
log "Installed Software:"
log "  - Node.js: $NODE_VERSION"
log "  - pnpm: $PNPM_VERSION"
log "  - PM2: $PM2_VERSION"
log "  - Redis: $REDIS_VERSION (localhost:6379)"
log "  - Caddy: $CADDY_VERSION"
echo ""
log "Security Configuration:"
log "  - UFW Firewall: Active (SSH, HTTP, HTTPS only)"
log "  - SSH: Password auth disabled, pubkey only"
log "  - fail2ban: Active (SSH jail configured)"
echo ""
log "Application Structure:"
log "  - /opt/skilltree/logs (deployment logs)"
log "  - /opt/skilltree/backups (database backups)"
log "  - /opt/skilltree/scripts (deployment scripts)"
echo ""
log "Redis Configuration:"
log "  - Password: skilltree_redis_2024"
log "  - Bind: localhost only (127.0.0.1)"
echo ""
warning "IMPORTANT: Next Steps"
echo "  1. Clone application repository to /opt/skilltree/"
echo "  2. Configure Caddyfile at /etc/caddy/Caddyfile (see scripts/Caddyfile)"
echo "  3. Create .env file with production credentials (REDIS_PASSWORD=skilltree_redis_2024)"
echo "  4. Install app dependencies: pnpm install --frozen-lockfile"
echo "  5. Build application: pnpm build"
echo "  6. Start PM2 services: pm2 start ecosystem.config.js"
echo "  7. Configure PM2 startup: pm2 startup systemd && pm2 save"
echo "  8. Reload Caddy: systemctl reload caddy"
echo ""
log "Provisioning script completed successfully!"
