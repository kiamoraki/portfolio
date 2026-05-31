"use client";

import { useEffect } from "react";

const SNAKE_PERIMETER_FRAC = 0.2;
const ANIMATION_DURATION_MS = 3500;
const MOBILE_BREAKPOINT = 720;
const MIN_DASH = 8;

export function MobileGridSnakes() {
  useEffect(() => {
    if (window.innerWidth >= MOBILE_BREAKPOINT) return;

    const lis = Array.from(
      document.querySelectorAll<HTMLLIElement>("#project-list li")
    );
    if (lis.length === 0) return;

    const rects: SVGRectElement[] = [];
    const svgs: SVGSVGElement[] = [];
    lis.forEach((li, i) => {
      const a = li.querySelector("a");
      if (!a) {
        rects.push(null as unknown as SVGRectElement);
        svgs.push(null as unknown as SVGSVGElement);
        return;
      }
      (a as HTMLElement).style.position = "relative";
      const svg = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "svg"
      );
      svg.style.position = "absolute";
      svg.style.top = "-9px";
      svg.style.left = "-9px";
      svg.style.width = "calc(100% + 18px)";
      svg.style.height = "calc(100% + 18px)";
      svg.style.pointerEvents = "none";
      svg.style.zIndex = "1";
      svg.setAttribute("preserveAspectRatio", "none");

      const defs = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "defs"
      );
      const pattern = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "pattern"
      );
      const patternId = `soslippery-${i}`;
      pattern.setAttribute("id", patternId);
      pattern.setAttribute("patternUnits", "userSpaceOnUse");
      pattern.setAttribute("width", "36");
      pattern.setAttribute("height", "36");
      const img = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "image"
      );
      img.setAttributeNS(
        "http://www.w3.org/1999/xlink",
        "href",
        "/img/soslippery-BIG-1-d3.gif"
      );
      img.setAttribute("href", "/img/soslippery-BIG-1-d3.gif");
      img.setAttribute("x", "0");
      img.setAttribute("y", "0");
      img.setAttribute("width", "36");
      img.setAttribute("height", "36");
      pattern.appendChild(img);
      defs.appendChild(pattern);
      svg.appendChild(defs);

      const r = document.createElementNS(
        "http://www.w3.org/2000/svg",
        "rect"
      );
      r.setAttribute("fill", "none");
      r.setAttribute("stroke", `url(#${patternId})`);
      r.setAttribute("stroke-width", "8");
      // CSS sizing so the stroke (centered on rect edges) sits fully
      // inside the SVG which itself fills the <a>'s outer (border-box)
      // bounds — i.e. the snake hugs the card edge with no inset.
      r.style.x = "4px";
      r.style.y = "4px";
      r.style.width = "calc(100% - 8px)";
      r.style.height = "calc(100% - 8px)";
      r.style.opacity = "0";
      svg.appendChild(r);
      a.appendChild(svg);
      svgs.push(svg);
      rects.push(r);
    });

    const pickIdx = (exclude: number) => {
      const vh = window.innerHeight;
      const visible: number[] = [];
      for (let k = 0; k < lis.length; k++) {
        if (k === exclude) continue;
        if (!rects[k]) continue;
        const b = lis[k].getBoundingClientRect();
        if (b.bottom > 0 && b.top < vh) visible.push(k);
      }
      if (visible.length > 0) {
        return visible[Math.floor(Math.random() * visible.length)];
      }
      const all: number[] = [];
      for (let k = 0; k < lis.length; k++) {
        if (k !== exclude && rects[k]) all.push(k);
      }
      return all.length > 0
        ? all[Math.floor(Math.random() * all.length)]
        : exclude;
    };

    let current = {
      cardIdx: pickIdx(-1),
      startTime: performance.now(),
      cornerIdx: Math.floor(Math.random() * 4),
    };

    let rafId: number;
    const tick = () => {
      const now = performance.now();
      const elapsed = now - current.startTime;
      const progress = Math.min(1, elapsed / ANIMATION_DURATION_MS);

      const r = rects[current.cardIdx];
      const li = lis[current.cardIdx];

      if (r && li) {
        const bbox = li.getBoundingClientRect();
        const w = bbox.width;
        const h = bbox.height;
        if (w > 0 && h > 0) {
          const perimeter = 2 * (w + h);
          const L = perimeter * SNAKE_PERIMETER_FRAC;
          // Three phases: grow MIN_DASH → L, cruise at L, shrink L → 0.
          const t1 = (L - MIN_DASH) / (perimeter + L - MIN_DASH);
          const t2 = (perimeter - MIN_DASH) / (perimeter + L - MIN_DASH);

          let tailPos: number;
          let headPos: number;
          if (progress < t1) {
            tailPos = 0;
            headPos = MIN_DASH + (progress / t1) * (L - MIN_DASH);
          } else if (progress < t2) {
            const phaseT = (progress - t1) / (t2 - t1);
            tailPos = phaseT * (perimeter - L);
            headPos = L + phaseT * (perimeter - L);
          } else {
            const phaseT = (progress - t2) / (1 - t2);
            tailPos = perimeter - L + phaseT * L;
            headPos = perimeter;
          }

          const cornerStarts = [0, w, w + h, 2 * w + h];
          const cornerStart = cornerStarts[current.cornerIdx];
          const dashLen = Math.max(0, headPos - tailPos);
          const gap = Math.max(0.5, perimeter - dashLen);
          r.setAttribute("stroke-dasharray", `${dashLen} ${gap}`);
          // Anchor to the head so any rounding sliver lives on the
          // previous side (about to vanish) instead of spilling clockwise
          // past the corner onto the next side.
          const anchorTail = headPos - dashLen;
          r.setAttribute(
            "stroke-dashoffset",
            `${-(cornerStart + anchorTail)}`
          );
          r.style.opacity = dashLen > 0 ? "1" : "0";
        }
      }

      if (elapsed >= ANIMATION_DURATION_MS) {
        if (r) r.style.opacity = "0";
        const nextIdx = pickIdx(current.cardIdx);
        current = {
          cardIdx: nextIdx,
          startTime: now,
          cornerIdx: Math.floor(Math.random() * 4),
        };
      }

      rafId = requestAnimationFrame(tick);
    };
    rafId = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafId);
      svgs.forEach((s) => s?.remove());
    };
  }, []);

  return null;
}
