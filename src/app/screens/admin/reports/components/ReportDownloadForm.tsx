import { useId, useRef } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { ReportFormValues, validateReportForm } from '../model/report-form-model';

export function ReportDownloadForm({
  values, errors, properties, propertiesReady, busy, onChange, onMonth, onSubmit,
}: {
  values: ReportFormValues;
  errors: ReturnType<typeof validateReportForm>;
  properties: AdminPropertyOption[];
  propertiesReady: boolean;
  busy: boolean;
  onChange: (field: keyof ReportFormValues, value: string) => void;
  onMonth: (offset: 0 | -1) => void;
  onSubmit: () => void;
}) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  return (
    <form ref={form} className="reports-form" noValidate onSubmit={(event) => {
      event.preventDefault();
      onSubmit();
      requestAnimationFrame(() => {
        form.current?.querySelector<HTMLElement>('[aria-invalid="true"]')?.focus();
      });
    }}>
      <div className="reports-presets" aria-label="기간 빠른 선택">
        <Button className="admin-button-secondary" disabled={busy} onClick={() => onMonth(0)}>
          이번 달
        </Button>
        <Button className="admin-button-secondary" disabled={busy} onClick={() => onMonth(-1)}>
          지난달
        </Button>
      </div>
      <div className="reports-fields">
        {(['from', 'to'] as const).map((field) => (
          <div className="reports-field" key={field}>
            <label htmlFor={`${id}-${field}`}>{field === 'from' ? '시작일' : '종료일'}</label>
            <input
              id={`${id}-${field}`}
              name={field}
              type="date"
              min="1900-01-01"
              max="2100-12-31"
              required
              value={values[field]}
              disabled={busy}
              aria-invalid={!!errors[field] || undefined}
              aria-describedby={`${id}-date-hint${errors[field] ? ` ${id}-${field}-error` : ''}`}
              onChange={(event) => onChange(field, event.target.value)}
            />
            {errors[field] && <p className="reports-field__error" id={`${id}-${field}-error`}>{errors[field]}</p>}
          </div>
        ))}
        <div className="reports-field reports-field--property">
          <label htmlFor={`${id}-property`}>휴양소</label>
          <select
              id={`${id}-property`}
              name="propertyId"
              value={values.propertyId}
              disabled={busy || !propertiesReady}
              aria-invalid={!!errors.propertyId || undefined}
              aria-describedby={`${id}-property-hint${errors.propertyId ? ` ${id}-property-error` : ''}`}
              onChange={(event) => onChange('propertyId', event.target.value)}
          >
            <option value="">전체 휴양소</option>
            {values.propertyId && !properties.some((item) => item.id === values.propertyId) && (
              <option value={values.propertyId}>선택한 휴양소 · 목록 확인 필요</option>
            )}
            {properties.map((property) => (
              <option key={property.id} value={property.id}>
                {property.name}{property.isActive ? '' : ' (비활성)'}
              </option>
            ))}
          </select>
          {errors.propertyId && <p className="reports-field__error" id={`${id}-property-error`}>{errors.propertyId}</p>}
        </div>
      </div>
      <div className="reports-form__hints">
        <p id={`${id}-date-hint`}>한국 시간 기준 · 시작일과 종료일을 포함해 최대 62일까지 선택할 수 있습니다.</p>
        <p id={`${id}-property-hint`}>전체 휴양소에는 비활성 휴양소의 기록도 포함됩니다.</p>
      </div>
      <div className="reports-form__footer">
        <p>3개 시트 합계 최대 5,000건 · 파일 최대 16 MiB<br />초과하면 기간이나 휴양소 범위를 줄여 주세요.</p>
        <Button type="submit" loading={busy} disabled={!propertiesReady}>
          {busy ? '엑셀 생성 중…' : '엑셀 다운로드'}
        </Button>
      </div>
    </form>
  );
}
