import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';
import type { AdminStayDto } from '../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../shared/ui/Button/Button';
import type { StayFormValues } from './stay-form-model';
import './stays.css';

type StayFormProps = {
  values: StayFormValues;
  onChange: (field: keyof StayFormValues, value: string) => void;
  onSubmit: () => void;
  onCancel: () => void;
  properties: AdminPropertyOption[];
  original?: AdminStayDto;
  errors?: Partial<Record<keyof StayFormValues, string>>;
  busy: boolean;
  blocked?: boolean;
};

export function StayForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  properties,
  original,
  errors = {},
  busy,
  blocked = false,
}: StayFormProps) {
  const activeProperties = properties.filter((property) => property.isActive);
  const unavailableProperty =
    !original &&
    values.propertyId &&
    !activeProperties.some((property) => property.id === values.propertyId);
  const datesLocked = original !== undefined && !original.property.isActive;

  function descriptionId(field: keyof StayFormValues, hint?: string) {
    return (
      [hint, errors[field] ? `stay-${field}-error` : undefined]
        .filter(Boolean)
        .join(' ') || undefined
    );
  }

  function fieldError(field: keyof StayFormValues) {
    return errors[field] ? (
      <p className="stay-field__error" id={`stay-${field}-error`}>
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form
      className="stay-form"
      noValidate
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !blocked) onSubmit();
      }}
    >
      <fieldset className="stay-form__fields" disabled={busy || blocked}>
        <legend className="stay-form__legend">이용 일정 정보</legend>

        <section
          className="stay-form__section"
          aria-labelledby="stay-schedule-title"
        >
          <div className="stay-form__section-heading">
            <div>
              <h2 id="stay-schedule-title">휴양소와 이용 일정</h2>
              <p>이용할 휴양소와 입·퇴실 예정 시간을 입력해 주세요.</p>
            </div>
            <span className="stay-form__required-guide">필수 항목 표시</span>
          </div>
          <div className="stay-form__grid">
            <div className="stay-field stay-field--wide">
              <label htmlFor="stay-propertyId">
                휴양소{' '}
                {!original && (
                  <span className="stay-field__required">필수</span>
                )}
              </label>
              {original ? (
                <input
                  id="stay-propertyId"
                  name="propertyId"
                  value={original.property.name}
                  readOnly
                  aria-invalid={!!errors.propertyId || undefined}
                  aria-describedby={descriptionId(
                    'propertyId',
                    'stay-property-hint',
                  )}
                />
              ) : (
                <select
                  id="stay-propertyId"
                  name="propertyId"
                  required
                  value={values.propertyId}
                  onChange={(event) =>
                    onChange('propertyId', event.target.value)
                  }
                  aria-invalid={!!errors.propertyId || undefined}
                  aria-describedby={descriptionId(
                    'propertyId',
                    'stay-property-hint',
                  )}
                >
                  <option value="" disabled>
                    휴양소를 선택해 주세요
                  </option>
                  {unavailableProperty && (
                    <option value={values.propertyId} disabled>
                      {properties.find(
                        (property) => property.id === values.propertyId,
                      )?.name ?? '선택한 휴양소'}{' '}
                      · 선택 불가
                    </option>
                  )}
                  {activeProperties.map((property) => (
                    <option key={property.id} value={property.id}>
                      {property.name}
                    </option>
                  ))}
                </select>
              )}
              <p className="stay-field__hint" id="stay-property-hint">
                {original
                  ? '등록한 휴양소는 변경할 수 없습니다.'
                  : '현재 활성 상태인 휴양소만 선택할 수 있습니다.'}
              </p>
              {fieldError('propertyId')}
            </div>

            <div className="stay-field">
              <label htmlFor="stay-checkInAt">
                입실 예정 <span className="stay-field__required">필수</span>
              </label>
              <input
                id="stay-checkInAt"
                name="checkInAt"
                type="datetime-local"
                step={60}
                required
                readOnly={datesLocked}
                value={values.checkInAt}
                onChange={(event) => onChange('checkInAt', event.target.value)}
                aria-invalid={!!errors.checkInAt || undefined}
                aria-describedby={descriptionId(
                  'checkInAt',
                  `stay-date-hint${datesLocked ? ' stay-date-lock-hint' : ''}`,
                )}
              />
              {fieldError('checkInAt')}
            </div>
            <div className="stay-field">
              <label htmlFor="stay-checkOutAt">
                퇴실 예정 <span className="stay-field__required">필수</span>
              </label>
              <input
                id="stay-checkOutAt"
                name="checkOutAt"
                type="datetime-local"
                step={60}
                required
                readOnly={datesLocked}
                value={values.checkOutAt}
                onChange={(event) => onChange('checkOutAt', event.target.value)}
                aria-invalid={!!errors.checkOutAt || undefined}
                aria-describedby={descriptionId(
                  'checkOutAt',
                  `stay-date-hint${datesLocked ? ' stay-date-lock-hint' : ''}`,
                )}
              />
              {fieldError('checkOutAt')}
            </div>
          </div>
          <p
            className="stay-field__hint stay-form__date-hint"
            id="stay-date-hint"
          >
            입·퇴실 일시는 한국 시간 기준입니다.
            {!original &&
              ' 입·퇴실 시간은 입력 예시입니다. 실제 이용 시간에 맞게 변경해 주세요.'}
          </p>
          {datesLocked && (
            <p className="stay-form__locked-note" id="stay-date-lock-hint">
              비활성 휴양소는 이용 일시를 변경할 수 없습니다. 이용객 정보와
              메모는 수정할 수 있습니다.
            </p>
          )}
        </section>

        <section
          className="stay-form__section"
          aria-labelledby="stay-guest-title"
        >
          <div className="stay-form__section-heading">
            <div>
              <h2 id="stay-guest-title">이용객 정보</h2>
              <p>이용객을 확인할 수 있는 정보를 입력해 주세요.</p>
            </div>
          </div>
          <div className="stay-form__grid">
            <div className="stay-field">
              <label htmlFor="stay-guestName">
                이용객 이름 <span className="stay-field__required">필수</span>
              </label>
              <input
                id="stay-guestName"
                name="guestName"
                type="text"
                required
                maxLength={100}
                autoComplete="off"
                value={values.guestName}
                onChange={(event) => onChange('guestName', event.target.value)}
                aria-invalid={!!errors.guestName || undefined}
                aria-describedby={descriptionId('guestName')}
              />
              {fieldError('guestName')}
            </div>
            <div className="stay-field">
              <label htmlFor="stay-phone">
                연락처 <span className="stay-field__optional">선택</span>
              </label>
              <input
                id="stay-phone"
                name="phone"
                type="tel"
                maxLength={32}
                autoComplete="off"
                value={values.phone}
                onChange={(event) => onChange('phone', event.target.value)}
                aria-invalid={!!errors.phone || undefined}
                aria-describedby={descriptionId('phone')}
              />
              {fieldError('phone')}
            </div>
            <div className="stay-field">
              <label htmlFor="stay-company">
                회사 <span className="stay-field__optional">선택</span>
              </label>
              <input
                id="stay-company"
                name="company"
                type="text"
                maxLength={100}
                autoComplete="off"
                value={values.company}
                onChange={(event) => onChange('company', event.target.value)}
                aria-invalid={!!errors.company || undefined}
                aria-describedby={descriptionId('company')}
              />
              {fieldError('company')}
            </div>
            <div className="stay-field">
              <label htmlFor="stay-department">
                부서 <span className="stay-field__optional">선택</span>
              </label>
              <input
                id="stay-department"
                name="department"
                type="text"
                maxLength={100}
                autoComplete="off"
                value={values.department}
                onChange={(event) => onChange('department', event.target.value)}
                aria-invalid={!!errors.department || undefined}
                aria-describedby={descriptionId('department')}
              />
              {fieldError('department')}
            </div>
          </div>
        </section>

        <section
          className="stay-form__section"
          aria-labelledby="stay-notes-title"
        >
          <div className="stay-form__section-heading">
            <div>
              <h2 id="stay-notes-title">관리 메모</h2>
              <p>일정 관리에 필요한 내용을 남겨 주세요.</p>
            </div>
          </div>
          <div className="stay-field">
            <label htmlFor="stay-notes">
              메모 <span className="stay-field__optional">선택</span>
            </label>
            <textarea
              id="stay-notes"
              name="notes"
              rows={4}
              maxLength={2000}
              value={values.notes}
              onChange={(event) => onChange('notes', event.target.value)}
              aria-invalid={!!errors.notes || undefined}
              aria-describedby={descriptionId('notes', 'stay-notes-limit')}
            />
            <p className="stay-field__limit" id="stay-notes-limit">
              최대 2,000자
            </p>
            {fieldError('notes')}
          </div>
          {original && (
            <div className="stay-field stay-form__reason">
              <label htmlFor="stay-reason">
                수정 사유 <span className="stay-field__optional">선택</span>
              </label>
              <textarea
                id="stay-reason"
                name="reason"
                rows={3}
                maxLength={1000}
                value={values.reason}
                onChange={(event) => onChange('reason', event.target.value)}
                aria-invalid={!!errors.reason || undefined}
                aria-describedby={descriptionId('reason', 'stay-reason-hint')}
              />
              <p className="stay-field__hint" id="stay-reason-hint">
                변경 내용을 확인할 수 있도록 사유를 남길 수 있습니다. 최대
                1,000자
              </p>
              {fieldError('reason')}
            </div>
          )}
        </section>
      </fieldset>

      <div className="stay-actions stay-form__actions">
        <Button
          className="admin-button-secondary"
          onClick={onCancel}
          disabled={busy}
        >
          취소
        </Button>
        <Button type="submit" loading={busy} disabled={blocked}>
          {busy ? '저장 중' : original ? '변경 내용 저장' : '이용 일정 등록'}
        </Button>
      </div>
    </form>
  );
}
