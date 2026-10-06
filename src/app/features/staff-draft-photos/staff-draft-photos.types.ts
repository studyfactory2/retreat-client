export type StaffPhotoContentType = 'image/jpeg' | 'image/png' | 'image/webp';

export interface StaffDraftPhotoDto {
  id: string;
  status: 'READY';
  filename: string;
  contentType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface StaffDraftPhotoLimitsDto {
  maxBytes: number;
  maxPhotos: number;
  acceptedTypes: StaffPhotoContentType[];
}

export interface StaffDraftPhotoListDto {
  items: StaffDraftPhotoDto[];
  limits: StaffDraftPhotoLimitsDto;
}

export interface StaffDraftPhotoViewDto {
  url: string;
  expiresAt: string;
}

export interface RemovedStaffDraftPhotoDto {
  id: string;
  status: 'DELETED';
}
