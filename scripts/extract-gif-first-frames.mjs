#!/usr/bin/env node
/**
 * Extract the first frame of every GIF in `public/img/icons/` to a
 * sibling `<name>.first.jpg`. The grid page uses these as instant
 * placeholders behind each GIF — the user sees a static-looking
 * thumbnail at first paint, then the GIF replaces it as soon as the
 * (much heavier) animated file finishes streaming.
 *
 * Idempotent: only emits a sibling if the GIF is newer than the
 * existing JPG (or the JPG doesn't exist), so re-runs are fast and
 * don't fight git when only a subset of GIFs changed.
 *
 * Run via `npm run build` or directly: `node scripts/extract-gif-first-frames.mjs`.
 */
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const ICONS_DIR = path.join(ROOT, "public", "img", "icons");

async function listGifs(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  return entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".gif"))
    .map((e) => path.join(dir, e.name));
}

async function newer(srcPath, dstPath) {
  try {
    const [srcStat, dstStat] = await Promise.all([
      fs.stat(srcPath),
      fs.stat(dstPath),
    ]);
    return srcStat.mtimeMs > dstStat.mtimeMs;
  } catch {
    return true; // dst doesn't exist → emit
  }
}

async function main() {
  const gifs = await listGifs(ICONS_DIR);
  let emitted = 0;
  let skipped = 0;
  for (const gifPath of gifs) {
    const base = gifPath.replace(/\.gif$/i, "");
    const dstPath = `${base}.first.jpg`;
    if (!(await newer(gifPath, dstPath))) {
      skipped++;
      continue;
    }
    // `animated: false` → reads only the first frame, ignoring the
    // rest of the GIF stream. Quality 80 is a good balance between
    // size and visual fidelity for a 120px-rendered thumbnail.
    await sharp(gifPath, { animated: false })
      .flatten({ background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .jpeg({ quality: 80, mozjpeg: true })
      .toFile(dstPath);
    emitted++;
  }
  console.log(
    `gif-first-frames: emitted ${emitted}, skipped ${skipped} (${gifs.length} total)`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
