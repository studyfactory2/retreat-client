import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../../../../core/api/api-error';
import {
  createAdminChecklistTemplate,
  updateAdminChecklistTemplate,
} from '../../../../features/admin-checklist-templates/admin-checklist-template-api';
import type {
  ChecklistTemplateDto,
  ChecklistType,
} from '../../../../features/admin-checklist-templates/admin-checklist-template.types';
import { MAX_WRITABLE_CHECKLIST_VERSION } from '../../../../features/admin-checklist-templates/admin-checklist-template-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { useChecklistSave } from '../hooks/use-checklist-save';
import { useChecklistNavigation } from '../hooks/use-checklist-navigation';
import type { ChecklistWorkspaceData } from '../hooks/use-checklist-resource';
import {
  buildCreateChecklistInput,
  buildUpdateChecklistInput,
  checklistTypeLabels,
  createChecklistValues,
  validateChecklistForm,
  type ChecklistFormErrors,
  type ChecklistFormValues,
} from '../model/checklist-form-model';
import { ChecklistForm } from './ChecklistForm';
import { ChecklistPreview } from './ChecklistPreview';
import { ChecklistReview } from './ChecklistReview';
import { ChecklistNavigationNotice } from './ChecklistNavigationNotice';
import '../styles/property-checklists.css';
import '../styles/checklist-editor.css';

export function ChecklistEditor({
  data,
  type,
  token,
  rejectSession,
  onSaved,
  onEditing,
  onReload,
  returnUrl,
}: {
  data: ChecklistWorkspaceData;
  type: ChecklistType;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (template: ChecklistTemplateDto) => void;
  onEditing: () => void;
  onReload: () => void;
  returnUrl: string;
}) {
  const original = data.template;
  const navigate = useNavigate();
  const [initial] = useState(() => createChecklistValues(type, original));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<ChecklistFormErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [unchanged, setUnchanged] = useState(false);
  const mutation = useChecklistSave(token, rejectSession);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);
  const navigation = useChecklistNavigation(dirty, mutation.state.busy);
  const notice = useRef<HTMLDivElement>(null);
  const active =
    data.property.isActive && (!original || original.property.isActive);
  const fixed = !!original && type !== 'MAINTENANCE';
  const versionLimit =
    !!original && original.version > MAX_WRITABLE_CHECKLIST_VERSION;
  const editable = active && !fixed && !versionLimit;
  const blocked =
    mutation.state.busy || !!mutation.state.blocked || !!navigation.pending;
  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);
  function change(next: ChecklistFormValues) {
    if (blocked || reviewing) return;
    onEditing();
    setValues(next);
    setErrors({});
    setUnchanged(false);
  }
  function review() {
    if (blocked || !editable || reviewing) return;
    const nextErrors = validateChecklistForm(values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>(
            '.checklist-workspace [aria-invalid="true"]',
          )
          ?.focus(),
      );
      return;
    }
    if (original && !buildUpdateChecklistInput(original, values)) {
      setUnchanged(true);
      return;
    }
    setReviewing(true);
  }
  function save() {
    if (
      !reviewing ||
      blocked ||
      !editable ||
      Object.keys(validateChecklistForm(values)).length
    )
      return;
    const update = original
      ? buildUpdateChecklistInput(original, values)
      : null;
    if (original && !update) {
      setReviewing(false);
      setUnchanged(true);
      return;
    }
    void mutation.save(async (signal) => {
      const saved =
        original && update
          ? await updateAdminChecklistTemplate(
              original.id,
              update,
              token,
              signal,
            )
          : await createAdminChecklistTemplate(
              buildCreateChecklistInput(data.property.id, type, values),
              token,
              signal,
            );
      if (
        saved.propertyId !== data.property.id ||
        saved.type !== type ||
        (original &&
          (saved.id !== original.id ||
            saved.createdAt !== original.createdAt ||
            saved.version !== original.version + 1 ||
            Date.parse(saved.updatedAt) < Date.parse(original.updatedAt) ||
            (update?.title === undefined && saved.title !== original.title) ||
            (update?.isActive === undefined &&
              saved.isActive !== original.isActive) ||
            (update?.sections === undefined &&
              JSON.stringify(saved.definition) !==
                JSON.stringify(original.definition))))
      )
        throw new ApiRequestError(
          '저장된 체크리스트를 확인할 수 없습니다.',
          200,
          'INVALID_CHECKLIST_RESPONSE',
        );
      return saved;
    }, onSaved);
  }
  function editAgain() {
    if (mutation.state.busy) return;
    setReviewing(false);
    requestAnimationFrame(() =>
      document.getElementById('checklist-review-button')?.focus(),
    );
  }
  return (
    <>
      <header className="checklist-heading">
        <div>
          <p className="checklist-heading__eyebrow">PROPERTY CHECKLIST</p>
          <h1>{checklistTypeLabels[type]}</h1>
          <p>
            {data.property.name}
            {original ? ` · 버전 ${original.version}` : ' · 새 체크리스트'}
          </p>
        </div>
        <div className="checklist-actions">
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || !!navigation.pending}
            onClick={() =>
              navigation.request('return', () => navigate(returnUrl))
            }
          >
            목록으로 돌아가기
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || !!navigation.pending}
            onClick={() => navigation.request('reload', onReload)}
          >
            최신 정보 불러오기
          </Button>
        </div>
      </header>
      {navigation.pending && (
        <ChecklistNavigationNotice
          reload={navigation.pending === 'reload'}
          onKeep={navigation.keep}
          onProceed={navigation.proceed}
        />
      )}
      {mutation.state.message && (
        <div
          className="checklist-banner checklist-banner--error"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p>{mutation.state.message}</p>
          {mutation.state.blocked && (
            <Button
              className="admin-button-secondary"
              disabled={!!navigation.pending}
              onClick={() => navigation.request('reload', onReload)}
            >
              최신 저장 내용 확인
            </Button>
          )}
        </div>
      )}
      {!active && (
        <div className="checklist-banner" role="status">
          <strong>비활성 휴양소는 체크리스트를 설정할 수 없습니다.</strong>
          <p>
            기존 내용은 확인할 수 있습니다. 휴양소를 활성화한 뒤 다시 불러와
            주세요.
          </p>
        </div>
      )}
      {fixed && (
        <div className="checklist-banner" role="status">
          <strong>초기 설정이 완료된 체크리스트입니다.</strong>
          <p>
            입실·퇴실 체크리스트는 생성 후 문구와 활성 여부를 변경할 수
            없습니다.
          </p>
        </div>
      )}
      {versionLimit && (
        <div className="checklist-banner" role="status">
          체크리스트가 수정 가능한 버전 한도에 도달했습니다. 내용을 확인할 수
          있습니다.
        </div>
      )}
      {unchanged && (
        <p className="checklist-banner" role="status">
          변경된 내용이 없습니다.
        </p>
      )}
      {editable ? (
        <>
          {reviewing ? (
            <>
              <ChecklistPreview
                title={values.title.trim()}
                sections={values.sections}
              />
              {original && (
                <p className="checklist-summary">
                  저장 후 상태:{' '}
                  <strong>{values.isActive ? '사용 중' : '사용 중지'}</strong>
                </p>
              )}
              <ChecklistReview
                creating={!original}
                type={type}
                onBack={editAgain}
                onConfirm={save}
                busy={mutation.state.busy}
                disabled={blocked}
              />
            </>
          ) : (
            <form
              onSubmit={(event) => {
                event.preventDefault();
                review();
              }}
              noValidate
            >
              {!original && type !== 'MAINTENANCE' && (
                <div className="checklist-banner">
                  <strong>저장 전에 문구와 순서를 확인해 주세요.</strong>
                  <p>
                    입실·퇴실 체크리스트는 한 번 만들면 수정할 수 없습니다. 다음
                    단계에서 전체 내용을 미리 볼 수 있습니다.
                  </p>
                </div>
              )}
              <ChecklistForm
                values={values}
                onChange={change}
                errors={errors}
                disabled={blocked}
              />
              {original && (
                <div className="checklist-settings">
                  <label>
                    <input
                      type="checkbox"
                      checked={values.isActive}
                      disabled={blocked}
                      onChange={(event) =>
                        change({ ...values, isActive: event.target.checked })
                      }
                    />{' '}
                    정비 체크리스트 사용
                  </label>
                  <p>
                    사용 중지하면 새 정비 체크리스트 작성에 제공되지 않습니다.
                    기존 작성·제출 기록은 유지됩니다.
                  </p>
                </div>
              )}
              <div className="checklist-actions checklist-save-actions">
                <Button
                  id="checklist-review-button"
                  type="submit"
                  disabled={blocked}
                >
                  미리보기 및 저장 확인
                </Button>
              </div>
            </form>
          )}
        </>
      ) : original ? (
        <ChecklistPreview
          title={original.title}
          sections={original.definition.sections}
        />
      ) : (
        <div className="checklist-summary">
          아직 설정된 체크리스트가 없습니다.
        </div>
      )}
    </>
  );
}
