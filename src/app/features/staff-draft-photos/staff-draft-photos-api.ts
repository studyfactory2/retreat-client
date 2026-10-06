import { apiRequest } from '../../core/api/api-client';
import { requireStaffDraftToken } from '../staff-drafts/staff-drafts-validation';
import {
  readRemovedStaffDraftPhoto,
  readStaffDraftPhoto,
  readStaffDraftPhotos,
  readStaffDraftPhotoView,
} from './staff-draft-photos-readers';
import type {
  RemovedStaffDraftPhotoDto,
  StaffDraftPhotoDto,
  StaffDraftPhotoLimitsDto,
  StaffDraftPhotoListDto,
  StaffDraftPhotoViewDto,
} from './staff-draft-photos.types';
import {
  requireStaffPhotoId,
  validateStaffPhotoFile,
} from './staff-draft-photos-validation';

export async function getStaffDraftPhotos(
  token: string,
  signal?: AbortSignal,
): Promise<StaffDraftPhotoListDto> {
  requireStaffDraftToken(token);
  return readStaffDraftPhotos(
    await apiRequest<unknown>('/submission-drafts/photos', { token, signal }),
  );
}

export async function uploadStaffDraftPhoto(
  file: File,
  limits: StaffDraftPhotoLimitsDto,
  token: string,
  signal?: AbortSignal,
): Promise<StaffDraftPhotoDto> {
  requireStaffDraftToken(token);
  await validateStaffPhotoFile(file, limits);
  if (signal?.aborted)
    throw new DOMException('Request cancelled', 'AbortError');
  const body = new FormData();
  body.append('file', file);
  return readStaffDraftPhoto(
    await apiRequest<unknown>('/submission-drafts/photos', {
      method: 'POST',
      token,
      signal,
      body,
    }),
  );
}

export async function getStaffDraftPhotoView(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<StaffDraftPhotoViewDto> {
  requireStaffDraftToken(token);
  const photoId = requireStaffPhotoId(id);
  return readStaffDraftPhotoView(
    await apiRequest<unknown>(`/submission-drafts/photos/${photoId}/view`, {
      token,
      signal,
    }),
  );
}

export async function removeStaffDraftPhoto(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<RemovedStaffDraftPhotoDto> {
  requireStaffDraftToken(token);
  const photoId = requireStaffPhotoId(id);
  return readRemovedStaffDraftPhoto(
    await apiRequest<unknown>(`/submission-drafts/photos/${photoId}/remove`, {
      method: 'POST',
      token,
      signal,
      body: {},
    }),
    photoId,
  );
}
