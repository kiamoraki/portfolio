import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { ShapeOfTimeGrid } from "@/components/ShapeOfTimeGrid";
import { getProject, getProjectNeighbors } from "@/lib/projects";

const PROJECT_SLUG = "shape-of-time";

export const metadata: Metadata = {
  title: "The Shape of Time — Grid — Kirby",
  description: "All 27 unique Lissajous coprime ratios drawn together in a 9×3 / 3×9 grid.",
};

export default function ShapeOfTimeGridPage() {
  const project = getProject(PROJECT_SLUG);
  if (!project) notFound();
  const { prev, next } = getProjectNeighbors(PROJECT_SLUG);
  const theme = project.theme ?? "dark";
  const bg = project.bg ?? "#130c12";

  return (
    <CarouselStateProvider>
      <style>{`html,body{background:${bg};}`}</style>
      <Nav theme={theme} />
      <ProjectNav
        title={`${project.title} — Grid`}
        prev={prev}
        next={next}
        theme={theme}
      />
      <main
        className={theme === "dark" ? "dark" : ""}
        style={{ background: bg, padding: 0 }}
      >
        <ShapeOfTimeGrid />
      </main>
    </CarouselStateProvider>
  );
}
