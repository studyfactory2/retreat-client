import { useEffect, useState } from 'react';
import { ApiRequestError } from '../../../core/api/api-error';
import { getMessageAutomation } from '../../../features/admin-messaging/admin-messaging-api';
import {
  messageKindLabels,
  type MessageAutomation,
  type MessageSubject,
} from '../../../features/admin-messaging/admin-messaging.types';

const labels: Record<MessageAutomation['jobs'][number]['status'], string> = {
  PENDING: '예정',
  BLOCKED: '준비 필요',
  COMPLETED: '발송 요청됨',
  SKIPPED: '자동 발송 제외',
  UNKNOWN: '결과 확인 필요',
  FAILED: '실패',
};
export function MessageAutomationSummary({
  subjectType,
  subjectId,
  token,
  rejectSession,
}: MessageSubject & { token: string; rejectSession: (token: string) => void }) {
  const [data, setData] = useState<MessageAutomation | null>(null);
  const [error, setError] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    const controller = new AbortController();
    void getMessageAutomation(
      token,
      { subjectType, subjectId },
      controller.signal,
    ).then(
      (result) => {
        if (!controller.signal.aborted) setData(result);
      },
      (failure: unknown) => {
        if (controller.signal.aborted) return;
        if (
          failure instanceof ApiRequestError &&
          [401, 403].includes(failure.status ?? 0)
        )
          rejectSession(token);
        setError(true);
      },
    );
    return () => controller.abort();
  }, [token, rejectSession, subjectType, subjectId, revision]);
  return (
    <details className="admin-messaging__automation">
      <summary>
        자동 안내{' '}
        <span>
          {error
            ? '상태 확인 필요'
            : !data
              ? '불러오는 중'
              : data.enabled
                ? data.activatedAt
                  ? '켜짐'
                  : '시작 대기'
                : '자동 안내 꺼짐'}
        </span>
      </summary>
      {error ? (
        <p className="admin-messaging__muted">
          자동 안내 상태를 불러오지 못했습니다.
        </p>
      ) : (
        data && (
          <>
            {!data.enabled && (
              <p className="admin-messaging__muted">
                자동 안내가 꺼져 있습니다.
              </p>
            )}
            {data.enabled && !data.activatedAt && (
              <p className="admin-messaging__muted">
                자동 안내가 아직 시작되지 않았습니다.
              </p>
            )}
            {data.jobs.length === 0 ? (
              <p className="admin-messaging__muted">예정된 안내가 없습니다.</p>
            ) : (
              <ul>
                {data.jobs.slice(0, 5).map((job) => (
                  <li key={job.id}>
                    <div>
                      <strong>{messageKindLabels[job.kind]}</strong>
                      <small>
                        {new Intl.DateTimeFormat('ko-KR', {
                          timeZone: 'Asia/Seoul',
                          month: 'numeric',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                          hour12: false,
                        }).format(new Date(job.dueAt))}
                      </small>
                      {job.reason &&
                        ['BLOCKED', 'SKIPPED', 'UNKNOWN', 'FAILED'].includes(
                          job.status,
                        ) && (
                          <details className="admin-messaging__job-reason">
                            <summary>사유 보기</summary>
                            <p>{job.reason}</p>
                          </details>
                        )}
                    </div>
                    <span>{labels[job.status]}</span>
                  </li>
                ))}
              </ul>
            )}
          </>
        )
      )}
      <button
        type="button"
        onClick={() => {
          setData(null);
          setError(false);
          setRevision((value) => value + 1);
        }}
      >
        상태 새로고침
      </button>
    </details>
  );
}
