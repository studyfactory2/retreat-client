import { Link } from 'react-router-dom';
import '../styles/stay-view-navigation.css';

export function StayViewNavigation({
  view,
  calendarHref,
  listHref,
  recordsHref,
}: {
  view: 'calendar' | 'list' | 'records';
  calendarHref: string;
  listHref: string;
  recordsHref?: string;
}) {
  return (
    <nav className="stay-view-navigation" aria-label="이용 일정 보기 방식">
      <Link to={listHref} aria-current={view === 'list' ? 'page' : undefined}>
        일정 현황
      </Link>
      <Link
        to={calendarHref}
        aria-current={view === 'calendar' ? 'page' : undefined}
      >
        달력
      </Link>
      {recordsHref && (
        <Link
          className="stay-view-navigation__records"
          to={recordsHref}
          aria-current={view === 'records' ? 'page' : undefined}
        >
          전체 기록
        </Link>
      )}
    </nav>
  );
}
