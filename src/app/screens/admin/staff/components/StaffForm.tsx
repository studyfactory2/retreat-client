import { Button } from '../../../../shared/ui/Button/Button';
import {
  staffTextFields,
  type StaffFormErrors,
  type StaffFormValues,
} from '../model/staff-form-model';

type Props = {
  values: StaffFormValues;
  errors: StaffFormErrors;
  editing: boolean;
  hasAssignments: boolean;
  busy: boolean;
  blocked: boolean;
  onChange: (values: StaffFormValues) => void;
  onSubmit: () => void;
  onCancel: () => void;
};
export function StaffForm({
  values,
  errors,
  editing,
  hasAssignments,
  busy,
  blocked,
  onChange,
  onSubmit,
  onCancel,
}: Props) {
  return (
    <form
      className="staff-form"
      noValidate
      aria-busy={busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!busy && !blocked) onSubmit();
      }}
    >
      <fieldset disabled={busy || blocked} className="staff-form__fields">
        <legend className="staff-sr-only">직원 정보</legend>
        <section className="staff-panel" aria-labelledby="staff-basic-title">
          <div className="staff-panel__heading">
            <h2 id="staff-basic-title">기본 정보</h2>
            <p>
              이름과 연락 정보를 등록하면 휴양소 담당 직원으로 배정할 수
              있습니다.
            </p>
          </div>
          <div className="staff-form__grid">
            {staffTextFields.map(({ key, label, limit }) => (
              <div className="staff-field" key={key}>
                <label htmlFor={`staff-${key}`}>
                  {label} <span>{key === 'name' ? '필수' : '선택'}</span>
                </label>
                <input
                  id={`staff-${key}`}
                  name={key}
                  type={key === 'phone' ? 'tel' : 'text'}
                  autoComplete="off"
                  required={key === 'name'}
                  value={values[key]}
                  aria-invalid={!!errors[key] || undefined}
                  aria-describedby={`staff-${key}-hint${errors[key] ? ` staff-${key}-error` : ''}`}
                  onChange={(event) =>
                    onChange({ ...values, [key]: event.target.value })
                  }
                />
                <p className="staff-hint" id={`staff-${key}-hint`}>
                  최대 {limit}자
                </p>
                {errors[key] && (
                  <p className="staff-field__error" id={`staff-${key}-error`}>
                    {errors[key]}
                  </p>
                )}
              </div>
            ))}
          </div>
        </section>
        {editing && (
          <section className="staff-panel" aria-labelledby="staff-active-title">
            <div className="staff-panel__heading">
              <h2 id="staff-active-title">활성 상태</h2>
              <p>활성 직원만 휴양소의 담당 직원으로 배정할 수 있습니다.</p>
            </div>
            <label className="staff-toggle" htmlFor="staff-isActive">
              <input
                id="staff-isActive"
                type="checkbox"
                checked={values.isActive}
                disabled={values.isActive && hasAssignments}
                aria-describedby={`staff-active-hint${errors.isActive ? ' staff-isActive-error' : ''}`}
                aria-invalid={!!errors.isActive || undefined}
                onChange={(event) =>
                  onChange({ ...values, isActive: event.target.checked })
                }
              />
              직원 활성화
            </label>
            <p className="staff-hint" id="staff-active-hint">
              {hasAssignments
                ? '담당 휴양소가 있어 비활성화할 수 없습니다. 아래 휴양소 설정에서 배정을 먼저 변경해 주세요.'
                : '비활성 직원의 기존 정비 기록은 유지됩니다. 필요할 때 다시 활성화할 수 있습니다.'}
            </p>
            {errors.isActive && (
              <p className="staff-field__error" id="staff-isActive-error">
                {errors.isActive}
              </p>
            )}
          </section>
        )}
      </fieldset>
      <div className="staff-form__actions">
        <Button
          className="admin-button-secondary"
          disabled={busy || blocked}
          onClick={onCancel}
        >
          취소
        </Button>
        <Button type="submit" loading={busy} disabled={blocked}>
          {busy ? '저장 중' : editing ? '변경 내용 저장' : '직원 등록'}
        </Button>
      </div>
    </form>
  );
}
