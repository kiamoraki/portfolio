"use client";

/**
 * ColorMode — applies a `data-color-mode` attribute to its target so
 * the CSS variables in globals.css resolve to the right palette.
 *
 * Two usage shapes:
 *   1. As a wrapper around content: `<ColorMode mode="light">…</ColorMode>`
 *      — sets the attribute on a wrapping `<div>` and any styles using
 *      `var(--cm-*)` inside resolve to the light palette.
 *   2. As a side-effect on the body: `<ColorModeBody mode="light" />` —
 *      sets `document.body.dataset.colorMode` from a client effect.
 *      Use this on project pages where the whole page chrome (sidebar
 *      icons, prev/next) should flip.
 *
 * Phase 1 only ships the components. They aren't wired into any page
 * yet — that happens in Phase 2 when projects are migrated.
 */
import { useEffect, type ReactNode } from "react";
import type { ColorMode as ColorModeValue } from "@/lib/content-types";

type WrapperProps = {
  mode: ColorModeValue;
  children: ReactNode;
  /** Optional className passthrough for the wrapping div. */
  className?: string;
};

export function ColorMode({ mode, children, className }: WrapperProps) {
  return (
    <div data-color-mode={mode} className={className}>
      {children}
    </div>
  );
}

type BodyProps = { mode: ColorModeValue };

export function ColorModeBody({ mode }: BodyProps) {
  useEffect(() => {
    if (typeof document === "undefined") return;
    const prev = document.body.dataset.colorMode;
    document.body.dataset.colorMode = mode;
    return () => {
      // Restore on unmount so navigating away from a light-mode project
      // doesn't leave the body class lingering.
      if (typeof document === "undefined") return;
      if (prev === undefined) {
        delete document.body.dataset.colorMode;
      } else {
        document.body.dataset.colorMode = prev;
      }
    };
  }, [mode]);
  return null;
}
