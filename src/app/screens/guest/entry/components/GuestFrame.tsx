import type { ReactNode, RefObject } from 'react';
import type { To } from 'react-router-dom';
import type { GuestReturnTarget } from '../../../../features/guest-entry/guest-landing-return';
import type { GuestView } from '../model/guest-entry-model';
import { isPublicContactTel } from '../../../../features/property-contact/public-contact';
import { GuestNavigation } from '../../components/GuestNavigation';
import { GuestPageHeader } from '../../components/GuestPageHeader';
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
  home: GuestReturnTarget;
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
      <GuestPageHeader
        home={ready ? home : undefined}
        refresh={
          onRefresh ? { onClick: onRefresh, disabled: refreshing } : undefined
        }
      />
      <main
        ref={mainRef}
        className="guest-main"
        id="guest-main"
        tabIndex={-1}
        aria-busy={refreshing}
      >
        {children}
      </main>
      {ready && (
        <GuestNavigation
          home={home}
          guide={guide}
          report={report}
          view={view}
        />
      )}
    </div>
  );
}
