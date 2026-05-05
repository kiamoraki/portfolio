import Image from "next/image";
import Link from "next/link";
import type { Project } from "@/lib/projects";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<string, { width: number; height: number }>;

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function ProjectGrid({ projects }: { projects: Project[] }) {
  return (
    <ul id="project-list">
      {projects.map((p) => {
        const src = p.thumb ? `/img/icons/${p.thumb}` : null;
        const dims = src ? manifest[src] : null;
        return (
          <li key={p.slug} className={`grid-item-${slugify(p.title)}`}>
            <Link href={`/projects/${p.slug}`}>
              {src && dims ? (
                <Image
                  src={src}
                  alt={p.title}
                  width={dims.width}
                  height={dims.height}
                  sizes="120px"
                  unoptimized={src.endsWith(".gif")}
                />
              ) : src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={p.title} />
              ) : (
                <span>{p.title}</span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
