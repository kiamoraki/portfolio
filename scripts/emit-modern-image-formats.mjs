#!/usr/bin/env node
/**
 * For every JPG / JPEG / PNG under `public/img/`, emit AVIF and WebP
 * siblings at the same path with the modern extension (e.g.
 * `foo.jpg` → `foo.avif` + `foo.webp`). The original JPG/PNG is left
 * untouched so old browsers / fallback `<img src>` references still
 * work; the `<Picture>` content primitive picks AVIF → WebP → JPG in
 * priority order via `<source type="...">` tags.
 *
 * Skips:
 *   - existing siblings (idempotent re-runs only encode new images)
 *   - GIFs (animations — leave alone)
 *   - any non JPG/PNG file
 *
 * Idempotent: safe to run after every image add. The deploy script
 * could call `npm run images:modern` as a pre-build step.
 *
 * Typical savings vs the JPG/PNG source at equivalent perceptual
 * quality:
 *   - AVIF: 50-80% smaller
 *   - WebP: 25-50% smaller
 *
 * Browser support: AVIF works in Chrome 85+ / Safari 16.4+ / Firefox
 * 93+. WebP works almost everywhere modern. The fallback `<img>` src
 * still points at the original JPG/PNG for the long tail.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/img");
// Quality knobs — AVIF and WebP both interpret quality on a 0-100
// scale similar to JPEG. AVIF 55 ≈ JPEG 82 visually; WebP 78 ≈ same.
const AVIF_Q = 55;
const WEBP_Q = 78;
// Skip very small sources — the overhead of two more files isn't
// worth saving 30KB on a 200KB image.
const SKIP_IF_SMALLER_THAN = 100 * 1024;

const stats = {
  scanned: 0,
  alreadyDone: 0,
  emitted: 0,
  skippedSmall: 0,
  skippedNonImage: 0,
  errored: 0,
  bytesBefore: 0,
  bytesAfter: 0,
};

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

function fmtBytes(b) {
  if (b > 1024 * 1024) return (b / 1024 / 1024).toFixed(1) + "MB";
  if (b > 1024) return (b / 1024).toFixed(0) + "KB";
  return b + "B";
}

async function processFile(file) {
  const ext = path.extname(file).toLowerCase();
  if (![".jpg", ".jpeg", ".png"].includes(ext)) {
    stats.skippedNonImage++;
    return;
  }
  const sizeBefore = (await fs.stat(file)).size;
  if (sizeBefore < SKIP_IF_SMALLER_THAN) {
    stats.skippedSmall++;
    return;
  }
  stats.bytesBefore += sizeBefore;

  const base = file.slice(0, -ext.length);
  const avifPath = base + ".avif";
  const webpPath = base + ".webp";

  // Idempotency — if both siblings already exist AND they're newer
  // than the source, skip. Re-encode if source has been touched.
  try {
    const srcMtime = (await fs.stat(file)).mtimeMs;
    const [avifStat, webpStat] = await Promise.all([
      fs.stat(avifPath).catch(() => null),
      fs.stat(webpPath).catch(() => null),
    ]);
    if (
      avifStat &&
      webpStat &&
      avifStat.mtimeMs > srcMtime &&
      webpStat.mtimeMs > srcMtime
    ) {
      stats.alreadyDone++;
      stats.bytesAfter += avifStat.size + webpStat.size;
      return;
    }
  } catch {
    /* fallthrough — encode */
  }

  try {
    const pipe = sharp(file).rotate();
    await Promise.all([
      pipe.clone().avif({ quality: AVIF_Q }).toFile(avifPath),
      pipe.clone().webp({ quality: WEBP_Q }).toFile(webpPath),
    ]);
    const [avifSize, webpSize] = await Promise.all([
      fs.stat(avifPath).then((s) => s.size),
      fs.stat(webpPath).then((s) => s.size),
    ]);
    stats.emitted++;
    stats.bytesAfter += avifSize + webpSize;
  } catch (err) {
    console.error(`Modern-format fail ${file}:`, err.message);
    stats.errored++;
  }
}

async function main() {
  const files = [];
  for await (const f of walk(ROOT)) files.push(f);
  stats.scanned = files.length;

  // Process in batches of 4 — AVIF encoding is CPU-heavy.
  const BATCH = 4;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await Promise.all(batch.map(processFile));
    if (i % 40 === 0) {
      process.stdout.write(`  ...${i}/${files.length}\r`);
    }
  }
  process.stdout.write(" ".repeat(40) + "\r");

  console.log("");
  console.log(`Scanned:        ${stats.scanned}`);
  console.log(`Emitted:        ${stats.emitted} (avif + webp pairs)`);
  console.log(`Already done:   ${stats.alreadyDone}`);
  console.log(`Skipped small:  ${stats.skippedSmall}`);
  console.log(`Skipped other:  ${stats.skippedNonImage}`);
  console.log(`Errored:        ${stats.errored}`);
  console.log(`Source bytes:   ${fmtBytes(stats.bytesBefore)}`);
  console.log(`Output bytes:   ${fmtBytes(stats.bytesAfter)} (avif + webp)`);
  const ratio = stats.bytesBefore
    ? Math.round((stats.bytesAfter / stats.bytesBefore) * 100)
    : 0;
  console.log(`Modern / orig:  ${ratio}% (lower is better)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
