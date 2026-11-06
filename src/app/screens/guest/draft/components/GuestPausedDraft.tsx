import { useState, type Ref } from 'react';
import { useNavigationActions } from '../../../../core/router/navigation/use-navigation-guard';
import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestIcon } from '../../entry/components/GuestIcon';
import { DraftResumeLink } from './DraftResumeLink';

export function GuestPausedDraft({
  draft, token, heading, hasPhotos, disabled, onResume, onHome,
}: {
  draft: GuestDraftDto;
  token: string;
  heading: Ref<HTMLHeadingElement>;
  hasPhotos: boolean;
  disabled: boolean;
  onResume: () => void;
  onHome?: () => void;
}) {
  const [confirmHome, setConfirmHome] = useState(false);
  const { runConfirmed } = useNavigationActions();
  const checkIn = draft.type === 'CHECK_IN';
  return (
    <section className="guest-flow-later">
      <header className="guest-flow-later__heading">
        <span className="guest-flow-later__mark"><GuestIcon name="receipt" /></span>
        <h1 ref={heading} tabIndex={-1}>임시 저장했어요</h1>
        <p>{checkIn ? '입실 체크' : '퇴실 체크'} · {draft.property.name}</p>
      </header>
      <div className="guest-flow-later__body">
        <p>최종 제출 전이에요. 나중에 작성하려면 이어쓰기 링크를 보관해 주세요.</p>
        {hasPhotos && (
          <p className="guest-flow-caution">
            {checkIn
              ? '링크를 새로 열면 사진 용도를 다시 확인해 주세요.'
              : '링크를 새로 열면 사진마다 이상 항목을 다시 선택해 주세요.'}
          </p>
        )}
        <DraftResumeLink token={token} expiresAt={draft.expiresAt} disabled={disabled} guided />
        {confirmHome && onHome ? (
          <div className="guest-flow-leave" role="group" aria-label="홈으로 이동 확인">
            <p>이어쓰기 링크를 보관했나요?</p>
            <div>
              <Button className="guest-draft-secondary" disabled={disabled} onClick={() => setConfirmHome(false)}>
                여기 머물기
              </Button>
              <Button disabled={disabled} onClick={() => runConfirmed(onHome)}>보관했어요 · 홈으로</Button>
            </div>
          </div>
        ) : (
          <>
            <Button disabled={disabled} onClick={onResume}>계속 작성하기</Button>
            {onHome ? (
              <button className="guest-flow-later-button" type="button" disabled={disabled} onClick={() => setConfirmHome(true)}>
                홈으로
              </button>
            ) : (
              <p className="guest-flow-later__help">이용 안내 홈은 처음 사용한 이용객 QR이나 개인 이용 링크에서 열 수 있어요.</p>
            )}
          </>
        )}
      </div>
    </section>
  );
}
