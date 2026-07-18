# Smart Fella or Fart Smella — Website

The **Smart Fella or Fart Smella** quiz site — a game-show-style *Fella Test* with an animated hero, smooth scrolling, and a full-viewport pricing section. The quiz is the homepage (`/`); the old `/smart-or-fart` path permanently redirects to `/`.

> The AI **video pipeline** (Remotion project, renders, and voice generation) lives in a **separate repository** (`sffs-ai-video-pipeline`). The `video/` folder is intentionally excluded from this repo.

## Stack

- **Next.js 16** (App Router / React Server Components)
- **React 19**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Base UI** (`@base-ui-components/react`)
- **GSAP** + **Lenis** for scroll-driven animation and smooth scrolling
- **Motion** (`motion/react`) for the interactive, physics-driven page shapes
- **TypeScript 5**

## Project structure

```
app/                 # App Router: the quiz homepage (/), root layout + metadata,
                     #   and the social share images (opengraph-image / twitter-image,
                     #   with _og/ render + _fonts/ assets)
components/
  quiz/              # Hero, 3-zone nav, smooth-scroll provider, music toggle, and
                     #   the page-level interactive shape field (page-shapes.tsx)
  sections/          # Stacked page sections (steps, testimonials, follow-us, footer, …)
  social/            # Social icon buttons
  ui/                # Shared primitives (button, container, section, …)
lib/                 # Small utilities (cn, socials, …)
public/              # Static assets (logo, wordmark, music, images, social/)
```

> `video/` (Remotion pipeline) and `design-reference/` are supporting folders; the
> video pipeline is deployed from its own separate repo.

## Getting started

```bash
npm install        # install dependencies (Node >= 20.9, see .nvmrc)
npm run dev        # start the dev server at http://localhost:3000
```

## Scripts

| Script              | Description                          |
| ------------------- | ------------------------------------ |
| `npm run dev`       | Start the local dev server           |
| `npm run build`     | Production build                     |
| `npm run start`     | Serve the production build           |
| `npm run lint`      | Run ESLint (`eslint-config-next`)    |
| `npm run typecheck` | Type-check with `tsc --noEmit`       |

## Environment variables

The website requires **no environment variables** to build, run, or deploy — it is a static-rendered marketing + quiz site with no runtime secrets. See [`.env.example`](./.env.example).

## CI / CD

- **CI** — GitHub Actions runs `lint`, `typecheck`, and `build` on every push to `main` and on every pull request (`.github/workflows/ci.yml`).
- **CD** — Deployed on **Vercel** via native Git integration: every pull request gets a Preview deployment and merges to `main` deploy to Production automatically.
