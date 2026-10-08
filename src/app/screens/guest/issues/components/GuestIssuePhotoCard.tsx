import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestIssuePhotosController } from '../hooks/use-guest-issue-photos';
import {
  formatIssuePhotoSize,
  issuePhotoFailure,
  type GuestIssueManagedPhoto,
} from '../model/guest-issue-photo-model';

type Preview =
  | { status: 'idle' | 'loading' | 'expired' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; expiresAt: string };
type Props = {
  entry: GuestIssueManagedPhoto;
  index: number;
  disabled: boolean;
  readOnly?: boolean;
  getPreview: GuestIssuePhotosController['getPreview'];
  onRemove: GuestIssuePhotosController['remove'];
  onDiscard: GuestIssuePhotosController['discardUnavailable'];
};

export function GuestIssuePhotoCard({
  entry,
  index,
  disabled,
  readOnly = false,
  getPreview,
  onRemove,
  onDiscard,
}: Props) {
  const { photo } = entry;
  const previewDisabled = disabled || entry.status !== 'ready';
  const owner = useMemo(
    () => ({ id: photo.id, getPreview, disabled: previewDisabled }),
    [getPreview, photo.id, previewDisabled],
  );
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    owner: typeof owner;
    preview: Preview;
  } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const visible: Preview =
    !previewDisabled && result?.owner === owner
      ? result.preview
      : { status: 'idle' };
  useLayoutEffect(() => {
    scope.current = owner;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner]);

  const load = async () => {
    if (previewDisabled || scope.current !== owner || request.current) return;
    const controller = new AbortController();
    request.current = controller;
    const active = () =>
      scope.current === owner &&
      !controller.signal.aborted &&
      request.current === controller;
    const publish = (preview: Preview) => {
      if (active()) setResult({ owner, preview });
    };
    publish({ status: 'loading' });
    try {
      const view = await getPreview(photo.id, controller.signal);
      publish(
        Date.parse(view.expiresAt) <= Date.now()
          ? { status: 'expired' }
          : { status: 'ready', ...view },
      );
    } catch (error: unknown) {
      if (active())
        publish({ status: 'error', message: issuePhotoFailure(error) });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };

  const expiry = visible.status === 'ready' ? visible.expiresAt : null;
  useEffect(() => {
    if (!expiry) return;
    const expire = () => {
      if (scope.current === owner && Date.parse(expiry) <= Date.now())
        setResult({ owner, preview: { status: 'expired' } });
    };
    const timer = setTimeout(
      expire,
      Math.max(0, Math.min(2_147_483_647, Date.parse(expiry) - Date.now())),
    );
    document.addEventListener('visibilitychange', expire);
    window.addEventListener('pageshow', expire);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
      window.removeEventListener('pageshow', expire);
    };
  }, [expiry, owner]);

  return (
    <article
      className="guest-issue-photo"
      aria-label={`첨부 사진 ${index + 1}`}
    >
      <div
        className={`guest-issue-photo__preview${expanded && visible.status === 'ready' ? ' guest-issue-photo__preview--expanded' : ''}`}
      >
        {visible.status === 'ready' ? (
          <button
            type="button"
            className="guest-issue-photo__image-button"
            aria-label={`${index + 1}번 사진 ${expanded ? '작게' : '크게'} 보기`}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            <img
              src={visible.url}
              alt={`첨부 사진 ${index + 1}`}
              referrerPolicy="no-referrer"
              onError={() => {
                if (scope.current === owner)
                  setResult({
                    owner,
                    preview: {
                      status: 'error',
                      message:
                        '사진을 표시하지 못했습니다. 미리보기를 다시 열어 주세요.',
                    },
                  });
              }}
            />
            <span>{expanded ? '작게 보기' : '크게 보기'}</span>
          </button>
        ) : (
          <div className="guest-issue-photo__placeholder">
            <svg viewBox="0 0 24 24" aria-hidden="true">
              <rect x="3" y="4" width="18" height="16" rx="3" />
              <circle cx="8" cy="9" r="1.5" />
              <path d="m4 17 5-5 4 4 3-3 5 5" />
            </svg>
            <Button
              className="guest-issue-photo-secondary"
              disabled={previewDisabled}
              loading={visible.status === 'loading'}
              onClick={() => {
                void load();
              }}
            >
              {visible.status === 'idle' ? '사진 보기' : '미리보기 다시 열기'}
            </Button>
          </div>
        )}
      </div>
      <div className="guest-issue-photo__body">
        <p className="guest-issue-photo__name">
          <span>사진 {index + 1}</span>
          {photo.filename}
        </p>
        <p className="guest-issue-photo__size">
          {formatIssuePhotoSize(photo.sizeBytes)}
        </p>
        {visible.status === 'error' && (
          <p className="guest-issue-photo__error" role="status">
            {visible.message}
          </p>
        )}
        {visible.status === 'expired' && (
          <p className="guest-issue-photo__hint">
            미리보기 시간이 끝났습니다. 첨부 상태는 유지됩니다.
          </p>
        )}
        {entry.message && (
          <p className="guest-issue-photo__error" role="status">
            {entry.message}
          </p>
        )}
        {!readOnly &&
          (entry.status === 'remove-uncertain' ? (
            <Button
              className="guest-issue-photo-secondary"
              disabled={disabled}
              onClick={() => {
                void onRemove(photo.id);
              }}
            >
              같은 사진 삭제 재확인
            </Button>
          ) : entry.status === 'expired' || entry.status === 'unavailable' ? (
            <Button
              className="guest-issue-photo-secondary"
              disabled={disabled}
              onClick={() => onDiscard(photo.id)}
            >
              신고 목록에서 제외
            </Button>
          ) : confirmDelete ? (
            <div className="guest-issue-photo__confirm">
              <p>이 사진을 삭제할까요?</p>
              <div>
                <Button
                  disabled={disabled}
                  className="guest-issue-photo-delete"
                  onClick={() => {
                    setConfirmDelete(false);
                    void onRemove(photo.id);
                  }}
                >
                  사진 삭제
                </Button>
                <Button
                  className="guest-issue-photo-secondary"
                  onClick={() => setConfirmDelete(false)}
                >
                  취소
                </Button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="guest-issue-photo__remove"
              disabled={disabled}
              aria-label={`${index + 1}번 사진 삭제`}
              onClick={() => setConfirmDelete(true)}
            >
              사진 삭제
            </button>
          ))}
      </div>
    </article>
  );
}
