import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { formatStaffDraftTime } from '../model/staff-draft-display';

export function StaffDraftLink({
  token,
  expiresAt,
  disabled,
}: {
  token: string;
  expiresAt: string;
  disabled: boolean;
}) {
  const { copy, message, busy } = useStaffDraftLink(token, expiresAt, disabled);
  return (
    <section
      className="staff-draft-card staff-draft-link"
      aria-labelledby="staff-link-heading"
    >
      <h2 id="staff-link-heading">나중에 이어서 하려면</h2>
      <p>
        아래 링크를 복사해 보관해 주세요. 공용 QR로는 이 기록을 다시 열 수
        없어요.
      </p>
      <p>나만 사용하는 링크예요. 다른 사람에게 공유하지 마세요.</p>
      <Button
        disabled={disabled || busy}
        onClick={() => {
          void copy();
        }}
      >
        이어쓰기 링크 복사
      </Button>
      <p className="staff-draft-hint">
        {formatStaffDraftTime(expiresAt)}까지 사용 가능 · 한국 시간
      </p>
      <p aria-live="polite">{message}</p>
    </section>
  );
}
