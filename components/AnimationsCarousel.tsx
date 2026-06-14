/**
 * AnimationsCarousel — the paged piece-level carousel that lives at
 * `/projects/animations/`. One slide per piece tagged `animations`
 * across every v2 project. Used to be a tag-parameterized
 * `<TagCarousel>` that also handled by-project meta pages; the
 * activation + design meta pages now render via `<TagIndex>` instead,
 * so this is the single remaining piece-paged surface.
 *
 * Slide DOM shape (`.project-track > .project-track-content`) and
 * data attributes (`data-slug`, `data-title`, `data-description`)
 * match what `<ProjectRenderer>` emits on the standalone project
 * page, so the same CSS rules drive both views.
 */
import dynamic from "next/dynamic";
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllProjects } from "@/lib/projects";
import { getPiecesForProject } from "@/lib/content-pieces";
import { PieceFilter, mdxPieceComponents } from "@/components/content";

// `MetaCarousel` is the only consumer of the carousel client bundle
// (~7 KB minified plus its full React hooks tree). Static-importing
// it dragged that chunk into every `/projects/[slug]` page's client
// bundle, even though only `/projects/animations` actually renders
// the carousel. `next/dynamic` puts MetaCarousel in its own chunk
// loaded on demand — non-animations project pages no longer pay for
// it. `ssr: false` is NOT used here because AnimationsCarousel is
// itself a server component (no "use client" directive) and Next
// disallows `ssr: false` inside server components — default `ssr:
// true` still produces the code-split chunk we want.
const MetaCarousel = dynamic(() =>
  import("@/components/MetaCarousel").then((m) => m.MetaCarousel),
);

const ANIMATIONS_TAG = "animations";

export function AnimationsCarousel() {
  const projects = getAllProjects().filter(
    (p) => !p.meta && p.format === "v2",
  );

  const slides = projects.flatMap((p) => {
    const pieces = getPiecesForProject(p.slug).filter((piece) =>
      piece.tags.includes(ANIMATIONS_TAG),
    );
    return pieces.map((piece) => (
      <div key={piece.pieceId} className="project-track">
        <div
          className="project-track-content"
          data-slug={piece.sketch?.id ?? piece.pieceId}
          data-title={p.title}
          data-description={p.description ?? ""}
        >
          <PieceFilter onlyPieceId={piece.pieceId}>
            <MDXRemote source={p.content} components={mdxPieceComponents} />
          </PieceFilter>
        </div>
      </div>
    ));
  });

  return <MetaCarousel slides={slides} />;
}
