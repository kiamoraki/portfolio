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
  --exclude='/img/***' \
  --exclude='.DS_Store' \
  --exclude='__next.*.txt' \
  out/ \
  "$SSH_TARGET:$REMOTE_PATH/"
# `/img/***` (leading slash) anchors the exclude to the SOURCE ROOT
# only, so the kiamoraki top-level `/img/` is still protected from
# `--delete` (the original intent — that tree has uploaded-only assets
# the build doesn't reproduce). But per-site `img/` folders nested
# under `/sites/<name>/img/` are NOT excluded — they push normally, so
# the new images that came in with the xtian.dev rebuild + marsradio
# path rewrites reach the server. Previously the pattern was
# `img/***` (no leading slash) which matched ANY directory named `img`
# anywhere in the tree, blocking the site images from deploying.

# Second rsync: push NEW files in /img/ (additive — never deletes).
# `--ignore-existing` skips files already on the server, so this only
# uploads new images (e.g. AVIF/WebP siblings emitted by
# `npm run images:modern`) or new uploaded assets. Server-only assets
# are still safe because there's no `--delete`. Source is the build's
# `out/img/` (Next copies `public/img/*` here as part of static export)
# so the same set of files the dev tree has gets pushed.
echo ""
echo "▶ Syncing additive image siblings (avif / webp / new uploads)..."
rsync -avz --ignore-existing --exclude='.DS_Store' \
  out/img/ \
  "$SSH_TARGET:$REMOTE_PATH/img/"

echo ""
echo "▶ Cleaning up local out/ to avoid duplicating images on disk..."
rm -rf out

echo ""
echo "✓ Deployed."
