/**
 * TagIndex — server component that renders a project-tile grid filtered
 * by a single tag. Used as the body of the meta routes that DON'T page
 * through pieces:
 *
 *   /projects/activations  →  <TagIndex tag="activation" />
 *   /projects/design       →  <TagIndex tag="design" />
 *
 * (Animations stays on a piece-level carousel — handled separately.)
 *
 * Each tile's `<Link>` carries `?tag=…` so the chrome's PREV/NEXT on
 * the destination project page can scope the project ring to other
 * projects sharing the same tag. See `getProjectNeighbors(slug, tag)`
 * in lib/projects.ts.
 */
import { getAllProjects } from "@/lib/projects";
import { ProjectGrid } from "@/components/ProjectGrid";

export function TagIndex({ tag }: { tag: string }) {
  const projects = getAllProjects().filter((p) => {
    if (p.meta) return false;
    if (p.navHidden) return false;
    if (p.hidden) return false;
    return (p.tags ?? []).includes(tag);
  });

  return <ProjectGrid projects={projects} linkSuffix={`?tag=${tag}`} />;
}
