import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { Project } from "@/lib/projects";
import imageManifest from "@/lib/image-manifest.json";
import { MoonRavesThumbnail } from "@/components/sketches/MoonRavesThumbnail";
import { WaveThumbnail } from "@/components/sketches/WaveThumbnail";
import { EternalReturnThumbnail } from "@/components/sketches/EternalReturnThumbnail";
import { EmergenceThumbnail } from "@/components/sketches/EmergenceThumbnail";
import { MultiverseThumbnail } from "@/components/sketches/MultiverseThumbnail";
import { RosesThumbnail } from "@/components/sketches/RosesThumbnail";
import { LissajousThumbnail } from "@/components/sketches/LissajousThumbnail";
import { ShapeOfTimeThumbnail } from "@/components/sketches/ShapeOfTimeThumbnail";

const manifest = imageManifest as Record<string, { width: number; height: number }>;

const SKETCH_REGISTRY: Record<string, ComponentType> = {
  MoonRavesThumbnail,
  WaveThumbnail,
  EternalReturnThumbnail,
  EmergenceThumbnail,
  MultiverseThumbnail,
  RosesThumbnail,
  LissajousThumbnail,
  ShapeOfTimeThumbnail,
};

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
        const Sketch = p.thumbSketch ? SKETCH_REGISTRY[p.thumbSketch] : null;
        const src = p.thumb ? `/img/icons/${p.thumb}` : null;
        const dims = src ? manifest[src] : null;
        return (
          <li key={p.slug} className={`grid-item-${slugify(p.title)}`}>
            <Link
              href={`/projects/${p.slug}`}
              style={
                p.cardBg
                  ? ({ "--card-bg": p.cardBg } as React.CSSProperties)
                  : undefined
              }
            >
              {Sketch ? (
                <Sketch />
              ) : src && dims ? (
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
