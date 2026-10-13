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
- `src/app/screens/<area>/<screen>`: route screens at the domain root, with
  supporting `components/`, `hooks/`, `model/`, and `styles/` folders as needed.
  Admin login/layout/dashboard/calendar/stays/properties/stay-imports/submissions,
  maintenance/issues/staff/reports/more, guest/entry, guest/draft, guest/submission, guest/issues, entry and dev exist;
  guest photos, final submission, receipts and answer corrections are implemented.
  Staff QR entry and maintenance start live in staff/entry; partial checklist
  editing and saving live in staff/draft. Neutral draft/entry selects the validated
  guest or staff flow, including completed staff receipts. Staff uses a guided
  check/photos/review flow with repair reporting and final submission.
- `src/app/shared/ui` and `shared/layout`: business-neutral reusable components.
- `src/app/styles`: reset, shared tokens, base styles and their single entrypoint.

For admin domains, keep `*Screen.tsx` (or the layout entry) and a small `index.ts`
at the domain root. `index.ts` exports only the route screens/layout for the router.
Supporting forms/cards/rows belong in `components/`; screen state and request hooks
in `hooks/`; pure validation, formatting and navigation helpers in `model/`; and
screen CSS in `styles/`. Create only folders with actual files. Internal modules
import their collaborators directly rather than through the screen entrypoint.
Shared administrator session UI and styles live in `screens/admin/components/`
and `screens/admin/styles/`. API contracts remain in `features/`; business-neutral
UI remains in `shared/`. Preserve this structure as later slices are added.

Use named exports, small focused components, scoped class-based CSS and shared
tokens. Screen-local code remains with its screen. Avoid empty scaffolding and
one growing file containing every DTO. The visual direction follows the approved
blue/navy/white references: cobalt primary actions, deep navy headings, white
surfaces, cool pale backgrounds, restrained shadows and generous spacing. Keep
ITCEN as the primary text brand across public, admin, guest and staff screens,
with OH BOK credited discreetly as the operator. Shared identity is defined in
`core/config/brand.ts`; keep static document metadata aligned. No approved official
logo asset is present; the app icon is an original neutral retreat symbol, not a
corporate logo. Reference mockups do not define extra scope. Use
semantic HTML, keyboard focus, readable contrast, and phone-first guest/staff
layouts. Administrator pages also support desktop/tablet.

## Contracts

Yarn only; keep yarn.lock. Preserve the existing React/Vite/TypeScript setup and
Oxlint. Router is React Router 7. Native fetch follows the Study Factory transport
pattern, adapted to Retreat. No authentication library or global state package is
needed for this foundation.

Client: 5175, API: 3100 locally. GET/POST only, no backend `/api` prefix, no cookies.
The production Nginx gateway accepts public `/api/...` and strips `/api` before
forwarding to those unchanged backend routes.
Use `.env` (ignored), never `.env.example`. `VITE_` variables are public.
`VITE_FRONTEND_URL` defines the canonical public frontend origin and must match
backend `FRONTEND_URL`; it is independent of the administrator tab's origin.
Development defaults to `http://localhost:5175`; explicitly configure it for a
different or remote backend. Production requires an explicit HTTPS origin at
build time. Missing/invalid configuration fails at startup before any issuance;
a syntactically valid mismatch with the backend still rejects issued receipts.
Rebuild after changing `VITE_FRONTEND_URL` or `VITE_API_BASE_URL`.
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
and their `#token=...` fragments. Use BrowserRouter, not HashRouter. Guest entry
parses only the property guest QR and private stay credential on their matching
routes. Draft intake parses its separate private credential; staff entry reads
only its matching staff QR. Administrator sessions mount
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
Checklist records include filters, saved details, revision history and private photos,
plus administrator linking of eligible guest QR records to stays. Cleaning and
maintenance monitoring and read-only issue lists/details/history/photos are available.
Issue notes, resolution and reopening are available. Staff profile management and
property staff assignment are available. Property QR status, issuance/replacement,
local QR images and link copying are available. Property checklist setup, fixed guest template previews,
and maintenance template editing are available. Property usage guides support editing, mobile preview,
and publication controls. Personal stay links support status, issuance/replacement,
copying and revocation in stay details. Stay details also provide read-only vehicle
information with collection status and revision-review warnings. Shared issue categories support search, registration,
renaming, display order and activation. Excel report downloads provide date/property
selection and the existing three-sheet workbook. All administrator capabilities
listed in the 2026-09-30 handoff now have frontend implementations. Live admin
and guest acceptance, staff checklist workflows, caches, PWA/offline support and deployment
remain separate work; implemented features do not establish production readiness.
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
Assigned staff is displayed with a separate management screen at
`/admin/properties/:id/staff`; QR controls have a separate screen at
`/admin/properties/:id/qr`. Checklist configuration lives at
`/admin/properties/:id/checklists`; usage guides live at `/admin/properties/:id/guide`.
Same-name errors preserve the form;
unknown save results block resubmission and direct the user back to the list to
check the result. Token changes/unmount abort and fence pending responses.
Dirty forms warn on explicit Cancel and full-page unload; sidebar/back navigation
is not globally blocked. Guest/staff screens and PWA support remain separate slices. Keep the current OH BOK branding until the
client/operator branding choice is confirmed.

## Administrator navigation

`layout/model/admin-menu` defines the primary and secondary menu entries;
`AdminNavigation` handles their route groups. Desktop shows eight entries. Mobile
shows 운영, 일정, 정비, 이상사항 and 더보기. The `/admin/more` screen links to
직원 관리, 제출 기록, 운영 보고서 and 휴양소 관리; their nested routes keep 더보기 active on mobile.
One navigation tree appears as a sidebar above 760px and a fixed bottom bar at
760px and below. Mobile links use equal columns, icons above labels, a blue active
state and a minimum 56px touch target. The page reserves space for the bar and
its bottom safe-area inset; the phone padding override preserves that clearance.
The current viewport stays contained; `viewport-fit=cover` is deferred to the PWA
slice, which must handle safe areas across public as well as admin screens.

Stay list/creation/details remain in the calendar navigation group; property creation
and settings remain in the properties group. Submission list/details belong to
제출 기록, except maintenance drilldowns, which retain the 정비 context. Links expose the current page or
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
The initial records slice was read-only. Administrator stay association is now
available as documented below; answer correction/cancel/restore remain outside it.

Photos load only after an explicit click, bound to a submission, revision and photo.
The signed URL remains in volatile component state, is removed on expiry/close,
and is never persisted or displayed as text. Images use no-referrer and receive no
API Authorization header. Signing and image failures expose an explicit retry;
there is no automatic retry. Refresh/unmount/credential changes abort or fence late
responses, and 401/403 rejects only the credential that made the request.

Verification uses disposable snapshots validated by the real backend parser and a
synthetic local API/browser fixture, plus typecheck, lint and build. It does not
establish live database/S3 authorization or physical-device proof. No backend edits,
new dependencies or repository test files. Maintenance monitoring is documented below. Issues, guest/staff workflows and
PWA remain separate slices.


## Administrator checklist-to-stay linking

`features/admin-submissions/admin-submission-stays-*` owns validated candidate
reads and POST association changes. The submission screen keeps the panel,
candidate cards, editor/review, request hooks, model and CSS in their respective
components/hooks/model/styles folders. No new route or dependency is required.

The list supports URL-backed LINKED/UNLINKED filters, preserved in detail return
links. UNLINKED means eligible submitted guest QR arrival/departure records only.
Unknown filters or combinations with maintenance, cancelled records or a stayId
show errors without sending a broader request. LINKED includes private-link and
cancelled records where existing filters permit; it does not imply edit eligibility.

The detail panel offers linking, replacement, current-stay reconfirmation and
unlinking for SUBMITTED GUEST_QR CHECK_IN/CHECK_OUT records. The backend remains
authoritative for eligibility, including private-link context absent from the
reader DTO. Candidate pages contain 20 stays; guest details and planned Seoul
dates are shown beside captured guest information. Names/phones never auto-match.
Other same-type associations disable selection. Inactive properties can have no
candidates while an existing association can still be removed.

Writes require a trimmed 1-1000-character reason, the loaded submission revision
and selected stay revision. Unlinking sends explicit stayId:null and omits the stay
revision. Responses validate identities/target/version and always trigger a fresh
detail/history read; retry receipts are never applied as the latest state. Answers,
photos and earlier revisions remain intact. Association is not physical arrival
or departure evidence.

Duplicate clicks are fenced. 404/409 conflicts and unknown network/5xx/malformed
success outcomes block further saves until explicit reload/review. Reasons remain
after rejection. Closing, refreshing and explicit panel/header navigation warn
before discarding input; page unload also warns. Global SPA sidebar/back navigation
is not blocked, matching the existing form convention. Confirmation panels receive
keyboard focus. Requests abort and ignore late results on unmount/token changes;
401/403 rejects only the requesting credential. No automatic mutation retries.

Verification: typecheck/lint/build, 58 temporary API/filter contract probes and
disposable local API/browser checks for link/replacement/unlink, candidate paging,
required reasons, conflicts, unknown-result reconciliation, dirty prompts and
320px/390px layouts. These checks do not prove real database/authenticated guest
workflow integration. No backend, database, dependency or repository test edits.


## Administrator cleaning and maintenance monitoring

`/admin/maintenance` is read-only and consumes `GET /admin/maintenance`.
Feature DTOs/readers/API live in `features/admin-maintenance`; the screen domain
keeps components, hooks, models and styles in separate folders. The desktop table
becomes cards on small screens; the existing mobile navigation now has five items.

URL filters support active/inactive property, ALL/UNFINISHED/COMPLETED views,
STARTED/SUBMITTED date basis, paired optional Seoul dates (maximum 62 inclusive
days) and 20-record pagination. Dates omitted means all dates. Invalid filter
values remain visible and prevent fetching; SUBMITTED plus UNFINISHED is invalid.
Results preserve server date-descending, nulls-last, ID-descending order. Out-of-range
pages return to the last available page. Reset also clears unsaved local inputs.

UNFINISHED includes expired, blocked and review-needed drafts; COMPLETED view
means submitted records and may include NEEDS_REVIEW. UI labels it 제출된 기록
and counts matching records, never deduplicated jobs or certified completions.
Badges and reason text preserve all five classifier states. Damaged diagnostic
records can have missing staff/timestamps and inconsistent revision values.
StartedAt is opening a checklist, updatedAt is a saved change, and neither is
physical work or live-presence evidence. Status is evaluated at response asOf.
Captured staff/property labels remain historical; property active state is current.

Only classified COMPLETED records open existing saved checklist/photo/history
details. Return links retain maintenance filters/page and mobile navigation context.
The irrelevant stay-association editor is hidden for MAINTENANCE details.
Dashboard start and submission links use the selected Seoul date and property;
current unfinished links preserve property and omit dates. No derived-status-only
filters, admin resume/complete/cancel actions, automatic retries or polling.

Reads validate envelopes, identities, classifier fields, filter scope, paging and
ordering. Filter/unmount/credential changes abort and fence late responses;
401/403 rejects only the requesting credential. Loading, empty, server failure,
malformed response, property-option failure and explicit retry remain distinct.

Validation uses typecheck/lint/build and disposable API/classifier/filter probes
outside the repository. Browser checks use synthetic local data for statuses,
filters, paging, reset, errors, detail/photo/history, dashboard links and mobile
layouts. This does not establish real database/S3 integration or physical-device
PWA behavior. No backend, database, dependency or repository test files changed.


## Administrator issues: list, details and actions

`features/admin-issues` owns validated GET list/detail/history and exact-event
photo-view contracts. `/admin/issues` and `/admin/issues/:id` keep screens at the
domain root and components/hooks/models/styles in their own folders. Action APIs
use POST notes/status, with request validation and action-specific receipt readers.

The list has URL-backed property (including inactive), NEW/IN_PROGRESS/RESOLVED
status, true/false urgency and reportedAt Seoul date filters with 20-record pages.
Date inputs use native calendar pickers. Either date can be omitted; this API has
no 62-day cap. Invalid URL values remain invalid and block fetching until corrected
or reset. Clearing filters also clears local unsaved inputs. Valid empty, loading,
malformed/server-error and property-option failure states remain distinct.
Cancelled issues are excluded by the list API but can be opened directly.

Detail preserves current content, original report/reporter/photos and the latest
event. Historical property/category/template/actor labels come from saved
snapshots. Standalone guest reports have no checklist source; show a source link
only when one exists. Guest reporter information is self-entered; staff identity
was captured from the property assignment. A staff repair report is not itself an
administrator resolution. Cancelled records retain their report/history display.

History fetches five events per page and expands each saved snapshot on demand.
The loaded current version anchors history consistency; a changed or inconsistent
history asks for a full detail refresh. List filters/page survive the detail return
link. Reads abort and fence stale responses on filter/unmount/credential changes;
401/403 rejects only the credential that initiated the request. No polling/retries.

Private photos are requested lazily by issue, event and photo IDs. Do not assume
contiguous photo ordering or a photo-purpose field. Signed addresses stay only in
the mounted viewer, expire within 120 seconds and are discarded on close/unmount.
Images receive no API authorization header and use no-referrer. Failures and
expired views require explicit retry; signed addresses/error bodies are not printed.

Dashboard current-issue links separately open NEW and IN_PROGRESS lists, keeping
the selected property and omitting the dashboard date. Native mobile navigation
keeps five items through the More screen rather than adding extra bottom tabs.

Verification uses typecheck/lint/build, disposable contract/backend-reader probes
and a synthetic local API/browser session. Browser checks cover paging, filters,
original report/history, private photo expiry, stale history and 320px/390px
layouts. These do not establish real database/S3 integration or physical-device
PWA behavior. No backend, database, dependency or repository test files changed.


### Administrator issue action workflow

The detail action panel supports notes on NEW/IN_PROGRESS/RESOLVED records,
NEW to IN_PROGRESS with an optional note, NEW or IN_PROGRESS to RESOLVED with
a required note, and RESOLVED to IN_PROGRESS with a required reopening reason.
Cancelled issues have no controls. The maximum writable version is 2147483646.
Notes are trimmed and limited to 2000 Unicode code points. Blank optional status
notes are omitted. There is no transition back to NEW, cancellation action, admin
photo upload or notification in this slice.

Status changes show an explicit confirmation with the issue, target status and
exact memo before POST. Separate note saves submit directly. Reset confirms before
clearing edited inputs; page-local return and detail reload confirm before
discarding a draft. Unload warns while dirty or saving. Shared sidebar/mobile
navigation, source links and browser back remain outside this local guard, matching
the existing forms; there is no global SPA navigation blocker or browser draft
storage. Aborting a request cannot undo a server-side commit.

Every request uses the loaded currentVersion. A synchronous in-flight lock prevents
duplicate submissions. Validation errors retain editable inputs; 404/409 and
exhausted versions require a fresh read. Network/timeouts/5xx and malformed success
responses may follow a commit, so writes remain blocked until an explicit reread
and review. Never automatically retry or silently rebase a note onto a new version.
Only the initiating credential is rejected on 401/403; unmount/version/credential
changes abort and fence late results.

Success receipts validate the next version, exact event/transition/note, current
administrator, resolution fields, preserved original report and immutable issue
content/source. Newly captured property/category names may change. The verified
detail replaces only the matching loaded version; forms and paginated history reset
for the new version. A successful save and a subsequent history-read failure stay
distinct. Original report/photos remain visible and unchanged.

Verification uses disposable frontend API/model/receipt probes and the actual
compiled backend DTOs/service/reader over in-memory transactions. Browser checks
exercise notes, status transitions, confirmations, required fields, stale versions,
uncertain committed results and responsive layouts. No real database/S3 mutation,
backend/schema/dependency changes, Git staging or repository test files.

## Administrator staff and property assignment

`features/admin-staff` owns list/detail/create/update API calls, staff DTOs, request
validation and response readers. `/admin/staff`, `/admin/staff/new` and
`/admin/staff/:id` keep route screens at the domain root with separate components,
hooks, models and styles. Staff management is a secondary navigation entry and
keeps More active on mobile; the five mobile tabs remain unchanged.

Staff are profiles for property assignments and captured maintenance records, not
login accounts. Only name is required (100 Unicode code points); optional phone
is limited to 32, company/department to 100. Blank optional fields become null.
Create sends no role/password/activity fields; the backend creates active STAFF.
Edits send only changed fields, preserving explicit false/null; no-op forms do
not POST. Deactivation requires confirmation and zero assignments, including
inactive properties. Existing assignments link to their property settings.

Lists use 12-record server pages and URL-backed search/activity filters. Search
covers name, phone, company and department using backend collation semantics.
Valid empty, loading, failure and explicit retry remain distinct; valid emptied
pages clamp back to the available range. DTO readers verify identities, STAFF
roles, activity scope, pagination/order, normalized fields and mutation receipts.

Property settings link to `/admin/properties/:id/staff`. This separate workspace
avoids coupling assignment to unsaved basic property edits. The current assignee
is shown independently of the active-staff picker, which supports search and
pagination while retaining the selected worker. One worker may cover multiple
properties; each property has one current assignee. Assignments require an active
property and active staff. Null unassignment remains available on inactive
properties. No-op selection cannot save. Confirmation shows old/new assignment
and explains the effect on the previous worker's unfinished maintenance access.
Saved submissions remain intact. Assignment receipts replace only the initiating
workspace's displayed property and reset the picker/form.

Both staff editing and assignment have server transaction protection but no
expected-version field. Concurrent changes to the same field are last-write-wins;
the frontend does not claim optimistic stale-write detection. The backend rechecks
assignment/deactivation invariants. Double clicks share a synchronous in-flight
lock. 404/409 and uncertain network/5xx/malformed-success results block writes until
explicit reread/review; no automatic mutation retry. Requests abort and fence late
responses on unmount/credential changes, and 401/403 rejects only the requesting
credential. Local Back/Cancel/reload warns before discarding input and browser
unload warns while dirty/saving. Sidebar/source links and browser back remain
outside the local guard; no global navigation blocker or browser draft storage.

Verification uses disposable frontend contract/model/SSR checks and the actual
compiled backend DTOs/services over an in-memory Prisma adapter. Browser checks
cover creation, editing, null clearing, deactivation/reactivation, assigned-staff
blocking, search/paging, reassignment, inactive-property unassignment, conflict
and uncertain-result recovery, duplicate clicks, session expiry and mobile
navigation/layout at 320px/390px. These are fixture checks, not authenticated real
PostgreSQL/S3 or physical-device proof. No backend/schema/dependency changes,
repository test files or Git mutations belong to this slice.

## Administrator property QR management

`features/admin-property-qr` owns validated QR status and issuance contracts.
`/admin/properties/:id/qr` has its own `screens/admin/property-qr` components,
hooks, model and styles, reached through property settings and retaining the
properties / mobile More navigation group. Property detail supplies its name;
QR status supplies current activation and issuance. Guest and staff QR states
are separate. Inactive properties cannot issue or replace either link.

GET `/admin/properties/:id/qr` returns status only. The guest/staff POST
`/admin/properties/:id/qr/{guest|staff}/rotate` sends the exact loaded
`expectedRotatedAt`, including explicit null for first issuance. Confirmation
explains that replacement invalidates existing copies for that flow only. There
is no separate QR-disable endpoint; property deactivation suspends both links.
Issued/enabled is not proof of complete checklist or staff setup. Guest/staff
frontend forms are still separate work.

Issuance receipts validate property, flow, a strictly advancing canonical UTC
timestamp, and an exact configured-frontend-origin `/guest` or `/staff` URL with
only `#token=<43 base64url characters>`. The API passes the validated
`VITE_FRONTEND_URL` origin to the receipt reader, matching backend `FRONTEND_URL`
regardless of the administrator tab's origin. A wrong origin is treated as an
invalid receipt, not rewritten or accepted silently.

Raw links stay only in mounted screen memory and explicit user copies/downloads;
they are never put in browser storage, request keys, logs or remote QR services.
The server cannot retrieve prior raw links. Navigating away/reloading loses them;
the screen warns on its Back action and full-page unload. This is not a global
SPA navigation blocker. Manual status refresh preserves a receipt only if the
same rotation is still enabled; changed/inactive credentials are discarded.
Replacing a flow hides its old receipt while the request is pending. Other-flow
receipts remain independent. Requests abort and fence late responses on unmount,
property or credential changes. 401/403 rejects only the requesting credential.

Duplicate writes share a synchronous lock. 404/409 and uncertain network,
timeout, 5xx or malformed-success results block issuance until an explicit status
reload and fresh confirmation. Never automatically retry rotation: it may have
committed even when the raw URL response was lost. Reload can confirm state but
cannot recover a lost URL; a deliberate replacement invalidates the lost link.

The lazy-loaded `qrcode` dependency creates high-resolution PNGs entirely in the
browser, with an unmodified link fragment, four-module quiet zone, property name
and guest/staff label. `@types/qrcode` supplies compile-time types. Copy failure
selects a read-only link for manual copying; image-generation failure permits
local retry and link copying without another issuance. Downloaded PNGs can be
opened and printed. No direct printing integration, backend/schema changes,
notifications, guest/staff authentication, service worker or repository tests
are added by this slice.

Verification used disposable API/reader and hook/lifecycle probes, the actual
backend QR DTOs/services with an in-memory Prisma adapter, and browser tests with
synthetic authentication. Checks cover issuance/replacement, stale and uncertain
responses, inactive properties, duplicate clicks, session expiry, and layouts at
320px/390px. A downloaded PNG decoded to the complete issued URL; clipboard-denial
manual-copy fallback was verified. These checks do not prove real JWT guards,
PostgreSQL concurrency, deployment configuration or physical-device scanning.

## Administrator property checklist configuration

`features/admin-checklist-templates` owns validated template DTOs, definition
readers, request preparation and API calls. `screens/admin/property-checklists`
separates route screens, components, hooks, models and scoped styles. Property
settings link to `/admin/properties/:id/checklists`; each type opens a separate
`check-in`, `check-out` or `maintenance` editor under that route. Navigation stays
in the properties / mobile More group. No dependencies or backend changes added.

Each property has exactly one template slot per type, including inactive
templates. The list fetch explicitly includes inactive templates and validates
that its complete page contains at most the three unique types. Editors load a
fresh detail and validate its property/type scope. Only active properties permit
creation or updates. Existing guest CHECK_IN/CHECK_OUT templates are read-only,
including activation, as enforced by the backend. Their initial creation always
shows a complete preview and an explicit immutable-template confirmation.
MAINTENANCE supports title, section/question ordering, content, required answers
and activation. The only answer type is NORMAL_ABNORMAL.

Limits match the backend: 1–20 sections, 1–50 questions per section, 500 total;
title/section labels up to 150 Unicode characters, questions up to 300. New
sections/questions send no IDs; existing IDs survive editing and reordering.
Section payloads replace the entire definition; deleted IDs are omitted, and
questions cannot be moved between sections with an existing ID. A preview and
confirmation precede every save. Meaningful updates send the loaded
expectedVersion and require a matching saved receipt with the next version.
Existing drafts/submissions retain their captured template snapshots. There is
no template history, rollback or delete endpoint.

No-op edits do not write. Duplicate clicks share a synchronous request lock.
401/403 rejects only the requesting admin credential. Scope changes/unmount abort
and fence late responses. Conflicts, missing records and uncertain network/5xx/
malformed-success responses preserve entered values and block resubmission until
an explicit reload; no automatic mutation retry. Local Back/reload and browser
unload warn about dirty or pending input. Sidebar and browser-back navigation
remain outside the local guard; this slice adds no global navigation blocker.

Verification used disposable contract/model/hook probes and actual backend
DTO/service code over an in-memory Prisma fixture with synthetic authentication.
Browser checks cover guest creation/fixed state, validation, maintenance reorder
and add/remove, activation, no-op/duplicate writes, stale and lost-response
recovery, inactive properties, session expiry and layouts at 320px/390px. These
checks do not prove live JWT guards, PostgreSQL concurrency, deployment or physical
devices. No repository test files, database migrations or Git mutations were added.

## Administrator property usage guides

`features/admin-property-guides` owns validated GET/POST
`/admin/properties/:id/guide` contracts. The property settings entry opens
`screens/admin/property-guide`, with separate components, hooks, model and scoped
styles. Existing properties / mobile More navigation stays active.

One guide per property contains a title (100 Unicode characters), plain-text
content (20,000), and isPublished. Both text fields are required even when
unpublished; outer whitespace is trimmed and content line endings become LF.
The live mobile-width preview renders text with preserved newlines, never HTML or
Markdown. Inactive properties allow guide preparation but guest access is blocked.

First save sends expectedVersion:0; updates send the loaded version and require
a matching next-version receipt. The frontend suppresses unchanged saves. Every
save has a publication confirmation: there are no separate draft/published copies,
and editing a published guide immediately replaces the guest-visible content.
Unpublishing hides it while retaining its saved content. No deletion, history,
notifications or guest-screen implementation is added.

Duplicate saves are fenced. Scope/token changes and unmount abort pending requests
and ignore late results; 401/403 rejects only the requesting credential. Conflicts,
404 and uncertain network/5xx/malformed-success results retain input and block
resubmission until explicit reload/review. Save receipts verify content, publication,
version, actor and existing timestamps. Local return/reload and browser unload
warn about unsaved/pending input; global sidebar/browser-back navigation remains
outside these local guards. No browser draft storage or automatic mutation retries.

Verification: typecheck/lint/build and disposable feature/model/hook/editor probes;
browser checks with synthetic authentication cover first save, publication changes,
plain-text rendering, no-op/duplicate saves, dirty reload, version conflicts,
lost-response recovery, inactive-property editing, expiry and 320px/390px layouts.
Actual backend DTO/admin/guest-guide/QR services were exercised through an in-memory
fixture, including visibility rules. Real JWT/PostgreSQL, private-stay access and
physical-device/deployment behavior remain unverified. No backend, dependencies,
repository tests or database migrations changed.

## Administrator issue category management

`features/admin-issue-categories` owns validated category DTOs, request preparation
and GET/POST `/admin/issue-categories` plus POST
`/admin/issue-categories/:id/update`. The issue list links to
`/admin/issues/categories`, implemented in `screens/admin/issue-categories` with
separate components, hooks, model and scoped styles. Existing issues navigation
stays active. Categories are shared by every property, not configured per property.
The list opens inline create/edit workspaces; there is no category detail endpoint.

Search, activity and page filters live in the URL, with 12 records per page and
inactive categories included by default. Invalid or duplicate supported URL
conditions block reads until corrected or reset. Valid out-of-range pages clamp
after a response; loading, errors and valid empty lists remain distinct. The
backend orders by sortOrder, name and ID. Equal display orders are allowed;
the frontend checks numeric ordering without replacing database name collation.

Names are trimmed and limited to 100 Unicode characters. Display order is an
integer from 0 through 2,147,483,647. New categories are active. Deactivation removes
a category from new guest-report choices while preserving existing issues and
their captured category labels. The backend identifies `기타` as the fallback
category: its name cannot change and it cannot be deactivated. Its display order
can change, and a legacy inactive fallback can be reactivated. No category deletion,
history, per-property assignment, notifications or guest UI is added.

Edits send only changed fields with the exact loaded canonical UTC
`expectedUpdatedAt`. No-op forms do not write. Every save has a confirmation;
receipts verify identity, submitted fields, fallback status, preserved creation
time and an advancing update timestamp for meaningful edits. Duplicate saves
share a synchronous lock. Same-name and fallback-protection conflicts preserve
editable input; stale/missing records, other conflicts and uncertain network/5xx/
malformed-success outcomes block resubmission until explicit reload/review.
There is no automatic retry or silent timestamp replacement.

Closing, reconciling or successfully saving an editor reloads the filtered list
before showing rows again. Filter/token changes and unmount abort or fence late
responses; 401/403 rejects only the requesting credential. Local return/reload and
browser unload warn about dirty or pending input. Sidebar/browser-back navigation
remains outside the local guard, and drafts are not stored in the browser.

Verification includes typecheck/lint/build, 109 disposable feature/API/backend DTO
probes, 129 model/hook/page/editor probes, and 10 service/DTO plus 8 HTTP fixture
groups. Browser checks cover create/edit/order/activity, protected fallback,
duplicate names, filters/paging, stale edits, lost responses, duplicate clicks,
read recovery, expiry and 320px/390px layouts. The fixture uses actual backend
services with synthetic authentication and in-memory storage. These checks do not
establish live JWT guards, PostgreSQL collation/concurrency,
deployment or physical-device behavior. No backend, dependencies, repository test
files, database migrations or Git mutations are part of this slice.

## Administrator personal stay links

The stay detail screen includes an inline 개인 이용 링크 card between the stay
information and history. `features/admin-stay-links` separates DTOs, validation,
runtime response readers and API calls. The stay screen keeps the card,
confirmation, one-time receipt, request/navigation hooks, model and scoped CSS
in its existing components/hooks/model/styles folders. No navigation entry or
dependency is added. Property QR controls remain a separate feature.

GET `/admin/stays/:id/guest-link` returns safe status only. The card also reads
fresh stay details; changed revision, cancellation/property activity or checkout
context requires a full stay refresh before acting. POST `/issue` and `/revoke`
under that path send the loaded `expectedRevision` and `expectedLinkVersion`.
Confirmation shows the guest, property and planned Seoul dates. Issuance requires
an active stay/property and a future checkout-plus-seven-days deadline; revocation
remains available for issued links at inactive properties or cancelled stays.
Any stay revision change, including notes, invalidates the existing invitation;
restoring a stay does not revive it. Link writes do not create stay revisions.

Only issuance returns a raw `/guest/stay#token=...` URL. Strict readers verify
identity, next invitation version, unchanged stay revision, advancing timestamp,
exact expiry and the configured canonical frontend origin passed by the API.
The raw address remains only in mounted memory and explicit clipboard copies;
it never enters browser storage or logs.
Clipboard failure selects the read-only address for manual copying. Status refresh
preserves it only for the exact same enabled invitation. A transient failed read
hides the URL but retains it privately until a matching read succeeds. Expiry,
scope/auth changes, replaced invitations and uncertain writes discard it.

Duplicate writes are synchronously blocked. Conflicts and network/5xx/malformed
success outcomes block further writes until explicit read/review; no automatic
mutation retry or silent rebasing occurs. A lost issuance response cannot recover
its raw URL; a deliberate replacement uses refreshed versions. Requests abort and
fence late responses, and 401/403 rejects only the initiating admin credential.
Local header Back/refresh/edit/status actions and browser unload warn before losing
an issued URL; header actions are disabled during writes. Global sidebar, source
links and browser-back navigation remain outside the local guard.

Verification covers typecheck/lint/build, disposable API/hook and actual backend
service/DTO probes, and synthetic browser flows for issuance, copying, revocation,
lost responses, read recovery, changed stay context, duplicate clicks and narrow
layouts. These checks do not establish live JWT/PostgreSQL concurrency or physical
device proof. Guest/staff screens remain placeholders; vehicle review and report
downloads remain separate admin slices. No backend/schema/migration/dependency
or repository test files were changed. The user controls staging and rollout.

## Administrator stay vehicle review

The stay detail screen includes a read-only 차량 정보 card after 개인 이용 링크
and before history. `features/admin-stay-vehicles` separates DTOs, validation,
runtime readers and GET `/admin/stays/:id/vehicle`. The stay screen separates the
request hook, context/timestamp model, loading/error card, saved-detail component
and scoped responsive CSS. There are no admin vehicle mutations or review-acknowledgement
controls. Report downloads and guest vehicle entry remain separate slices.

The card distinguishes no vehicle row from a saved row whose plate is null.
Neither means the guest confirmed they have no car. It shows collection status,
the stored plate when present and the latest saved timestamp in Seoul time.
`needsReview` is true only for a non-null plate saved against a different stay
revision; the previous plate remains visible to the administrator with a warning.
Cancelled stays, inactive properties and disabled collection do not hide saved
admin data. Collection is controlled in the existing property settings.

Response readers verify the requested stay, shape, canonical timestamps, bounded
versions, normalized plate alphabet and the exact review predicate. The hook
compares the response's stay and property context with the displayed detail before
exposing the plate. Changed context or a missing stay requires an explicit full
stay reload. That action uses the personal-link navigation guard, while refreshing
only vehicle information leaves the mounted personal-link receipt intact.
Vehicle actions are disabled while the link feature is busy or its navigation
confirmation is pending. Both cards are hidden during stay editing/status actions.

Reads abort and fence late results on refresh, scope/token changes and unmount;
401/403 rejects only the requesting administrator token. Loading, malformed/error,
empty and saved states remain distinct. There is no polling, automatic retry,
browser persistence or plate logging. The existing backend owns admin permissions,
consistent stay/vehicle reads and guest invitation/version safeguards.

Verification uses typecheck/lint/build, disposable response/API and hook/model
probes, server-rendered component assertions, and actual backend service/DTO probes
with in-memory storage. These do not establish live JWT/PostgreSQL concurrency,
browser layout, physical-device or deployment proof. The offline HTML preview
could not be opened because browser policy blocks file URLs; no preview server
was started. Do not start/stop the user's local servers on 3100 or 5175 without
their explicit request. No backend/schema/migration/dependency or repository test
files were changed. The user controls staging, commits and rollout.

## Administrator Excel downloads

`/admin/reports` provides 운영 보고서 under the authenticated administrator layout.
The shared secondary menu places it after 제출 기록 on desktop and in mobile
더보기; the five-item mobile bottom bar is preserved. The form starts with the
full current Seoul month and all properties, with 이번 달/지난달 shortcuts. Dates
are inclusive calendar dates in 1900–2100, ordered and at most 62 days. Property
options reuse the existing complete paginated reader, including inactive entries.
Loading/error property lists cannot trigger an export. Form values are local,
with no browser persistence or automatic generation on mount/change.

`features/admin-reports` separates types, query validation, binary reading and
GET `/admin/reports/excel?from=...&to=...&propertyId=...`. The optional property
parameter is omitted for all properties. The existing authenticated `apiDownload`
transport reads failures as normal API errors. This request uses a 60-second client
timeout to allow generation and transfer; backend limits remain unchanged. The
feature checks XLSX MIME, nonzero size up to 16 MiB and the ZIP local-file signature.
This is bounded file validation, not a full workbook parser. The filename uses
the validated request snapshot and matches the server's date-only filename.

The screen separates components, request hook, date/file models and scoped CSS.
The hook blocks duplicate requests synchronously, aborts and fences late results
on scope/credential change or unmount, and rejects only the initiating token on
401/403. Form changes synchronously reset old results. There is no automatic retry.
Successful files use a temporary download anchor and object URL, removed/revoked
after use (URL retained 60 seconds so download consumption can finish). The status
says download was requested; it cannot establish that the browser saved the file.
No workbook, token or report content is placed in browser storage or logs.

Each workbook contains 입퇴실 제출 and 정비 제출 filtered by submittedAt, plus
이상사항 filtered by reportedAt with current status at generation. Empty reports
still contain all three sheets. This is activity reporting, not occupancy, missing
submission detection or a historical period-end database snapshot. The page
explains exclusions and the backend's 5,000-record/16-MiB combined limits. Failed,
oversized, busy or inconsistent-evidence reports remain errors, never partial files.

Verification includes typecheck/lint/build and disposable API/binary/date/request
lifecycle/download-helper, server-rendered component/navigation and actual backend
reader/workbook/service probes. Workbook bytes were generated and decoded with
the existing backend XLSX dependency over synthetic records. No local servers
were started or stopped. Live administrator JWT/PostgreSQL/S3, actual browser file
saving, responsive rendering and physical-device checks remain unverified here.
No backend, migration, dependency, repository test files or Git mutations were added.

## Administrator implementation checkpoint — 2026-10-01

The focused source/route review covers login/session/layout, dashboard/calendar,
stay list/create/edit/cancel/restore/history and XLS import, submission
detail/history/photos/stay association, maintenance monitoring, issue
detail/history/photos/actions/categories, staff profiles/property assignment,
property settings/QR/checklists/guides, private stay links, vehicle review and
Excel reports. These match the administrator features listed in the handoff;
there is no remaining handoff-listed admin UI placeholder. Guest entry and guides
are implemented in the following slice; staff and draft routes still use
AccessPendingScreen, and guest checklist workflows are not complete.

Before release, exercise the existing admin UI with real credentials/data and
verify downloads, browser navigation, narrow-screen layout and infrastructure
flows. Actual content/configuration, PWA, guest/staff UI and deployment remain
separate work. The pre-existing large-bundle warning is a separate performance
slice. The user retains staging, commit, push, migration and deployment ownership.

## Guest slice 1 — entry, mobile home and published guide

`/guest#token=...` uses the property guest QR; `/guest/stay#token=...` uses the
personal stay invitation. These route screens have their own OH BOK guest frame,
mobile Home/Guide navigation and scoped styles, outside the admin session/provider
and generic entry shell. QR home displays property name/region only; private home
also displays the guest name and planned arrival/departure in Seoul time. These
dates do not establish actual occupancy. No manager contact field exists, so no
phone number or call action is invented. Checklist definitions are validated but
there are no unimplemented checklist, photo, issue, vehicle or staff action buttons.

`features/guest-entry` separates DTOs, canonical token/response validation,
checklist-definition readers and API calls. GET `/qr/guest` and
`/guest/stays/current` load only their matching context. Opening the guide reloads
context first, then GET `/guest/property-guides/qr` or `/guest/property-guides/stay`.
All use explicit Bearer credentials with `apiRequest<unknown>`, no request body,
query parameters, cookies or admin token injection. Full guest checklist definitions
are bounded and validated; empty/partial checklist configuration is valid.

Guide identity must match the entry's property ID. Names/regions can legitimately
change between these reads; guide view uses the guide response's current labels.
Only the published title/content is displayed, as escaped text with preserved
line breaks and wrapping. No HTML, Markdown, automatic links or remote previews
are rendered. A successful `guide: null` means no guide is published and has a
distinct empty state; it is never used as a fallback for failed reads.

The fragment parser accepts the backend's exact canonical 32-byte base64url token
format. Missing/malformed fragments cause no API calls. Guest credentials remain
in the fragment and direct mounted request state only, never local/session storage,
logs, analytics, query parameters or serialized/cache/React keys. Home and Guide
use the same credential route, with only `?view=guide` changing; the full fragment
is preserved for browser refresh/back. Links derive their canonical path from
the explicit credential kind, including when React Router matches case/trailing
slash variants. The skip-to-content button does not replace the token fragment.

The request hook hides old data immediately on credential, flow or view change
and on manual refresh. Requests abort and fence stale responses on those changes
and unmount. Guide authorization failure clears the entire entry display; general
network/malformed/rate errors remain retryable and do not enter the admin session.
Personal 401 INVALID_STAY_ACCESS combines several invalidation causes; the UI does
not distinguish expiry, cancellation, revocation or changed stay revision.

Focus/visibility return and persisted pageshow revalidate context; BFCache restore
also invalidates pending pre-freeze requests. There is no polling or automatic
network-error retry. Personal data is hidden at the returned expiry via a local
timer; this timer depends on the device clock, while every server read remains
authoritative for access. Background mutations can remain unseen until the next
read; no real-time invalidation channel is claimed. Guide navigation intentionally
starts at the top, and fresh states move focus to main content.

Verification covers typecheck/lint, a production build with explicit valid public
HTTPS origins, disposable feature/parser/navigation/lifecycle/component/router
probes, and actual backend service/DTO fixtures with in-memory data. Preserve the
committed ff64022 canonical-origin and submission navigation fixes. No backend,
schema, dependencies, repository test files, migrations, Git mutations or server
start/stop operations belong to this slice. Live guest data, actual device scanning
and complete authenticated visual acceptance remain separate verification.

Browser inspection reused the already-running frontend without tokens: missing-link
screens were checked at 320px/390px with no horizontal overflow. It exposed and
verified a fix to the main-region programmatic-focus outline. Automatic approval
review blocked token-bearing browser navigation as a possible live backend request;
valid home/guide states were verified synthetically, not visually with live guest data.
Build validation used example HTTPS origins; deployment must rebuild with real origins.

Staff/draft screens, checklist creation/save/submit/corrections, photos, issue
reports, vehicle registration, PWA and deployment remain future slices. Later
deployment direction is one EC2 running Nginx/frontend, NestJS and private
PostgreSQL through Docker Compose, with persistent database storage and off-server
backups. No deployment work is included here. Production frontend builds still
require VITE_FRONTEND_URL matching backend FRONTEND_URL and VITE_API_BASE_URL.


## Guest slice 2 — checklist start, temporary save and resume

Guest home now offers available CHECK_IN/CHECK_OUT checklists. Missing templates
show an unavailable state. Start views retain the entry credential in the fragment
while using `?view=check-in` or `?view=check-out`. Property QR starts collect a
required name and native-picker visit date (1900–2100, Seoul today initially),
plus optional company, department and phone. Personal stay starts show the known
name and planned Seoul date; identity and date are chosen by the backend.

`features/guest-drafts` owns typed inputs, bounded response readers and scoped
requests. `POST /submission-drafts/guest/start` uses a property guest QR;
`POST /guest/stays/drafts/start` uses a personal stay credential and sends only
requestKey/type. Each explicit start uses a UUID request key. The returned receipt
contains a separate private draft credential and canonical `/draft#token=...` link.
The URL must match configured `VITE_FRONTEND_URL`, path, token and expiry before
opening the local draft route. Tokens are never browser-storage/cache/query keys.

`/draft` sits outside administrator session providers and renders only guest
check-in/out drafts. `GET /submission-drafts/current` uses the private draft
credential to load the captured author and template, saved answers, revision
timestamp and expiry. Staff maintenance editing is not implemented here.

The editor uses the captured template, preserving its wording/version even if an
administrator changes the current checklist. Partial answers and an empty answer
list can be saved. NORMAL clears abnormal description/urgency; ABNORMAL allows
an optional description and urgency. A general note is optional. Explicit
`POST /submission-drafts/save` sends all answers and expectedUpdatedAt, with no
staff-only repair fields. A successful response must preserve draft identity and
snapshots, advance updatedAt and match the submitted normalized answers.

Concurrent changes require explicit reload/review; no automatic rebase or mutation
retry is performed. A failed/ambiguous start may already have created a draft, and
its one-time credential cannot be recovered by repeating requestKey. A deliberate
new start can create a separate draft. An uncertain save blocks another write
until the current server state is checked. Keep the private resume link to reopen
the saved draft; the guest home has no draft discovery/recovery endpoint.

Temporary save is not final submission and does not create completed checklist
evidence or issues. Photos, final submit/receipt/correction, guest issue reports,
vehicles, staff screens, PWA and deployment remain later slices. No backend,
schema, migration or dependency change is needed for this frontend slice.

Draft requests are fenced on credential replacement, unmount and expiry. Focus,
visibility return and persisted pageshow revalidate access while preserving dirty
answers. An interrupted write remains uncertain until deliberate reconciliation.
Authorization rejection clears displayed guest data. Network revalidation failures
retain local input but block saves. Local expiry timers depend on the device clock;
the backend remains authoritative and there is no live invalidation channel.

Explicit start-screen links and draft reload protect unsaved input, and browser
unload warns while dirty/pending. Same-document browser Back/Forward is not
globally blocked by the existing BrowserRouter. The UI tells guests to save before
leaving; unsaved answers are not persisted or recovered after such navigation.

Verification for this slice: frontend typecheck, Oxlint and a production build
with explicit sample HTTPS origins passed. Temporary API/model/component probes
covered 166 assertions; 20 additional start/editor lifecycle scenarios covered
conflicts, uncertain outcomes, token replacement, stale responses, expiry and
foreground/BFCache recovery. Browser checks used an isolated in-memory fixture
with real components: QR check-in, personal stay check-out, partial save/readback
and conflict UI at 320px/390px. No horizontal overflow was observed in the checked
states. A native confirmation interrupted browser automation; discard acceptance
was checked by lifecycle probes. No live guest credentials, database writes,
physical-device or deployed acceptance was performed. The existing large-bundle
warning remains (main chunk about 822 kB minified); production readiness is not
implied. The user's existing frontend/API servers were not restarted.


## Guest slice 3 — photos, review, final submission and receipt

The same private `/draft#token=...` route supports guest CHECK_IN/CHECK_OUT photo
uploads, a review step and completion. It checks GET `/submissions/receipt` first:
only 409 CHECKLIST_NOT_SUBMITTED permits opening the draft editor. A submitted
link opens its original completion receipt. Maintenance credentials remain outside
this guest screen. A draft access rejection is checked against the receipt to
handle another tab submitting between reads.

`features/guest-draft-photos` owns file validation, bounded READY-photo/list/view/
remove receipts and explicit draft-token requests. Upload uses POST
`/submission-drafts/photos` with a single `file` FormData field. The browser sets
the multipart boundary. NestJS validates and normalizes the image before storing
it privately in S3; the frontend never receives AWS keys or a direct-upload URL.
JPEG, PNG and WebP input is limited to 10 MiB per file and 40 draft photos. HEIC,
GIF, SVG and animated images are unsupported; server decoding remains authoritative.

GET `/submission-drafts/photos` reconciles READY photos. Uploads run sequentially;
uncertain writes stop the queue until deliberate reconciliation. Pending backend
reservations do not appear in this list, so it cannot prove that all uploads have
finished. POST `/submission-drafts/photos/:id/remove` uses an empty body. Signed
GET `/submission-drafts/photos/:id/view` links are fetched on demand, rendered
without API credentials/referrers and hidden at expiry. URLs live only in mounted
state; no local storage, public bucket exposure or photo prefetch is introduced.

Guests save their latest answers before review. Required checklist answers must
be complete. Every remaining READY photo must be mapped exactly once to an
ABNORMAL item, using the guest-only DEFECT purpose; photos are optional. Unwanted
photos can be removed before review. The final payload contains only the saved
expectedUpdatedAt and ordered photo mappings; saved answers stay authoritative.
Editing and photo mutations are locked while reviewing or submitting. A fresh
photo list check prevents silently dropping another tab's uploads.

`features/guest-submissions` owns validated GET `/submissions/receipt` and POST
`/submissions/submit`. The backend atomically saves revision one, photo references
and one issue for each abnormal answer. Identical retries are idempotent. Lost,
malformed or server-error submit responses retain an immutable in-memory payload
and require receipt reconciliation; no automatic mutation retry is made.
Completion shows the original submission counts, Seoul date/time and link expiry,
not proof of physical occupancy or a promise of automatic stay matching.

The completion receipt uses the draft's existing expiry. Reopening a submitted
link shows the receipt, not editable answers. Final answer correction, standalone
guest issue reports, vehicle registration, staff screens, PWA and deployment remain
separate slices. No backend/schema/dependency change is required here.

Verification: typecheck, Oxlint and a production build with sample HTTPS public
origins passed. Disposable probes covered 77 new photo/submission API assertions,
27 draft/finalization and 13 photo lifecycle scenarios, 17 photo component checks,
and 148 existing draft/start contract/model checks. Isolated browser fixtures
verified photo preview, file selection, uncertain-upload reconciliation, inline
removal, photo-to-item mapping, successful receipt and recovery of a lost submit
response without another POST. Checked 320px/390px states had no horizontal
overflow. Required-answer rejection and saving were also observed in the browser.
These are synthetic checks: no real guest credential, S3 upload, database mutation,
admin readback, physical device or deployment acceptance was performed. The
existing bundle-size warning remains (main chunk about 857 kB minified). Existing
frontend/API servers were not restarted; Git remains user-owned.


## Guest slice 4 — submitted detail and answer corrections

The original `/draft#token=...` completion receipt remains revision-one evidence.
Its `제출 내용 보기` action opens `/draft?view=submission#token=...` using the same
private draft credential. The separate screen reads the latest saved snapshot,
including captured guest/property/template information, answers, notes, private
photo associations and revision. It does not mount the old draft editor or its
receipt lifecycle, so focus checks preserve in-progress correction inputs.

`features/guest-submission-details` owns bounded runtime readers, normalized
correction bodies and three existing backend APIs:

- GET `/guest/submissions/current`: latest submitted CHECK_IN/CHECK_OUT snapshot.
- GET `/guest/submissions/photos/:id/view`: short-lived view URL for a current
  submitted photo, requested only when the guest selects `사진 보기`.
- POST `/guest/submissions/correct`: full desired answer list, generalNote,
  optional reason and expectedRevision. No identity, template, staff repair or
  photo mutation fields are sent.

The screen separates detail, editor, before/after review, notices and photo
components from its lifecycle hook/model/styles. Guests explicitly enter edit
mode, complete required answers, review normalized differences and acknowledge
the photo/history notice before saving. Blank optional notes become null; blank
reason is omitted. Reason alone does not create a correction. Revision overflow
blocks further edits. Validation failures retain input.

Photos cannot be uploaded, replaced or directly deleted after submission. When an
ABNORMAL answer becomes NORMAL or is cleared, its current photo associations are
removed. Earlier snapshots retain their evidence, and later ABNORMAL answers do
not automatically reattach earlier photos. The review lists the number of photos
that will leave the current snapshot. Existing administrator issue statuses,
resolutions and cancellations remain controlled by the backend; guest corrections
do not close/reopen/cancel those issues.

A correction response is followed by a latest-detail read. Exact receipt revision
readback must match normalized answers and expected retained photo metadata; a
later revision is shown explicitly as newer than the saved request. Conflicts
retain input and require an inline discard/reload confirmation. There is no
silent rebase or automatic mutation retry. Uncertain responses retain an immutable
in-memory request body. A GET showing matching answers alone cannot prove that
this request and its reason were saved. Guests may explicitly retry the identical
request for its receipt, or discard local input after a freshly verified advanced
revision makes the old expectedRevision unable to mutate current state.

Access expiry/rejection clears sensitive content. Token changes, unmounts and
late responses are fenced; foreground/BFCache checks preserve input while blocking
writes until access is verified. A submitted-photo 401/403 rejects the owning
screen. Signed URLs never receive API credentials/referrers, are hidden at expiry
or scope changes and are not persisted. Unload warns while dirty or unresolved;
the existing BrowserRouter still does not globally block same-document Back/Forward.
Losing the tab loses unsaved input and the in-memory retry body.

Verification: 76 API boundary, 142 correction lifecycle, 34 private-photo lifecycle
and 36 component assertions passed in disposable probes, plus 148 existing
guest draft/start regression assertions. Isolated browser fixtures
verified receipt-to-detail navigation, private photo display, ABNORMAL-to-NORMAL
review/photo removal, saving/readback, an unchanged original receipt, lost-response
reconciliation with an identical retry, conflict/discard/reload and photo-access
rejection clearing guest details. Checked 320px/390px layouts had no horizontal
overflow. These are synthetic checks, not real S3/database/admin-readback or
physical-device acceptance. No backend/schema/dependency or Git changes are part
of this slice. Typecheck, Oxlint, changed-code Prettier checks and a production build using
explicit sample HTTPS origins passed. The existing bundle-size warning remains
(main chunk about 890 kB minified). Existing servers were left running unchanged.


## Guest slice 5 — property-QR problem reporting

Property guest QR home and bottom navigation now expose `불편사항 신고` at
`/guest?view=report#token=...`. This uses only the property guest QR credential.
Personal-stay entry never mounts this screen, even with `?view=report`; it keeps
its personal home and two-item navigation. Name is self-reported and this flow
neither creates a guest account nor matches a stay/checklist submission.

`features/guest-issues` owns strict runtime readers, bounded normalized payloads
and the existing guest report/photo API contracts. Screen-local components,
hooks, models and styles live under `screens/guest/issues/`. The core request
helper accepts an explicit `photoToken` only for issue photo view/remove paths,
with QR Bearer authorization; it never injects photo credentials globally.

Flow and endpoints:

- GET `/qr/guest` verifies the property QR before loading categories.
- GET `/guest/issues/categories` returns active categories. Empty categories
  block reporting and uploads with a message to contact the administrator.
- POST `/guest/issues/photos` uploads one optional file with FormData. The client
  queues files sequentially, permits up to ten JPEG/PNG/WebP files of 10MiB each,
  and retains the one-time photo credential only in the open form.
- GET `/guest/issues/photos/:id/view` requests a short-lived preview only when
  selected. POST `/guest/issues/photos/:id/remove` removes an unclaimed photo.
  Both carry `X-Photo-Token` in addition to the QR Bearer. Signed image URLs
  receive no API credentials or referrer and hide on expiry/scope changes.
- POST `/guest/issues/report` sends a fresh requestKey, categoryId, name (100),
  title (300), optional description (2000), and ordered private photo claims.
  Review freezes the normalized body and requires explicit acknowledgement.
  The existing backend creates the issue/event and claims photos atomically.
  Completion displays the original receipt, not the current repair status.

A lost/malformed upload response cannot recover its one-time claim: the queue
stops, and the guest must explicitly abandon that selection before continuing.
An uncertain remove preserves the claim and permits the identical deletion retry.
Uncertain report responses preserve the exact immutable body/requestKey and lock
editing, photo changes and app-link navigation; only an explicit identical retry
can recover the receipt. Backend replay compares the original ordered claims even
after photo expiry or category deactivation. No automatic POST retry occurs.
Confirmed receipt clears local photo credentials without deleting claimed photos.

Foreground/BFCache checks preserve input while revalidating QR/category access.
Category changes require fresh review, and QR rejection clears sensitive form and
photo state. Property/token changes and late responses are fenced. Form/photo
credentials and retry bodies are never persisted. Supported report entry links
use full document navigation, so native Back can trigger the unload warning;
app links use an inline discard confirmation and the active report link is inert.
Browser warnings cannot guarantee preservation on mobile termination. Closing or
reloading the tab loses its input, photo access and only retry body; no guest issue
lookup, edit or reopen endpoint exists. Receipt copy states this limitation.

This slice adds no backend/schema/dependency changes. Personal-stay reporting,
urgency, guest issue tracking/editing, vehicles, staff screens, PWA and deployment
remain outside this slice. Existing private `photos/*` storage permission is reused.

Verification: TypeScript, Oxlint, changed-code Prettier and a production build with
sample HTTPS origins passed. Disposable probes passed 533 new contract, transport,
report/photo lifecycle and component assertions, plus 148 existing guest
regression assertions. Isolated browser fixtures exercised QR entry, required-field
validation, sample upload/private preview, leave confirmation, review, receipt,
and lost-response identical retry (two POSTs, one issue). Empty categories and
personal-link separation were checked; 320px/390px states had no horizontal
overflow. These are synthetic checks, not live S3/database/admin readback or
physical-device acceptance. The existing bundle-size warning remains (main chunk
about 935 kB minified). Existing servers and Git were left under user control.

## Guest slice 6 — personal-stay vehicle information

Personal-stay home (`/guest/stay#token=...`) shows a Korean `차량 정보` card only
when the property's `vehicleRegistrationEnabled` is true. Shared property QR,
guide/start views and private draft screens do not load this feature. The card
reads one current plate, saves/replaces it, and explicitly clears it after inline
confirmation. This collects information for the manager; it neither verifies a
legal registration nor registers parking access. A cleared plate does not assert
that the guest has no vehicle.

`features/guest-stay-vehicles` separates types, validation, response readers and
GET/POST `/guest/stays/vehicle`. Both pass only the personal-stay Bearer credential;
no stay/property ID, query parameter, admin JWT, QR or draft token is sent. The
reader compares returned stay/property IDs with the verified entry context.
Property names may change. POST sends exactly `{ expectedVersion, plateNumber }`;
null explicitly clears. Non-null text uses backend normalization: NFC, surrounding
trim, ordinary-space removal and uppercase, followed by 3–20 characters from
digits, A–Z, Hangul syllables or hyphens, with at least one digit. Internal tabs,
newlines, markup and unsupported punctuation fail validation. Save receipts must
match the normalized intent, advance the expected version by exactly one, and
have enabled collection, no confirmation requirement and a saved timestamp.

Screen components, request/lifecycle hook, pure model and scoped mobile styles
remain in `screens/guest/entry/`. The hook lives above the temporary home loading
screen so same-link refresh/network failures retain input in memory. Writes use
a synchronous lock and fence late responses after credential/scope changes,
refresh and unmount. Foreground/BFCache checks reuse the entry lifecycle and
interrupt an in-flight write as uncertain. Expiry timers remain active through
temporary entry failures. Vehicle access rejection clears private form data and
rejects the owning entry screen, without touching administrator sessions.

Conflicts and lost/malformed/uncertain POST responses block further writes until
a fresh GET and explicit review. There is no automatic POST retry or silent
rebase. Matching text from a later GET does not prove that the earlier request
committed. A successful GET supplies the version for the next deliberate save.
The maximum readable version is 2147483647; it is visibly read-only. Disabled
collection clears guest plate/input data and removes the editing card. The
administrator vehicle display remains unchanged.

When the backend returns `needsConfirmation`, the earlier plate/timestamp remain
hidden and no cached plate is restored. The guest enters a fresh plate or
explicitly clears the value to confirm the current stay. Newly typed input after
this hidden state survives same-context refresh; new scope or newly hidden data
clears old input. Token and private state remain fragment/in-memory only, never
browser storage, logs, query parameters or cache keys.

App-link navigation and document unload warn about unsaved/unresolved work.
The existing BrowserRouter still does not globally intercept same-document
Back/Forward. Closing/reloading/leaving can lose unsaved input; save before
navigation. No backend/schema/dependency, environment, migration, server-lifecycle,
Git or deployment work is included. Staff screens, PWA and deployment remain
later slices.

Verification: frontend TypeScript, Oxlint, changed-code Prettier using the exact
repository configuration, and a production build with sample HTTPS public origins
passed. Temporary probes cover 155 feature/API assertions, 58 vehicle lifecycle
assertions, 61 component/entry-rejection assertions, 50 existing guest-start
regression assertions, and 10 actual backend DTO/service checks with in-memory
fixtures. No repository test files were added. The browser URL policy blocked an
isolated static preview, so this slice has no new visual/browser acceptance.
These checks do not prove live database/HTTP guard behavior, administrator
readback or physical-device layout. The existing bundle warning remains (main
chunk about 953 kB minified). Deployment must rebuild using real public origins.

## Staff slice 1 — QR entry and read-only maintenance home

`/staff#token=...` now renders an OH BOK mobile staff frame outside administrator
session providers and the generic entry shell. It reads only the canonical
32-byte base64url staff QR fragment. Missing/malformed fragments make no API
requests. Credentials remain fragment/in-memory only, never rendered, persisted,
logged, sent in query parameters, or serialized as cache/React keys.

`features/staff-entry` separates types, token validation, context/checklist
readers and GET `/qr/staff`. The shared transport receives an explicit staff
Bearer token with no body/query parameters, cookies or automatic retry. Responses
are read as unknown and require STAFF flow, safe property/assignee labels and
zero or one MAINTENANCE template. Guest checklist acceptance remains unchanged.
Nested definition readers enforce schemaVersion 1, UUID v4 identities unique
across sections/items, 1–20 sections, 1–50 items per section, at most 500 items,
bounded titles/labels, boolean required and NORMAL_ABNORMAL answer type. Unknown
nested definition fields are rejected.

The home displays property name/region, `담당 직원`, checklist title and a working
native disclosure preview showing ordered sections/items. Required-item labels
explain template requirements, not completion. Preview text is escaped plain text;
there are no editable controls, completion counts, work-status claims or future
action buttons. The configured assignee is not proof of who is holding the phone.
`assignedStaff: null` and `checklists: []` are independent valid configuration
states with Korean administrator-contact guidance; either available part remains
visible. No staff login, roster choice, guide endpoint or extra navigation tabs
are introduced.

The screen separates frame, home, preview and access-state components from its
hook, fragment model and scoped styles. Reads abort and fence late results on
credential changes, refresh and unmount. Refresh/loading/errors hide previously
read context. Foreground/visibility return and BFCache restoration revalidate
access; stale pre-freeze responses cannot restore old content. Authorization
rejection clears displayed information. 401 INVALID_QR is generic and does not
name a guessed rotation/deactivation cause. Temporary failures and rate limits
allow deliberate retry without retry loops. Printed property QR has no fixed
expiry in this contract, so the screen has no expiry countdown or timer.

This slice is read-only and does not call POST `/submission-drafts/staff/start`.
Maintenance draft start/save, photos, repair claims, submission and receipts,
history, notifications, PWA/offline support and deployment remain later work.
No backend/schema/dependency, environment, migration, server-lifecycle or Git
mutation is included. The next proposed slice is starting and saving a
maintenance checklist, using the existing staff-start and private-draft APIs.

Verification: TypeScript, Oxlint, changed-code Prettier with the exact repository
configuration, production build and diff checks passed. The build used temporary
sample HTTPS origins; deployment must rebuild using the actual public origins.
The existing large-bundle warning remains (main chunk about 964 kB minified).
Disposable probes passed 271 feature/transport assertions, 85 fragment/lifecycle
assertions, 141 component/router/isolation assertions, and seven actual backend
QrService/checklist-parser groups with in-memory fixtures. No repository test
files were added. Automatic approval review blocked browser navigation to
localhost:5175/staff because of the prior port restriction; mobile visual checks
were not performed. Synthetic checks do not establish live QR/database/HTTP or
physical-device acceptance. Existing servers were not started or restarted.


## Staff slice 2 — maintenance start and partial draft saving

The staff home offers `정비 시작` when the configured assignee and active
MAINTENANCE template are present. Explicit confirmation acknowledges the displayed
configured assignee; it is not person authentication. No employee selector or
editable name/date is introduced. A start preflight checks current QR context.
POST `/submission-drafts/staff/start` uses only the staff QR Bearer credential and
`{ requestKey, confirmedStaffId }` UUID v4 values. The backend chooses the employee
snapshot, Seoul date, MAINTENANCE type and start time, and captures the active
checklist. A strictly validated issued private URL is opened immediately.

`features/staff-drafts` owns staff types, validation, answer normalization,
unknown-response readers and APIs. Staff entry/start components and hooks remain
separate from staff draft components, hooks, models and styles. `/draft` first
reads GET `/submission-drafts/current` and selects a screen only after complete
staff or guest validation. The selected screen performs its own lifecycle read.
Existing guest readers and editor/submission logic remain unchanged. For an
initial 401, existing strict guest receipt recovery preserves completed guest
private links; a staff receipt never enables a guest editor. Explicit guest
`?view=submission` remains the existing guest detail/correction flow. Staff draft
reads and saves do not use submission endpoints or implement staff receipts.

Staff editing renders the immutable draft template, NORMAL/ABNORMAL choices,
optional abnormal descriptions, urgency and overall note. Required items may be
unanswered in partial drafts. Explicit `임시 저장` replaces the complete answer
set via POST `/submission-drafts/save` with the exact last `expectedUpdatedAt`.
GET current and POST save use only the private draft Bearer credential, never
staff QR, guest QR, stay token or administrator JWT. Saved/reopened answers come
from the backend. Saving does not submit or complete maintenance.

Untouched abnormal answers retain existing `repairReported` and `repairNote`
fields, including when editing other answers, description, urgency or overall
note. There are no repair controls. Changing to NORMAL or clearing an abnormal
answer explicitly warns before discarding description, urgency or repair data;
NORMAL sends the backend-required cleared fields.

Duplicate starts/saves are locked. Ambiguous start responses are not retried:
repeating a request key cannot recover its lost token. A deliberate new start is
explained as a separate draft. Assignment/template changes require updated entry
context and fresh confirmation. Save conflict freezes editing until the user
explicitly chooses to discard local input and reload saved content. Uncertain
saves also block writes; current state must be read before further editing.
A failed reload preserves local input. No success is inferred from a lost reply.

Private credentials remain only in fragments and memory, not browser storage,
logs, query parameters, cache/React keys or admin state. Explicit link copying
explains that the shared QR cannot recover an existing draft. Displayed expiry
comes from the backend (initial staff lifetime is seven days); saves do not renew
it. Access denial/expiry removes protected editor data. Token changes, refresh,
unmount and BFCache restoration abort/fence requests; foreground revalidation
preserves input through transient errors.

Staff drafts register a live pending-work guard above the route tree. The
accepted route and private credential remain mounted until the user chooses
계속 작성 or 이동하기, including Back/Forward, token-fragment changes and router
PUSH/REPLACE navigation. Dirty answers, saves in progress, conflicts and uncertain
results all require a decision. Document unload keeps the native browser warning.
BrowserRouter receives a window adapter that synchronously observes its history
writes without patching the real window/history. Native fragment entries carry
only numeric positions and random keys in history state; credentials remain in
the existing URL fragment/memory. Staying traverses back to a known entry; unknown
or overwritten history positions conservatively restore the accepted URL with
replacement instead of guessing a traversal direction. New route tokens never
reach the role selector/editor before leave approval.

Remaining staff work: photos/uploads, repair controls, final submission and
receipts, history, staff accounts if approved, PWA/offline, notifications and
deployment. Backend, schema, dependencies, environment and existing servers are
unchanged. No migrations, live database mutations, Git staging/commits/pushes or
deployment are part of this slice.

Verification: TypeScript, Oxlint with no warnings, exact repository Prettier on
all changed code, production build and diff checks passed. Disposable synthetic
checks passed: 262 feature/transport/backend-service assertions, 88 editor/model
lifecycle assertions, 44 draft-role lifecycle assertions, 17 clipboard lifecycle
assertions, 59 routing/component/guest-compatibility assertions, and 19 start
lifecycle groups. Backend service/parser checks used in-memory Prisma fixtures;
no database was accessed or mutated. No repository test files were added.

The production build used temporary sample HTTPS origins and must be rebuilt with
real origins for deployment. The existing large-bundle warning remains (main
chunk about 1001 kB minified). Browser/mobile visual, actual QR/HTTP/database,
clipboard permissions and physical-device acceptance have not been performed.
Existing servers/ports were not accessed, started or restarted. Manual acceptance
should cover confirmation/start, partial save/reopen, two-tab conflicts, lost
responses, assignment/access invalidation and existing guest links.

Staff draft navigation follow-up: the accepted route now stays mounted until
unsaved/pending work is explicitly kept or discarded. The source-matched temporary
build passed TypeScript, scoped Oxlint, repository Prettier and production build
checks. Disposable probes passed 326 synthetic assertions: 125 history/navigation,
98 staff draft lifecycle, 59 guest routing/component compatibility and 44 draft
role lifecycle. These exercise actual source and installed router history with
fixtures; they do not establish mounted React/browser/mobile or live backend
acceptance. No API endpoints changed. Manually verify two draft links with unsaved
answers: Back/Forward should show the decision dialog, 계속 작성 should preserve
answers and restore the current link, and 이동하기 should open the chosen link.
Repeat while saving and after an uncertain save result.


## Staff slice 3 — maintenance draft photo uploads and gallery

The existing staff draft screen now includes an optional photo gallery, separate
from the checklist answer form. Selecting files starts independent uploads;
checklist edits still require `임시 저장`. Listing, uploading, viewing or removing
photos never replaces local answers or advances the answer concurrency timestamp.
No minimum photo count, mandatory area, purpose selector or saved grouping is
invented. Photo-purpose/area associations remain a final-submission concern.

`features/staff-draft-photos` separates types, file/limit validation, unknown-response
readers and APIs. All four routes use only the current private draft Bearer:
POST `/submission-drafts/photos` sends one multipart `file`, with no text fields
or manual Content-Type; GET the same path loads READY metadata and server limits;
GET `/:id/view` obtains a short-lived private viewing URL; POST `/:id/remove`
sends an empty body and validates the returned DELETED identity. No property/stay
selection or guest/staff QR/admin credential substitution is permitted.

The gallery validates and displays returned limits within the supported contract
(JPEG/PNG/WebP, up to 10 MiB per image, up to 40 PENDING/READY records). A local
batch is capped at eight files with two upload workers. File selection checks
size/type, then the feature inspects image signatures; backend full decoding,
40-million-pixel/single-frame checks, orientation normalization, JPEG conversion
and metadata stripping remain authoritative. HEIC/HEIF receives Korean conversion
guidance. Progress is an honest per-file state/indeterminate indicator, not an
invented percentage. Invalid selections retain only name/size/error, not File
objects; successful or dismissed entries release their selected files. The native
file input stays mounted across foreground/access checks so returning picker
selections can be staged without losing unsaved answers.

Failures are shown individually. A failure stops further queue starts while any
already-running second upload settles, then a fresh gallery read reconciles the
batch. No write is automatically retried. An uncertain upload cannot be directly
retried or matched by filename: list first, explicitly close that selection, then
choose a file again only if needed, with a duplicate warning. The list omits
PENDING records, so absence is not proof that the first upload failed. Unknown
removal requires readback; a still-visible photo needs deliberate acknowledgement
before another confirmed removal. Read failures preserve staged files and block
new writes until state is known.

Visible uploaded thumbnails request signed URLs lazily using IntersectionObserver;
a larger native dialog shares the current preview, supports Escape/close and
returns focus. Missing observer support leaves an explicit preview button.
Failed/expired images offer deliberate reload without retry loops. View URLs are
rendered directly with no Bearer headers and no referrer; expiry is bounded by
the draft lifetime. Tokens and signed URLs stay only in mounted memory/fragments,
never storage, logs, query parameters added by this client, analytics, cache keys
or React keys. No local object URLs are created. Old-owner image state is hidden
and requests fenced on draft changes, access suspension, expiry and unmount.

The navigation implementation from `bed1cec` is preserved. Photos register their
own live pending-work getter alongside the answer guard. Selected files, uploads,
removals and unresolved outcomes protect Back/Forward, token-fragment changes,
router navigation and document unload. Staying keeps the accepted editor mounted;
leaving aborts/fences old operations and releases local selections. Photo failures
do not reset the answer editor. Photo access denial clears the entire protected
staff editor and aborts its pending save. Answer conflicts/uncertain saves block
new photo mutations until resolved. Foreground/BFCache revalidation preserves
staged work and marks interrupted writes uncertain instead of claiming success.

Guest photo APIs, readers, hooks and UI are unchanged. No backend/schema,
dependency, environment, migration, live database/storage operation, server
lifecycle, Git mutation or deployment change belongs to this slice. Remaining
staff work is repair controls, final submission with photo associations,
completion receipts and later history. Staff accounts, PWA/offline, notifications
and deployment remain separate approval scopes.

Verification: TypeScript, warning-free Oxlint, exact repository Prettier on all
changed code, production build and diff checks passed. Disposable probes passed
172 photo feature/backend-service assertions, 77 photo queue/lifecycle/composed
editor assertions, 44 gallery/component integration assertions, 57 independent
review/guest-photo regression assertions, 125 existing navigation assertions,
98 staff answer-editor lifecycle assertions, 59 guest routing/compatibility
assertions, and 15 preview/modal lifecycle groups. Actual attachment/image services
ran with in-memory Prisma/S3 replacements; component/DOM/history behavior used
synthetic fixtures, not mounted browser/device acceptance. No repository test
files or live database/storage mutations were created.

The production build used temporary sample HTTPS origins; deployment must rebuild
with real origins. The pre-existing bundle warning remains (main chunk about
1036 kB minified). Existing servers and restricted browser ports were not accessed
or restarted. Native phone/computer file-picker timing, physical mobile layout,
real signed-image loading, actual QR/HTTP/Prisma/S3 integration and full browser
Back/Forward/clipboard behavior still need manual acceptance. Check reopening,
separate answer/photo saves, previews/expiry, confirmation/cancelled removal,
unknown upload/removal results, navigation during pending photos and access loss.

## Staff slice 4 — guided maintenance and final submission

Staff entry now leads with the property and configured employee, one explicit
start action, and a collapsed checklist preview. Existing staff acknowledgement,
missing configuration, ambiguous-start handling and QR credential rules remain.
The staff draft uses three steps: 점검 → 사진 → 확인·제출. One primary action
advances each step. Status and recovery appear in context; optional notes,
file metadata and upload help use disclosures. Guest and administrator screens
and their feature contracts are unchanged.

Inspection supports NORMAL/ABNORMAL, optional descriptions/urgency and staff
repair reports. A repair report is an employee claim; administrators still own
issue resolution. Changing away from an abnormal answer confirms before removing
its dependent details. Required answers are enforced before advancing, while
나중에 계속하기 saves partial answers and opens the private-link controls.
Saving and final submission remain distinct. There is no automatic answer save.

The photo stage preserves the existing independent upload queue, previews,
removal recovery and navigation guards. Users select a purpose and checklist
location for each READY photo. Before/after images require a section or item;
defect photos require an abnormal item; repair photos also require a repair
report. No photo minimum is imposed. Associations stay in memory until final
submission; reopening requires reselecting them. Unresolved photo work blocks
review. The picker/queue stay mounted when moving between steps.

저장하고 내용 확인 first saves the answers, refreshes the photo list, then opens
a review of the saved snapshot and photo mappings. Final submission is an explicit
정비 완료 제출 action. The staff-submissions feature validates unknown responses
and sends POST /submissions/submit with the saved expectedUpdatedAt and every
READY photo exactly once, using only the private draft Bearer credential. The
backend also blocks PENDING photos and checks current staff/property access.

Submission locks draft/photo mutation and parent draft revalidation synchronously.
An ambiguous response keeps an immutable request snapshot and checks GET
/submissions/receipt. No POST is automatically retried. A deliberate identical
retry is available only after receipt readback confirms no completed receipt yet;
it retains the exact saved timestamp, photo ordering and associations. Unmount,
token change, expiry and BFCache restoration abort/fence old requests. Submitted
staff links recover the staff receipt through the neutral draft entry and do not
enter guest editing. Receipt access retains the original link expiry and current
staff assignment restrictions; no staff submitted-detail or corrections API is
invented. There are no backend, schema, dependency, environment or server changes.

Verification for this slice: app/node TypeScript, warning-free source Oxlint,
changed-source Prettier with the exact repository configuration, and production
bundling passed. Disposable current-source probes exercised saved-answer/photo
review, required/partial answers, repair associations, frozen submission retry,
receipt reopening, focus/BFCache/expiry and guest-routing compatibility. Six
actual-component SSR fixtures were rendered in an isolated offline Chrome at
320/390/768px with no horizontal overflow; their hooks/data were mocked and all
network was blocked. These are layout and synthetic lifecycle checks, not real
QR/JWT/HTTP/PostgreSQL/S3 or physical-device acceptance. The existing large main
bundle warning remains. No repository test files were added. Build checks used
sample HTTPS origins; deployment must rebuild with actual production origins.


## Redesign slice 1 — administrator dashboard and guest home

The dashboard uses compact scheduled-arrival/departure summaries with current
checklist breakdowns, selected-date maintenance rows, and a separate current-work
column for open issues and unfinished maintenance across all dates. Starts and
completions are never subtracted to infer unfinished work. Past dates continue
to use current saved evidence. Detailed count semantics are available in a native
집계 기준 disclosure; the schedule/occupancy distinction and current-work scope
remain visible. Errors/loading never substitute zero counts.

Dashboard drilldowns live in model/dashboard-links: calendar links retain the
selected date/property and open that day's full schedule; maintenance started
and submitted lists retain their distinct date fields, while unfinished work and
NEW/IN_PROGRESS issue lists omit dates. Existing fetch hooks, unknown-response
validation, URL filters, session rejection and manual refresh remain unchanged.
AdminLayout opts into the compact header, ITCEN text branding and mobile bottom
navigation treatment only for the dashboard route, preserving all active-route
logic and fixed-navigation clearance. Other administrator screens retain their
layout. The operator is identified as OH BOK, including on mobile.

Guest home separates its compact property header and checklist actions into
screen-local components. Shared QR supports arrival/departure templates, the
existing guide and issue reporting. Personal stay links retain planned Seoul
schedule details and show the vehicle card only when collection is enabled.
Unavailable templates remain noninteractive. Guide publication is not exposed by
the home context, so the working guide route and its authoritative unpublished
state remain. Personal links do not gain QR-only issue actions. Existing vehicle
save/clear/reconfirmation/conflict handling and all entry access states remain.

GuestFrame opts into home-only styles via view === home. The specificity of
shared-frame overrides is higher than the base entry styles so CSS import order
does not alter home spacing or navigation clearance. Guide/start/report/draft and
staff layouts are unchanged. Branding uses plain text because no approved logo
assets exist in the repository. This slice adds no APIs, dependencies, schema,
PWA, contact/urgency, recurrence or record-correction functionality.

Verification: Yarn typecheck, warning-free Oxlint, exact changed-source Prettier,
and a production build passed. Temporary probes passed 95 dashboard/guest fixture
and navigation assertions plus 38 focused guest render assertions. These are
synthetic model/SSR checks with fixture data and mocked hooks, not interactive
browser or authenticated backend acceptance. Standalone HTML fixtures cover
normal, long-name, empty, loading, error, unavailable and vehicle review states.
The browser tool rejected file URLs, and no approved existing preview was
available during verification; mobile/tablet/desktop layout, keyboard interactions
and actual overflow therefore remain unverified. Do not describe SSR output as
screenshots. No repository test files were added. The pre-existing large-bundle
warning remains. The build used example HTTPS origins and must be rebuilt with
production origins at deployment. All backend source and staff screens remain
unchanged; Git staging/commits, environment files and services remain user-owned.

## Redesign slice 2 — public manager contact and standalone report urgency

Property settings now edit the dedicated nullable publicContactPhone through the
existing administrator property APIs. The Korean form explicitly explains guest
visibility. A blank value sends null to clear the number; unchanged fields are
omitted. Same-field concurrent property updates retain the existing last-write-wins
contract; no revision field or automatic retry was added. An explicit contact
write requires the returned field and expected value before showing success.
Missing or contradictory acknowledgements use the existing uncertain-save state.

features/property-contact owns display-number validation and safe tel construction.
Numbers use 7–15 ASCII digits with an optional leading + and single ordinary-space
or hyphen separators, up to 32 display characters. Only outer ordinary spaces are
trimmed; controls, markup and unsupported punctuation are rejected. This validates
format, not ownership or reachability. The server enforces the same rules.

GET /qr/guest and GET /guest/stays/current add only the configured public contact
to their authorized property context. Absent fields from older responses mean
unconfigured; malformed explicit values fail response validation. Staff phone
numbers are never a fallback. Both home variants and standalone-report review,
receipt and unavailable-category guidance reuse GuestManagerContact. An absent
number shows 등록된 연락처가 없습니다. without a call action. Pending report
access disables the call link; rejected access removes the protected context.
GuestFrame permits only validated tel links through its internal-route guard;
all other route and document-unload protections remain unchanged.

Standalone QR reports add the optional 긴급한 문제예요 checkbox, initially false.
The flag participates in validation, dirty state, immutable review, the exact
submission/retry body, and the receipt. Backend omission and legacy receipt
omission mean false; explicit non-booleans fail. A receipt contradicting the
requested urgency is treated as an uncertain result. Existing photo claims,
cancellation, credential isolation and duplicate-request handling remain intact.
The existing administrator urgency readers, badges and filters require no UI
changes. Personal stay links do not gain standalone report authorization.
Urgency sets a priority flag only; it sends no notification and places no call.

Verification: frontend typecheck, Oxlint, changed-source exact Prettier and a
production build passed in an isolated source/dependency copy. Temporary probes
cover contact validation/DTOs/services, form/API reads and writes, urgency/replay,
access fencing, photo preservation and actual administrator readers/components.
These are synthetic checks using mocked transport/database and React rendering,
not authenticated HTTP/PostgreSQL, interactive browser or phone-dialer acceptance.
The browser approval review rejected opening localhost:5175 because of the earlier
port restriction; mobile/desktop interaction and visual verification remain open.
The pre-existing large-bundle warning remains. Build used example HTTPS origins.
The backend migration file is supplied but not applied; apply it and regenerate
the backend Prisma client before live acceptance. No staff screens, dependencies,
environment files, permanent test files or service lifecycle were changed.

## Redesign slice 3 — administrator urgency and recurring problems

Issue detail adds compact urgency and 이전 이상사항 연결 summaries. Administrators
can change urgency or link/change/unlink a separate earlier report, with a required
1–500-character reason and explicit review before saving. Reopening continues the
same issue; recurrence relates two independent reports without changing status.
Cancelled records remain readable and expose no mutation controls.

The existing shared useIssueAction lock now dispatches notes, status, urgency and
recurrence. Feature input preparation, response readers and before/after receipt
checks allow only the intended field change while preserving source, original
REPORTED event/photos, status and resolution data. 404/409, exhausted versions and
uncertain writes require explicit detail/history reload; no automatic write retry
or silent rebase occurs. All calls use only the current administrator JWT.

Only one editor mounts at a time. Switching between note/status, urgency and
recurrence uses the existing unsaved-input confirmation, so a successful mutation
cannot erase another editor's draft. Page-local reload/return and newly added
related-record links use the same guard; document unload warns while dirty/busy.
The existing global sidebar/browser-back boundary is unchanged. Inputs remain in
memory, with no browser persistence. Version/token/unmount changes abort and fence
requests; successful receipts refresh the current badge and paginated history.

GET /admin/issues/:id/recurrence-candidates uses expectedVersion plus page/limit,
with five candidates per page. The server selects the same property, strictly
earlier reportedAt and noncancelled records, excluding self/current link. Readers
validate pagination, scope, chronology, unique IDs and ordering. Each page is a
current read, not a cross-page snapshot. Final eligibility is rechecked at save,
including defensive ancestry/cycle checks. A shrinking list retains a route back
to available pages without discarding the selected candidate or reason.

The current linked summary loads independently through the existing detail API,
showing title/date/status and a guarded link. A cancelled/ineligible old target or
failed target read does not prevent explicit unlink. Historical snapshots show
the saved recurrence link and urgency; UPDATED uses a neutral 관리 내용 변경 label
because it can now represent more than a note. New POST /urgency and /recurrence
return the existing detail shape; recurrenceOfIssueId: null explicitly unlinks.

No guest/staff behavior, authentication model, schema, migration, dependency,
environment or service lifecycle changes are included. Real browser, authenticated
API and database acceptance remain separate from temporary model/React/service
probes. The earlier localhost:5175 browser restriction remains unresolved; do not
claim narrow-screen visual or interactive verification from synthetic rendering.

Verification: Yarn typecheck, warning-free Oxlint, changed-source exact Prettier
and the production build passed in isolated source/dependency copies. Independent
feature/hook probes passed 252 assertions and UI/model/React-render probes passed
51, covering strict receipts, original evidence, pagination, editor switching,
conflicts, uncertain writes, access changes and cancelled-target unlink behavior.
These use fixture data and mocked transport/React scheduling; no actual browser,
phone or live database mutation was performed. The pre-existing large main-bundle
warning remains. The build used example HTTPS origins and is not a deployment.

## Slice 4A — administrator submitted-checklist corrections

Submitted CHECK_IN, CHECK_OUT and MAINTENANCE detail screens now expose 내용 정정.
The editor uses the captured checklist, existing answers and general note, with a
required trimmed 1–1000-character reason. A frozen before/after review shows only
actual answer/note changes, affected photo names/locations and removed staff repair
information. Explicit confirmation is required. Reason-only or normalized unchanged
input creates no revision. Original author, property, template, visit/submission
time and stay association remain unchanged.

features/admin-submissions owns correction types, strict input preparation, effect
calculation, API calls and receipt validation. Screen components, form models,
mutation hook and scoped responsive styles remain separate. All writes use only
the administrator JWT and POST /admin/submissions/:id/correct with expectedRevision,
the full desired items, nullable generalNote and reason. No repair/photo/context
fields are sent. Success refreshes existing current detail and paginated history;
the immutable correction is attributed to the administrator as ADMIN_SESSION.

One editor is active at a time. Switching between correction and stay linking,
closing, page-local return and reload preserve the existing unsaved-input prompt;
document unload warns while dirty or busy. Pending or uncertain work cannot be
bypassed by switching editors. Validation failures keep input. Conflict, missing
records and uncertain responses block further writes until explicit latest-record
reload; this discards the local editor only after its existing dirty confirmation.
There is no automatic mutation retry. Token/record/revision changes and unmount
abort and fence responses. The existing global sidebar/browser-back guard boundary
is unchanged; it is not a new application-wide navigation blocker.

Existing issue urgency remains independent of corrected answer urgency. Only a
newly created issue uses the answer flag; existing priority/status/resolution/
cancellation/recurrence and original evidence remain intact. NORMAL does not resolve
an issue. Maintenance repair data remains while an answer stays ABNORMAL, and is
removed from the new revision on NORMAL/optional omission. Valid maintenance
before/after associations remain regardless of answer state. DEFECT/REPAIR photos
that become invalid leave the current revision but remain in history and original
issue evidence. Corrections never delete uploads or restore removed associations.

Verification: integrated Yarn typecheck, Oxlint, exact changed-source Prettier and
production build passed in an isolated source/dependency copy. Temporary feature/
API/hook probes passed 249 assertions and UI/model/React probes passed 104, including
strict receipts, scope fencing, duplicate locks, uncertain responses, photo/repair
consequences and bilateral editor/navigation guards. These are fixture/mocked
checks, not interactive browser, authenticated HTTP or PostgreSQL acceptance.
The earlier localhost:5175 browser restriction remains unresolved; no browser or
mobile visual verification is claimed. The pre-existing large-bundle warning
remains. The build used example HTTPS origins. No schema, migrations, dependencies,
environment files, permanent tests, guest/staff screens or services were changed.

## Slice 4B — administrator checklist cancellation and restoration

Submitted CHECK_IN, CHECK_OUT and MAINTENANCE detail screens now offer the secondary
destructive 제출 취소 action. Cancelled records remain readable with their status,
history and photos, and offer 제출 복원. Both flows require a trimmed nonblank
1–1000-character reason, a frozen consequence review and explicit confirmation.
Korean guidance explains that evidence/history remain and linked issues are
unchanged. Restoration preserves the original submittedAt and current saved answers
and photos; it neither revives earlier removed photos/repair data nor restores the
associated stay or extends private-link expiry.

Correction, stay linking, cancellation and restoration share one active editor and
the existing dirty/busy/blocked navigation boundary. Switching, close, page return
and refresh protect unsaved input; document unload warns while dirty/busy. A blocked
or uncertain action cannot be bypassed by opening another editor. The existing
global sidebar/browser-Back protection is unchanged. Validation failures retain
input; conflicts and uncertain responses require explicit latest-record reload
before another write. No mutation is automatically retried.

features/admin-submissions owns lifecycle types, strict input preparation, receipt
readers and API calls. Components, presentation model, mutation hook and scoped
mobile styles remain separate. POST /admin/submissions/:id/cancel and /restore
use only the administrator JWT and { expectedRevision, reason }, without query or
identity/answer/photo fields. Receipts validate the target status, next revision,
monotonic timestamp and cancelledAt. Token/record/revision/status/action changes and
unmount abort and fence requests. Duplicate saves are blocked synchronously.

Exact backend retries may return a historical success after a later opposite action.
Success notices therefore identify the saved revision and always refresh current
detail/history; receipt status is never installed as the latest state. Cancelled
records cannot be corrected/relinked. Restored records regain only their existing
eligibility, and valid submission totals/exports/calendar indicators follow existing
rules. Independent issue counts remain governed by issue state.

Verification: integrated Yarn TypeScript, Oxlint, exact changed-source Prettier and
production build passed in isolated source/dependency copies. Temporary feature/
API/hook probes passed 265 assertions; model/SSR/component/editor-guard probes
passed 237. Backend compatibility probes exercise counts, exports, issue evidence,
private access and receipts using real services with in-memory dependencies.
These are synthetic checks, not authenticated HTTP/PostgreSQL/S3 or interactive
browser/mobile acceptance. The earlier local-port restriction remains unresolved;
no browser visual acceptance is claimed. The existing large-bundle warning remains,
and the build used example HTTPS origins. No dependencies, permanent tests,
environment files, schema/migrations, Git writes or service operations were added.

## Slice 5 — administrator issue-report cancellation and restoration

Issue details now offer secondary destructive 신고 취소 for noncancelled reports,
and 신고 복원 with the stored cancellation reason for cancelled reports. Each
requires a trimmed nonblank reason of 1–1000 Unicode characters, a frozen review
and explicit confirmation. Korean guidance distinguishes cancellation (mistaken/
duplicate report) from resolution (fixed problem) and reopening (further work).
Restoration preserves the current processing status: resolved reports stay resolved.
Original report/photos/history, current content and source/recurrence context remain.

The list adds cancellation=active|cancelled|all with 취소 제외 / 취소만 / 전체 labels.
Omission retains active behavior. The filter survives URL navigation, pagination,
detail entry and return; invalid or repeated values block reads until corrected.
Cancelled rows retain their processing-status badge and add a separate 취소됨 badge.
Property, urgency, status, report-date and descending sort behavior are unchanged.
List summaries now expose nullable cancelledAt. Explicit cancellation-filter reads
require that field; legacy default/recurrence summary omission maps to null. A
cancelled recurrence candidate is rejected by the feature reader.

New feature lifecycle types, validation, receipt readers and API code remain
separate from screen components, models and scoped CSS. POST /admin/issues/:id/cancel
and /restore send only expectedVersion and reason with the administrator JWT.
The shared useIssueAction hook dispatches lifecycle operations through the same
synchronous lock used by notes/status/urgency/recurrence. Only restoration is
available on cancelled reports. Scope/session/unmount changes abort and fence
requests. Validation failures retain input; conflicts and uncertain results block
all mutation flows until an explicit latest-record read. There is no automatic retry.

Only one editor mounts at a time. Switching, closing, page-local return and refresh
preserve dirty-input confirmation; document unload warns while dirty/busy. The
existing global sidebar/browser-Back boundary is unchanged. Lifecycle success
receipts identify a saved event/version and may be historical after an exact retry.
The success notice survives the fresh detail/history read; historical receipt
status is never installed as current detail. Existing regular action receipts keep
their prior behavior.

Cancellation excludes a report from operational counts/exports without changing
processing status. Restoration includes it under existing status/date rules.
Neither action changes checklists, stays or related reports. Recurrence links
remain readable even when an earlier report is cancelled; cancelled reports cannot
be selected as new targets. Existing submission-correction audit behavior remains,
so restoration preserves later saved corrections instead of restoring an old snapshot.

Verification: integrated Yarn TypeScript, Oxlint, exact changed-source Prettier and
production build passed in isolated source/dependency copies. Temporary feature/
API/shared-hook/list-hook probes passed 320 assertions; prior Slice 3 frontend
regressions passed 252; UI/model/React/URL probes passed 293. Backend service probes
separately exercised counts, exports, guest replay and correction compatibility.
These are synthetic fixtures/mocked dependencies, not browser/mobile, authenticated
HTTP, PostgreSQL or S3 acceptance. The earlier local-port restriction remains
unresolved; no browser visual verification is claimed. The existing large-bundle
warning remains, and the build used example HTTPS origins. No schema/migrations,
dependencies, permanent tests, environment files, Git writes or services were changed.

## Slice 6A — shared administrator shell and clearer issue pages

All authenticated administrator routes now use the approved compact dashboard
shell: ITCEN text branding, discreet OH BOK operator credit, consistent header,
sidebar, content gutters and mobile bottom navigation. The dashboard-only shell
stylesheet was consolidated into `layout/styles/admin-layout.css`. Session/logout,
route activation, skip-link/path-change focus, safe-area padding and fixed-nav
clearance remain; native disclosure summaries also receive scroll clearance.
Dashboard and other administrator screen bodies, guest/staff screens, shared
UI/global styles and API/authentication code are unchanged.

The issue list keeps its live property/status/urgency/cancellation/date filters,
URL state, paging and newest-report ordering. Smaller headings, filter spacing
and operational rows reduce scrolling. All filter controls remain visible, with
paired fields on small screens. Cancellation stays separate from processing
status. Both the title and detail link preserve the filter/page return context.
Loading, invalid-filter, empty and error states use compact scoped styling.

Issue detail prioritizes the explicitly labeled current saved title, property,
location, description, processing status and urgency. Cancellation reason remains
visible. A presentation-only comparison identifies changed title, description,
category or location relative to the original report. Original photo evidence
appears beside/before the action workspace. Desktop uses two columns; smaller
screens stack them. Original reporter/source/full content and complete paginated
history use keyboard-accessible native disclosures. The history summary shows the
latest event date/type, a short note preview and photo count, without repeating a
full latest-event record. Every historical snapshot/photo remains accessible.

A compact toolbar groups urgency, earlier-report relationship and cancellation
controls. The existing note/status editor retains its initial note selection and
highlights the appropriate next-step option without selecting or saving it.
Only one editor remains mounted. Reasons, confirmation steps, page-local dirty
navigation/document-unload protection, duplicate locks, uncertain/conflict recovery,
credential fencing and lifecycle-success fresh detail/history reads are preserved.
The existing global sidebar/browser-Back guard boundary is unchanged. No endpoint,
backend/schema, dependency, credential or persistence changes are included.

Verification: integrated Yarn TypeScript, non-fixing Oxlint, exact repository
Prettier on changed source, and a production build with sample public HTTPS
configuration passed. Temporary synthetic transport/React/model/SSR probes covered
1,121 assertions for issue actions/lifecycle, confirmations and editor guards,
URL filters/paging, shell/session/navigation and summary presentation. Source
comparisons confirmed 459 preserved files, including unchanged feature/hooks,
dashboard/other bodies and guest/staff flows. These are synthetic checks, not
real browser/mobile or authenticated database acceptance. No repository tests
were added. The existing main-bundle size warning remains (about 1,119 kB).

Actual browser visual acceptance remains pending: automatic approval review
rejected opening `http://localhost:5175/admin/issues` because the earlier explicit
port restriction was not clearly revoked by an ambiguous answer. An explicit
port-specific authorization question is pending. No alternate access, new server,
service restart or live-data mutation was used. Thus 320px/390px/tablet/desktop
layout, photo rendering, focus/touch behavior, fixed-nav clearance and before/after
screenshots have not yet been verified in a browser for this slice.

## Slice 6B — clearer administrator submission list and detail

The submission screens now follow Slice 6A's compact cobalt/navy/white styling.
Only `screens/admin/submissions` and this reference changed; the shared admin
shell, other admin bodies, guest/staff screens, API modules and request hooks
remain unchanged. The user explicitly authorized browser review on the existing
localhost:5175 frontend for this slice. No server lifecycle action was performed.

The list is titled 제출 기록 and uses compact filters and operational rows, with
separate checklist-type and submitted/cancelled badges. The property name and
기록 보기 both link to the same detail URL with the existing return context.
All property/type/status/stay/link-status/visit-date filters, native date pickers
and partial-date badInput validation, paging/canonical URL behavior and selected
stay reset rules remain. Dates still filter visitDate, not submittedAt. Abnormal
answer counts remain separate from current issue counts. Loading, invalid, empty
and error states retain their existing behavior with scoped compact styling.

Detail starts with the current revision, property, checklist type/status, original
submitter/submission time and visit date. The latest action, actual actor/source
and required saved reason remain distinct and visible; the actor can be a guest,
staff member or administrator. Cancelled records explicitly retain their answers,
photos and history. Saved answers and photos come before management controls;
desktop uses two columns and smaller screens follow the same reading order.
Unanswered optional items, answer urgency, staff repair notes, photo purposes,
locations and full filenames remain available. Entire notes are retained.

SubmissionCurrentSummary and SubmissionMetadata separate summary and detailed
presentation. Captured metadata and complete paginated history use native details
controls. Historical snapshots retain historical labels and read-only rendering;
they never replace the current editable revision. Original author/contact/template,
source, stay link and all timestamps remain accessible. The header's 기록 관리
button only focuses and scrolls to the existing management area; it changes no
route, hash, editor state or API request.

Correction, stay association, cancellation and restoration keep the same single
active-editor orchestration, eligibility, reasons, consequence review and explicit
confirmation. Dirty/busy/blocked handling, document-unload warnings, duplicate
locks, token/revision fencing and conflict/uncertain-result recovery are unchanged.
All successful mutations still reload current detail/history rather than treating
a potentially historical retry receipt as current data. The existing page-local
navigation guard does not add global sidebar/browser-Back protection. Private
photos still require explicit viewing, use revision-specific ADMIN authorization
only for the view API, and keep signed URLs temporary with no API token on images.

Verification: Yarn TypeScript, non-fixing Oxlint, exact changed-source Prettier,
production build with sample public HTTPS origins and Git diff whitespace checks
passed using the isolated-copy workflow. 1,022 distinct temporary synthetic
feature/hook/model/component assertions covered correction/lifecycle/stay linking,
reason/confirmation/editor guards, filters/native partial dates/paging/URL returns,
history boundaries, photo expiry and credential/request fencing. No repository
test files or dependencies were added. The existing bundle warning remains
(main JavaScript about 1,122 kB minified).

Actual browser layout inspection used a clearly labelled static fixture served
temporarily by the existing frontend. It rendered real components and their
styles with fictional data, without live API/session/storage requests. Fifteen
fixture states were checked at 320x780, 390x844, 820x1000 and 1440x1000, including
long Korean names/filenames, sixteen checklist items, ten photos, current/cancelled/
restored/historical records, loading/empty/error/invalid filters, correction and
lifecycle confirmation panels, and a synthetic photo image. No horizontal page
overflow was observed. Native disclosures opened with keyboard focus visible;
focused history/retry/confirmation controls remained above mobile navigation.
Filter controls measured at least 44px and bottom-navigation links 56px; the
mobile main region retained 97px bottom clearance. Representative screenshots
were saved outside the repository and the temporary public fixture was removed.

These browser checks establish fixture layout only. The real app was reachable
but authenticated submission access was not established during this review.
Mounted live React editor interactions, actual saves/conflicts, authenticated
HTTP/database behavior, real signed-photo loading, physical phones and native
safe-area/device behavior remain unverified. No real records, backend/schema,
environment files, deployments, migrations, staging or commits were changed.

## Property settings — mobile management card polish

The property editor now separates assigned-staff identity from four equal
management buttons. Dedicated PropertyManagementCard component/styles use a
two-column phone/tablet grid, four desktop columns, 8px gaps and 52px tap targets.
Long names, inactive badges and unassigned staff remain readable. Existing route
callbacks, dirty-discard confirmation, focus restoration and busy/discard locks
remain in PropertyEditor; no API, form-save or shared styling changes were made.

Verification: isolated Yarn typecheck, non-fixing lint, exact changed-source
Prettier and production build passed (existing large-chunk warning remains).
Actual-component static browser fixtures covered assigned, long/inactive,
unassigned and busy states at 320, 390, 820 and 1440px with no horizontal overflow;
all management buttons measured 52px high, and keyboard focus was visible.
These are fictional visual fixtures, not authenticated navigation/save or physical
phone acceptance. Temporary public preview removed; no server or backend changes.

## Slice 6C — compact administrator cleaning and maintenance monitoring

The read-only /admin/maintenance screen now follows the Slice 6A/6B spacing,
typography, cobalt actions and restrained surfaces. Compact filters lead into a
five-column desktop table and grouped rows on tablet/phones. Recorded property
and staff identity, current property inactivity, all five statuses, all review
reasons and four distinct timestamps remain visible. Missing names, region and
times keep their fallbacks. Response asOf is labeled 상태 기준 in Korean time;
only the server's matching-record total is shown, with no derived work totals.

COMPLETED is labeled 제출됨, rather than certifying physical cleaning completion.
The 제출된 기록 filter still means database SUBMITTED and may contain 확인 필요.
Only classifier COMPLETED retains the existing checklist/photo/history link;
all other states explain why detail is unavailable without adding management
writes. The detail link and existing return helper retain filters, page and the
maintenance navigation context. A concise visible warning distinguishes submission
from work quality/manager approval; a native keyboard-accessible disclosure
explains recorded times and captured identity/property labels. Captured property
labels are described specifically for valid submitted records; invalid diagnostic
records can have current property metadata or missing evidence.

Every property/view/date filter and existing validator/URL rule is retained.
Inputs stay local until 조회. Date submission additionally checks native
validity.badInput so a partial date with an empty value cannot broaden a query.
The native minimum now matches the existing 1900–2100 API validator. Initializing
from invalid/duplicate URL filters still blocks reads. Date ranges remain optional
in pairs, Seoul-based and limited to 62 inclusive days; SUBMITTED with UNFINISHED
remains invalid. Both reset paths clear local/applied conditions; the empty-result
reset now also remounts controls when the applied query was already at defaults.
Native reset clears partial date segments. Existing 20-record pagination,
server ordering, out-of-range replace correction, explicit retries, token/request
fencing and inactive/missing selected-property handling are unchanged.

Scope: seven files within screens/admin/maintenance, including the new
MaintenanceRecordGuide component; this reference is the only other changed file.
Feature API/readers/hooks, shared admin shell, dashboard, submission details,
guest/staff flows and all backend files remain unchanged. No dependencies,
permanent test files, migrations, environment changes, Git writes or server
lifecycle operations were performed.

Verification: isolated Yarn typecheck, non-fixing Oxlint, exact changed-source
Prettier, production build with sample HTTPS public configuration and whitespace
checks passed. The existing large-bundle warning remains (main JS about 1,123 kB).
247 temporary synthetic assertions cover filters/URL, readers/transport,
request/session fencing, date/reset controls, pagination/states, rows, drilldowns
and backend date/classifier logic (evidence parsing mocked). Separately, 1,080
fictional fixture envelopes passed the actual maintenance response reader.

The existing localhost:5175 preview served a temporary interactive React fixture
with the real screen, components, styles, shell and MemoryRouter. Session,
property-option and maintenance hooks were mocked; CSP and fetch/XHR guards
blocked real API requests. Twelve scenarios at 320, 390, 820 and 1440px had no
horizontal overflow; all inspected production controls were at least 44px high.
Visual review covered all statuses, multiple reasons, missing data, long names,
error/empty/loading states, expanded guide and tablet/desktop/mobile grouping.
At 320px dates now stack to avoid text/calendar-icon crowding; wider phones keep
the paired layout. Browser interactions confirmed local-before-apply behavior,
native partial-date rejection/reset, paired and 62/63-day boundaries, invalid
view/date combinations, retry, missing selection preservation, page-two detail
return (fictional destination), same-query empty reset and keyboard disclosure.
Mobile retry/detail controls stayed above fixed navigation; main bottom padding
remains 97px plus the existing device safe-area behavior.

This is fixture browser evidence, not live authenticated API/database acceptance.
The real preview remained at /admin/login after the sign-in request. Actual
maintenance data, authenticated submission detail/photos and physical phone/native
safe-area acceptance remain unverified. No real records were modified. The public
fixture was removed after review; screenshots/probes stay only in temporary files.

## Slice 7A — guided guest arrival and departure checklists

The existing guest start and private-draft screens now use a compact guided
journey: 이용 정보 → 시설 확인 → 사진 → 제출 확인 → submitted receipt. The
property QR still collects a required self-reported name/date and optional
company/department/phone; optional fields expand without losing their values.
Personal-stay entry still displays backend-owned identity and planned dates.
Native date controls, template/access errors and ambiguous-start recovery are
unchanged. ITCEN text branding and discreet OH BOK credit apply only to these
approved journey screens; guest home, guides, issues, vehicles, submitted
correction, administrator and staff workflows are unchanged.

`use-guest-workflow` owns screen steps, in-memory photo/item mappings, saved
review and save-for-later presentation. Checklist components and pure flow
models remain separate from feature APIs and existing business hooks. Normal /
abnormal answers, contextual details/urgency, optional notes and the captured
template/version remain available. The primary next action is separate from
`나중에 계속하기`, which allows partial saves and exposes the private resume link.
The link guidance explicitly distinguishes shared QR entry from resuming a
private draft. Checklist answers are not automatically saved; credentials and
drafts are not persisted in browser storage.

The existing photo controller and gallery stay mounted inside hidden stage
wrappers. Back/next preserves uploaded-photo previews and in-memory mappings;
active operations, selected-file queues and unresolved removals block stage
changes. The existing navigation boundary and document-unload protection cover
unsaved answers, pending photo work, mappings and review preparation. Reopening
loads saved answers/photos, but photo/item mappings must be selected again
because the backend persists those only at final submission.

Before review, the workflow validates completion/mappings, saves answers, then
refreshes the READY photo list and builds a read-only saved snapshot. The save
hook now returns the validated saved DTO (or a verified clean DTO), and returns
null after failure, expiry or stale ownership; the API contract is unchanged.
Review is blocked when answers, the saved version or the photo list differ.
Every uploaded photo must retain DEFECT → ABNORMAL item linkage, while zero
photos remain valid. The original final-submit preflight, expectedUpdatedAt,
ordered frozen retry payload and receipt recovery remain authoritative. A READY
list alone does not prove that no PENDING upload exists; the backend still checks
that at final submission. Uncertain writes are never automatically retried.

Credential/API flow is preserved: GET /qr/guest or /guest/stays/current rechecks
entry with its matching QR or personal-stay Bearer. POST
/submission-drafts/guest/start uses QR Bearer and guest details; POST
/guest/stays/drafts/start uses personal-stay Bearer and only type/requestKey.
The returned private-draft Bearer exclusively owns GET /submissions/receipt,
GET /submission-drafts/current, POST /submission-drafts/save, all four
/submission-drafts/photos endpoints and POST /submissions/submit. Signed image
URLs still receive no API credential and expire as before. Receipt retains
`제출 내용 보기` and clearly labels original-submission counts/time.

Verification (2026-10-08): Yarn typecheck, full non-fixing Oxlint, exact Prettier
on changed source, production build with sample HTTPS public origins, and
whitespace checks passed in the isolated source/dependency copy. The existing
large-bundle warning remains. Temporary probes passed 95 feature/business-hook
assertions, 59 workflow assertions and seven component-render cases, covering
QR/personal starts, ambiguous starts, partial saves, version conflicts, unknown
writes, duplicate locks, stale/unmounted responses, optional photos, mapping
preservation/validation, review invalidation, access expiry/rejection and receipt
recovery. No permanent test files or dependencies were added.

Browser verification used the existing authorized localhost:5175 server with a
temporary, explicitly fictional bundle of the actual UI/hooks and mocked feature
APIs. Production transport/session modules were excluded; CSP plus fetch/XHR
blocks prevented network calls. Inspected 320/390/768/1440px layouts, long Korean
property/answer/note/filename content, required QR input, native date input,
personal-stay fixed identity/date, partial save/resume, no-photo final submission,
photo mappings and loaded preview across Back/Next, unknown-upload reconciliation
with disabled step controls, lost-submit-response receipt recovery, submitted
detail navigation destination, and missing-template/expired/denied/request-error
states. No horizontal overflow appeared in these inspected states. Keyboard Tab
focus was visible, stage/save-later headings received focus, and the 320px start
action remained above the fixed entry navigation at the bottom of the page.
Browser console reported no warnings/errors. Review screenshots contain only
fictional information. The temporary public fixture was removed after review.

These checks do not establish authenticated backend/PostgreSQL/S3 acceptance,
real signed-image delivery, OS/native photo picking, physical-phone keyboard/IME
behavior, or real cross-tab/network races. The fixture used a MemoryRouter and
stubbed navigation-guard registration: application browser Back/Forward and
real private-link reopen acceptance still need manual verification (pending-work
callbacks and stale ownership were exercised synthetically). No real records
were created or changed. Backend, environment, Git staging/commits, migrations,
deployment and server lifecycle were untouched.

Slice 7A review follow-up (2026-10-08): photo/item selections now keep navigation
and document-unload protection after a failed photo-list refresh. The workflow
reconciles selections only against a successful list, removing associations for
photos confirmed absent while preserving selections through list errors. This
also avoids stale warnings after a confirmed removal followed by another failure.
A temporary probe using the actual workflow and photo controller passed 49
assertions; the original implementation failed its guard-retention assertion.
Coverage includes failed refresh, same-photo recovery, confirmed removal, clearing
a selection, and photo refresh failure after saving answers for review. Existing
154 synthetic assertions and seven rendering cases, typecheck, non-fixing lint,
Prettier and production build also passed. These are isolated/mock checks, not
live BrowserRouter, backend/S3 or device acceptance. No API contracts changed.

## Redesign Slice 7B — guest standalone issue journey (2026-10-08)

The property-QR `불편사항 신고` screen now follows `불편 내용 작성 → 내용 확인 →
접수 완료`, matching the compact blue/navy/white Slice 7A direction. Report-only
ITCEN text branding and discreet OH BOK credit use the existing guest frame.
API-provided category buttons, required name/title, optional description/urgency
and optional photos remain in one writing step, with one primary review action.
Long category labels and filenames wrap; mobile controls retain comfortable
sizes and clearance above the existing bottom navigation.

Zero active categories now show a focused explanation, the existing manager
contact presentation, and `분류 다시 확인`. The form and gallery are hidden, not
discarded, so recoverable category changes preserve in-memory work. Missing
contact information has no inactive call link. Loading, request failure and
rejected-access states retain their existing recovery and privacy behavior.

The new screen workspace hook separates photo ownership and existing navigation
policy from presentation. Existing report/photo business hooks, feature APIs,
readers and validation are unchanged. A single gallery stays mounted across
editing and review: uploaded claims, loaded previews and expanded preview state
survive Back/Next. Review hides photo mutations without treating the stage
change as lost access. Real access locks, uncertain submissions and expiry still
abort or hide private previews. Pending/failed/uncertain photo work blocks review
until resolved. Unsaved-input and document-unload protection remain in place.

Review displays the normalized frozen body and ordered photo claims, with the
existing explicit confirmation bound to that exact body. Editing requires fresh
confirmation. The receipt shows property, original received time, urgency and
reference number; it distinguishes receipt from repair completion and urgency
from notifications/calling. There is no report draft/save-for-later, tracking,
lookup, correction or receipt-retrieval API, and no browser persistence was added.
Refreshing or reopening cannot recover this receipt. Confirmed receipt cleanup
clears local photo ownership without sending photo deletion requests.

API contracts are preserved: GET /qr/guest and GET /guest/issues/categories load
and revalidate property access and current choices using only property guest-QR
Bearer authorization. POST /guest/issues/photos uploads one multipart file with
no text fields; the browser supplies its boundary. GET
/guest/issues/photos/:id/view and POST /guest/issues/photos/:id/remove require
that QR Bearer plus the individual X-Photo-Token. Signed image requests receive
no API credentials. POST /guest/issues/report sends the requestKey, normalized
fields, urgency and ordered photo claims. An uncertain response keeps that exact
body/key/claim order locked for deliberate identical retry; it is never retried
automatically or presented as success. Lost photo-upload credentials cannot be
recovered from a gallery-list endpoint; the existing deliberate abandonment
flow remains. Personal-stay links do not gain reporting authorization.

Verification: Yarn typecheck, full non-fixing Oxlint, exact changed-source
Prettier, production build with sample HTTPS public origins and whitespace
checks passed in an isolated source/dependency copy. The existing large-bundle
warning remains. Temporary probes passed 299 actual-hook/component/transport
assertions and 26 fixture-isolation/contract assertions. Coverage includes
empty/changing categories, required inputs, review/claim preservation,
upload/removal failures and ambiguity, exact retry/duplicate locks, stale
responses, QR rejection, expiry, navigation protection and receipt cleanup.
No permanent test files or dependencies were added.

Browser verification used the existing authorized localhost:5175 preview with a
temporary fictional bundle of the actual screen/hooks and mocked feature APIs.
CSP and fetch/XHR blocks prevented backend traffic. Inspected 320/390/768/1440px
layouts, long Korean property/category/title/description/filename content,
required-field error focus, empty categories with missing contact and refresh
recovery, loaded/expanded photo retention through review/back, normal receipt,
explicit identical retry after a lost submit response, uncertain upload/removal
states, removal recovery, unsaved navigation warning, QR rejection and initial
load retry. Inspected layouts had no horizontal overflow; 320px review actions
cleared the fixed navigation, keyboard focus was visible, and the browser
console reported no warnings/errors. Screenshots contain fictional information
only. The temporary public fixture was removed after review.

These checks do not establish authenticated backend/PostgreSQL/S3 acceptance,
real signed-image delivery, native photo picking, physical-phone keyboard/IME
behavior or actual cross-tab/network races. Fixture navigation used a MemoryRouter;
real browser Back/Forward, document-close prompts and QR reopen require manual
acceptance (lifetime callbacks and stale ownership were exercised synthetically).
Backend, schema, environment, admin/staff and other guest workflows were not
changed. No real records were mutated, and no Git staging/commits, migrations,
deployment or server lifecycle operations were performed. This completes only
the approved standalone reporting presentation slice.

## Slice 8 — compact admin shell and property/staff directories (2026-10-08)

This frontend-only slice tightens the shared administrator shell and redesigns
only the property and staff lists. The shell now provides a centered content
container capped at 1220px, a 64px desktop header, narrower desktop/tablet sidebars
and compact vertical spacing. Mobile keeps the original 16px horizontal gutters,
existing safe-area clearance and the exact 운영 · 일정 · 정비 · 이상사항 · 더보기
navigation. ITCEN text branding, discreet OH BOK credit, session controls, skip
link, route focus and active navigation behavior remain unchanged.

The lists opt into shared `admin-directory.css` and small AdminListHeader,
AdminActivityBadge, AdminListState and AdminListPagination components. Desktop
and tablet use aligned semantic list rows with accessible field labels; phone
rows stack identity/status, labeled fields and a full-width 상세 보기 action.
Staff contact information gets more column space on tablet. Long Korean/English
names, affiliations and contact text wrap without hiding information. Controls
retain at least 44px height, visible focus and 16px mobile input text.

Property rows show name, region, activity and assigned staff or 미배정. Staff rows
show name, affiliation, contact, activity and the returned assignment count;
inactive properties remain included and the footnote says so. Full assignments
remain available in the existing staff detail screen. Missing values have clear
labels. Search/status filters, reset, refresh, real result totals, loading,
failed-read retry, empty/no-result states and previous/next paging share a compact
presentation. PropertyFilters moved into its screen's components folder.

Existing API contracts and behavior are preserved: GET /admin/properties and
GET /admin/staff send page, fixed limit=12, optional search and isActive with only
the current administrator Bearer credential. Response validation, abort/fencing,
session rejection, URL normalization and out-of-range page correction are
unchanged. Details still read GET /admin/properties/:id or GET /admin/staff/:id.
Registration and detail links retain the canonical list search/status/page query;
the property saved-notice detail link now also retains that context. Existing
editor return handling and all create/update/assignment APIs are unchanged.
No sorting, statistics, property-readiness model or staff accounts were added.

Verification used a fresh isolated source/dependency copy, independent of the
cancelled release/deployment work. Yarn typecheck, full non-fixing Oxlint,
changed-source Prettier with the repository's exact configuration, production
build with sample public HTTPS origins and whitespace checks passed. The existing
large-bundle build warning remains. Temporary probes passed 297 actual-module
API/model/hook/session/component assertions and 143 fictional-fixture assertions.
They cover 12-record pagination, search/activity, invalid responses, page clamping,
create/detail/return context, aborts, stale credentials/responses, loading/error/
empty states, many assignments and guest/staff source isolation. No permanent
tests or dependencies were added.

Browser review used the existing authorized localhost:5175 frontend to serve a
temporary standalone bundle of the actual shell, list/detail screens, hooks and
response readers with mocked APIs/session. Fixtures contain 60 properties and
36 staff, including long Korean/English text, missing contact/region, active/
inactive and unassigned records and a staff member with 19 assignments. CSP
connect-src none, throwing fetch/XHR and module-manifest checks exclude backend
traffic and real credentials; write mocks reject. BrowserRouter/FragmentHistory
are real within the fixture. Search, active filtering, multiple pages, detail and
return context, browser Back/Forward, refresh, empty/no-result states, deliberate
read retries and loading recovery were exercised without record mutations.

The property/staff lists were inspected at 320, 390, 768 and 1440px with no page
horizontal overflow. Keyboard Tab produced a visible 3px focus outline; list
controls measured at least 44px. At 320px the pagination cleared the fixed bottom
navigation by about 24px when scrolled into view. Dashboard, calendar, maintenance,
issues, submissions, reports and More were checked through the shared shell at
320 and 1440px; their page contents were not redesigned. The browser console had
no warnings/errors. Review screenshots contain fictional data only and the
temporary public fixtures were removed after review.

Remaining findings outside this slice: the calendar's existing -20px mobile
margin causes 4px horizontal overflow at 320px; an original-shell fixture and the
final shell both measured scrollWidth=324. Mobile gutters were preserved so this
slice does not worsen it. Existing property URL search truncation uses UTF-16
units: 99 Korean characters followed by an emoji can split the emoji at the
100-unit boundary. Filter validation was intentionally not changed in this design
slice. These findings remain for separately scoped work.

This is fixture/browser and synthetic evidence, not real administrator JWT,
backend/database, physical-device/IME or full cross-tab acceptance. The fixture
can exercise in-document Back/Forward, but a document reload uses the real app
and still requires authenticated manual review. Property/staff forms, assignment
rules, guest/staff screens (including Slices 7A/7B), backend/schema/environment,
release/deployment work and services were unchanged. No staging, commits, pushes,
migrations, deployment or server lifecycle operations were performed.

## Slice 9 — schedule management across properties (2026-10-08)

This frontend-only slice builds on the committed Slice 8 shell. A fresh 이용 일정
menu visit opens the compact 일정 현황 list at `/admin/calendar?view=schedule-list`.
Explicit `/admin/calendar` links still open the calendar; `/admin/stays` remains
available as 전체·취소 기록. These three views have shared navigation. Registration
and Excel-import entry points remain, while stay forms/import/detail contents
and their writes are unchanged.

The existing contracts require two list purposes: GET /admin/stays supports guest
search and cancelled records but does not return checklist classifications.
GET /admin/calendar returns authoritative arrival/departure checklist evidence,
but only for non-cancelled schedules and a bounded date/property query. The new
operational list therefore requests one calendar page with limit=12, from/to,
optional propertyId and page. It displays real totals and server statuses:
작성 예정, 미제출, 제출 완료 and 확인 필요, with expandable review reasons and links
to existing submitted-checklist filters. It never infers occupancy or readiness.
The retained records list preserves guest search, property/status filters,
pagination and registration/cancellation labels; contact/company details remain
accessible in the unchanged stay detail.

A shared searchable property selector filters the existing loaded name/region
options, includes inactive properties, supports keyboard dismissal/focus return,
and does not query once per property. Apply/reset and an applied-condition summary
keep draft inputs distinct from the displayed results. Date ranges use existing
inclusive Seoul boundaries and the backend's maximum 62 days. Response readers
remain strict; the new hook aborts old requests, fences credentials/results and
preserves existing session rejection and deliberate read retry behavior.

Calendar cells now show the day count and arrival/departure/continuing markers,
with clear selected-day styling, month navigation, Today and a button focusing the
full selected-day list. The calendar still fetches every page (100 records/request)
for one month and checks page consistency; busy days are not truncated. Selected
date/month, property and operational range/page survive calendar/list switching,
stay detail/return and browser Back/Forward. Legacy record detail links retain
search/status/property/page via their original view=list discriminator. Keyboard
paging focuses the persistent results summary while the new page loads.

Desktop uses aligned operational columns, tablet places property/guest identity
above dates/status/actions, and phone rows stack readable fields. Shared shell
styles are unchanged. Calendar negative horizontal margins were removed after the
baseline fixture reproduced scrollWidth=324 at a 320px viewport. Property search
now normalizes/truncates by Unicode code points, matching existing staff search,
and removes the UTF-16 input maxlength: the baseline 99 Korean characters plus
one emoji produced a broken surrogate; the fixed model and browser retain the
whole emoji within the 100-character limit. No backend validation changed.

Verification used a fresh isolated source/dependency copy, independent of cancelled
release work. Yarn typecheck, full non-fixing Oxlint, exact changed-source Prettier,
production build and whitespace checks passed. The existing large-bundle build
warning remains. Temporary actual-module probes covered Unicode normalization,
property-picker keyboard/selection behavior, calendar readers and full-calendar
regression, 12-record pagination, URL validation/navigation, page clamping, aborts,
stale credentials/responses and loading/error/empty states. No permanent test
files, dependencies or deployment artifacts were added.

Browser verification used the authorized existing localhost:5175 server with a
standalone fictional bundle of actual screens, hooks and response readers. Its
transport/session are mocked, all writes reject, and CSP connect-src none plus
fetch/XHR blocking exclude live API traffic. Fixtures include 60 properties,
210 stays, 12 cancellations, 138 active month records fetched in two calendar
pages and 60 entries on a busy day, plus quiet days, month-spanning stays, all
checklist states and long Korean/English names. Temporary public fixture files
were removed after review; screenshots outside the repository contain fiction only.

The schedule list/calendar were inspected at 320, 390, 768 and 1440px. No page-wide
horizontal overflow was observed; the fixed 320px calendar fits from x=16 to 304.
Property search/apply/reset, paging, detail/return, browser Back/Forward, month/day
selection, all 60 busy-day rows, expanded review reasons, cancelled record filters,
loading/empty/error states and deliberate recovery were exercised. Native keyboard
date editing verified both the 62-day rejection and a valid changed range. Picker
Escape restored focus; paging focused results; Tab showed a visible 3px outline.
At 320px the pagination bottom was about 95px above the fixed navigation after
scrolling to the end. The browser console had no application warnings/errors.

These are synthetic/browser-fixture results, not authenticated administrator JWT,
real backend/database, physical phone/IME/date-picker, screen-reader or concurrent
live-data acceptance. Manual signed-in review and a document reload remain needed.
No live records, backend/schema/environment, guest/staff flows, Git staging/commits,
migrations, deployment or service lifecycle were changed. The Slice 8 overflow
and Unicode findings above are resolved by this slice; its other boundaries remain.


### Slice 9 reset follow-up — 2026-10-08

Fixed draft filters surviving Reset when the normalized applied URL stays the
same. Schedule and calendar forms now handle native reset events, explicitly
resetting controlled dates, property selection and validation errors. Empty-result
and invalid-query reset buttons target the same forms. Parent callbacks return
the exact defaults they apply: schedule keeps the selected month and resets page
and property; calendar uses today's Seoul date, evaluated once at click time.

The temporary regression probe failed on the original retained property and
passed after the fix. It covers unchanged mounted forms, custom applied filters,
validation, repeated resets, date rollover and external form/button associations.
Typecheck, non-fixing lint, changed-source Prettier, production build and existing
schedule/navigation/calendar probes passed in the isolated source copy. The
existing bundle-size warning remains. These checks use synthetic component hooks
and presentation fixtures; native browser reset dispatch and signed-in live API
acceptance were not rerun for this follow-up. No permanent tests or dependencies
were added.

### Slice 10 — searchable property filters and applied summaries — 2026-10-08

Frontend-only changes on 운영 현황, 청소·정비, 이상사항 and 제출 기록 reuse
Slice 9's AdminPropertySelect. Name/region search uses the existing loaded options,
including inactive properties. A selected UUID missing from the option list remains
selected and is labeled 목록 확인 필요; it never silently becomes 전체 휴양소.
The shared selector only gains an optional accessible invalid state. Existing
calendar/schedule callers, shared shell, result cards/rows and guest/staff screens
are unchanged. Wrapping rules are scoped to the four affected screens.

Maintenance, issues and submissions now show a compact 적용 조건 definition list.
The dashboard retains its existing property/date summary and timestamps. Summaries
come from validated applied URL filters, not unsaved form inputs. They preserve
maintenance record/date meanings, issue cancellation defaults and submission visit
dates. 미연결 이용객 기록 accurately describes submitted arrival/departure records
when type/status are implicit. No global property selection was introduced.

조회 validates the draft and updates the URL before the existing read hook runs.
오늘 retains the dashboard's draft property and requests today's date by omitting
an explicit date. Native form resets clear controlled drafts and errors even when
the applied URL stays unchanged; empty/invalid-query reset buttons target the same
form. Submission reset retains an existing valid stayId scope, as before. Native
partial dates are blocked rather than silently treated as an empty optional range.
The submission screen also rejects malformed/duplicate supported URL filters before
its existing typed parser can omit them; no default results/summary are shown for
those invalid URLs. Existing page fallback and unrelated-query handling remain.

Existing GET contracts are preserved: /admin/dashboard, /admin/maintenance,
/admin/issues and /admin/submissions; the three lists retain limit=20 pagination.
Property options still use /admin/properties?page=N&limit=100, reading every page
without an isActive filter. No per-property request or new API was added. Existing
admin credentials, response readers, cancellation/stale-response protection,
detail-return context, ordering and status/cancellation rules are unchanged.

Verification used a fresh isolated copy of current source and dependencies. Yarn
typecheck, full non-fixing Oxlint, exact changed-source Prettier, production build
and whitespace checks passed. The existing large-bundle warning remains. Temporary
actual-module probes passed: shared/dashboard 84 assertions, maintenance 62,
issues/submissions 211, and fixture API/readers 59. These cover filtering, summaries,
invalid URLs, reset associations and repeated reset, partial dates, missing/inactive
options, navigation, request validation and existing reader/hook behavior. No
permanent test files or dependencies were added.

Browser review used the authorized existing localhost:5175 frontend with a temporary
fictional bundle of actual screens, hooks and readers. Transport/session are mocked,
writes reject, and CSP connect-src none plus blocked fetch/XHR prevent live API
traffic. Data include 60 properties, long Korean/English names, inactive/missing
options and multiple pages of maintenance, issues and submissions. All four pages
were visually reviewed at 320, 768 and 1440px; the dashboard was also reviewed at
390px. No page-wide horizontal overflow was observed. At 320px an external reset
button remained about 54px above the fixed bottom navigation after scrolling.

Browser interactions covered name/region selection, unapplied versus applied
conditions, dashboard Today, native partial-date rejection/reset, repeated reset
and external empty/invalid resets (including submission stayId retention). Issue
and submission page-two detail/return context worked; issue Back/Forward also
retained context. Missing selection survived a property-list error and deliberate
recovery; inactive labels and long names remained readable. Result loading/error
states were inspected and an error was retried deliberately. Picker Escape returned
focus to its trigger; Tab showed a visible 2px focus outline. No application console
warnings/errors were observed. Temporary public fixture files were removed after
review; fictional screenshots are outside the repository.

These are synthetic probes and browser-fixture checks, not authenticated admin JWT,
real backend/database, physical-device native picker/IME or screen-reader acceptance.
Manual signed-in review and a document reload remain needed. No backend/schema,
environment/deployment files, live records, migrations, staging, commits, pushes
or service lifecycle were changed.


### Slice 10 review follow-up — maintenance Reset focus — 2026-10-08

Maintenance Reset keeps the keyed remount that clears draft filters, validation
and partially entered native dates. It now remembers a focused reset button for
that form and restores focus to the new top reset button only if the old control
was removed and focus is still on the document body. A surviving external reset
button or a control the user focused in the meantime keeps focus. Programmatic
resets do not move unrelated focus. Restoration waits for both the local reset
and the default URL to commit, including deferred router navigation, and uses
preventScroll to preserve the viewport.

A temporary regression probe fails against the pre-fix screen and passes 34
assertions against the fix, including repeated resets and deferred query commits.
It simulates DOM replacement/focus with actual component and effect logic; native
browser and physical-device focus acceptance were not rerun. Existing maintenance
and filter probes, typecheck, non-fixing lint, exact Prettier and the production
build passed in the isolated source copy; the existing bundle warning remains.
Only the maintenance screen, its reset button ID and this note changed in the
follow-up. No permanent tests, dependencies or backend changes were added.

### Slice 11 — property settings and staff assignment — 2026-10-12

Property create/edit now uses a compact, scoped layout with the saved property
name, region and activity in its heading, a guarded return-to-directory action,
and an explicit unsaved/saving status beside the form actions. On wider screens,
public contact and operating settings sit beside each other; narrow screens keep
one column. Public contact guidance, name/contact validation, nullable clears,
create defaults and the existing dirty/uncertain-save protections remain.

Successful create/edit and uncertain-result reconciliation preserve the canonical
property directory search/status/page. The staff-management link carries that
same context through assignment, return to settings, and loading/error fallback.
Only known directory query fields are retained by the existing filter parser;
there is no arbitrary return URL parameter. A save can remove a property from the
current filter; the directory still shows its saved-result link and clamps an
out-of-range page using its existing behavior. QR/checklist/guide editors retain
their existing navigation and content.

Assignment compares the currently saved and selected staff member before saving.
Compact candidate rows show the current assignee, selected state, and a review
button beside a changed selection. The comparison precedes the candidate list on
mobile and occupies a side column on desktop. Applied search is distinct from
unsaved search text; searching, resetting or paging retains the selected staff.
Empty search results and no active staff have different explanations. Confirmation
retains its draft-access warning, and cancelling returns focus to the initiating
review button. Inactive properties still permit unassignment only. Success still
focuses the saved receipt and remounts the assignment state.

Existing API flow is unchanged: GET /admin/properties/:id reads settings;
POST /admin/properties creates and POST /admin/properties/:id/update saves changed
fields. GET /admin/staff with isActive=true searches candidates in existing
12-item pages; POST /admin/properties/:id/staff assigns a staff UUID or null.
The administrator session supplies the Bearer token, readers validate unknown
responses, and existing abort/ownership/duplicate/uncertainty/conflict guards apply.
No backend, schema, dependencies, credentials or service operations changed.

Verification: isolated Yarn typecheck, non-fixing Oxlint, production build and exact
changed-source Prettier passed. The existing large-bundle warning remains. Focused
disposable probes passed 85 navigation/state/mutation assertions and 30 staff UI
interactions; 18 additional assertions checked fictional fixture transport through
actual readers. These simulate React hooks/DOM/API responses, not live writes.
No permanent tests were added. Responsive CSS was reviewed for 320/768/1440px;
rendered responsive acceptance remains pending. Browser policy blocked the local
HTML fixture, and the existing localhost app required administrator login in the
review browser. No browser workaround or live data mutation was attempted. Manual
signed-in navigation, visual, keyboard and physical-device acceptance remain.

### Slice 12 — compact report download flow — 2026-10-12

The report form now reuses AdminPropertySelect for name/region search instead of
a native property dropdown. The existing all-page property loader includes inactive
properties. A disabled fieldset protects the form during generation and property
selection while options are unavailable; loading text is only used for actual
property loading. A missing selected property remains visible and blocks export
until deliberately corrected. Property-list errors retain their explicit retry.

A compact summary shows the period and property for the next download, including
full long property names and inactive status. It describes the current form, not
applied list filters or a preview of report rows. The existing month shortcuts keep
the chosen property. Native incomplete date segments clear any previous download
receipt, display a field error and block submission. Presets remount only date
inputs, clearing incomplete native segments even when dates match prior state.
The shared selector prevents its search Enter key from submitting the report form.

The page has smaller headings/padding, responsive date/property columns and three
compact sheet-description rows. Submission-date versus reported-date meaning and
current issue status remain visible. Secondary exclusions and the 5,000-row/16 MiB
limits are under a native expandable section. Mobile fields stack and long labels
wrap. Download status retains generating, requested and error states; requested
means the browser download was initiated, not that saving the file was verified.

The existing GET /admin/reports/excel contract remains unchanged: administrator
Bearer token, required valid 1900–2100 dates, Seoul boundaries, inclusive maximum
62 days, optional propertyId and a 60-second request timeout. Authenticated Blob
handling, JSON errors, MIME/size/ZIP-header checks, request snapshots, stale-session
and scope cancellation, duplicate prevention and object-URL cleanup remain intact.
No backend/schema/dependency changes or permanent tests were added.

Verification: isolated Yarn typecheck, non-fixing Oxlint, changed-source exact
Prettier and production build passed; the existing large-bundle warning remains.
Disposable actual-module probes passed 207 assertions covering date contracts,
authenticated transport/Blob checks, hook ownership and cancellation, selector and
form states, native partial-date handling and preset/receipt behavior. The probes
simulate DOM/hooks/transport and do not verify a real Excel download. Responsive
CSS was reviewed for desktop/tablet/phone constraints. Computer-use permission was
unavailable for the signed-in app, so rendered/browser/native date-picker and live
API acceptance remain pending. No credentials, live records or services were changed.


### Slice 13 — final flow review and guest navigation protection — 2026-10-12

A bounded cross-role review covered administrator property/staff setup, schedules
and imports, private guest links/vehicle context, submission and issue history,
report integration, guest entry/drafts/corrections/issues and staff maintenance.
No additional admin/staff contract defect was confirmed by that review. This is
source and simulated-contract evidence, not a completed live release walkthrough.
MANUAL_ACCEPTANCE.md records the remaining signed-in and physical-device checks.

Guest start/vehicle entry and submitted-checklist correction now register with
the existing NavigationBoundary. Previously their native beforeunload or local
link-click checks did not protect same-document browser Back/Forward. The guards
read current owner-scoped refs, so unsaved input and pending/unresolved mutations
are protected even before a subsequent render. Keeping the accepted route mounted
preserves input when the guest chooses to continue editing. Clean states remain
navigable. Native unload protection remains, and the entry-only click confirmation
was removed to avoid duplicate warnings; shared GuestFrame behavior is unchanged.

A verified start receipt is retained only in memory for its current access scope.
Normal successful starting still opens the private draft. If starting completes
while a leave dialog is already open and the guest stays, the entry form offers
an explicit continuation action for that same draft. It does not send another
start request. Navigation protection is released only for the matching verified
private draft destination; returning to the entry view protects the retained link.
Credentials are not added to storage, logs or backend payloads by this change.

API contracts are unchanged. QR start uses POST /submission-drafts/guest/start;
private-stay start uses POST /guest/stays/drafts/start. Validated start responses
supply the scoped draft credential. Existing vehicle save and submission-correction
calls keep their version/revision and uncertainty handling. No backend, schema,
dependency, service, Git staging/commit or deployment operations were performed.

Verification: isolated frontend Yarn typecheck, non-fixing Oxlint, exact
changed-source Prettier and production build passed. The existing main-bundle
size warning remains (about 1.16 MB minified / 301 KB gzip). Backend read-only
TypeScript compilation also passed. Disposable actual-module probes passed 236
assertions: 87 entry/navigation/recovery, 47 correction/navigation, 59 cross-repo
private-link contracts and 43 staff/submission contracts. They use simulated
React/events/transport or in-memory database dependencies, with no live writes.
No permanent test/spec files were added. Review also covered the pending leave
plus successful start race and stale-token/session cleanup.

Live signed-in browser, QR/camera/clipboard, PostgreSQL/S3, responsive rendering,
native picker and device acceptance remain pending in MANUAL_ACCEPTANCE.md.
Existing admin sidebar/brand/logout and SPA Back/Forward do not have universal
unsaved-form/one-time-link protection; this boundary remains explicitly noted.
The review did not modify actual records, credentials, running services or either
repository's Git history.


### Maintenance list clarity follow-up — 2026-10-12

The maintenance list now explains that each started staff checklist is a separate
record. Rows prioritize the property, recorded staff, existing status and one
timestamp: submission for COMPLETED, last saved otherwise. Native collapsed
상세 정보 sections retain started/saved/submitted/expiry dates. Submitted links
are labelled 제출 내용 보기 and retain the existing detail URL/filter return
context. Expired/blocked/review-needed explanations and review reasons remain
visible; only valid COMPLETED records offer the detail link. Desktop uses four
columns; tablet/mobile stack compactly with wrapping names and 44px controls.

Editing property, record scope, date basis or period displays 조회 버튼을 눌러
적용하세요 with a reminder that results still use the previous conditions.
The notice compares local controls with the applied URL input and ignores page
number. Reverting controls or the existing URL/reset remount clears it. Native
partial date input also triggers the notice and remains blocked by date validation.
No request is sent until the existing 조회 flow validates and applies filters;
the applied summary still describes URL state. No API or status semantics changed.

Verification: isolated Yarn typecheck, non-fixing Oxlint, changed-source exact
Prettier and production build passed, retaining the existing large-bundle warning.
Disposable actual-component rendering and filter interactions passed 59 assertions
covering all five statuses, collapsed dates, detail-link eligibility/context,
unapplied/reverted/reset conditions and invalid/native-partial date inputs. These
use fictional records and synthetic events; responsive CSS was reviewed, but live
browser/device rendering remains unverified. No permanent tests, backend changes,
live records, service operations or Git staging/commit were included. Earlier
uncommitted Slice 13 changes and MANUAL_ACCEPTANCE.md are preserved.


### Issue card clarity follow-up — 2026-10-12

Issue list rows now put the property first, group urgency/processing/cancellation
badges, and label location and category beneath the issue title. The compact
desktop table follows the same reading order. Tablet uses a two-column layout;
phone cards stack with a full-width 신고 내용 보기 action and 44px minimum target.
Reported and resolved dates display Korean time to the minute in this list;
precise dateTime values and the shared detail/history formatter remain unchanged.

Both detail links retain the applied filter query. Filters, API requests, status
semantics and issue actions are unchanged. Optional region/location remain
conditional, and long names/content wrap. Existing guest and maintenance changes
are preserved. No backend, live records, services or Git history were changed.

Verification: isolated Yarn typecheck, non-fixing Oxlint, exact changed-source
Prettier and production build passed. The existing large-bundle warning remains
(about 1.16 MB minified / 302 KB gzip). Independent source/CSS review found no
concrete regression. Live browser/device rendering remains unverified because
the signed-in browser is unavailable to computer use.


### Administrator navigation protection — 2026-10-12

Administrator edit screens now register current pending work with the existing
NavigationBoundary. Sidebar, brand, mobile menu and same-document Back/Forward
keep the accepted editor mounted until the user chooses 계속 작성 or 이동하기.
Native reload/tab-close warnings use the same current checks. Covered workflows
include property/staff forms and assignment, guides, checklists, categories, stay
create/edit/status changes, import files/mappings/row review, issue actions and
submission corrections/lifecycle/stay association. Request refs protect the time
between starting a mutation and React rendering its busy state. Existing mutation
ownership, validation, conflict and uncertain-result behavior is unchanged.

QR and private-stay issuance keep one-time receipt protection after copying and
through failed status reads. Initial read errors alone do not manufacture pending
private-link changes. Receipts stay in memory; no token is added to storage, logs,
query keys or history.state. Existing private-link expiry/scope checks remain.

Already-confirmed local exits and verified successful save redirects approve only
the exact synchronous destination and router key. An in-place refresh/editor
switch grants no future navigation allowance. This prevents duplicate dialogs
while keeping later unsaved work protected. The existing guest/staff history and
fragment handling remains in use, with its public dialog copy unchanged.

User-triggered admin logout now asks before clearing the current session when
work is pending. Staying preserves both session and editor. The confirmation is
scoped to the initiating token and is cancelled on session change/unmount. Forced
expiry or server authentication rejection still clears access immediately and
redirects to login, even if an edit dialog was already open. Leaving a pending
request does not undo a write already accepted by the backend.

No API contract, backend, schema, dependency, service or deployment change. Existing
GET reads and authenticated POST mutations are unchanged; the new decision occurs
locally before voluntary navigation or logout. MANUAL_ACCEPTANCE.md includes the
remaining signed-in navigation and phone checks.

Verification: isolated Yarn typecheck, non-fixing Oxlint, exact changed-source
Prettier and production build passed. The existing large-bundle warning remains.
Disposable actual-module probes passed 187 assertions: 42 shared navigation, logout
ownership and forced-auth redirects; 74 property/staff/configuration guards and
saves; 71 stay/import/QR/private-link guards. React, history, events, API outcomes
and clipboard were simulated. Independent source review checked the shared guard
and domain integrations. No permanent test/spec files or live record writes were
added. Signed-in browser, native dialog and real-device acceptance remain pending.

## Frontend deployment commands — 2026-10-12

`bash deploy.sh` provides separate pull, prepare, up, status and logs commands for
the user's EC2 checkout. Pull fast-forwards a clean `master` branch only.
Preparation validates Compose configuration and builds the frontend without
starting services. Existing TypeScript/Vite origin validation runs inside the
Docker build; there is no separate URL-validation language or server runtime.

The Bash script uses standard sha256sum (or shasum) to fingerprint resolved Compose
configuration. Images use the full Git commit ID plus that fingerprint; the OCI
revision label is the plain commit ID. Up requires a matching prepared image and
waits for frontend health. URL, host-binding, checkout-path or Compose changes can
require preparation again. Existing Docker build layers can still be reused.

Compose parses the server .env as data. Inherited public URL/bind variables are
cleared; release identity is supplied after optional Docker sudo. Git runs as the
checkout owner. The setup guide is deployment/README.md. Runtime routes, UI,
backend, credentials and developer environment are unchanged; UI remains Korean.

Validation: Bash syntax/help and 23 disposable command-flow checks passed using
real Compose v5.6.0 parsing and standard shell hashing. Git, Docker daemon/image/
build, and sudo operations were mocked. Checks covered URL/config changes, clean
branch guards, sudo handling and build/start failures. Independent design review
found no blocker. Linux Docker/Nginx runtime, HTTPS and application acceptance are
still pending. No operational Git, service, database or deployment action ran.

## Single CloudFront distribution gateway — 2026-10-12

The production frontend and API share one HTTPS CloudFront origin. API base URLs
accept an optional exact `/api` prefix; transport preserves it while checking
origin/prefix boundaries and existing per-call credential rules. Browser paths
and backend controllers are unchanged. Nginx strips `/api` and forwards to the
API through the backend-owned retreat-proxy network, resolving replacement
containers through Docker DNS. SPA fallback does not consume API errors.

The gateway accepts a runtime-only 64-hex origin verification secret shared with
CloudFront, forwards viewer IP information unchanged for one-hop backend trust,
and supports uploads with a 12 MiB body limit and 90-second upstream timeouts.
Requests/responses are streamed without upstream retries. Internal health runs
on an unpublished loopback listener. Safe access logs omit queries; the raw
Nginx error log is suppressed. This deployment uses HTTP from CloudFront to EC2
and HTTPS for viewers. deployment/README.md records required CloudFront settings.

Vite configuration now uses an explicit .ts extension required by the existing
NodeNext typecheck. No schema, migration, UI, dependency or business API changes.
The user owns Git, server configuration, migrations and deployment.

Verification: isolated frontend typecheck, lint, production build with fictional
HTTPS /api configuration, and 128 transport assertions passed. Official Compose
configuration checks and Bash/entrypoint syntax passed. A temporary official
Nginx build passed 30 actual runtime probes covering routing, secret enforcement,
health isolation, header forwarding, uploads/body limits, cache controls and no
retries. That test caught and verified a fix to the upstream-variable directive
order. Host paths, ports and DNS were adapted for the probe; actual Docker, EC2,
CloudFront, database, S3 and browser workflow acceptance remain pending. The
existing frontend bundle-size warning remains. No permanent tests were added.

## Slice 1 — consistent ITCEN branding — 2026-10-13

ITCEN is now the primary text identity across the public shell, login, admin,
guest/staff entry, drafts, submitted detail and invalid-link screens. Shared
identity lives in `core/config/brand.ts`; OH BOK remains the discreet operator
credit. QR poster footers and browser title/metadata use the same identity.
Existing layout, navigation, credential handling and QR encoding are unchanged.

Added an original neutral retreat symbol as an SVG favicon, 32px PNG fallback,
180px Apple touch icon, and opaque 192px/512px app icons. This is not an official
corporate logo. Landing-page redesign and PWA manifest, installation and offline
behavior remain later slices. No backend, schema, dependency or server changes.
The pre-existing Dockerfile COPY permission fix remains separate from this slice.

Verification: isolated Yarn typecheck, non-fixing lint and production build passed
with fictional HTTPS origins. Existing large-bundle warning remains. Disposable
actual-source fixtures passed 114 branding/asset assertions across 16 variants;
public, guest guide and staff headers were visually checked at 320px. All six
icon assets survive the build. These are synthetic checks, not authenticated
workflow, physical-device, production or PWA acceptance. No permanent tests added.

## Slice 2 — guest-first public landing — 2026-10-13

The homepage now introduces ITCEN retreat guidance with an original decorative
SVG scene, a focused introduction, three usage steps, native FAQ disclosures and
a staff QR reminder. The primary action focuses the on-page guidance; the small
header link opens existing administrator login. Tokenless guest/staff links and
stale coming-soon cards were removed from the homepage.

AppShell changes are scoped to the home pathname. Login, not-found and developer
shells retain their existing presentation; shared error-screen link CSS remains.
Guest/staff access routes, private links, tokens, API contracts and business flows
are unchanged. No new dependency, backend work, installation or offline behavior.

Verification: isolated Yarn typecheck, lint and production build passed with fake
HTTPS origins; the existing bundle warning remains. Browser checks covered the
actual local page at desktop, 390px and 320px, including no horizontal overflow at
320px, guidance-anchor focus, opening a FAQ answer, and admin-login navigation.
Independent source review found no blocking regression. No authenticated writes,
real-device or production acceptance, new permanent tests, commits or deployment.


## Slice 3 — PWA installation and safe updates — 2026-10-13

Added the branded web manifest, standalone launch metadata, and production-only
service-worker registration. Install guidance appears below the landing FAQ and
as a compact disclosure in administrator More. A native install action is shown
only when the browser offers it; Korean device instructions remain available.
Installation starts at `/` and does not add credentials to the manifest or
change guest/staff link authorization or administrator session behavior.

Operational workflows remain online. The worker caches only the fixed public
`/offline.html` connection-help page, bypasses API/write/asset requests, and never
stores navigation URLs, application responses, photos or private tokens. Retry
reloads the same address without displaying or recording its fragment. There is
no offline submission queue. A first-ever offline visit cannot use the fallback
until a worker has previously installed and controls the navigation.

New builds carry matching app/worker release IDs. Updates remain waiting without
skipWaiting or clients.claim; existing pages are never automatically refreshed.
The notice offers manual refresh only on the accepted landing or admin More
route, checks existing pending-navigation and dirty guards, and retains native
unload guards. Other routes instruct the user to finish and save work first.
Nginx serves worker/manifest/offline files through exact no-store locations.

Verification: isolated Yarn typecheck, non-fixing lint and production builds
passed with fictional HTTPS origins; the existing bundle-size warning remains.
Disposable worker/controller/component probes covered cache ownership, request
bypass, failure fallback, release comparison, lifecycle cleanup, install states
and refresh eligibility. An actual browser against an isolated production build
verified a network-failure fallback, manual recovery preserving a fictional hash,
public-offline-only cache contents, a new-release notice without a forced reload,
and explicit refresh without a repeated notice. The install guide was visually
checked at 390px and 320px with no horizontal overflow at 320px. Test workers,
caches and tabs were cleaned up. Physical iPhone/Android installation, production
HTTPS/Nginx/CloudFront behavior and authenticated PWA workflow acceptance remain
pending in MANUAL_ACCEPTANCE.md. No backend changes, new dependencies, permanent
tests, commits, server configuration or deployment actions were made.


### PWA installation card design refinement — 2026-10-13

Reworked the shared installation presentation into a pale-blue section with a
stronger heading and a separate white action/instructions panel. Desktop uses
two balanced columns; phone layouts stack them. The admin More disclosure stays
compact. Install event handling, service worker, update policy and API flows are
unchanged. The footer keeps the private-link and internet requirements visible.

Verification: isolated typecheck, lint and production build passed (existing
bundle-size warning only). Actual local landing/disclosure layouts were checked
at desktop, 390px and 320px; no horizontal overflow at 320px. Independent source
review covered native install/loading/installed states and compact admin markup.
No device-installation, authenticated admin or new deployment acceptance claimed.
