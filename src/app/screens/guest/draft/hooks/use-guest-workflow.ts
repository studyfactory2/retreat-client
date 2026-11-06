import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { useNavigationGuard } from '../../../../core/router/navigation/use-navigation-guard';
import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type {
  GuestDraftPhotoDto,
  GuestDraftPhotoListDto,
} from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import { assertGuestChecklistComplete } from '../../../../features/guest-submissions/guest-submissions-validation';
import type { GuestSubmissionPhotoInput } from '../../../../features/guest-submissions/guest-submissions.types';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import {
  guestPhotoInputs,
  sameGuestPhotoList,
  type GuestFlowStep,
} from '../model/guest-flow-model';
import type { DraftResource, useGuestDraft } from './use-guest-draft';
import { useGuestDraftPhotos } from './use-guest-draft-photos';

export type GuestDraftSession = ReturnType<typeof useGuestDraft>;
type Review = {
  draft: GuestDraftDto;
  photos: GuestDraftPhotoDto[];
  assignments: GuestSubmissionPhotoInput[];
};

export function useGuestWorkflow(
  session: GuestDraftSession,
  resource: Extract<DraftResource, { status: 'ready' }>,
  token: string,
) {
  const { draft, answers, access, mutation, attempt } = resource;
  const [step, setStep] = useState<GuestFlowStep>(0);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [reconciledPhotoList, setReconciledPhotoList] =
    useState<GuestDraftPhotoListDto | null>(null);
  const [lastIssuePhotoItem, setLastIssuePhotoItem] = useState('');
  const [review, setReview] = useState<Review | null>(null);
  const [preparing, setPreparing] = useState(false);
  const [later, setLater] = useState(false);
  const [message, setMessage] = useState('');
  const operation = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const generation = useRef<object | null>(null);
  useLayoutEffect(() => {
    const owner = {};
    generation.current = owner;
    return () => {
      generation.current = null;
    };
  }, [token, draft.id]);

  const unresolved = mutation === 'conflict' || mutation === 'uncertain';
  const disabled =
    access !== 'ready' ||
    mutation === 'saving' ||
    unresolved ||
    attempt !== null ||
    preparing;
  const photos = useGuestDraftPhotos({
    token,
    draftId: draft.id,
    locked: disabled || step === 2 || later,
    onAccessRejected: session.recheck,
    onAssignedUpload: (id, assignment) => {
      setAssignments((previous) => ({ ...previous, [id]: assignment }));
    },
  });
  const photoWork =
    photos.busy || photos.queue.length > 0 || photos.removal !== null;
  const photoResource = photos.resource;
  // Only a successful list can confirm that mapped photos were removed.
  if (
    photoResource.status === 'ready' &&
    photoResource.list !== reconciledPhotoList
  ) {
    setReconciledPhotoList(photoResource.list);
    const ids = new Set(photoResource.list.items.map((photo) => photo.id));
    setAssignments((previous) => {
      const entries = Object.entries(previous);
      if (entries.every(([id]) => ids.has(id))) return previous;
      return Object.fromEntries(entries.filter(([id]) => ids.has(id)));
    });
  }
  const mapped = Object.values(assignments).some(Boolean);
  useNavigationGuard(
    () => later ? 'private-draft-link' : photos.hasPendingWork() || operation.current || mapped,
  );
  useEffect(() => {
    if (!later && !mapped && !preparing) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [later, mapped, preparing]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step, later]);

  const editableDraft = { ...draft, answers };
  const required = draft.template.definition.sections
    .flatMap((section) => section.items)
    .filter((item) => item.required);
  const answered = required.filter((item) =>
    answers.items.some((answer) => answer.itemId.toLowerCase() === item.id.toLowerCase()),
  ).length;
  const photoReady = !photos.busy && !photos.blocked;
  const reviewCurrent =
    review !== null &&
    !session.dirty &&
    review.draft.updatedAt === draft.updatedAt &&
    sameGuestPhotoList(review.photos, photos.items) &&
    photoReady;

  function go(next: GuestFlowStep) {
    setMessage('');
    setLater(false);
    setStep(next);
  }

  async function prepareReview() {
    if (disabled || operation.current || photos.hasPendingWork() || !photoReady)
      return;
    const owner = generation.current;
    operation.current = true;
    setPreparing(true);
    setMessage('');
    setReview(null);
    try {
      if (answered < required.length) go(0);
      assertGuestChecklistComplete(editableDraft);
      guestPhotoInputs(editableDraft, photos.items, assignments);
      const saved = await session.save();
      if (!saved || generation.current !== owner) return;
      const list = await photos.refresh();
      if (generation.current !== owner) return;
      if (!list) {
        setMessage(
          '저장한 답변은 유지됩니다. 사진 목록을 다시 확인한 뒤 제출 내용을 확인해 주세요.',
        );
        return;
      }
      assertGuestChecklistComplete(saved);
      const inputs = guestPhotoInputs(saved, list.items, assignments);
      setReview({ draft: saved, photos: list.items, assignments: inputs });
      go(2);
    } catch (error: unknown) {
      if (generation.current === owner)
        setMessage(
          error instanceof Error
            ? error.message
            : '제출 내용을 확인하지 못했습니다. 다시 확인해 주세요.',
        );
    } finally {
      if (generation.current === owner) {
        operation.current = false;
        setPreparing(false);
      }
    }
  }

  async function continueLater() {
    if (disabled || operation.current || photos.hasPendingWork()) return;
    const owner = generation.current;
    operation.current = true;
    setPreparing(true);
    setMessage('');
    try {
      const saved = await session.save();
      if (saved && generation.current === owner) {
        setLater(true);
      }
    } finally {
      if (generation.current === owner) {
        operation.current = false;
        setPreparing(false);
      }
    }
  }

  function advance() {
    if (disabled || operation.current || photos.hasPendingWork()) return;
    if (step === 0) {
      try {
        assertGuestChecklistComplete(editableDraft);
        go(1);
      } catch (error: unknown) {
        setMessage(
          error instanceof Error ? error.message : '필수 항목을 확인해 주세요.',
        );
      }
    } else if (step === 1) void prepareReview();
  }

  return {
    step,
    later,
    message: step === 0 && answered === required.length ? '' : message,
    heading,
    photos,
    assignments,
    review,
    reviewCurrent,
    required: required.length,
    answered,
    preparing,
    disabled,
    photoWork,
    editableDraft,
    advance,
    continueLater,
    lastIssuePhotoItem,
    openPhotos: () => {
      if (!disabled && !operation.current) go(1);
    },
    addIssuePhotos: (files: FileList, itemId: string) => {
      if (disabled || operation.current || !photoReady || !files.length) return;
      setLastIssuePhotoItem(itemId);
      photos.uploadFiles(files, itemId);
    },
    back: () => {
      if (disabled || operation.current || photos.hasPendingWork()) return;
      setReview(null);
      go(step === 2 ? 1 : 0);
    },
    resume: () => {
      if (!disabled) go(step === 2 && !reviewCurrent ? 1 : step);
    },
    assign: (id: string, value: string) => {
      if (disabled || step !== 1 || photos.hasPendingWork()) return;
      setMessage('');
      setReview(null);
      setAssignments((previous) => ({ ...previous, [id]: value }));
    },
    submit: () => {
      if (
        disabled ||
        operation.current ||
        photos.hasPendingWork() ||
        !reviewCurrent ||
        !review
      )
        return;
      void session.submit(
        review.assignments,
        review.draft.updatedAt,
        photos.refresh,
      );
    },
    saveLabel:
      mutation === 'saving' || preparing
        ? '저장 상태를 확인하고 있습니다…'
        : unresolved
          ? '저장 결과를 먼저 확인해 주세요.'
          : access !== 'ready'
            ? '연결 확인 후 계속할 수 있습니다.'
            : session.dirty
              ? '저장 전 변경 사항이 있어요. 나가려면 먼저 임시 저장해 주세요.'
              : `최근 저장 ${formatGuestStayTimestamp(draft.updatedAt)} · 한국 시간`,
  };
}
