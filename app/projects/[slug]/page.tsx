import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { ProjectMobileBottomNav } from "@/components/ProjectMobileBottomNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { mdxComponents } from "@/components/mdx";
import {
  getAllProjects,
  getProject,
  getProjectNeighbors,
} from "@/lib/projects";

export function generateStaticParams() {
  return getAllProjects().map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) return {};
  return {
    title: `${project.title} — Kirby`,
    description: project.description,
  };
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const project = getProject(slug);
  if (!project) notFound();

  const { prev, next } = getProjectNeighbors(slug);
  const theme = project.theme ?? "light";
  const bg = project.bg ?? (theme === "dark" ? "#020014" : undefined);

  return (
    <CarouselStateProvider>
      {bg ? (
        <style>{`html,body{background:${bg};}`}</style>
      ) : null}
      <Nav theme={theme} />
      <ProjectNav title={project.title} prev={prev} next={next} theme={theme} />
      <ProjectMobileBottomNav
        prev={prev}
        next={next}
        isMeta={Boolean(project.meta)}
      />
      <main
        className={[
          theme === "dark" ? "dark" : "",
          project.imageBelowTitle ? "image-below-title" : "",
          project.fullbleed ? "fullbleed" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        style={bg ? { background: bg } : undefined}
      >
        <MDXRemote source={project.content} components={mdxComponents} />
      </main>
    </CarouselStateProvider>
  );
}
