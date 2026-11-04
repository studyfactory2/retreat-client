import {
  useId,
  useLayoutEffect,
  useRef,
  type ReactNode,
  type PointerEvent,
  type MouseEvent,
} from 'react';
import { StayDetailIcon } from './StayDetailIcon';

export function StayDetailPanel({
  title,
  wide,
  busy,
  onClose,
  children,
}: {
  title: string;
  wide: boolean;
  busy: boolean;
  onClose: () => void;
  children: ReactNode;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const previous = useRef<Element | null>(null);
  const backdrop = useRef(false);
  const id = useId();
  useLayoutEffect(() => {
    previous.current = document.activeElement;
    return () => {
      queueMicrotask(() => {
        const target = previous.current;
        if (
          target instanceof HTMLElement &&
          target.isConnected &&
          !target.matches(':disabled') &&
          !document.querySelector('dialog:modal')
        )
          target.focus({ preventScroll: true });
      });
    };
  }, []);
  useLayoutEffect(() => {
    const el = dialog.current;
    if (!el) return;
    // One stable subtree: resizing must not reset an in-progress confirmation.
    const focused = el.contains(document.activeElement)
      ? document.activeElement
      : null;
    el.close();
    if (wide) el.show();
    else el.showModal();
    if (focused instanceof HTMLElement) focused.focus({ preventScroll: true });
    else close.current?.focus({ preventScroll: true });
    if (wide) return () => el.close();
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      el.close();
      document.body.style.overflow = overflow;
    };
  }, [wide]);

  function outside(
    event: PointerEvent<HTMLDialogElement> | MouseEvent<HTMLDialogElement>,
  ) {
    const box = event.currentTarget.getBoundingClientRect();
    return (
      event.target === event.currentTarget &&
      (event.clientX < box.left ||
        event.clientX > box.right ||
        event.clientY < box.top ||
        event.clientY > box.bottom)
    );
  }
  return (
    <dialog
      ref={dialog}
      id="stay-detail-panel"
      className={`stay-detail-panel${wide ? ' stay-detail-panel--wide' : ''}`}
      aria-labelledby={id}
      onCancel={(event) => {
        event.preventDefault();
        if (!busy) onClose();
      }}
      onPointerDown={(event) => {
        backdrop.current = outside(event);
      }}
      onClick={(event) => {
        if (backdrop.current && outside(event) && !busy) onClose();
        backdrop.current = false;
      }}
    >
      <header className="stay-detail-panel__heading">
        <h2 id={id}>{title}</h2>
        <button
          ref={close}
          type="button"
          className="ui-button admin-button-ghost stay-detail-panel__close"
          aria-label="상세 패널 닫기"
          disabled={busy}
          onClick={onClose}
        >
          <StayDetailIcon name="close" />
        </button>
      </header>
      <div className="stay-detail-panel__body">{children}</div>
    </dialog>
  );
}
