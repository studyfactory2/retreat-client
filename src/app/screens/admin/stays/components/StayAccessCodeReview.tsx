import { useEffect, useRef } from 'react';
import type { SaveStayAccessInput } from '../../../../features/admin-stay-access/admin-stay-access.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { stayCodeMethodLabel } from '../model/stay-access-model';

export function StayAccessCodeReview({
  input,
  onCancel,
  onSave,
}: {
  input: SaveStayAccessInput;
  onCancel: () => void;
  onSave: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  const keep = input.action === 'CONFIRM';
  const replacing = input.action === 'REPLACE';
  return (
    <div
      className="stay-access__review"
      role="group"
      aria-label="예약 비밀번호 저장 확인"
    >
      <h3 ref={heading} tabIndex={-1}>
        {keep
          ? '기존 번호를 유지할까요?'
          : replacing
            ? '예약 번호를 변경할까요?'
            : '예약 비밀번호를 준비할까요?'}
      </h3>
      {!keep && (
        <p className="stay-access__review-method">
          {stayCodeMethodLabel[input.method]}
        </p>
      )}
      <p>
        {keep
          ? '변경된 예약 정보를 확인하고 저장된 번호를 그대로 유지합니다.'
          : input.method === 'FIXED'
            ? '휴양소에 등록된 고정 번호를 이 예약에 저장합니다.'
            : input.method === 'PHONE_LAST6'
              ? '현재 예약 연락처의 마지막 6자리를 저장합니다.'
              : '앱이 만든 6자리 번호를 저장합니다. 다시 열어도 번호는 유지됩니다.'}
      </p>
      {replacing && (
        <p className="stay-access__review-warning">
          이미 안내한 번호가 있다면 새 번호로 다시 안내해 주세요.
        </p>
      )}
      <p className="stay-access__review-note">
        저장해도 실제 도어락은 변경되지 않습니다. 안내 메시지도 발송되지
        않습니다.
      </p>
      <div className="stay-access__actions">
        <Button className="admin-button-secondary" onClick={onCancel}>
          돌아가기
        </Button>
        <Button onClick={onSave}>
          {keep
            ? '기존 번호 유지'
            : replacing
              ? '번호 변경 저장'
              : '번호 준비 저장'}
        </Button>
      </div>
    </div>
  );
}
