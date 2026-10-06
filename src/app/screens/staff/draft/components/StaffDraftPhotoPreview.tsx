import { useId, useLayoutEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { StaffDraftPhotoViewController } from '../hooks/use-staff-draft-photo-view';

export function StaffDraftPhotoPreview({
  open,
  index,
  filename,
  view,
  onClose,
}: {
  open: boolean;
  index: number;
  filename: string;
  view: StaffDraftPhotoViewController;
  onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  const { preview } = view;
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element || !open) return;
    const previous =
      document.activeElement instanceof HTMLElement
        ? document.activeElement
        : null;
    if (!element.open) element.showModal();
    close.current?.focus();
    return () => {
      if (element.open) element.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
    };
  }, [open]);

  return (
    <dialog
      ref={dialog}
      className="staff-photo-preview"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-filename`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="staff-photo-preview__panel">
        <header className="staff-photo-preview__heading">
          <h2 id={`${id}-title`}>사진 {index + 1}</h2>
          <button
            ref={close}
            type="button"
            className="staff-photo-preview__close"
            onClick={onClose}
            aria-label="사진 미리보기 닫기"
          >
            닫기
          </button>
        </header>
        <div
          className="staff-photo-preview__image"
          aria-busy={preview.status === 'loading'}
        >
          {open && preview.status === 'ready' ? (
            <img
              src={preview.url}
              alt={`첨부 사진 ${index + 1} 확대`}
              referrerPolicy="no-referrer"
              decoding="async"
              onError={() => view.imageFailed(preview)}
            />
          ) : (
            <div className="staff-photo-preview__state" role="status">
              <p>
                {preview.status === 'loading'
                  ? '사진을 불러오고 있습니다.'
                  : preview.status === 'expired'
                    ? '미리보기가 만료되었습니다. 첨부 사진은 유지됩니다.'
                    : preview.status === 'error'
                      ? preview.message
                      : '사진을 다시 열어 주세요.'}
              </p>
              <Button
                disabled={!view.canLoad}
                loading={preview.status === 'loading'}
                onClick={() => {
                  void view.load();
                }}
              >
                다시 보기
              </Button>
            </div>
          )}
        </div>
        <details className="staff-photo-preview__details">
          <summary>파일 정보</summary>
          <p id={`${id}-filename`} className="staff-photo-preview__filename">
            {filename}
          </p>
        </details>
      </div>
    </dialog>
  );
}
