import { useEffect, useMemo, useRef, useState } from 'react';
import type { StaffDraftPhotoDto } from '../../../../features/staff-draft-photos/staff-draft-photos.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftPhotoView } from '../hooks/use-staff-draft-photo-view';
import { formatStaffPhotoSize } from '../model/staff-draft-photo-model';
import { StaffDraftPhotoPreview } from './StaffDraftPhotoPreview';
import '../styles/staff-draft-photo-preview.css';

export function StaffDraftPhotoCard({
  photo,
  index,
  token,
  draftId,
  draftExpiresAt,
  previewEnabled,
  removeDisabled,
  onRemove,
  onAccessRejected,
}: {
  photo: StaffDraftPhotoDto;
  index: number;
  token: string;
  draftId: string;
  draftExpiresAt: string;
  previewEnabled: boolean;
  removeDisabled: boolean;
  onRemove: (id: string) => void | Promise<void>;
  onAccessRejected: () => void;
}) {
  const owner = useMemo(
    () => ({
      token,
      draftId,
      photoId: photo.id,
      draftExpiresAt,
      previewEnabled,
    }),
    [token, draftId, photo.id, draftExpiresAt, previewEnabled],
  );
  const [selected, setSelected] = useState<typeof owner | null>(null);
  const [deleting, setDeleting] = useState<typeof owner | null>(null);
  const [visible, setVisible] = useState(false);
  const thumbnail = useRef<HTMLDivElement>(null);
  const view = useStaffDraftPhotoView({
    token,
    draftId,
    photoId: photo.id,
    draftExpiresAt,
    enabled: previewEnabled,
    onAccessRejected,
  });
  const { preview, canAutoLoad, load } = view;
  useEffect(() => {
    const element = thumbnail.current;
    // Older browsers can still open a preview explicitly using the same button.
    if (!element || typeof IntersectionObserver === 'undefined') return;
    const observer = new IntersectionObserver(
      (entries) => {
        setVisible(entries.some((entry) => entry.isIntersecting));
      },
      { rootMargin: '120px 0px', threshold: 0.01 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  useEffect(() => {
    if (visible && canAutoLoad) void load();
  }, [visible, canAutoLoad, load]);

  const size = formatStaffPhotoSize(photo.sizeBytes);
  return (
    <article className="staff-photo-card" aria-label={`첨부 사진 ${index + 1}`}>
      <div
        ref={thumbnail}
        className="staff-photo-card__thumbnail"
        aria-busy={preview.status === 'loading'}
      >
        {preview.status === 'ready' ? (
          <button
            type="button"
            className="staff-photo-card__open"
            onClick={() => setSelected(owner)}
            aria-label={`${index + 1}번 첨부 사진 크게 보기`}
          >
            <img
              src={preview.url}
              alt={`첨부 사진 ${index + 1}`}
              loading="lazy"
              decoding="async"
              referrerPolicy="no-referrer"
              onError={() => view.imageFailed(preview)}
            />
            <span>크게 보기</span>
          </button>
        ) : (
          <div className="staff-photo-card__placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="8" cy="9" r="1.5" />
              <path d="m4 17 5-5 4 4 3-3 5 5" />
            </svg>
            <Button
              className="staff-draft-secondary"
              disabled={!view.canLoad}
              loading={preview.status === 'loading'}
              onClick={() => {
                void view.load();
              }}
            >
              {preview.status === 'idle'
                ? '사진 보기'
                : preview.status === 'expired'
                  ? '다시 보기'
                  : '다시 보기'}
            </Button>
          </div>
        )}
      </div>
      <div className="staff-photo-card__body">
        <p className="staff-photo-card__name">사진 {index + 1}</p>
        {preview.status === 'error' && (
          <p className="staff-photo-card__message" role="status">
            {preview.message}
          </p>
        )}
        {preview.status === 'expired' && (
          <p className="staff-photo-card__message" role="status">
            미리보기 만료 · 첨부 사진은 유지됩니다.
          </p>
        )}
        {deleting === owner ? (
          <div className="staff-photo-card__confirm">
            <p>이 사진을 삭제할까요?</p>
            <div>
              <Button
                disabled={removeDisabled}
                onClick={() => {
                  setDeleting(null);
                  void onRemove(photo.id);
                }}
              >
                삭제
              </Button>
              <Button
                className="staff-draft-secondary"
                onClick={() => setDeleting(null)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="staff-photo-card__remove"
            type="button"
            disabled={removeDisabled}
            onClick={() => setDeleting(owner)}
            aria-label={`${index + 1}번 첨부 사진 삭제`}
          >
            삭제
          </button>
        )}
        <details className="staff-photo-card__details">
          <summary>파일 정보</summary>
          <p>{photo.filename}</p>
          <p className="staff-photo-card__meta">
            {size} · {photo.width} × {photo.height}
          </p>
        </details>
      </div>
      <StaffDraftPhotoPreview
        open={selected === owner && previewEnabled}
        index={index}
        filename={photo.filename}
        view={view}
        onClose={() => setSelected(null)}
      />
    </article>
  );
}
