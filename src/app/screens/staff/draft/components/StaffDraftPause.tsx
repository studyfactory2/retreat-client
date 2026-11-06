import { useCallback, useEffect, useState, type RefObject } from 'react';
import { useNavigate } from 'react-router-dom';
import { useNavigationGuard } from '../../../../core/router/navigation/use-navigation-guard';
import { taskTime } from '../../../../features/cleaning-tasks/cleaning-tasks-display';
import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import { staffHomePath } from '../../../../features/staff-entry/staff-home-return';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { StaffPrivateLink } from './StaffPrivateLink';
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
  const link = useStaffDraftLink(token, draft.expiresAt, linkDisabled);
  const task = draft.cleaningTask;
  const canReturn =
    !returnExpired &&
    Boolean(staffHomePath(draft.id, draft.property.id, token));
  const offerCopy = !task || !canReturn;
  const protectLink = !task && !link.copied && !linkDisabled;
  useNavigationGuard(
    useCallback(
      () => (protectLink ? 'private-draft-link' : false),
      [protectLink],
    ),
  );
  useEffect(() => {
    if (!protectLink) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [protectLink]);

  function returnToTasks() {
    const path = staffHomePath(draft.id, draft.property.id, token);
    if (path) void navigate(path);
    else setReturnExpired(true);
  }

  return (
    <section className="staff-outcome" aria-labelledby="staff-pause-title">
      <header className="staff-outcome-heading">
        <span className="staff-outcome-icon" aria-hidden="true">
          Ⅱ
        </span>
        <div>
          <p>{draft.property.name}</p>
          <h1 id="staff-pause-title" ref={heading} tabIndex={-1}>
            {saved ? '임시 저장했어요' : '저장 상태를 확인해 주세요'}
          </h1>
        </div>
      </header>
      <div className="staff-outcome-layout">
        <div className="staff-finish-panel">
          <h2>{task?.title ?? '추가 정비 기록'}</h2>
          <dl className="staff-finish-fields">
            <div>
              <dt>{task ? '작업 일시' : '정비일'}</dt>
              <dd>
                <time dateTime={task?.dueAt ?? draft.visitDate}>
                  {task
                    ? taskTime(task.dueAt)
                    : draft.visitDate.replaceAll('-', '.')}
                </time>
              </dd>
            </div>
            <div>
              <dt>작성자</dt>
              <dd>{draft.author.name}</dd>
            </div>
          </dl>
          {hasPhotoSelections && (
            <p className="staff-outcome-note">
              다시 열면 업로드한 사진의 종류와 위치를 다시 선택해 주세요.
            </p>
          )}
        </div>
        <div className="staff-finish-panel staff-outcome-actions">
          <h2>이어서 작성하기</h2>
          <p>
            {task
              ? '이 휴양소의 직원 QR에서 작업을 다시 열 수 있어요.'
              : '이 기록은 개인 이어쓰기 링크로 다시 열 수 있어요.'}
          </p>
          {offerCopy && (
            <StaffPrivateLink
              link={link}
              expiresAt={draft.expiresAt}
              disabled={linkDisabled}
              label="이어쓰기 링크 복사"
            />
          )}
          {canReturn && (
            <Button
              className={offerCopy ? 'staff-finish-secondary' : undefined}
              onClick={returnToTasks}
            >
              작업 목록으로
            </Button>
          )}
          {!canReturn && !task && (
            <p>작업 목록은 이 휴양소의 직원 QR에서 열어 주세요.</p>
          )}
          <button
            type="button"
            className="staff-outcome-resume"
            onClick={onResume}
          >
            계속 작성하기
          </button>
        </div>
      </div>
    </section>
  );
}
