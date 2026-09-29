import type {
  SubmissionStayCandidate,
  SubmissionStayCandidatesDto,
} from '../../../../features/admin-submissions/admin-submission-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { submissionTime } from '../model/submission-detail-model';

export function SubmissionStayCandidates({
  data,
  selectedId,
  currentStayId,
  disabled,
  onSelect,
  onPage,
}: {
  data: SubmissionStayCandidatesDto;
  selectedId?: string;
  currentStayId: string | null;
  disabled: boolean;
  onSelect: (candidate: SubmissionStayCandidate) => void;
  onPage: (page: number) => void;
}) {
  return (
    <div className="submission-stay-candidates">
      <fieldset disabled={disabled}>
        <legend>연결할 이용 일정 선택 · {data.total}건</legend>
        {data.items.length === 0 ? (
          <p className="submission-detail-notice">
            {data.total > 0
              ? '조회 중 일정 목록이 변경되었습니다. 이전 페이지에서 다시 확인해 주세요.'
              : '연결 가능한 일정이 없습니다. 같은 휴양소의 활성 일정 중 방문일과 입실일 또는 퇴실일이 일치하는 일정만 표시됩니다. 기록의 방문일이 잘못되었다면 연결하지 말고 별도로 확인해 주세요.'}
          </p>
        ) : (
          <div className="submission-stay-candidate-grid">
            {data.items.map((candidate) => (
              <label
                key={candidate.id}
                className={`submission-stay-candidate${selectedId === candidate.id ? ' is-selected' : ''}${candidate.alreadyLinked || candidate.currentRevision > 2_147_483_646 ? ' is-unavailable' : ''}`}
              >
                <div className="submission-stay-candidate-heading">
                  <input
                    type="radio"
                    name="submission-stay-candidate"
                    checked={selectedId === candidate.id}
                    disabled={
                      candidate.alreadyLinked ||
                      candidate.currentRevision > 2_147_483_646
                    }
                    onChange={() => onSelect(candidate)}
                  />
                  <strong>{candidate.guestName}</strong>
                  {currentStayId === candidate.id && (
                    <span className="submission-detail-badge">현재 연결</span>
                  )}
                </div>
                <dl>
                  <div>
                    <dt>회사 / 부서</dt>
                    <dd>
                      {candidate.company || '미입력'} /{' '}
                      {candidate.department || '미입력'}
                    </dd>
                  </div>
                  <div>
                    <dt>연락처</dt>
                    <dd>{candidate.phone || '미입력'}</dd>
                  </div>
                  <div>
                    <dt>입실 예정</dt>
                    <dd>{submissionTime(candidate.checkInAt)}</dd>
                  </div>
                  <div>
                    <dt>퇴실 예정</dt>
                    <dd>{submissionTime(candidate.checkOutAt)}</dd>
                  </div>
                </dl>
                {candidate.alreadyLinked && (
                  <p className="submission-stay-unavailable">
                    같은 유형의 다른 제출 기록이 연결되어 있어 선택할 수
                    없습니다.
                  </p>
                )}
                {candidate.currentRevision > 2_147_483_646 && (
                  <p className="submission-stay-unavailable">
                    이 일정은 변경 가능한 버전 한도에 도달하여 연결할 수
                    없습니다.
                  </p>
                )}
              </label>
            ))}
          </div>
        )}
      </fieldset>
      {data.totalPages > 1 && (
        <nav
          className="submission-detail-pagination"
          aria-label="연결 후보 페이지"
        >
          <Button
            className="admin-button-secondary"
            disabled={disabled || data.page <= 1}
            onClick={() => onPage(data.page - 1)}
          >
            이전 후보
          </Button>
          <span aria-current="page">
            {data.page} / {data.totalPages}
          </span>
          <Button
            className="admin-button-secondary"
            disabled={disabled || data.page >= data.totalPages}
            onClick={() => onPage(data.page + 1)}
          >
            다음 후보
          </Button>
        </nav>
      )}
    </div>
  );
}
