import { useEffect, useRef, useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import type { GuestDraftPhotosController } from '../hooks/use-guest-draft-photos';
import {
  formatGuestPhotoSize,
  photoFailureMessage,
} from '../model/guest-draft-photo-model';

type Props = {
  photo: GuestDraftPhotoDto;
  index: number;
  disabled: boolean;
  getPreview: GuestDraftPhotosController['getPreview'];
  onRemove: GuestDraftPhotosController['remove'];
};
type Preview =
  | { status: 'idle' | 'loading' | 'expired' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; expiresAt: string };

export function GuestDraftPhotoCard({
  photo,
  index,
  disabled,
  getPreview,
  onRemove,
}: Props) {
  const [preview, setPreview] = useState<{
    source: typeof getPreview;
    photoId: string;
    value: Preview;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const request = useRef<AbortController | null>(null);
  const current = useRef({ photoId: photo.id, source: getPreview });
  const visible: Preview =
    preview?.photoId === photo.id && preview.source === getPreview
      ? preview.value
      : { status: 'idle' };
  useEffect(() => {
    current.current = { photoId: photo.id, source: getPreview };
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [getPreview, photo.id]);

  const load = async () => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const publish = (value: Preview) => {
      if (
        !controller.signal.aborted &&
        current.current.photoId === photo.id &&
        current.current.source === getPreview
      )
        setPreview({ photoId: photo.id, source: getPreview, value });
    };
    publish({ status: 'loading' });
    try {
      const view = await getPreview(photo, controller.signal);
      publish(
        Date.parse(view.expiresAt) <= Date.now()
          ? { status: 'expired' }
          : { status: 'ready', ...view },
      );
    } catch (error: unknown) {
      if (!controller.signal.aborted)
        publish({ status: 'error', message: photoFailureMessage(error) });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const expiresAt = visible.status === 'ready' ? visible.expiresAt : null;
  useEffect(() => {
    if (!expiresAt) return;
    const expire = () => {
      if (Date.parse(expiresAt) <= Date.now())
        setPreview((value) =>
          value?.photoId === photo.id &&
          value.source === getPreview &&
          value.value.status === 'ready' &&
          value.value.expiresAt === expiresAt
            ? { ...value, value: { status: 'expired' } }
            : value,
        );
    };
    const timer = setTimeout(
      expire,
      Math.max(0, Math.min(2_147_483_647, Date.parse(expiresAt) - Date.now())),
    );
    // Also hide expired images when a suspended phone browser resumes.
    document.addEventListener('visibilitychange', expire);
    window.addEventListener('pageshow', expire);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
      window.removeEventListener('pageshow', expire);
    };
  }, [expiresAt, getPreview, photo.id]);

  return (
    <article className="guest-photo-card" aria-label={`첨부 사진 ${index + 1}`}>
      <div className="guest-photo-card__preview">
        {visible.status === 'ready' ? (
          <img
            src={visible.url}
            alt={`첨부 사진 ${index + 1}`}
            referrerPolicy="no-referrer"
            onError={() =>
              setPreview({
                photoId: photo.id,
                source: getPreview,
                value: {
                  status: 'error',
                  message:
                    '사진을 표시하지 못했습니다. 미리보기를 다시 열어 주세요.',
                },
              })
            }
          />
        ) : (
          <div className="guest-photo-card__placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="8" cy="9" r="1.5" />
              <path d="m4 17 5-5 4 4 3-3 5 5" />
            </svg>
            <Button
              className="guest-draft-secondary"
              loading={visible.status === 'loading'}
              onClick={() => {
                void load();
              }}
            >
              {visible.status === 'idle'
                ? '사진 보기'
                : visible.status === 'expired'
                  ? '미리보기 다시 열기'
                  : '다시 보기'}
            </Button>
          </div>
        )}
      </div>
      <div className="guest-photo-card__body">
        <p className="guest-photo-card__name">
          <span>사진 {index + 1}</span>
          {photo.filename}
        </p>
        <p className="guest-photo-card__size">
          {formatGuestPhotoSize(photo.sizeBytes)}
        </p>
        {visible.status === 'error' && (
          <p className="guest-photo-card__error" role="status">
            {visible.message}
          </p>
        )}
        {visible.status === 'expired' && (
          <p className="guest-photo-card__hint">
            미리보기 시간이 만료되었습니다. 사진은 첨부된 상태입니다.
          </p>
        )}
        {confirmDelete ? (
          <div className="guest-photo-card__confirm">
            <p>이 사진을 삭제할까요?</p>
            <div>
              <Button
                disabled={disabled}
                className="guest-photo-delete"
                onClick={() => {
                  setConfirmDelete(false);
                  void onRemove(photo.id);
                }}
              >
                삭제
              </Button>
              <Button
                className="guest-draft-secondary"
                onClick={() => setConfirmDelete(false)}
              >
                취소
              </Button>
            </div>
          </div>
        ) : (
          <button
            className="guest-photo-card__remove"
            type="button"
            disabled={disabled}
            onClick={() => setConfirmDelete(true)}
            aria-label={`${index + 1}번 사진 삭제`}
          >
            사진 삭제
          </button>
        )}
      </div>
    </article>
  );
}
