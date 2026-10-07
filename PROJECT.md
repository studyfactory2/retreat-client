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
ITCEN as the primary text brand on the redesigned admin dashboard and guest home,
with OH BOK credited discreetly as the operator. Other screens keep their current
branding until their approved redesign slice. No approved official logo asset is
present; do not fabricate one. Reference mockups do not define extra scope. Use
semantic HTML, keyboard focus, readable contrast, and phone-first guest/staff
layouts. Administrator pages also support desktop/tablet.

## Contracts

Yarn only; keep yarn.lock. Preserve the existing React/Vite/TypeScript setup and
Oxlint. Router is React Router 7. Native fetch follows the Study Factory transport
pattern, adapted to Retreat. No authentication library or global state package is
needed for this foundation.

Client: 5175, API: 3100 locally. GET/POST only, no `/api` prefix, no cookies.
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
