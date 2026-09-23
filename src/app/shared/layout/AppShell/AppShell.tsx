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
        <Link className="app-shell__brand" to="/" aria-label="오복 홈">
          OH BOK<span>RETREAT</span>
        </Link>
        <span className="app-shell__label">휴양소 관리</span>
      </header>
      <main className="app-shell__main" id="main-content" tabIndex={-1}>
        <Outlet />
      </main>
      <footer className="app-shell__footer">
        <span>사람이 머무는 모든 공간에, 오복이 함께합니다.</span>
        <span className="app-shell__motto">A MORE COMFORTABLE TOMORROW</span>
      </footer>
    </div>
  )
}
