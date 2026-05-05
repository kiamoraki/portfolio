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
};

export type Project = ProjectFrontmatter & {
  content: string;
};

const CONTENT_DIR = path.join(process.cwd(), "content", "projects");

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
      content,
    };
  });

  projects.sort((a, b) => {
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
  const idx = all.findIndex((p) => p.slug === slug);
  if (idx === -1) {
    return { prev: all[0], next: all[0] };
  }
  const prev = all[(idx - 1 + all.length) % all.length];
  const next = all[(idx + 1) % all.length];
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
