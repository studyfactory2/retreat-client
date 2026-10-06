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
      <h2 id="staff-link-heading">이어서 작성하려면</h2>
      <p>
        임시 저장 후 개인 작성 링크를 보관해 주세요. 현장 QR을 다시 스캔해도 이
        작성 내용을 찾을 수 없습니다.
      </p>
      <p>
        이 링크를 가진 사람은 접근이 허용되는 동안 내용을 볼 수 있습니다. 다른
        사람에게 공유하지 마세요.
      </p>
      <Button
        disabled={disabled || busy}
        onClick={() => {
          void copy();
        }}
      >
        개인 작성 링크 복사
      </Button>
      <p className="staff-draft-hint">
        사용 기한: {formatStaffDraftTime(expiresAt)} (한국 시간). 저장해도
        기한이 연장되지 않습니다.
      </p>
      <p aria-live="polite">{message}</p>
    </section>
  );
}
