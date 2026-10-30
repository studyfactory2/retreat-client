# Retreat final live walkthrough

Checkpoint: 2026-10-12. These checks are **pending** until performed against the
running application. Source review, TypeScript/build checks and simulated
API/database probes do not count as live acceptance.

Use a disposable property and fictional guest/staff details. Keep the test property
name, record IDs and pass/fail results with this checklist. Do not paste private QR,
invitation or draft tokens into screenshots or bug reports.

## 1. Prepare the property

- [ ] In `휴양소 관리`, search for the test property, open its settings and save
      a small change. Return to the directory: search/page context is retained.
- [ ] Register an active test staff profile in `직원 관리`, then assign it through
      the property's staff settings. Confirm the saved assignee.
- [ ] Configure active arrival, departure and maintenance checklists. Include a
      required item. Save a short guest guide and contact number. Add an active
      global issue category through `이상사항 → 분류 관리`.
- [ ] Open the guest QR and staff QR on a phone. Each shows the intended property
      and its appropriate guide/checklist. Keep the two QR types distinct.

## 2. Schedules and private stay links

- [ ] Create one test stay in `이용 일정 → 일정 등록`. Confirm its property,
      guest and Korea-time arrival/departure dates in both list and calendar.
- [ ] Import a supported `.xls` with another fictional stay. Upload creates a
      preview; it must not create schedules until explicit confirmation. Review
      property mapping and errors, confirm, then inspect the resulting stay.
- [ ] Issue and copy a private guest link from the stay detail. If vehicle
      registration is enabled, save a fictional plate through that link and
      confirm it in the administrator's vehicle view.
- [ ] After finishing that link's guest tests below, edit the stay and check the
      old link is rejected. Reissue deliberately and verify the new link. Revoke
      it and verify that link is rejected as well.

## 3. Guest checklist, recovery and correction

- [ ] From the property QR, choose arrival/departure and enter a name. Press
      browser Back: `계속 작성` keeps the entered text; `이동하기` leaves.
- [ ] Start the checklist. A successful start opens the private draft directly,
      without an extra discard warning. Copy the private continuation link.
- [ ] If starting completes while a leave dialog is already open, choose
      `계속 작성`, then `시설 확인 계속하기`: it opens the same created draft,
      without another start request.
- [ ] Answer a required item, add a memo and photo, then save. Reopen the private
      continuation link: saved content/photos remain. The shared property QR
      must not expose that private draft.
- [ ] Try final submission with a required answer missing; fix the indicated
      item. Review and submit once. Confirm the receipt and matching admin record
      under `제출 기록`, including the photo view.
- [ ] Open the submitted checklist's correction view. Change an answer/memo and
      enter a reason. Back → `계속 작성` preserves input. Save the correction and
      verify the new revision while original evidence/history remains available.
- [ ] On the private stay home, edit the plate without saving and navigate to
      another guest view or use Back. Confirm the leave warning, then stay and
      save. Saved, unchanged data must not keep triggering warnings.

## 4. Staff maintenance

- [ ] Start from the staff QR. Confirm property and assigned staff, save partial
      answers and reopen the private continuation link.
- [ ] Add photos and select their intended associations. Incomplete required
      answers or unresolved photo associations must prevent final submission.
- [ ] Review and submit. Confirm the staff receipt; find the same record in
      `청소·정비` and `제출 기록`, and open the saved answers/photos.
- [ ] If a repair report is included, confirm it appears as an issue for admin
      handling. A staff repair report does not itself mark that issue resolved.

## 5. Issues and administrator history

- [ ] Submit a guest issue with a category, title and photo. Confirm its receipt
      and matching record in `이상사항`.
- [ ] Add an admin note, start handling, then resolve it. Verify each history entry
      and the current state. Check urgency and recurrence linking if used.
- [ ] On these test records only, cancel and restore an issue and a submission.
      Confirm the current cancellation state, original content and history.

## 6. Report and responsive checks

- [ ] In `운영 보고서`, select the test property and a period covering submission
      and issue-report dates. Download and actually open the `.xlsx`. Confirm
      `입퇴실 제출`, `정비 제출`, `이상사항`; a download-request notice alone is
      not proof the file was saved. Photo counts are included, not photo files.
- [ ] Check the key screens above on desktop, tablet and phone. Verify long
      property names, searchable filters, date pickers, visible action buttons,
      keyboard focus, dialogs and no unexpected page-wide horizontal scrolling.
- [ ] During a test save/upload, briefly interrupt the connection. Check the
      displayed recovery state and current server result before deliberate retry.
      Do not infer that an interrupted request failed on the server.

## 7. Administrator navigation protection

- [ ] Change a property or staff field without saving. Try the sidebar, brand,
      mobile menu and browser Back/Forward. 계속 작성 restores the source URL and
      retains input. 이동하기 opens the chosen destination. Repeat with a clean
      form: it should leave without a warning.
- [ ] Verify the same behavior for guide/checklist/category edits, stay and import
      edits, issue notes and submission corrections. Confirmed page-local exits
      should not produce a second warning. In-place reload/close confirmations
      must not allow a later unrelated navigation to skip its warning.
- [ ] Save a valid property, staff member or stay. The normal success destination
      opens without another discard warning. Failed or uncertain saves keep their
      existing recovery message and warn before leaving.
- [ ] Issue a QR or private stay link on test records. Navigation warns while its
      one-time receipt is present, including after copying. Staying retains the
      link; leaving discards the in-memory receipt. Reopening status must not reveal
      the old raw link. A failed status refresh must not silently lose the receipt.
- [ ] With unsaved admin input, press 로그아웃. 계속 작성 keeps the session and
      input; confirming logout clears the session. A clean screen logs out directly.
- [ ] Verify expiry/rejection takes precedence over an open leave dialog and sends
      the administrator to login. An old confirmation must not log out a new session.
- [ ] Check native reload/tab-close warnings on supported browsers. These are
      browser-controlled dialogs and cannot preserve data after a confirmed unload.

## Known boundaries

- Navigation guards keep mounted inputs and in-memory links during a voluntary
  leave decision; they do not save them automatically. Confirmed leaving, reload,
  forced session expiry or authentication rejection can discard unsaved work.
- Leaving or logging out does not roll back a server request already accepted.
- Physical QR/camera/clipboard behavior, real JWT/PostgreSQL/S3, browser history
  dialogs and native date inputs require the live checks above.
- Deployment, production origins/TLS, backups and server operations are handled
  separately by the project owner. This walkthrough does not certify deployment.

## Local live run evidence: 2026-10-12

The checks below were performed in the running local application with a signed-in
administrator and fictional data. Existing checklist boxes remain unchanged:
several boxes combine verified behavior with cases still awaiting acceptance.

- Property: **검증용 휴양소 1012** (`ce7e420a-6976-441c-8e1b-1bd3f8b8ccdd`).
  Staff **검증직원1012** (`8b39cd85-fcdc-4ebc-bf26-2fba9b0f13b8`) was assigned;
  the guest guide and three active checklists were configured.
- Manual stay `313f7db4-15f1-45be-ac00-110bb3b0aa51` covered October 12–13.
  Fictional vehicle `999테1014` persisted after refresh and appeared in admin.
- A genuine fictional `.xls` produced preview
  `ec61eb04-92a9-4674-8090-acba173e9698`. Explicit confirmation imported **1 stay**,
  `8b94435b-6030-4105-9bb9-4636dbc7ae98`, for 가상민수 on October 20–21;
  the resulting schedule was checked in the calendar.
- Guest arrival `a7c37ea1-8a07-4535-8116-36defe374691` saved/submitted one abnormal
  answer and one photo. Partial draft save/reload, required-answer and photo-
  association blockers, and final review confirmation were exercised. A guest
  correction produced revision 2; later admin cancellation/restoration produced
  revisions 3/4 while preserving the original 13:13:41 submission time, memo,
  abnormal answer and photo. Public departure by 가상퇴실자 submitted one normal
  answer, no photos and no stay link.
- Maintenance `cb1d8bdb-6e4c-48a5-af2a-ee4ad972da32` submitted one abnormal answer,
  one photo and a repair claim. Its issue remained NEW for administrator handling.
  Arrival issue `4a0b65e2-f7ac-47f9-a006-c2a9565a1cb9` passed note, start handling,
  resolve, cancel and restore actions; revision 6 retained its resolved state and
  photo. The direct urgent report **검증용 직접 신고 1012**
  (`4eebac55-10ac-49e3-bc83-ac9ff1872724`) submitted with one photo and a receipt.
- Editing the manual stay blocked its old private link. A replacement worked;
  revoking it blocked access. Vehicle confirmation and submission review-needed
  indicators reflected the stay edit. QR and stay-link receipt leave warnings
  still appeared after copying their links. No private links are recorded here.
- Admin property dirty-form checks covered sidebar, mobile menu and logout
  cancellation. Browser Back cancellation retained the URL and input; confirmed
  Back left the form, and Forward showed the original saved region.
- The actual downloaded report
  `/Users/john/Downloads/retreat-report-2026-10-01-2026-10-31 (2).xlsx` was opened
  and inspected with a workbook reader: **입퇴실 제출 2 / 정비 제출 1 / 이상사항 3**,
  **6 combined records**, all scoped to the test property and October 1–31.
  Arrival was revision 2 with one abnormal answer/photo; departure had no abnormal
  answers/photos; maintenance had one abnormal answer/photo. Issues were resolved
  arrival, new maintenance, and urgent/new direct report. This export preceded
  the later stay edit and arrival cancellation/restoration to revision 4; it is
  not evidence of the later record state. Memo and repair-claim details are not
  included in this summary report. File integrity and all three table filters
  were verified.
- Responsive verification is **partial**. Selected guest screens were checked at
  425px/768px and admin screens at 386px/931px. A fresh 425px admin issues check
  confirmed matching viewport/document/body/scroll widths, scale 1, and a fully
  visible header, filters and actions. Its screenshot below supersedes the earlier
  cropped capture; this does not establish responsive acceptance for all pages.
- Property QR guidance now describes the guest checklist and staff maintenance
  configuration each flow needs; the stale "screens are being prepared" notice
  was removed and the corrected Korean wording verified in the real UI.
- The private stay-link card's stale "guest screen is being prepared" notice was
  removed and the real UI checked. Targeted Prettier and `git diff --check` passed
  for both copy fixes.

Saved screenshots (local evidence, no private token URLs):

- `/private/tmp/retreat-live-acceptance-1012/admin-submission-restored.jpg`
- `/private/tmp/retreat-live-acceptance-1012/guest-receipt-mobile.jpg`
- `/private/tmp/retreat-live-acceptance-1012/admin-issues-mobile-425.jpg`

Still unverified: native reload/tab-close dialogs; authentication expiry/rejection
and stale-session races; interrupted requests/network recovery; concurrent edits
or submissions; physical phones, QR scanning, camera and system clipboard behavior;
full responsive/browser coverage; and deployment/production configuration. This
run does not certify those cases or deployment readiness.

## PWA device acceptance — 2026-10-13

Pending on physical iPhone/Safari and Android/Chrome after the user deploys:

- Install from the landing page guidance or native prompt. Confirm the ITCEN icon,
  name and standalone display. Reopening starts at `/` with no private link/token.
- Sign in as an administrator inside the installed app; verify session restoration
  and logout there. Do not assume its storage is shared with another browser.
- Open real guest/staff QR and personal links; confirm their original scoped flow.
  OS/browser handling may open links in the browser rather than the installed app.
- On an online visit, allow the worker to install. Close and reopen the app, then
  disconnect and reopen: confirm the public connection-help page. Reconnect and
  use 다시 시도; verify the original route/link can be recovered. First-ever offline
  visits without worker control are outside this fallback.
- Disconnect while a checklist is open: confirm the connection notice, no forced
  reload and no claim of successful offline saving, submission or upload. Reconnect
  and check the actual result through the existing flow before repeating writes.
- With checklist work open, deploy a new version: update notice must not refresh
  the page or show a refresh action there. Finish/save work; use landing/admin More
  to refresh. Confirm another open working tab remains untouched.
- Confirm the same waiting release stops prompting after refresh; close all app
  tabs/windows and reopen to let the new worker activate naturally.
- Inspect Cache Storage: only the public offline document belongs in the
  `retreat-public-offline-*` caches. No API, private page, photo or token URL.

These are pending device/production checks, not automated acceptance claims.


## Slice 6C combined archive acceptance — 2026-10-23

After deploying both matching API/client releases, check with authorized data:

- On phone, tablet and desktop, open 운영 보고서 and choose 보관용 ZIP. Select a
  small period/retreat and download. The notice says requested, not locally saved.
- Open the browser download and extract it in the device file manager. Confirm
  기록.xlsx opens, 다운로드안내.txt is readable, and the grouped JPG files open.
  App photos are processed JPEG copies, not untouched camera originals.
- In the workbook's 사진 목록 sheet, match ZIP 파일 경로 to extracted files and
  다운로드 결과 to the guide. Repeated references to one photo share one file.
- Check a cancelled record and a retained historical photo. Period scope selects
  records; a later change/photo of a selected record still appears. Check an
  archived retreat and a no-photo period as well.
- If a confirmed missing/deleted photo exists in authorized test data, check the
  included/skipped unique counts and explicit reasons. Storage permission or
  network errors must not be misrepresented as missing photos.
- Cancel preparation, leave the page, and change accounts while a request is
  pending; no late download may start. Retry explicitly after a failure. Check
  that summary and standalone preservation Excel still download normally.
- Check the deployed CloudFront origin timeout and the exact Nginx archive route
  with a larger authorized ZIP. The API caps preparation at 80 seconds; browser
  total request timeout is 180 seconds. Slow device/network behavior remains a
  device acceptance item, not an automated completion guarantee.

These production/device checks remain pending; automated checks use fixtures.

## Slice 7 staff handover — 2026-10-29

Implemented locally with the matching API handover contract. Apply the API's
`20261029060000_add_staff_deactivation_audit` migration before rollout; it was
authored but not run during implementation.

Entry: 직원 관리 → a staff member → 담당 인계 · 비활성화.

- Assign a different active employee to every operating retreat. A bulk selection
  can be applied, then individual retreats overridden. Removed retreats have their
  assignments cleared. Review once before the final deactivation action.
- The preview identifies unsubmitted work, including expired/blocked drafts and
  drafts at previously assigned retreats. Work is not transferred to a new author.
  Finish needed, still-submittable work before confirming the handover.
- The receipt retains the original assignment names, administrator and Seoul
  timestamp, and links to QR management. Issue and distribute new staff QRs.
  Guest QR, bookings, submitted records, revisions, and photos remain unchanged.
- Reactivation is explicit in staff editing and restores neither assignments nor
  old staff QR/private links. Inactive staff can reopen their latest handover record.
- Ordinary single-retreat assignment changes also revoke the existing staff QR.
  Reissue staff QRs at retreats reassigned before this fix where an old worker may
  still hold a copy; current assignments cannot identify every historical holder.

Local evidence: client typecheck, lint and production build passed (existing
bundle-size warning remains). Synthetic Chrome API fixtures passed at widths
320, 399, 760, 907, 1024 and 1440px with no horizontal overflow; reviewed screenshots
and checked sticky phone actions above the footer. Covered required selection,
bulk/per-retreat choices, exact save payload, success receipt, no replacement,
no assignments, existing inactive staff, stale 409 responses, and uncertain 503
responses recovered through a fresh preview without duplicate POSTs. Staff editor
and handover unsaved-navigation guards, mobile logout cancellation, and explicit
reactivation were checked. Reader/input and mocked API checks covered 58 cases.
Backend mock tests are documented separately in `docs/staff-deactivation.md`.

Still pending: disposable migrated PostgreSQL integration (including competing
reassignment/deactivation and transaction rollback), deployed end-to-end access
checks, and physical phone/tablet acceptance. With authorized test records, verify
old QR/private links fail, the freshly issued staff QR identifies the replacement,
and old submitted records/photos still display their original authors. Previously
issued signed photo URLs can remain usable until their existing short expiry.
No production data, migration, commit, push or deployment was performed.

## Slice 8 checklist versions — 2026-10-29

Entry: 휴양소 관리 → a retreat → 체크리스트 관리 → 입실 / 퇴실 / 정비.
All three types can now be edited. A meaningful save publishes a new version;
an unchanged save does not. The history view shows the stored questions, order,
required flags, activity and administrator name for each published version.
Phone history uses a list and a separate detail view; wider screens show both.

Deployment requires the matching API, its Prisma-generated schema migration
`20261029080000_add_checklist_template_versions` and the separate Prisma Client
backfill (`npm run checklist:versions:backfill -- --apply`). The operator must
stop the old API while applying both steps and replacing it, so no old process
can publish between baseline capture and cutover. Follow
`docs/admin-checklist-templates.md` in retreat-api, verify history on the new API,
then deploy the frontend. Neither database step was executed during implementation.

The backfill captures only each existing template's current configuration as
`BASELINE`, using its known last-save time and no invented publisher. Versions
before that baseline are unavailable in template history. Existing submission
snapshots still retain their original questions. Old history cannot be restored
or edited through this screen.

After migration and backfill on a disposable/staging database, verify with authorized records:

- Start one persisted draft for each type. Save an answer, and attach a photo to
  an applicable abnormal item. Record the displayed checklist version.
- Publish a new version that renames/removes an old question, changes order and
  adds a required question. The existing drafts must still open, save and submit
  their original questions, required rules, answers and photo associations.
- Start fresh checks: these must use the newly published configuration. Merely
  creating a stay, issuing a QR/link, or opening an entry page must not pin a
  version before the draft is actually started on the server.
- Disable a template: new starts must be blocked; existing drafts may finish
  under their captured configuration subject to normal access and expiry rules.
- Use two administrator tabs to edit the same version. Only one update succeeds;
  the other shows a conflict and requires reloading. No silent overwrite or
  duplicate publication should occur.
- Read the baseline and a later version, including an inactive retreat. Check
  saved publisher names, Seoul timestamps, required flags and current-version
  badge. Earlier unavailable versions must not be invented.
- On a physical phone/tablet, check the editor keyboard, reorder/delete controls,
  confirmation, footer clearance and list/detail navigation. Verify long Korean
  text and browser zoom. Unsaved work must prompt before leaving or logging out.

Local validation uses intercepted synthetic Chrome fixtures, isolated reader/API
checks and mocked backend tests; it does not certify a live database or deployment.
Widths 320, 399, 760, 907, 1024 and 1440px were checked for overflow and phone save
actions above the footer. Browser coverage includes all-type creation/editing,
no-op saves, validation focus, add/reorder/required flags and retained IDs, version
pagination/baseline, stale responses, scope errors, retry, 401/403 session rejection,
unsaved navigation/logout, conflict and uncertain-save protection. See the API
guide for persistence behavior and cutover boundaries. Database concurrency,
migration acceptance and physical devices remain pending.

## Slice 9 compact calendar and daily agenda — 2026-10-30

Entry: 이용 일정 → 달력. This slice is frontend-only; no API contract, database,
migration or dependency changes are required. Existing date/property filters,
calendar/list switching and stay-detail return context remain in place.

The compact layout applies while the calendar content is narrower than 1000px,
including tablets with a sidebar. Date cells show the date and a positive unique
stay count; the selected-day agenda follows the month. With at least 1000px of
calendar content, property bars and the daily agenda appear side by side.

Manual acceptance checklist:

- At phone, tablet and desktop widths, select dates with no schedules, one stay
  and several stays. Confirm readable day/count cells, distinct today/selection
  indicators, no page-wide horizontal overflow and actions clear of the footer.
- On a busy day, confirm arrival/departure rows follow their planned Seoul times,
  not the original check-in order. At equal times, departure precedes arrival.
  A midnight checkout displays 00:00 and belongs to its checkout date.
- A same-day stay contributes one to the daily schedule count and produces two
  timed events. A stay spanning several days appears in the separate continuing
  group on interior days, including across month and year boundaries.
- Check submitted, missing and review-needed checklist examples. Open the
  collapsed details and confirm both checklist states and review reasons remain
  available. Planned events must not imply actual arrival, departure or occupancy.
- Check long retreat/guest names and an inactive retreat. On wide screens,
  overflow must open the complete day's agenda; an empty week must not reserve
  unused bar lanes. Open a property bar or agenda row and return to the selected
  date/property context. Confirm the calendar/list view switch still works.
- Change only the selected day within a loaded month: no calendar fetch is needed.
  Change month/property or refresh: hide stale results during loading. A failed
  request must show retry rather than zero schedules; verify retry and a genuinely
  empty result separately. Confirm expired-session handling remains intact.

Local evidence: 18 isolated source-model, mocked API and server-rendered component
scenarios passed. Coverage includes calendar boundaries, same-day and midnight
events, continuing stays, chronological/tie ordering, unique counts, non-mutating
agenda construction, complete multi-page loading, inconsistent-page rejection,
overflow accounting, retained links, API-derived checklist labels, escaped text,
accessible date counts and distinct loading/error/empty states. These checks used
synthetic data and temporary files outside the repository; no test files were
added. Typecheck, lint, production build and diff checks passed; the existing
bundle-size warning remains. The build used HTTPS placeholder origins and was
not deployed.

Local in-app-browser checks with a separate synthetic API passed at widths 320,
399, 760, 907, 1024 and 1440px: no page-wide horizontal overflow, no overlap between
row links and expansion controls, readable long names, chronological rows,
same-day counts, midnight time, continuing/inactive retreats, empty days,
Today/month navigation, property filtering, checklist expansion, stay-detail
navigation and return context. Error/loading states hid stale days and agenda;
retry recovered and a genuine empty response showed zero schedules separately.
Phone, tablet and PC screenshots were reviewed. Model/SSR checks cover the other
edge cases above; this was not live API or physical-device acceptance. No database,
commit, push or deployment was performed.

## Slice 10 compact guest guide and section template — 2026-10-30

Entry: 휴양소 관리 → 휴양소 → 이용 안내 관리. Guest property QR and personal
stay links both use 이용 안내. This is frontend-only, with no API contract,
database, migration, dependency or authentication changes.

Manual acceptance checklist:

- Open an existing plain-text guide. It must keep its complete text and line
  breaks until 구분별 템플릿 사용 is explicitly selected. Conversion keeps the
  original body in 기타 안내; switching back preserves populated titles/content.
- Fill the seven optional sections. 꼭 확인해 주세요 stays visible to guests;
  other populated sections open independently and empty sections are omitted.
  An entirely empty template must not pass validation. The 20,000-character
  limit includes the stored section headings and escaping.
- Compare the live preview with the guest guide. Both use the same content
  renderer, including line breaks, literal HTML/URLs, and expanded sections.
  The narrow editor's 미리보기 / 내용 편집으로 돌아가기 controls must move focus
  to the correct panel without submitting or losing text.
- Save through the existing publication review. The next guest refresh must
  show the updated guide. Confirm unsaved navigation can be cancelled and a
  version conflict retains typed content instead of overwriting the newer guide.
- Guest property QR access must not show a personal schedule. A valid personal
  link shows planned Seoul arrival/departure dates and times, labelled 예정.
  Only the configured public manager number is callable; missing numbers have
  a noninteractive fallback. Contact remains available when no guide is published.
- Check expired/invalid access, missing/unpublished guides, and failed requests
  separately. Failed requests must show retry, not an empty guide, and invalid
  access must not reveal guide content, phone numbers or personal times.
- At phone, tablet and desktop widths, check long names/text, readable section
  rows, keyboard expansion, visible focus and content clearance above the footer.

Local evidence: 17 temporary isolated model/API/SSR scenarios passed, including
strict format fallback, legacy preservation, Unicode/escaping limits, empty-body
rejection, save receipts, QR/personal route separation, escaped rendering, matching
preview markup, and missing/unpublished guides. No repository test files were
added. Typecheck, lint, production build and git diff --check passed; the existing
bundle-size warning remains. The build used HTTPS placeholder origins.

The actual frontend was also exercised in the in-app browser against a separate,
temporary synthetic API. Admin and guest widths 320, 399, 760, 907, 1024 and
1440px had no page-wide horizontal overflow. Reviewed phone, tablet and desktop
screenshots; checked live editing/preview, save and guest refresh, original text
retention, empty-template validation focus, unsaved-navigation cancellation,
conflict retention, missing contact/guide, error/retry, expired personal access,
long labels, keyboard expansion and footer clearance. These checks used fictional
data only. Real API persistence, deployed behavior and physical-device acceptance
remain pending. No database, commit, push or deployment action was performed.

### Guide editor wording/layout follow-up — 2026-10-30

The editor now places saved status/version beside the title and groups title,
content and a native public-visibility switch in one compact form. Permanent
explanatory paragraphs are removed; counters, errors, inactive-property warnings
and a brief post-conversion preservation notice remain. The Save label is shorter
but still opens the existing explicit publication confirmation; its impact,
single-copy/no-history and no-notification warnings are unchanged.

At editor content widths of 900px or less, the preview is hidden from layout and
keyboard navigation until requested. Opening focuses the preview; close, return
and Escape restore editor focus, falling back to the preview trigger when the
legacy input is disabled during review. Wide layouts show the preview beside the
form. A focused preview stays visible when the window narrows.

Local follow-up checks: TypeScript, lint, production build, formatting and diff
checks passed, with the existing bundle-size warning. The 17 existing temporary
model/API/SSR scenarios passed after updating copy expectations. Synthetic browser
checks at 320/399/760/907/1024/1440px found no page-wide horizontal overflow and
confirmed narrow/wide preview visibility. Checked unsaved text/visibility in the
preview, return/Escape focus (including disabled legacy input during review),
public/private impact confirmation, explicit synthetic save and receipt, legacy
conversion retention, empty-template validation focus and focused-preview resize.
The compact 399px form and Save action fit above the fixed mobile menu. Screenshots
use fictional local data. No live API, physical-device, database, deployment or
Git write operations were performed.

## Slice 11 — QR and personal-link recovery — 2026-10-30

Implemented compact property purpose rows with a single QR preview panel, plus a
personal-link panel with planned stay times, local QR PNG, copy/manual selection,
hidden address and scoped open action. Reopen uses a read endpoint. Issuance,
replacement and revocation remain separate confirmed writes. Legacy credentials
are neither silently replaced nor falsely advertised as recoverable.

Local verification used actual frontend source and a separate synthetic API,
not the real database. Widths 320, 399, 760, 907, 1024 and 1440px had no horizontal
overflow for either open panel. Reviewed phone/tablet/desktop screenshots, long
retreat names at 320px, footer clearance, guest/staff switching and keyboard focus.
Checked refresh then same-link reopening, close/reopen, collapsed address/manual
selection, replacement confirmation/cancel, legacy states, inactive property,
expired personal link, retrieval failure/retry and absence of automatic POSTs.
Property and personal PNGs generated by the actual UI were decoded with macOS
Vision and matched their exact intended fictional URLs. Download anchors include
PNG filenames and safe open links use noopener/noreferrer.

Frontend typecheck, lint, production build and diff checks passed. Existing bundle
size warning remains. Temporary probes passed 43 property QR and 38 personal-link
reader/hook checks, including unsafe URLs, scope/revision/timestamp mismatch,
late/duplicate responses, uncertain writes, aborts, auth failures and old API
one-time receipt compatibility. No new repository test files were created.

Copy-success UI feedback and manual selection were observed. The browser harness
did not expose a completed native download event or clipboard contents, so native
clipboard transfer and the OS download destination remain manual device checks.
The PNG bytes themselves were independently verified. Physical phones/tablets,
camera scanning, actual PostgreSQL migration/concurrency, live persistence and
deployed access were not tested. This is not production acceptance.

Before live acceptance, apply the API's Prisma-generated
`20261030050000_add_recoverable_access_links` migration and configure its separate
encryption keyring, then update API before frontend. No database operations,
commits, pushes, deployments or infrastructure changes were performed here.

### Admin back arrows, submission rows and QR tabs — 2026-10-30

Inner admin page titles now include a shared back arrow. Main 운영/일정/이상사항/
더보기 destinations and the drawer close action stay unchanged. Accepted in-app
visits are held only in the current admin session; same-path filter changes do
not become extra Back steps. Direct entry has a parent fallback. Existing editor,
QR receipt and mutation-screen guarded return callbacks remain in place.

Submission rows emphasize type and property with compact date/author information;
이상 응답 remains an abnormal-answer count. QR purpose selection is now a two-tab
workspace with one panel, concise legacy guidance, explicit recovery actions and
separately confirmed replacement.

Follow-up checks used actual frontend source with fictional API responses only:

- QR/submission layouts at 320, 399, 760, 907, 1024 and 1440px had no horizontal
  overflow.
- QR tabs supported manual keyboard activation and retained the selected panel.
- Copying a QR link produced the exact intended fictional URL in the browser
  clipboard. This supersedes the earlier harness-only clipboard limitation for
  this local browser run, not physical-device acceptance.
- A known pre-write ACCESS_LINK_ISSUANCE_UNAVAILABLE response preserved the old
  receipt and did not leave issuance locked. A generic 503 retained uncertain-write
  messaging and blocked another write until reconciliation.
- Submission detail returned to the original filtered list query; the list's
  back arrow then returned to its known dashboard origin.
- A 20-row list restored its stable 836px scroll position after opening a detail
  and returning. Temporary provider probes also passed 15 delayed-content and
  cleanup assertions, alongside 17 pure history-model assertions.
- The property editor's arrow opened its existing discard confirmation. Cancelling
  retained the edited value and restored focus to the arrow. A clean return worked.
  Leaving an uncertain QR result still invoked the global navigation guard;
  cancelling kept the QR screen and refreshing reconciled the status.
- Long retreat names at 320px retained the type badge, date, author and abnormal
  response indicator without horizontal overflow.
- Typecheck, lint, production build with placeholder HTTPS origins, formatting
  and diff checks passed. The existing bundle-size warning remains.

The native download event timed out in the browser harness. PNG href/filename
were inspected, but OS download completion/location remain manual checks.
Physical phones/tablets, real PostgreSQL, live authentication/persistence and
deployment were not exercised. No database operations, account creation, commits,
pushes, deployments or environment changes were performed for this follow-up.

### QR list and responsive panel follow-up — 2026-10-30

The compact 이용객/직원 list and modal panel supersede the QR tabs described above.
The panel is a right drawer above 600px and a bottom sheet at 600px and below, with
a 320ms entrance, backdrop fade and reduced-motion CSS. Existing hooks, legacy QR
rules, replacement confirmation and uncertain-write recovery remain in place.

Checks used actual frontend source with a fictional API only:

- Both QR flows opened. Copy produced the exact fictional URL; the PNG download
  filename was checked.
- Inactive QR panels blocked receipt opening. Active legacy QR panels explained
  the existing-code limitation without offering reopening.
- Normal X and Escape closure restored focus to the originating row. Closing a
  read delayed by 2500ms aborted the request, removed the modal and restored row
  focus after the loading state settled. Desktop backdrop dismissal also restored
  row focus and unlocked page scrolling.
- Retrieval/status error recovery remained inside the panel. Cancelling replacement
  confirmation returned focus to its review button. A generic 503 blocked another
  write until the latest-status refresh reconciled the result.
- Both Keep and Proceed actions worked in the one-time receipt close warning.
- List rows and open panels had no horizontal overflow at 320, 399, 760, 907, 1024
  and 1440px, including long names. The panel body scrolled at 320 × 568px.
- Native modal background inertness was observed. Keyboard focus wrapping and
  global browser Back were not verified in this run; the fixture had no prior
  browser-history entry.
- Typecheck, lint, production build and diff checks passed. The existing bundle-size
  warning remains.

This follow-up does not fix or extend receipt lifetime. Physical-device behavior,
native OS download completion and production behavior remain manual checks. No
database operations, account creation, commits, pushes or deployments were
performed for this follow-up.
