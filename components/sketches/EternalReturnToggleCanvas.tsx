"use client";

import { useEffect, useRef, useState } from "react";
import {
  EternalReturnUnobservedCanvas,
  type EternalReturnCanvasController,
} from "@/components/sketches/EternalReturnUnobservedCanvas";

/**
 * Revival of the closed-eye / open-eye toggle from the old
 * EternalReturnCarousel (commit e78929f). Renders the unobserved
 * canvas at full size and overlays two pressed-state buttons that
 * flip the canvas's `triggered` state via the imperative controller
 * — closed eye = unobserved (`triggered: false`, the meditative
 * grid), open eye = observed (`triggered: true`, the cells dismantle
 * into the big sensor cells then settle into the meditative observed
 * loop).
 *
 * Standalone-page only: when this lands in the animations meta
 * carousel slide, the buttons still work but read as a small extra
 * affordance; users can also just swipe to advance.
 */
type Props = {
  /** Forwarded by `Sketch` primitive — when true the underlying
   *  canvas renders as `position: absolute; inset: 0` to fill its
   *  parent `.piece-sketch` wrapper instead of escaping to viewport-
   *  fixed. Mirroring it down here is what kept the canvas attached
   *  to the toggle wrapper so the meditative unobserved grid is
   *  actually visible on page load. */
  inFlow?: boolean;
  /** Contain the grid inside the canvas instead of letting it bleed
   *  past the edges. Forwarded straight to the underlying canvas; see
   *  its `fitInside` prop. Set by the split-layout 16:9 frame. */
  fitInside?: boolean;
};

export function EternalReturnToggleCanvas({
  inFlow = false,
  fitInside = false,
}: Props) {
  const ref = useRef<EternalReturnCanvasController>(null);
  const [observed, setObserved] = useState(false);

  // Lock the grid to 4 columns on a phone. Paired with the 4:3 box the
  // mobile stylesheet gives this sketch, the canvas's own
  // `rows = floor(height / cellSize)` (cellSize = width / cols) lands
  // on exactly 3 rows — a 4x3 grid. Left undefined on desktop, where
  // the column count is derived from `TARGET_CELL_SIZE`.
  //
  // Initialised LAZILY from `matchMedia`, not in an effect. Reading it
  // in an effect lost a race: the sketch's `layoutGrid` runs inside
  // p5's `setup`, and on a client-side navigation from the project
  // grid the p5 chunk is already cached, so `setup` ran before the
  // effect had set `cols` — the grid fell back to the column count
  // derived from `TARGET_CELL_SIZE` (3 columns, 2 rows) and the same
  // page rendered 4x3 or 3x2 depending on which won.
  //
  // Safe despite differing between server and client: `cols` feeds the
  // canvas's drawing only, never the rendered markup, so there is no
  // hydration mismatch to report. The effect below still handles a
  // viewport CHANGE after mount.
  const [mobileCols, setMobileCols] = useState<number | undefined>(() =>
    typeof window !== "undefined" &&
    window.matchMedia("(max-width: 720px)").matches
      ? 4
      : undefined,
  );
  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const sync = () => setMobileCols(mq.matches ? 4 : undefined);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  const flip = (next: boolean) => {
    if (next === observed) return;
    setObserved(next);
    ref.current?.setTriggered(next);
  };

  return (
    <div className="eternal-return-toggle">
      {/* Controls sit ABOVE the canvas, which fills whatever height is
          left. Two explicit labelled buttons rather than one toggle:
          the states are named ("unobserved" / "observed") and a single
          eye glyph made you infer which state the icon represented,
          current or available. */}
      <div className="eternal-return-toggle__buttons" role="group" aria-label="Observation state">
        <button
          type="button"
          className={`eternal-return-toggle__btn${
            observed ? "" : " eternal-return-toggle__btn--active"
          }`}
          aria-pressed={!observed}
          onClick={() => flip(false)}
        >
          <svg
            className="eternal-return-toggle__icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 14 C 7 18, 17 18, 21 14" />
            <path d="M5 16 L 4 18" />
            <path d="M9 17.5 L 8.5 19.5" />
            <path d="M15 17.5 L 15.5 19.5" />
            <path d="M19 16 L 20 18" />
          </svg>
          <span className="eternal-return-toggle__label">Unobserved</span>
        </button>
        <button
          type="button"
          className={`eternal-return-toggle__btn${
            observed ? " eternal-return-toggle__btn--active" : ""
          }`}
          aria-pressed={observed}
          onClick={() => flip(true)}
        >
          <svg
            className="eternal-return-toggle__icon"
            viewBox="0 0 24 24"
            width="18"
            height="18"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M2 12 C 5 7, 10 5, 12 5 C 14 5, 19 7, 22 12 C 19 17, 14 19, 12 19 C 10 19, 5 17, 2 12 Z" />
            <circle cx="12" cy="12" r="3.2" fill="currentColor" stroke="none" />
          </svg>
          <span className="eternal-return-toggle__label">Observed</span>
        </button>
      </div>
      {/* Positioned wrapper: the canvas renders `position: absolute;
          inset: 0` under `inFlow`, so it fills THIS box rather than the
          whole toggle (which now also contains the buttons). */}
      <div className="eternal-return-toggle__canvas">
        <EternalReturnUnobservedCanvas
          ref={ref}
          controlled
          inFlow={inFlow}
          fitInside={fitInside}
          cols={mobileCols}
        />
      </div>
    </div>
  );
}
