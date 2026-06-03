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
import { MDXRemote } from "next-mdx-remote/rsc";
import { getAllProjects } from "@/lib/projects";
import { getPiecesForProject } from "@/lib/content-pieces";
import { MetaCarousel } from "@/components/MetaCarousel";
import { PieceFilter, mdxPieceComponents } from "@/components/content";

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
