import { ApiRequestError } from '../../core/api/api-error';
import {
  readGuestDraftPhoto,
  readGuestDraftPhotoView,
} from '../guest-draft-photos/guest-draft-photos-readers';
import { GUEST_PHOTO_MAX_COUNT } from '../guest-draft-photos/guest-draft-photos-validation';
import {
  readGuestDraftAnswers,
  sameGuestDraftAnswers,
} from '../guest-drafts/guest-draft-answers';
import {
  isGuestDraftDate,
  isGuestDraftType,
} from '../guest-drafts/guest-drafts-validation';
import { readGuestChecklistDefinition } from '../guest-entry/guest-checklist-readers';
import {
  isGuestId,
  isGuestTimestamp,
  isGuestVersion,
} from '../guest-entry/guest-entry-validation';
import type {
  GuestCorrectionInput,
  GuestSubmissionCorrectionDto,
  GuestSubmissionDetailDto,
  GuestSubmissionPhotoDto,
  GuestSubmissionPhotoViewDto,
} from './guest-submission-details.types';

export function invalidGuestSubmissionDetailResponse(): ApiRequestError {
  return new ApiRequestError(
    '제출 내역의 응답을 확인할 수 없습니다. 현재 내용을 다시 불러와 주세요.',
    200,
    'INVALID_GUEST_SUBMISSION_DETAIL_RESPONSE',
  );
}

function object(value: unknown): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalidGuestSubmissionDetailResponse();
  return value as Record<string, unknown>;
}

function capturedText(value: unknown, maximum: number): string {
  if (typeof value !== 'string' || !value.trim() || [...value].length > maximum)
    throw invalidGuestSubmissionDetailResponse();
  return value;
}

function nullableCapturedText(value: unknown, maximum: number): string | null {
  if (value === null) return null;
  if (typeof value !== 'string' || [...value].length > maximum)
    throw invalidGuestSubmissionDetailResponse();
  return value;
}

export function readGuestSubmissionDetail(
  value: unknown,
): GuestSubmissionDetailDto {
  try {
    const detail = object(value);
    const property = object(detail.property);
    const guest = object(detail.guest);
    const template = object(detail.template);
    if (
      !isGuestId(detail.id) ||
      !isGuestId(property.id) ||
      !isGuestDraftType(detail.type) ||
      detail.status !== 'SUBMITTED' ||
      !isGuestVersion(detail.revision) ||
      !isGuestDraftDate(detail.visitDate) ||
      template.schemaVersion !== 1 ||
      !isGuestId(template.id) ||
      template.type !== detail.type ||
      !isGuestVersion(template.version) ||
      !isGuestTimestamp(detail.submittedAt) ||
      !isGuestTimestamp(detail.updatedAt) ||
      !isGuestTimestamp(detail.expiresAt) ||
      detail.updatedAt < detail.submittedAt ||
      detail.expiresAt <= detail.submittedAt ||
      !Array.isArray(detail.photos) ||
      detail.photos.length > GUEST_PHOTO_MAX_COUNT
    )
      throw invalidGuestSubmissionDetailResponse();

    const definition = readGuestChecklistDefinition(template.definition);
    const answers = readGuestDraftAnswers(detail.answers, definition);
    const byItem = new Map(
      answers.items.map((answer) => [answer.itemId, answer]),
    );
    const itemSections = new Map(
      definition.sections.flatMap((section) =>
        section.items.map((item) => [item.id, section.id] as const),
      ),
    );
    if (
      definition.sections.some((section) =>
        section.items.some((item) => item.required && !byItem.has(item.id)),
      )
    )
      throw invalidGuestSubmissionDetailResponse();
    const usedPhotos = new Set<string>();
    const photos: GuestSubmissionPhotoDto[] = detail.photos.map(
      (value: unknown, index: number) => {
        const photo = object(value);
        const metadata = readGuestDraftPhoto(value);
        if (
          photo.purpose !== 'DEFECT' ||
          !isGuestId(photo.sectionId) ||
          !isGuestId(photo.itemId) ||
          photo.sortOrder !== index ||
          usedPhotos.has(metadata.id) ||
          itemSections.get(photo.itemId.toLowerCase()) !==
            photo.sectionId.toLowerCase() ||
          byItem.get(photo.itemId.toLowerCase())?.value !== 'ABNORMAL' ||
          metadata.createdAt > (detail.submittedAt as string)
        )
          throw invalidGuestSubmissionDetailResponse();
        usedPhotos.add(metadata.id);
        return {
          ...metadata,
          purpose: 'DEFECT',
          sectionId: photo.sectionId.toLowerCase(),
          itemId: photo.itemId.toLowerCase(),
          areaLabel: nullableCapturedText(photo.areaLabel, 150),
          sortOrder: index,
        };
      },
    );
    return {
      id: detail.id.toLowerCase(),
      type: detail.type,
      status: 'SUBMITTED',
      revision: detail.revision,
      property: {
        id: property.id.toLowerCase(),
        name: capturedText(property.name, 100),
        region: nullableCapturedText(property.region, 100),
      },
      visitDate: detail.visitDate,
      guest: {
        name: capturedText(guest.name, 100),
        company: nullableCapturedText(guest.company, 150),
        department: nullableCapturedText(guest.department, 150),
        phone: nullableCapturedText(guest.phone, 50),
      },
      template: {
        schemaVersion: 1,
        id: template.id.toLowerCase(),
        type: detail.type,
        title: capturedText(template.title, 150),
        version: template.version,
        definition,
      },
      answers,
      submittedAt: detail.submittedAt,
      updatedAt: detail.updatedAt,
      expiresAt: detail.expiresAt,
      photos,
    };
  } catch {
    // Draft/template/photo readers have their own errors; this boundary owns
    // the submitted-record failure so callers never mistake it for input rejection.
    throw invalidGuestSubmissionDetailResponse();
  }
}

export function readGuestSubmissionPhotoView(
  value: unknown,
  allowLoopbackHttp = import.meta.env.DEV,
): GuestSubmissionPhotoViewDto {
  try {
    return readGuestDraftPhotoView(value, allowLoopbackHttp);
  } catch {
    throw invalidGuestSubmissionDetailResponse();
  }
}

export function verifyGuestSubmissionIdentity(
  current: GuestSubmissionDetailDto,
  previous: GuestSubmissionDetailDto,
): void {
  if (
    current.id !== previous.id ||
    current.type !== previous.type ||
    current.visitDate !== previous.visitDate ||
    current.submittedAt !== previous.submittedAt ||
    current.expiresAt !== previous.expiresAt ||
    JSON.stringify(current.property) !== JSON.stringify(previous.property) ||
    JSON.stringify(current.guest) !== JSON.stringify(previous.guest) ||
    JSON.stringify(current.template) !== JSON.stringify(previous.template)
  )
    throw invalidGuestSubmissionDetailResponse();
}

export function readGuestSubmissionCorrection(
  value: unknown,
  base: GuestSubmissionDetailDto,
  input: GuestCorrectionInput,
): GuestSubmissionCorrectionDto {
  const invalid = () =>
    new ApiRequestError(
      '수정 결과를 확인할 수 없습니다. 다시 저장하기 전에 현재 제출 내역을 확인해 주세요.',
      200,
      'INVALID_GUEST_CORRECTION_RESPONSE',
    );
  try {
    const result = object(value);
    const changed = !sameGuestDraftAnswers(base.answers, {
      schemaVersion: 1,
      items: input.items.map((answer) => ({
        ...answer,
        repairReported: false,
        repairNote: null,
      })),
      generalNote: input.generalNote,
    });
    if (
      !isGuestId(result.id) ||
      result.id.toLowerCase() !== base.id ||
      result.status !== 'SUBMITTED' ||
      !isGuestVersion(result.revision) ||
      !isGuestTimestamp(result.updatedAt) ||
      result.changed !== changed ||
      result.revision !== base.revision + (changed ? 1 : 0) ||
      (changed
        ? result.updatedAt <= base.updatedAt
        : result.updatedAt !== base.updatedAt)
    )
      throw invalid();
    // A successful replay can precede a newer current revision. Check the
    // request's captured base only; the screen must separately reload current.
    return {
      id: result.id.toLowerCase(),
      status: 'SUBMITTED',
      revision: result.revision,
      updatedAt: result.updatedAt,
      changed,
    };
  } catch {
    throw invalid();
  }
}
