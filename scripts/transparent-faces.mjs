import sharp from "sharp";
import fs from "node:fs";
import path from "node:path";

const dir = path.resolve("public/img/TOBRIT/faces");
const threshold = 235;

const files = fs
  .readdirSync(dir)
  .filter((f) => /^face_\d+\.png$/.test(f))
  .sort();

for (const file of files) {
  const filePath = path.join(dir, file);
  const { data, info } = await sharp(filePath)
    .ensureAlpha()
    .raw()
    .toBuffer({ resolveWithObject: true });

  for (let i = 0; i < data.length; i += 4) {
    const r = data[i];
    const g = data[i + 1];
    const b = data[i + 2];
    const m = Math.min(r, g, b);
    if (m >= threshold) {
      const t = (255 - m) / (255 - threshold);
      data[i + 3] = Math.round(data[i + 3] * t);
    }
  }

  const tmp = filePath + ".tmp";
  await sharp(data, {
    raw: { width: info.width, height: info.height, channels: 4 },
  })
    .png()
    .toFile(tmp);
  fs.renameSync(tmp, filePath);
  console.log(`✓ ${file}`);
}

console.log(`Processed ${files.length} face(s)`);
