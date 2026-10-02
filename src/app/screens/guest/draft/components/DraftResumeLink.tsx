import { useEffect, useMemo, useRef, useState } from 'react';
import { appConfig } from '../../../../core/config/environment';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';

export function DraftResumeLink({
  token,
  expiresAt,
  disabled,
  completed = false,
}: {
  token: string;
  expiresAt: string;
  disabled: boolean;
  completed?: boolean;
}) {
  const owner = useMemo(() => ({ token }), [token]);
  const scope = useRef<typeof owner | null>(owner);
  const busy = useRef(false);
  const [result, setResult] = useState<{
    owner: typeof owner;
    message: string;
  } | null>(null);
  useEffect(() => {
    scope.current = owner;
    busy.current = false;
    return () => {
      scope.current = null;
    };
  }, [owner]);
  const copy = async () => {
    if (disabled || busy.current || scope.current !== owner) return;
    busy.current = true;
    try {
      if (!navigator.clipboard?.writeText)
        throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(
        `${appConfig.frontendOrigin}/draft#token=${token}`,
      );
      if (scope.current === owner)
        setResult({
          owner,
          message: `${completed ? '제출 확인' : '작성'} 링크를 복사했습니다. 안전한 곳에 보관해 주세요.`,
        });
    } catch {
      if (scope.current === owner)
        setResult({
          owner,
          message: '링크를 복사하지 못했습니다. 브라우저 권한을 확인해 주세요.',
        });
    } finally {
      if (scope.current === owner) busy.current = false;
    }
  };
  return (
    <section
      className="guest-draft-card guest-draft-resume"
      aria-labelledby="draft-resume-title"
    >
      <div>
        <h2 id="draft-resume-title">
          {completed ? '제출 확인 링크 보관하기' : '나중에 이어서 작성하기'}
        </h2>
        <p>
          {completed
            ? '이 링크에서 제출 확인을 다시 열 수 있습니다.'
            : '이 링크에서 임시 저장한 내용을 다시 열 수 있습니다.'}{' '}
          링크를 가진 사람은 내용을 볼 수 있으니 다른 사람에게 공유하지 마세요.
        </p>
        <p>
          사용 기한: {formatGuestStayTimestamp(expiresAt)} · 한국 시간
          <br />
          이용 정보 변경 등에 따라 기한 전에 사용할 수 없게 될 수 있습니다.
        </p>
      </div>
      <Button
        className="guest-draft-secondary"
        disabled={disabled}
        onClick={() => {
          void copy();
        }}
      >
        {completed ? '제출 확인 링크 복사' : '작성 링크 복사'}
      </Button>
      <p className="guest-draft-copy-status" role="status">
        {result?.owner === owner ? result.message : ''}
      </p>
    </section>
  );
}
