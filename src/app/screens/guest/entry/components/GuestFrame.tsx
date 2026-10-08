import type { ReactNode, RefObject } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestView } from '../model/guest-entry-model';
import { isPublicContactTel } from '../../../../features/property-contact/public-contact';
import { GuestIcon } from './GuestIcon';
import '../styles/guest-home.css';
import '../../draft/styles/guest-journey-edge.css';

export function GuestFrame({
  children,
  mainRef,
  view,
  home,
  guide,
  report,
  ready,
  refreshing,
  onRefresh,
  confirmNavigation,
}: {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
  view: GuestView;
  home: To;
  guide: To;
  report?: To;
  ready: boolean;
  refreshing: boolean;
  onRefresh?: () => void;
  confirmNavigation?: (href: string) => boolean;
}) {
  const homePresentation = view === 'home';
  const journeyPresentation = view === 'check-in' || view === 'check-out';
  const clientBrand = homePresentation || journeyPresentation;
  return (
    <div
      className={`guest-entry${homePresentation ? ' guest-entry--home' : ''}${journeyPresentation ? ' guest-entry--journey' : ''}${ready ? ' guest-entry--navigable' : ''}`}
      onClickCapture={(event) => {
        if (
          event.target instanceof Element &&
          event.target.closest('a') &&
          !isPublicContactTel(
            event.target.closest('a')?.getAttribute('href'),
          ) &&
          confirmNavigation &&
          !confirmNavigation(
            event.target.closest('a')?.getAttribute('href') ?? '',
          )
        ) {
          event.preventDefault();
          event.stopPropagation();
        }
      }}
    >
      <button
        className="guest-skip"
        onClick={() => {
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView();
        }}
      >
        본문으로 바로가기
      </button>
      <header className="guest-header">
        <div className="guest-header__inner">
          {ready ? (
            <Link
              className="guest-brand"
              to={home}
              aria-label={
                clientBrand ? '아이티센 이용 안내 홈' : '오복 이용 안내 홈'
              }
            >
              {clientBrand ? 'ITCEN' : 'OH BOK'}
              <span>{clientBrand ? '휴양소 이용 안내' : 'RETREAT'}</span>
            </Link>
          ) : (
            <div className="guest-brand">
              {clientBrand ? 'ITCEN' : 'OH BOK'}
              <span>{clientBrand ? '휴양소 이용 안내' : 'RETREAT'}</span>
            </div>
          )}
          <div className="guest-header__tools">
            <span>이용객 안내</span>
            {onRefresh && (
              <button
                type="button"
                className="guest-refresh"
                onClick={onRefresh}
                disabled={refreshing}
                aria-label="안내 새로고침"
              >
                <GuestIcon name="refresh" />
              </button>
            )}
          </div>
        </div>
      </header>
      <main
        ref={mainRef}
        className="guest-main"
        id="guest-main"
        tabIndex={-1}
        aria-busy={refreshing}
      >
        {children}
      </main>
      <footer className="guest-footer">
        {clientBrand ? (
          <>
            운영 <strong>OH BOK</strong>
          </>
        ) : (
          '머무는 모든 순간에, 오복이 함께합니다.'
        )}
      </footer>
      {ready && (
        <nav
          className={`guest-navigation${report ? ' guest-navigation--report' : ''}`}
          aria-label="이용객 메뉴"
        >
          <div>
            <Link to={home} aria-current={view === 'home' ? 'page' : undefined}>
              <GuestIcon name="home" />
              <span>홈</span>
            </Link>
            <Link
              to={guide}
              aria-current={view === 'guide' ? 'page' : undefined}
            >
              <GuestIcon name="guide" />
              <span>이용 안내</span>
            </Link>
            {report && (
              <Link
                to={report}
                reloadDocument={view !== 'report'}
                onClick={(event) => {
                  if (view === 'report') event.preventDefault();
                }}
                aria-current={view === 'report' ? 'page' : undefined}
              >
                <GuestIcon name="notice" />
                <span>불편 신고</span>
              </Link>
            )}
          </div>
        </nav>
      )}
    </div>
  );
}
