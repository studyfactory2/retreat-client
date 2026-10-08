import { Button } from '../../../../shared/ui/Button/Button';
import { GuestManagerContact } from '../../components/GuestManagerContact';

export function GuestIssueUnavailable({
  phone,
  checking,
  contactDisabled,
  hasWork,
  onRetry,
}: {
  phone: string | null;
  checking: boolean;
  contactDisabled: boolean;
  hasWork: boolean;
  onRetry: () => void;
}) {
  return (
    <section
      className="guest-card guest-issue-unavailable"
      aria-labelledby="issue-unavailable-title"
    >
      <h2 id="issue-unavailable-title">지금은 신고를 작성할 수 없어요</h2>
      <p>
        사용할 수 있는 신고 분류가 아직 없습니다. 관리자에게 문의하거나 분류를
        다시 확인해 주세요.
      </p>
      {hasWork && (
        <p className="guest-issue-hint">
          작성한 내용과 사진은 이 창에 유지됩니다. 분류가 준비되면 계속할 수
          있어요. 창을 닫거나 새로고침하면 사라집니다.
        </p>
      )}
      <GuestManagerContact phone={phone} disabled={contactDisabled} />
      <Button disabled={checking} loading={checking} onClick={onRetry}>
        분류 다시 확인
      </Button>
    </section>
  );
}
