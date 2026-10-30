import { useId, useLayoutEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import type { QrFlow } from '../../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/qr-drawer.css';

export function QrDrawer({
  flow,
  propertyName,
  busy,
  refreshDisabled,
  onClose,
  onRefresh,
  children,
}: {
  flow: QrFlow;
  propertyName: string;
  busy: boolean;
  refreshDisabled: boolean;
  onClose: () => void;
  onRefresh: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const backdropPress = useRef(false);
  const titleId = useId();
  useLayoutEffect(() => {
    const element = dialog.current;
    const previous = document.activeElement;
    const workspace = document.querySelector<HTMLElement>('.property-qr');
    const overflow = document.body.style.overflow;
    element?.showModal();
    document.body.style.overflow = 'hidden';
    return () => {
      element?.close();
      document.body.style.overflow = overflow;
      // Closing during retrieval clears openingFlow in this same commit. Wait
      // until the row is enabled again before restoring its keyboard focus.
      queueMicrotask(() => {
        if (!workspace?.isConnected || document.querySelector('dialog[open]'))
          return;
        const candidates = [
          workspace.querySelector<HTMLElement>(`#qr-${flow}-select`),
          previous instanceof HTMLElement && workspace.contains(previous)
            ? previous
            : null,
          workspace.querySelector<HTMLElement>('.admin-back-button'),
          workspace.querySelector<HTMLElement>('.property-qr-refresh'),
        ];
        const target = candidates.find(
          (candidate) =>
            candidate?.isConnected &&
            !candidate.matches(':disabled, [aria-disabled="true"]') &&
            !candidate.closest('[inert]') &&
            candidate.getClientRects().length > 0,
        );
        target?.focus({ preventScroll: true });
      });
    };
  }, [flow]);
  return createPortal(
    <dialog
      ref={dialog}
      className="property-qr-drawer"
      aria-labelledby={titleId}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onPointerDown={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        backdropPress.current =
          event.target === event.currentTarget &&
          (event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom);
      }}
      onClick={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        if (
          backdropPress.current &&
          event.target === event.currentTarget &&
          !busy &&
          (event.clientX < box.left ||
            event.clientX > box.right ||
            event.clientY < box.top ||
            event.clientY > box.bottom)
        )
          onClose();
        backdropPress.current = false;
      }}
    >
      <header className="property-qr-drawer__heading">
        <div>
          <h2 id={titleId}>{flow === 'GUEST' ? '이용객 QR' : '직원 QR'}</h2>
          <p>{propertyName}</p>
        </div>
        <div className="property-qr-drawer__actions">
          <Button
            className="admin-button-ghost property-qr-drawer__close"
            aria-label="QR 상태 새로고침"
            disabled={refreshDisabled}
            onClick={onRefresh}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M20 7v5h-5M4 17v-5h5M6.1 7a7 7 0 0 1 11.6-1.5L20 8M4 16l2.3 2.5A7 7 0 0 0 17.9 17" />
            </svg>
          </Button>
          <Button
            autoFocus
            className="admin-button-ghost property-qr-drawer__close"
            aria-label="QR 닫기"
            disabled={busy}
            onClick={onClose}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="m6 6 12 12M18 6 6 18" />
            </svg>
          </Button>
        </div>
      </header>
      <div className="property-qr-drawer__body">{children}</div>
    </dialog>,
    document.body,
  );
}
