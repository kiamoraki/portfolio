/**
 * Barrel export for the content model.
 *
 * Re-exports every primitive + the `<Piece>` wrapper + ColorMode so
 * downstream code (the new MDX components map, the project renderer,
 * the meta carousel) has a single import path.
 *
 * Phase 1: nothing imports this yet. It exists so Phase 2 has a
 * stable, public surface to point MDX at.
 */
export { Piece, PieceFilter } from "./Piece";
export { ColorMode, ColorModeBody } from "./ColorMode";
export { ProjectRenderer } from "./ProjectRenderer";
export {
  Img,
  Cover,
  Single,
  Hero,
  Pair,
  Row,
  RowCover,
  Grid,
  Grid2x2,
  Grid3x2,
  StackPairSide,
  Stack3PairSide,
  VideoTopLeft,
  Video,
  Iframe,
} from "./primitives";
export { Sketch, SketchOverlay } from "./Sketch";
export { Text, Credits } from "./Text";

/**
 * MDX components map for new-format project MDX. When the
 * `<ProjectRenderer>` in Phase 2 picks up a project that uses the new
 * `<Piece>` model, it'll pass this map to `<MDXRemote>` so author-written
 * tags like `<Cover>`, `<Pair>`, `<Sketch>` resolve to the primitives.
 *
 * Note: this intentionally shadows the legacy `Row`, `Text`, `Credits`
 * from `mdxComponents` (which still serve the un-migrated projects).
 * The legacy and new maps are mutually exclusive — a project picks one
 * via its frontmatter (in Phase 2, e.g. `format: "v2"`).
 */
import { Piece } from "./Piece";
import {
  Img,
  Cover,
  Single,
  Hero,
  Pair,
  Row,
  RowCover,
  Grid,
  Grid2x2,
  Grid3x2,
  StackPairSide,
  Stack3PairSide,
  VideoTopLeft,
  Video,
  Iframe,
} from "./primitives";
import { Sketch, SketchOverlay } from "./Sketch";
import { Text, Credits } from "./Text";

export const mdxPieceComponents = {
  Piece,
  Img,
  Cover,
  Single,
  Hero,
  Pair,
  Row,
  RowCover,
  Grid,
  Grid2x2,
  Grid3x2,
  StackPairSide,
  Stack3PairSide,
  VideoTopLeft,
  Video,
  Iframe,
  Sketch,
  SketchOverlay,
  Text,
  Credits,
};
