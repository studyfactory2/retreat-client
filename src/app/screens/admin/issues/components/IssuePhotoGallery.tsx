import { useEffect, useId, useLayoutEffect, useRef, useState, type RefObject } from 'react';
import type { AdminIssueEventDto, AdminIssuePhotoDto } from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useIssuePhoto } from '../hooks/use-issue-photo';
import { issueEventLabel, issueTime } from '../model/issue-presentation';

type Props = {
  event: AdminIssueEventDto;
  photo: AdminIssuePhotoDto;
  index: number;
  token: string;
  rejectSession: (token: string) => void;
};

export function IssuePhotoGallery(props: Props) {
  const tile = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(() => typeof IntersectionObserver === 'undefined');
  useEffect(() => {
    const element = tile.current;
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        setVisible(true);
        observer.disconnect();
      }
    }, { rootMargin: '120px' });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return (
    <li ref={tile} className="issue-evidence-photo">
      {visible ? <PhotoContent {...props} /> : <div className="issue-evidence-photo__placeholder" aria-hidden="true">사진 {props.index + 1}</div>}
    </li>
  );
}

function PhotoContent({ event, photo, index, token, rejectSession }: Props) {
  const view = useIssuePhoto(event.issueId, event.id, photo.id, token, rejectSession);
  const [open, setOpen] = useState(false);
  const caption = useRef<HTMLDivElement>(null);
  const label = `${issueEventLabel(event.type)} · 사진 ${index + 1}`;
  return (
    <>
      {view.resource.status === 'ready' ? (
        <button
          type="button"
          className="issue-evidence-photo__thumbnail"
          aria-label={`${label} 크게 보기`}
          aria-haspopup="dialog"
          onClick={() => setOpen(true)}
        >
          <img key={view.resource.url} src={view.resource.url} alt={label} width={photo.width} height={photo.height} referrerPolicy="no-referrer" decoding="async" onError={view.imageFailed} />
          <span aria-hidden="true">크게 보기</span>
        </button>
      ) : <div className="issue-evidence-photo__placeholder"><PhotoState view={view} /></div>}
      <div ref={caption} className="issue-evidence-photo__caption" tabIndex={-1}>
        <strong>사진 {index + 1}</strong>
        <details className="issue-evidence-photo__file">
          <summary>파일 정보 <span aria-hidden="true">+</span></summary>
          <div>
            <p>{photo.filename}</p>
            <span>{(photo.sizeBytes / 1024).toFixed(0)} KB · 버전 {event.version}</span>
          </div>
        </details>
      </div>
      {open && <PhotoDialog photo={photo} label={label} view={view} returnFocusRef={caption} onClose={() => setOpen(false)} />}
    </>
  );
}

type PhotoView = ReturnType<typeof useIssuePhoto>;

function PhotoState({ view }: { view: PhotoView }) {
  if (view.resource.status === 'ready') return null;
  return (
    <div className="issue-evidence-photo__state" role={view.resource.status === 'error' ? 'alert' : 'status'}>
      <p>{view.resource.status === 'loading' ? '사진 불러오는 중' : view.resource.status === 'expired' ? '사진 열람 시간이 만료되었습니다.' : '사진을 불러오지 못했습니다.'}</p>
      {view.resource.status !== 'loading' && <Button className="admin-button-secondary" onClick={view.refresh}>다시 불러오기</Button>}
    </div>
  );
}

function PhotoDialog({ photo, label, view, returnFocusRef, onClose }: {
  photo: AdminIssuePhotoDto;
  label: string;
  view: PhotoView;
  returnFocusRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const fallback = returnFocusRef.current;
    if (!element.open) element.showModal();
    close.current?.focus();
    return () => {
      if (element.open) element.close();
      if (previous?.isConnected) previous.focus({ preventScroll: true });
      else if (fallback?.isConnected) fallback.focus({ preventScroll: true });
    };
  }, [returnFocusRef]);
  return (
    <dialog
      ref={dialog}
      className="issue-evidence-dialog"
      aria-labelledby={`${id}-title`}
      onCancel={(event) => { event.preventDefault(); onClose(); }}
      onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}
    >
      <div className="issue-evidence-dialog__panel">
        <header>
          <h2 id={`${id}-title`}>{label}</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="사진 닫기">닫기</button>
        </header>
        <div className="issue-evidence-dialog__image">
          {view.resource.status === 'ready' ? <img key={view.resource.url} src={view.resource.url} alt={label} width={photo.width} height={photo.height} referrerPolicy="no-referrer" onError={view.imageFailed} /> : <PhotoState view={view} />}
        </div>
        {view.resource.status === 'ready' && <p className="issue-evidence-dialog__expiry">열람 만료 {issueTime(view.resource.expiresAt)} · 다시 불러오기 가능</p>}
      </div>
    </dialog>
  );
}
