import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { usePropertyStaffSave } from '../hooks/use-property-staff-save';
import {
  PropertyStaffCandidates,
  type StaffSelection,
} from './PropertyStaffCandidates';

export function PropertyStaffAssignment({
  property,
  token,
  rejectSession,
  onSaved,
  onReload,
}: {
  property: AdminPropertyDto;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (property: AdminPropertyDto) => void;
  onReload: () => void;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StaffSelection>(
    property.staff
      ? { id: property.staff.id, name: property.staff.name }
      : null,
  );
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState<'return' | 'reload' | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const discard = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const mutation = usePropertyStaffSave(
    property.id,
    token,
    rejectSession,
    onSaved,
  );
  const dirty = (selected?.id ?? null) !== property.staffUserId;
  const disabled =
    mutation.state.busy ||
    mutation.state.blocked ||
    confirming ||
    leaving !== null;

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  useEffect(() => {
    if (confirming) confirmation.current?.focus();
  }, [confirming]);
  useEffect(() => {
    if (leaving) discard.current?.focus();
  }, [leaving]);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);
  useEffect(() => {
    if (!dirty && !mutation.state.busy) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty, mutation.state.busy]);

  function leave(action: 'return' | 'reload') {
    if (mutation.state.busy || confirming) return;
    if (dirty) {
      returnFocus.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setLeaving(action);
    } else perform(action);
  }
  function perform(action: 'return' | 'reload') {
    if (action === 'reload') onReload();
    else navigate(appRoutes.adminPropertyDetail.replace(':id', property.id));
  }

  return (
    <>
      <header className="properties-heading">
        <div>
          <p className="properties-heading__eyebrow">담당 직원 관리</p>
          <h1>{property.name}</h1>
          <p>휴양소의 정비 담당 직원을 배정하거나 변경하세요.</p>
        </div>
        <div className="properties-heading__actions">
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || confirming || !!leaving}
            onClick={() => leave('return')}
          >
            휴양소 정보로 돌아가기
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || confirming || !!leaving}
            onClick={() => leave('reload')}
          >
            최신 배정 확인
          </Button>
        </div>
      </header>
      <section className="properties-summary" aria-label="현재 담당 직원">
        <dl>
          <div>
            <dt>현재 담당 직원</dt>
            <dd>
              {property.staff?.name ?? '미배정'}
              {property.staff && !property.staff.isActive ? ' · 비활성' : ''}
            </dd>
          </div>
          <div>
            <dt>휴양소 상태</dt>
            <dd>{property.isActive ? '활성' : '비활성'}</dd>
          </div>
        </dl>
      </section>
      {!property.isActive && (
        <p className="properties-banner">
          비활성 휴양소는 기존 배정만 해제할 수 있습니다. 새 직원을 배정하려면
          휴양소를 먼저 활성화해 주세요.
        </p>
      )}
      {mutation.state.message && (
        <div
          ref={notice}
          tabIndex={-1}
          role="alert"
          className="properties-banner properties-banner--error"
        >
          <p>{mutation.state.message}</p>
          {mutation.state.blocked && (
            <Button
              className="admin-button-secondary"
              disabled={!!leaving}
              onClick={() => leave('reload')}
            >
              저장된 최신 배정 확인
            </Button>
          )}
        </div>
      )}
      {leaving && (
        <div
          className="properties-banner"
          ref={discard}
          tabIndex={-1}
          role="alertdialog"
          aria-labelledby="assignment-discard-title"
          aria-describedby="assignment-discard-description"
        >
          <h2 id="assignment-discard-title">선택한 직원을 비울까요?</h2>
          <p id="assignment-discard-description">
            아직 저장하지 않은 선택이 사라집니다.
          </p>
          <div className="properties-heading__actions">
            <Button
              onClick={() => {
                setLeaving(null);
                requestAnimationFrame(
                  () =>
                    returnFocus.current?.isConnected &&
                    returnFocus.current.focus(),
                );
              }}
            >
              계속 확인
            </Button>
            <Button
              className="admin-button-secondary"
              onClick={() => perform(leaving)}
            >
              선택 비우고 계속
            </Button>
          </div>
        </div>
      )}
      {property.isActive && (
        <PropertyStaffCandidates
          token={token}
          rejectSession={rejectSession}
          disabled={disabled}
          selected={selected}
          onSelect={setSelected}
        />
      )}
      <section
        className="property-staff__selection"
        aria-labelledby="assignment-selection-title"
      >
        <h2 id="assignment-selection-title">변경할 담당 직원</h2>
        <p className="property-staff__selected-name" aria-live="polite">
          {selected?.name ?? '미배정'}
        </p>
        <p>
          {dirty
            ? '아래에서 변경 내용을 확인한 뒤 저장해 주세요.'
            : '현재 배정과 동일합니다.'}
        </p>
        <div className="properties-heading__actions">
          <Button
            className="admin-button-secondary"
            disabled={disabled || selected === null}
            onClick={() => setSelected(null)}
          >
            배정 해제 선택
          </Button>
          <Button
            id="assignment-review"
            disabled={disabled || !dirty}
            loading={mutation.state.busy}
            onClick={() => setConfirming(true)}
          >
            배정 변경 확인
          </Button>
        </div>
      </section>
      {confirming && (
        <div
          className="properties-banner"
          ref={confirmation}
          tabIndex={-1}
          role="alertdialog"
          aria-labelledby="assignment-confirm-title"
          aria-describedby="assignment-confirm-description"
        >
          <h2 id="assignment-confirm-title">
            {selected
              ? '담당 직원을 변경할까요?'
              : '담당 직원 배정을 해제할까요?'}
          </h2>
          <p>
            <strong>{property.name}</strong> ·{' '}
            {property.staff?.name ?? '미배정'} → {selected?.name ?? '미배정'}
          </p>
          <p id="assignment-confirm-description">
            변경하면 이전 담당자가 작성 중이던 정비 기록에 계속 접근할 수 없을
            수 있습니다. 제출된 기록은 유지됩니다.
          </p>
          <div className="properties-heading__actions">
            <Button
              className="admin-button-secondary"
              onClick={() => {
                setConfirming(false);
                requestAnimationFrame(() =>
                  document.getElementById('assignment-review')?.focus(),
                );
              }}
            >
              선택으로 돌아가기
            </Button>
            <Button
              onClick={() => {
                if (!dirty || mutation.state.busy || mutation.state.blocked)
                  return;
                setConfirming(false);
                void mutation.save(selected?.id ?? null);
              }}
            >
              변경 저장
            </Button>
          </div>
        </div>
      )}
    </>
  );
}
