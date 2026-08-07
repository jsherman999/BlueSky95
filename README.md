# 🦋 Bluesky Social 95

A retro desktop-style Bluesky/atproto client that runs **entirely in the browser** — perfect as a static GitHub Pages demo.

## Privacy model (read me!)

- The site is **100% static HTML/JS/CSS**. There is no server, no backend, no analytics.
- Your handle + app password are typed into the page and sent **once, directly from your browser to your own PDS** (`bsky.social` or your self-hosted server) over HTTPS, via `com.atproto.server.createSession`.
- Credentials are **never stored anywhere** — not in localStorage, not in cookies, not on GitHub (GitHub Pages only serves static files; it cannot store anything).
- Only the returned **session token** is kept, in **`sessionStorage`** (scoped to the current tab, wiped on tab close or sign-out).
- Use an [**app password**](https://bsky.app/settings/app-passwords) (bsky.app → Settings → App Passwords), never your main password.

## Features

- 🖥️ Windows-95-style window chrome: title bar, minimize / maximize / sign-out buttons, beveled icon tiles
- 💿 Home / Following timeline with paging
- 🦞 Discover and 👨‍💼 Popular feeds (official feed generators)
- 🐄 Custom feeds browser — open any popular feed generator
- 🔍 Search posts; ⚡ trending topics (tap to search)
- 🐙 Composer with 300-char counter, link facet detection, and replies
- 💬 Reply, 🔁 repost, ❤️ like, 🔖 bookmark (save), 🔗 share (copy bsky.app link) on any post
- 🔔 Notifications: All + Mentions-only views
- 🔐 Handle → DID → PDS auto-resolution, so accounts on any PDS can sign in (with optional manual PDS override)

## Run locally

```bash
npm install
npm run dev     # http://localhost:3000
npm run build   # → dist/ (plain static site)
```

## Deploy to GitHub Pages

1. Push this repo to GitHub (`main` branch).
2. In the repo: **Settings → Pages → Build and deployment → Source: "GitHub Actions"**.
3. The included workflow (`.github/workflows/deploy.yml`) builds `dist/` and publishes it on every push to `main`.
4. Your demo will be live at `https://<you>.github.io/<repo>/`.

The Vite `base` is set to `./`, so asset URLs are relative and work under any repo subpath automatically.

## Stack

React + TypeScript + Vite + Tailwind (theme system) + [`@atproto/api`](https://www.npmjs.com/package/@atproto/api). All network calls go straight from the browser to the AT Protocol network (your PDS / public AppView).
