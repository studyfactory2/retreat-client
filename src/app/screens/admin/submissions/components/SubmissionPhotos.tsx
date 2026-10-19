import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type {
  AdminSubmissionPhoto,
  AdminSubmissionRevision,
} from '../../../../features/admin-submissions/admin-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  submissionPhotoLocation,
  submissionPhotoPurpose,
  submissionTime,
} from '../model/submission-detail-model';
import { useSubmissionPhoto } from '../hooks/use-submission-photo';
import '../styles/submission-gallery.css';

type SubmissionPhotosProps = {
  revision: AdminSubmissionRevision;
  token: string;
  rejectSession: (token: string) => void;
  compact?: boolean;
  presentation?: 'default' | 'maintenance';
};

export function SubmissionPhotos(props: SubmissionPhotosProps) {
  if (props.presentation === 'maintenance') {
    return <MaintenancePhotoGallery {...props} />;
  }
  return <SubmissionPhotoList {...props} />;
}

function SubmissionPhotoList({
  revision,
  token,
  rejectSession,
  compact = false,
}: SubmissionPhotosProps) {
  const [selected, setSelected] = useState<string | null>(null);
  const photo = revision.photos.find((candidate) => candidate.id === selected);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  function close() {
    setSelected(null);
    if (photo) buttons.current.get(photo.id)?.focus();
  }
  return (
    <section className="submission-detail-card submission-photos">
      <div className="submission-detail-section-heading">
        <h3>{compact ? `첨부 사진 ${revision.photos.length}장` : '첨부 사진'}</h3>
        {!compact && (
          <p>{revision.photos.length}장 · 버전 {revision.version}</p>
        )}
      </div>
      {revision.photos.length === 0 ? (
        <p className="submission-detail-muted">첨부된 사진이 없습니다.</p>
      ) : (
        <>
          <ul className="submission-photo-list">
            {revision.photos.map((item, index) => (
              <li key={item.id}>
                <div>
                  <span className="submission-detail-badge">
                    {submissionPhotoPurpose(item.purpose)}
                  </span>
                  <strong>
                    {submissionPhotoLocation(item, revision.record)}
                  </strong>
                  <span className="submission-detail-caption">
                    사진 {index + 1} · {item.filename} ·{' '}
                    {(item.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="ui-button admin-button-secondary"
                  aria-expanded={photo?.id === item.id}
                  ref={(element) => {
                    if (element) buttons.current.set(item.id, element);
                    else buttons.current.delete(item.id);
                  }}
                  onClick={() =>
                    setSelected((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  {photo?.id === item.id ? '사진 닫기' : '사진 보기'}
                </button>
              </li>
            ))}
          </ul>
          {photo && (
            <PhotoViewer
              key={`${revision.id}:${photo.id}`}
              submissionId={revision.submissionId}
              revisionId={revision.id}
              photo={photo}
              label={`${submissionPhotoPurpose(photo.purpose)} · ${submissionPhotoLocation(photo, revision.record)}`}
              token={token}
              rejectSession={rejectSession}
              onClose={close}
            />
          )}
        </>
      )}
    </section>
  );
}

function PhotoViewer({
  submissionId,
  revisionId,
  photo,
  label,
  token,
  rejectSession,
  onClose,
}: {
  submissionId: string;
  revisionId: string;
  photo: AdminSubmissionPhoto;
  label: string;
  token: string;
  rejectSession: (token: string) => void;
  onClose: () => void;
}) {
  const { resource, refresh, imageFailed } = useSubmissionPhoto(
    submissionId,
    revisionId,
    photo.id,
    token,
    rejectSession,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="submission-photo-viewer">
      <div className="submission-detail-section-heading">
        <h4 ref={heading} tabIndex={-1}>
          {label}
        </h4>
        <Button className="admin-button-secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
      {resource.status === 'loading' ? (
        <p role="status">사진을 불러오는 중입니다.</p>
      ) : resource.status === 'ready' ? (
        <>
          <img
            key={resource.url}
            src={resource.url}
            alt={label}
            width={photo.width}
            height={photo.height}
            referrerPolicy="no-referrer"
            onError={imageFailed}
          />
          <p className="submission-detail-caption">
            사진 열람 만료: {submissionTime(resource.expiresAt)} · 만료되면 다시
            불러올 수 있습니다.
          </p>
        </>
      ) : (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <p>
            {resource.status === 'expired'
              ? '사진 열람 시간이 만료되었습니다.'
              : '사진을 불러오지 못했습니다. 접근 권한이나 연결 상태를 확인한 뒤 다시 시도해 주세요.'}
          </p>
          <Button className="admin-button-secondary" onClick={refresh}>
            사진 다시 불러오기
          </Button>
        </div>
      )}
    </div>
  );
}


function MaintenancePhotoGallery({
  revision,
  token,
  rejectSession,
}: SubmissionPhotosProps) {
  return (
    <section className="submission-gallery" aria-label="첨부 사진">
      <div className="submission-gallery__heading">
        <h3>첨부 사진 <span>{revision.photos.length}</span></h3>
      </div>
      {revision.photos.length === 0 ? (
        <p className="submission-gallery__empty">첨부 사진 없음</p>
      ) : (
        <ul className="submission-gallery__grid">
          {revision.photos.map((photo, index) => (
            <GalleryPhoto
              key={`${revision.id}:${photo.id}`}
              photo={photo}
              index={index}
              revision={revision}
              token={token}
              rejectSession={rejectSession}
            />
          ))}
        </ul>
      )}
    </section>
  );
}

type GalleryPhotoProps = {
  photo: AdminSubmissionPhoto;
  index: number;
  revision: AdminSubmissionRevision;
  token: string;
  rejectSession: (token: string) => void;
};

function GalleryPhoto(props: GalleryPhotoProps) {
  const tile = useRef<HTMLLIElement>(null);
  const [visible, setVisible] = useState(
    () => typeof IntersectionObserver === 'undefined',
  );
  useEffect(() => {
    const element = tile.current;
    if (!element) return;
    if (typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((entry) => entry.isIntersecting)) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '120px' },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <li ref={tile} className="submission-gallery__item">
      {visible ? (
        <GalleryPhotoContent {...props} />
      ) : (
        <div className="submission-gallery__placeholder" aria-hidden="true">
          사진 {props.index + 1}
        </div>
      )}
    </li>
  );
}

function GalleryPhotoContent({
  photo,
  index,
  revision,
  token,
  rejectSession,
}: GalleryPhotoProps) {
  const view = useSubmissionPhoto(
    revision.submissionId,
    revision.id,
    photo.id,
    token,
    rejectSession,
  );
  const [open, setOpen] = useState(false);
  const caption = useRef<HTMLDivElement>(null);
  const purpose = submissionPhotoPurpose(photo.purpose);
  const location = submissionPhotoLocation(photo, revision.record);
  const label = `${purpose} · ${location}`;
  return (
    <>
      {view.resource.status === 'ready' ? (
        <button
          type="button"
          className="submission-gallery__thumbnail"
          onClick={() => setOpen(true)}
          aria-label={`사진 ${index + 1} 크게 보기: ${label}`}
          aria-haspopup="dialog"
        >
          <img
            key={view.resource.url}
            src={view.resource.url}
            alt={label}
            width={photo.width}
            height={photo.height}
            referrerPolicy="no-referrer"
            decoding="async"
            onError={view.imageFailed}
          />
          <span className="submission-gallery__enlarge" aria-hidden="true">
            크게 보기
          </span>
        </button>
      ) : (
        <div className="submission-gallery__placeholder">
          <GalleryPhotoState view={view} />
        </div>
      )}
      <div ref={caption} className="submission-gallery__caption" tabIndex={-1}>
        <span className="submission-gallery__purpose">{purpose}</span>
        <p>{location}</p>
        <details className="submission-gallery__file">
          <summary>파일 정보</summary>
          <p>{photo.filename}</p>
          <span>{(photo.sizeBytes / 1024).toFixed(0)} KB · 버전 {revision.version}</span>
        </details>
      </div>
      {open && (
        <GalleryPhotoDialog
          index={index}
          photo={photo}
          label={label}
          view={view}
          returnFocusRef={caption}
          onClose={() => setOpen(false)}
        />
      )}
    </>
  );
}

type GalleryPhotoView = ReturnType<typeof useSubmissionPhoto>;

function GalleryPhotoState({ view }: { view: GalleryPhotoView }) {
  const { resource } = view;
  if (resource.status === 'ready') return null;
  return (
    <div className="submission-gallery__state" role={resource.status === 'error' ? 'alert' : 'status'}>
      <p>
        {resource.status === 'loading'
          ? '사진을 불러오는 중입니다.'
          : resource.status === 'expired'
            ? '사진 열람 시간이 만료되었습니다.'
            : '사진을 불러오지 못했습니다.'}
      </p>
      {resource.status !== 'loading' && (
        <Button className="admin-button-secondary" onClick={view.refresh}>
          다시 불러오기
        </Button>
      )}
    </div>
  );
}

function GalleryPhotoDialog({
  index,
  photo,
  label,
  view,
  returnFocusRef,
  onClose,
}: {
  index: number;
  photo: AdminSubmissionPhoto;
  label: string;
  view: GalleryPhotoView;
  returnFocusRef: RefObject<HTMLDivElement | null>;
  onClose: () => void;
}) {
  const id = useId();
  const dialog = useRef<HTMLDialogElement>(null);
  const close = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    const element = dialog.current;
    if (!element) return;
    const previous = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null;
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
      className="submission-gallery-dialog"
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-caption`}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClick={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="submission-gallery-dialog__panel">
        <header className="submission-gallery-dialog__heading">
          <h2 id={`${id}-title`}>사진 {index + 1}</h2>
          <button ref={close} type="button" onClick={onClose} aria-label="사진 닫기">
            닫기
          </button>
        </header>
        <div className="submission-gallery-dialog__image">
          {view.resource.status === 'ready' ? (
            <img
              key={view.resource.url}
              src={view.resource.url}
              alt={label}
              width={photo.width}
              height={photo.height}
              referrerPolicy="no-referrer"
              onError={view.imageFailed}
            />
          ) : <GalleryPhotoState view={view} />}
        </div>
        <p id={`${id}-caption`} className="submission-gallery-dialog__caption">{label}</p>
      </div>
    </dialog>
  );
}
