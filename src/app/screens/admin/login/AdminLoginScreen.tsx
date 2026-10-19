import { Navigate } from 'react-router-dom'
import { useAdminSession } from '../../../core/session/use-admin-session'
import { Button } from '../../../shared/ui/Button/Button'
import { AdminSessionState } from '../components/AdminSessionState'
import { useAdminLogin } from './hooks/use-admin-login'
import '../styles/admin.css'

export function AdminLoginScreen() {
  const { state } = useAdminSession()
  const {
    loginId,
    setLoginId,
    loginIdInput,
    password,
    setPassword,
    passwordInput,
    autoLogin,
    setAutoLogin,
    showPassword,
    setShowPassword,
    busy,
    fieldErrors,
    error,
    submit,
  } = useAdminLogin()

  if (state.status === 'authenticated') return <Navigate to="/admin" replace />
  if (state.status !== 'anonymous') return <AdminSessionState />

  return (
    <div className="admin-login">
      <section
        className="admin-login__card"
        aria-labelledby="admin-login-title"
      >
        <div className="admin-login__card-heading">
          <h1 id="admin-login-title">관리자 로그인</h1>
          <p>관리자 계정으로 로그인해 주세요.</p>
        </div>

        {state.reason === 'expired' && (
          <p className="admin-notice" role="status">
            로그인 시간이 만료되었습니다. 다시 로그인해 주세요.
          </p>
        )}
        {state.reason === 'signed-out' && (
          <p className="admin-notice" role="status">
            로그아웃되었습니다.
          </p>
        )}

        <form
          className="admin-login__form"
          noValidate
          onSubmit={(event) => {
            void submit(event)
          }}
          aria-busy={busy || undefined}
        >
          <div className="admin-field">
            <label htmlFor="admin-login-id">아이디</label>
            <input
              ref={loginIdInput}
              id="admin-login-id"
              name="loginId"
              type="text"
              autoComplete="username"
              autoCapitalize="none"
              spellCheck={false}
              required
              disabled={busy}
              value={loginId}
              onChange={(event) => setLoginId(event.target.value)}
              aria-invalid={Boolean(fieldErrors.loginId)}
              aria-describedby={
                fieldErrors.loginId ? 'admin-login-id-error' : undefined
              }
            />
            {fieldErrors.loginId && (
              <p id="admin-login-id-error" className="admin-field__error">
                {fieldErrors.loginId}
              </p>
            )}
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">비밀번호</label>
            <div className="admin-field__password">
              <input
                ref={passwordInput}
                id="admin-password"
                name="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                required
                disabled={busy}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                aria-invalid={Boolean(fieldErrors.password)}
                aria-describedby={
                  fieldErrors.password ? 'admin-password-error' : undefined
                }
              />
              <button
                className="admin-field__visibility"
                type="button"
                disabled={busy}
                aria-label={
                  showPassword ? '비밀번호 숨기기' : '비밀번호 보기'
                }
                aria-controls="admin-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? '숨기기' : '보기'}
              </button>
            </div>
            {fieldErrors.password && (
              <p id="admin-password-error" className="admin-field__error">
                {fieldErrors.password}
              </p>
            )}
          </div>

          <div className="admin-login__remember">
            <label>
              <input
                name="autoLogin"
                type="checkbox"
                checked={autoLogin}
                disabled={busy}
                onChange={(event) => setAutoLogin(event.target.checked)}
                aria-describedby="admin-remember-hint"
              />
              로그인 상태 유지
            </label>
            <p id="admin-remember-hint">개인 기기에서만 선택해 주세요.</p>
          </div>

          {error && (
            <p className="admin-login__error" role="alert">
              {error}
            </p>
          )}
          <Button
            type="submit"
            loading={busy}
            className="admin-login__submit"
          >
            {busy ? '로그인 중…' : '로그인'}
          </Button>
        </form>
      </section>
    </div>
  )
}
