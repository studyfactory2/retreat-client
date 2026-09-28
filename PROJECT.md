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
  when needed. Admin login/layout/dashboard/calendar/stays/properties/submissions, entry and dev exist; guest/staff
  follow later.
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
Verify current identity on restore and focus. A pending focus check for the same
already-verified credential keeps the screen mounted to preserve form inputs;
initial/replacement credentials remain blocked until verified. Auth rejection/expiry clears it,
temporary failures block protected content with retry while retaining credentials.
Cancel and version pending operations so logout/newer sessions win over late
responses. Synchronize persistent credentials across tabs. Never create a global
token injector or redirect handler in the shared API client.

## Administrator dashboard

`features/admin-dashboard` validates GET /admin/dashboard, and
`features/admin-properties` loads every page of GET /admin/properties for the
selector, including inactive properties. The screen owns filters, cancellation,
loading/retry and empty states. Filters stay in the URL to survive refresh/back
navigation and session verification. Never put credentials in URL parameters.
Feature 401/403 responses reject only the session token that made the request;
a late response must not clear a newer login.

Arrival/departure counts are planned active stays on the selected Seoul date,
not physical occupancy. Checklist counts use current evidence for those stays.
Maintenance starts and completions belong to the selected date, but unfinished
maintenance and open issues are current work across all dates. Show those groups
separately. Past dates are not historical database snapshots. Missing or failed
responses must not become zero counts. Refresh is manual; no polling is enabled.

## Completion boundary

The frontend provides the foundation, development health check, real admin login,
session restoration, a responsive admin layout with mobile bottom navigation, a connected operations
dashboard, a calendar with selected-day stay lists, and manual stay registration,
details and editing, plus property registration and settings. The stay list now includes
search/status/property filters, cancellation/restoration and revision history. Excel import
now provides upload, saved preview, row review/exclusion and final confirmation.
Read-only checklist records include filters, saved details, revision history and private photos.
Other management screens, guest/staff link validation,
caches, PWA/offline support, content setup and deployment remain outside this
slice.
Report typecheck/lint/build separately from actual browser/backend/mobile checks.

## Administrator calendar

`features/admin-calendar` owns the validated GET /admin/calendar contract. Fetch
every page for the visible month (limit 100), include inactive properties, and
fail visibly if pagination is inconsistent or incomplete. The backend excludes
cancelled stays. Each page is a separate server snapshot; this is a current view,
not a historical report. Reload when the list changes during pagination.

`screens/admin/calendar` separates the screen, fetch hook, calendar model,
month grid and selected-day list. Date/property filters live in URL search
parameters. Changing the selected day within the loaded month needs no new
calendar request. Month/property changes cancel pending requests and hide stale
data. Failed data is never displayed as an empty calendar.

Classify date cells using the API's Seoul expected dates. A stay appears from
its arrival through its checkout day inclusive; a midnight checkout still has a
departure event. Same-day arrival/departure counts as one stay with two events.
Middle days show a continuing planned schedule, not observed occupancy. Render
checklist statuses and review reasons supplied by the API without inferring
physical presence, late submissions or completed cleaning.

Dashboard and calendar reuse the property-options hook and Seoul date helpers.
Calendar loading, empty, failed/retry and expired-session states remain distinct.
There is no calendar library, drag/drop, polling or new dependency.

## Administrator stays

`features/admin-stays` owns validated list/detail/history reads and POST create,
update, cancel and restore operations. Screen-specific form values, validation, conversion,
fetch/save hooks and components live in `screens/admin/stays`.
Calendar links open `/admin/stays/new` or `/admin/stays/:id`; date/property query
parameters preserve the return context. Successful saves return to the refreshed
calendar scoped to the saved property and an applicable date. Legacy dates outside
the calendar range fall back to the stay detail screen.

The form uses Seoul local date/time values. Suggested new-stay times (15:00 and
next-day 11:00) are clearly labeled editable examples, not property policy.
New or changed dates must fit the calendar's 1900–2100 range. Unchanged legacy
timestamps retain their original precision and are omitted from update bodies.
Only changed fields are sent; blank optional text becomes null. No-op updates do
not create revisions. The property is fixed after creation. Inactive properties
allow guest/notes corrections, but no creation or date changes. Cancelled stays
show details without an edit action.

Updates send the loaded currentRevision as expectedRevision. Stale conflicts
require explicit reload/review; never automatically rebase or resend. Backend
overlap/validation errors retain input. Duplicate submit clicks are blocked.
Network/timeout/5xx/malformed-success responses can follow a committed mutation:
block resubmission and direct the administrator to check the saved record first.
Requests are aborted/fenced on unmount or credential change; no mutation retries,
no guest account creation and no notifications are added.

Dirty forms warn on explicit Cancel/reload and browser unload. They are not
persisted in browser storage; SPA back/sidebar navigation is not globally blocked.
Temporary verification outages still block access and can unmount unsaved forms.

## Administrator properties

`features/admin-properties/admin-property-management-*` owns full validated
property DTOs and GET list/detail plus POST create/update. Existing dropdown APIs
remain separate so dashboard/calendar/stay selectors keep their narrow contract.
`screens/admin/properties` separates screens, cards, form/model, fetch and save
hooks. Routes are `/admin/properties`, `/admin/properties/new`, and
`/admin/properties/:id`; the last route opens settings for the selected property.

List search/status/page filters live in the URL; the server paginates 12 records
per page. Out-of-range pages are clamped after a valid response. Failed requests
never appear as empty lists. New records start active. Editing sends only changed
fields, including explicit false values and null for a cleared region. There is
no optimistic concurrency/revision field in this backend contract; concurrent
changes to the same field are last-write-wins. No automatic mutation retries.

Activation and vehicle-registration settings are saved through the edit form.
Assigned staff is read-only in this slice; staff assignment, QR controls, guides,
and checklist management follow separately. Same-name errors preserve the form;
unknown save results block resubmission and direct the user back to the list to
check the result. Token changes/unmount abort and fence pending responses.
Dirty forms warn on explicit Cancel and full-page unload; sidebar/back navigation
is not globally blocked. Guest/staff screens and PWA support remain separate slices. Keep the current OH BOK branding until the
client/operator branding choice is confirmed.

## Administrator navigation

`AdminNavigation` owns the four menu entries and their route groups.
One navigation tree appears as a sidebar above 760px and a fixed bottom bar at
760px and below. Mobile links use equal columns, icons above labels, a blue active
state and a minimum 56px touch target. The page reserves space for the bar and
its bottom safe-area inset; the phone padding override preserves that clearance.
The current viewport stays contained; `viewport-fit=cover` is deferred to the PWA
slice, which must handle safe areas across public as well as admin screens.

Stay list/creation/details remain in the calendar navigation group; property creation
and settings remain in the properties group. Submission list/details have their own
제출 기록 entry. Links expose the current page or
section to assistive technology. Path changes reset scroll and focus the main
content; filter/query changes do not reset the layout's scroll position. Login,
guest and staff routes do not mount administrator navigation. PWA installation,
service workers and offline support are not part of this layout slice.

## Administrator stay list and history

The calendar and `/admin/stays` share a calendar/list view switch under 이용 일정.
The list fetches 12 stays per page with URL-backed search, property and status
filters; inactive properties are available for historical lookups. Valid empty,
loading and error states stay distinct. Invalid/out-of-range pages are normalized
or clamped. List entry into create/detail preserves whitelisted filter context;
new stays open their detail after creation, while corrections refresh the detail.
Calendar entry retains its existing date/property return behavior. An uncertain
creation result still directs the administrator to the date/property calendar to
locate a possibly-created record.

Detail actions cancel or restore through POST /admin/stays/:id/cancel and
POST /admin/stays/:id/restore with expectedRevision and a required reason.
Restoration is disabled for a currently inactive property; the backend checks
current property activity and overlapping active stays. Cancellation preserves
records and history. Revision/state conflicts and uncertain responses block
resubmission until explicit reload/review. Reasons remain after rejected writes;
explicit Back/reload asks before discarding them. No automatic retries.

GET /admin/stays/:id/history returns five revisions per page. The UI shows the
actor, action, Seoul timestamp, reason and before/after stay fields. Expand a
revision to inspect its saved snapshot. The next older page supplies the previous
snapshot for the last comparison on a page. Totals and version boundaries must
agree; concurrent pagination changes require refresh rather than mixed history.
Property label changes are shown in snapshots but not attributed to a stay edit.
Successful status changes reload detail/history; a manual detail refresh also
allows the administrator to reconcile newer history.

This slice was checked with temporary synthetic API/browser fixtures, including
filters/paging, cancel/restore, conflicts, unknown save outcomes and 320px/390px
layouts. These checks do not establish real authenticated backend or device proof.
That stay-list slice added no dependencies, repository test files, PWA, Excel import
or guest/staff UI.

## Administrator Excel stay import

`features/admin-stay-imports` owns the validated preview, saved-preview, review and
confirmation contracts. `screens/admin/stay-imports` separates upload/mappings,
review forms, original cells, result rows, filters/summary/confirmation, state and
styles. Calendar and list link to `/admin/stays/imports/new`; a saved preview uses
`/admin/stays/imports/:id`. There is no batch-list endpoint: keep the preview URL
to resume it. Mobile rows become cards within the existing bottom-navigation shell.

Upload one genuine binary `.xls` file, at most 5 MiB, using the fixed backend
roster template. Optional exact sheet-name mappings select active properties.
Client filename/size checks provide early feedback; the backend verifies format,
contents and mappings. Never parse or execute workbook formulas in the browser.
Uploading creates a preview, not stays. An unknown upload outcome retains the
file/mappings and requires an explicit new-preview retry with a duplicate-preview
notice. Browser storage never persists the workbook or review form.

Saved preview reads use page 20 with URL-backed validation/action filters. The
summary always covers the whole batch, independently of the displayed page.
Source A:L values remain read-only beside the proposed normalized values. Date-only
rows have empty timestamp controls and must receive explicit Seoul times; no
arrival/departure policy is inferred. Review sends the complete proposed row with
`expectedVersion`; blank optional text becomes null. Saving acknowledges source
warnings and revalidates the entire batch. Excluded candidate rows may be reviewed
and included again; informational rows without a candidate stay remain read-only.

Review responses are not the current filtered page, so reload that page after
success. Other administrators may have changed the batch after a write. Conflicts
and uncertain write outcomes block further mutations until explicit reload; retain
unsaved input and ask before discarding it on explicit Back/reload or browser unload.
SPA sidebar/back navigation is not globally blocked. Token change/unmount cancels
and fences requests, and feature 401/403 rejects only the requesting credential.

Final confirmation applies to the entire batch, requires every included row ready,
and asks explicitly before registration. A fresh backend conflict requires row
review/exclusion before another attempt. Confirmed previews show the receipt and
links to imported stays without write controls. Upload/review/confirm use a 90-second
request timeout to accommodate parsing and the backend transaction limit; shared
API requests retain their 30-second default. Never retry mutations automatically.

Verification used the real compiled backend XLS parser/row validator with disposable
in-memory API/browser fixtures, plus a genuine `.xls` workbook with fictional guests.
This proves the fixture workflow, not live authentication, S3 `imports/` permissions,
or database integration. The user performs the real upload. No backend changes, new
app dependencies, repository test files or PWA support were added.


## Administrator checklist records

`features/admin-submissions` owns validated GET list/detail/history/photo-view
contracts. `screens/admin/submissions` separates filters, responsive rows, saved
record rendering, history, photo viewing and request hooks. Routes are
`/admin/submissions` and `/admin/submissions/:id`. List/detail return links preserve
only approved filter parameters. Stay detail links filter by `stayId`; calendar
checklist links also select type and SUBMITTED status, without a date filter that
would hide records submitted for an unexpected visit date.

List pages contain 20 records, filtered by property (including inactive), type,
status and inclusive visit dates. Date filtering uses `visitDate`, not the submission
timestamp. A stay drilldown remains until explicitly cleared. Invalid date filters
show an error and do not fetch a broader list; out-of-range pages clamp after a
valid response. Loading, failed and valid empty responses remain distinct. Abnormal
answer counts are separate from current issue status or physical occupancy.

Details render the current saved revision, with captured property/author/template
text and answers. Optional unanswered items remain visibly unanswered. Contact
fields may be null and guest QR names are self-reported; staff QR records attribute
the assigned staff captured by the backend. History pages contain five revisions
with actor, action, reason and expandable full snapshots. Historical labels never
come from current property options. Append-only revision totals and boundaries
must agree with the loaded detail; concurrent changes require explicit refresh.
There is no correction/cancel/restore or stay-link mutation in this slice.

Photos load only after an explicit click, bound to a submission, revision and photo.
The signed URL remains in volatile component state, is removed on expiry/close,
and is never persisted or displayed as text. Images use no-referrer and receive no
API Authorization header. Signing and image failures expose an explicit retry;
there is no automatic retry. Refresh/unmount/credential changes abort or fence late
responses, and 401/403 rejects only the credential that made the request.

Verification uses disposable snapshots validated by the real backend parser and a
synthetic local API/browser fixture, plus typecheck, lint and build. It does not
establish live database/S3 authorization or physical-device proof. No backend edits,
new dependencies or repository test files. Unfinished maintenance, stay linking,
issues, guest/staff workflows and PWA remain separate slices.
