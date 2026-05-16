"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavProject = { slug: string; title: string };
type Props = { theme?: "dark" | "light"; projects: NavProject[] };

export function NavClient({ theme = "light", projects }: Props) {
  const pathname = usePathname();
  const isIndex = pathname === "/";
  const isAbout = pathname === "/about";
  const dark = theme === "dark";
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className={`nav-main ${dark ? "dark" : ""}`}>
        <Link
          href="/"
          className={`icon-standard ${isIndex ? "active" : ""}`}
          aria-label="Home"
        >
          grid
        </Link>
        <Link
          href="/about"
          className={`icon-standard ${isAbout ? "active" : ""}`}
          aria-label="About"
        >
          info
        </Link>
        <button
          type="button"
          aria-label="Project list"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen((v) => !v)}
          style={{
            width: "var(--spacing-nav-h)",
            height: "var(--spacing-nav-h)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 3,
            color: menuOpen
              ? dark
                ? "var(--color-dark)"
                : "var(--color-light)"
              : dark
                ? "var(--color-light)"
                : "var(--color-dark)",
            background: menuOpen
              ? dark
                ? "var(--color-light)"
                : "var(--color-dark)"
              : "transparent",
            border: 0,
            cursor: "pointer",
            padding: 0,
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
            <path
              d="M3 6h18M3 12h18M3 18h18"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </svg>
        </button>
      </nav>
      {menuOpen ? (
        <ul
          style={{
            position: "fixed",
            left: "var(--spacing-nav-h)",
            top: 0,
            zIndex: 5001,
            margin: 0,
            padding: "1.25rem 1.5rem",
            listStyle: "none",
            background: "rgba(0, 0, 0, 0.85)",
            color: "var(--color-light)",
            maxHeight: "100vh",
            overflowY: "auto",
            fontFamily: "var(--font-bold)",
            textTransform: "uppercase",
            fontSize: 14,
            letterSpacing: "0.04em",
          }}
        >
          {projects.map((p) => (
            <li key={p.slug} style={{ margin: "0.45em 0" }}>
              <Link
                href={`/projects/${p.slug}`}
                onClick={() => setMenuOpen(false)}
                style={{ color: "var(--color-light)" }}
              >
                {p.title}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
    </>
  );
}
