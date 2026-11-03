import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import {
  MAX_ACCESS_VERSION,
  savePropertyAccess,
} from '../../../../features/admin-property-access/admin-property-access-api';
import type {
  AccessCodeField as FieldName,
  AdminPropertyAccessDto,
} from '../../../../features/admin-property-access/admin-property-access.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { AdminBackButton } from '../../components/AdminBackButton';
import { useAccessNavigation } from '../hooks/use-access-navigation';
import { useAccessSave } from '../hooks/use-access-save';
import {
  accessFormDirty,
  buildAccessInput,
  initialAccessValues,
  validateAccessForm,
  type AccessFormErrors,
  type AccessFormValues,
  type CodeEdit,
} from '../model/property-access-model';
import { AccessCodeField } from './AccessCodeField';
import { AccessSettingsReview } from './AccessSettingsReview';

type Props = {
  data: AdminPropertyAccessDto;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (data: AdminPropertyAccessDto) => void;
  onEditing: () => void;
  onReload: () => void;
};

export function AccessSettingsEditor({
  data,
  token,
  rejectSession,
  onSaved,
  onEditing,
  onReload,
}: Props) {
  const navigate = useNavigate();
  const [values, setValues] = useState(() => initialAccessValues(data));
  const currentValues = useRef(values);
  const [errors, setErrors] = useState<AccessFormErrors>({});
  const [reviewing, setReviewing] = useState(false);
  const [conflict, setConflict] = useState(false);
  const mutation = useAccessSave(token, rejectSession);
  const dirty = accessFormDirty(data, values);
  const hasEdits = () =>
    Object.values(currentValues.current.codes).some(
      (edit) => edit.action !== 'keep',
    ) || currentValues.current.roomMode !== data.settings.roomMode;
  const navigation = useAccessNavigation(
    Object.values(values.codes).some((edit) => edit.action !== 'keep') ||
      values.roomMode !== data.settings.roomMode ||
      !!mutation.state.blocked ||
      conflict,
    mutation.state.busy,
    () => hasEdits() || mutation.hasPendingWork() || conflict,
  );
  const blocked =
    mutation.state.busy ||
    !!mutation.state.blocked ||
    conflict ||
    !!navigation.pending;
  const versionLimit = data.settings.version >= MAX_ACCESS_VERSION;
  const notice = useRef<HTMLDivElement>(null);
  const leaveNotice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (conflict || mutation.state.message) notice.current?.focus();
  }, [conflict, mutation.state.message]);
  useEffect(() => {
    if (navigation.pending) leaveNotice.current?.focus();
  }, [navigation.pending]);

  function change(next: AccessFormValues) {
    if (blocked || reviewing || versionLimit) return;
    currentValues.current = next;
    setValues(next);
    setErrors({});
    mutation.clearError();
    onEditing();
  }
  function changeCode(field: FieldName, edit: CodeEdit) {
    change({ ...values, codes: { ...values.codes, [field]: edit } });
  }
  function review() {
    if (blocked || reviewing || versionLimit) return;
    const nextErrors = validateAccessForm(data, values);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() => {
        const id = nextErrors.roomMode
          ? 'access-room-mode'
          : `access-${Object.keys(nextErrors)[0]}`;
        (
          document.getElementById(id) ?? document.getElementById(`${id}-field`)
        )?.focus();
      });
      return;
    }
    if (buildAccessInput(data, values)) setReviewing(true);
  }
  function save() {
    if (blocked || !reviewing || versionLimit) return;
    const input = buildAccessInput(data, values);
    if (!input) return;
    void mutation.save(
      (signal) => savePropertyAccess(data.property.id, input, token, signal),
      onSaved,
    );
  }
  function editAgain() {
    if (mutation.state.busy) return;
    setReviewing(false);
    requestAnimationFrame(() =>
      document.getElementById('access-save')?.focus(),
    );
  }
  const codeProps = {
    propertyId: data.property.id,
    version: data.settings.version,
    token,
    rejectSession,
    onConflict: () => setConflict(true),
    disabled: blocked || reviewing,
    readOnly: versionLimit,
  };
  const propertyUrl = appRoutes.adminPropertyDetail.replace(
    ':id',
    data.property.id,
  );

  return (
    <>
      <header className="access-heading">
        <div className="access-heading__identity">
          <AdminBackButton
            fallback={propertyUrl}
            label="휴양소 정보로 돌아가기"
            disabled={mutation.state.busy || !!navigation.pending}
            onBack={() =>
              navigation.request('return', () => navigate(propertyUrl))
            }
          />
          <div>
            <h1>출입 비밀번호</h1>
            <p>{data.property.name}</p>
          </div>
        </div>
        <Button
          className="admin-button-secondary access-refresh"
          disabled={mutation.state.busy || !!navigation.pending}
          aria-label="출입 설정 새로고침"
          onClick={() => navigation.request('reload', onReload)}
        >
          <svg viewBox="0 0 24 24" aria-hidden="true" fill="none">
            <path d="M20 5v5h-5M4 19v-5h5M5.6 8a7 7 0 0 1 11.5-3.1L20 10M4 14l2.9 5.1A7 7 0 0 0 18.4 16" />
          </svg>
        </Button>
      </header>
      <div className="access-meta">
        <span className="access-meta__private">
          <svg viewBox="0 0 20 20" aria-hidden="true" fill="none">
            <rect x="4" y="8" width="12" height="9" rx="2" />
            <path d="M7 8V5a3 3 0 1 1 6 0v3m-3 3v3" />
          </svg>
          관리자 설정
        </span>
        <span>
          {data.settings.version
            ? `저장된 설정 · 버전 ${data.settings.version}`
            : '설정 전'}
          {!data.property.isActive && ' · 보관 중'}
        </span>
      </div>
      {navigation.pending && (
        <div
          className="access-notice"
          ref={leaveNotice}
          tabIndex={-1}
          role="alertdialog"
          aria-labelledby="access-leave-title"
          aria-describedby="access-leave-description"
          onKeyDown={(event) => {
            if (event.key === 'Escape') {
              event.preventDefault();
              navigation.keep();
            }
          }}
        >
          <h2 id="access-leave-title">작성 중인 내용을 버릴까요?</h2>
          <p id="access-leave-description">저장하지 않은 입력이 사라집니다.</p>
          <div className="access-actions">
            <Button
              className="admin-button-secondary"
              onClick={navigation.keep}
            >
              계속 작성
            </Button>
            <Button onClick={navigation.proceed}>
              {navigation.pending === 'reload'
                ? '버리고 새로고침'
                : '버리고 돌아가기'}
            </Button>
          </div>
        </div>
      )}
      {(conflict || mutation.state.message) && (
        <div
          className="access-notice access-notice--error"
          tabIndex={-1}
          role="alert"
          ref={notice}
        >
          <p>
            {conflict
              ? '저장된 설정이 변경되었습니다. 최신 설정을 다시 불러와 주세요.'
              : mutation.state.message}
          </p>
          {(conflict || mutation.state.blocked) && (
            <Button
              className="admin-button-secondary"
              disabled={!!navigation.pending}
              onClick={() => navigation.request('reload', onReload)}
            >
              최신 설정 불러오기
            </Button>
          )}
        </div>
      )}
      {versionLimit && (
        <p className="access-notice" role="status">
          더 이상 수정할 수 없는 버전입니다. 저장된 비밀번호는 확인할 수
          있습니다.
        </p>
      )}
      <form
        onSubmit={(event) => {
          event.preventDefault();
          review();
        }}
        noValidate
      >
        <div className="access-cards">
          <section
            className="access-card"
            aria-labelledby="access-entrance-title"
          >
            <div className="access-card__heading">
              <span className="access-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M4 21V4h16v17M9 21V9h6v12M2 21h20M7 6h2m6 0h2m-5 8h1" />
                </svg>
              </span>
              <div>
                <h2 id="access-entrance-title">공동현관</h2>
                <p>공동현관이 있을 때 입력하세요.</p>
              </div>
            </div>
            <AccessCodeField
              {...codeProps}
              field="entranceCode"
              kind="ENTRANCE"
              saved={data.settings.hasEntranceCode}
              edit={values.codes.entranceCode}
              onChange={(edit) => changeCode('entranceCode', edit)}
              error={errors.entranceCode}
            />
          </section>
          <section className="access-card" aria-labelledby="access-room-title">
            <div className="access-card__heading">
              <span className="access-card__icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none">
                  <path d="M5 21V3h14v18M3 21h18M14 12h1" />
                </svg>
              </span>
              <div>
                <h2 id="access-room-title">객실 출입문</h2>
                <p>휴양소의 비밀번호 방식을 선택하세요.</p>
              </div>
            </div>
            <fieldset
              className="access-mode"
              disabled={blocked || reviewing || versionLimit}
              aria-describedby={
                errors.roomMode ? 'access-mode-error' : undefined
              }
            >
              <legend>비밀번호 방식</legend>
              <div className="access-mode__options">
                {(
                  [
                    {
                      value: 'ROTATING',
                      title: '이용객마다 변경',
                      description: '예약마다 다른 번호',
                    },
                    {
                      value: 'FIXED',
                      title: '고정 사용',
                      description: '같은 번호 유지',
                    },
                  ] as const
                ).map((option, index) => (
                  <label
                    className="access-mode__option"
                    key={option.value}
                    data-selected={values.roomMode === option.value}
                  >
                    <input
                      id={index === 0 ? 'access-room-mode' : undefined}
                      name="room-mode"
                      type="radio"
                      value={option.value}
                      checked={values.roomMode === option.value}
                      onChange={() =>
                        change({ ...values, roomMode: option.value })
                      }
                    />
                    <span>
                      <strong>{option.title}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
            </fieldset>
            {errors.roomMode && (
              <p
                className="access-field-error"
                id="access-mode-error"
                role="alert"
              >
                {errors.roomMode}
              </p>
            )}
            {values.roomMode === 'FIXED' && (
              <AccessCodeField
                key="fixed"
                {...codeProps}
                field="fixedRoomCode"
                kind="FIXED_ROOM"
                saved={data.settings.hasFixedRoomCode}
                edit={values.codes.fixedRoomCode}
                onChange={(edit) => changeCode('fixedRoomCode', edit)}
                error={errors.fixedRoomCode}
              />
            )}
            {values.roomMode === 'ROTATING' && (
              <>
                <AccessCodeField
                  key="vacancy"
                  {...codeProps}
                  field="vacancyCode"
                  kind="VACANCY"
                  saved={data.settings.hasVacancyCode}
                  edit={values.codes.vacancyCode}
                  onChange={(edit) => changeCode('vacancyCode', edit)}
                  error={errors.vacancyCode}
                />
                <p className="access-help">
                  다음 예약이 없을 때 사용할 번호입니다. 나중에 입력해도 됩니다.
                </p>
              </>
            )}
            {values.roomMode &&
              values.roomMode !== data.settings.roomMode &&
              data.settings.roomMode !== null && (
                <p className="access-help">
                  이전 방식에 저장된 번호는 보관됩니다.
                </p>
              )}
          </section>
        </div>
        {!reviewing && (
          <footer className="access-save-bar">
            <p>저장해도 실제 도어락 비밀번호는 바뀌지 않습니다.</p>
            <Button
              type="submit"
              id="access-save"
              disabled={blocked || versionLimit || !dirty}
            >
              변경 내용 확인
            </Button>
          </footer>
        )}
      </form>
      {reviewing && (
        <AccessSettingsReview
          data={data}
          values={values}
          busy={mutation.state.busy}
          blocked={blocked}
          onBack={editAgain}
          onSave={save}
        />
      )}
    </>
  );
}
