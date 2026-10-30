import { AdminBackButton } from '../components/AdminBackButton';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AccountForms } from './components/AccountForms';
import { useAdminAccount } from './hooks/use-admin-account';
import './styles/admin-account.css';

export function AdminAccountScreen() {
  const { state } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <AccountWorkspace
      key={state.token}
      token={state.token}
      userId={state.user.id}
    />
  );
}

function AccountWorkspace({
  token,
  userId,
}: {
  token: string;
  userId: string;
}) {
  const { rejectSession } = useAdminSession();
  const { resource, reload } = useAdminAccount(token, userId, rejectSession);
  return (
    <div className="admin-account">
      <header className="account-heading">
        <div>
          <div className="admin-page-heading-title">
            <AdminBackButton />
            <h1>내 계정</h1>
          </div>
          <p>내 정보와 로그인 비밀번호를 관리하세요.</p>
        </div>
      </header>
      {resource.status === 'ready' ? (
        <AccountForms
          account={resource.account}
          token={token}
          reload={reload}
        />
      ) : (
        <section
          className="account-card"
          role={resource.status === 'error' ? 'alert' : 'status'}
        >
          <PageState
            title={
              resource.status === 'loading'
                ? '계정 정보를 불러오는 중'
                : '계정 정보를 불러오지 못했습니다'
            }
            description={
              resource.status === 'error'
                ? resource.message
                : '잠시만 기다려 주세요.'
            }
          >
            {resource.status === 'error' && (
              <Button onClick={reload}>다시 불러오기</Button>
            )}
          </PageState>
        </section>
      )}
    </div>
  );
}
