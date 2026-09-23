# Retreat frontend working reference

## Scope and workflow

A practical retreat management web app for one manager, guests and assigned staff.
User-facing text is Korean; source and technical explanations are English.
Implement one approved slice, verify it, explain the changes and provide a commit
message. The user controls staging, commits, pushes, migrations and deployment.
Preserve unrelated edits. Do not create new test/spec files; use relevant checks
and temporary probes when needed. Do not modify either reference project.

## Structure

Follow studyfactory-frontend's organization:

- `src/main.tsx`: mount React, providers, global styles.
- `src/app/App.tsx`: render the router.
- `src/app/core`: API transport, public environment configuration, providers,
  routing. Add `session` when implementing real authentication.
- `src/app/features/<domain>`: domain API calls, DTO contracts, reusable business
  logic. Currently only health exists; add domains when they are implemented.
- `src/app/screens/<area>/<screen>`: pages, screen components/hooks/model/styles
  when needed. Future areas are admin, guest, staff. Entry and dev currently exist.
- `src/app/shared/ui` and `shared/layout`: business-neutral reusable components.
- `src/app/styles`: reset, shared tokens, base styles and their single entrypoint.

Use named exports, small focused components, scoped class-based CSS and shared
tokens. Screen-local code remains with its screen. Avoid empty scaffolding and
one growing file containing every DTO. The visual direction follows the approved
blue/navy/white references: cobalt primary actions, deep navy headings, white
surfaces, cool pale backgrounds, restrained shadows and generous spacing. Keep
OH BOK branding; reference mockups do not define additional feature scope. Use
semantic HTML, keyboard focus, readable contrast, and phone-first guest/staff
layouts. Administrator pages also support desktop/tablet.

## Contracts

Yarn only; keep yarn.lock. Preserve the existing React/Vite/TypeScript setup and
Oxlint. Router is React Router 7. Native fetch follows the Study Factory transport
pattern, adapted to Retreat. No authentication library or global state package is
needed for this foundation.

Client: 5175, API: 3100 locally. GET/POST only, no `/api` prefix, no cookies.
Use `.env` (ignored), never `.env.example`. `VITE_` variables are public.
`apiRequest<T>` is a typed JSON helper, not runtime DTO validation; validate
critical data at the feature boundary. Empty 204 responses yield undefined;
call them as `apiRequest<void>`. `apiDownload` returns Blob.

API errors preserve status, code, and field/messages validation details. Render
messages as text. No automatic retry or redirect on 401; the owning access flow
must decide whether a login expired or a scoped link was invalidated.

Administrator JWT, guest/staff QR, private-stay token and draft token are separate
credentials. Pass only the relevant token per API call. Never attach API tokens
to signed photo URLs. No tokens in logs, analytics or query keys. Never copy Study
Factory's refresh endpoint, /api paths, member signup or branch permissions into
Retreat: those are different contracts.

Preserve backend-issued browser paths `/guest`, `/staff`, `/guest/stay`, `/draft`
and their `#token=...` fragments. Use BrowserRouter, not HashRouter. The foundation
does not parse these credentials or create sessions. Real session storage and
route protection belong to the login/link-flow slices, not placeholder guards.

## Completion boundary

This slice provides a styled foundation and a real development health check.
Business flows, login, link validation, protected administrator screens, caches,
PWA/offline support, content setup and deployment are not implemented here.
Report typecheck/lint/build separately from actual browser/backend/mobile checks.
