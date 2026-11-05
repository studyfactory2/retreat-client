export const messageKinds = [
  'GUEST_CHECKIN',
  'GUEST_CHECKOUT',
  'GUEST_CHANGE',
  'GUEST_CANCEL',
  'STAFF_ASSIGNMENT',
  'STAFF_CHANGE',
  'STAFF_CANCEL',
] as const;
export type MessageKind = (typeof messageKinds)[number];
export type MessageSubject = {
  subjectType: 'STAY' | 'TASK';
  subjectId: string;
};
export type MessageProblem = { code: string; message: string };
export type MessagingStatus = {
  enabled: boolean;
  ready: boolean;
  channel: 'ALIMTALK';
  smsFallbackEnabled: false;
  reasons: MessageProblem[];
  templates: { kind: MessageKind; label: string; configured: boolean }[];
};
export type MessageDispatch = MessageSubject & {
  id: string;
  kind: MessageKind;
  mode: 'MANUAL' | 'AUTOMATIC';
  status: 'SENDING' | 'ACCEPTED' | 'DELIVERED' | 'FAILED' | 'UNKNOWN';
  maskedRecipient: string;
  createdAt: string;
  updatedAt: string;
  lastCheckedAt: string | null;
  errorCode: string | null;
};
export type MessageSummary = MessageSubject & {
  availableKinds: MessageKind[];
  history: MessageDispatch[];
};
export type MessagePreview = MessageSubject & {
  kind: MessageKind;
  label: string;
  channel: 'ALIMTALK';
  recipient: { name: string; maskedPhone: string | null };
  body: string;
  buttons: { label: string; url: string }[];
  previewKey: string;
  canSend: boolean;
  blockers: MessageProblem[];
  warnings: string[];
};
export type MessageAttempt = {
  kind: MessageKind;
  requestKey: string;
  previewKey: string;
};
export type MessageAutomation = {
  enabled: boolean;
  activatedAt: string | null;
  checkoutReminderHour: number;
  jobs: {
    id: string;
    kind: MessageKind;
    dueAt: string;
    status:
      'PENDING' | 'BLOCKED' | 'COMPLETED' | 'SKIPPED' | 'UNKNOWN' | 'FAILED';
    reason: string | null;
    dispatchId: string | null;
  }[];
};

export const messageKindLabels: Record<MessageKind, string> = {
  GUEST_CHECKIN: '입실 안내',
  GUEST_CHECKOUT: '퇴실 안내',
  GUEST_CHANGE: '일정 변경',
  GUEST_CANCEL: '일정 취소',
  STAFF_ASSIGNMENT: '작업 배정',
  STAFF_CHANGE: '작업 변경',
  STAFF_CANCEL: '작업 취소',
};
export const messageStatusLabels: Record<MessageDispatch['status'], string> = {
  SENDING: '요청접수',
  ACCEPTED: '요청접수',
  DELIVERED: '전달완료',
  FAILED: '실패',
  UNKNOWN: '결과확인필요',
};
