import { useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useAdminNavigationGuard } from '../../hooks/use-admin-navigation-guard';
import { usePropertyOperation } from '../hooks/use-property-operation';
import { formatOperationStayTime } from '../model/property-operation-model';
import '../styles/property-operation.css';

type Props = {
  property: AdminPropertyDto;
  token: string;
  rejectSession: (token: string) => void;
  onClose: () => void;
  onSaved: (property: AdminPropertyDto) => void;
};

export function PropertyOperationDialog({
  property,
  token,
  rejectSession,
  onClose,
  onSaved,
}: Props) {
  const dialog = useRef<HTMLDialogElement>(null);
  const message = useRef<HTMLParagraphElement>(null);
  const { state, save, reload } = usePropertyOperation(
    property.id,
    token,
    rejectSession,
  );
  useAdminNavigationGuard(state.busy);
  const targetActive = !property.isActive;
  const preview = state.preview;
  const alreadyChanged = preview?.property.isActive === targetActive;
  const blocked = !targetActive && !!preview?.blockingStayCount;
  const title = targetActive
    ? '운영을 재개할까요?'
    : '운영 목록에서 제외할까요?';

  useEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus({ preventScroll: true });
    };
  }, []);
  useEffect(() => {
    if (state.message) message.current?.focus();
  }, [state.message]);

  return createPortal(
    <dialog
      ref={dialog}
      className="property-operation-dialog"
      aria-labelledby="property-operation-title"
      aria-describedby="property-operation-description"
      onCancel={(event) => {
        event.preventDefault();
        if (!state.busy) onClose();
      }}
    >
      <header className="property-operation-header">
        <div>
          <span className="property-operation-eyebrow">
            {targetActive ? '운영 재개' : '운영 상태 변경'}
          </span>
          <h2 id="property-operation-title">{title}</h2>
        </div>
        <Button
          className="property-operation-close"
          aria-label="닫기"
          disabled={state.busy}
          onClick={onClose}
        >
          ×
        </Button>
      </header>
      <div
        className="property-operation-content"
        aria-busy={state.loading || state.busy}
      >
        <div className="property-operation-property">
          <strong>{preview?.property.name ?? property.name}</strong>
          <span>{preview?.property.region ?? property.region}</span>
        </div>
        <p
          id="property-operation-description"
          className="property-operation-description"
        >
          {targetActive
            ? '새 일정 등록과 이용객·직원 QR 이용을 다시 시작합니다.'
            : '기존 기록은 보관되며, 새 일정 등록과 이용객·직원 QR 이용이 중지됩니다.'}
        </p>
        {state.loading && (
          <p className="property-operation-feedback" role="status">
            이용 일정을 확인하고 있습니다…
          </p>
        )}
        {state.message && (
          <p
            ref={message}
            tabIndex={-1}
            className="property-operation-feedback property-operation-feedback--error"
            role="alert"
          >
            {state.message}
          </p>
        )}
        {!state.loading &&
          !state.needsRefresh &&
          preview &&
          !alreadyChanged &&
          (targetActive ? (
            <div className="property-operation-restore">
              <dl>
                <div>
                  <dt>담당 직원</dt>
                  <dd>
                    {preview.property.staff?.name ?? '미배정'}
                    {preview.property.staff && !preview.property.staff.isActive
                      ? ' · 비활성'
                      : ''}
                  </dd>
                </div>
              </dl>
              <p>
                기록과 설정은 그대로 유지됩니다. 취소한 일정은 복원되지
                않습니다.
              </p>
              <p>교체하지 않은 휴양소 QR은 다시 사용할 수 있습니다.</p>
            </div>
          ) : blocked ? (
            <section
              className="property-operation-stays"
              aria-labelledby="property-blocking-title"
            >
              <div className="property-operation-stays-heading">
                <h3 id="property-blocking-title">이용 일정 확인이 필요해요</h3>
                <span>
                  {preview.blockingStayCount.toLocaleString('ko-KR')}건
                </span>
              </div>
              <p>일정이 종료되거나 취소된 후 제외할 수 있습니다.</p>
              <ul>
                {preview.stays.map((stay) => (
                  <li key={stay.id}>
                    <Link
                      to={appRoutes.adminStayDetail.replace(':id', stay.id)}
                    >
                      <div className="property-operation-stay-heading">
                        <strong>{stay.guestName}</strong>
                        <span>
                          {Date.parse(stay.checkInAt) <=
                          Date.parse(preview.checkedAt)
                            ? '진행 중'
                            : '예정'}
                        </span>
                        <span aria-hidden="true">→</span>
                      </div>
                      <dl>
                        <div>
                          <dt>입실</dt>
                          <dd>{formatOperationStayTime(stay.checkInAt)}</dd>
                        </div>
                        <div>
                          <dt>퇴실</dt>
                          <dd>{formatOperationStayTime(stay.checkOutAt)}</dd>
                        </div>
                      </dl>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="property-operation-stays-footer">
                <span>예정 시각 · 한국 시간</span>
                <Link
                  to={`${appRoutes.adminStays}?propertyId=${property.id}&status=ACTIVE`}
                >
                  전체 일정 보기 →
                </Link>
              </div>
            </section>
          ) : (
            <p className="property-operation-clear">
              <span aria-hidden="true">✓</span> 진행 중이거나 예정된 일정이
              없습니다.
            </p>
          ))}
        {alreadyChanged && (
          <p className="property-operation-clear" role="status">
            이미 {targetActive ? '운영 중인' : '보관된'} 휴양소입니다.
          </p>
        )}
      </div>
      <footer className="property-operation-footer">
        <Button
          className="admin-button-secondary"
          disabled={state.busy}
          onClick={onClose}
        >
          닫기
        </Button>
        {state.needsRefresh ? (
          <Button onClick={reload}>다시 확인</Button>
        ) : alreadyChanged && preview ? (
          <Button onClick={() => onSaved(preview.property)}>
            목록에서 확인
          </Button>
        ) : blocked ? (
          <Button className="admin-button-secondary" onClick={reload}>
            일정 다시 확인
          </Button>
        ) : (
          <Button
            loading={state.busy}
            disabled={state.loading || !preview}
            onClick={() => {
              void save(targetActive, onSaved);
            }}
          >
            {state.busy ? '저장 중' : targetActive ? '운영 재개' : '보관하기'}
          </Button>
        )}
      </footer>
    </dialog>,
    document.body,
  );
}
