#!/usr/bin/env node
// Build-time content index: walks every `content/projects/*.mdx`, finds
// every top-level `<Piece ...>...</Piece>` block in the MDX body, extracts
// metadata (id, tags, credit, date, sketch bg), and writes
// `lib/content-index.json`.
//
// The index is the source of truth meta pages query at render time:
//   - activations (by-project): group entries by projectSlug, render one
//     slide per project that has any matching piece.
//   - animations (by-piece): render one slide per piece.
//
// This script runs alongside `build-image-manifest.mjs` and
// `build-tag-index.mjs` as part of `npm run dev` and `npm run build`.
//
// Phase 1 scope: emit a (likely empty) index for the current MDX files
// — no project has been migrated yet, so the script's `<Piece>` regex
// won't match anything. That's fine: the script is in place and ready
// once migrations begin.

import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/projects");
const OUTPUT_PATH = path.resolve("lib/content-index.json");

// Frontmatter slice: `^---\n...\n---`. Used to skip the frontmatter so
// we don't false-positive on YAML content that happens to look like JSX.
function stripFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) return { body: text, slug: null };
  const slugMatch = m[1].match(/^slug:\s*(.+?)\s*$/m);
  const slug = slugMatch ? slugMatch[1].replace(/^["']|["']$/g, "").trim() : null;
  return { body: text.slice(m[0].length), slug };
}

// Find every top-level `<Piece ...>...</Piece>` block in MDX body.
// MDX restriction: we only support `<Piece>` at the top level (not
// nested inside other JSX), which lets us use a simple non-greedy
// regex. We also support self-closing `<Piece ... />` for empty
// pieces (rare but valid).
function findPieceBlocks(body) {
  const blocks = [];
  // Self-closing: <Piece ... />
  const selfRe = /<Piece\b([^>]*?)\/>/g;
  // Paired: <Piece ...>...</Piece>
  const pairRe = /<Piece\b([^>]*?)>([\s\S]*?)<\/Piece>/g;
  let m;
  while ((m = selfRe.exec(body)) !== null) {
    blocks.push({ props: m[1], children: "", index: m.index });
  }
  while ((m = pairRe.exec(body)) !== null) {
    blocks.push({ props: m[1], children: m[2], index: m.index });
  }
  // Sort by position so author-order survives.
  blocks.sort((a, b) => a.index - b.index);
  return blocks;
}

// Parse a single JSX prop value from the opening-tag attribute string.
// Supports:
//   id="cover"
//   credit="Some text"
//   credit={"Some text"}
//   tags={["a", "b"]}
//   tags={['a', 'b']}
function parseStringProp(propsStr, name) {
  // foo="..."
  const dq = new RegExp(`\\b${name}\\s*=\\s*"([^"]*)"`).exec(propsStr);
  if (dq) return dq[1];
  // foo={"..."} or foo={'...'}
  const brace = new RegExp(
    `\\b${name}\\s*=\\s*\\{\\s*["']([^"']*)["']\\s*\\}`,
  ).exec(propsStr);
  if (brace) return brace[1];
  return undefined;
}

function parseArrayProp(propsStr, name) {
  const m = new RegExp(`\\b${name}\\s*=\\s*\\{\\s*\\[([^\\]]*)\\]\\s*\\}`).exec(
    propsStr,
  );
  if (!m) return undefined;
  // Split on commas, strip quotes + whitespace.
  return m[1]
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

// Scan children for a `<Sketch ...>` element and pull its id + bg.
function findSketch(children) {
  const m = /<Sketch\b([^>/]*?)\/?>/.exec(children);
  if (!m) return undefined;
  const propsStr = m[1];
  const id = parseStringProp(propsStr, "id");
  const bg = parseStringProp(propsStr, "bg");
  const colorMode = parseStringProp(propsStr, "colorMode");
  if (!id) return undefined;
  return { id, bg: bg ?? "", colorMode };
}

async function main() {
  const files = (await fs.readdir(CONTENT_DIR))
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();

  /** @type {Array<import("../lib/content-types").PieceIndexEntry>} */
  const index = [];
  let projectsWithPieces = 0;

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const text = await fs.readFile(filePath, "utf8");
    const { body, slug: fmSlug } = stripFrontmatter(text);
    const slug = fmSlug ?? file.replace(/\.(mdx?|md)$/, "");

    const blocks = findPieceBlocks(body);
    if (blocks.length === 0) continue;
    projectsWithPieces++;

    blocks.forEach((b, i) => {
      const id =
        parseStringProp(b.props, "id") ?? `${slug}-${i}`; // fallback if author forgot
      // Accept both `tags={["activation", "process"]}` (array literal)
      // AND `tags="activation,process"` (comma-separated string). The
      // string form is what actually survives MDX → React at runtime
      // in this project; the array form is kept for back-compat.
      const tagsArray = parseArrayProp(b.props, "tags");
      const tagsString = parseStringProp(b.props, "tags");
      const tags =
        tagsArray ??
        (tagsString
          ? tagsString
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : []);
      const credit = parseStringProp(b.props, "credit");
      const date = parseStringProp(b.props, "date");
      const sketch = findSketch(b.children);

      /** @type {import("../lib/content-types").PieceIndexEntry} */
      const entry = {
        projectSlug: slug,
        pieceId: id,
        tags,
        indexInProject: i,
      };
      if (credit) entry.credit = credit;
      if (date) entry.date = date;
      if (sketch) entry.sketch = sketch;
      index.push(entry);
    });
  }

  await fs.writeFile(OUTPUT_PATH, JSON.stringify(index, null, 2) + "\n");

  const summary = `content-index: ${index.length} piece(s) across ${projectsWithPieces}/${files.length} project(s)`;
  console.log(summary);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
