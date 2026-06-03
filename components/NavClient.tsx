"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function NavClient() {
  const pathname = usePathname();
  const normalized = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const isIndex = normalized === "/";
  const isAbout = normalized === "/about";

  return (
    <>
      <div className="mobile-header-frame" aria-hidden="true" />
      <nav className="nav-main">
        <Link
          href="/"
          className={`icon-standard ${isIndex ? "active" : ""}`}
          aria-label="Home"
        >
          <svg
            className="nav-house-icon"
            viewBox="0 0 24 24"
            width="22"
            height="22"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M3 11.5 12 3l9 8.5" />
            <path d="M5 10v10h14V10" />
          </svg>
        </Link>
      </nav>
      {/* CV chip — always rendered so it stays in the chrome strip on
          every page. On /about itself it gets the `active` class, same
          rainbow-gif backdrop the Home button uses on the homepage. */}
      <Link
        href="/about"
        className={`nav-info ${isAbout ? "active" : ""}`}
        aria-label="About"
        aria-current={isAbout ? "page" : undefined}
      >
        <span className="nav-info-label">cv</span>
      </Link>
    </>
  );
}
