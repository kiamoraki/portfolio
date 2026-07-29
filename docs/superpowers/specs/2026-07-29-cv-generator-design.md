# CV Generator Design Spec

**Status:** Approved by user 2026-07-29
**Owner:** Kirby (Michelle Kirby)
**Implementation target:** new separate private repo `~/Dev/cv`

---

## Goal

When a job, residency, grant, or public-art call comes up, produce a tailored CV and cover letter as PDFs in under a minute, with Claude authoring the framing (headline, tagline, bullet selection, cover letter prose) and a deterministic template producing the rendered output.

## Non-goals

- Not a public-facing web application. Private personal tool.
- Not a Next.js app. No live browser preview.
- Not integrated with the kiamoraki portfolio repo (separate concern, separate repo, separate git remote).
- No third-party ATS integration. No auto-submission.
- No versioned "which persona did I use last Tuesday" analytics.

## Architecture at a glance

```
profile/*.yaml    ─┐
personas/*.yaml   ─┼─► resolver ─► RenderedDocument ─► React SSR ─► HTML ─► Playwright ─► PDF
tailorings/…/tailoring.yaml ─┘                          (per tailoring: cv.pdf + cover-letter.pdf)
```

Three data layers, one intermediate resolved document, one render pipeline, two output PDFs per application.

- **Language / runtime:** Node.js, TypeScript for templates, plain `.mjs` for build scripts.
- **Rendering:** React SSR via `react-dom/server` → HTML string → Playwright headless Chromium `page.pdf()`.
- **Format:** YAML for hand-editable data (facts, personas, tailorings). Markdown for narrative material (JD, voice examples, about-me).
- **Package manager:** npm.
- **Fonts:** Avenir Black (headings, dates) + Avenir Book (body). Referenced by PostScript name in CSS; not bundled — Chromium reads them from the macOS system font store.

## Repo layout

```
cv/
├─ profile/
│  ├─ contact.yaml          # name, email, phone, url, location
│  ├─ experience.yaml       # every job/role — facts + bullet library
│  ├─ exhibitions.yaml      # every exhibition (year/title/venue/city)
│  ├─ residencies.yaml      # every residency
│  ├─ teaching.yaml         # every teaching gig
│  ├─ education.yaml        # degrees + training
│  ├─ skills.yaml           # every skill, tagged
│  └─ voice/                # narrative material for cover letters
│     ├─ about-me.md        # first-person "why I do this" (200–400 words)
│     ├─ projects.md        # 1-para narrative per major project
│     ├─ style.md           # optional style rules ("no exclamation points", etc.)
│     └─ examples/          # 2–3 past cover letters as voice reference
├─ personas/
│  ├─ artist.yaml
│  ├─ operations.yaml
│  └─ event-production.yaml
├─ tailorings/
│  └─ 2026-07-29-anthropic-research-ops/
│     ├─ jd.md
│     ├─ tailoring.yaml
│     └─ out/
│        ├─ cv.pdf
│        ├─ cover-letter.pdf
│        └─ resolved.json    # debug sidecar (fully-merged data)
├─ templates/
│  ├─ CVTemplate.tsx
│  ├─ CoverLetterTemplate.tsx
│  └─ styles.css             # print CSS: @page, page breaks, font declarations
├─ bin/
│  ├─ new.mjs                # scaffold a new tailoring folder
│  ├─ build.mjs              # tailoring.yaml → PDFs
│  └─ preview.mjs            # build + open cv.pdf in Preview.app
├─ src/
│  ├─ resolver.ts            # merges profile + persona + tailoring → RenderedDocument
│  ├─ types.ts               # TypeScript types for all schemas
│  └─ render.ts              # RenderedDocument → HTML → PDF
├─ CLAUDE.md                 # instructions for Claude on how to tailor
├─ README.md                 # setup + usage
├─ package.json
├─ tsconfig.json
└─ .gitignore
```

## Data model

### Contact (`profile/contact.yaml`)

```yaml
name: Michelle Kirby
title: MICHELLE KIRBY               # what appears as the CV's big top title
email: mshhll.rk@gmail.com
phone: "+1 [216] 778.9036"
url: kiamoraki.com
locations:
  california-remote: "California · Remote"
  none: null
```

Multiple location strings so personas can pick which one to show (or none).

### Experience (`profile/experience.yaml`)

Each entry is a job/role, with all facts, all possible role labels, and the full bullet library for that role.

```yaml
- id: mars-college
  org: Mars College
  location: Bombay Beach, CA
  contextLine: "Off-grid educational program and intentional arts community"
  url: https://mars.college
  startYear: 2020
  endYear: null                    # null = present
  roleLabels:
    artist: "Artist-in-Residence & Faculty"
    operations: "Producer · Operations Lead · Faculty Member"
    event-production: "Program Producer & Community Educator"
  bullets:
    - id: mars-b1
      text: "Serve as operational backbone of a 60+ person seasonal institution: admissions, onboarding, scheduling, faculty communications, and the operational systems supporting an interdisciplinary research and learning community."
      tags: [operations, program-management, scale-60, mission-driven]
    - id: mars-b2
      text: "Design participatory governance frameworks and shared-use policies allowing many independent practitioners to share limited space, equipment, and resources equitably."
      tags: [governance, policy, systems-design]
    # ... all other Mars bullets, seeded from existing three PDFs
```

**Rules:**
- Every bullet has a stable `id`. IDs never get reused across roles.
- `tags` are freeform strings, used both for persona-preferred filtering and for Claude to pick relevant bullets given a JD.
- `roleLabels` is a map of persona-id → role label string. If the persona is `bespoke` and no label is set at tailoring time, fall back to a `default` key in the map.

### Exhibitions (`profile/exhibitions.yaml`)

```yaml
- id: tobrit-burning-man
  year: 2019
  title: TOBRIT
  venue: Burning Man
  city: Black Rock City, NV
  tags: [installation, large-scale, art-community]
- id: mars-open-studios
  yearRange: [2021, 2026]
  title: "Mars College Open Studios & Public Exhibitions"
  role: "director/curator"
  city: Bombay Beach, CA
  tags: [curatorial, ongoing]
```

Same shape for `residencies.yaml`, `teaching.yaml`, `education.yaml` — an array of entries, each with a stable `id`, verbatim facts, and optional `tags` for filtering.

### Skills (`profile/skills.yaml`)

```yaml
- id: program-management
  label: "Program & production management"
  category: operations
- id: airtable
  label: Airtable
  category: tools
- id: full-stack-web
  label: "Full-stack web design & development (HTML/CSS/JS)"
  category: technical
```

Tailorings pick skills by `id` and order them explicitly.

### Persona (`personas/operations.yaml`)

```yaml
id: operations
displayName: "Operations / Program Management"

# Header defaults
title: MICHELLE KIRBY
subtitle: "OPERATION & PROGRAM MANAGEMENT · SYSTEMS BUILDER · CREATIVE TECHNOLOGIST"
location: california-remote        # reference into contact.yaml.locations

# Default tagline (Claude may rewrite per application)
tagline: |
  Operations generalist with 7 years supporting mission-driven teams in
  high-intensity, fast-changing environments. Six years as the operational
  backbone of a 60-person residential arts and technology institute...

# Section order and inclusion
sections: [professional-experience, education, skills-and-tools]

# Bullet-selection hints — Claude uses these + JD to pick bullets per experience
preferredBulletTags: [operations, program-management, systems-design, governance]

# Which experiences show, in what order (Claude may narrow further based on JD)
experienceInclude:
  - burning-man-dpw
  - mars-college
  - freelance-various
  - nasdaq

# Which skills to lead with (Claude adds/removes based on JD)
skillEmphasis: [program-management, budgeting, sop-development, airtable]
```

### Tailoring (`tailorings/<slug>/tailoring.yaml`)

Claude writes this. User can inspect and edit it before render.

```yaml
target:
  company: Anthropic
  role: "Research Operations Program Manager"
  jdPath: ./jd.md
  applicationUrl: https://...        # optional

persona: operations                  # or "bespoke"

# Optional header overrides (omit to inherit from persona)
subtitle: "OPERATION & PROGRAM MANAGEMENT · SYSTEMS BUILDER"
tagline: |
  [Claude-authored, tuned to this role]

# Experience section — explicit list, order matters
experience:
  - id: mars-college
    roleLabel: "Producer · Operations Lead · Faculty Member"
    bullets:
      - id: mars-b1
        rewrite: null                # null = use library text verbatim
      - id: mars-b2
        rewrite: "Design participatory governance frameworks..."   # LLM-tuned
    newBullets: []                   # Claude-invented bullets flagged separately

# Explicit skill list, order matters
skills: [program-management, scheduling, budgeting, sop-development, airtable, google-workspace, full-stack-web]

# Optional — only include if persona.sections contains these
exhibitions: []
residencies: []
teaching: []
education: [parsons-mfa, miami-bfa]

# Cover letter — one output block
coverLetter:
  greeting: "Hi Anthropic team,"
  body: |
    [3–4 short paragraphs, cites specific JD requirements]
  closing: "Warmly,\nMichelle"
```

**Resolver rules:**
- Merge order: `profile/` → `persona` → `tailoring` (later overrides earlier).
- Fail loudly on unknown IDs (unknown bullet, unknown experience, unknown skill, unknown persona).
- If `persona: bespoke`, no persona defaults apply — tailoring must supply subtitle, tagline, sections, and full include lists.
- `rewrite: null` means use the library bullet's `text` verbatim; any other string overrides.

## Rendering pipeline

### `bin/build.mjs`

Signature: `node bin/build.mjs <tailoring-folder-path>`

Steps:
1. Load all `profile/*.yaml`, `personas/*.yaml`, and `<tailoring-folder>/tailoring.yaml`.
2. Call `resolver.resolve(profile, persona, tailoring)` → `{ cv: RenderedDocument, letter: RenderedDocument }`.
3. Render each to HTML: `renderToStaticMarkup(<CVTemplate {...cv} />)`, same for the letter, each wrapped in an HTML shell that inlines `templates/styles.css`.
4. Launch Playwright Chromium once; for each of CV and letter: `page.setContent(html, { waitUntil: 'networkidle' })` → `page.pdf({ format: 'Letter', margin: {top: '0.5in', right: '0.6in', bottom: '0.5in', left: '0.6in'}, printBackground: true })`.
5. Write PDFs to `<tailoring-folder>/out/cv.pdf` and `<tailoring-folder>/out/cover-letter.pdf`.
6. Write `<tailoring-folder>/out/resolved.json` (the fully-merged data — debug sidecar).
7. Close the browser.

Target runtime: <2 seconds cold, <1 second warm.

### `bin/new.mjs`

Signature: `node bin/new.mjs "<Org Role Description>"`

Creates `tailorings/YYYY-MM-DD-<kebab-slug>/` containing:
- `jd.md` (empty, with a comment prompting user/Claude to paste the JD)
- `tailoring.yaml` (skeleton with `target.company`, `target.role`, `target.jdPath: ./jd.md` filled in from the argument)
- `out/` (empty directory)

Slug is derived from the argument: lowercase, non-alphanum → hyphens, collapse repeats, trim.

### `package.json` scripts

```json
{
  "scripts": {
    "new": "node bin/new.mjs",
    "build": "node bin/build.mjs",
    "preview": "node bin/preview.mjs"
  }
}
```

`bin/preview.mjs` is a thin wrapper — takes a tailoring folder path, calls the same code path as `build.mjs`, then shells out to `open <folder>/out/cv.pdf`. Separate script because npm's `$1` argument passthrough behaves inconsistently across shells.

Usage:
- `npm run new -- "Anthropic Research Ops"` — scaffold
- `npm run build -- tailorings/2026-07-29-anthropic-research-ops` — render
- `npm run preview -- tailorings/2026-07-29-anthropic-research-ops` — render + open in Preview.app

### Dependencies

- `playwright` (bundled Chromium binary)
- `react` + `react-dom`
- `js-yaml` (YAML parsing)
- `tsx` (run `.tsx` files without a build step)
- Dev: `typescript`, `@types/node`, `@types/react`, `@types/react-dom`

## Template

### `templates/CVTemplate.tsx`

Props: a fully-resolved `Document` object. No knowledge of personas, tailorings, or bullet libraries.

Layout (matches existing three PDFs pixel-close in v1):
- Header block: `MICHELLE KIRBY` in Avenir Black, subtitle in semibold, contact row with SVG icons (email, phone, url, optional location).
- Horizontal rule.
- Tagline paragraph (italic, indented).
- Sections in order specified by data. Each section:
  - Lowercase h2 header in Avenir Black.
  - Thin rule underneath.
  - Entries: year gutter (left, Avenir Black) / body (right, Avenir Book). Bullets prefixed with en-dash (`–`).

### `templates/CoverLetterTemplate.tsx`

Single-page layout, shares the header/contact block with the CV for visual continuity. Then greeting, body paragraphs, closing, signature.

### `templates/styles.css`

```css
@page { size: Letter; margin: 0.5in 0.6in; }

:root {
  --font-heavy: 'Avenir-Black', 'Avenir Next Heavy', sans-serif;
  --font-body:  'Avenir-Book',  'Avenir Next', sans-serif;
  --ink: #1a1a3a;               /* deep navy, matches existing PDFs */
  --rule: #1a1a3a;
}

h1, h2, .year { font-family: var(--font-heavy); }
p, li, .body, .tagline { font-family: var(--font-body); }

/* Print-specific: prevent orphan section headers, keep year gutter tied to body */
section h2 { break-after: avoid; }
.entry { break-inside: avoid; }
```

## Tailoring workflow (the actual moment-of-use)

1. `cd ~/Dev/cv && claude` — open Claude Code in the repo.
2. Kirby: "Anthropic's hiring for a Research Operations Program Manager. Here's the JD: [text/URL/PDF]."
3. Claude runs `npm run new -- "Anthropic Research Ops"`, writes the JD into `jd.md`, reads all profile + personas.
4. Claude drafts `tailoring.yaml` and presents it as a **prose summary** in chat (not YAML): persona pick + why, subtitle, tagline draft, experience order, bullet picks per role with rewrite notes, skill order, cover letter body.
5. Kirby iterates in natural language ("swap that bullet", "tighten the tagline"). Claude edits `tailoring.yaml` and re-renders. Each render <1s.
6. On approval, Claude runs `npm run preview -- tailorings/<slug>` — PDFs open in Preview.app.
7. Kirby uploads to the application.

## Cover letter voice sources

Priority order for Claude when authoring the cover letter body:

1. **`voice/examples/`** — 2–3 past cover letters saved as markdown. Strongest voice signal. Imitate cadence, sentence length, greeting/closing conventions.
2. **`voice/about-me.md`** — first-person 200–400 word narrative. Source material for the "why me / why now" paragraph.
3. **`voice/style.md`** *(optional)* — bullet-list rules like "no exclamation points", "never say 'passionate'".

Standard structure:
- Greeting (formality matched to JD)
- Opening: why this role, at this org, right now — cites JD specifics
- Middle: 2–3 concrete examples from history mapping to what they're asking for
- Closing: what she'd bring + plain sign-off
- One page maximum

## CLAUDE.md contents

The repo's root `CLAUDE.md` is the durable prompt that makes Claude behave consistently across sessions. It contains:

1. **Workflow rules:** how to trigger (any mention of a new job/residency/grant), the six-step flow above, when to ask questions vs proceed.
2. **Data rules:**
   - Never invent facts (dates, orgs, titles, degrees, locations).
   - Only reference bullets by ID from the library. New bullets go in `newBullets:`, flagged, with justification.
   - `rewrite:` is for tuned wording; if the change is substantive enough that facts might shift, add it as a `newBullet` instead.
   - Fail loudly if a persona references an ID that doesn't exist in the profile.
3. **Framing rules:**
   - Cite JD language when rewriting bullets.
   - Pick persona based on JD signal; state the choice and reasoning in the prose summary.
   - If no persona fits, use `persona: bespoke` and say so.
4. **Cover letter rules:**
   - Read all `voice/examples/` before drafting.
   - Never open with "I am writing to apply for" or any variant.
   - One page max.
5. **Presentation rules:**
   - Always show the tailoring as a prose summary in chat, not a YAML dump.
   - Point Kirby at the file path if she wants to inspect the raw YAML.
   - After iterations, always end by running `npm run preview` (not just `build`) so the PDF opens automatically.

## Bootstrap (initial content seeding)

Before the tool is usable, the repo needs data. This is a one-time task done at implementation time:

1. **Extract facts from the three existing PDFs** into `profile/contact.yaml`, `profile/experience.yaml`, `profile/exhibitions.yaml`, `profile/residencies.yaml`, `profile/teaching.yaml`, `profile/education.yaml`, `profile/skills.yaml`. Verbatim — no rewriting.
2. **Build the bullet library.** Every bullet from each of the three PDFs becomes an entry in `experience.yaml` with an ID and tags. De-duplicate obvious repeats across variants (same bullet reworded twice → keep both as separate IDs since tone matters).
3. **Seed the three personas** (`artist.yaml`, `operations.yaml`, `event-production.yaml`) from the header + section-selection patterns visible in each PDF.
4. **Populate `voice/`:** Kirby provides 2–3 past cover letters she liked + writes/dictates a 200–400 word `about-me.md`.
5. **Move existing `~/Dev/kiamoraki/cv/` PDFs to the new `~/Dev/cv/` repo** as reference material. Add `cv/` to kiamoraki's `.gitignore` as a defensive measure so nothing personal ever accidentally reaches the public portfolio remote. (Already done as part of the spec commit — see kiamoraki's `.gitignore`.)

## Testing

Minimal, given this is a private tool for one user:

- **Resolver unit tests** (Node's built-in `node:test`): unknown IDs fail loudly; merge order works correctly; `rewrite: null` uses library text.
- **Golden PDF smoke test:** one canned tailoring in `tailorings/_test-fixture/`; build produces a byte-stable PDF (or, more realistically, a page-count and font-usage assertion via a quick PDF text-extract). Catches template regressions.
- No E2E tests. Kirby is the E2E test.

## Open questions / future work (out of scope for v1)

- **Cover letter length variants** (some grants want 500 words, some want 2 pages). If it becomes a real need, add a `format: short | standard | long` field to `coverLetter:` and template-side length variants.
- **Multiple output formats** (DOCX for grants that require it). Not needed for v1; PDF only.
- **Cross-application memory** ("you applied to something similar last year — start from that?"). Claude can grep past tailorings today; formalizing this into a helper is future work.
- **Interactive tailoring UI.** No. If iteration in chat gets painful, revisit — for now, chat is fine.
- **Auto-fetch JDs from URLs.** Claude can do this ad hoc via WebFetch; no pipeline plumbing needed.

## Related work (deferred)

This is the first of three arms of a larger effort. The other two — website redesign, and daily opportunity crawl — will get their own specs. The **daily opportunity crawl** arm will consume this repo's `profile/` for skill-matching signals; that read-only integration is the only planned cross-arm coupling.

---

**End of spec.**
