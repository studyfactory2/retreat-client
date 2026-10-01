import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import type { AdminSubmissionDetail } from '../../../../features/admin-submissions/admin-submissions.types';
import type {
  SubmissionStayCandidate,
  SubmissionStayLinkDto,
} from '../../../../features/admin-submissions/admin-submission-stays.types';
import { useSubmissionStayCandidates } from '../hooks/use-submission-stay-candidates';
import { useSubmissionStaySave } from '../hooks/use-submission-stay-save';
import {
  canReviewSubmissionStay,
  submissionStayRestriction,
} from '../model/submission-stay-model';
import { SubmissionStayLinkEditor } from './SubmissionStayLinkEditor';
import '../styles/submission-stay-link.css';

export type SubmissionLinkEditState = { dirty: boolean; busy: boolean };

export function SubmissionStayLink({
  detail,
  token,
  rejectSession,
  onSaved,
  onRefresh,
  onEditStateChange,
  onOpenStay,
}: {
  detail: AdminSubmissionDetail;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (receipt: SubmissionStayLinkDto) => void;
  onRefresh: () => void;
  onEditStateChange: (state: SubmissionLinkEditState) => void;
  onOpenStay?: () => void;
}) {
  const [mode, setMode] = useState<'select' | 'unlink' | null>(null);
  const [selected, setSelected] = useState<SubmissionStayCandidate>();
  const [reason, setReason] = useState('');
  const [validation, setValidation] = useState<string>();
  const reasonInput = useRef<HTMLTextAreaElement>(null);
  const record = detail.revision.record;
  const eligible = canReviewSubmissionStay(detail);
  const candidates = useSubmissionStayCandidates(
    detail,
    eligible && mode === 'select',
    token,
    rejectSession,
  );
  const mutation = useSubmissionStaySave(token, rejectSession);
  const candidateBlocked =
    candidates.resource.status === 'error' && candidates.resource.blocked;
  const blocked = !!mutation.state.blocked || candidateBlocked;
  const busy = mutation.state.busy;
  const dirty = !!selected || reason.length > 0 || mode === 'unlink';
  useEffect(() => {
    onEditStateChange({ dirty, busy });
    return () => onEditStateChange({ dirty: false, busy: false });
  }, [dirty, busy, onEditStateChange]);

  function closeEditor() {
    setMode(null);
    setSelected(undefined);
    setReason('');
    setValidation(undefined);
  }
  function save() {
    if (busy || blocked || !eligible || mode === null) return;
    if (
      mode === 'select' &&
      (!selected ||
        selected.alreadyLinked ||
        selected.currentRevision > 2_147_483_646 ||
        candidates.resource.status !== 'ready' ||
        !candidates.resource.data.items.some(
          (item) =>
            item.id === selected.id &&
            item.currentRevision === selected.currentRevision,
        ))
    ) {
      setValidation('이용객 정보를 비교한 뒤 연결할 일정을 선택해 주세요.');
      return;
    }
    if (!reason.trim() || [...reason.trim()].length > 1000) {
      setValidation('변경 사유를 1자 이상 1000자 이하로 입력해 주세요.');
      reasonInput.current?.focus();
      return;
    }
    setValidation(undefined);
    const common = {
      expectedRevision: detail.currentRevision,
      reason: reason.trim(),
    };
    void mutation.save(
      detail.id,
      mode === 'unlink'
        ? { ...common, stayId: null }
        : {
            ...common,
            stayId: selected!.id,
            expectedStayRevision: selected!.currentRevision,
          },
      onSaved,
    );
  }
  return (
    <section
      className="submission-detail-card submission-stay-link"
      aria-labelledby="submission-stay-title"
    >
      <div className="submission-detail-section-heading">
        <div>
          <p className="submission-detail-eyebrow">이용 일정 연결</p>
          <h2 id="submission-stay-title">체크리스트와 일정 확인</h2>
        </div>
        <span className="submission-detail-badge">
          {record.stayId ? '연결됨' : '연결되지 않음'}
        </span>
      </div>
      <p className="submission-stay-intro">
        작성자가 남긴 정보와 이용 일정을 비교해 연결하세요. 답변과 사진은 그대로
        보존되며, 연결 변경 사유는 이력에 남습니다.
      </p>
      {record.stayId && (
        <p>
          <Link
            to={`/admin/stays/${record.stayId}?view=list`}
            onClick={(event) => {
              if (
                onOpenStay &&
                event.button === 0 &&
                !event.metaKey &&
                !event.ctrlKey &&
                !event.shiftKey &&
                !event.altKey
              ) {
                event.preventDefault();
                onOpenStay();
              }
            }}
          >
            현재 연결된 이용 일정 보기 →
          </Link>
        </p>
      )}
      {!eligible ? (
        <p className="submission-detail-caption">
          {submissionStayRestriction(detail)}
        </p>
      ) : (
        <SubmissionStayLinkEditor
          record={record}
          mode={mode}
          onModeChange={(nextMode) => {
            if (nextMode === 'select' && mode !== 'select')
              candidates.refresh();
            if (nextMode !== mode || nextMode === 'unlink')
              setSelected(undefined);
            setMode(nextMode);
            setValidation(undefined);
          }}
          selected={selected}
          onSelect={(candidate) => {
            setSelected(candidate);
            setValidation(undefined);
          }}
          reason={reason}
          reasonInput={reasonInput}
          onReasonChange={(value) => {
            setReason(value);
            setValidation(undefined);
          }}
          validation={validation}
          candidates={candidates}
          busy={busy}
          blocked={blocked}
          mutationMessage={mutation.state.message}
          dirty={dirty}
          onSave={save}
          onClose={closeEditor}
          onRefresh={onRefresh}
        />
      )}
      <p className="submission-detail-caption">
        이 연결은 체크리스트와 이용 일정의 관계를 기록하며, 실제 입실·퇴실
        여부를 확정하지 않습니다.
      </p>
    </section>
  );
}
