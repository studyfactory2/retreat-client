import {
  messageKindLabels,
  messageStatusLabels,
  type MessageDispatch,
} from '../../../features/admin-messaging/admin-messaging.types';

const time = (value: string) =>
  new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  }).format(new Date(value));

export function MessageHistory({
  history,
  disabled,
  canRefresh,
  onRefresh,
}: {
  history: MessageDispatch[];
  disabled: boolean;
  canRefresh: boolean;
  onRefresh: (dispatch: MessageDispatch) => void;
}) {
  function rows(entries: MessageDispatch[]) {
    return (
      <ul>
        {entries.map((entry) => (
          <li key={entry.id}>
            <div>
              <strong>{messageKindLabels[entry.kind]}</strong>
              <small>
                {time(entry.createdAt)} · {entry.maskedRecipient}
              </small>
            </div>
            <div className="admin-messaging__history-state">
              <span data-state={entry.status}>
                {messageStatusLabels[entry.status]}
              </span>
              {['ACCEPTED', 'SENDING', 'UNKNOWN'].includes(entry.status) && (
                <button
                  type="button"
                  disabled={disabled || !canRefresh}
                  onClick={() => onRefresh(entry)}
                >
                  결과 확인
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    );
  }
  return (
    <div className="admin-messaging__history">
      <h3>최근 발송</h3>
      {history.length === 0 ? (
        <p className="admin-messaging__muted">발송 기록이 없습니다.</p>
      ) : (
        rows(history.slice(0, 5))
      )}
      {history.length > 5 && (
        <details className="admin-messaging__older">
          <summary>이전 기록 {history.length - 5}건</summary>
          {rows(history.slice(5))}
        </details>
      )}
    </div>
  );
}
