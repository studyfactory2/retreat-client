import { apiRequest } from '../../core/api/api-client';
import { validateGuestPhotoFile } from '../guest-draft-photos/guest-draft-photos-validation';
import {
  readGuestIssuePhotoUpload,
  readGuestIssuePhotoView,
  readRemovedGuestIssuePhoto,
} from './guest-issue-photos-readers';
import type {
  GuestIssuePhotoUploadDto,
  GuestIssuePhotoViewDto,
  RemovedGuestIssuePhotoDto,
} from './guest-issues.types';
import {
  requireGuestIssuePhotoClaim,
  requireGuestIssueQrToken,
} from './guest-issues-validation';

export async function uploadGuestIssuePhoto(
  file: File,
  qrToken: string,
  signal?: AbortSignal,
): Promise<GuestIssuePhotoUploadDto> {
  requireGuestIssueQrToken(qrToken);
  await validateGuestPhotoFile(file);
  if (signal?.aborted)
    throw new DOMException('Request cancelled', 'AbortError');
  const body = new FormData();
  body.append('file', file);
  return readGuestIssuePhotoUpload(
    await apiRequest<unknown>('/guest/issues/photos', {
      method: 'POST',
      token: qrToken,
      signal,
      body,
    }),
  );
}

export async function getGuestIssuePhotoView(
  id: string,
  photoToken: string,
  qrToken: string,
  signal?: AbortSignal,
): Promise<GuestIssuePhotoViewDto> {
  requireGuestIssueQrToken(qrToken);
  const photo = requireGuestIssuePhotoClaim(id, photoToken);
  return readGuestIssuePhotoView(
    await apiRequest<unknown>(`/guest/issues/photos/${photo.id}/view`, {
      token: qrToken,
      photoToken: photo.token,
      signal,
    }),
  );
}

export async function removeGuestIssuePhoto(
  id: string,
  photoToken: string,
  qrToken: string,
  signal?: AbortSignal,
): Promise<RemovedGuestIssuePhotoDto> {
  requireGuestIssueQrToken(qrToken);
  const photo = requireGuestIssuePhotoClaim(id, photoToken);
  return readRemovedGuestIssuePhoto(
    await apiRequest<unknown>(`/guest/issues/photos/${photo.id}/remove`, {
      method: 'POST',
      token: qrToken,
      photoToken: photo.token,
      signal,
      body: {},
    }),
    photo.id,
  );
}
