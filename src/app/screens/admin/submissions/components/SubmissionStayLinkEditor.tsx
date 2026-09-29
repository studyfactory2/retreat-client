import { useEffect, useRef, useState, type RefObject } from 'react';
import type { AdminSubmissionRecord } from '../../../../features/admin-submissions/admin-submissions.types';
import type { SubmissionStayCandidate } from '../../../../features/admin-submissions/admin-submission-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { useSubmissionStayCandidates } from '../hooks/use-submission-stay-candidates';
import { SubmissionStayCandidates } from './SubmissionStayCandidates';
import { SubmissionStayLinkReview } from './SubmissionStayLinkReview';

export function SubmissionStayLinkEditor({
  record,
  mode,
  onModeChange,
  selected,
  onSelect,
  reason,
  reasonInput,
  onReasonChange,
  validation,
  candidates,
  busy,
  blocked,
  mutationMessage,
  dirty,
  onSave,
  onClose,
  onRefresh,
}: {
  record: AdminSubmissionRecord;
  mode: 'select' | 'unlink' | null;
  onModeChange: (mode: 'select' | 'unlink') => void;
  selected?: SubmissionStayCandidate;
  onSelect: (candidate: SubmissionStayCandidate | undefined) => void;
  reason: string;
  reasonInput: RefObject<HTMLTextAreaElement | null>;
  onReasonChange: (value: string) => void;
  validation?: string;
  candidates: ReturnType<typeof useSubmissionStayCandidates>;
  busy: boolean;
  blocked: boolean;
  mutationMessage?: string;
  dirty: boolean;
  onSave: () => void;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const discardNotice = useRef<HTMLDivElement>(null);
  const editorForm = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (confirmDiscard) discardNotice.current?.focus();
  }, [confirmDiscard]);
  return (
    <>
      <div className="submission-detail-actions">
        <Button
          className={mode === 'select' ? '' : 'admin-button-secondary'}
          disabled={busy || blocked}
          aria-pressed={mode === 'select'}
          onClick={() => {
            onModeChange('select');
            setConfirmDiscard(false);
          }}
        >
          {record.stayId ? '연결 변경 / 다시 확인' : '연결할 일정 찾기'}
        </Button>
        {record.stayId && (
          <Button
            className="admin-button-secondary"
            disabled={busy || blocked}
            aria-pressed={mode === 'unlink'}
            onClick={() => {
              onModeChange('unlink');
              setConfirmDiscard(false);
            }}
          >
            연결 해제
          </Button>
        )}
      </div>
      {mode && (
        <form
          ref={editorForm}
          className="submission-stay-editor"
          noValidate
          aria-label="이용 일정 연결 변경"
          onSubmit={(event) => {
            event.preventDefault();
            onSave();
          }}
        >
          <div className="submission-stay-guest">
            <h3>제출 기록의 이용객</h3>
            <strong>{record.author.name}</strong>
            <p>
              {record.author.company || '회사 미입력'} ·{' '}
              {record.author.department || '부서 미입력'} ·{' '}
              {record.author.phone || '연락처 미입력'}
            </p>
            <p>
              {record.property.name} · 방문일 {record.visitDate} ·{' '}
              {record.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크'}
            </p>
          </div>
          {mode === 'select' && (
            <>
              <p className="submission-detail-caption">
                같은 휴양소와 방문일에 해당하는 활성 일정입니다. 이름이나
                연락처만으로 자동 연결하지 않습니다. 날짜와 이용객 정보를 함께
                확인해 주세요.
              </p>
              {candidates.resource.status === 'loading' ? (
                <p role="status">연결 가능한 일정을 불러오고 있습니다.</p>
              ) : candidates.resource.status === 'error' ? (
                <div className="submission-stay-message" role="alert">
                  <p>{candidates.resource.message}</p>
                  {!candidates.resource.blocked && (
                    <Button
                      className="admin-button-secondary"
                      onClick={() => {
                        onSelect(undefined);
                        candidates.refresh();
                      }}
                    >
                      후보 다시 불러오기
                    </Button>
                  )}
                </div>
              ) : (
                <>
                  <SubmissionStayCandidates
                    data={candidates.resource.data}
                    selectedId={selected?.id}
                    currentStayId={record.stayId}
                    disabled={busy || blocked}
                    onSelect={(candidate) => {
                      onSelect(candidate);
                    }}
                    onPage={(page) => {
                      onSelect(undefined);
                      candidates.setPage(page);
                    }}
                  />
                  <Button
                    className="admin-button-secondary"
                    disabled={busy || blocked}
                    onClick={() => {
                      onSelect(undefined);
                      candidates.refresh();
                    }}
                  >
                    후보 새로고침
                  </Button>
                </>
              )}
            </>
          )}
          <SubmissionStayLinkReview
            mode={mode}
            currentStayId={record.stayId}
            selected={selected}
            reason={reason}
            reasonInput={reasonInput}
            validation={validation}
            disabled={busy || blocked}
            onReasonChange={onReasonChange}
          />
          {mutationMessage && (
            <div className="submission-stay-message" role="alert">
              <p>{mutationMessage}</p>
            </div>
          )}
          {blocked ? (
            <div className="submission-stay-message" role="alert">
              <p>
                현재 기록을 다시 불러와 연결 상태와 이력을 확인해 주세요. 입력한
                사유는 새로 불러오면 초기화됩니다.
              </p>
              <Button onClick={onRefresh}>최신 기록 확인</Button>
            </div>
          ) : (
            <div className="submission-detail-actions">
              <Button
                type="submit"
                loading={busy}
                disabled={
                  mode === 'select' &&
                  (!selected || candidates.resource.status !== 'ready')
                }
              >
                {mode === 'unlink' ? '연결 해제 저장' : '연결 저장'}
              </Button>
              <Button
                className="admin-button-secondary"
                id="submission-stay-close"
                disabled={busy}
                onClick={() => {
                  if (dirty) setConfirmDiscard(true);
                  else onClose();
                }}
              >
                닫기
              </Button>
            </div>
          )}
          {confirmDiscard && (
            <div
              className="submission-stay-message"
              ref={discardNotice}
              tabIndex={-1}
              role="alertdialog"
              aria-labelledby="discard-link-title"
            >
              <p id="discard-link-title">
                입력한 연결 변경 내용을 버리고 닫을까요?
              </p>
              <div className="submission-detail-actions">
                <Button
                  className="admin-button-secondary"
                  onClick={() => {
                    setConfirmDiscard(false);
                    editorForm.current
                      ?.querySelector<HTMLButtonElement>(
                        '#submission-stay-close',
                      )
                      ?.focus();
                  }}
                >
                  계속 작성
                </Button>
                <Button onClick={onClose}>입력 버리고 닫기</Button>
              </div>
            </div>
          )}
        </form>
      )}
    </>
  );
}
