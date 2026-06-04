"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";

type Status = "idle" | "submitting" | "success" | "error";

/**
 * Web3Forms access key — get yours at https://web3forms.com/ (enter
 * the destination email and they send you a key, no signup). Then
 * set it as `NEXT_PUBLIC_WEB3FORMS_KEY` in `.env.local` so the bundle
 * picks it up at build time. The string is intentionally public —
 * Web3Forms scopes it to your email only.
 */
const ACCESS_KEY = process.env.NEXT_PUBLIC_WEB3FORMS_KEY ?? "";

type Props = {
  open: boolean;
  onClose: () => void;
};

export function ContactModal({ open, onClose }: Props) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const firstFieldRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  /* Open / close the dialog imperatively. `<dialog>.showModal()`
     handles the backdrop, the top-of-stacking-context z-index, focus
     management, and ESC-to-close natively. Mirroring it from React
     state keeps the call ergonomic. */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    if (open && !dlg.open) {
      dlg.showModal();
      // Reset form state every fresh open so the user doesn't see a
      // stale success / error from a previous session.
      setStatus("idle");
      setErrorMsg("");
      // Focus the first field on open. `setTimeout` so the showModal()
      // transition finishes first.
      window.setTimeout(() => firstFieldRef.current?.focus(), 0);
    } else if (!open && dlg.open) {
      dlg.close();
    }
  }, [open]);

  /* Native `<dialog>` fires a `close` event when the user hits ESC or
     the form submits via a `dialog`-method form. Route that back up
     to the React state so the parent knows the dialog is gone. */
  useEffect(() => {
    const dlg = dialogRef.current;
    if (!dlg) return;
    const onClosed = () => onClose();
    dlg.addEventListener("close", onClosed);
    return () => dlg.removeEventListener("close", onClosed);
  }, [onClose]);

  /* Click on the backdrop (outside the inner panel) closes the modal.
     `<dialog>`'s click target IS the backdrop when the click lands
     outside the inner content box, so we can detect it by checking
     whether the event target is the dialog itself. */
  const onBackdropClick = (e: React.MouseEvent<HTMLDialogElement>) => {
    if (e.target === dialogRef.current) onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!ACCESS_KEY) {
      setStatus("error");
      setErrorMsg(
        "Contact form isn't configured — set NEXT_PUBLIC_WEB3FORMS_KEY in .env.local.",
      );
      return;
    }
    setStatus("submitting");
    setErrorMsg("");
    const formData = new FormData(e.currentTarget);
    formData.set("access_key", ACCESS_KEY);
    // Default subject if the user didn't supply one — keeps Gmail's
    // threading sane and makes the inbox glance instantly identifiable.
    if (!formData.get("subject")) {
      formData.set("subject", "Message from kiamoraki.com");
    }
    try {
      const res = await fetch("https://api.web3forms.com/submit", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setStatus("success");
        e.currentTarget.reset();
      } else {
        setStatus("error");
        setErrorMsg(
          typeof data.message === "string"
            ? data.message
            : "Something went wrong sending the message.",
        );
      }
    } catch {
      setStatus("error");
      setErrorMsg(
        "Network error — couldn't reach the contact API. Please try again.",
      );
    }
  };

  return (
    <dialog
      ref={dialogRef}
      className="contact-modal"
      onClick={onBackdropClick}
      aria-labelledby="contact-modal-title"
    >
      <div className="contact-modal__inner">
        <button
          type="button"
          className="contact-modal__close"
          onClick={onClose}
          aria-label="Close contact form"
        >
          {/* `×` glyph rendered as a stroke SVG so it matches the rest
              of the chrome's `currentColor`-stroked icon family. */}
          <svg
            viewBox="0 0 24 24"
            width="20"
            height="20"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            aria-hidden="true"
          >
            <line x1="6" y1="6" x2="18" y2="18" />
            <line x1="18" y1="6" x2="6" y2="18" />
          </svg>
        </button>

        <h2 id="contact-modal-title" className="contact-modal__title">
          Get in touch
        </h2>

        {status === "success" ? (
          <p className="contact-modal__success" role="status">
            Thanks — your message is on its way. I&rsquo;ll reply soon.
          </p>
        ) : (
          <form className="contact-modal__form" onSubmit={handleSubmit}>
            {/* Honeypot — bots fill this; humans never see it. Web3Forms
                drops submissions where `botcheck` is non-empty. */}
            <input
              type="checkbox"
              name="botcheck"
              tabIndex={-1}
              aria-hidden="true"
              style={{ display: "none" }}
            />
            <label className="contact-modal__field">
              <span className="contact-modal__label">Your name</span>
              <input
                ref={firstFieldRef}
                type="text"
                name="name"
                required
                autoComplete="name"
                disabled={status === "submitting"}
              />
            </label>
            <label className="contact-modal__field">
              <span className="contact-modal__label">Your email</span>
              <input
                type="email"
                name="email"
                required
                autoComplete="email"
                disabled={status === "submitting"}
              />
            </label>
            <label className="contact-modal__field">
              <span className="contact-modal__label">Message</span>
              <textarea
                name="message"
                rows={5}
                required
                disabled={status === "submitting"}
              />
            </label>
            {status === "error" && errorMsg ? (
              <p className="contact-modal__error" role="alert">
                {errorMsg}
              </p>
            ) : null}
            <button
              type="submit"
              className="contact-modal__submit"
              disabled={status === "submitting"}
            >
              {status === "submitting" ? "Sending…" : "Send"}
            </button>
          </form>
        )}
      </div>
    </dialog>
  );
}
