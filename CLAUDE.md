# CLAUDE.md: kiamoraki.com

You are working inside `~/Dev/kiamoraki/`, the Next.js portfolio behind kiamoraki.com. Kirby is the artist and UX designer whose portfolio this is.

Read this in full at the start of every session. Also see `STYLEGUIDE.md` for visual design decisions.

## Stack + tooling

- **Framework:** Next.js 16 App Router (`app/` dir).
- **Styling:** Tailwind v4 via `@tailwindcss/postcss`. Also per-page CSS files (e.g. `app/project-page.css`) imported at the route level so other routes don't pay their cost.
- **Content:** MDX for project bodies (`content/projects/*.mdx`), rendered via `next-mdx-remote/rsc`. Frontmatter drives metadata + layout hints (title, slug, year, tags, thumb, fullbleed, format, colorMode, description).
- **Sketches:** p5.js. Statically imported (never `dynamic({ssr:false})`) since every sketch file already has `"use client"`. `loadP5` singleton in `components/sketches/loadP5.ts` gates the ~1MB p5 chunk fetch.
- **Package manager:** npm.
- **Static export:** `npm run build` produces `/out/`. Deploy to Apache on Kirby's friend's Linode via `scripts/deploy.sh`.
- **Local dev:** `npm run dev` (default port 3000).
- **Type checking:** `npx tsc --noEmit`.

## Composition rules (any prose you author)

Same rules as the cv + opportunities repos:

- **NEVER use en-dashes as sentence connectors** (parentheticals, continuations, elaborations). Use commas, colons, parentheses, or split into shorter sentences. See `STYLEGUIDE.md` for the replacement patterns.
- En-dashes still legitimate for year ranges (`2020–2026`) and as bullet markers.

## Codebase orientation

### Routes (in `app/`)

- `/` (`app/page.tsx`): homepage. Sketch-thumbnail grid, name multi-stack title.
- `/about` (`app/about/page.tsx`): CV + Timeline tabs. Long file (~343 lines). Uses `<AboutTabs />`.
- `/projects/[slug]` (`app/projects/[slug]/page.tsx`): default dynamic template for most projects. Renders the MDX body + chrome + prev/next.
- `/projects/<slug>` (dedicated route): specific projects with custom layouts opt out of `[slug]` by having their own directory (e.g. `app/projects/emergence/`, `app/projects/shape-of-time/`). Slug MUST also appear in the `SLUGS_WITH_DEDICATED_ROUTES` set inside `[slug]/page.tsx` so static-export doesn't build the same URL twice.
- `/sites/*`: legacy sub-sites, gitignored (huge, contain nested `.git` / `node_modules` / build artifacts). Not part of the current site.

### Components (in `components/`)

Reuse before building new. The important ones:

- `<Nav />` (from `components/Nav.tsx`, backed by `NavClient.tsx`): Home button + CV chip, top-left chrome, and the wall-clock rainbow sync. Include this on every page that wants site chrome.
- `<ProjectNav />` (`components/ProjectNav.tsx`): title chip + prev/next chips. Reads `useCarouselState` for meta pages that carousel through pieces. Needs a `<CarouselStateProvider />` ancestor. To hide the title chip on a page (e.g. when the title lives elsewhere in the layout), CSS-override `.project-title-wrapper { display: none }` scoped to a page wrapper.
- `<CarouselStateProvider />` (`components/CarouselState.tsx`): context provider needed by ProjectNav.
- `<Sketch />` and `<SketchOverlay />` (`components/content/Sketch.tsx`): render p5 sketches by id. Backed by the sketch registry.
- Sketch registry: `lib/sketch-registry.ts` maps `id` → React component + bg color. Every sketch you add belongs here.
- MDX components: `components/mdx/` and `components/content/` — the elements available inside `.mdx` project bodies (`<Piece>`, `<Sketch>`, etc.).
- `<AboutTabs />` (`components/AboutTabs.tsx`): the CV/Timeline switcher used only on `/about`.
- `<ProjectGrid />`, `<TagIndex />`, `<MetaCarousel />`, `<ContactButton />`, `<ContactModal />`: single-purpose, self-explanatory.

### Content

- `content/projects/*.mdx`: one file per project. Frontmatter drives everything the template needs; MDX body drives sketch/piece composition.
- `content/projects/animations.mdx`, `design.mdx`, `activations.mdx`: meta-pages that aggregate multiple pieces (via `<MetaCarousel />`) or redirect to a tag-filtered walk.

### Libraries (in `lib/`)

- `lib/projects.ts`: `getAllProjects`, `getProject`, `getProjectNeighbors`, `getNavigableProjects`. Every route touching projects uses this.
- `lib/sketch-registry.ts`: sketch id → component mapping.
- `lib/content-pieces.ts`: piece-level content model.
- `lib/content-types.ts`: shared types (ColorMode etc.).
- `lib/image-manifest.json`: generated at build (`scripts/build-image-manifest.mjs`), consumed for `next/image`-style width/height hints.

### Build scripts (in `scripts/`)

- `build-image-manifest.mjs`, `build-tag-index.mjs`, `build-content-index.mjs`: prebuild indexers. Run as part of `dev` and `build` via npm scripts.
- `extract-gif-first-frames.mjs`: pulls the first frame of each animated GIF as a PNG placeholder (transparent-preserving).
- `emit-modern-image-formats.mjs`, `optimize-images.mjs`: image build helpers.
- `split-project-css.mjs`: extracts per-project CSS rules from `globals.css` into `app/project-page.css` so the chunk only loads on project routes.
- `build-redirects.mjs`: post-build redirect map generation.
- `deploy.sh`: pushes `/out/` to Kirby's friend's Linode. Never run without explicit consent.

## Working conventions

**Type check before you claim done.** `npx tsc --noEmit` after non-trivial edits.

**Dev server is likely already running.** Before spawning `npm run dev`, check `lsof -i:3000 -sTCP:LISTEN` — Kirby often has one going in another terminal. Hit `http://localhost:3000/…` to verify your changes.

**Prefer dedicated routes over branching `[slug]`.** When a project needs a custom layout, create `app/projects/<slug>/page.tsx` and add the slug to `SLUGS_WITH_DEDICATED_ROUTES` in `[slug]/page.tsx`. Keeps the shared template unchanged and lets each dedicated page own its CSS.

**Sketch parameters as props, not fixed values.** When you tune a p5 sketch for a smaller canvas, add scale props (like `sizeScale`, `countScale`, `speedScale`) with defaults of `1` so full-viewport callers keep their current behavior. See `RadialsCanvas` for the pattern.

**Follow existing chunk-splitting patterns.** `app/project-page.css` is per-route; per-project CSS chunks are extracted via `scripts/split-project-css.mjs`. When adding heavy CSS or JS, ask whether it can be scoped to the routes that actually need it.

**Mobile is `<= 720px`.** Use this breakpoint consistently. It's baked into `RadialsCanvas` (`MOBILE_BREAKPOINT`) and most CSS media queries.

## Repo boundary

**Public GitHub remote** at `github.com/kiamoraki/portfolio`. Anything committed here CAN reach the internet.

**Gitignored (do not commit):** `node_modules`, `.next`, `out`, `sites`, `cv` (personal CV data lives in `~/Dev/cv`), `.claude/`, source video files, generated caches, `.env*`.

**Sensitive info to keep off the public repo:** phone number (has appeared in some drafts), home addresses, unlisted employment history. If Kirby drops anything sensitive into the working tree, verify `.gitignore` catches it before doing `git add`. The `/cv/` folder is one such trap (belongs in the private cv repo).

**Deploy target:** Apache on Kirby's friend's Linode (CentOS 7), docroot `/srv/www/kirby/htdocs/`, via `scripts/deploy.sh`. Only run deploy when Kirby explicitly asks.

## When designing / redesigning pages

- Look at `STYLEGUIDE.md` first. If a decision has been made (typography, layout template, chrome placement, sketch scaling), reuse it.
- New design decisions land in `STYLEGUIDE.md` alongside the code change that introduces them. Update both in the same commit.
- For substantive redesigns, prototype on ONE page first (like the emergence split layout). Roll out the pattern only after Kirby sees it work.

## Related repos

- `~/Dev/cv/` (private): Kirby's CV + cover letter generator. LLM-tailored, Playwright PDFs. Composition rules originated there.
- `~/Dev/opportunities/` (private): daily opportunity crawl. Uses `/crawl` slash command, writes to Google Sheets. Reads `~/Dev/cv/profile/` for skill signals.

Both are local-only, no git remote. Kiamoraki is the ONE public repo of the three.
