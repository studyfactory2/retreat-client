import { useEffect, useRef, useState } from 'react';
import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';
import type {
  StayImportRowDto,
  ReviewStayImportRowInput,
} from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { Button } from '../../../shared/ui/Button/Button';
import { useUnsavedStay } from '../stays/use-unsaved-stay';
import { UnsavedStayNotice } from '../stays/UnsavedStayNotice';
import { ImportSourceCells } from './ImportSourceCells';
import { ImportMutationNotice } from './ImportMutationNotice';
import {
  importRowValues,
  importRowInput,
  validateImportRow,
  type ImportRowValues,
  type ImportRowErrors,
} from './import-review-model';
import type { ImportMutationState } from './use-stay-import';
import '../stays/stays.css';

export function ImportRowEditor({
  row,
  properties,
  propertiesReady,
  state,
  onSave,
  onClose,
  onReload,
}: {
  row: StayImportRowDto;
  properties: AdminPropertyOption[];
  propertiesReady: boolean;
  state: ImportMutationState;
  onSave: (input: ReviewStayImportRowInput) => void;
  onClose: () => void;
  onReload: () => void;
}) {
  const [initial] = useState(() => importRowValues(row));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ImportRowErrors>({});
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const leave = useUnsavedStay(dirty);
  const locked = state.busy || state.blocked || leave.pending;
  useEffect(() => {
    heading.current?.focus();
    window.scrollTo({ top: 0 });
  }, []);
  function change(field: keyof ImportRowValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
  function submit() {
    if (locked || !propertiesReady) return;
    const next = validateImportRow(values);
    if (
      !properties.some(
        (property) => property.id === values.propertyId && property.isActive,
      )
    )
      next.propertyId = '활성 상태인 휴양소를 선택해 주세요.';
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        form.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    onSave({ id: row.id, action: 'CREATE', data: importRowInput(values) });
  }
  function fieldError(field: keyof ImportRowValues) {
    return (
      errors[field] && (
        <p className="stay-field__error" id={`import-${field}-error`}>
          {errors[field]}
        </p>
      )
    );
  }
  return (
    <section className="stay-import-editor">
      <header className="stay-import-heading">
        <div>
          <p className="stay-import-eyebrow">ROW REVIEW</p>
          <h1 tabIndex={-1} ref={heading}>
            이용 정보 검토
          </h1>
          <p>
            {row.sheetName} · 원본 {row.rowNumber}행
          </p>
        </div>
      </header>
      <ImportMutationNotice
        state={state}
        rows={[row]}
        onReload={() => leave.askToLeave(onReload)}
      />
      {leave.pending && (
        <UnsavedStayNotice
          onKeep={leave.keepEditing}
          onDiscard={leave.discard}
        />
      )}
      {row.validationMessages.length > 0 && (
        <div className="stay-import-notice">
          <h2>원본에서 확인할 내용</h2>
          <ul>
            {row.validationMessages.map((message, index) => (
              <li key={`${message.code}:${index}`}>{message.message}</li>
            ))}
          </ul>
        </div>
      )}
      <ImportSourceCells row={row} />
      <form
        className="stay-import-card"
        ref={form}
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
      >
        <fieldset disabled={locked} className="stay-import-fields">
          <legend>검토한 이용 정보</legend>
          <p>
            내용을 저장하면 원본의 확인 사항을 검토한 것으로 처리됩니다.
            연락처를 알 수 없으면 비워 둘 수 있습니다. 이용 일정은 최종 확정 후
            등록됩니다.
          </p>
          <div className="stay-import-form-grid">
            <div className="stay-field stay-import-wide">
              <label htmlFor="import-propertyId">휴양소 · 필수</label>
              <select
                id="import-propertyId"
                value={values.propertyId}
                disabled={!propertiesReady}
                onChange={(event) => change('propertyId', event.target.value)}
                aria-invalid={!!errors.propertyId || undefined}
                aria-describedby={
                  errors.propertyId ? 'import-propertyId-error' : undefined
                }
              >
                <option value="">휴양소를 선택해 주세요</option>
                {values.propertyId &&
                  !properties.some(
                    (property) =>
                      property.id === values.propertyId && property.isActive,
                  ) && (
                    <option value={values.propertyId} disabled>
                      {properties.find(
                        (property) => property.id === values.propertyId,
                      )?.name ?? '선택한 휴양소'}{' '}
                      · 선택 불가
                    </option>
                  )}
                {properties
                  .filter((property) => property.isActive)
                  .map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
              </select>
              {fieldError('propertyId')}
            </div>
            {(['guestName', 'phone', 'company', 'department'] as const).map(
              (field) => (
                <div className="stay-field" key={field}>
                  <label htmlFor={`import-${field}`}>
                    {
                      {
                        guestName: '이용객 이름 · 필수',
                        phone: '연락처 · 선택',
                        company: '회사 · 선택',
                        department: '부서 · 선택',
                      }[field]
                    }
                  </label>
                  <input
                    id={`import-${field}`}
                    type={field === 'phone' ? 'tel' : 'text'}
                    autoComplete="off"
                    value={values[field]}
                    maxLength={field === 'phone' ? 32 : 100}
                    onChange={(event) => change(field, event.target.value)}
                    aria-invalid={!!errors[field] || undefined}
                    aria-describedby={
                      errors[field] ? `import-${field}-error` : undefined
                    }
                  />
                  {fieldError(field)}
                </div>
              ),
            )}
            {(['checkInAt', 'checkOutAt'] as const).map((field) => (
              <div className="stay-field" key={field}>
                <label htmlFor={`import-${field}`}>
                  {field === 'checkInAt'
                    ? '입실 예정 · 필수'
                    : '퇴실 예정 · 필수'}
                </label>
                <input
                  id={`import-${field}`}
                  type="datetime-local"
                  step="0.001"
                  value={values[field]}
                  onChange={(event) => change(field, event.target.value)}
                  aria-invalid={!!errors[field] || undefined}
                  aria-describedby={`import-${field}-hint${errors[field] ? ` import-${field}-error` : ''}`}
                />
                <p className="stay-field__hint" id={`import-${field}-hint`}>
                  한국 시간 기준
                  {!row.normalizedData?.[field]
                    ? ` · 원본 날짜: ${(field === 'checkInAt' ? row.normalizedData?.checkInDate : row.normalizedData?.checkOutDate) ?? '확인 필요'} · 시간을 직접 입력해 주세요.`
                    : ''}
                </p>
                {fieldError(field)}
              </div>
            ))}
            <div className="stay-field stay-import-wide">
              <label htmlFor="import-notes">관리자 메모 · 선택</label>
              <textarea
                id="import-notes"
                rows={3}
                maxLength={2000}
                value={values.notes}
                onChange={(event) => change('notes', event.target.value)}
                aria-invalid={!!errors.notes || undefined}
                aria-describedby={
                  errors.notes ? 'import-notes-error' : undefined
                }
              />
              {fieldError('notes')}
            </div>
          </div>
        </fieldset>
        <div className="stay-import-actions">
          <Button
            className="admin-button-secondary"
            disabled={state.busy || leave.pending}
            onClick={() => leave.askToLeave(onClose)}
          >
            검토 목록으로
          </Button>
          <Button
            type="submit"
            loading={state.busy}
            disabled={locked || !propertiesReady}
          >
            검토 내용 저장
          </Button>
        </div>
      </form>
    </section>
  );
}
