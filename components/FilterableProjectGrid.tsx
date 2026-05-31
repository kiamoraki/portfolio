"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { Project } from "@/lib/projects";
import { ProjectGrid } from "@/components/ProjectGrid";
import {
  displayTag,
  getAllTagsInOrder,
  projectMatchesFilter,
} from "@/lib/tags";

// Tags that act as a direct link to a single project instead of filtering.
const TAG_TO_PROJECT: Record<string, string> = {
  painting: "paintings",
};

export function FilterableProjectGrid({ projects }: { projects: Project[] }) {
  const router = useRouter();
  const allTags = useMemo(() => getAllTagsInOrder(projects), [projects]);
  const [active, setActive] = useState<string | null>(null);

  const handleClick = (tag: string) => {
    const targetSlug = TAG_TO_PROJECT[tag];
    if (targetSlug) {
      router.push(`/projects/${targetSlug}`);
      return;
    }
    setActive((prev) => (prev === tag ? null : tag));
  };

  const filtered = useMemo(
    () => projects.filter((p) => projectMatchesFilter(p, active ? [active] : [])),
    [projects, active],
  );

  return (
    <>
      <nav className="project-filter" aria-label="Filter projects by tag">
        {allTags.map((tag) => {
          const on = active === tag;
          return (
            <button
              key={tag}
              type="button"
              className={`tag-chip${on ? " active" : ""}`}
              onClick={() => handleClick(tag)}
              aria-pressed={on}
            >
              {displayTag(tag)}
            </button>
          );
        })}
      </nav>
      <ProjectGrid projects={filtered} />
    </>
  );
}
