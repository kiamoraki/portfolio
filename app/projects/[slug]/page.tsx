import { Suspense } from "react";
import { notFound, redirect } from "next/navigation";
import { MDXRemote } from "next-mdx-remote/rsc";
// Per-project CSS rules extracted from globals.css by
// `scripts/split-project-css.mjs`. Imported only on this route so
// other pages (homepage, /about, /projects/animations meta page)
// skip the chunk — saves ~33KB of CSS off those routes.
import "@/app/project-page.css";
// The split template (1/3 text rail + 2/3 content column). Loaded on
// this route for every project; only pages with `layout: split` in
// frontmatter actually use the classes.
import "@/app/project-split.css";
import { Nav } from "@/components/Nav";
import { ProjectNav } from "@/components/ProjectNav";
import { ProjectMobileBottomNav } from "@/components/ProjectMobileBottomNav";
import { CarouselStateProvider } from "@/components/CarouselState";
import { SplitMediaCarousel } from "@/components/SplitMediaCarousel";
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

// Slugs with their own dedicated route file (e.g. app/projects/emergence/
// or app/projects/shape-of-time/). Those routes take precedence at
// request time, and MUST be excluded here so static-export doesn't try
// to build the same URL twice.
// Emptied 2026-08-01. `emergence` and `lissajous` had dedicated routes
// only to prototype the split layout, which is now a frontmatter
// opt-in on this shared template; both route directories were deleted.
// `shape-of-time` was listed here but never had a `page.tsx` (only a
// `grid/` subroute), so `/projects/shape-of-time/` was excluded from
// this template AND had no route of its own: it 404'd. Removing it
// here lets the shared template build it.
const SLUGS_WITH_DEDICATED_ROUTES = new Set<string>([]);

export function generateStaticParams() {
  return getAllProjects()
    .filter((p) => !SLUGS_WITH_DEDICATED_ROUTES.has(p.slug))
    .map((p) => ({ slug: p.slug }));
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
  // EXPERIMENT (2026-08-01): force every project page onto a white
  // background regardless of its `theme` / `bg` frontmatter. Flip this
  // to `false` to restore per-project theming; nothing else needs to
  // change, and no frontmatter was edited, so it's a one-line revert.
  //
  // NOTE this only governs the PAGE. Sketch canvases carry their own
  // `bg` (`<Sketch id="…" bg="#000" />`) and several paint their
  // background internally in p5, so dark artwork stays dark and now
  // reads as a framed panel on white rather than as full bleed.
  const FORCE_WHITE_PROJECT_BG = true;

  const theme = FORCE_WHITE_PROJECT_BG ? "light" : (project.theme ?? "light");
  const bg = FORCE_WHITE_PROJECT_BG
    ? "#fff"
    : (project.bg ?? (theme === "dark" ? "#020014" : undefined));
  // Page-level ink color, paired with bg below. Setting it on body via
  // the inline `<style>` block (instead of via a `.dark` className on
  // main) means the theme cascades from body to every descendant
  // naturally — including chrome elements like the nav icons (whose
  // `color: inherit` rules pick this up) and the meta-carousel title
  // chip — without forcing dark text onto light-bg slides inside the
  // meta carousel. The old `.dark` class globally set every h2 / span
  // inside main to off-white, which overrode the per-slide polarity
  // flip on TOBRIT / AC / Mars etc.
  // `--color-ink-light` (not `--color-light`) is the TEXT colour for
  // dark pages; the latter is also a background/border token.
  const ink =
    theme === "dark" ? "var(--color-ink-light)" : "var(--color-dark)";
  // Resolve color mode once here so the `--chrome-scrim` variable can
  // be SSR-rendered onto the body — `<ColorModeBody>` also sets
  // `body[data-color-mode]` in a client effect, but that runs AFTER
  // hydration, leaving the chrome chips un-scrim'd until JS catches
  // up. Inlining the variable bypasses the hydration wait entirely.
  const resolvedColorMode = FORCE_WHITE_PROJECT_BG
    ? "light"
    : (project.colorMode ?? (theme === "dark" ? "dark" : "light"));
  // `color-mix` for the light scrim (off-white `--color-light` with
  // 15% transparency); flat rgba for dark since the dark scrim is
  // just black with alpha and doesn't need to track a palette token.
  const chromeScrim =
    resolvedColorMode === "light"
      ? "color-mix(in srgb, var(--color-light) 85%, transparent)"
      : "rgba(0, 0, 0, 0.85)";

  // Pieces — still used below for the LCP image preload (we read the
  // first piece's `lcpImage`). The piece COUNT was previously also
  // used to drive the ScrollAffordances render, but the component is
  // now DOM-driven and self-discovers slots (so it covers legacy
  // projects too) — no count needed here anymore.
  const pieces = getPiecesForProject(slug);

  // Split template opt-in (frontmatter `layout: split`). The title moves
  // into the left rail, so ProjectNav's title chip is hidden via CSS
  // scoped to `.split-page`.
  const isSplit = project.layout === "split";
  // Frontmatter descriptions are authored as YAML block scalars, so
  // blank lines are real paragraph breaks. Projects without one get a
  // dimmed placeholder rather than an empty rail.
  const splitParagraphs = (project.description ?? "")
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean);

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

  // The content column. Identical in both templates; the split branch
  // just nests it in the grid beside the text rail.
  const mainEl = (
    <main
      className={[
        project.imageBelowTitle ? "image-below-title" : "",
        project.fullbleed ? "fullbleed" : "",
        project.format === "v2" ? "project-v2" : "",
        isSplit ? "split-content" : "",
      ]
        .filter(Boolean)
        .join(" ")}
      data-project-slug={project.slug}
      style={bg ? { background: bg } : undefined}
    >
      <Suspense fallback={null}>
        {isSplit ? (
          // Split pages present their pieces as a click-through
          // carousel rather than a scrolling stack.
          <SplitMediaCarousel>
            {project.format === "v2" ? (
              <ProjectRenderer project={project}>
                <MDXRemote source={project.content} components={mdxPieceComponents} />
              </ProjectRenderer>
            ) : (
              <MDXRemote source={project.content} components={mdxComponents} />
            )}
          </SplitMediaCarousel>
        ) : project.format === "v2" ? (
          <ProjectRenderer project={project}>
            <MDXRemote source={project.content} components={mdxPieceComponents} />
          </ProjectRenderer>
        ) : (
          <MDXRemote source={project.content} components={mdxComponents} />
        )}
      </Suspense>
    </main>
  );

  return (
    <CarouselStateProvider>
      {bg ? (
        // `--page-bg` is exposed so descendants can paint an OPAQUE
        // panel in the page's own colour. The split rail uses it to
        // occlude decorative <SketchOverlay> canvases (tobrit's faces)
        // that would otherwise show through behind the credits and
        // wreck the contrast.
        <style>{`html,body{background:${bg};color:${ink};}body{--chrome-scrim:${chromeScrim};--page-bg:${bg};}`}</style>
      ) : (
        <style>{`html,body{color:${ink};}body{--chrome-scrim:${chromeScrim};--page-bg:var(--color-light);}`}</style>
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
      {isSplit ? (
        <div className="split">
          <aside className="split-text">
            <h1 className="split-title">{project.title}</h1>
            {/* Destination for the carousel's "N/M" counter, which
                portals itself here (components/SplitMediaCarousel.tsx).
                Stays empty on single-slide projects. */}
            <div id="split-count-slot" />
            {splitParagraphs.length > 0 ? (
              <div className="split-description">
                {splitParagraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            ) : (
              <div className="split-description split-description--placeholder">
                <p>Add description here.</p>
              </div>
            )}
            {/* Destination for a project's <Credits> block, which
                portals itself here on split pages so the credits sit
                with the rest of the prose instead of taking a slide in
                the media carousel. Empty on projects without one. */}
            <div id="split-credits-slot" />
          </aside>
          {mainEl}
        </div>
      ) : (
        mainEl
      )}
      {/* Scroll cue + slide dots — auto-hide when the project has
          one piece (no scroll affordance needed). Client component
          because it tracks scrollY + IntersectionObserver per piece. */}
      {/* `ScrollAffordances` is DOM-driven — it discovers its own
          slot count after mount (counting `.piece` for v2 projects
          and top-level `.row` / `figure.image` / `.piece-layout`
          for legacy projects), so it lights up automatically on
          paintings + intergalactic-helm without page.tsx needing
          to know which format the project is. */}
      {/* Split-layout pages omit the scroll cue + slide dots. The rail
          already anchors the page and the dots read as clutter beside a
          columnar layout. Not mounted at all rather than hidden in CSS,
          so the scroll listener + per-piece IntersectionObservers are
          skipped too. Default-template projects keep them. */}
      {!isSplit && <ScrollAffordances />}
    </CarouselStateProvider>
  );
}
