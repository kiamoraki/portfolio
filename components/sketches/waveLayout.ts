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
 * `computeWaveLayout()` re-derives every value from the current
 * `window.innerWidth × window.innerHeight`. Each sketch holds a
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
  /** Canvas pixel width — full viewport on mobile, fixed 700 on desktop. */
  SIZE_W: number;
  /** Canvas pixel height — full viewport on mobile, fixed 700 on desktop. */
  SIZE_H: number;
  /** Side length of one square cell. */
  square: number;
  /** Amplitude (= square / 2) — half the cell, used for sin/cos scaling. */
  amp: number;
  /** Half-cell x position — center within one cell. */
  cx: number;
  /** Half-cell y position — center within one cell. */
  cy: number;
  /** Horizontal slot size (one of `COLS+1` equal slots distributing leftover x). */
  gap_x: number;
  /** Vertical slot size (one of `ROWS+1` equal slots distributing leftover y). */
  gap_y: number;
};

export function computeWaveLayout(): WaveLayout {
  const isMobileLayout =
    typeof window !== "undefined" && window.innerWidth <= 720;
  const COLS = isMobileLayout ? 2 : 3;
  const ROWS = isMobileLayout ? 4 : 3;
  const SIZE_W =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerWidth)
      : 700;
  const SIZE_H =
    isMobileLayout && typeof window !== "undefined"
      ? Math.round(window.innerHeight)
      : 700;
  // Cell side — 92% of the tighter axis so each axis always has at
  // least ~8% left over for the (COLS+1) / (ROWS+1) equal-slot gap
  // distribution. Desktop keeps the legacy 225 cell.
  const square = isMobileLayout
    ? Math.floor(Math.min(SIZE_W / COLS, SIZE_H / ROWS) * 0.92)
    : 225;
  const amp = square / 2;
  const cx = square / 2;
  const cy = square / 2;
  // Even gap distribution: (COLS+1) slots on x (one left margin,
  // COLS-1 inner gaps, one right margin), (ROWS+1) on y.
  const gap_x = isMobileLayout
    ? (SIZE_W - COLS * square) / (COLS + 1)
    : 4;
  const gap_y = isMobileLayout
    ? (SIZE_H - ROWS * square) / (ROWS + 1)
    : 4;
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
  };
}

/**
 * Returns the (x, y) pixel position of cell `idx` within the current
 * layout — `gap_x` from the left + `col × (square + gap_x)`, etc.
 * Reads from a mutable layout reference so it always uses the
 * latest dimensions (caller updates the reference inside
 * `p.windowResized`).
 */
export function cellPos(layout: WaveLayout, idx: number): [number, number] {
  const col = idx % layout.COLS;
  const row = Math.floor(idx / layout.COLS);
  return [
    layout.gap_x + col * (layout.square + layout.gap_x),
    layout.gap_y + row * (layout.square + layout.gap_y),
  ];
}
