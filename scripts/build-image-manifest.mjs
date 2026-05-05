#!/usr/bin/env node
// Build-time scan: read each image in public/img/ and record its natural width/height,
// writing the result to lib/image-manifest.json. The Figure / ProjectGrid components
// look up dimensions here so next/image can render with explicit width/height
// (required for layout stability and Vercel's image optimization pipeline).

import { promises as fs } from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.resolve("public/img");
const OUT = path.resolve("lib/image-manifest.json");

const EXTS = new Set([".jpg", ".jpeg", ".png", ".gif", ".webp", ".avif"]);

async function* walk(dir) {
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* walk(full);
    else yield full;
  }
}

async function main() {
  const manifest = {};
  let scanned = 0;
  let recorded = 0;
  let failed = 0;

  for await (const file of walk(ROOT)) {
    scanned++;
    const ext = path.extname(file).toLowerCase();
    if (!EXTS.has(ext)) continue;
    try {
      const meta = await sharp(file).metadata();
      if (!meta.width || !meta.height) {
        failed++;
        continue;
      }
      // Key by the public URL the browser will request
      const key = "/" + path.relative(path.resolve("public"), file).split(path.sep).join("/");
      manifest[key] = { width: meta.width, height: meta.height };
      recorded++;
    } catch {
      failed++;
    }
  }

  await fs.writeFile(OUT, JSON.stringify(manifest, null, 0) + "\n");
  console.log(`Scanned ${scanned} files, recorded ${recorded}, failed ${failed}`);
  console.log(`Wrote ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
