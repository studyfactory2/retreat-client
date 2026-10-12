import { useId, useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { AdminReportErrors } from '../../../../features/admin-reports/admin-reports.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminPropertySelect } from '../../components/AdminPropertySelect';
import {
  validateReportForm,
  type ReportFormValues,
} from '../model/report-form-model';

export function ReportDownloadForm({
  values,
  errors,
  properties,
  propertiesReady,
  propertiesLoading,
  busy,
  onChange,
  onMonth,
  onSubmit,
}: {
  values: ReportFormValues;
  errors: AdminReportErrors;
  properties: AdminPropertyOption[];
  propertiesReady: boolean;
  propertiesLoading: boolean;
  busy: boolean;
  onChange: (field: keyof ReportFormValues, value: string) => void;
  onMonth: (offset: 0 | -1) => void;
  onSubmit: () => void;
}) {
  const id = useId();
  const form = useRef<HTMLFormElement>(null);
  const [nativeErrors, setNativeErrors] = useState<AdminReportErrors>({});
  const [dateRevision, setDateRevision] = useState(0);
  const shownErrors = { ...errors, ...nativeErrors };
  const periodErrors = { ...validateReportForm(values), ...nativeErrors };
  const selected = properties.find(
    (property) => property.id === values.propertyId,
  );
  const propertyName = values.propertyId
    ? selected
      ? `${selected.name}${selected.isActive ? '' : ' · 비활성'}`
      : '선택한 휴양소 · 목록 확인 필요'
    : '전체 휴양소';

  function changeDate(field: 'from' | 'to', input: HTMLInputElement) {
    const invalid = input.validity.badInput;
    setNativeErrors((current) => {
      const next = { ...current };
      delete next[field];
      if (invalid) next[field] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
      return next;
    });
    onChange(field, invalid ? '' : input.value);
  }

  function chooseMonth(offset: 0 | -1) {
    if (busy) return;
    setNativeErrors({});
    // Remount native date inputs even if the preset matches the prior state.
    setDateRevision((value) => value + 1);
    onMonth(offset);
  }

  return (
    <form
      ref={form}
      className="reports-form"
      noValidate
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (busy || !propertiesReady) return;
        const next: AdminReportErrors = {};
        for (const field of ['from', 'to'] as const) {
          if (
            form.current?.querySelector<HTMLInputElement>(`[name="${field}"]`)
              ?.validity.badInput
          )
            next[field] = '연도, 월, 일을 모두 올바르게 입력해 주세요.';
        }
        setNativeErrors(next);
        if (!Object.keys(next).length) onSubmit();
        requestAnimationFrame(() => {
          form.current
            ?.querySelector<HTMLElement>('[aria-invalid="true"]')
            ?.focus();
        });
      }}
    >
      <fieldset className="reports-form__controls" disabled={busy}>
        <legend className="reports-form__legend">보고서 다운로드 조건</legend>
        <div className="reports-presets" aria-label="기간 빠른 선택">
          <Button
            className="admin-button-secondary"
            onClick={() => chooseMonth(0)}
          >
            이번 달
          </Button>
          <Button
            className="admin-button-secondary"
            onClick={() => chooseMonth(-1)}
          >
            지난달
          </Button>
        </div>
        <div className="reports-fields">
          {(['from', 'to'] as const).map((field) => (
            <div className="reports-field" key={field}>
              <label htmlFor={`${id}-${field}`}>
                {field === 'from' ? '시작일' : '종료일'}
              </label>
              <input
                key={`${field}:${dateRevision}`}
                id={`${id}-${field}`}
                name={field}
                type="date"
                min="1900-01-01"
                max="2100-12-31"
                required
                value={values[field]}
                aria-invalid={!!shownErrors[field] || undefined}
                aria-describedby={`${id}-date-hint${shownErrors[field] ? ` ${id}-${field}-error` : ''}`}
                onChange={(event) => changeDate(field, event.currentTarget)}
                onInput={(event) => {
                  // Some native date edits leave an empty value without a change event.
                  if (event.currentTarget.validity.badInput)
                    changeDate(field, event.currentTarget);
                }}
              />
              {shownErrors[field] && (
                <p className="reports-field__error" id={`${id}-${field}-error`}>
                  {shownErrors[field]}
                </p>
              )}
            </div>
          ))}
          <fieldset
            className="reports-field reports-field--property"
            disabled={!propertiesReady}
          >
            <legend className="reports-form__legend">휴양소 선택</legend>
            <AdminPropertySelect
              id={`${id}-property`}
              value={values.propertyId}
              properties={propertiesReady ? properties : undefined}
              loading={propertiesLoading}
              invalid={!!errors.propertyId}
              describedBy={`${id}-property-hint${errors.propertyId ? ` ${id}-property-error` : ''}`}
              onChange={(value) => onChange('propertyId', value)}
            />
            {errors.propertyId && (
              <p className="reports-field__error" id={`${id}-property-error`}>
                {errors.propertyId}
              </p>
            )}
          </fieldset>
        </div>
        <div className="reports-form__hints">
          <p id={`${id}-date-hint`}>
            한국 시간 기준 · 시작일과 종료일을 포함해 최대 62일
          </p>
          <p>입실·퇴실·정비는 제출일, 이상사항은 접수일로 조회합니다.</p>
          <p id={`${id}-property-hint`}>
            비활성 휴양소의 기록도 선택하여 받을 수 있습니다.
          </p>
        </div>
      </fieldset>
      <dl className="reports-form__summary" aria-label="다운로드할 범위">
        <div>
          <dt>기간</dt>
          <dd>
            {periodErrors.from || periodErrors.to
              ? '시작일과 종료일을 확인해 주세요.'
              : `${values.from} ~ ${values.to}`}
          </dd>
        </div>
        <div>
          <dt>휴양소</dt>
          <dd>{propertyName}</dd>
        </div>
      </dl>
      <div className="reports-form__footer">
        <p>엑셀 파일 1개 · 시트 3개 · 사진은 개수만 포함</p>
        <Button type="submit" loading={busy} disabled={!propertiesReady}>
          {busy ? '엑셀 생성 중…' : '엑셀 다운로드'}
        </Button>
      </div>
    </form>
  );
}
