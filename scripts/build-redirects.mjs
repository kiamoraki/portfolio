#!/usr/bin/env node
// After `next build` (with output:'export') finishes, walk content/projects/*.mdx,
// and for each project with a `legacyPath` field, write an HTML meta-refresh file
// at out/<legacyPath> that points to /projects/<slug>/. This preserves the old
// /tobrit.html etc. URLs without server-level redirect rules.

import { promises as fs } from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const CONTENT_DIR = path.resolve("content/projects");
const OUT_DIR = path.resolve("out");

function redirectHtml(target) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>Redirecting…</title>
<meta http-equiv="refresh" content="0; url=${target}">
<link rel="canonical" href="${target}">
<meta name="robots" content="noindex">
</head>
<body>
<p>Redirecting to <a href="${target}">${target}</a></p>
<script>location.replace(${JSON.stringify(target)});</script>
</body>
</html>
`;
}

async function main() {
  let written = 0;
  const files = await fs.readdir(CONTENT_DIR);
  for (const file of files) {
    if (!/\.(mdx?|md)$/.test(file)) continue;
    const raw = await fs.readFile(path.join(CONTENT_DIR, file), "utf-8");
    const { data } = matter(raw);
    if (!data.legacyPath || !data.slug) continue;
    const target = `/projects/${data.slug}/`;
    const dest = path.join(OUT_DIR, data.legacyPath.replace(/^\//, ""));
    await fs.mkdir(path.dirname(dest), { recursive: true });
    await fs.writeFile(dest, redirectHtml(target));
    written++;
  }
  console.log(`Wrote ${written} legacy redirect files into ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
