"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

type Props = {
  header: ReactNode;
  socials: ReactNode;
  cv: ReactNode;
  timeline: ReactNode;
};

export function AboutTabs({ header, socials, cv, timeline }: Props) {
  const [tab, setTab] = useState<"cv" | "timeline">("cv");
  const panelRef = useRef<HTMLDivElement>(null);

  // CV + Timeline panels host a long list of external references
  // (workplaces, schools, residencies, etc.) — open every link in a
  // new tab so the user doesn't lose their place on this page. Done
  // here in one shot via a panel-scoped DOM sweep rather than hand-
  // editing `target="_blank" rel="noopener noreferrer"` onto each of
  // the ~50 `<a>` tags in app/about/page.tsx. Re-runs on tab swap so
  // the freshly-mounted panel's links also get wired. Skips
  // `mailto:`, `tel:`, and in-page `#` anchors — those should stay
  // in-context.
  useEffect(() => {
    const panel = panelRef.current;
    if (!panel) return;
    panel.querySelectorAll<HTMLAnchorElement>("a[href]").forEach((a) => {
      const href = a.getAttribute("href") ?? "";
      if (
        href.startsWith("mailto:") ||
        href.startsWith("tel:") ||
        href.startsWith("#")
      ) {
        return;
      }
      a.setAttribute("target", "_blank");
      a.setAttribute("rel", "noopener noreferrer");
    });
  }, [tab]);

  return (
    <>
      <section id="about-info">
        {header}
        {socials}
      </section>
      <section id="about-cv">
        <div className="about-tabs" role="tablist" aria-label="About sections">
          <button
            type="button"
            role="tab"
            aria-selected={tab === "cv"}
            className={`about-tab${tab === "cv" ? " active" : ""}`}
            onClick={() => setTab("cv")}
            data-label="CV"
          >
            CV
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={tab === "timeline"}
            className={`about-tab${tab === "timeline" ? " active" : ""}`}
            onClick={() => setTab("timeline")}
            data-label="Timeline"
          >
            Timeline
          </button>
        </div>
        <div className="about-tab-panel" role="tabpanel" ref={panelRef}>
          {tab === "cv" ? cv : timeline}
        </div>
      </section>
    </>
  );
}
