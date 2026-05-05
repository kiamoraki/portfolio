"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type Props = { theme?: "dark" | "light" };

export function Nav({ theme = "light" }: Props) {
  const pathname = usePathname();
  const isIndex = pathname === "/";
  const isAbout = pathname === "/about";
  const dark = theme === "dark";

  return (
    <nav className={`nav-main ${dark ? "dark" : ""}`}>
      <Link href="/" className={`icon-standard ${isIndex ? "active" : ""}`} aria-label="Home">
        grid
      </Link>
      <Link href="/about" className={`icon-standard ${isAbout ? "active" : ""}`} aria-label="About">
        info
      </Link>
    </nav>
  );
}
