export interface GuestDraftPhotoDto {
  id: string;
  status: 'READY';
  filename: string;
  contentType: 'image/jpeg';
  sizeBytes: number;
  width: number;
  height: number;
  createdAt: string;
}

export interface GuestDraftPhotoListDto {
  items: GuestDraftPhotoDto[];
  limits: {
    maxBytes: number;
    maxPhotos: number;
    acceptedTypes: string[];
  };
}

export interface GuestDraftPhotoViewDto {
  url: string;
  expiresAt: string;
}

export interface RemovedGuestDraftPhotoDto {
  id: string;
  status: 'DELETED';
}
