#!/usr/bin/env node
// Build-time sync: lib/tag-config.json's `_projects` map (slug → tags[]) is
// the source of truth. For each project's MDX file, rewrite its `tags:`
// frontmatter line to match what's in the config. Preserves inline
// `tags: [a, b, c]` formatting and leaves all other frontmatter untouched.
//
// To add/remove tags, edit lib/tag-config.json's `_projects` block — then
// `npm run dev` (or `npm run build`) propagates the change into every MDX
// file. Projects that don't appear in `_projects` are left alone, and a
// warning is printed so missing entries are easy to spot.

import { promises as fs } from "node:fs";
import path from "node:path";

const CONTENT_DIR = path.resolve("content/projects");
const CONFIG_PATH = path.resolve("lib/tag-config.json");

function parseFrontmatter(text) {
  const m = text.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!m) return null;
  return { full: m[0], inner: m[1] };
}

function readSlug(inner, file) {
  const m = inner.match(/^slug:\s*(.+?)\s*$/m);
  if (m) return m[1].replace(/^["']|["']$/g, "").trim();
  return file.replace(/\.(mdx?|md)$/, "");
}

function replaceTagsLine(text, newTags) {
  const fm = parseFrontmatter(text);
  if (!fm) return text;
  const newLine = `tags: [${newTags.join(", ")}]`;

  // Existing inline form: tags: [a, b]
  const inlineRe = /^tags:[ \t]*\[.*?\][ \t]*$/m;
  // Existing block form: tags:\n  - a\n  - b
  const blockRe = /^tags:[ \t]*\r?\n(?:[ \t]+-[ \t]+.+\r?\n?)+/m;

  let newInner;
  if (inlineRe.test(fm.inner)) {
    newInner = fm.inner.replace(inlineRe, newLine);
  } else if (blockRe.test(fm.inner)) {
    newInner = fm.inner.replace(blockRe, newLine + "\n");
  } else {
    // No tags line yet — insert right after the `slug:` line if present,
    // otherwise at the top of the frontmatter.
    const slugRe = /^slug:.*$/m;
    if (slugRe.test(fm.inner)) {
      newInner = fm.inner.replace(slugRe, (s) => `${s}\n${newLine}`);
    } else {
      newInner = `${newLine}\n${fm.inner}`;
    }
  }

  return text.replace(fm.full, `---\n${newInner}\n---`);
}

async function main() {
  const config = JSON.parse(await fs.readFile(CONFIG_PATH, "utf8"));
  const projectsMap = config._projects ?? {};
  const untaggedList = new Set(config._untagged ?? []);

  const files = (await fs.readdir(CONTENT_DIR))
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"))
    .sort();

  let updated = 0;
  let missing = [];

  for (const file of files) {
    const filePath = path.join(CONTENT_DIR, file);
    const text = await fs.readFile(filePath, "utf8");
    const fm = parseFrontmatter(text);
    if (!fm) continue;

    const slug = readSlug(fm.inner, file);
    let nextTags;
    if (slug in projectsMap) {
      nextTags = projectsMap[slug];
    } else if (untaggedList.has(slug)) {
      nextTags = [];
    } else {
      missing.push(slug);
      continue;
    }

    const newText = replaceTagsLine(text, nextTags);
    if (newText !== text) {
      await fs.writeFile(filePath, newText);
      updated++;
    }
  }

  const summary = `tag-sync: updated ${updated}/${files.length} project(s)`;
  if (missing.length) {
    console.warn(
      `${summary}; ${missing.length} not in tag-config _projects: ${missing.join(", ")}`,
    );
  } else {
    console.log(summary);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
