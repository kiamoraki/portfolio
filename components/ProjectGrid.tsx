import Link from "next/link";
import type { Project } from "@/lib/projects";

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul id="project-list">
      {projects.map((p) => (
        <li key={p.slug} className={`grid-item-${slugify(p.title)}`}>
          <Link href={`/projects/${p.slug}`}>
            {p.thumb ? (
              <img src={`/img/icons/${p.thumb}`} alt={p.title} />
            ) : (
              <span>{p.title}</span>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
