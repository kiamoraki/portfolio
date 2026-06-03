/**
 * Server-side helpers for the content index.
 *
 * Reads `lib/content-index.json` (built by
 * `scripts/build-content-index.mjs`) and exposes typed accessors so
 * page routes can ask "how many pieces does project X have?" without
 * needing DOM measurement on the client.
 */
import indexJson from "./content-index.json";
import type { PieceIndexEntry } from "./content-types";

const index = indexJson as PieceIndexEntry[];

export function getPiecesForProject(slug: string): PieceIndexEntry[] {
  return index
    .filter((p) => p.projectSlug === slug)
    .sort((a, b) => a.indexInProject - b.indexInProject);
}
