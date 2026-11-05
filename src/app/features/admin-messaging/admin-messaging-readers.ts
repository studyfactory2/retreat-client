import { ApiRequestError } from '../../core/api/api-error';
import {
  messageKinds,
  type MessageDispatch,
  type MessageAutomation,
  type MessageKind,
  type MessagePreview,
  type MessageProblem,
  type MessageSubject,
  type MessageSummary,
  type MessagingStatus,
} from './admin-messaging.types';

function invalid(): never {
  throw new ApiRequestError(
    '메시지 응답을 확인하지 못했습니다.',
    200,
    'INVALID_RESPONSE',
  );
}
function object(value: unknown): Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : invalid();
}
function string(value: unknown): string {
  return typeof value === 'string' ? value : invalid();
}
function boolean(value: unknown): boolean {
  return typeof value === 'boolean' ? value : invalid();
}
function list<T>(value: unknown, read: (item: unknown) => T): T[] {
  return Array.isArray(value) ? value.map(read) : invalid();
}
function nullable(value: unknown): string | null {
  return value === null ? null : string(value);
}
function timestamp(value: unknown): string {
  const result = string(value);
  return Number.isFinite(Date.parse(result)) ? result : invalid();
}
function kind(value: unknown): MessageKind {
  return messageKinds.includes(value as MessageKind)
    ? (value as MessageKind)
    : invalid();
}
function subject(
  value: Record<string, unknown>,
  expected: MessageSubject,
): MessageSubject {
  if (
    value.subjectType !== expected.subjectType ||
    value.subjectId !== expected.subjectId
  )
    invalid();
  return expected;
}
function problem(value: unknown): MessageProblem {
  const item = object(value);
  return { code: string(item.code), message: string(item.message) };
}
export function readMessagingStatus(value: unknown): MessagingStatus {
  const item = object(value);
  if (item.channel !== 'ALIMTALK' || item.smsFallbackEnabled !== false)
    invalid();
  return {
    enabled: boolean(item.enabled),
    ready: boolean(item.ready),
    channel: 'ALIMTALK',
    smsFallbackEnabled: false,
    reasons: list(item.reasons, problem),
    templates: list(item.templates, (value) => {
      const template = object(value);
      return {
        kind: kind(template.kind),
        label: string(template.label),
        configured: boolean(template.configured),
      };
    }),
  };
}
export function readMessageDispatch(
  value: unknown,
  expected: MessageSubject,
): MessageDispatch {
  const item = object(value);
  if (
    !['SENDING', 'ACCEPTED', 'DELIVERED', 'FAILED', 'UNKNOWN'].includes(
      string(item.status),
    ) ||
    !['MANUAL', 'AUTOMATIC'].includes(string(item.mode))
  )
    invalid();
  return {
    ...subject(item, expected),
    id: string(item.id),
    kind: kind(item.kind),
    mode: item.mode as MessageDispatch['mode'],
    status: item.status as MessageDispatch['status'],
    maskedRecipient: string(item.maskedRecipient),
    createdAt: timestamp(item.createdAt),
    updatedAt: timestamp(item.updatedAt),
    lastCheckedAt:
      item.lastCheckedAt === null ? null : timestamp(item.lastCheckedAt),
    errorCode: nullable(item.errorCode),
  };
}
export function readMessageSummary(
  value: unknown,
  expected: MessageSubject,
): MessageSummary {
  const item = object(value);
  return {
    ...subject(item, expected),
    availableKinds: list(item.availableKinds, kind),
    history: list(item.history, (entry) =>
      readMessageDispatch(entry, expected),
    ),
  };
}
export function readMessagePreview(
  value: unknown,
  expected: MessageSubject,
  expectedKind: MessageKind,
): MessagePreview {
  const item = object(value);
  const recipient = object(item.recipient);
  if (item.channel !== 'ALIMTALK' || item.kind !== expectedKind) invalid();
  const blockers = list(item.blockers, problem);
  const canSend = boolean(item.canSend);
  if (
    canSend &&
    (blockers.length || !item.previewKey || !recipient.maskedPhone)
  )
    invalid();
  return {
    ...subject(item, expected),
    kind: expectedKind,
    label: string(item.label),
    channel: 'ALIMTALK',
    recipient: {
      name: string(recipient.name),
      maskedPhone: nullable(recipient.maskedPhone),
    },
    body: string(item.body),
    previewKey: string(item.previewKey),
    canSend,
    blockers,
    warnings: list(item.warnings, string),
    buttons: list(item.buttons, (value) => {
      const button = object(value);
      return { label: string(button.label), url: string(button.url) };
    }),
  };
}
export function readMessageAutomation(value: unknown): MessageAutomation {
  const item = object(value);
  if (
    typeof item.checkoutReminderHour !== 'number' ||
    !Number.isInteger(item.checkoutReminderHour) ||
    item.checkoutReminderHour < 0 ||
    item.checkoutReminderHour > 23
  )
    invalid();
  return {
    enabled: boolean(item.enabled),
    activatedAt: item.activatedAt === null ? null : timestamp(item.activatedAt),
    checkoutReminderHour: item.checkoutReminderHour,
    jobs: list(item.jobs, (value) => {
      const job = object(value);
      if (
        ![
          'PENDING',
          'BLOCKED',
          'COMPLETED',
          'SKIPPED',
          'UNKNOWN',
          'FAILED',
        ].includes(string(job.status))
      )
        invalid();
      return {
        id: string(job.id),
        kind: kind(job.kind),
        dueAt: timestamp(job.dueAt),
        status: job.status as MessageAutomation['jobs'][number]['status'],
        reason: nullable(job.reason),
        dispatchId: nullable(job.dispatchId),
      };
    }),
  };
}
