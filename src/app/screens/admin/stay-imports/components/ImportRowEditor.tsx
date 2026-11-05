import {
  useEffect,
  useImperativeHandle,
  useLayoutEffect,
  useRef,
  useState,
  type Ref,
} from 'react';
import { Link } from 'react-router-dom';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type {
  StayImportRowDto,
  ReviewStayImportRowInput,
} from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useUnsavedStay } from '../../stays/hooks/use-unsaved-stay';
import { UnsavedStayNotice } from '../../stays/components/UnsavedStayNotice';
import { ImportSourceCells } from './ImportSourceCells';
import { ImportMutationNotice } from './ImportMutationNotice';
import {
  importRowValues,
  importRowInput,
  importRowStatus,
  importTime,
  validateImportRow,
  type ImportRowValues,
  type ImportRowErrors,
} from '../model/import-review-model';
import type { ImportMutationState } from '../hooks/use-stay-import';
import '../styles/import-review-editor.css';

export type ImportEditorNavigation = {
  requestLeave: (proceed: () => void) => void;
};

const optionalFields = ['phone', 'company', 'department', 'notes'] as const;

export function ImportRowEditor({
  row,
  properties,
  propertiesReady,
  state,
  editable,
  navigationRef,
  onSave,
  onClose,
  onReload,
}: {
  row: StayImportRowDto;
  properties: AdminPropertyOption[];
  propertiesReady: boolean;
  state: ImportMutationState;
  editable: boolean;
  navigationRef?: Ref<ImportEditorNavigation>;
  onSave: (input: ReviewStayImportRowInput) => void;
  onClose: () => void;
  onReload: () => void;
}) {
  const [initial] = useState(() => importRowValues(row));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ImportRowErrors>({});
  const [excluding, setExcluding] = useState(false);
  const form = useRef<HTMLFormElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const optional = useRef<HTMLDetailsElement>(null);
  const excludeNotice = useRef<HTMLDivElement>(null);
  const excludeButton = useRef<HTMLButtonElement>(null);
  const restoreFocus = useRef<HTMLElement | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const leave = useUnsavedStay(
    dirty || excluding || state.busy || state.blocked,
  );
  const locked = state.busy || state.blocked || leave.pending;
  const canEdit = editable && row.normalizedData !== null && !row.stayId;
  const canExclude = editable && !row.stayId && row.action !== 'SKIP';
  const title =
    row.normalizedData?.guestName ||
    (row.normalizedData ? '이름 확인 필요' : '안내 / 기타 행');
  const review = row.normalizedData?.review;
  const reviewer = review && (
    <p className="import-review-editor__reviewer">
      <span>최근 검토</span>
      <strong>{review.actor.name}</strong>
      <time dateTime={review.at}>{importTime(review.at)} · 한국 시간</time>
    </p>
  );
  const badge = row.stayId
    ? 'complete'
    : row.action === 'SKIP'
      ? 'skip'
      : row.validationStatus.toLowerCase();

  function requestLeave(proceed: () => void) {
    if (state.busy || leave.pending) return;
    restoreFocus.current =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    leave.askToLeave(proceed);
  }

  useImperativeHandle(navigationRef, () => ({ requestLeave }));
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  useLayoutEffect(() => {
    if (optional.current && optionalFields.some((field) => errors[field])) {
      optional.current.open = true;
    }
  }, [errors]);
  useEffect(() => {
    if (excluding) excludeNotice.current?.focus();
  }, [excluding]);

  function change(field: keyof ImportRowValues, value: string) {
    setValues((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
  }
  function submit() {
    if (!canEdit || locked || excluding || !propertiesReady) return;
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
        <p className="import-review-editor__error" id={`import-${field}-error`}>
          {errors[field]}
        </p>
      )
    );
  }
  function keepEditing() {
    leave.keepEditing();
    requestAnimationFrame(() => {
      if (restoreFocus.current?.isConnected) restoreFocus.current.focus();
      else heading.current?.focus();
    });
  }
  function cancelExclusion() {
    setExcluding(false);
    requestAnimationFrame(() => excludeButton.current?.focus());
  }
  function timeText(field: 'checkInAt' | 'checkOutAt') {
    const data = row.normalizedData;
    if (data?.[field]) return importTime(data[field]);
    const date = field === 'checkInAt' ? data?.checkInDate : data?.checkOutDate;
    return date ? `${date} · 시간 확인 필요` : '확인 필요';
  }

  return (
    <section
      className="import-review-editor"
      aria-labelledby="import-review-editor-title"
      onKeyDown={(event) => {
        if (event.key === 'Escape' && (leave.pending || excluding)) {
          event.preventDefault();
          event.stopPropagation();
          if (state.busy) return;
          if (leave.pending) keepEditing();
          else cancelExclusion();
        }
      }}
    >
      <header className="import-review-editor__heading">
        <div>
          <h2 id="import-review-editor-title" tabIndex={-1} ref={heading}>
            {title}
          </h2>
          <p>
            {row.sheetName} · 원본 {row.rowNumber}행
          </p>
        </div>
        <Button
          className="admin-button-secondary import-review-editor__close"
          aria-label="행 검토 닫기"
          disabled={state.busy || leave.pending}
          onClick={() => requestLeave(onClose)}
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="m6 6 12 12M18 6 6 18" />
          </svg>
        </Button>
      </header>

      <ImportMutationNotice
        state={state}
        rows={[row]}
        onReload={() => requestLeave(onReload)}
      />
      {leave.pending && (
        <UnsavedStayNotice onKeep={keepEditing} onDiscard={leave.discard} />
      )}

      <div
        className={`import-review-editor__review import-review-editor__review--${badge}`}
      >
        <span
          className={`import-review-editor__badge import-review-editor__badge--${badge}`}
        >
          {importRowStatus(row)}
        </span>
        {row.validationMessages.length > 0 && (
          <ul>
            {row.validationMessages.map((message, index) => (
              <li key={`${message.code}:${index}`}>{message.message}</li>
            ))}
          </ul>
        )}
      </div>

      {canEdit ? (
        <form
          ref={form}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            submit();
          }}
        >
          <fieldset
            className="import-review-editor__fields"
            disabled={locked || excluding}
          >
            <legend className="import-review-editor__sr-only">
              검토한 이용 정보
            </legend>
            <div className="import-review-editor__grid">
              <div className="import-review-editor__field import-review-editor__wide">
                <label htmlFor="import-propertyId">
                  휴양소 <span>필수</span>
                </label>
                <select
                  id="import-propertyId"
                  required
                  value={values.propertyId}
                  disabled={!propertiesReady}
                  onChange={(event) => change('propertyId', event.target.value)}
                  aria-invalid={!!errors.propertyId || undefined}
                  aria-describedby={
                    errors.propertyId ? 'import-propertyId-error' : undefined
                  }
                >
                  <option value="">휴양소 선택</option>
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
              <div className="import-review-editor__field import-review-editor__wide">
                <label htmlFor="import-guestName">
                  이용객 이름 <span>필수</span>
                </label>
                <input
                  id="import-guestName"
                  type="text"
                  required
                  autoComplete="off"
                  value={values.guestName}
                  maxLength={100}
                  onChange={(event) => change('guestName', event.target.value)}
                  aria-invalid={!!errors.guestName || undefined}
                  aria-describedby={
                    errors.guestName ? 'import-guestName-error' : undefined
                  }
                />
                {fieldError('guestName')}
              </div>
              {(['checkInAt', 'checkOutAt'] as const).map((field) => (
                <div className="import-review-editor__field" key={field}>
                  <label htmlFor={`import-${field}`}>
                    {field === 'checkInAt' ? '입실 예정' : '퇴실 예정'}{' '}
                    <span>필수 · 한국 시간</span>
                  </label>
                  <input
                    id={`import-${field}`}
                    type="datetime-local"
                    required
                    step="0.001"
                    value={values[field]}
                    onChange={(event) => change(field, event.target.value)}
                    aria-invalid={!!errors[field] || undefined}
                    aria-describedby={`import-${field}-hint${errors[field] ? ` import-${field}-error` : ''}`}
                  />
                  <p
                    className={`import-review-editor__hint${row.normalizedData?.[field] ? ' import-review-editor__sr-only' : ''}`}
                    id={`import-${field}-hint`}
                  >
                    {row.normalizedData?.[field]
                      ? '한국 시간 기준'
                      : `원본 날짜: ${(field === 'checkInAt' ? row.normalizedData?.checkInDate : row.normalizedData?.checkOutDate) ?? '확인 필요'} · 시간을 입력해 주세요.`}
                  </p>
                  {fieldError(field)}
                </div>
              ))}
            </div>
            <details className="import-review-editor__optional" ref={optional}>
              <summary>
                추가 정보 <span>연락처 · 회사 · 메모</span>
              </summary>
              <div className="import-review-editor__grid">
                {(['phone', 'company', 'department'] as const).map((field) => (
                  <div className="import-review-editor__field" key={field}>
                    <label htmlFor={`import-${field}`}>
                      {
                        {
                          phone: '연락처',
                          company: '회사',
                          department: '부서',
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
                ))}
                <div className="import-review-editor__field import-review-editor__wide">
                  <label htmlFor="import-notes">관리자 메모</label>
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
            </details>
          </fieldset>
          <ImportSourceCells row={row} />
          {reviewer}
          <p className="import-review-editor__save-note">
            저장하면 원본의 확인 사항을 검토한 것으로 처리되며, 일정은 최종 확인
            후 등록됩니다.
          </p>
          <div className="import-review-editor__actions">
            {canExclude && (
              <button
                type="button"
                className="import-review-editor__exclude"
                ref={excludeButton}
                disabled={locked || excluding}
                onClick={() => setExcluding(true)}
              >
                이 행 제외
              </button>
            )}
            <Button
              type="submit"
              loading={state.busy && !excluding}
              disabled={locked || excluding || !propertiesReady}
            >
              {row.action === 'SKIP' ? '저장하고 다시 포함' : '검토 내용 저장'}
            </Button>
          </div>
        </form>
      ) : (
        <>
          {row.normalizedData ? (
            <dl className="import-review-editor__facts">
              <div>
                <dt>휴양소</dt>
                <dd>
                  {row.propertyId
                    ? (properties.find(
                        (property) => property.id === row.propertyId,
                      )?.name ?? '연결된 휴양소')
                    : '미연결'}
                </dd>
              </div>
              <div>
                <dt>이용객</dt>
                <dd>{row.normalizedData.guestName || '미입력'}</dd>
              </div>
              <div>
                <dt>입실 예정</dt>
                <dd>{timeText('checkInAt')}</dd>
              </div>
              <div>
                <dt>퇴실 예정</dt>
                <dd>{timeText('checkOutAt')}</dd>
              </div>
              {optionalFields.map(
                (field) =>
                  row.normalizedData?.[field] && (
                    <div key={field}>
                      <dt>
                        {
                          {
                            phone: '연락처',
                            company: '회사',
                            department: '부서',
                            notes: '메모',
                          }[field]
                        }
                      </dt>
                      <dd>{row.normalizedData[field]}</dd>
                    </div>
                  ),
              )}
            </dl>
          ) : (
            <p className="import-review-editor__hint">
              이용 정보가 없는 행입니다. 원본 셀에서 내용을 확인하세요.
            </p>
          )}
          <ImportSourceCells row={row} />
          {reviewer}
          {row.stayId && (
            <Link
              className="ui-button admin-button-secondary import-review-editor__stay-link"
              to={`/admin/stays/${row.stayId}?view=list`}
            >
              등록된 일정 보기 ↗
            </Link>
          )}
          {canExclude && (
            <div className="import-review-editor__actions">
              <button
                type="button"
                className="import-review-editor__exclude"
                ref={excludeButton}
                disabled={locked || excluding}
                onClick={() => setExcluding(true)}
              >
                이 행 제외
              </button>
            </div>
          )}
        </>
      )}

      {excluding && (
        <div
          className="import-review-editor__confirmation"
          role="alertdialog"
          aria-labelledby="import-editor-exclude-title"
          aria-describedby="import-editor-exclude-description"
          tabIndex={-1}
          ref={excludeNotice}
        >
          <h3 id="import-editor-exclude-title">이 행을 제외할까요?</h3>
          <p id="import-editor-exclude-description">
            {row.sheetName} · {row.rowNumber}행은 등록되지 않습니다.
            {row.normalizedData
              ? ' 최종 확인 전에는 다시 포함할 수 있습니다.'
              : ''}
            {dirty ? ' 아직 저장하지 않은 수정 내용은 저장되지 않습니다.' : ''}
          </p>
          <div>
            <Button
              className="admin-button-secondary"
              disabled={state.busy || leave.pending}
              onClick={cancelExclusion}
            >
              계속 검토
            </Button>
            <Button
              loading={state.busy}
              disabled={locked || !canExclude}
              onClick={() => {
                if (!locked && canExclude)
                  onSave({ id: row.id, action: 'SKIP' });
              }}
            >
              이 행 제외
            </Button>
          </div>
        </div>
      )}
    </section>
  );
}
