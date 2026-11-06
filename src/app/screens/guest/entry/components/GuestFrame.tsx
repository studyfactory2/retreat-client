import { BrandLogo } from '../../../../shared/ui/BrandLogo/BrandLogo';
import { APP_BRAND } from '../../../../core/config/brand';
import type { ReactNode, RefObject } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestView } from '../model/guest-entry-model';
import { isPublicContactTel } from '../../../../features/property-contact/public-contact';
import { GuestNavigation } from '../../components/GuestNavigation';
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
  const guidePresentation = view === 'guide';
  return (
    <div
      className={`guest-entry${homePresentation ? ' guest-entry--home' : ''}${journeyPresentation ? ' guest-entry--journey' : ''}${guidePresentation ? ' guest-entry--guide' : ''}${ready ? ' guest-entry--navigable' : ''}`}
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
              aria-label={`${APP_BRAND.appName} 이용 안내 홈`}
            >
              <BrandLogo />
              <span>휴양소 이용 안내</span>
            </Link>
          ) : (
            <div className="guest-brand">
              <BrandLogo />
              <span>휴양소 이용 안내</span>
            </div>
          )}
          <div className="guest-header__tools">
            {!journeyPresentation && <span>이용객 안내</span>}
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
      <footer className="guest-footer">{APP_BRAND.appName}</footer>
      {ready && (
        <GuestNavigation home={home} guide={guide} report={report} view={view} />
      )}
    </div>
  );
}
