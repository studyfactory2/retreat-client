import { useState } from 'react';
import { usePwa } from '../../core/pwa/pwa-context';
import './pwa.css';

export function PwaStatus({ allowReload, canReload }: {
  allowReload: boolean;
  canReload: () => boolean;
}) {
  const { online, updateBuild } = usePwa();
  const [dismissed, setDismissed] = useState<string | null>(null);
  const [blocked, setBlocked] = useState(false);
  const showUpdate = !!updateBuild && updateBuild !== dismissed;
  if (online && !showUpdate) return null;
  return (
    <div className="pwa-status">
      {!online && (
        <p role="status">인터넷 연결이 끊겼어요. 화면을 닫지 말고, 연결이 복구된 뒤 저장·제출을 다시 확인해 주세요.</p>
      )}
      {showUpdate && (
        <div className="pwa-status__update">
          <p role="status">
            새 버전이 준비되었어요. {allowReload
              ? '작업을 마친 뒤 새로고침해 주세요.'
              : '작업을 저장한 뒤 홈 화면이나 관리자 더보기에서 새로고침해 주세요.'}
          </p>
          <div className="pwa-status__actions">
            {allowReload && (
              <button type="button" disabled={!online} onClick={() => {
                if (!canReload()) { setBlocked(true); return; }
                // Existing native unload guards remain in force. No worker is
                // force-activated and no other tab is reloaded.
                window.location.reload();
              }}>새로고침</button>
            )}
            <button type="button" onClick={() => { setDismissed(updateBuild); setBlocked(false); }}>나중에</button>
          </div>
          {blocked && <p role="status">작성 중인 내용을 저장하거나 진행 중인 작업이 끝난 뒤 다시 시도해 주세요.</p>}
        </div>
      )}
    </div>
  );
}
