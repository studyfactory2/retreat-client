import { useEffect, useRef } from 'react';
import type { AdminPropertyAccessDto } from '../../../../features/admin-property-access/admin-property-access.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  activeCodeFields,
  codeLabels,
  type AccessFormValues,
} from '../model/property-access-model';

export function AccessSettingsReview({
  data,
  values,
  busy,
  blocked,
  onBack,
  onSave,
}: {
  data: AdminPropertyAccessDto;
  values: AccessFormValues;
  busy: boolean;
  blocked: boolean;
  onBack: () => void;
  onSave: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    panel.current?.focus();
    panel.current?.scrollIntoView({ block: 'nearest' });
  }, []);
  return (
    <div
      className="access-review"
      tabIndex={-1}
      ref={panel}
      role="alertdialog"
      aria-labelledby="access-review-title"
      aria-describedby="access-review-impact"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && !busy) {
          event.preventDefault();
          onBack();
        }
      }}
    >
      <p className="access-eyebrow">저장 전 확인</p>
      <h2 id="access-review-title">출입 설정을 저장할까요?</h2>
      <dl className="access-review__changes">
        {data.settings.roomMode !== values.roomMode && (
          <div>
            <dt>객실 비밀번호 방식</dt>
            <dd>
              {values.roomMode === 'FIXED' ? '고정 사용' : '이용객마다 변경'}
            </dd>
          </div>
        )}
        {activeCodeFields(values)
          .filter((field) => values.codes[field].action !== 'keep')
          .map((field) => (
            <div key={field}>
              <dt>{codeLabels[field]}</dt>
              <dd>
                {values.codes[field].action === 'clear'
                  ? '삭제'
                  : '새 번호 저장'}
              </dd>
            </div>
          ))}
      </dl>
      <p id="access-review-impact">
        앱의 설정만 저장됩니다. 실제 도어락 비밀번호는 현장에서 변경해 주세요.
      </p>
      <div className="access-actions">
        <Button
          className="admin-button-secondary"
          disabled={busy}
          onClick={onBack}
        >
          계속 수정
        </Button>
        <Button loading={busy} disabled={blocked} onClick={onSave}>
          확인 · 저장
        </Button>
      </div>
    </div>
  );
}
