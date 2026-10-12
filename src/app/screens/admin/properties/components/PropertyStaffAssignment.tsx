import { useEffect, useRef, useState, type MouseEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
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
  returnUrl,
}: {
  property: AdminPropertyDto;
  token: string;
  rejectSession: (token: string) => void;
  onSaved: (property: AdminPropertyDto) => void;
  onReload: () => void;
  returnUrl: string;
}) {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<StaffSelection>(
    property.staff
      ? { id: property.staff.id, name: property.staff.name }
      : null,
  );
  const currentSelection = useRef(selected);
  const [confirming, setConfirming] = useState(false);
  const [leaving, setLeaving] = useState<'return' | 'reload' | null>(null);
  const confirmation = useRef<HTMLDivElement>(null);
  const discard = useRef<HTMLDivElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  const returnFocus = useRef<HTMLElement | null>(null);
  const reviewFocus = useRef<HTMLButtonElement | null>(null);
  const mutation = usePropertyStaffSave(
    property.id,
    token,
    rejectSession,
    onSaved,
  );
  const dirty = (selected?.id ?? null) !== property.staffUserId;
  const runConfirmed = useAdminNavigationGuard(
    () =>
      (currentSelection.current?.id ?? null) !== property.staffUserId ||
      mutation.hasPendingWork() ||
      mutation.state.busy ||
      mutation.state.blocked,
  );
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

  function select(next: StaffSelection) {
    currentSelection.current = next;
    setSelected(next);
  }

  function review(event: MouseEvent<HTMLButtonElement>) {
    if (disabled || !dirty) return;
    reviewFocus.current = event.currentTarget;
    setConfirming(true);
  }

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
    else navigate(returnUrl);
  }

  return (
    <>
      <header className="properties-heading">
        <div>
          <p className="properties-heading__eyebrow">담당 직원 관리</p>
          <h1>{property.name}</h1>
          <p>
            {property.region || '지역 미등록'} ·{' '}
            {property.isActive ? '활성 휴양소' : '비활성 휴양소'}
          </p>
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
              onClick={() => runConfirmed(() => perform(leaving))}
            >
              선택 비우고 계속
            </Button>
          </div>
        </div>
      )}
      <div className="property-staff__workspace">
        <div className="property-staff__review">
          <section
            className="property-staff__selection"
            aria-labelledby="assignment-selection-title"
          >
            <h2 id="assignment-selection-title">배정 내용 확인</h2>
            <dl className="property-staff__comparison">
              <div>
                <dt>현재 저장된 담당 직원</dt>
                <dd>
                  {property.staff?.name ?? '미배정'}
                  {property.staff && !property.staff.isActive
                    ? ' · 비활성'
                    : ''}
                </dd>
              </div>
              <div className={dirty ? 'property-staff__changed' : undefined}>
                <dt>선택한 담당 직원</dt>
                <dd aria-live="polite">{selected?.name ?? '미배정'}</dd>
              </div>
            </dl>
            <p className="property-staff__save-status" role="status">
              {dirty
                ? '아직 저장하지 않았습니다. 변경 내용을 확인해 주세요.'
                : '현재 저장된 배정과 같습니다.'}
            </p>
            <div className="property-staff__review-actions">
              <Button
                id="assignment-review"
                disabled={disabled || !dirty}
                loading={mutation.state.busy}
                onClick={review}
              >
                배정 변경 확인
              </Button>
              <Button
                className="admin-button-secondary"
                disabled={disabled || selected === null}
                onClick={() => select(null)}
              >
                배정 해제 선택
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
                {property.staff?.name ?? '미배정'} →{' '}
                {selected?.name ?? '미배정'}
              </p>
              <p id="assignment-confirm-description">
                변경하면 이전 담당자가 작성 중이던 정비 기록에 계속 접근할 수
                없을 수 있습니다. 제출된 기록은 유지됩니다.
              </p>
              <div className="properties-heading__actions">
                <Button
                  className="admin-button-secondary"
                  onClick={() => {
                    setConfirming(false);
                    requestAnimationFrame(() => {
                      if (reviewFocus.current?.isConnected)
                        reviewFocus.current.focus();
                      else
                        document.getElementById('assignment-review')?.focus();
                    });
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
        </div>
        {property.isActive && (
          <PropertyStaffCandidates
            token={token}
            rejectSession={rejectSession}
            disabled={disabled}
            selected={selected}
            currentStaffId={property.staffUserId}
            onSelect={select}
            onReview={review}
          />
        )}
      </div>
    </>
  );
}
