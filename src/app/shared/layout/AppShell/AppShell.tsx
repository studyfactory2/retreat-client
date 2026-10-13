import { APP_BRAND } from '../../../core/config/brand';
import { Link, Outlet } from 'react-router-dom'
import './app-shell.css'

export function AppShell() {
  return (
    <div className="app-shell">
      <a
        className="app-shell__skip"
        href="#main-content"
        onClick={(event) => {
          event.preventDefault()
          const main = document.getElementById('main-content')
          main?.focus()
          main?.scrollIntoView()
        }}
      >
        본문으로 바로가기
      </a>
      <header className="app-shell__header">
        <Link className="app-shell__brand" to="/" aria-label={`${APP_BRAND.appName} 홈`}>
          {APP_BRAND.name}<span>휴양소</span>
        </Link>
        <span className="app-shell__label">휴양소 관리</span>
      </header>
      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-shell__footer">
        <span>{APP_BRAND.operatorCredit}</span>
        <span className="app-shell__motto">편안한 머무름을 함께 준비합니다.</span>
      </footer>
    </div>
  )
}
