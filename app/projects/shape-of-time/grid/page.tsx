import { Suspense } from "react";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { ShapeOfTimeGrid } from "@/components/ShapeOfTimeGrid";
import {
  getNavigableProjects,
  getProject,
  getProjectNeighbors,
} from "@/lib/projects";

const PROJECT_SLUG = "shape-of-time";

export const metadata: Metadata = {
  title: "The Shape of Time — Grid — Kirby",
  description: "All 27 unique Lissajous coprime ratios drawn together in a 9×3 / 3×9 grid.",
};

export default function ShapeOfTimeGridPage() {
  const project = getProject(PROJECT_SLUG);
  if (!project) notFound();
  const { prev, next } = getProjectNeighbors(PROJECT_SLUG);
  const navigableProjects = getNavigableProjects();
  const theme = project.theme ?? "dark";
  const bg = project.bg ?? "#130c12";
  // Set ink on body via the inline style block (same approach as the
  // main [slug] page) so descendants inherit theme color and we don't
  // need a `.dark` className on main.
  const ink = theme === "dark" ? "var(--color-light)" : "var(--color-dark)";

  return (
    <CarouselStateProvider>
      <style>{`html,body{background:${bg};color:${ink};}`}</style>
      <Nav />
      {/* ProjectNav + ShapeOfTimeGrid both call `useSearchParams()`;
          Next 16 static export refuses to prerender without an
          enclosing Suspense boundary. */}
      <Suspense fallback={null}>
        <ProjectNav
          slug={PROJECT_SLUG}
          title={`${project.title} — Grid`}
          prev={prev}
          next={next}
          navigableProjects={navigableProjects}
        />
      </Suspense>
      <main style={{ background: bg, padding: 0 }}>
        <Suspense fallback={null}>
          <ShapeOfTimeGrid />
        </Suspense>
      </main>
    </CarouselStateProvider>
  );
}
