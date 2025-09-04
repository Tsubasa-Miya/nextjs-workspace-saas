#!/usr/bin/env bash
set -euo pipefail

# One-command deploy to EC2 with pm2 and symlinked releases.
# Requirements (on your machine):
# - Node LTS, npm
# - ssh/scp available
# - Environment variables:
#   EC2_HOST            e.g., ec2-1-2-3-4.compute.amazonaws.com
#   EC2_USER            e.g., ubuntu or ec2-user
#   EC2_PATH            e.g., /var/www/saas
#   EC2_SSH_KEY         optional, path to private key file
#   EC2_SSH_PORT        optional, default 22
# Optional flags:
#   SKIP_BUILD=1        reuse previous local build and tarball

require() { if [[ -z "${!1:-}" ]]; then echo "Missing env $1" >&2; exit 1; fi; }
require EC2_HOST; require EC2_USER; require EC2_PATH;

SSH_PORT=${EC2_SSH_PORT:-22}
SSH_KEY_OPT=${EC2_SSH_KEY:+-i "$EC2_SSH_KEY"}
SSH_OPTS=("-p" "$SSH_PORT" "-o" "StrictHostKeyChecking=no")

echo "[1/5] Building (standalone)..."
if [[ "${SKIP_BUILD:-}" != "1" ]]; then
  npm ci --no-audit --no-fund
  npm run build
else
  echo "Skipping build as SKIP_BUILD=1"
fi

echo "[2/5] Packaging artifact..."
RELDIR="$(pwd)"
ARTIFACT="app.tar.gz"
rm -f "$ARTIFACT"
tar -czf "$ARTIFACT" \
  .next/standalone \
  .next/static \
  public \
  ecosystem.config.js \
  scripts/prestart.sh

TS="$(date +%Y%m%d%H%M%S)"
RLS_DIR="$EC2_PATH/releases/$TS"

echo "[3/5] Uploading to $EC2_USER@$EC2_HOST ..."
ssh $SSH_KEY_OPT "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" "mkdir -p '$EC2_PATH/tmp' '$EC2_PATH/releases' '$EC2_PATH/shared'"
scp $SSH_KEY_OPT -P "$SSH_PORT" "$ARTIFACT" "$EC2_USER@$EC2_HOST:$EC2_PATH/tmp/"

echo "[4/5] Releasing $RLS_DIR ..."
ssh $SSH_KEY_OPT "${SSH_OPTS[@]}" "$EC2_USER@$EC2_HOST" bash -lc "'
  set -euo pipefail
  mkdir -p '$RLS_DIR'
  tar -xzf '$EC2_PATH/tmp/$(basename "$ARTIFACT")' -C '$RLS_DIR'
  ln -sfn '$EC2_PATH/shared/.env' '$RLS_DIR/.env' || true
  ln -sfn '$RLS_DIR' '$EC2_PATH/current'
  cd '$EC2_PATH/current'
  NODE_ENV=production bash scripts/prestart.sh || true
  pm2 startOrReload ecosystem.config.js
  pm2 save || true
'"

echo "[5/5] Deployed release $TS. Current is $(basename "$RLS_DIR")."
echo "Done."

