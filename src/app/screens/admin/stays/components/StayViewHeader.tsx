import { useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import { StayListIcon } from './StayListIcon';
import { StayViewNavigation } from './StayViewNavigation';
import '../styles/stay-view-header.css';

type StayViewHeaderProps = {
  view: 'calendar' | 'list' | 'records';
  createHref: string;
  calendarHref: string;
  listHref: string;
  recordsHref: string;
};

export function StayViewHeader({
  createHref,
  ...navigation
}: StayViewHeaderProps) {
  const moreRef = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function closeOutside(event: PointerEvent) {
      const menu = moreRef.current;
      if (
        menu?.open &&
        event.target instanceof Node &&
        !menu.contains(event.target)
      ) {
        menu.open = false;
      }
    }
    document.addEventListener('pointerdown', closeOutside);
    return () => document.removeEventListener('pointerdown', closeOutside);
  }, []);

  return (
    <div className="stay-view-header">
      <header className="stay-view-header__heading">
        <h1>이용 일정</h1>
        <div className="stay-view-header__actions">
          <Link
            className="ui-button admin-button-secondary stay-view-header__import"
            to={appRoutes.adminStayImportCreate}
          >
            <StayListIcon name="upload" /> 엑셀 가져오기
          </Link>
          <Link className="ui-button" to={createHref}>
            <StayListIcon name="plus" /> 일정 등록
          </Link>
          <details
            ref={moreRef}
            className="stay-view-header__more"
            onKeyDown={(event) => {
              if (event.key === 'Escape' && event.currentTarget.open) {
                event.preventDefault();
                event.currentTarget.open = false;
                event.currentTarget.querySelector('summary')?.focus();
              }
            }}
            onBlur={(event) => {
              if (!event.currentTarget.contains(event.relatedTarget)) {
                event.currentTarget.open = false;
              }
            }}
          >
            <summary aria-label="일정 더보기">
              <StayListIcon name="more" />
            </summary>
            <div className="stay-view-header__menu">
              <Link to={appRoutes.adminStayImportCreate}>
                <StayListIcon name="upload" /> 엑셀 가져오기
              </Link>
            </div>
          </details>
        </div>
      </header>
      <StayViewNavigation {...navigation} />
    </div>
  );
}
