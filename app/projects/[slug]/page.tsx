import { notFound, redirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { ProjectMobileBottomNav } from "@/components/ProjectMobileBottomNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { mdxComponents } from "@/components/mdx";
import {
  ProjectRenderer,
  mdxPieceComponents,
} from "@/components/content";
import {
  getAllProjects,
  getNavigableProjects,
  getProject,
  getProjectNeighbors,
} from "@/lib/projects";

// Meta routes that redirect to the FIRST project matching the tag,
// with a `?tag=…` URL param so the chrome's PREV/NEXT walks only
// other projects sharing that tag. Click "activations" on the
// homepage → land on the first activation project → click PREV/NEXT
// → walk through other activation projects only.
//
// The animations meta route is the one exception: it keeps its
// piece-level carousel (handled via the MDX body of animations.mdx
// rendering <AnimationsCarousel />), so it does NOT appear here.
const TAG_REDIRECT_SLUGS: Record<string, string> = {
  activations: "activation",
  design: "design",
};

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

  // Meta route redirect — `/projects/activations` and `/projects/design`
  // jump to the FIRST project matching the tag, carrying `?tag=…` so
  // chrome PREV/NEXT on the destination scopes the ring to other
  // tag-matched projects. Runs at build time in static export, so the
  // emitted HTML is a redirect, not a real page.
  const redirectTag = TAG_REDIRECT_SLUGS[project.slug];
  if (redirectTag) {
    const first = getAllProjects().find(
      (p) =>
        !p.meta &&
        !p.navHidden &&
        !p.hidden &&
        (p.tags ?? []).includes(redirectTag),
    );
    if (first) {
      redirect(`/projects/${first.slug}/?tag=${redirectTag}`);
    }
  }

  // Static export precludes server-side `searchParams` reads, so the
  // page renders prev/next for the FULL navigable ring at build time;
  // the client (ProjectNav / ProjectMobileBottomNav) recomputes them
  // on the fly when a `?tag=…` URL param is present, picking from
  // `navigableProjects` (a lightweight list of every navigable project
  // with its tags).
  const { prev, next } = getProjectNeighbors(slug);
  const navigableProjects = getNavigableProjects();
  const theme = project.theme ?? "light";
  const bg = project.bg ?? (theme === "dark" ? "#020014" : undefined);
  // Page-level ink color, paired with bg below. Setting it on body via
  // the inline `<style>` block (instead of via a `.dark` className on
  // main) means the theme cascades from body to every descendant
  // naturally — including chrome elements like the nav icons (whose
  // `color: inherit` rules pick this up) and the meta-carousel title
  // chip — without forcing dark text onto light-bg slides inside the
  // meta carousel. The old `.dark` class globally set every h2 / span
  // inside main to off-white, which overrode the per-slide polarity
  // flip on TOBRIT / AC / Mars etc.
  const ink = theme === "dark" ? "var(--color-light)" : "var(--color-dark)";
  // Resolve color mode once here so the `--chrome-scrim` variable can
  // be SSR-rendered onto the body — `<ColorModeBody>` also sets
  // `body[data-color-mode]` in a client effect, but that runs AFTER
  // hydration, leaving the chrome chips un-scrim'd until JS catches
  // up. Inlining the variable bypasses the hydration wait entirely.
  const resolvedColorMode =
    project.colorMode ?? (theme === "dark" ? "dark" : "light");
  // `color-mix` for the light scrim (off-white `--color-light` with
  // 15% transparency); flat rgba for dark since the dark scrim is
  // just black with alpha and doesn't need to track a palette token.
  const chromeScrim =
    resolvedColorMode === "light"
      ? "color-mix(in srgb, var(--color-light) 85%, transparent)"
      : "rgba(0, 0, 0, 0.85)";

  return (
    <CarouselStateProvider>
      {bg ? (
        <style>{`html,body{background:${bg};color:${ink};}body{--chrome-scrim:${chromeScrim};}`}</style>
      ) : (
        <style>{`html,body{color:${ink};}body{--chrome-scrim:${chromeScrim};}`}</style>
      )}
      <Nav />
      <ProjectNav
        slug={slug}
        title={project.title}
        description={project.description}
        prev={prev}
        next={next}
        navigableProjects={navigableProjects}
      />
      <ProjectMobileBottomNav
        slug={slug}
        prev={prev}
        next={next}
        navigableProjects={navigableProjects}
      />
      <main
        className={[
          project.imageBelowTitle ? "image-below-title" : "",
          project.fullbleed ? "fullbleed" : "",
          project.format === "v2" ? "project-v2" : "",
        ]
          .filter(Boolean)
          .join(" ")}
        data-project-slug={project.slug}
        style={bg ? { background: bg } : undefined}
      >
        {project.format === "v2" ? (
          <ProjectRenderer project={project}>
            <MDXRemote
              source={project.content}
              components={mdxPieceComponents}
            />
          </ProjectRenderer>
        ) : (
          <MDXRemote source={project.content} components={mdxComponents} />
        )}
      </main>
    </CarouselStateProvider>
  );
}
