"use client";

import { useState } from "react";
import { ContactModal } from "./ContactModal";

/**
 * Replacement for the old `<a href="mailto:...">` email link in the
 * /about socials rail. Renders a styled button that opens the
 * `<ContactModal>` (sends through Web3Forms). Keeps the `.icon-
 * standard` class so it slots into the existing socials list
 * styling without any layout changes.
 */
export function ContactButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        className="icon-standard contact-trigger"
        onClick={() => setOpen(true)}
        aria-label="Send Kirby an email via the contact form"
        aria-haspopup="dialog"
      >
        {/* Inline SVG envelope — TWO simple filled shapes: rectangle
            for the body + triangle for the flap. Both `fill=
            "currentColor"` to match the visual weight of the other
            socials rail icons (Patreon, Mixcloud, Substack — all use
            simple filled paths). Was the compact Material Icons
            multi-subpath silhouette which the user couldn't see — this
            split-shape version is more obviously legible. */}
        <svg
          viewBox="0 0 24 24"
          width="20"
          height="20"
          aria-hidden="true"
        >
          {/* Reference: rounded-rectangle envelope body + V-flap cut
              all the way through (showing whatever bg is behind the
              icon, not a hard-coded white line). Achieved with an SVG
              mask — the rect is the visible body, masked by a full-
              white square with the V drawn in BLACK on top of it; in
              SVG mask space, white = visible / black = transparent, so
              the V carves through the rect leaving real transparency
              where the line is. Single static `mask` id is safe since
              there's only one ContactButton mounted at a time. */}
          <mask id="ck-envelope-mask">
            <rect width="24" height="24" fill="white" />
            <path
              d="M3 7 L12 15 L21 7"
              fill="none"
              stroke="black"
              strokeWidth={2.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </mask>
          <rect
            x="2"
            y="5"
            width="20"
            height="14"
            rx="2"
            fill="currentColor"
            mask="url(#ck-envelope-mask)"
          />
        </svg>
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
