import { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig } from '../../../../core/config/environment';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import '../styles/guest-journey-edge.css';

export function DraftResumeLink({
  token,
  expiresAt,
  disabled,
  completed = false,
  guided = false,
  showHomeHelp = false,
}: {
  token: string;
  expiresAt: string;
  disabled: boolean;
  completed?: boolean;
  guided?: boolean;
  showHomeHelp?: boolean;
}) {
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const busy = useRef(false);
  const [result, setResult] = useState<{
    owner: typeof owner;
    message: string;
    failed?: boolean;
  } | null>(null);
  useEffect(() => {
    scope.current = owner;
    busy.current = false;
    return () => {
      scope.current = null;
    };
  }, [owner]);
  const privateUrl = `${appConfig.frontendOrigin}/draft#token=${token}`;
  const linkLabel = completed
    ? '제출 확인 링크'
    : guided
      ? '이어쓰기 링크'
      : '작성 링크';
  const copy = async () => {
    if (disabled || busy.current || scope.current !== owner) return;
    busy.current = true;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(privateUrl);
      if (scope.current === owner)
        setResult({
          owner,
          message: `${linkLabel}를 복사했어요.`,
        });
    } catch {
      if (scope.current === owner)
        setResult({
          owner,
          failed: true,
          message: '아래 주소를 길게 누르거나 선택해서 복사해 주세요.',
        });
    } finally {
      if (scope.current === owner) busy.current = false;
    }
  };
  const linkDetails = (
    <>
      <p>
        <time dateTime={expiresAt}>{formatGuestStayTimestamp(expiresAt)}</time>
        까지 · 한국 시간
      </p>
      <p>이용 정보가 바뀌면 기한 전에 만료될 수 있어요.</p>
      {showHomeHelp && (
        <p>이용 안내 홈은 처음 사용한 QR이나 개인 이용 링크에서 열어 주세요.</p>
      )}
      <Button
        className="guest-draft-secondary"
        disabled={disabled}
        onClick={() => void copy()}
      >
        {linkLabel} 복사
      </Button>
      <p className="guest-draft-copy-status" role="status">
        {result?.owner === owner ? result.message : ''}
      </p>
      {!disabled && result?.owner === owner && result.failed && (
        <input
          className="guest-private-link-input"
          aria-label={`직접 복사할 ${linkLabel}`}
          type="text"
          readOnly
          value={privateUrl}
          onFocus={(event) => event.currentTarget.select()}
        />
      )}
    </>
  );
  if (completed) {
    return (
      <details className="guest-private-receipt-link">
        <summary>제출 확인 링크 보관</summary>
        <div>
          <p>
            링크를 가진 사람은 제출 내용을 볼 수 있어요. 본인만 보관해 주세요.
          </p>
          {linkDetails}
        </div>
      </details>
    );
  }
  return (
    <section
      className={`guest-draft-card guest-draft-resume${guided ? ' guest-resume-guided' : ''}`}
      aria-labelledby="draft-resume-title"
    >
      <h2 id="draft-resume-title">
        {guided ? '이어쓰기 링크' : '나중에 이어서 작성하기'}
      </h2>
      <p>
        {guided
          ? '공용 QR 대신 이 링크로 이어서 작성해 주세요.'
          : '이 링크로 임시 저장한 내용을 다시 열 수 있어요.'}{' '}
        링크를 가진 사람은 내용을 볼 수 있으니 본인만 보관해 주세요.
      </p>
      {linkDetails}
    </section>
  );
}
