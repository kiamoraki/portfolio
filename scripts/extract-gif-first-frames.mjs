#!/usr/bin/env node
/**
 * Extract the first frame of every GIF in `public/img/icons/` to a
 * sibling `<name>.first.png`. The grid page uses these as instant
 * placeholders behind each GIF — the user sees a static-looking
 * thumbnail at first paint, then the GIF replaces it as soon as the
 * (much heavier) animated file finishes streaming.
 *
 * Output format is PNG, not JPEG, so transparent GIFs keep their
 * transparency. JPEGs can't store alpha so the placeholder would
 * paint black behind any GIF with a transparent bg (Tobrit, Roses,
 * etc), which reads as a "black flash" before the GIF loads.
 * PNG keeps the alpha channel intact; the placeholder reads the
 * same as the GIF's first frame on every project.
 *
 * Idempotent: only emits a sibling if the GIF is newer than the
 * existing PNG (or the PNG doesn't exist), so re-runs are fast and
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
    const dstPath = `${base}.first.png`;
    if (!(await newer(gifPath, dstPath))) {
      skipped++;
      continue;
    }
    // `animated: false` → reads only the first frame, ignoring the
    // rest of the GIF stream. PNG preserves the alpha channel so
    // GIFs with transparent backgrounds (Tobrit, Roses, etc) stay
    // transparent in the placeholder. `compressionLevel: 9` is the
    // max losslesss compression; small icon thumbnails compress
    // well so the size hit vs JPEG is negligible (~10-30KB each).
    await sharp(gifPath, { animated: false })
      .png({ compressionLevel: 9 })
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
