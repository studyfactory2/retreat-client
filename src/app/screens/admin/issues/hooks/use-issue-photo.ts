import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssuePhotoView } from '../../../../features/admin-issues/admin-issues-api';

type PhotoResource =
  | { status: 'loading' }
  | { status: 'ready'; url: string; expiresAt: string }
  | { status: 'expired' }
  | { status: 'error' };

export function useIssuePhoto(
  issueId: string,
  eventId: string,
  photoId: string,
  token: string,
  rejectSession: (token: string) => void,
) {
  const [generation, setGeneration] = useState(0);
  const key = `${issueId}:${eventId}:${photoId}:${generation}`;
  const [result, setResult] = useState<{
    key: string;
    owner: string;
    resource: PhotoResource;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    let expiration: ReturnType<typeof setTimeout> | undefined;
    void getAdminIssuePhotoView(
      issueId,
      eventId,
      photoId,
      token,
      controller.signal,
    ).then(
      (view) => {
        if (controller.signal.aborted) return;
        const remaining = Date.parse(view.expiresAt) - Date.now();
        if (remaining <= 0) {
          setResult({ key, owner: token, resource: { status: 'expired' } });
          return;
        }
        setResult({
          key,
          owner: token,
          resource: {
            status: 'ready',
            url: view.url,
            expiresAt: view.expiresAt,
          },
        });
        expiration = setTimeout(
          () => {
            if (!controller.signal.aborted)
              setResult({ key, owner: token, resource: { status: 'expired' } });
          },
          Math.min(remaining, 120_000),
        );
      },
      (error: unknown) => {
        if (controller.signal.aborted) return;
        if (
          error instanceof ApiRequestError &&
          (error.status === 401 || error.status === 403)
        ) {
          rejectSession(token);
          return;
        }
        // Keep signed addresses and upstream error bodies out of the interface.
        setResult({ key, owner: token, resource: { status: 'error' } });
      },
    );
    return () => {
      controller.abort();
      if (expiration !== undefined) clearTimeout(expiration);
    };
  }, [issueId, eventId, photoId, key, token, rejectSession]);
  const resource: PhotoResource =
    result?.key === key && result.owner === token
      ? result.resource
      : { status: 'loading' };
  return {
    resource,
    refresh: () => setGeneration((value) => value + 1),
    imageFailed: () =>
      setResult({ key, owner: token, resource: { status: 'error' } }),
  };
}
