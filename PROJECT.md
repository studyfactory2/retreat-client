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
  routing and administrator session lifecycle.
- `src/app/features/<domain>`: domain API calls, DTO contracts, reusable business
  logic. Health and admin-auth exist; add domains when they are implemented.
- `src/app/screens/<area>/<screen>`: pages, screen components/hooks/model/styles
  when needed. Admin login/home, entry and dev exist; guest/staff follow later.
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
does not parse guest/staff/private/draft credentials. Administrator sessions mount
only inside the admin route group, preserving isolation from those link flows.

## Administrator login

`features/admin-auth` owns POST /users/login, GET /users/me and validated DTOs.
`core/session` owns the admin store, storage adapter, context and lifecycle.
`RequireAdmin` protects /admin; /admin/login redirects verified sessions there.
The login form never trims or persists passwords. Keep-signed-in defaults off.
Unchecked uses sessionStorage, checked uses localStorage; backend JWT lifetime is
7/30 days. Storage contains only token/expiry and is namespaced by API origin.
These are JavaScript-readable credentials under the agreed header-based flow.
Blocked storage falls back to memory with a user-visible notice. Clear both stores
when changing persistence or logging out. Server logout/revocation does not exist.
Verify current identity on restore and focus; auth rejection/expiry clears it,
temporary failures block protected content with retry while retaining credentials.
Cancel and version pending operations so logout/newer sessions win over late
responses. Synchronize persistent credentials across tabs. Never create a global
token injector or redirect handler in the shared API client.

## Completion boundary

This slice provides the foundation, development health check, real admin login,
session restoration and a protected profile landing with logout. Business data
screens, guest/staff link validation, caches, PWA/offline support, content setup
and deployment are not implemented here.
Report typecheck/lint/build separately from actual browser/backend/mobile checks.
