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
  maintenance/issues/staff/more, entry and dev exist; guest/staff access flows follow later.
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
Checklist records include filters, saved details, revision history and private photos,
plus administrator linking of eligible guest QR records to stays. Cleaning and
maintenance monitoring and read-only issue lists/details/history/photos are available.
Issue notes, resolution and reopening are available. Staff profile management and
property staff assignment are available. Property QR status, issuance/replacement,
local QR images and link copying are available. Property checklist setup, fixed guest template previews,
and maintenance template editing are available. Other management screens, guest/staff link validation,
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
Assigned staff is displayed with a separate management screen at
`/admin/properties/:id/staff`; QR controls have a separate screen at
`/admin/properties/:id/qr`. Checklist configuration lives at
`/admin/properties/:id/checklists`. Guides follow separately. Same-name errors preserve the form;
unknown save results block resubmission and direct the user back to the list to
check the result. Token changes/unmount abort and fence pending responses.
Dirty forms warn on explicit Cancel and full-page unload; sidebar/back navigation
is not globally blocked. Guest/staff screens and PWA support remain separate slices. Keep the current OH BOK branding until the
client/operator branding choice is confirmed.

## Administrator navigation

`layout/model/admin-menu` defines the primary and secondary menu entries;
`AdminNavigation` handles their route groups. Desktop shows seven entries. Mobile
shows 운영, 일정, 정비, 이상사항 and 더보기. The `/admin/more` screen links to
직원 관리, 제출 기록 and 휴양소 관리; their nested routes keep 더보기 active on mobile.
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
timestamp, and an exact same-frontend-origin `/guest` or `/staff` URL with only
`#token=<43 base64url characters>`. Backend FRONTEND_URL must match the origin
where the administrator opens this frontend (localhost:5175 locally). A wrong
origin is treated as an invalid receipt, not rewritten or accepted silently.

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
