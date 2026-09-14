import Image from "next/image";
import Link from "next/link";
import type { ComponentType } from "react";
import type { Project } from "@/lib/projects";
import imageManifest from "@/lib/image-manifest.json";
import { MoonRavesThumbnail } from "@/components/sketches/MoonRavesThumbnail";
import { WaveThumbnail } from "@/components/sketches/WaveThumbnail";
import { JellyfishThumbnail } from "@/components/sketches/JellyfishThumbnail";
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
  JellyfishThumbnail,
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

export function ProjectGrid({
  projects,
  linkSuffix,
}: {
  projects: Project[];
  /** Optional query string (e.g. "?tag=design") appended to each tile
   *  href, so a click into a project page carries a filter context. */
  linkSuffix?: string;
}) {
  return (
    <ul id="project-list">
      {projects.map((p) => {
        const Sketch = p.thumbSketch ? SKETCH_REGISTRY[p.thumbSketch] : null;
        const src = p.thumb ? `/img/icons/${p.thumb}` : null;
        const dims = src ? manifest[src] : null;
        const isGif = !!src && src.endsWith(".gif");
        // For GIFs, the matching `<name>.first.png` sibling is emitted
        // by `scripts/extract-gif-first-frames.mjs` at build time. PNG
        // (not JPEG) so transparent GIFs keep their transparency —
        // JPEG flattens alpha to black and you'd see a "black flash"
        // behind any GIF that doesn't have an opaque bg (Tobrit,
        // Roses, etc) before the GIF finishes loading.
        const placeholderSrc = isGif ? src!.replace(/\.gif$/i, ".first.png") : null;
        return (
          <li key={p.slug} className={`grid-item-${slugify(p.title)}`}>
            <Link
              href={`/projects/${p.slug}${linkSuffix ?? ""}`}
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
                  unoptimized={isGif}
                  // GIFs are heavy (1MB+). The matching
                  // `<name>.first.jpg` sibling (emitted by
                  // `scripts/extract-gif-first-frames.mjs`) is set as
                  // the `<img>`'s `background-image` so the static
                  // first frame paints behind the GIF the moment the
                  // small JPG arrives — instant perceived load.
                  // Once the animated GIF finishes streaming, its
                  // own pixels cover the bg fully (GIFs have an
                  // opaque background, so there's no FOUC). On
                  // browsers that finish the GIF before the JPG,
                  // the bg is simply never shown — harmless.
                  style={
                    isGif && placeholderSrc
                      ? {
                          backgroundImage: `url(${placeholderSrc})`,
                          backgroundSize: "contain",
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "center",
                        }
                      : undefined
                  }
                />
              ) : src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={src} alt={p.title} />
              ) : (
                <span>{p.title}</span>
              )}
            </Link>
            {/* Caption sits OUTSIDE the <a>, which carries the card's
                `--card-bg`. Inside it, the name inherited a black card
                background and dark ink, so it vanished on every dark
                card. Out here it always sits on the page background.
                `aria-hidden` because the link above is already named by
                the image's alt, so exposing it would say the title
                twice. */}
            <span className="grid-item-title" aria-hidden="true">
              {p.title}
            </span>
          </li>
        );
      })}
    </ul>
  );
}
