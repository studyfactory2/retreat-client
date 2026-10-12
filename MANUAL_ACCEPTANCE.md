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
