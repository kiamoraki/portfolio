/**
 * Shared layout for the Wave1–Wave6 + Eternal-Return cell-grid p5
 * sketches.
 *
 * Each wave canvas draws a grid of square cells (3×3 on desktop, 2×4
 * on portrait mobile) where every cell holds a small geometric
 * animation. The cell positions, gaps, and inner amplitudes depend
 * on the current viewport size — and on mobile that size can change
 * mid-session as Safari's URL bar appears/disappears (changing
 * `100dvh`) or the user rotates portrait/landscape.
 *
 * `computeWaveLayout()` re-derives every value from the box the
 * canvas actually occupies on desktop (published by the shell via
 * `setWaveBox`) and from `window.innerWidth × window.innerHeight` on
 * mobile. Each sketch holds a
 * mutable `layout` reference, calls `computeWaveLayout()` in setup
 * AND in `p.windowResized`, and re-creates the p5 canvas at the new
 * pixel dimensions — so the cells stay perfectly square and evenly
 * distributed regardless of how the browser chrome shifts the
 * viewport.
 *
 * The wrapper DOM size is handled separately by CSS (`.piece-sketch
 * [data-sketch-id^="wave-"]` on mobile uses `100vw × 100dvh` so the
 * canvas's pixel buffer matches its display dimensions 1:1, no CSS
 * scaling distortion).
 */

export type WaveLayout = {
  /** True when the viewport is ≤720px wide (portrait phone). */
  isMobileLayout: boolean;
  /** Grid columns — 2 on mobile, 3 on desktop. */
  COLS: number;
  /** Grid rows — 4 on mobile (8 cells, dropping sq9), 3 on desktop (9 cells). */
  ROWS: number;
  /** Canvas pixel width — full viewport on mobile, the shell's square on desktop. */
  SIZE_W: number;
  /** Canvas pixel height — full viewport on mobile, the shell's square on desktop. */
  SIZE_H: number;
  /** Side length of one square cell. */
  square: number;
  /** Amplitude (= square / 2) — half the cell, used for sin/cos scaling. */
  amp: number;
  /** Half-cell x position — center within one cell. */
  cx: number;
  /** Half-cell y position — center within one cell. */
  cy: number;
  /** Gap BETWEEN neighbouring cells on x. */
  gap_x: number;
  /** Gap BETWEEN neighbouring cells on y. */
  gap_y: number;
  /** Left edge of the grid block inside the canvas. On desktop this
   *  centres a square block in a canvas that may be much wider than
   *  it is tall; on mobile it equals `gap_x` (the even-slot margin). */
  origin_x: number;
  /** Top edge of the grid block inside the canvas. */
  origin_y: number;
};

/** Box the desktop grid is drawn into, published by
 *  `WaveCanvasShell` as it measures/observes its own element.
 *
 *  Module-level rather than a per-sketch value because the six wave
 *  sketches each own a closure that calls `computeWaveLayout()` with
 *  no arguments, and every wave canvas on a page lives in the same
 *  media column, so they all measure the same box. If wave sketches
 *  ever render at two different sizes on one page, this has to
 *  become per-instance. */
let sharedBox: { width: number; height: number } | null = null;

export function setWaveBox(box: { width: number; height: number } | null) {
  sharedBox =
    box && box.width > 0 && box.height > 0 ? box : null;
}

/** Legacy desktop proportions: a 225px cell inside a 700px canvas.
 *  Kept as a RATIO so the grid scales to whatever box it is given
 *  while reading exactly as it always has. */
const DESKTOP_CELL_FILL = (3 * 225) / 700;

export function computeWaveLayout(
  box: { width: number; height: number } | null = sharedBox,
): WaveLayout {
  const isMobileLayout =
    typeof window !== "undefined" && window.innerWidth <= 720;
  const COLS = isMobileLayout ? 2 : 3;
  const ROWS = isMobileLayout ? 4 : 3;
  // DESKTOP: a square sized to the box the shell actually occupies,
  // so the pixel buffer matches the display size 1:1. It used to be a
  // hardcoded 700 that CSS then stretched — 744 on a 1440x900 split
  // page and 920 at 1920x1080, i.e. the grid was drawn at one scale
  // and resampled to another. 700 stays as the fallback for the frame
  // before the shell has measured itself.
  const SIZE_W =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerWidth)
      : Math.max(1, Math.round(box ? box.width : 700));
  const SIZE_H =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerHeight)
      : Math.max(1, Math.round(box ? box.height : 700));

  // Cell side — sized by the TIGHTER axis so the grid always fits
  // whichever dimension runs out first. 92% of the per-cell slot on
  // mobile; on desktop the fraction is the legacy 225-in-700 cell
  // expressed as a ratio.
  const square = Math.floor(
    Math.min(SIZE_W / COLS, SIZE_H / ROWS) *
      (isMobileLayout ? 0.92 : DESKTOP_CELL_FILL),
  );
  const amp = square / 2;
  const cx = square / 2;
  const cy = square / 2;

  let gap_x: number;
  let gap_y: number;
  let origin_x: number;
  let origin_y: number;

  if (isMobileLayout) {
    // Even slot distribution: (COLS+1) slots on x (one left margin,
    // COLS-1 inner gaps, one right margin), (ROWS+1) on y. The canvas
    // is the viewport here, so spreading the leftover is what's
    // wanted.
    gap_x = (SIZE_W - COLS * square) / (COLS + 1);
    gap_y = (SIZE_H - ROWS * square) / (ROWS + 1);
    origin_x = gap_x;
    origin_y = gap_y;
  } else {
    // DESKTOP: the canvas fills the media column, which is much wider
    // than it is tall, so the leftover must NOT be spread into the
    // gaps — that would pull the cells apart into a stretched lattice
    // instead of scaling the grid. The gap is derived from the TIGHT
    // axis (keeping the legacy proportion), the block is measured,
    // and whatever is left over lands OUTSIDE the block as canvas
    // background on both sides.
    const tight = Math.min(SIZE_W, SIZE_H);
    const cells = Math.max(COLS, ROWS);
    // Same even-slot figure the legacy 700px canvas produced
    // (700 - 3x225) / 4 = 6.25 — but measured against the tight axis
    // so it scales with the grid rather than with the wide axis.
    const gap = (tight - cells * square) / (cells + 1);
    gap_x = gap;
    gap_y = gap;
    const blockW = COLS * square + (COLS - 1) * gap;
    const blockH = ROWS * square + (ROWS - 1) * gap;
    origin_x = (SIZE_W - blockW) / 2;
    origin_y = (SIZE_H - blockH) / 2;
  }
  return {
    isMobileLayout,
    COLS,
    ROWS,
    SIZE_W,
    SIZE_H,
    square,
    amp,
    cx,
    cy,
    gap_x,
    gap_y,
    origin_x,
    origin_y,
  };
}

/**
 * Returns the (x, y) pixel position of cell `idx` within the current
 * layout — the block's origin + `col × (square + gap)`.
 * Reads from a mutable layout reference so it always uses the
 * latest dimensions (caller updates the reference inside
 * `p.windowResized`).
 */
export function cellPos(layout: WaveLayout, idx: number): [number, number] {
  const col = idx % layout.COLS;
  const row = Math.floor(idx / layout.COLS);
  return [
    layout.origin_x + col * (layout.square + layout.gap_x),
    layout.origin_y + row * (layout.square + layout.gap_y),
  ];
}
