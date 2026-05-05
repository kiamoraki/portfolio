import Link from "next/link";
import type { Project } from "@/lib/projects";

type Props = {
  title: string;
  prev: Project;
  next: Project;
  theme?: "dark" | "light";
};

export function ProjectNav({ title, prev, next, theme = "light" }: Props) {
  const dark = theme === "dark";
  return (
    <nav className={`nav-projects ${dark ? "dark" : ""}`}>
      <p className="project-title">{title}</p>
      <Link href={`/projects/${prev.slug}`} className="icon-standard" aria-label={`Previous: ${prev.title}`}>
        directleft
      </Link>
      <Link href={`/projects/${next.slug}`} className="icon-standard" aria-label={`Next: ${next.title}`}>
        directright
      </Link>
    </nav>
  );
}
