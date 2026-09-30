import { useEffect, useId, useRef } from 'react';
import type { StayLinkAction } from '../../../../features/admin-stay-links/admin-stay-link.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatStayLinkTimestamp } from '../model/stay-link-model';

export function StayLinkConfirmation({ action, replacing, stay, onCancel, onConfirm }: {
  action: StayLinkAction;
  replacing: boolean;
  stay: AdminStayDto;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const title = useId();
  const description = useId();
  useEffect(() => { panel.current?.focus(); }, []);
  const label = action === 'revoke' ? '폐기' : replacing ? '교체' : '발급';
  return (
    <div className="stay-link__confirmation" role="alertdialog" tabIndex={-1}
      ref={panel} aria-labelledby={title} aria-describedby={description}>
      <h3 id={title}>개인 이용 링크를 {label}할까요?</h3>
      <p><strong>{stay.guestName}</strong> · {stay.property.name}</p>
      <p>{formatStayLinkTimestamp(stay.checkInAt)} ~ {formatStayLinkTimestamp(stay.checkOutAt)}</p>
      <p id={description}>
        {action === 'revoke'
          ? '현재 개인 이용 링크와 이 링크에서 시작한 체크리스트의 이용객 접근이 중지됩니다. 이미 제출한 기록은 관리자 화면에 보존됩니다.'
          : replacing
            ? '이전 개인 이용 링크와 그 링크에서 시작한 체크리스트의 이용객 접근이 중지됩니다. 새 주소를 복사해 이용객에게 다시 전달해 주세요. 이미 제출한 기록은 보존됩니다.'
            : '이 일정의 이용객에게 전달할 개인 링크를 만듭니다. 새 주소는 발급 직후에만 확인할 수 있으므로 바로 복사해 주세요.'}
      </p>
      {action === 'issue' && <p>유효기간은 퇴실 예정 시각부터 7일 후까지입니다.</p>}
      <div className="stay-link__actions">
        <Button className="admin-button-secondary" onClick={onCancel}>돌아가기</Button>
        <Button onClick={onConfirm}>{action === 'revoke' ? '링크 폐기' : replacing ? '이전 링크 무효화하고 교체' : '개인 링크 발급'}</Button>
      </div>
    </div>
  );
}
