# Smart Fella or Fart Smella — Website

Marketing site and interactive `/smart-or-fart` quiz for **Smart Fella or Fart Smella**, built with the Next.js App Router and a neo-brutalist design system.

> The AI **video pipeline** (Remotion project, renders, and voice generation) lives in a **separate repository** (`sffs-ai-video-pipeline`). The `video/` folder is intentionally excluded from this repo.

## Stack

- **Next.js 16** (App Router / React Server Components)
- **React 19**
- **Tailwind CSS v4** (via `@tailwindcss/postcss`)
- **Base UI** (`@base-ui-components/react`)
- **GSAP** + **Lenis** for motion and smooth scrolling
- **TypeScript 5**

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
