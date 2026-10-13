# Retreat client

ITCEN retreat operations frontend, operated by OH BOK: React, TypeScript, Vite, and Yarn.

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

`VITE_FRONTEND_URL` is the canonical public frontend origin used to validate
issued personal links and property QR links. It must match the backend's
`FRONTEND_URL`, even when the administrator opens the app through another
allowed origin. Development defaults to `http://localhost:5175`, matching the
backend default; set it explicitly for a remote or differently configured backend.
Production requires an explicit HTTPS origin before building, for example
`VITE_FRONTEND_URL=https://app.example.com` alongside
`VITE_API_BASE_URL=https://api.example.com`. Missing/invalid production configuration
stops startup before requests can issue or replace links. A valid but mismatched
frontend/backend setting still rejects the receipt after issuance, so keep both
settings aligned. Rebuild the frontend after changing either public URL.

## Current slice

- Study Factory-style `src/app/core`, `features`, `screens`, `shared`, and `styles`.
- ITCEN identity across public, admin, guest and staff screens, with a discreet
  OH BOK operator credit; shared shell/button/state components and responsive CSS.
- Browser routing, strict TypeScript, and fixed development/preview port 5175.
- GET/POST request helper with explicit per-request credentials, Korean errors,
  cancellation/timeout, JSON/FormData support, and binary downloads.
- Development-only `/dev/connection`: manually checks the actual GET `/health`.
  This proves API liveness only, not database or S3 readiness.
- Administrator login at `/admin/login`, a protected `/admin` landing, session
  restoration through `GET /users/me`, expiry handling, and browser-local logout.

`/guest` and `/guest/stay` provide scoped mobile guest home/guide and check-in/out
intake. `/draft` supports private resume, temporary save, photo upload, final
review/submission and reopening the original completion receipt. Its submitted
detail view supports private photos and answer corrections with revision checks.
`/guest?view=report#token=...` also supports standalone problem reports from a
property QR, with optional private photos, review and the original receipt.
Personal-stay links do not expose this property-QR report flow. `/staff` starts a
maintenance checklist after confirming the configured employee. Staff private
drafts guide users through inspection, optional photos, and review/submission;
the same private link reopens the original completion receipt. Staff and guest
credentials stay in their matching fragment/request state and never enter the
administrator session or browser storage. See PROJECT.md for the implemented
scope and remaining verification boundaries.

## Public landing page

The homepage explains how guests begin through a received personal link or an
on-site guest QR. It includes three usage steps, native expandable help answers,
staff QR guidance and a discreet administrator login link. It does not send
visitors to guest/staff routes without their required credentials. Its original
retreat illustration is decorative and does not represent a specific property.
The homepage reads no protected data and makes no API requests.

## Branding

`src/app/core/config/brand.ts` owns the shared ITCEN name and OH BOK operator credit.
The document title and public metadata live in `index.html`; keep them aligned
when the identity changes. QR posters use the same credit without changing their
encoded destination or downloaded filename.

`public/icons/retreat-symbol.svg` is an original retreat symbol, not an official
ITCEN corporate logo. The browser favicon lives at `public/favicon.svg`, with a
32px PNG fallback and a 180px Apple touch icon. The opaque 192px and 512px PNGs are
prepared for the later PWA slice. These assets alone do not enable installation,
service-worker updates, or offline support.

## Administrator access

Use an administrator account already provisioned in the backend. There is no
public signup. Login uses `POST /users/login` with login ID and password; passwords
are never persisted. Unchecked `로그인 유지` stores the credential in sessionStorage
for the tab; checked stores it in localStorage. The backend issues 7-day/30-day
tokens respectively. Browser restore features may restore tab storage; expiry is
still enforced. Only the token and expiry are saved, scoped to the API origin.
Browser storage is readable by same-origin JavaScript and is not an HttpOnly
cookie. If storage is blocked, login stays in memory with an explanatory notice.

Only admin routes mount the session provider. Reload and returning to the tab
verify `/users/me` before showing protected content. Rejected/expired credentials
return to login; network/server failures retain the credential and show retry.
Persistent sessions follow localStorage changes across tabs. Logout clears the
browser credential and cancels pending requests; it does not revoke the issued
JWT on the server. There is no refresh or revocation endpoint in the backend.
The admin area includes operations, stays/imports, properties, checklist records,
maintenance, issues, staff and reports. Frontend route protection never substitutes
for backend authorization.

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
