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
      {/* Hide the CV chip on the CV page itself — once the user is on
          /about there's nothing for the chip to do, and showing it
          adds a redundant button to the chrome row. */}
      {isAbout ? null : (
        <Link href="/about" className="nav-info" aria-label="About">
          <span className="nav-info-label">cv</span>
        </Link>
      )}
    </>
  );
}
