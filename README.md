# Retreat client

OH BOK retreat operations frontend: React, TypeScript, Vite, and Yarn.

## Local development

Use Node 22.22.3 or a compatible version and Yarn 1.22.22.

```sh
yarn install
yarn dev
```

The app runs at http://localhost:5175. The port is fixed; stop an existing process
using it instead of silently switching ports. Run the backend separately at 3100.

Local `.env` contains `VITE_API_BASE_URL=http://localhost:3100`. `.env` files are
ignored by Git. Vite exposes `VITE_` values in browser bundles: put only public
configuration here, never AWS credentials, database URLs, or signing secrets.
Local development defaults to the same backend origin when the variable is absent.
For production, set the actual HTTPS API origin before building. The value is an
origin with no path; Retreat has no `/api` prefix. Loopback HTTP is permitted for
local production-bundle verification only. The built frontend must be rebuilt
when its API origin changes.

## Current slice

- Study Factory-style `src/app/core`, `features`, `screens`, `shared`, and `styles`.
- OH BOK welcome screen, shared shell/button/state components, and responsive CSS.
- Browser routing, strict TypeScript, and fixed development/preview port 5175.
- GET/POST request helper with explicit per-request credentials, Korean errors,
  cancellation/timeout, JSON/FormData support, and binary downloads.
- Development-only `/dev/connection`: manually checks the actual GET `/health`.
  This proves API liveness only, not database or S3 readiness.

`/admin/login`, `/guest`, `/guest/stay`, `/staff`, and `/draft` currently show
explicit preparation screens. They do not authenticate, validate link tokens,
submit forms, or expose operational data. Existing link fragments are preserved
and never read/logged/stored by this slice. Login is the next implementation slice.

Production hosting must send frontend page requests to `index.html` so a direct
QR/private-link visit works. This frontend does not replace backend authorization.

## Checks

```sh
yarn typecheck
yarn lint
yarn build
```

`yarn preview` serves the production bundle on 5175; stop `yarn dev` first.
The development connection screen is omitted from the production bundle.

The user owns Git staging, commits, pushes, and deployment.
