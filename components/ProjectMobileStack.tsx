"use client";

import Image from "next/image";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<
  string,
  { width: number; height: number }
>;

export type MobileImage = { src: string; alt?: string };

export function ProjectMobileStack({ images }: { images: MobileImage[] }) {
  return (
    <div className="project-mobile-stack">
      {images.map((img, i) => {
        const dims = manifest[img.src];
        const style = { width: "100%", height: "auto", display: "block" } as const;
        return (
          <div
            key={i}
            className="project-mobile-slide project-mobile-slide--single"
          >
            {dims ? (
              <Image
                src={img.src}
                alt={img.alt ?? ""}
                width={dims.width}
                height={dims.height}
                sizes="100vw"
                style={style}
              />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={img.src} alt={img.alt ?? ""} style={style} />
            )}
          </div>
        );
      })}
    </div>
  );
}
