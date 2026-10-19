import {
  staffTextFields,
  type StaffFormErrors,
  type StaffFormValues,
} from '../model/staff-form-model';

const fieldLabels = { name: '이름', phone: '연락처', company: '회사', department: '부서' };

type Props = {
  values: StaffFormValues;
  errors: StaffFormErrors;
  editing: boolean;
  hasAssignments: boolean;
  busy: boolean;
  blocked: boolean;
  onChange: (values: StaffFormValues) => void;
};
export function StaffForm({
  values,
  errors,
  editing,
  hasAssignments,
  busy,
  blocked,
  onChange,
}: Props) {
  return (
    <fieldset disabled={busy || blocked} className="staff-form__fields staff-panel">
      <legend className="staff-sr-only">직원 정보</legend>
      <section aria-labelledby="staff-basic-title">
        <div className="staff-panel__heading">
          <h2 id="staff-basic-title">직원 정보</h2>
        </div>
        <div className="staff-form__grid">
          {staffTextFields.map(({ key, limit }) => (
            <div className="staff-field" key={key}>
              <label htmlFor={`staff-${key}`}>
                {fieldLabels[key]}
                {key === 'name' && (
                  <>
                    <span aria-hidden="true">*</span>
                    <span className="staff-sr-only">필수</span>
                  </>
                )}
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
              <p className="staff-sr-only" id={`staff-${key}-hint`}>
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
      <section
        className={`staff-form__status${editing ? '' : ' staff-form__status--default'}`}
        aria-labelledby="staff-active-title"
      >
        <div className="staff-form__status-heading">
          <h2 id="staff-active-title">활성 직원</h2>
          <label className="staff-toggle" htmlFor="staff-isActive">
            <input
              id="staff-isActive"
              type="checkbox"
              role="switch"
              aria-label="직원 활성화"
              checked={values.isActive}
              disabled={!editing || (values.isActive && hasAssignments)}
              aria-describedby={`staff-active-hint${errors.isActive ? ' staff-isActive-error' : ''}`}
              aria-invalid={!!errors.isActive || undefined}
              onChange={(event) =>
                onChange({ ...values, isActive: event.target.checked })
              }
            />
          </label>
        </div>
        <p className="staff-hint" id="staff-active-hint">
          {!editing
            ? '등록 후 상태를 변경할 수 있습니다.'
            : hasAssignments
            ? '비활성화하려면 휴양소 설정에서 담당 배정을 먼저 해제하거나 변경해 주세요.'
            : '활성 직원만 담당 휴양소에 배정할 수 있습니다. 비활성화해도 기존 정비 기록은 유지됩니다.'}
        </p>
        {errors.isActive && (
          <p className="staff-field__error" id="staff-isActive-error">
            {errors.isActive}
          </p>
        )}
      </section>
    </fieldset>
  );
}
