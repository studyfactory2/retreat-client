import { Navigate } from 'react-router-dom'
import { useAdminSession } from '../../../core/session/use-admin-session'
import { Button } from '../../../shared/ui/Button/Button'
import { AdminSessionState } from '../AdminSessionState'
import '../admin.css'

export function AdminHomeScreen() {
  const { state, logout } = useAdminSession()

  if (state.status === 'anonymous')
    return <Navigate to="/admin/login" replace />
  if (state.status !== 'authenticated') return <AdminSessionState />

  return (
    <div className="admin-home">
      <header className="admin-home__heading">
        <div>
          <p className="admin-eyebrow">관리자 공간</p>
          <h1>{state.user.name}님, 안녕하세요.</h1>
          <p className="admin-home__description">
            오복 휴양소 관리자 계정으로 로그인했습니다.
          </p>
        </div>
        <Button className="admin-button-secondary" onClick={logout}>
          로그아웃
        </Button>
      </header>

      {state.storageNotice && (
        <p className="admin-notice" role="status">
          {state.storageNotice}
        </p>
      )}

      <section
        className="admin-home__account"
        aria-labelledby="admin-account-title"
      >
        <div>
          <h2 id="admin-account-title">로그인한 계정</h2>
          <p>확인된 관리자 계정 정보입니다.</p>
        </div>
        <dl>
          <div>
            <dt>이름</dt>
            <dd>{state.user.name}</dd>
          </div>
          <div>
            <dt>아이디</dt>
            <dd>{state.user.loginId}</dd>
          </div>
          <div>
            <dt>권한</dt>
            <dd>관리자</dd>
          </div>
        </dl>
      </section>

      <section className="admin-home__next" aria-labelledby="admin-next-title">
        <span className="admin-home__next-label">준비 중</span>
        <h2 id="admin-next-title">운영 화면을 준비하고 있습니다.</h2>
        <p>
          현재는 관리자 로그인과 계정 확인을 이용할 수 있습니다.
          <br />
          휴양소 운영 기능은 이후 단계에서 추가될 예정입니다.
        </p>
      </section>
    </div>
  )
}
