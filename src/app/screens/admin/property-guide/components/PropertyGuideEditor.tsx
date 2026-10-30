import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../../../../core/api/api-error';
import { appRoutes } from '../../../../core/router/routes';
import { saveAdminPropertyGuide } from '../../../../features/admin-property-guides/admin-property-guide-api';
import type { AdminPropertyGuideDto } from '../../../../features/admin-property-guides/admin-property-guide.types';
import { MAX_WRITABLE_GUIDE_VERSION } from '../../../../features/admin-property-guides/admin-property-guide-validation';
import { Button } from '../../../../shared/ui/Button/Button';
import { useGuideNavigation } from '../hooks/use-guide-navigation';
import { useGuideSave } from '../hooks/use-guide-save';
import {
  buildGuideInput,
  createGuideValues,
  normalizeGuideValues,
  validateGuideForm,
  type GuideFormErrors,
  type GuideFormValues,
} from '../model/property-guide-model';
import { GuideNavigationNotice } from './GuideNavigationNotice';
import { PropertyGuideForm } from './PropertyGuideForm';
import { PropertyGuidePreview } from './PropertyGuidePreview';
import { PropertyGuideReview } from './PropertyGuideReview';

type Props = {
  data: AdminPropertyGuideDto;
  token: string;
  actorId: string;
  rejectSession: (token: string) => void;
  onSaved: (data: AdminPropertyGuideDto) => void;
  onEditing: () => void;
  onReload: () => void;
};

export function PropertyGuideEditor({
  data,
  token,
  actorId,
  rejectSession,
  onSaved,
  onEditing,
  onReload,
}: Props) {
  const navigate = useNavigate();
  const [initial] = useState(() => createGuideValues(data));
  const [values, setValues] = useState(initial);
  const currentValues = useRef(initial);
  const [errors, setErrors] = useState<GuideFormErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [unchanged, setUnchanged] = useState(false);
  const mutation = useGuideSave(token, rejectSession);
  const dirty =
    values.title !== initial.title ||
    values.content !== initial.content ||
    values.isPublished !== initial.isPublished;
  const navigation = useGuideNavigation(
    dirty,
    mutation.state.busy,
    () =>
      currentValues.current.title !== initial.title ||
      currentValues.current.content !== initial.content ||
      currentValues.current.isPublished !== initial.isPublished ||
      mutation.hasPendingWork() ||
      mutation.state.busy ||
      !!mutation.state.blocked,
  );
  const blocked =
    mutation.state.busy || !!mutation.state.blocked || !!navigation.pending;
  const versionLimit = (data.guide?.version ?? 0) > MAX_WRITABLE_GUIDE_VERSION;
  const preview = normalizeGuideValues(values);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);

  function change(next: GuideFormValues) {
    if (blocked || reviewing || versionLimit) return;
    onEditing();
    mutation.clearError();
    currentValues.current = next;
    setValues(next);
    setErrors({});
    setUnchanged(false);
  }
  function review() {
    if (blocked || reviewing || versionLimit) return;
    const validation = validateGuideForm(values);
    setErrors(validation);
    if (Object.keys(validation).length) {
      requestAnimationFrame(() =>
        document
          .getElementById(validation.title ? 'guide-title' : 'guide-content')
          ?.focus(),
      );
      return;
    }
    if (!buildGuideInput(data, values)) {
      setUnchanged(true);
      return;
    }
    setReviewing(true);
  }
  function save() {
    if (
      !reviewing ||
      blocked ||
      versionLimit ||
      Object.keys(validateGuideForm(values)).length
    )
      return;
    const input = buildGuideInput(data, values);
    if (!input) return;
    void mutation.save(async (signal) => {
      const saved = await saveAdminPropertyGuide(
        data.property.id,
        input,
        token,
        signal,
      );
      if (
        !saved.guide ||
        saved.guide.updatedByUserId !== actorId ||
        (data.guide &&
          (saved.guide.createdAt !== data.guide.createdAt ||
            Date.parse(saved.guide.updatedAt) <=
              Date.parse(data.guide.updatedAt)))
      )
        throw new ApiRequestError(
          '저장된 이용 안내를 확인할 수 없습니다.',
          200,
          'INVALID_PROPERTY_GUIDE_RESPONSE',
        );
      return saved;
    }, onSaved);
  }
  function editAgain() {
    if (mutation.state.busy) return;
    setReviewing(false);
    requestAnimationFrame(() =>
      document.getElementById('guide-review-button')?.focus(),
    );
  }

  function openPreview() {
    setPreviewOpen(true);
    requestAnimationFrame(() => {
      const panel = document.getElementById('guide-live-preview');
      panel?.focus({ preventScroll: true });
      panel?.scrollIntoView({ block: 'start' });
    });
  }

  function closePreview() {
    setPreviewOpen(false);
    requestAnimationFrame(() => {
      const field = document.getElementById('guide-content');
      const target =
        field && !field.matches(':disabled')
          ? field
          : document.getElementById('guide-preview-button');
      target?.focus({ preventScroll: true });
      target?.scrollIntoView({ block: 'start' });
    });
  }

  return (
    <>
      <header className="property-guide-heading">
        <div className="property-guide-heading__identity">
          <p className="property-guide-heading__eyebrow">
            {data.property.name}
          </p>
          <div className="property-guide-heading__title">
            <h1>이용 안내 관리</h1>
            <span
              className="property-guide-saved-state"
              aria-label="현재 저장 상태"
            >
              {data.guide
                ? data.guide.isPublished
                  ? '공개'
                  : '비공개'
                : '미등록'}
              {data.guide && <> · 버전 {data.guide.version}</>}
            </span>
          </div>
        </div>
        <div className="property-guide-actions">
          <Button
            id="guide-preview-button"
            type="button"
            className="admin-button-secondary property-guide-preview-link"
            aria-controls="guide-live-preview"
            aria-expanded={previewOpen}
            onClick={openPreview}
          >
            미리보기
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || !!navigation.pending}
            onClick={() =>
              navigation.request('return', () =>
                navigate(
                  appRoutes.adminPropertyDetail.replace(
                    ':id',
                    data.property.id,
                  ),
                ),
              )
            }
          >
            휴양소 정보
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || !!navigation.pending}
            onClick={() => navigation.request('reload', onReload)}
          >
            새로고침
          </Button>
        </div>
      </header>
      {!data.property.isActive && (
        <div className="property-guide-banner" role="status">
          <strong>비활성 휴양소의 안내를 준비하고 있습니다.</strong>
          <p>
            내용과 공개 여부를 저장할 수 있지만 휴양소를 활성화하기 전에는
            이용객이 안내를 볼 수 없습니다.
          </p>
        </div>
      )}
      {versionLimit && (
        <p className="property-guide-banner" role="status">
          안내문이 수정 가능한 버전 한도에 도달했습니다. 저장된 내용을 확인할 수
          있습니다.
        </p>
      )}
      {navigation.pending && (
        <GuideNavigationNotice
          reload={navigation.pending === 'reload'}
          onKeep={navigation.keep}
          onProceed={navigation.proceed}
        />
      )}
      {mutation.state.message && (
        <div
          className="property-guide-banner property-guide-banner--error"
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
              최신 안내 다시 확인
            </Button>
          )}
        </div>
      )}
      {unchanged && (
        <p className="property-guide-banner" role="status">
          변경된 내용이 없습니다.
        </p>
      )}
      <div className="property-guide-editor-layout">
        <div className="property-guide-editor-main">
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              review();
            }}
          >
            <PropertyGuideForm
              values={values}
              onChange={change}
              errors={errors}
              disabled={blocked || reviewing || versionLimit}
              propertyActive={data.property.isActive}
            />
            {!reviewing && !versionLimit && (
              <div className="property-guide-actions property-guide-save-actions">
                <Button
                  id="guide-review-button"
                  type="submit"
                  disabled={blocked}
                >
                  저장
                </Button>
              </div>
            )}
          </form>
          {reviewing && (
            <PropertyGuideReview
              isPublished={values.isPublished}
              wasPublished={data.guide?.isPublished ?? false}
              propertyActive={data.property.isActive}
              onBack={editAgain}
              onConfirm={save}
              busy={mutation.state.busy}
              disabled={blocked}
            />
          )}
        </div>
        <aside
          className="property-guide-editor-sidebar"
          aria-label="이용 안내 미리보기"
          data-open={previewOpen}
          onFocusCapture={() => setPreviewOpen(true)}
        >
          <PropertyGuidePreview
            {...preview}
            propertyName={data.property.name}
            propertyActive={data.property.isActive}
            onClose={closePreview}
          />
        </aside>
      </div>
    </>
  );
}
