import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { useNavigationGuard } from '../../../../core/router/navigation/use-navigation-guard';
import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import type { StaffDraftPhotoDto } from '../../../../features/staff-draft-photos/staff-draft-photos.types';
import type { StaffSubmissionPhotoInput } from '../../../../features/staff-submissions/staff-submissions.types';
import { assertStaffChecklistComplete } from '../../../../features/staff-submissions/staff-submissions-validation';
import type { useStaffDraft } from './use-staff-draft';
import { useStaffDraftPhotos } from './use-staff-draft-photos';
import { useStaffSubmission } from './use-staff-submission';
import { changeStaffDraftDetails } from '../model/staff-draft-model';
import { formatStaffDraftTime } from '../model/staff-draft-display';
import {
  sameStaffPhotoList,
  staffPhotoInputs,
  type StaffPhotoAssignment,
} from '../model/staff-flow-model';

type DraftSession = ReturnType<typeof useStaffDraft>;
type ReadyResource = Extract<DraftSession['resource'], { status: 'ready' }>;
type Review = {
  draft: StaffDraftDto;
  photos: StaffDraftPhotoDto[];
  inputs: StaffSubmissionPhotoInput[];
};
export type StaffWorkflowOptions = {
  session: DraftSession;
  resource: ReadyResource;
  token: string;
};

export function useStaffWorkflow({
  session,
  resource,
  token,
}: StaffWorkflowOptions) {
  const { draft, answers } = resource;
  const [step, setStep] = useState(0);
  const [review, setReview] = useState<Review | null>(null);
  const [assignments, setAssignments] = useState<
    Record<string, StaffPhotoAssignment>
  >({});
  const [preparing, setPreparing] = useState(false);
  const [later, setLater] = useState(false);
  const [message, setMessage] = useState('');
  const alive = useRef(false);
  const preparingRef = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useLayoutEffect(() => {
    alive.current = true;
    return () => {
      alive.current = false;
    };
  }, []);
  const submission = useStaffSubmission({
    token,
    draft,
    canSubmit: session.canEdit && !session.dirty && step === 2,
    onLockChange: session.setSubmissionLocked,
    onSubmitted: session.complete,
    onAccessRejected: session.rejectAccess,
    onDraftRefresh: session.recheck,
  });
  const accessReady = resource.access === 'ready' && !submission.locked;
  const photos = useStaffDraftPhotos({
    token,
    draftId: draft.id,
    expiresAt: draft.expiresAt,
    locked: !session.canEdit || preparing || step === 2 || submission.locked,
    accessReady,
    onAccessRejected: session.rejectAccess,
  });
  useNavigationGuard(submission.hasPendingWork);
  const hasAssignments = useRef(false);
  useLayoutEffect(() => {
    if (photos.resource.status === 'ready')
      hasAssignments.current = photos.resource.list.items.some((photo) =>
        Boolean(assignments[photo.id]),
      );
  }, [assignments, photos.resource]);
  const hasPendingAssignments = useCallback(
    () => hasAssignments.current || preparingRef.current,
    [],
  );
  useNavigationGuard(hasPendingAssignments);
  useEffect(() => {
    const warn = (event: BeforeUnloadEvent) => {
      if (hasPendingAssignments()) {
        event.preventDefault();
        event.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [hasPendingAssignments]);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }, [step, later]);
  const unresolved =
    resource.mutation === 'conflict' || resource.mutation === 'uncertain';
  const saving = resource.mutation === 'saving';
  const disabled = !session.canEdit || preparing || submission.locked;
  const required = draft.template.definition.sections
    .flatMap((section) => section.items)
    .filter((item) => item.required);
  const answered = required.filter((item) =>
    answers.items.some((answer) => answer.itemId === item.id),
  ).length;
  const photoReady =
    photos.resource.status === 'ready' &&
    !photos.busy &&
    !photos.hasPendingWork();
  const reviewCurrent = Boolean(
    review &&
    !session.dirty &&
    review.draft.updatedAt === draft.updatedAt &&
    sameStaffPhotoList(review.photos, photos.items) &&
    photoReady,
  );
  const titles = [
    '시설 상태를 확인해 주세요',
    '정비 사진을 남겨 주세요',
    '제출 내용을 확인해 주세요',
  ];
  const editableDraft = { ...draft, answers };
  const go = (next: number) => {
    setMessage('');
    setLater(false);
    setStep(next);
  };
  const prepareReview = async () => {
    if (disabled || preparingRef.current || !photoReady) return;
    preparingRef.current = true;
    setPreparing(true);
    setMessage('');
    try {
      assertStaffChecklistComplete(editableDraft);
      staffPhotoInputs(editableDraft, photos.items, assignments);
      const saved = await session.save();
      if (!saved || !alive.current) return;
      const list = await photos.refresh();
      if (!list || !alive.current) return;
      const inputs = staffPhotoInputs(saved, list.items, assignments);
      setReview({ draft: saved, photos: list.items, inputs });
      go(2);
    } catch (error: unknown) {
      if (alive.current)
        setMessage(
          error instanceof Error
            ? error.message
            : '입력 내용을 다시 확인해 주세요.',
        );
    } finally {
      preparingRef.current = false;
      if (alive.current) setPreparing(false);
    }
  };
  const continueLater = async () => {
    if (disabled || preparingRef.current) return;
    if (photos.hasPendingWork() || photos.busy) {
      go(1);
      setMessage(
        '사진 처리 결과를 먼저 확인해 주세요. 점검 내용은 사진 확인 후 나중에 계속하기로 저장할 수 있어요.',
      );
      return;
    }
    preparingRef.current = true;
    setPreparing(true);
    setMessage('');
    try {
      const saved = await session.save();
      if (saved && alive.current) setLater(true);
    } finally {
      preparingRef.current = false;
      if (alive.current) setPreparing(false);
    }
  };
  const assignPhoto = (id: string, value: StaffPhotoAssignment) => {
    setReview(null);
    setAssignments((current) => ({ ...current, [id]: value }));
  };
  const changeAnswerDetails = (
    itemId: string,
    change: Parameters<typeof changeStaffDraftDetails>[2],
  ) => {
    session.edit((current) => changeStaffDraftDetails(current, itemId, change));
  };
  const changeGeneralNote = (value: string) => {
    session.edit((current) => ({ ...current, generalNote: value }));
  };
  const advance = () => {
    if (step === 0) {
      try {
        assertStaffChecklistComplete(editableDraft);
        go(1);
      } catch {
        setMessage(
          '필수 항목의 상태를 모두 선택해 주세요. 일부만 작성했다면 나중에 계속하기로 저장할 수 있어요.',
        );
      }
    } else if (step === 1) void prepareReview();
    else if (review && reviewCurrent)
      void submission.submit(review.inputs, review.draft.updatedAt);
  };
  const saveStateLabel = saving
    ? '저장 중…'
    : preparing
      ? '내용 확인 중…'
      : unresolved
        ? '저장 상태 확인 필요'
        : resource.access !== 'ready'
          ? '연결 확인 필요'
          : session.dirty
            ? '아직 저장하지 않은 변경이 있어요'
            : `저장됨 · ${formatStaffDraftTime(draft.updatedAt)}`;
  return {
    draft,
    answers,
    step,
    review,
    assignments,
    preparing,
    later,
    message,
    heading,
    submission,
    accessReady,
    photos,
    unresolved,
    saving,
    disabled,
    answered,
    requiredCount: required.length,
    photoReady,
    reviewCurrent,
    editableDraft,
    stepTitle: later ? '이어쓰기 링크를 보관해 주세요' : titles[step],
    saveStateLabel,
    nextDisabled:
      disabled || (step > 0 && !photoReady) || (step === 2 && !reviewCurrent),
    nextLabel:
      step === 0
        ? '다음: 사진'
        : step === 1
          ? '저장하고 내용 확인'
          : '정비 완료 제출',
    go,
    advance,
    continueLater,
    resume: () => setLater(false),
    assignPhoto,
    changeAnswerDetails,
    changeGeneralNote,
  };
}
