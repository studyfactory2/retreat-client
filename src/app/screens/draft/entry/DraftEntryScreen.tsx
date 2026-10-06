import { useLocation } from 'react-router-dom';
import { Button } from '../../../shared/ui/Button/Button';
import { GuestDraftScreen } from '../../guest/draft';
import { StaffDraftScreen } from '../../staff/draft';
import { useDraftRole } from './hooks/use-draft-role';
import { readPrivateDraftToken } from './model/draft-entry-model';
import './styles/draft-entry.css';

export function DraftEntryScreen() {
  const location = useLocation();
  const views = new URLSearchParams(location.search).getAll('view');
  // Preserve the existing guest submitted-detail and correction route.
  if (views.length === 1 && views[0] === 'submission')
    return <GuestDraftScreen />;
  return <PrivateDraftEntry />;
}

function PrivateDraftEntry() {
  const location = useLocation();
  const token = readPrivateDraftToken(location.hash);
  const { state, retry } = useDraftRole(token);
  if (token && state.status === 'ready')
    return state.role === 'staff' ? <StaffDraftScreen /> : <GuestDraftScreen />;
  const loading = token !== null && state.status === 'loading';
  return (
    <div className="draft-entry">
      <header className="draft-entry-header">
        <strong>
          OH BOK <span>RETREAT</span>
        </strong>
        <span>체크리스트 작성</span>
      </header>
      <main className="draft-entry-main" aria-busy={loading}>
        <section role={loading ? 'status' : 'alert'}>
          <h1>
            {loading
              ? '작성 내용을 확인하고 있습니다'
              : '작성 링크를 확인해 주세요'}
          </h1>
          <p>
            {loading
              ? '저장된 체크리스트를 불러오고 있습니다.'
              : !token
                ? '복사해 둔 개인 작성 링크 전체를 다시 열어 주세요. 처음 작성한다면 현장 QR에서 시작해 주세요.'
                : state.status === 'error' && state.denied
                  ? '이 링크로 작성할 수 없습니다. 만료, 접근 권한 변경 또는 제출 여부를 관리자에게 확인해 주세요.'
                  : '현재 작성 내용을 확인하지 못했습니다. 잠시 후 다시 확인해 주세요.'}
          </p>
          {token && state.status === 'error' && !state.denied && (
            <Button onClick={retry}>다시 확인</Button>
          )}
        </section>
      </main>
    </div>
  );
}
