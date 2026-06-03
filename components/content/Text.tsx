/**
 * Text & Credits — prose primitives.
 *
 * Both emit `.piece-layout--text` so the existing global
 * typography + spacing rules (lines ~1110 in globals.css) apply.
 */
import type { ReactNode } from "react";

export function Text({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--text">
      {children}
    </div>
  );
}

export function Credits({ children }: { children: ReactNode }) {
  return (
    <div className="piece-layout piece-layout--text piece-credits">
      {children}
    </div>
  );
}
