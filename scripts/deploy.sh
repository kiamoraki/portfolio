#!/usr/bin/env bash
# Build the static site and rsync it to the friend's server.
# Customize the SSH_TARGET and REMOTE_PATH variables below to match your setup.

set -euo pipefail

# ─────────────────────────────────────────────────────────────────────────────
# CONFIGURE THIS:
SSH_TARGET="${SSH_TARGET:-kirby@45.33.88.177}"
REMOTE_PATH="${REMOTE_PATH:-/srv/www/kirby/htdocs}"
# ─────────────────────────────────────────────────────────────────────────────

echo "▶ Building static site..."
npm run build

echo ""
echo "▶ Deploying out/ to $SSH_TARGET:$REMOTE_PATH"
echo "  (--delete will remove server-side files not present in out/ — make sure"
echo "   the remote path is dedicated to this site)"
echo ""

rsync -avz --delete \
  --exclude='.DS_Store' \
  --exclude='__next.*.txt' \
  out/ \
  "$SSH_TARGET:$REMOTE_PATH/"

echo ""
echo "✓ Deployed."
