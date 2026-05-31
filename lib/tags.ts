import tagConfig from "./tag-config.json";

// Single place to curate the tag vocabulary without editing each MDX file.
// The MDX frontmatter stays the source of truth; this just normalizes the
// raw tags before they reach the filter UI.

const aliases = (tagConfig.aliases ?? {}) as Record<string, string>;
const display = (tagConfig.display ?? {}) as Record<string, string>;
const hidden = new Set((tagConfig.hidden ?? []) as string[]);
const order = (tagConfig.order ?? []) as string[];

function normalize(tag: string): string {
  const lower = tag.toLowerCase().trim();
  return aliases[lower] ?? lower;
}

export function normalizeTags(tags: string[] | undefined): string[] {
  if (!tags) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const t of tags) {
    const n = normalize(t);
    if (hidden.has(n)) continue;
    if (seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}

export function displayTag(tag: string): string {
  if (display[tag]) return display[tag];
  return tag.charAt(0).toUpperCase() + tag.slice(1);
}

// Returns the set of tags that appear across the given projects, sorted by
// the curated order (with anything not in the order list appended A→Z).
export function getAllTagsInOrder(
  projects: { tags?: string[] }[],
): string[] {
  const found = new Set<string>();
  for (const p of projects) {
    for (const t of normalizeTags(p.tags)) found.add(t);
  }
  const known = order.filter((t) => found.has(t));
  const unknown = [...found]
    .filter((t) => !order.includes(t))
    .sort((a, b) => a.localeCompare(b));
  return [...known, ...unknown];
}

// OR-combine: a project matches when it has any of the active tags. With
// no active tags, every project matches.
export function projectMatchesFilter(
  project: { tags?: string[] },
  activeTags: string[],
): boolean {
  if (activeTags.length === 0) return true;
  const projectTags = new Set(normalizeTags(project.tags));
  return activeTags.some((t) => projectTags.has(t));
}
