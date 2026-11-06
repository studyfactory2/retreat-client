import { useEffect, useRef, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { taskTime } from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import { staffHomePath } from '../../../../features/staff-entry/staff-home-return';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { formatStaffDraftTime } from '../model/staff-draft-display';
import '../styles/staff-draft-pause.css';

interface StaffDraftPauseProps {
  heading: RefObject<HTMLHeadingElement | null>;
  draft: StaffDraftDto;
  token: string;
  saved: boolean;
  linkDisabled: boolean;
  hasPhotoSelections: boolean;
  onResume: () => void;
}

export function StaffDraftPause({
  heading,
  draft,
  token,
  saved,
  linkDisabled,
  hasPhotoSelections,
  onResume,
}: StaffDraftPauseProps) {
  const navigate = useNavigate();
  const [returnExpired, setReturnExpired] = useState(false);
  const [confirmLeaving, setConfirmLeaving] = useState(false);
  const confirmationHeading = useRef<HTMLHeadingElement>(null);
  const homeButton = useRef<HTMLButtonElement | null>(null);
  const { copy, copied, message, busy } = useStaffDraftLink(
    token,
    draft.expiresAt,
    linkDisabled,
  );
  const task = draft.cleaningTask;
  const canReturn =
    !returnExpired &&
    Boolean(staffHomePath(draft.id, draft.property.id, token));
  const offerCopy = !task || !canReturn;
  const needsCopyConfirmation = !task && canReturn && !copied;
  const showConfirmation = needsCopyConfirmation && confirmLeaving;
  useEffect(() => {
    if (showConfirmation) confirmationHeading.current?.focus();
  }, [showConfirmation]);

  function returnToTasks() {
    const path = staffHomePath(draft.id, draft.property.id, token);
    if (path) void navigate(path);
    else setReturnExpired(true);
  }

  return (
    <section className="staff-pause" aria-labelledby="staff-pause-title">
      <header className="staff-pause-property">
        <div>
          {draft.property.region && <span>{draft.property.region}</span>}
          <strong>{draft.property.name}</strong>
        </div>
        <span>
          작성자 <b>{draft.author.name}</b>
        </span>
      </header>
      <div className="staff-pause-receipt">
        <div>
          <span className="staff-pause-mark" aria-hidden="true">
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.8"
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M10 8v8m4-8v8" />
            </svg>
          </span>
          <h1 id="staff-pause-title" ref={heading} tabIndex={-1}>
            {saved ? '임시 저장했어요' : '저장 상태를 확인해 주세요'}
          </h1>
          <p className="staff-pause-summary">
            {task && canReturn
              ? '작업 목록에서 다시 이어서 작성할 수 있어요.'
              : task
                ? '개인 링크 또는 직원 QR의 작업 목록에서 이어서 작성할 수 있어요. 링크는 나만 보관해 주세요.'
                : '이 기록은 개인 링크로만 다시 열 수 있어요. 링크를 복사해 나만 보관해 주세요.'}
          </p>
          <div className="staff-pause-record">
            <div>
              <strong>{task?.title ?? '추가 정비 기록'}</strong>
              <time dateTime={task?.dueAt ?? draft.visitDate}>
                {task
                  ? taskTime(task.dueAt)
                  : draft.visitDate.replaceAll('-', '.')}
              </time>
            </div>
            <span className="staff-flow-state">작성 중</span>
          </div>
          {hasPhotoSelections && (
            <p className="staff-pause-note">
              다시 열면 사진 종류와 위치를 다시 선택해 주세요.
            </p>
          )}
        </div>
        <div className="staff-pause-actions">
          {offerCopy && (
            <>
              <p className="staff-pause-expiry">
                <strong>개인 링크 사용 기한</strong>
                {formatStaffDraftTime(draft.expiresAt)}까지 · 한국 시간
              </p>
              <Button
                loading={busy}
                disabled={linkDisabled}
                onClick={() => void copy()}
              >
                이어쓰기 링크 복사
              </Button>
              <span role="status" className="staff-pause-feedback">
                {message}
              </span>
            </>
          )}
          {canReturn ? (
            <Button
              className={offerCopy ? 'staff-pause-secondary' : undefined}
              aria-expanded={
                needsCopyConfirmation ? showConfirmation : undefined
              }
              aria-controls={
                showConfirmation ? 'staff-pause-confirmation' : undefined
              }
              onClick={(event) => {
                if (needsCopyConfirmation) {
                  homeButton.current = event.currentTarget;
                  setConfirmLeaving(true);
                  confirmationHeading.current?.focus();
                } else returnToTasks();
              }}
            >
              작업 목록으로 <span aria-hidden="true">→</span>
            </Button>
          ) : (
            <p className="staff-pause-note">
              작업 목록을 보려면 이 휴양소의 직원 QR을 다시 스캔해 주세요.
            </p>
          )}
          {showConfirmation && (
            <section
              className="staff-pause-confirmation"
              id="staff-pause-confirmation"
              aria-labelledby="staff-pause-confirm-title"
            >
              <h2
                id="staff-pause-confirm-title"
                ref={confirmationHeading}
                tabIndex={-1}
              >
                링크를 보관하셨나요?
              </h2>
              <p className="staff-pause-note">
                이 추가 정비 기록은 개인 링크로만 다시 열 수 있어요.
              </p>
              <div>
                <Button
                  className="staff-pause-secondary"
                  onClick={() => {
                    setConfirmLeaving(false);
                    homeButton.current?.focus();
                  }}
                >
                  머무르기
                </Button>
                <Button onClick={returnToTasks}>보관했어요 · 목록으로</Button>
              </div>
            </section>
          )}
          <button
            type="button"
            className="staff-pause-resume"
            onClick={onResume}
          >
            계속 작성하기
          </button>
        </div>
      </div>
    </section>
  );
}
