"use client";

import { useState, type ReactNode } from "react";

type Props = {
  header: ReactNode;
  socials: ReactNode;
  cv: ReactNode;
  timeline: ReactNode;
};

export function AboutTabs({ header, socials, cv, timeline }: Props) {
  const [tab, setTab] = useState<"cv" | "timeline">("cv");

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
        <div className="about-tab-panel" role="tabpanel">
          {tab === "cv" ? cv : timeline}
        </div>
      </section>
    </>
  );
}
