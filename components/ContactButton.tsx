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
        mail
      </button>
      <ContactModal open={open} onClose={() => setOpen(false)} />
    </>
  );
}
