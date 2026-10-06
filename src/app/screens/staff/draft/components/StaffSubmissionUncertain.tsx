import { Button } from '../../../../shared/ui/Button/Button';
import type { StaffSubmissionController } from '../hooks/use-staff-submission';

export function StaffSubmissionUncertain({
  submission,
}: {
  submission: StaffSubmissionController;
}) {
  const { state } = submission;
  if (!state.message || state.status === 'submitted') return null;
  const busy = state.status === 'submitting' || state.status === 'checking';
  return (
    <section
      className="staff-draft-card staff-flow-notice"
      aria-live="polite"
      aria-busy={busy}
    >
      <h2>
        {state.status === 'submitting'
          ? '정비 기록을 보내고 있습니다'
          : state.status === 'checking'
            ? '제출 내역을 확인하고 있습니다'
            : state.status === 'uncertain'
              ? '제출 결과를 확인해 주세요'
              : '제출 안내'}
      </h2>
      <p>{state.message}</p>
      {state.status === 'uncertain' && (
        <>
          <p>
            결과가 확인될 때까지 답변과 사진을 변경할 수 없습니다. 화면을 떠나면
            같은 내용으로 다시 확인하는 데 필요한 정보가 사라집니다.
          </p>
          <div className="staff-draft-actions">
            <Button onClick={() => void submission.checkReceipt()}>
              제출 결과 다시 확인
            </Button>
            {state.canRetry && (
              <Button onClick={submission.retrySame}>
                같은 내용으로 제출 재확인
              </Button>
            )}
          </div>
          {state.canRetry && (
            <p className="staff-draft-hint">
              처음 제출할 때 검토한 답변과 사진 연결을 그대로 사용합니다. 같은
              제출이 이미 완료되었다면 기존 제출 내역을 확인합니다.
            </p>
          )}
        </>
      )}
    </section>
  );
}
