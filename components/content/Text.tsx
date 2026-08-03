"use client";

/**
 * Text & Credits — prose primitives.
 *
 * Both emit `.piece-layout--text` so the existing global
 * typography + spacing rules (lines ~1110 in globals.css) apply.
 *
 * `Credits` additionally RELOCATES itself on split-layout pages: the
 * credits are prose, and prose belongs in the text rail beside the
 * title and description rather than occupying a slide in the media
 * carousel. It portals into the `#split-credits-slot` element that the
 * split template renders in the rail, falling back to the normal
 * in-flow piece when that slot doesn't exist (every non-split page).
 */
import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

export function Text({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--text">
      {children}
    </div>
  );
}

export function Credits({ children }: { children: ReactNode }) {
  // Resolved in an effect, not during render: the slot lives in a
  // sibling subtree and SSR has no DOM. Until it resolves (and forever
  // on non-split pages) the credits render in place as before.
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  useEffect(() => {
    setSlot(document.getElementById("split-credits-slot"));
  }, []);

  if (slot) {
    return createPortal(
      <div className="split-credits">{children}</div>,
      slot,
    );
  }

  return (
    <div className="piece-layout piece-layout--text piece-credits">
      {children}
    </div>
  );
}
