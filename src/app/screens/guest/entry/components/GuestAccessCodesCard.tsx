import type { GuestStayContextDto } from '../../../../features/guest-entry/guest-entry.types';
import { useGuestAccessCodes } from '../hooks/use-guest-access-codes';
import { GuestIcon } from './GuestIcon';

const windowDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  month: 'numeric',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function GuestAccessCodesCard({
  token,
  context,
  rejectAccess,
}: {
  token: string;
  context: GuestStayContextDto;
  rejectAccess: () => void;
}) {
  const access = useGuestAccessCodes(token, context, rejectAccess);
  const { snapshot, codes, pendingKind } = access;
  const available =
    access.status === 'ready' && snapshot?.state === 'AVAILABLE';
  const stateLabel =
    snapshot?.state === 'SCHEDULED'
      ? '공개 예정'
      : snapshot?.state === 'ENDED'
        ? '안내 종료'
        : available
          ? '예약용 번호'
          : null;

  return (
    <section
      className="guest-access-codes"
      aria-labelledby="guest-access-title"
    >
      <header className="guest-access-codes__heading">
        <span className="guest-access-codes__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3m-4 5v2" />
          </svg>
        </span>
        <h2 id="guest-access-title">출입 비밀번호</h2>
        {stateLabel && (
          <span className="guest-access-codes__badge">{stateLabel}</span>
        )}
        <button
          type="button"
          className="guest-access-codes__refresh"
          aria-label="비밀번호 상태 새로고침"
          onClick={access.refresh}
          disabled={access.status === 'loading' || pendingKind !== null}
        >
          <GuestIcon name="refresh" />
        </button>
      </header>

      {available && snapshot ? (
        <>
          <div
            className={`guest-access-codes__rows${snapshot.entranceAvailable ? ' guest-access-codes__rows--pair' : ''}`}
          >
            {(['ROOM', 'ENTRANCE'] as const)
              .filter((kind) => kind === 'ROOM' || snapshot.entranceAvailable)
              .map((kind) => {
                const label = kind === 'ROOM' ? '객실 출입문' : '공동현관';
                const code = codes[kind];
                return (
                  <div className="guest-access-code" key={kind}>
                    <span className="guest-access-code__label">{label}</span>
                    <div className="guest-access-code__controls">
                      <output
                        className="guest-access-code__value"
                        aria-label={`${label} 비밀번호`}
                      >
                        {code ?? '••••••'}
                      </output>
                      <button
                        type="button"
                        className="guest-access-code__reveal"
                        aria-label={`${label} 비밀번호 ${code ? '숨기기' : '보기'}`}
                        aria-pressed={Boolean(code)}
                        disabled={pendingKind !== null}
                        onClick={() =>
                          code ? access.hide() : void access.reveal(kind)
                        }
                      >
                        {pendingKind === kind
                          ? '확인 중'
                          : code
                            ? '숨기기'
                            : '보기'}
                      </button>
                      <button
                        type="button"
                        className="guest-access-code__copy"
                        aria-label={`${label} 비밀번호 복사`}
                        disabled={pendingKind !== null}
                        onClick={() => void access.copy(kind)}
                      >
                        복사
                      </button>
                    </div>
                  </div>
                );
              })}
          </div>
          {snapshot.roomMode === 'ROTATING' && (
            <p className="guest-access-codes__note">
              입실에 사용할 번호입니다. 현장 도어락은 변경 전일 수 있어요.
            </p>
          )}
        </>
      ) : (
        <p className="guest-access-codes__empty">
          {access.status === 'loading' ? (
            '비밀번호 확인 중…'
          ) : snapshot?.state === 'SCHEDULED' ? (
            <>
              <time dateTime={snapshot.opensAt}>
                {windowDate.format(new Date(snapshot.opensAt))}
              </time>
              부터 확인할 수 있어요.
            </>
          ) : snapshot?.state === 'ENDED' ? (
            '퇴실 시간이 지나 비밀번호 안내가 종료되었습니다.'
          ) : access.status === 'error' ? (
            '비밀번호를 불러오지 못했습니다.'
          ) : (
            '관리자에게 비밀번호를 확인해 주세요.'
          )}
        </p>
      )}
      <p className="guest-access-codes__feedback" role="status">
        {access.message}
      </p>
    </section>
  );
}
