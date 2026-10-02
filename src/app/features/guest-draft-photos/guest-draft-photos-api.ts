import { apiRequest } from '../../core/api/api-client';
import { requireDraftToken } from '../guest-drafts/guest-drafts-validation';
import {
  readGuestDraftPhoto,
  readGuestDraftPhotos,
  readGuestDraftPhotoView,
  readRemovedGuestDraftPhoto,
} from './guest-draft-photos-readers';
import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoListDto,
  GuestDraftPhotoViewDto,
  RemovedGuestDraftPhotoDto,
} from './guest-draft-photos.types';
import {
  requireGuestPhotoId,
  validateGuestPhotoFile,
} from './guest-draft-photos-validation';

export async function getGuestDraftPhotos(
  token: string,
  signal?: AbortSignal,
): Promise<GuestDraftPhotoListDto> {
  requireDraftToken(token);
  return readGuestDraftPhotos(
    await apiRequest<unknown>('/submission-drafts/photos', { token, signal }),
  );
}

export async function uploadGuestDraftPhoto(
  file: File,
  token: string,
  signal?: AbortSignal,
): Promise<GuestDraftPhotoDto> {
  requireDraftToken(token);
  await validateGuestPhotoFile(file);
  if (signal?.aborted)
    throw new DOMException('Request cancelled', 'AbortError');
  const body = new FormData();
  body.append('file', file);
  return readGuestDraftPhoto(
    await apiRequest<unknown>('/submission-drafts/photos', {
      method: 'POST',
      token,
      signal,
      body,
    }),
  );
}

export async function getGuestDraftPhotoView(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<GuestDraftPhotoViewDto> {
  requireDraftToken(token);
  const photoId = requireGuestPhotoId(id);
  return readGuestDraftPhotoView(
    await apiRequest<unknown>(`/submission-drafts/photos/${photoId}/view`, {
      token,
      signal,
    }),
  );
}

export async function removeGuestDraftPhoto(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<RemovedGuestDraftPhotoDto> {
  requireDraftToken(token);
  const photoId = requireGuestPhotoId(id);
  return readRemovedGuestDraftPhoto(
    await apiRequest<unknown>(`/submission-drafts/photos/${photoId}/remove`, {
      method: 'POST',
      token,
      signal,
      body: {},
    }),
    photoId,
  );
}
