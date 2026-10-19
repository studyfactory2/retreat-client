import { APP_BRAND } from '../../../core/config/brand';
import { Link, Outlet, useLocation } from 'react-router-dom'
import { appRoutes } from '../../../core/router/routes'
import { BrandLogo } from '../../ui/BrandLogo/BrandLogo'
import './app-shell.css'

export function AppShell() {
  const isLanding = useLocation().pathname === appRoutes.home
  return (
    <div className={`app-shell${isLanding ? ' app-shell--landing' : ''}`}>
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
          <BrandLogo /><span>휴양소</span>
        </Link>
        {isLanding ? (
          <Link className="app-shell__admin-link" to={appRoutes.adminLogin}>
            관리자 로그인 <span aria-hidden="true">↗</span>
          </Link>
        ) : (
          <span className="app-shell__label">휴양소 관리</span>
        )}
      </header>
      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-shell__footer">
        <span>{APP_BRAND.appName}</span>
      </footer>
    </div>
  )
}
