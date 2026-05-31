import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

export type ProjectFrontmatter = {
  title: string;
  slug: string;
  year: string;
  location?: string;
  tags?: string[];
  thumb?: string;
  theme?: "dark" | "light";
  bg?: string;
  description?: string;
  legacyPath?: string;
  hideTitle?: boolean;
  hidden?: boolean;
  navHidden?: boolean;
  thumbSketch?: string;
  fullbleed?: boolean;
  cardBg?: string;
  imageBelowTitle?: boolean;
  // Aggregator pages (e.g. /projects/design, /projects/paintings) that
  // bundle multiple tagged projects onto one page. Implicitly hidden from
  // the homepage grid, skipped from prev/next, and skipped when other
  // meta pages aggregate by tag.
  meta?: boolean;
};

export type Project = ProjectFrontmatter & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "projects");

const CUSTOM_ORDER = [
  "lissajous",
  "emergence",
  "fake-rekordz",
  "eternal-return",
  "wave",
  "artificial-consciousness",
  "tobrit",
  "moon-raves",
  "multiverse",
  "roses",
  "shape-of-time",
  "paintings",
];

const PIN_LAST = ["dojo"];

function parseTags(input: unknown): string[] {
  if (Array.isArray(input)) return input.map(String);
  if (typeof input === "string") {
    return input
      .split(/[,\s]+/)
      .map((t) => t.trim())
      .filter(Boolean);
  }
  return [];
}

export function getAllProjects(): Project[] {
  if (!fs.existsSync(CONTENT_DIR)) return [];

  const files = fs
    .readdirSync(CONTENT_DIR)
    .filter((f) => f.endsWith(".mdx") || f.endsWith(".md"));

  const projects: Project[] = files.map((file) => {
    const raw = fs.readFileSync(path.join(CONTENT_DIR, file), "utf-8");
    const { data, content } = matter(raw);
    const slug = String(data.slug ?? file.replace(/\.(mdx?|md)$/, ""));
    return {
      title: String(data.title ?? slug),
      slug,
      year: String(data.year ?? ""),
      location: data.location ? String(data.location) : undefined,
      tags: parseTags(data.tags),
      thumb: data.thumb ? String(data.thumb) : undefined,
      theme: data.theme === "dark" ? "dark" : "light",
      bg: data.bg ? String(data.bg) : undefined,
      description: data.description ? String(data.description) : undefined,
      legacyPath: data.legacyPath ? String(data.legacyPath) : undefined,
      hideTitle: Boolean(data.hideTitle),
      hidden: Boolean(data.hidden),
      navHidden: Boolean(data.navHidden),
      thumbSketch: data.thumbSketch ? String(data.thumbSketch) : undefined,
      fullbleed: Boolean(data.fullbleed),
      cardBg: data.cardBg ? String(data.cardBg) : undefined,
      imageBelowTitle: Boolean(data.imageBelowTitle),
      meta: Boolean(data.meta),
      content,
    };
  });

  projects.sort((a, b) => {
    const aLast = PIN_LAST.indexOf(a.slug);
    const bLast = PIN_LAST.indexOf(b.slug);
    if (aLast !== -1 && bLast !== -1) return aLast - bLast;
    if (aLast !== -1) return 1;
    if (bLast !== -1) return -1;
    const aIdx = CUSTOM_ORDER.indexOf(a.slug);
    const bIdx = CUSTOM_ORDER.indexOf(b.slug);
    if (aIdx !== -1 && bIdx !== -1) return aIdx - bIdx;
    if (aIdx !== -1) return -1;
    if (bIdx !== -1) return 1;
    const ay = parseInt(a.year.match(/\d{4}/g)?.slice(-1)[0] ?? "0", 10);
    const by = parseInt(b.year.match(/\d{4}/g)?.slice(-1)[0] ?? "0", 10);
    return by - ay;
  });

  return projects;
}

export function getProject(slug: string): Project | undefined {
  return getAllProjects().find((p) => p.slug === slug);
}

export function getProjectNeighbors(slug: string): {
  prev: Project;
  next: Project;
} {
  const all = getAllProjects();
  // Exclude navHidden + meta projects from up/down navigation, but keep
  // the current project in the list even if it's itself excluded so we
  // still have a starting index. Then find prev/next in the filtered ring.
  let navigable = all.filter(
    (p) => (!p.navHidden && !p.meta) || p.slug === slug,
  );
  const current = navigable.find((p) => p.slug === slug);

  // Tag-based loop groups: when viewing a project tagged with one of
  // these, prev/next only cycles through other projects sharing that
  // tag (anchored on the current project). Driven by the matching hero
  // CTAs on the homepage — "Animations" lands in the animations loop,
  // "Design" lands in the design loop.
  const LOOP_TAGS = ["animations", "design"];
  const loopTag = LOOP_TAGS.find((tag) => current?.tags?.includes(tag));
  if (loopTag) {
    navigable = navigable.filter(
      (p) => p.tags?.includes(loopTag) || p.slug === slug,
    );
  }

  const idx = navigable.findIndex((p) => p.slug === slug);
  if (idx === -1) {
    return { prev: navigable[0] ?? all[0], next: navigable[0] ?? all[0] };
  }
  const prev = navigable[(idx - 1 + navigable.length) % navigable.length];
  const next = navigable[(idx + 1) % navigable.length];
  return { prev, next };
}

export function getLegacyRedirects() {
  return getAllProjects()
    .filter((p) => p.legacyPath)
    .map((p) => ({
      source: p.legacyPath as string,
      destination: `/projects/${p.slug}`,
      permanent: true,
    }));
}
