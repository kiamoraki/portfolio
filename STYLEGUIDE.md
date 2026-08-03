# kiamoraki.com Style Guide

Visual design decisions for Kirby's portfolio. Captures the "why" behind values in the codebase. When we change a design decision, update the code AND this doc together.

Last updated: 2026-08-01

---

## Baseline (as of 2026-08-01)

### Stack

- Next.js 16 App Router
- Tailwind v4 (via `@tailwindcss/postcss`)
- MDX for project bodies (`content/projects/*.mdx`), rendered via `next-mdx-remote/rsc`
- p5.js sketches, statically imported (never `dynamic({ssr:false})`)
- Static export: `next build` produces `/out/` for Apache hosting

### Palette

Single ink color throughout — no accents.

- **Ink:** `#1a1a3a` (deep navy). Matches the cv repo. Text + rules.
- **Background:** `#fff` (white). Baseline.
- **Rainbow accent:** a 12-stop hue cycle driven by `NavClient`'s wall-clock rainbow sync (`--rainbow-now` + `--rainbow-now-rgb` CSS vars on `documentElement`). Chrome chips inherit it. Do NOT invent local rainbow animations — use the shared vars so every consumer paints the same color at the same moment.

### Fonts

**One typeface site-wide: EK Roumald** (a serif), self-hosted from `public/fonts/EKRoumald/`, in four cuts.

Use the CSS variables, never a raw family name:

| Variable | Resolves to | Use for |
| --- | --- | --- |
| `var(--font-body)` | `"EK Roumald"` + `Georgia, "Times New Roman", serif` | paragraph text, descriptions, captions |
| `var(--font-bold)` | `"EK Roumald Bold"` + same fallbacks | titles, section headers, chrome text |

All four cuts register under the single family `"EK Roumald"` with real `font-weight` / `font-style` descriptors, so `font-weight: bold` and `font-style: italic` select the right file automatically:

| Declaration | File |
| --- | --- |
| default | `EKRoumald-Roman.woff2` |
| `font-style: italic` | `EKRoumald-Italic.woff2` |
| `font-weight: bold` | `EKRoumald-Bold.woff2` |
| both | `EKRoumald-BoldItalic.woff2` |

`"EK Roumald Bold"` is an ALIAS family mapping the Bold cut onto normal weight. It exists only so the ~20 rules that say `font-family: var(--font-bold)` to get bold text keep working, a habit inherited from when `DroidSansBold` was a separate family. **For new work prefer `font-weight: bold` on the main family**; the alias is a compatibility shim, not the pattern to copy.

Only `.woff2` is referenced. The `.woff` / `.ttf` / `.eot` siblings, `demo.html`, and the foundry's `stylesheet.css` in that folder are unused (that stylesheet uses relative urls and an IE-era eot-first `src` stack). Everything under `public/` is copied verbatim into `out/`, so those unreferenced files currently add ~2.8MB to the deploy.

**Superseded 2026-08-01:** DroidSans (body), DroidSans-Bold, Neuropol (chrome / heading), and the `Avenir-Black` / `Avenir-Book` stacks that the split-layout prototypes used. The Avenir references were never bundled webfonts, only macOS system fonts, so off-Mac visitors saw Helvetica; moving to EK Roumald closes that gap.

### Composition rules (prose you author for descriptions, taglines, project copy)

Same rules the cv + opportunities repos use:

- **NEVER use em-dashes anywhere.**
- **NEVER use en-dashes as sentence connectors** (parentheticals, continuations, elaborations). Restructure:
  - Parenthetical mid-sentence break, use parentheses: `X (Y, Z) A` instead of `X – Y, Z – A`
  - Elaboration or list follow-up, use a colon: `X: Y` instead of `X – Y`
  - Continuation, use a comma or "and": `X, and Y` instead of `X – and Y`
  - Two related ideas, split into two sentences: `X. Y.` instead of `X – Y`
- **En-dashes stay legitimate** for year ranges (`2020–2026`) and as bullet markers (`– `). Those aren't sentence connectors.

### Breakpoints

Two tiers, mobile-first:

- **Mobile:** `max-width: 720px` (70 media queries site-wide). JS: `MOBILE_BREAKPOINT = 720`.
- **Desktop:** `min-width: 721px` (44 media queries site-wide) — default look.
- **Wide desktop (added 2026-08-01):** `min-width: 1200px`. Used by multi-cell layouts to switch from 1 column to 2 columns, and as the upper bound of the narrow-desktop nav inset (`721–1200`). Not for typography changes.

Do NOT invent new breakpoints for one-off tuning. General layout must use one of the three tiers above.

**Consolidated 2026-08-01.** The one-off tiers this rule warned about had accumulated (`540px`, `900px`, `721–900px`) and are now folded into the ladder:

| Was | Now | Why |
| --- | --- | --- |
| `max-width: 540px` (CV timeline) | `max-width: 720px` | The tighter timeline spacing reads better across the whole mobile range. |
| `max-width: 900px` (stacked `/about`) | `max-width: 720px` | Every rule in the block sizes off `--spacing-nav-h-mobile`, which only takes effect under mobile chrome at ≤720. Running it to 900 drew a mobile-sized social rail against desktop-sized chrome. |
| `721–900px` (nav inset) | `721–1200px` | Existed only to compensate for the mismatch above. With `/about` corrected, the inset is a genuine narrow-desktop choice and takes the standard band. |

Breakpoints stay in **px, never rem**. They must remain in lockstep with the hardcoded `720` in ~20 sketch files (`window.innerWidth <= 720`). A rem breakpoint would drift against the JS as the root font-size scales.

---

## Iteration decisions

### 2026-08-01: Fluid root font-size + rem migration

The stylesheets are authored in **rem against a 16px base**, and one rule in `globals.css` scales the entire site:

```css
html { font-size: clamp(1rem, 0.8977rem + 0.2273vw, 1.125rem); }
```

16px at ≤720w, rising linearly to 18px at ≥1600w. Every type size, spacing token, chip and gutter follows it, so **layout no longer needs a breakpoint to grow**.

Design constraints baked into those numbers:

- **The 16px floor is deliberate.** It's the browser default, which is what the site rendered at before the migration, so every hand-tuned mobile value (`--spacing-nav-h-mobile: 2.75rem`, the 3.5rem sidebar icons) lands on exactly the pixel it was tuned to. A lower floor would silently shrink those touch targets under the 44px iOS HIG minimum. Mobile is pixel-identical to pre-migration.
- **The bounds are rem, not px.** A reader who raises their browser base font size gets a proportionally larger site. A px-bounded clamp would override that preference.
- **Continuity at the breakpoint:** the clamp evaluates to exactly 16px at 720w, so there's no jump where the mobile layout hands off to desktop.

**What stays in px** (converting these is a regression, not a cleanup):

| Category | Why |
| --- | --- |
| `border`, `outline`, `border-radius` | The crisp 1px/2px chrome lines are the site's visual signature. In rem they land on fractional pixels and soften. |
| Any value ≤ 2px | Hairline `gap: 1px` seams between grid images, `-2px` border-compensation in calcs, `translateY(-2px)`. |
| `box-shadow` / `text-shadow` | The hard `6px 6px 0` offsets are a deliberate flat-shadow look. |
| `@media` breakpoints | Must stay in lockstep with the JS `MOBILE_BREAKPOINT`. |
| `0px` inside `max()` / `calc()` | Unit required by the function. |

Exception: a **transparent border used as spacing** (not as a hairline) does scale. `#about-info ul.socials li` and `#project-list a` both use one to reserve a hover-highlight band.

### 2026-08-01: gallery-grid template (prototype on lissajous)

Second project-page template — for projects that contain MULTIPLE sketches / pieces. Each piece renders in a "cell" with its sketch on top and description text below (no per-piece title). Cells lay out in a responsive grid.

**Layout:**
- Grid: 1 column baseline, 2 columns at `min-width: 1200px`. Sketches shrink proportionally when the grid drops from 2 to 1 column.
- Cell: `display: flex; flex-direction: column; gap: 20px` — sketch frame on top, `<figcaption>` below.
- Sketch frame: `aspect-ratio: 16 / 9` (same as emergence).
- Grid gap: `64px 48px` at desktop, `40px` on mobile.
- Page-level top-title (`<h1>`) uses the same treatment as the split-layout (Avenir Black, uppercase, 28px / 22px mobile, letter-spacing 0.04em).
- Caption typography: Avenir Book 15px / 14px mobile, line-height 1.5.

**Chrome (same as split-layout):**
- Home + CV top-left (from `<Nav />`)
- Prev/next top-right (from `<ProjectNav />`)
- ProjectNav title chip hidden via `.<page-wrapper> .project-title-wrapper { display: none; }`

**Composition with split-layout:**
gallery-grid nests cleanly inside the split-layout template. Lissajous does this: `.lissajous-split` wraps a 1/3 text column (page title + optional description) plus a 2/3 right column that IS the `.gallery-grid`. On mobile the split collapses to single column, then gallery-grid collapses to single column below 1200px (which the narrower right column is already inside), so the mobile stack is: title → description → sketch → caption → sketch → caption → …

Use the composition when a project has both an overall project statement AND multiple sketches. Use plain gallery-grid (no split wrapper) when there's no project-level text worth pulling out.

**CSS class naming (BEM-ish under `gallery-grid` parent):**
- `.gallery-grid` — grid container
- `.gallery-grid-cell` — one sketch + caption block
- `.gallery-grid-sketch-frame` — 16:9 frame the sketch fills
- `.gallery-grid-caption` — description text below the sketch

Currently defined inline in `app/projects/lissajous/lissajous.css`. When a second project adopts, extract to `app/gallery-grid-layout.css` and import from both. Until then, no premature abstraction.

**Files:**
- Route: `app/projects/lissajous/page.tsx`
- Styles: `app/projects/lissajous/lissajous.css`
- Registered in `SLUGS_WITH_DEDICATED_ROUTES` in `app/projects/[slug]/page.tsx`

**Sketch scaling (Lissajous-specific):**
Two Lissajous sketch canvases (`LissajousPortraitsCanvas`, `LissajousFullCanvas`) had a bug where amp was computed from viewport dims, not canvas dims — so the drawing didn't shrink when the container did. Both now switch to canvas-dim-based amp when `inFlow=true`, preserving viewport-based amp for full-viewport callers. Both also gained a `sizeScale` prop (default 1) for further tuning; Portraits also gained `countScale` (default 1) for its 600-particle count. See git commit history for the exact refactor.

### 2026-08-01: Split-layout project page template (prototype on emergence)

New alternative layout for project detail pages, prototyped on `/projects/emergence`. Instead of the default full-bleed sketch treatment (used by most projects), emergence renders a two-column grid.

**Layout:**
- Grid: `1fr 2fr` (text left 1/3, sketch right 2/3)
- Gap: 48px desktop, 24px mobile
- Padding: 96px top / 48px sides / 48px bottom desktop; 88px top / 16px sides / 24px bottom mobile
- Vertical center align on desktop (`align-items: center`); top-align on mobile
- Mobile (`<= 720px`): stacks to a single column, text on top, sketch below
- Sketch frame: `aspect-ratio: 16 / 9`, `position: relative`, canvas fills via `RadialsCanvas inFlow`

**Chrome (this layout):**
- **Top-left:** Home + CV buttons (from `<Nav />`, positioned by existing chrome CSS)
- **Top-right:** prev/next controls (from `<ProjectNav />`, positioned by existing chrome CSS)
- **Hidden:** the ProjectNav title chip. Title lives in the left column now, so `.emergence-split-page .project-title-wrapper { display: none; }` suppresses it on this page only.

**Typography (left column):**
- **Title:** `Avenir-Black`, `uppercase`, letter-spacing `0.04em`, 28px desktop / 22px mobile, `line-height: 1`, margin-bottom 20px / 14px mobile.
- **Description:** `Avenir-Book`, 15px desktop / 14px mobile, `line-height: 1.5`. Paragraphs get 12px bottom margin; last paragraph gets 0.

**Files:**
- Route: `app/projects/emergence/page.tsx`
- Styles: `app/projects/emergence/emergence.css`

**Dedicated-route registration:** slugs with their own route file are listed in the `SLUGS_WITH_DEDICATED_ROUTES` set in `app/projects/[slug]/page.tsx`. That set currently holds `emergence` and `shape-of-time`. Adding a new dedicated route means adding the slug to that set so `generateStaticParams` doesn't try to build the same URL twice.

**Open:** does this pattern generalize? If it works on more than one project, extract to a shared `<SplitProjectLayout>` component with props (`title`, `description`, `sketch` slot). Until we have a second consumer, page-by-page copies are fine.

### 2026-08-01: Split layout generalized (frontmatter opt-in, first rollout: eternal-return)

Answers the "does this pattern generalize?" question left open by the emergence prototype above. It does, and it needs **no dedicated route file per project**.

**Opt in with one line of frontmatter:**

```yaml
layout: split
```

`lib/projects.ts` maps it onto `Project.layout`; `app/projects/[slug]/page.tsx` branches on it. Rolling the layout onto the next project is that one line, nothing else. Do NOT create a new route directory or touch `SLUGS_WITH_DEDICATED_ROUTES` for this.

**Shared stylesheet:** `app/project-split.css`, generic `.split-*` classes. Two deliberate departures from the emergence prototype, both required to serve real MDX bodies:

1. **No colors.** The prototype hardcoded `#fff` / `#1a1a3a`. The shared file inherits instead, so it picks up the `theme` / `bg` / `colorMode` frontmatter that `[slug]` already paints onto `<body>`. One stylesheet serves light and dark projects.
2. **Sticky rail.** The prototype centered its text against a single sketch. Projects with several pieces scroll, so `.split-text` is `position: sticky` below the chrome and the content column scrolls past it. Single-visual pages opt back into centering with `.split--center`.

**Pieces need no overrides.** `.piece` is already `width: 100%`, so existing piece CSS reflows into the 2/3 column for free (verified on eternal-return: pieces measured 854px inside a 1440px viewport). The `100vw` piece rules that would have fought this are all scoped to `.meta-carousel-track`, a different context, so the standalone page and the carousel presentation stay independent.

**Mobile requires a left inset.** The fixed mobile chrome forms a column down the left edge (Home, then CV, then the ScrollAffordances dots), measured at x=16..72 on a 375w viewport. Full-bleed image pieces happily run underneath it; rail TEXT does not. Without `.split-text { padding-left: … }` the CV chip lands on the title and the dots strike through the description. Clearance is `--mobile-sidebar-icon-inset + --mobile-sidebar-icon-size + 0.5rem`.

**Projects with no description** get a dimmed italic placeholder (`.split-description--placeholder`) rather than an empty rail. 13 of 25 projects were missing one at rollout time.

**Type scale (rail):** title `1.375rem` desktop / `1.125rem` mobile; description `0.8125rem` at `line-height: 1.6`, with NO mobile font-size override. The fluid root already renders the same rem value smaller on mobile (16px root vs up to 18px on wide desktop), so a second step down would double-count.

**No scroll affordances.** Split pages don't mount `<ScrollAffordances />`, so there's no scroll cue and no position dots. The rail already anchors the page and the dots read as clutter beside a columnar layout. It's skipped at the component level rather than hidden in CSS, so the scroll listener and per-piece IntersectionObservers are skipped too. Default-template projects keep them.

**Sketch CTAs sit BELOW the frame**, not overlaid on it. In the default template the sketch fills the viewport and there is no outside, so controls have to overlay; here the frame is a 16:9 box with page around it and an overlaid control obscures the artwork it exists to reveal. The piece reserves matching bottom padding so the next piece can't collide. Note this needs `overflow: visible !important` on `.piece-sketch` to beat the inline `overflow: hidden` that `<Sketch>` emits.

**Sketch pieces render 16:9** in this template (`.split-content .piece-sketch`), matching the emergence prototype's frame, instead of the full-viewport box they get in the default template. This needs `!important` on both axes for two reasons: `<Sketch>` emits an inline `width: 100vw; height: 100dvh`, and a global `height: 90dvh !important` also applies. The `.piece` wrapper is height-constrained alongside it, or it keeps reserving full viewport height around the shorter frame.

**Canvas compositions must CONTAIN, not cover.** A 16:9 frame is much shorter than the full-viewport box these sketches were written for, so a grid sized to cover bleeds past all four edges and the clipped outer ring reads as broken. `<Sketch>` takes a `fitInside` prop (per-instance, settable from MDX) that canvases forward to their layout math; `EternalReturnUnobservedCanvas` uses it to pick `Math.min` over `Math.max` for cell size and to floor rather than round the row count, so leftover space becomes an even border. Canvases without a `fitInside` prop ignore it, exactly like `inFlow`.

Mobile needs the rule restated at higher specificity. `.project-track .piece-sketch[data-sketch-id^="eternal-return"]` in `globals.css` sits at 0,3,0 with `!important` inside the mobile block and out-specifies the base rule. Worth knowing: that rule is scoped to `.project-track` ALONE, while its neighbours in the same block are scoped to `.meta-carousel-track` and carry a comment saying they deliberately leave the standalone project page untouched. This one reaches both contexts, which looks unintended.

**Resolved 2026-08-01:** the title/description stack was the prototype's Avenir, a macOS system font rather than a loaded webfont, so split pages read differently off-Mac from the rest of the site. Both rules now use `var(--font-bold)` / `var(--font-body)`, which resolve to the self-hosted EK Roumald. See Fonts in the Baseline section.

### 2026-08-01: Sketch scaling knobs (per-canvas tuning)

`RadialsCanvas` gained four optional props so callers rendering it in a small canvas can dial down without changing defaults for full-viewport consumers:

- `sizeScale` (default `1`): multiplies `START_RADIUS`, `MAX_RADIUS_MIN`, `MAX_RADIUS_RANGE`, `MAX_RADIAL_SIZE`
- `radialCountScale` (default `1`): multiplies `NUM_RADIALS`
- `particleCountScale` (default `1`): multiplies `NUM_PARTICLES` (independent from radial count)
- `speedScale` (default `1`): multiplies radial wander velocity AND particle velocity (both linear and rotational max)

**Current tuning on emergence page:** `sizeScale=0.25 radialCountScale=0.25 particleCountScale=0.12 speedScale=0.4`. Full-viewport callers (e.g. the animations meta page's RadialsCanvas usage via the Sketch registry) pass no props, keeping their original desktop/mobile-branched values exactly.

**Pattern for other sketches:** when you build the second split-layout project, if that sketch also feels crowded/fast in the smaller frame, add the same four props to it. Keep defaults `1` so existing full-bleed usages are untouched.

---

## Open questions (not yet decided)

- **Split-layout as a shared component?** Depends on how many project pages adopt it.
- **What other project pages get the split treatment?** (Only emergence so far.)
- **Description typography weight vs. size.** 15px Avenir-Book at line-height 1.5 reads well for the emergence description (two short paragraphs); larger project descriptions may want a size bump or column widening.
- **Nav CV chip label** currently reads `cv` (lowercase). Consider matching to STYLEGUIDE title convention (uppercase). Small change if we decide to unify.
