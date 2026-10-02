import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getGuestSubmissionPhotoView } from '../../../../features/guest-submission-details/guest-submission-details-api';
import type { GuestSubmissionPhotoDto } from '../../../../features/guest-submission-details/guest-submission-details.types';
import { Button } from '../../../../shared/ui/Button/Button';

type Preview =
  | { status: 'idle' | 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; url: string; expiresAt: string };
type Props = {
  photo: GuestSubmissionPhotoDto;
  label: string;
  token: string;
  revision: number;
  expiresAt: string;
  disabled: boolean;
  rejectAccess: () => void;
};

export function GuestSubmissionPhoto({
  photo,
  label,
  token,
  revision,
  expiresAt,
  disabled,
  rejectAccess,
}: Props) {
  const owner = useMemo(
    () => ({ token, id: photo.id, revision, disabled }),
    [token, photo.id, revision, disabled],
  );
  const scope = useRef<typeof owner | null>(owner);
  const request = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    owner: typeof owner;
    preview: Preview;
  } | null>(null);
  const preview: Preview =
    result?.owner === owner && !disabled ? result.preview : { status: 'idle' };
  useLayoutEffect(() => {
    scope.current = owner;
    return () => {
      scope.current = null;
      request.current?.abort();
      request.current = null;
    };
  }, [owner]);
  const load = async () => {
    if (disabled || scope.current !== owner || request.current) return;
    if (Date.parse(expiresAt) <= Date.now()) {
      rejectAccess();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    const active = () =>
      scope.current === owner &&
      !controller.signal.aborted &&
      request.current === controller;
    setResult({ owner, preview: { status: 'loading' } });
    try {
      const view = await getGuestSubmissionPhotoView(
        photo.id,
        token,
        controller.signal,
      );
      if (!active()) return;
      if (Date.parse(expiresAt) <= Date.now()) {
        rejectAccess();
        return;
      }
      setResult({
        owner,
        preview:
          Date.parse(view.expiresAt) <= Date.now()
            ? {
                status: 'error',
                message: '미리보기 시간이 만료되었습니다. 다시 열어 주세요.',
              }
            : {
                status: 'ready',
                ...view,
                expiresAt: new Date(
                  Math.min(Date.parse(view.expiresAt), Date.parse(expiresAt)),
                ).toISOString(),
              },
      });
    } catch (error: unknown) {
      if (!active()) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        rejectAccess();
        return;
      }
      setResult({
        owner,
        preview: {
          status: 'error',
          message:
            error instanceof ApiRequestError && error.status === 404
              ? '사진 연결이 변경되었을 수 있습니다. 위의 최신 내용 확인을 눌러 주세요.'
              : '사진을 표시하지 못했습니다. 잠시 후 다시 열어 주세요.',
        },
      });
    } finally {
      if (request.current === controller) request.current = null;
    }
  };
  const previewExpiry = preview.status === 'ready' ? preview.expiresAt : null;
  useEffect(() => {
    if (!previewExpiry) return;
    const expire = () => {
      if (scope.current === owner && Date.parse(previewExpiry) <= Date.now())
        setResult({
          owner,
          preview: {
            status: 'error',
            message: '미리보기 시간이 만료되었습니다. 사진을 다시 열어 주세요.',
          },
        });
    };
    const timer = setTimeout(
      expire,
      Math.max(
        0,
        Math.min(2_147_483_647, Date.parse(previewExpiry) - Date.now()),
      ),
    );
    document.addEventListener('visibilitychange', expire);
    window.addEventListener('pageshow', expire);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('visibilitychange', expire);
      window.removeEventListener('pageshow', expire);
    };
  }, [previewExpiry, owner]);
  return (
    <div className="guest-submitted-photo">
      <div>
        <strong>{label} 사진</strong>
        <p>{photo.filename}</p>
        {photo.areaLabel && <p>{photo.areaLabel}</p>}
      </div>
      {preview.status === 'ready' ? (
        <>
          <img
            src={preview.url}
            alt={`${label}에 첨부한 사진`}
            referrerPolicy="no-referrer"
            onError={() => {
              if (scope.current === owner)
                setResult({
                  owner,
                  preview: {
                    status: 'error',
                    message: '사진을 표시하지 못했습니다. 다시 열어 주세요.',
                  },
                });
            }}
          />
          <Button
            className="guest-draft-secondary"
            onClick={() => setResult({ owner, preview: { status: 'idle' } })}
          >
            사진 닫기
          </Button>
        </>
      ) : (
        <Button
          className="guest-draft-secondary"
          disabled={disabled}
          loading={preview.status === 'loading'}
          onClick={() => {
            void load();
          }}
        >
          {preview.status === 'error' ? '사진 다시 보기' : '사진 보기'}
        </Button>
      )}
      {preview.status === 'error' && (
        <p className="guest-submitted-hint" role="status">
          {preview.message}
        </p>
      )}
    </div>
  );
}
