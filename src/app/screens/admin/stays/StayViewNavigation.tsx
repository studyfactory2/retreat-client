import { Link } from 'react-router-dom';
import './stay-view-navigation.css';

export function StayViewNavigation({
  view,
  calendarHref,
  listHref,
}: {
  view: 'calendar' | 'list';
  calendarHref: string;
  listHref: string;
}) {
  return (
    <nav className="stay-view-navigation" aria-label="이용 일정 보기 방식">
      <Link
        to={calendarHref}
        aria-current={view === 'calendar' ? 'page' : undefined}
      >
        달력
      </Link>
      <Link to={listHref} aria-current={view === 'list' ? 'page' : undefined}>
        목록
      </Link>
    </nav>
  );
}
