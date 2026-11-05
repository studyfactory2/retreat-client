import { apiRequest } from '../../core/api/api-client';
import {
  readMessageAutomation,
  readMessageDispatch,
  readMessagePreview,
  readMessageSummary,
  readMessagingStatus,
} from './admin-messaging-readers';
import type {
  MessageAttempt,
  MessageKind,
  MessageSubject,
} from './admin-messaging.types';

function base(subject: MessageSubject) {
  return `/admin/messaging/${subject.subjectType === 'STAY' ? 'stays' : 'tasks'}/${encodeURIComponent(subject.subjectId)}`;
}
export async function getMessagingStatus(token: string, signal?: AbortSignal) {
  return readMessagingStatus(
    await apiRequest<unknown>('/admin/messaging/status', { token, signal }),
  );
}
export async function getMessageSummary(
  token: string,
  subject: MessageSubject,
  signal?: AbortSignal,
) {
  return readMessageSummary(
    await apiRequest<unknown>(base(subject), { token, signal }),
    subject,
  );
}
export async function getMessagePreview(
  token: string,
  subject: MessageSubject,
  kind: MessageKind,
  signal?: AbortSignal,
) {
  return readMessagePreview(
    await apiRequest<unknown>(`${base(subject)}/preview`, {
      token,
      signal,
      method: 'POST',
      body: { kind },
    }),
    subject,
    kind,
  );
}
export async function sendMessage(
  token: string,
  subject: MessageSubject,
  attempt: MessageAttempt,
  signal?: AbortSignal,
) {
  const result = readMessageDispatch(
    await apiRequest<unknown>(`${base(subject)}/send`, {
      token,
      signal,
      method: 'POST',
      body: { ...attempt },
    }),
    subject,
  );
  if (result.kind !== attempt.kind)
    throw new Error('메시지 종류를 확인하지 못했습니다.');
  return result;
}
export async function refreshMessage(
  token: string,
  subject: MessageSubject,
  id: string,
  signal?: AbortSignal,
) {
  const result = readMessageDispatch(
    await apiRequest<unknown>(
      `/admin/messaging/dispatches/${encodeURIComponent(id)}/refresh`,
      {
        token,
        signal,
        method: 'POST',
        body: {},
      },
    ),
    subject,
  );
  if (result.id !== id) throw new Error('메시지 기록을 확인하지 못했습니다.');
  return result;
}
export async function getMessageAutomation(
  token: string,
  subject: MessageSubject,
  signal?: AbortSignal,
) {
  return readMessageAutomation(
    await apiRequest<unknown>(
      `/admin/message-automation/${subject.subjectType === 'STAY' ? 'stays' : 'tasks'}/${encodeURIComponent(subject.subjectId)}`,
      { token, signal },
    ),
  );
}
