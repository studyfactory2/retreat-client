import type { ReactNode, RefObject } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestView } from '../model/guest-entry-model';
import { GuestIcon } from './GuestIcon';

export function GuestFrame({
  children, mainRef, view, home, guide, ready, refreshing, onRefresh,
}: {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
  view: GuestView;
  home: To;
  guide: To;
  ready: boolean;
  refreshing: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className={`guest-entry${ready ? ' guest-entry--navigable' : ''}`}>
      <button className="guest-skip" onClick={() => {
        mainRef.current?.focus();
        mainRef.current?.scrollIntoView();
      }}>본문으로 바로가기</button>
      <header className="guest-header">
        <div className="guest-header__inner">
          {ready ? (
            <Link className="guest-brand" to={home} aria-label="오복 이용 안내 홈">
              OH BOK<span>RETREAT</span>
            </Link>
          ) : <div className="guest-brand">OH BOK<span>RETREAT</span></div>}
          <div className="guest-header__tools">
            <span>이용객 안내</span>
            {onRefresh && (
              <button type="button" className="guest-refresh" onClick={onRefresh}
                disabled={refreshing} aria-label="안내 새로고침">
                <GuestIcon name="refresh" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main ref={mainRef} className="guest-main" id="guest-main" tabIndex={-1}
        aria-busy={refreshing}>
        {children}
      </main>
      <footer className="guest-footer">머무는 모든 순간에, 오복이 함께합니다.</footer>
      {ready && (
        <nav className="guest-navigation" aria-label="이용객 메뉴">
          <div>
            <Link to={home} aria-current={view === 'home' ? 'page' : undefined}>
              <GuestIcon name="home" /><span>홈</span>
            </Link>
            <Link to={guide} aria-current={view === 'guide' ? 'page' : undefined}>
              <GuestIcon name="guide" /><span>이용 안내</span>
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
