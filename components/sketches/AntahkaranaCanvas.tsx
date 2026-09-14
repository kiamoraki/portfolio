"use client";

import { loadP5 } from "./loadP5";

import { useEffect, useRef } from "react";

/**
 * Antahkarana — the elongated bipyramid from `Antahkarana.png`, rebuilt
 * as live geometry.
 *
 * The solid is two square pyramids joined at a shared square base: one
 * apex above the equator, a longer one below. It is drawn as a stack of
 * horizontal square cross-sections — the "slices" — plus the four side
 * faces of the frustum between each neighbouring pair. Every polygon is
 * translucent, so the facade IS the accumulated slice colour: where
 * front and back faces overlap the hue doubles up, and the run between
 * two slices reads as a gradient from one slice's colour to the next.
 *
 * Unlike the source image, where the slices bunch toward the bottom
 * tip, these are distributed evenly over the full height.
 *
 * Proportions are measured off the source: the silhouette is 0.365 as
 * wide as it is tall, and the equator (its widest point) sits 42.8% of
 * the way down. The hue ramp runs 300° → -20°, i.e. magenta at the top
 * apex through blue, cyan, green and yellow to red at the bottom.
 */

// Fraction of the total height above the equator; the rest is below.
const UPPER_FRACTION = 0.428;
// Silhouette width ÷ height.
const WIDTH_RATIO = 0.365;
// Camera elevation. Sets how much the horizontal squares foreshorten:
// a cross-section is drawn `sin(ELEVATION)` as tall as it is wide.
const ELEVATION = (21 * Math.PI) / 180;

const SLICES_DESKTOP = 13;
const SLICES_MOBILE = 10;
const MOBILE_BREAKPOINT = 720;

// Per-polygon alpha. Faces are the bulk of the facade; the slices
// themselves are drawn again on top, a little stronger, so each
// cross-section reads as a crisp diamond inside the gradient.
const FACE_ALPHA = 0.3;
const SLICE_ALPHA = 0.3;

const HUE_TOP = 300;
const HUE_BOTTOM = -20;

// Radians per frame at 30fps — a full turn takes about 80 seconds.
const SPIN_SPEED = 0.0026;

type Props = {
  /** Forwarded by the `Sketch` primitive: size to the wrapper instead
   *  of the viewport, and position absolutely inside it. */
  inFlow?: boolean;
  /** Overall scale of the solid inside its box. */
  sizeScale?: number;
  /** Multiplies the slice count. */
  countScale?: number;
  /** Multiplies the rotation speed. */
  speedScale?: number;
};

export function AntahkaranaCanvas({
  inFlow = false,
  sizeScale = 1,
  countScale = 1,
  speedScale = 1,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const inFlowRef = useRef(inFlow);
  const scalesRef = useRef({ sizeScale, countScale, speedScale });
  useEffect(() => {
    inFlowRef.current = inFlow;
    scalesRef.current = { sizeScale, countScale, speedScale };
  }, [inFlow, sizeScale, countScale, speedScale]);

  useEffect(() => {
    let p5Instance: import("p5") | null = null;
    let cancelled = false;
    let io: IntersectionObserver | null = null;
    let ro: ResizeObserver | null = null;

    (async () => {
      const P5 = await loadP5();
      if (cancelled || !containerRef.current) return;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      p5Instance = new P5((p: any) => {
        let spin = 0;

        const getDims = (): [number, number] => {
          if (inFlowRef.current && containerRef.current) {
            return [
              containerRef.current.clientWidth,
              containerRef.current.clientHeight,
            ];
          }
          return [p.windowWidth, p.windowHeight];
        };

        const sliceCount = () => {
          const base =
            p.width <= MOBILE_BREAKPOINT ? SLICES_MOBILE : SLICES_DESKTOP;
          return Math.max(6, Math.round(base * scalesRef.current.countScale));
        };

        /* Height of the whole solid in pixels, fitted to the box on
           whichever axis binds first. */
        const solidHeight = () => {
          const byHeight = p.height * 0.92;
          const byWidth = (p.width * 0.86) / WIDTH_RATIO;
          return Math.min(byHeight, byWidth) * scalesRef.current.sizeScale;
        };

        /* Half-diagonal of the square cross-section at normalised
           height `t` (0 at the top apex, 1 at the bottom apex). Peaks
           at the equator and tapers linearly to zero at both tips —
           the profile of a bipyramid. */
        const radiusAt = (t: number, maxR: number) =>
          t <= UPPER_FRACTION
            ? maxR * (t / UPPER_FRACTION)
            : maxR * ((1 - t) / (1 - UPPER_FRACTION));

        /* One cross-section's four corners, already projected. The
           square lies horizontally, so its corners orbit the vertical
           axis; the camera's elevation squashes that orbit into an
           ellipse, which is what makes each slice read as a diamond. */
        const corners = (
          t: number,
          maxR: number,
          H: number,
          cx: number,
          cy: number,
        ) => {
          const r = radiusAt(t, maxR);
          const y = (t - UPPER_FRACTION) * H;
          const out: [number, number][] = [];
          for (let k = 0; k < 4; k++) {
            const a = spin + (k * Math.PI) / 2;
            const wx = r * Math.cos(a);
            const wz = r * Math.sin(a);
            out.push([cx + wx, cy + y * Math.cos(ELEVATION) + wz * Math.sin(ELEVATION)]);
          }
          return out;
        };

        const hueAt = (t: number) => HUE_TOP + (HUE_BOTTOM - HUE_TOP) * t;

        p.setup = () => {
          const [cw, ch] = getDims();
          const c = p.createCanvas(cw, ch);
          c.style("display", "block");
          p.frameRate(30);
          p.colorMode(p.HSB, 360, 100, 100, 1);
          p.noStroke();
        };

        p.windowResized = () => {
          const [cw, ch] = getDims();
          p.resizeCanvas(cw, ch);
          // `resizeCanvas` rewrites the element's inline width/height,
          // which drops the display style set at setup.
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p as any).canvas?.style?.setProperty("display", "block");
        };

        p.draw = () => {
          // Transparent, so the sketch takes whatever page colour it
          // is placed on (same reasoning as RadialsCanvas).
          p.clear();

          const H = solidHeight();
          const maxR = (H * WIDTH_RATIO) / 2;
          const cx = p.width / 2;
          const cy = p.height / 2;
          const n = sliceCount();

          // Every cross-section, top apex to bottom apex.
          const rings: [number, number][][] = [];
          for (let i = 0; i <= n; i++) {
            rings.push(corners(i / n, maxR, H, cx, cy));
          }

          // Side faces first: four per band, front and back both drawn,
          // so the overlap builds the translucent gradient.
          for (let i = 0; i < n; i++) {
            const t = (i + 0.5) / n;
            p.fill(p.color(hueAt(t), 92, 88, FACE_ALPHA));
            const a = rings[i];
            const b = rings[i + 1];
            for (let k = 0; k < 4; k++) {
              const k2 = (k + 1) % 4;
              p.beginShape();
              p.vertex(a[k][0], a[k][1]);
              p.vertex(a[k2][0], a[k2][1]);
              p.vertex(b[k2][0], b[k2][1]);
              p.vertex(b[k][0], b[k][1]);
              p.endShape(p.CLOSE);
            }
          }

          // Then the slices themselves, over the top.
          for (let i = 1; i < n; i++) {
            const t = i / n;
            p.fill(p.color(hueAt(t), 92, 88, SLICE_ALPHA));
            const c4 = rings[i];
            p.beginShape();
            for (const [x, y] of c4) p.vertex(x, y);
            p.endShape(p.CLOSE);
          }

          spin += SPIN_SPEED * scalesRef.current.speedScale;
        };
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      }, containerRef.current) as any;

      if (!cancelled && containerRef.current) {
        // Pause offscreen.
        io = new IntersectionObserver(
          (entries) => {
            for (const e of entries) {
              if (e.isIntersecting) {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p5Instance as any)?.loop?.();
              } else {
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                (p5Instance as any)?.noLoop?.();
              }
            }
          },
          { threshold: 0.05 },
        );
        io.observe(containerRef.current);

        // A container resize (column layout, mobile stack) fires no
        // window resize, so watch the box directly.
        ro = new ResizeObserver(() => {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          (p5Instance as any)?.windowResized?.();
        });
        ro.observe(containerRef.current);
      }
    })();

    return () => {
      cancelled = true;
      io?.disconnect();
      ro?.disconnect();
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p5Instance as any)?.remove?.();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      id="Antahkarana_Canvas"
      style={
        inFlow
          ? { position: "absolute", inset: 0, pointerEvents: "none" }
          : { position: "fixed", inset: 0, zIndex: -1, pointerEvents: "none" }
      }
    />
  );
}
