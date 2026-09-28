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
          className="property-form__section"
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
    </form>
  );
}
