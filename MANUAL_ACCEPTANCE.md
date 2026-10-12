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

## Known boundaries

- Admin page-local exit checks are not universal sidebar/brand/logout or SPA
  Back/Forward guards. Save edits and copy one-time links before those exits.
- Physical QR/camera/clipboard behavior, real JWT/PostgreSQL/S3, browser history
  dialogs and native date inputs require the live checks above.
- Deployment, production origins/TLS, backups and server operations are handled
  separately by the project owner. This walkthrough does not certify deployment.
