import { ApiRequestError } from '../../../../core/api/api-error';
import { sameGuestDraftAnswers } from '../../../../features/guest-drafts/guest-draft-answers';
import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import { verifyGuestSubmissionIdentity } from '../../../../features/guest-submission-details/guest-submission-details-readers';
import type {
  GuestCorrectionInput,
  GuestSubmissionCorrectionDto,
  GuestSubmissionDetailDto,
} from '../../../../features/guest-submission-details/guest-submission-details.types';

export type CorrectionAttempt = {
  base: GuestSubmissionDetailDto;
  body: GuestCorrectionInput;
  answers: GuestDraftAnswers;
  receipt: GuestSubmissionCorrectionDto | null;
};

export type ReadyGuestSubmission = {
  status: 'ready';
  detail: GuestSubmissionDetailDto;
  answers: GuestDraftAnswers;
  reason: string;
  mode: 'view' | 'edit' | 'review';
  access: 'ready' | 'checking' | 'blocked';
  mutation: 'idle' | 'saving' | 'saved' | 'error' | 'conflict' | 'uncertain';
  attempt: CorrectionAttempt | null;
  latest: GuestSubmissionDetailDto | null;
  confirmation: 'cancel' | 'reload' | null;
  message: string;
};

export type GuestSubmissionResource =
  | { status: 'loading' }
  | {
      status: 'error';
      kind: 'unavailable' | 'unsupported' | 'request';
      message: string;
    }
  | ReadyGuestSubmission;

export const correctionChangedMessage =
  '다른 화면에서 제출 내용이 수정되었습니다. 현재 입력은 보관 중입니다. 최신 내용을 불러와 확인한 뒤 다시 수정해 주세요.';
export const correctionUncertainMessage =
  '수정 결과를 확인하지 못했습니다. 이미 저장되었을 수 있어 입력을 보관하고 변경을 잠시 멈췄습니다. 결과를 다시 확인하거나 같은 내용으로 재확인해 주세요.';

export function readySubmission(
  detail: GuestSubmissionDetailDto,
  message = '',
): ReadyGuestSubmission {
  return {
    status: 'ready',
    detail,
    answers: detail.answers,
    reason: '',
    mode: 'view',
    access: 'ready',
    mutation: message ? 'saved' : 'idle',
    attempt: null,
    latest: null,
    confirmation: null,
    message,
  };
}

export function unavailableSubmission(): GuestSubmissionResource {
  return {
    status: 'error',
    kind: 'unavailable',
    message:
      '이 제출 링크를 사용할 수 없습니다. 전달받은 링크를 확인하거나 관리자에게 문의해 주세요.',
  };
}

export function submissionExpired(detail: { expiresAt: string }): boolean {
  return Date.parse(detail.expiresAt) <= Date.now();
}

export function dirtySubmission(local: ReadyGuestSubmission): boolean {
  return (
    local.reason !== '' ||
    !sameGuestDraftAnswers(local.answers, local.detail.answers)
  );
}

export function rejectedSubmissionAccess(error: unknown): boolean {
  return (
    error instanceof ApiRequestError &&
    (error.status === 401 || error.status === 403)
  );
}

export function unknownCorrectionOutcome(error: unknown): boolean {
  return (
    !(error instanceof ApiRequestError) ||
    error.status === null ||
    error.status < 400 ||
    error.status >= 500 ||
    error.status === 408
  );
}

export function assertCurrentSubmission(
  detail: GuestSubmissionDetailDto,
  previous: GuestSubmissionDetailDto,
): void {
  verifyGuestSubmissionIdentity(detail, previous);
  if (
    detail.revision < previous.revision ||
    (detail.revision > previous.revision &&
      detail.updatedAt <= previous.updatedAt) ||
    (detail.revision === previous.revision &&
      (detail.updatedAt !== previous.updatedAt ||
        !sameGuestDraftAnswers(detail.answers, previous.answers) ||
        JSON.stringify(detail.photos) !== JSON.stringify(previous.photos)))
  ) {
    throw new ApiRequestError(
      '제출 내용의 최신 상태를 확인하지 못했습니다. 다시 확인해 주세요.',
      200,
      'INVALID_GUEST_SUBMISSION_DETAIL_RESPONSE',
    );
  }
}

export function freezeCorrectionAttempt(
  base: GuestSubmissionDetailDto,
  body: GuestCorrectionInput,
): CorrectionAttempt {
  // Neither subsequent edits nor retries may change this full request body.
  const frozenBody = structuredClone(body);
  for (const item of frozenBody.items) Object.freeze(item);
  Object.freeze(frozenBody.items);
  Object.freeze(frozenBody);
  return {
    base: structuredClone(base),
    body: frozenBody,
    answers: {
      schemaVersion: 1,
      items: frozenBody.items.map((item) => ({
        ...item,
        repairReported: false,
        repairNote: null,
      })),
      generalNote: frozenBody.generalNote,
    },
    receipt: null,
  };
}

export function verifiedAttemptResult(
  attempt: CorrectionAttempt,
  detail: GuestSubmissionDetailDto,
): boolean {
  if (attempt.receipt) {
    if (detail.revision < attempt.receipt.revision) return false;
    return (
      (detail.revision > attempt.receipt.revision &&
        detail.updatedAt > attempt.receipt.updatedAt) ||
      (detail.revision === attempt.receipt.revision &&
        detail.updatedAt === attempt.receipt.updatedAt &&
        sameGuestDraftAnswers(detail.answers, attempt.answers) &&
        sameCorrectionPhotos(attempt, detail))
    );
  }
  // Even exact next-revision answers do not reveal the correction reason or
  // prove which request won. An identical retry supplies the stored receipt.
  return false;
}

function sameCorrectionPhotos(
  attempt: CorrectionAttempt,
  detail: GuestSubmissionDetailDto,
): boolean {
  const abnormal = new Set(
    attempt.answers.items
      .filter((answer) => answer.value === 'ABNORMAL')
      .map((answer) => answer.itemId),
  );
  const retained = attempt.base.photos
    .filter((photo) => abnormal.has(photo.itemId))
    .map((photo, sortOrder) => ({ ...photo, sortOrder }));
  return (
    detail.photos.length === retained.length &&
    retained.every((photo, index) =>
      Object.entries(photo).every(
        ([key, value]) =>
          detail.photos[index][key as keyof typeof photo] === value,
      ),
    )
  );
}

export function canDiscardCorrectionAttempt(
  local: ReadyGuestSubmission,
): boolean {
  return (
    local.access === 'ready' &&
    local.mutation !== 'saving' &&
    local.attempt !== null &&
    local.latest !== null &&
    local.latest.revision > local.attempt.body.expectedRevision
  );
}
