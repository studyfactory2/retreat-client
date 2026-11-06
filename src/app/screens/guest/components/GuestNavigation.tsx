import { Link, type To } from 'react-router-dom';
import { GuestIcon } from '../entry/components/GuestIcon';
import type { GuestView } from '../entry/model/guest-entry-model';
import '../styles/guest-navigation.css';

type Destination = {
  label: string;
  to: To;
  icon: 'home' | 'guide' | 'notice' | 'receipt';
  current?: boolean;
  reloadDocument?: boolean;
};

function NavigationBar({
  label,
  destinations,
}: {
  label: string;
  destinations: Destination[];
}) {
  return (
    <nav className="guest-navigation" aria-label={label}>
      <div>
        {destinations.map(({ label, to, icon, current, reloadDocument }) => (
          <Link
            key={label}
            to={to}
            reloadDocument={reloadDocument}
            aria-current={current ? 'page' : undefined}
            onClick={current ? (event) => event.preventDefault() : undefined}
          >
            <GuestIcon name={icon} />
            <span>{label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
}

export function GuestNavigation({
  home, guide, report, view,
}: {
  home: To;
  guide: To;
  report?: To;
  view?: GuestView;
}) {
  const destinations: Destination[] = [
    { label: '홈', icon: 'home', to: home, current: view === 'home' },
    { label: '이용 안내', icon: 'guide', to: guide, current: view === 'guide' },
  ];
  if (report) {
    destinations.push({
      label: '불편 신고',
      icon: 'notice',
      to: report,
      current: view === 'report',
      // Keep entry-page report resets, but use guarded SPA navigation from a draft.
      reloadDocument: view !== undefined && view !== 'report',
    });
  }
  return <NavigationBar label="이용객 메뉴" destinations={destinations} />;
}

export function GuestReceiptNavigation({
  hash, page,
}: {
  hash: string;
  page: 'receipt' | 'submission';
}) {
  return (
    <NavigationBar
      label="제출 기록 메뉴"
      destinations={[
        {
          label: '제출 확인',
          icon: 'receipt',
          to: { pathname: '/draft', hash },
          current: page === 'receipt',
        },
        {
          label: '제출 내용',
          icon: 'guide',
          to: { pathname: '/draft', search: '?view=submission', hash },
          current: page === 'submission',
        },
      ]}
    />
  );
}
