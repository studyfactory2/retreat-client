import { Button } from '../../../shared/ui/Button/Button';
import {
  formatStayHistoryTime,
  stayHistoryAction,
  staySnapshotDetails,
  type StayHistoryEntry,
} from './stay-history-model';
import { useStayHistory } from './use-stay-history';
import './stay-history.css';

type Props = {
  stayId: string;
  currentRevision: number;
  token: string;
  rejectSession: (token: string) => void;
};

export function StayHistory({
  stayId,
  currentRevision,
  token,
  rejectSession,
}: Props) {
  const { resource, page, selectPage, refresh } = useStayHistory(
    stayId,
    currentRevision,
    token,
    rejectSession,
  );
  return (
    <section className="stay-history" aria-labelledby="stay-history-title">
      <header className="stay-history__heading">
        <div>
          <p className="stay-history__eyebrow">CHANGE HISTORY</p>
          <h2 id="stay-history-title">변경 이력</h2>
          <p>
            누가 언제 무엇을 변경했는지 확인하세요. 모든 시간은 한국 시간
            기준입니다.
          </p>
        </div>
        <Button
          className="admin-button-secondary"
          onClick={refresh}
          disabled={resource.status === 'loading'}
        >
          이력 새로고침
        </Button>
      </header>
      {resource.status === 'loading' ? (
        <p className="stay-history__state" role="status">
          변경 이력을 불러오는 중입니다.
        </p>
      ) : resource.status === 'error' ? (
        <div
          className="stay-history__state stay-history__state--error"
          role="alert"
        >
          <p>{resource.message}</p>
          <Button onClick={refresh}>다시 불러오기</Button>
        </div>
      ) : resource.entries.length === 0 ? (
        <p className="stay-history__state" role="status">
          등록된 변경 이력이 없습니다.
        </p>
      ) : (
        <>
          <p className="stay-history__count">
            총 {resource.total.toLocaleString('ko-KR')}건 · 최신 변경순
          </p>
          {resource.total > currentRevision && (
            <p className="stay-history__notice" role="status">
              상세 정보보다 새로운 변경 이력이 있습니다. 일정 상세 정보를 다시
              불러와 주세요.
            </p>
          )}
          <ol className="stay-history__list">
            {resource.entries.map((entry) => (
              <HistoryCard key={entry.revision.id} entry={entry} />
            ))}
          </ol>
          {resource.totalPages > 1 && (
            <nav
              className="stay-history__pagination"
              aria-label="변경 이력 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={page <= 1}
                onClick={() => selectPage(page - 1)}
              >
                최신 이력
              </Button>
              <span aria-current="page">
                {page} / {resource.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={page >= resource.totalPages}
                onClick={() => selectPage(page + 1)}
              >
                이전 이력
              </Button>
            </nav>
          )}
        </>
      )}
    </section>
  );
}

function HistoryCard({ entry }: { entry: StayHistoryEntry }) {
  const { revision, changes } = entry;
  return (
    <li className="stay-history__card">
      <header className="stay-history__card-heading">
        <div>
          <span
            className={`stay-history__action stay-history__action--${revision.action.toLowerCase()}`}
          >
            {stayHistoryAction(revision.action)}
          </span>
          <span className="stay-history__version">기록 {revision.version}</span>
        </div>
        <time dateTime={revision.createdAt}>
          {formatStayHistoryTime(revision.createdAt)}
        </time>
      </header>
      <p className="stay-history__actor">
        <strong>{revision.actorSnapshot.name}</strong> ·{' '}
        {revision.actorSnapshot.role === 'ADMIN'
          ? '관리자'
          : revision.actorSnapshot.role === 'STAFF'
            ? '직원'
            : '이용객'}
        {revision.importRowId && ' · 엑셀 반영'}
      </p>
      {revision.reason && (
        <p className="stay-history__reason">
          <strong>변경 사유</strong>
          <span>{revision.reason}</span>
        </p>
      )}
      {changes === null ? (
        <p className="stay-history__initial">
          이용 일정이 처음 등록되었습니다.
        </p>
      ) : changes.length === 0 ? (
        <p className="stay-history__initial">
          이용 정보의 변경 없이 처리 내역이 기록되었습니다.
        </p>
      ) : (
        <ul className="stay-history__changes">
          {changes.map((change) => (
            <li key={change.label}>
              <strong>{change.label}</strong>
              <div>
                <span className="stay-history__before">
                  <span className="stay-history__value-label">변경 전</span>
                  {change.before}
                </span>
                <span className="stay-history__arrow" aria-hidden="true">
                  →
                </span>
                <span className="stay-history__after">
                  <span className="stay-history__value-label">변경 후</span>
                  {change.after}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
      <details className="stay-history__snapshot">
        <summary>이 시점의 전체 이용 정보</summary>
        <p>아래 정보는 해당 변경 당시 저장된 기록입니다.</p>
        <dl>
          {staySnapshotDetails(revision.snapshot).map((item) => (
            <div key={item.label}>
              <dt>{item.label}</dt>
              <dd>{item.value}</dd>
            </div>
          ))}
        </dl>
      </details>
    </li>
  );
}
