"use client";

import { useEffect, useRef, type RefObject } from "react";

type MirrorCanvasProps = {
  sourceRef: RefObject<HTMLCanvasElement | null>;
};

// Renders a canvas whose pixels are copied from `sourceRef` every frame.
// Used in the Lissajous carousel for wrap-around clone slots so the
// clone stays visually identical to its real counterpart, avoiding the
// jump that two independent p5 instances would produce.
export function MirrorCanvas({ sourceRef }: MirrorCanvasProps) {
  const dstRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    let raf = 0;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      const src = sourceRef.current;
      const dst = dstRef.current;
      if (src && dst) {
        if (dst.width !== src.width) dst.width = src.width;
        if (dst.height !== src.height) dst.height = src.height;
        const ctx = dst.getContext("2d");
        if (ctx) ctx.drawImage(src, 0, 0);
      }
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => {
      cancelled = true;
      cancelAnimationFrame(raf);
    };
  }, [sourceRef]);

  return (
    <canvas
      ref={dstRef}
      style={{
        width: "100%",
        height: "100%",
        display: "block",
        background: "#130c12",
      }}
    />
  );
}
