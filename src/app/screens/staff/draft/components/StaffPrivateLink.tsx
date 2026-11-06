import { Button } from '../../../../shared/ui/Button/Button';
import type { useStaffDraftLink } from '../hooks/use-staff-draft-link';
import { formatStaffDraftTime } from '../model/staff-draft-display';
import '../styles/staff-finish.css';

export function StaffPrivateLink({
  link,
  expiresAt,
  label,
  disabled = false,
}: {
  link: ReturnType<typeof useStaffDraftLink>;
  expiresAt: string;
  label: string;
  disabled?: boolean;
}) {
  return (
    <div className="staff-private-link">
      <p>개인 링크는 본인만 보관해 주세요.</p>
      <p>사용 기한 · {formatStaffDraftTime(expiresAt)} (한국 시간)</p>
      <Button
        disabled={disabled}
        loading={link.busy}
        onClick={() => void link.copy()}
      >
        {label}
      </Button>
      {link.manualUrl && (
        <label>
          아래 주소를 선택해 직접 복사해 주세요.
          <input
            readOnly
            aria-label="복사할 개인 링크"
            value={link.manualUrl}
            onFocus={(event) => event.currentTarget.select()}
          />
        </label>
      )}
      {link.message && <p role="status">{link.message}</p>}
    </div>
  );
}
