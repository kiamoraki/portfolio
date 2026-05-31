"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { theme?: "dark" | "light" };

export function NavClient({ theme = "light" }: Props) {
  const pathname = usePathname();
  const normalized = (pathname ?? "/").replace(/\/+$/, "") || "/";
  const isIndex = normalized === "/";
  const isAbout = normalized === "/about";
  const dark = theme === "dark";

  return (
    <>
      <div
        className={`mobile-header-frame ${dark ? "dark" : ""}`}
        aria-hidden="true"
      />
      <nav className={`nav-main ${dark ? "dark" : ""}`}>
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
      <Link
        href="/about"
        className={`nav-info ${isAbout ? "active" : ""} ${dark ? "dark" : ""}`}
        aria-label="About"
      >
        <span className="nav-info-label">cv</span>
      </Link>
    </>
  );
}
