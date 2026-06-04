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
          fill="currentColor"
          aria-hidden="true"
        >
          {/* Classic envelope silhouette — pentagon with a V-valley
              cut at the top edge (the open flap). Reads unambiguously
              as a mail icon at small sizes without needing inner
              detail. */}
          <polygon points="3,7 12,13 21,7 21,19 3,19" />
        </svg>
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
