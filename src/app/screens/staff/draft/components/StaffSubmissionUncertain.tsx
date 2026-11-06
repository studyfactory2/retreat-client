import { Button } from '../../../../shared/ui/Button/Button';
import type { StaffSubmissionController } from '../hooks/use-staff-submission';
import '../styles/staff-finish.css';

export function StaffSubmissionUncertain({
  submission,
}: {
  submission: StaffSubmissionController;
}) {
  const { state } = submission;
  if (!state.message || state.status === 'submitted') return null;
  const busy = state.status === 'submitting' || state.status === 'checking';
  return (
    <section className="staff-submit-feedback" role="status" aria-busy={busy}>
      {busy ? (
        <p>{state.message}</p>
      ) : (
        <>
          <h2>
            {state.status === 'uncertain' ? '제출 결과 확인 필요' : '제출 안내'}
          </h2>
          <p>{state.message}</p>
          {state.status === 'uncertain' && (
            <>
              <p>
                이 화면에서 결과를 확인해야 같은 요청으로 다시 시도할 수 있어요.
              </p>
              <div className="staff-submit-feedback-actions">
                <Button onClick={() => void submission.checkReceipt()}>
                  제출 결과 다시 확인
                </Button>
                {state.canRetry && (
                  <Button
                    className="staff-finish-secondary"
                    onClick={submission.retrySame}
                  >
                    같은 내용으로 다시 제출
                  </Button>
                )}
              </div>
            </>
          )}
        </>
      )}
    </section>
  );
}
