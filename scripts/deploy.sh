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
echo "  (--delete removes server-side files not present in out/, but server"
echo "   images are protected via 'P img/' filter — they're never wiped)"
echo ""

rsync -avz --delete \
  --exclude='img/***' \
  --exclude='.DS_Store' \
  --exclude='__next.*.txt' \
  out/ \
  "$SSH_TARGET:$REMOTE_PATH/"

echo ""
echo "▶ Cleaning up local out/ to avoid duplicating images on disk..."
rm -rf out

echo ""
echo "✓ Deployed."
