import { ApiRequestError } from '../../../../core/api/api-error';
import type { GuestQrContextDto } from '../../../../features/guest-entry/guest-entry.types';
import type {
  GuestIssueCategoryDto,
  GuestIssueReceiptDto,
  GuestIssueReportFields,
  GuestIssueReportInput,
} from '../../../../features/guest-issues/guest-issues.types';

export type GuestIssueReportPhotoSnapshot = {
  id: string;
  token: string;
  expiresAt: string;
};

export type GuestIssueReportAttempt = {
  body: GuestIssueReportInput;
  propertyId: string;
};

export type ReadyGuestIssueReport = {
  status: 'ready';
  context: GuestQrContextDto;
  categories: GuestIssueCategoryDto[];
  form: GuestIssueReportFields;
  mode: 'edit' | 'review' | 'received';
  access: 'ready' | 'checking' | 'blocked';
  mutation: 'idle' | 'saving' | 'error' | 'category-conflict' | 'uncertain';
  reviewed: GuestIssueReportInput | null;
  reviewPhotos: GuestIssueReportPhotoSnapshot[];
  reviewCategory: GuestIssueCategoryDto | null;
  attempt: GuestIssueReportAttempt | null;
  receipt: GuestIssueReceiptDto | null;
  confirmation: 'cancel' | 'reload' | null;
  message: string;
};

export type GuestIssueReportResource =
  | { status: 'loading' }
  | {
      status: 'error';
      kind: 'unavailable' | 'request';
      message: string;
    }
  | ReadyGuestIssueReport;

export const guestIssueUncertainMessage =
  '접수 결과를 확인하지 못했습니다. 이미 접수되었을 수 있어 입력과 사진을 보관하고 변경을 멈췄습니다. 같은 내용으로 접수 결과를 다시 확인해 주세요.';
export const guestIssueCategoryChangedMessage =
  '신고 분류가 변경되었거나 더 이상 사용할 수 없습니다. 입력과 사진은 보관 중입니다. 현재 분류를 선택하고 내용을 다시 검토해 주세요.';

export function emptyGuestIssueForm(): GuestIssueReportFields {
  return {
    categoryId: '',
    guestName: '',
    title: '',
    description: '',
    isUrgent: false,
  };
}

export function readyGuestIssueReport(
  context: GuestQrContextDto,
  categories: GuestIssueCategoryDto[],
): ReadyGuestIssueReport {
  return {
    status: 'ready',
    context,
    categories,
    form: emptyGuestIssueForm(),
    mode: 'edit',
    access: 'ready',
    mutation: 'idle',
    reviewed: null,
    reviewPhotos: [],
    reviewCategory: null,
    attempt: null,
    receipt: null,
    confirmation: null,
    message: '',
  };
}

export function unavailableGuestIssueReport(): GuestIssueReportResource {
  return {
    status: 'error',
    kind: 'unavailable',
    message:
      '이 QR 링크를 사용할 수 없습니다. 안내받은 QR을 다시 확인하거나 관리자에게 문의해 주세요.',
  };
}

export function dirtyGuestIssueReport(local: ReadyGuestIssueReport): boolean {
  return (
    local.mode !== 'received' &&
    Object.values(local.form).some((value) => value !== '' && value !== false)
  );
}

export function rejectedGuestQr(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

export function unknownGuestIssueOutcome(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408 ||
    error.code === 'ISSUE_REQUEST_CHANGED' ||
    error.code === 'CONCURRENT_UPDATE'
  );
}

export function usableGuestIssuePhotos(
  photos: GuestIssueReportPhotoSnapshot[] | null,
): photos is GuestIssueReportPhotoSnapshot[] {
  return (
    photos !== null &&
    photos.length <= 10 &&
    photos.every((photo) => Date.parse(photo.expiresAt) > Date.now())
  );
}

export function sameGuestIssuePhotos(
  left: GuestIssueReportPhotoSnapshot[],
  right: GuestIssueReportPhotoSnapshot[],
): boolean {
  return (
    left.length === right.length &&
    left.every(
      (photo, index) =>
        photo.id === right[index].id && photo.token === right[index].token,
    )
  );
}
