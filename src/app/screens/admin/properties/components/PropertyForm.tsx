import {
  PUBLIC_CONTACT_MAX_LENGTH,
  PUBLIC_CONTACT_HELP,
} from '../../../../features/property-contact/public-contact';
import { Button } from '../../../../shared/ui/Button/Button';
import type {
  PropertyFormErrors,
  PropertyFormValues,
} from '../model/property-form-model';
import '../styles/properties.css';

type PropertyFormProps = {
  values: PropertyFormValues;
  onChange: (values: PropertyFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
  editing: boolean;
  dirty: boolean;
  errors?: PropertyFormErrors;
  busy: boolean;
  blocked?: boolean;
};

export function PropertyForm({
  values,
  onChange,
  onSubmit,
  onCancel,
  editing,
  dirty,
  errors = {},
  busy,
  blocked = false,
}: PropertyFormProps) {
  function descriptionId(field: keyof PropertyFormValues, hint?: string) {
    return (
      [hint, errors[field] ? `property-${field}-error` : undefined]
        .filter(Boolean)
        .join(' ') || undefined
    );
  }

  function fieldError(field: keyof PropertyFormValues) {
    return errors[field] ? (
      <p className="property-field__error" id={`property-${field}-error`}>
        {errors[field]}
      </p>
    ) : null;
  }

  return (
    <form
      className="property-form"
      noValidate
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !blocked) onSubmit();
      }}
    >
      <fieldset className="property-form__fields" disabled={busy || blocked}>
        <legend className="property-form__legend">휴양소 정보</legend>

        <section
          className="property-form__section property-form__section--basic"
          aria-labelledby="property-basic-title"
        >
          <div className="property-form__section-heading">
            <h2 id="property-basic-title">기본 정보</h2>
            <p>휴양소를 구분할 수 있는 이름과 지역을 입력해 주세요.</p>
          </div>

          <div className="property-form__grid">
            <div className="property-field">
              <label htmlFor="property-name">
                휴양소 이름{' '}
                <span className="property-field__required">필수</span>
              </label>
              <input
                id="property-name"
                name="name"
                type="text"
                required
                maxLength={100}
                autoComplete="off"
                value={values.name}
                onChange={(event) =>
                  onChange({ ...values, name: event.target.value })
                }
                aria-invalid={!!errors.name || undefined}
                aria-describedby={descriptionId('name', 'property-name-hint')}
              />
              <p className="property-field__hint" id="property-name-hint">
                최대 100자
              </p>
              {fieldError('name')}
            </div>

            <div className="property-field">
              <label htmlFor="property-region">
                지역 <span className="property-field__optional">선택</span>
              </label>
              <input
                id="property-region"
                name="region"
                type="text"
                maxLength={100}
                autoComplete="off"
                value={values.region}
                onChange={(event) =>
                  onChange({ ...values, region: event.target.value })
                }
                aria-invalid={!!errors.region || undefined}
                aria-describedby={descriptionId(
                  'region',
                  'property-region-hint',
                )}
              />
              <p className="property-field__hint" id="property-region-hint">
                지역을 입력하면 목록에서 함께 확인할 수 있습니다. 최대 100자
              </p>
              {fieldError('region')}
            </div>
          </div>
        </section>

        <section
          className="property-form__section"
          aria-labelledby="property-contact-title"
        >
          <div className="property-form__section-heading">
            <h2 id="property-contact-title">이용객 공개 연락처</h2>
            <p>
              공용 QR과 개인 이용 링크를 연 이용객에게 표시됩니다. 공개해도 되는
              관리자 연락처만 입력해 주세요.
            </p>
          </div>
          <div className="property-field">
            <label htmlFor="property-publicContactPhone">
              관리자 연락처{' '}
              <span className="property-field__optional">선택</span>
            </label>
            <input
              id="property-publicContactPhone"
              name="publicContactPhone"
              type="tel"
              maxLength={PUBLIC_CONTACT_MAX_LENGTH}
              autoComplete="off"
              placeholder="예: 02-1234-5678"
              value={values.publicContactPhone}
              onChange={(event) =>
                onChange({ ...values, publicContactPhone: event.target.value })
              }
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                if (/[\t\r\n]/.test(pasted)) {
                  event.preventDefault();
                  onChange({ ...values, publicContactPhone: pasted });
                }
              }}
              aria-invalid={!!errors.publicContactPhone || undefined}
              aria-describedby={descriptionId(
                'publicContactPhone',
                'property-contact-hint',
              )}
            />
            <p className="property-field__hint" id="property-contact-hint">
              {PUBLIC_CONTACT_HELP} 번호를 지우고 저장하면 이용객에게 더 이상
              표시되지 않습니다. 담당 직원의 전화번호는 자동으로 공개되지
              않습니다.
            </p>
            {fieldError('publicContactPhone')}
          </div>
        </section>

        <section
          className="property-form__section"
          aria-labelledby="property-settings-title"
        >
          <div className="property-form__section-heading">
            <h2 id="property-settings-title">이용 설정</h2>
            <p>휴양소 운영에 필요한 설정을 확인해 주세요.</p>
          </div>

          <div className="property-setting">
            <label htmlFor="property-vehicleRegistrationEnabled">
              <input
                id="property-vehicleRegistrationEnabled"
                name="vehicleRegistrationEnabled"
                type="checkbox"
                checked={values.vehicleRegistrationEnabled}
                onChange={(event) =>
                  onChange({
                    ...values,
                    vehicleRegistrationEnabled: event.target.checked,
                  })
                }
                aria-invalid={!!errors.vehicleRegistrationEnabled || undefined}
                aria-describedby={descriptionId(
                  'vehicleRegistrationEnabled',
                  'property-vehicle-hint',
                )}
              />
              <span>차량번호 사전 등록 사용</span>
            </label>
            <p className="property-setting__hint" id="property-vehicle-hint">
              이용객이 입실 전에 차량번호를 등록할 수 있도록 설정합니다.
            </p>
            {fieldError('vehicleRegistrationEnabled')}
          </div>

          {editing && (
            <div className="property-setting">
              <label htmlFor="property-isActive">
                <input
                  id="property-isActive"
                  name="isActive"
                  type="checkbox"
                  checked={values.isActive}
                  onChange={(event) =>
                    onChange({ ...values, isActive: event.target.checked })
                  }
                  aria-invalid={!!errors.isActive || undefined}
                  aria-describedby={descriptionId(
                    'isActive',
                    'property-active-hint',
                  )}
                />
                <span>휴양소 활성화</span>
              </label>
              <p className="property-setting__notice" id="property-active-hint">
                비활성으로 변경하면 새 이용 일정을 등록할 수 없습니다. 기존 이용
                기록은 유지됩니다.
              </p>
              {fieldError('isActive')}
            </div>
          )}
        </section>
      </fieldset>

      <div className="property-form__footer">
        <p role="status">
          {busy
            ? '변경 내용을 저장하고 있습니다.'
            : blocked
              ? '안내를 확인한 뒤 계속해 주세요.'
              : dirty
                ? '아직 저장하지 않은 변경 사항이 있습니다.'
                : editing
                  ? '저장된 정보입니다.'
                  : '정보를 입력한 뒤 휴양소를 등록해 주세요.'}
        </p>
        <div className="property-form__actions">
          <Button
            className="admin-button-secondary"
            onClick={onCancel}
            disabled={busy}
          >
            취소
          </Button>
          <Button type="submit" loading={busy} disabled={blocked}>
            {busy ? '저장 중' : editing ? '변경 내용 저장' : '휴양소 등록'}
          </Button>
        </div>
      </div>
    </form>
  );
}
