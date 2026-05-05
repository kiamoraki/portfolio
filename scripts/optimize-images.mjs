#!/usr/bin/env node
// Optimize images in public/img/ in place.
// - JPG/JPEG/PNG: resize to max MAX_DIM, re-encode (q=82)
// - HEIC: convert to JPG
// - GIF: skipped (animation)
// - .DS_Store: deleted
// Originals already backed up to ~/Dev/kiamoraki-img-backup/

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/img");
const MAX_DIM = 2400;
const JPEG_Q = 82;
const PNG_Q = 90;
const SKIP_IF_SMALLER_THAN = 200 * 1024; // skip files under 200KB; not worth the work

const stats = {
  scanned: 0,
  optimized: 0,
  skippedSmall: 0,
  heicConverted: 0,
  gifSkipped: 0,
  dsStoreDeleted: 0,
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
  const basename = path.basename(file);
  const sizeBefore = (await fs.stat(file)).size;
  stats.bytesBefore += sizeBefore;

  // Junk
  if (basename === ".DS_Store") {
    await fs.unlink(file);
    stats.dsStoreDeleted++;
    return;
  }

  // Animations — skip
  if (ext === ".gif") {
    stats.gifSkipped++;
    stats.bytesAfter += sizeBefore;
    return;
  }

  // HEIC → JPG conversion
  if (ext === ".heic") {
    try {
      const out = file.replace(/\.heic$/i, ".jpg");
      const meta = await sharp(file).metadata();
      const resize =
        meta.width > MAX_DIM || meta.height > MAX_DIM
          ? { width: MAX_DIM, height: MAX_DIM, fit: "inside" }
          : null;
      let pipe = sharp(file).rotate();
      if (resize) pipe = pipe.resize(resize);
      await pipe.jpeg({ quality: JPEG_Q, mozjpeg: true }).toFile(out);
      await fs.unlink(file);
      stats.heicConverted++;
      stats.bytesAfter += (await fs.stat(out)).size;
      return;
    } catch (err) {
      console.error(`HEIC fail ${file}:`, err.message);
      stats.errored++;
      stats.bytesAfter += sizeBefore;
      return;
    }
  }

  // JPG / PNG
  if ([".jpg", ".jpeg", ".png"].includes(ext)) {
    if (sizeBefore < SKIP_IF_SMALLER_THAN) {
      stats.skippedSmall++;
      stats.bytesAfter += sizeBefore;
      return;
    }
    try {
      const meta = await sharp(file).metadata();
      const needsResize = meta.width > MAX_DIM || meta.height > MAX_DIM;
      const resize = needsResize
        ? { width: MAX_DIM, height: MAX_DIM, fit: "inside" }
        : null;

      // Use a temp file then atomic rename to avoid corruption mid-write
      const tmp = file + ".tmp";
      let pipe = sharp(file).rotate();
      if (resize) pipe = pipe.resize(resize);

      if (ext === ".png") {
        await pipe.png({ quality: PNG_Q, compressionLevel: 9 }).toFile(tmp);
      } else {
        await pipe.jpeg({ quality: JPEG_Q, mozjpeg: true }).toFile(tmp);
      }

      const sizeAfter = (await fs.stat(tmp)).size;
      // Only keep the optimized version if it's actually smaller
      if (sizeAfter < sizeBefore) {
        await fs.rename(tmp, file);
        stats.optimized++;
        stats.bytesAfter += sizeAfter;
      } else {
        await fs.unlink(tmp);
        stats.skippedSmall++;
        stats.bytesAfter += sizeBefore;
      }
    } catch (err) {
      console.error(`Optim fail ${file}:`, err.message);
      stats.errored++;
      stats.bytesAfter += sizeBefore;
    }
    return;
  }

  // Anything else (mov, mp4, m4v, zip, etc.) — leave alone
  stats.bytesAfter += sizeBefore;
}

async function main() {
  const files = [];
  for await (const f of walk(ROOT)) files.push(f);
  stats.scanned = files.length;

  // Process in batches of 8 for some parallelism but not blow up the system
  const BATCH = 8;
  for (let i = 0; i < files.length; i += BATCH) {
    const batch = files.slice(i, i + BATCH);
    await Promise.all(batch.map(processFile));
    if (i % 80 === 0) {
      process.stdout.write(`  ...${i}/${files.length}\r`);
    }
  }

  console.log("\n=== Optimization Summary ===");
  console.log(`Scanned:           ${stats.scanned} files`);
  console.log(`Optimized:         ${stats.optimized}`);
  console.log(`HEIC → JPG:        ${stats.heicConverted}`);
  console.log(`Skipped (small):   ${stats.skippedSmall}`);
  console.log(`GIF (skipped):     ${stats.gifSkipped}`);
  console.log(`.DS_Store removed: ${stats.dsStoreDeleted}`);
  console.log(`Errors:            ${stats.errored}`);
  console.log("");
  console.log(`Before: ${fmtBytes(stats.bytesBefore)}`);
  console.log(`After:  ${fmtBytes(stats.bytesAfter)}`);
  console.log(
    `Saved:  ${fmtBytes(stats.bytesBefore - stats.bytesAfter)} (${(
      (1 - stats.bytesAfter / stats.bytesBefore) *
      100
    ).toFixed(1)}%)`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
