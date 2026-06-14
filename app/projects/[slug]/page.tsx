import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
// Per-project CSS rules extracted from globals.css by
// `scripts/split-project-css.mjs`. Imported only on this route so
// other pages (homepage, /about, /projects/animations meta page)
// skip the chunk — saves ~33KB of CSS off those routes.
import "@/app/project-page.css";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { ProjectMobileBottomNav } from "@/components/ProjectMobileBottomNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { mdxComponents } from "@/components/mdx";
import {
  ProjectRenderer,
  mdxPieceComponents,
} from "@/components/content";
import { ScrollAffordances } from "@/components/content/ScrollAffordances";
import {
  getAllProjects,
  getNavigableProjects,
  getProject,
  getProjectNeighbors,
} from "@/lib/projects";
import { getPiecesForProject } from "@/lib/content-pieces";
import imageManifest from "@/lib/image-manifest.json";

const manifest = imageManifest as Record<string, { width: number; height: number }>;

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

  // Piece count for the scroll affordances (cue + dots). Computed
  // server-side so the client component doesn't have to wait for
  // DOM mount to know whether to render. Only multi-piece projects
  // get the affordances; single-piece pages skip them.
  const pieces = getPiecesForProject(slug);
  const pieceCount = pieces.length;

  // LCP image preload — `build-content-index.mjs` captures the `src`
  // of the first image-bearing primitive in each project's first piece
  // as `lcpImage`. If the AVIF sibling exists (per `image-manifest`),
  // preload THAT instead of the JPG — modern browsers (vast majority
  // of traffic) end up requesting AVIF via `<picture>` anyway, so the
  // preload should target the format they'll actually use. Browsers
  // that fall back to JPG won't use the AVIF preload, accepting a small
  // amount of wasted bandwidth on the long-tail in exchange for the
  // common-case LCP win. `type` + `fetchPriority="high"` give the
  // browser the strongest possible hint to fetch this first.
  const firstPiece = pieces[0];
  const lcpSrc = firstPiece?.lcpImage;
  let lcpPreloadHref: string | null = null;
  let lcpPreloadType: string | null = null;
  if (lcpSrc) {
    const avifSibling = lcpSrc.replace(/\.(jpe?g|png)$/i, ".avif");
    if (avifSibling !== lcpSrc && avifSibling in manifest) {
      lcpPreloadHref = avifSibling;
      lcpPreloadType = "image/avif";
    } else {
      lcpPreloadHref = lcpSrc;
    }
  }

  return (
    <CarouselStateProvider>
      {bg ? (
        <style>{`html,body{background:${bg};color:${ink};}body{--chrome-scrim:${chromeScrim};}`}</style>
      ) : (
        <style>{`html,body{color:${ink};}body{--chrome-scrim:${chromeScrim};}`}</style>
      )}
      {lcpPreloadHref ? (
        // eslint-disable-next-line @next/next/no-page-custom-font
        <link
          rel="preload"
          as="image"
          href={lcpPreloadHref}
          {...(lcpPreloadType ? { type: lcpPreloadType } : {})}
          fetchPriority="high"
        />
      ) : null}
      <Nav />
      {/* `ProjectNav`, `ProjectMobileBottomNav`, and (on the
          `shape-of-time` route) `ShapeOfTime` all call
          `useSearchParams()` to pick up `?tag=…`. Next 16's static
          export refuses to prerender a tree that suspends on a
          client search-params read unless it's inside a Suspense
          boundary — without these the build hard-fails on `Error
          occurred prerendering page "/projects/shape-of-time"`.
          Fallback is `null` so the chrome simply doesn't paint
          server-side; it hydrates in with the right ?tag values
          on the client. */}
      <Suspense fallback={null}>
        <ProjectNav
          slug={slug}
          title={project.title}
          description={project.description}
          prev={prev}
          next={next}
          navigableProjects={navigableProjects}
        />
      </Suspense>
      <Suspense fallback={null}>
        <ProjectMobileBottomNav
          slug={slug}
          prev={prev}
          next={next}
          navigableProjects={navigableProjects}
        />
      </Suspense>
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
        <Suspense fallback={null}>
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
        </Suspense>
      </main>
      {/* Scroll cue + slide dots — auto-hide when the project has
          one piece (no scroll affordance needed). Client component
          because it tracks scrollY + IntersectionObserver per piece. */}
      <ScrollAffordances pieceCount={pieceCount} />
    </CarouselStateProvider>
  );
}
