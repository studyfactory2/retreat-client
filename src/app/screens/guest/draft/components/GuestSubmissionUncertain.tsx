import { Button } from '../../../../shared/ui/Button/Button';

export function GuestSubmissionUncertain({
  message,
  checking,
  canRetry,
  onCheck,
  onRetry,
}: {
  message: string;
  checking: boolean;
  canRetry: boolean;
  onCheck: () => void;
  onRetry: () => void;
}) {
  return (
    <section
      className="guest-draft-card guest-submission-uncertain"
      role="alert"
    >
      <h2>제출 결과 확인이 필요합니다</h2>
      <p>{message}</p>
      <p>
        요청한 답변과 사진 연결 정보는 이 화면에 보관 중입니다. 결과를 확인할
        때까지 창을 유지해 주세요. 같은 내용 재전송은 새로운 제출을 만들지
        않도록 처리됩니다.
      </p>
      <div className="guest-submission-actions">
        <Button loading={checking} onClick={onCheck}>
          제출 결과 다시 확인
        </Button>
        <Button
          className="guest-draft-secondary"
          disabled={checking || !canRetry}
          onClick={onRetry}
        >
          같은 내용으로 제출 재확인
        </Button>
      </div>
    </section>
  );
}
