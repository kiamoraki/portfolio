"use client";

import { useEffect, useState } from "react";

import { RadialsCanvas } from "./RadialsCanvas";

/**
 * The emergence project's tuning of `RadialsCanvas`.
 *
 * `RadialsCanvas` is the generic sketch; this fixes the counts the
 * emergence page wants without editing the sketch's own defaults,
 * which is the repo convention (scale props default to 1 so any other
 * caller keeps the unmodified behaviour). The base counts inside the
 * sketch are 24 radials / 100 particles on desktop and 12 / 50 on
 * mobile, so these scales land at roughly 14 / 60 and 7 / 30 — a
 * visibly sparser field where individual rings and their orbiting
 * dots stay legible instead of overlapping into texture.
 *
 * Both knobs are separate on purpose: thin the dots without thinning
 * the rings by moving only `particleCountScale`.
 */
export function EmergenceCanvas(props: { inFlow?: boolean }) {
  /* Mobile gets tighter rings and slower motion: the sketch is a
     343px square there rather than a full column, so the base 10px
     ring step reads as coarse and the base velocities as frantic.
     Read in an effect so server and first client render agree. */
  const [isMobile, setIsMobile] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setIsMobile(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  return (
    <RadialsCanvas
      {...props}
      radialCountScale={0.6}
      particleCountScale={0.6}
      ringStepScale={isMobile ? 0.7 : 1}
      speedScale={isMobile ? 0.6 : 1}
    />
  );
}
