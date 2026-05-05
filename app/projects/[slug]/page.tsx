import { notFound } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
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
    <>
      {bg ? (
        <style>{`html,body{background:${bg};}`}</style>
      ) : null}
      <Nav theme={theme} />
      <ProjectNav title={project.title} prev={prev} next={next} theme={theme} />
      <main className={theme === "dark" ? "dark" : ""} style={bg ? { background: bg } : undefined}>
        <MDXRemote source={project.content} components={mdxComponents} />
      </main>
    </>
  );
}
