import { useState } from 'react';
import { Link, useLocation, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import {
  formatSeoulUpdatedAt,
  getSeoulToday,
} from '../../../core/dates/seoul-date';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { CalendarMonth } from './CalendarMonth';
import { SelectedDayStays } from './SelectedDayStays';
import {
  getMonthDays,
  getMonthRange,
  readCalendarFilters,
  shiftCalendarMonth,
} from './calendar-model';
import { useAdminCalendar } from './use-admin-calendar';
import './calendar.css';

export function AdminCalendarScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <CalendarWorkspace token={state.token} rejectSession={rejectSession} />
  );
}

function CalendarWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [initialDate] = useState(getSeoulToday);
  const [search, setSearch] = useSearchParams();
  const location = useLocation();
  const { date, propertyId, error } = readCalendarFilters(search, initialDate);
  const month = date.slice(0, 7);
  const range = getMonthRange(month);
  const calendar = useAdminCalendar(
    { ...range, propertyId },
    !error,
    token,
    rejectSession,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const data =
    calendar.resource.status === 'ready' ? calendar.resource.data : undefined;
  const days = data ? getMonthDays(month, data.items) : [];
  const selectedDay = days.find((day) => day.date === date);
  const options =
    properties.resource.status === 'ready' ? properties.resource.data : [];
  const selectedProperty = options.find(
    (property) => property.id === propertyId,
  );
  const previous = shiftCalendarMonth(date, -1);
  const next = shiftCalendarMonth(date, 1);
  const returnQuery = new URLSearchParams({ date });
  if (propertyId) returnQuery.set('propertyId', propertyId);
  const notice: unknown = location.state;
  const saved =
    typeof notice === 'object' && notice !== null && 'stayNotice' in notice
      ? notice.stayNotice
      : undefined;

  function select(date: string, id = propertyId) {
    const query = new URLSearchParams({ date });
    if (id) query.set('propertyId', id);
    setSearch(query);
  }

  function showToday() {
    const today = getSeoulToday();
    select(today);
    // Selecting another day in the same month reuses the loaded month. Today
    // explicitly refreshes that month so current checklist evidence is fetched.
    if (today.slice(0, 7) === month) calendar.refresh();
  }

  return (
    <div className="admin-calendar">
      <header className="calendar-heading">
        <div>
          <p className="calendar-heading__eyebrow">STAY SCHEDULE</p>
          <h1>이용 일정</h1>
          <p>휴양소별 이용 일정과 입·퇴실 체크리스트 제출 현황을 확인하세요.</p>
        </div>
        <div className="calendar-heading__actions">
          <Link
            className="ui-button"
            to={`${appRoutes.adminStayCreate}?${returnQuery}`}
          >
            일정 등록
          </Link>
          <Button
            className="admin-button-secondary"
            onClick={calendar.refresh}
            disabled={!!error || calendar.resource.status === 'loading'}
          >
            새로고침
          </Button>
        </div>
      </header>

      {(saved === 'created' || saved === 'updated') && (
        <p className="calendar-success" role="status">
          {saved === 'created'
            ? '새 이용 일정이 등록되었습니다.'
            : '이용 일정이 수정되었습니다.'}
        </p>
      )}

      <section className="calendar-filters" aria-label="이용 일정 조회 조건">
        <div className="calendar-filters__row">
          <div className="calendar-filters__field">
            <label htmlFor="calendar-property">휴양소</label>
            <select
              id="calendar-property"
              value={propertyId ?? ''}
              disabled={properties.resource.status === 'loading'}
              aria-describedby={
                properties.resource.status === 'error'
                  ? 'calendar-property-error'
                  : undefined
              }
              onChange={(event) => select(date, event.target.value)}
            >
              <option value="">전체 휴양소</option>
              {propertyId && !selectedProperty && (
                <option value={propertyId}>
                  선택한 휴양소 (목록 확인 필요)
                </option>
              )}
              {options.map((property) => (
                <option key={property.id} value={property.id}>
                  {property.name}
                  {property.isActive ? '' : ' · 비활성'}
                </option>
              ))}
            </select>
          </div>
          <Button className="admin-button-secondary" onClick={showToday}>
            오늘
          </Button>
          <p className="calendar-filters__hint">
            한국 시간 기준 · 비활성 휴양소의 일정도 포함됩니다.
          </p>
        </div>
        {properties.resource.status === 'error' && (
          <div
            className="calendar-error"
            id="calendar-property-error"
            role="alert"
          >
            <p>
              휴양소 목록을 불러오지 못했습니다. {properties.resource.message}
            </p>
            <button type="button" onClick={properties.refresh}>
              목록 다시 불러오기
            </button>
          </div>
        )}
      </section>

      <p
        className="calendar-announcement"
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        {!error &&
          (data
            ? `${date}, ${selectedProperty?.name ?? (propertyId ? '선택한 휴양소' : '전체 휴양소')}, 이용 일정 ${selectedDay?.stays.length ?? 0}건`
            : calendar.resource.status === 'loading'
              ? '이용 일정을 불러오고 있습니다.'
              : '')}
      </p>

      {error ? (
        <div className="calendar-state" role="alert">
          <PageState title="조회 조건을 확인해 주세요" description={error}>
            <Button onClick={() => setSearch({})}>조회 조건 초기화</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="calendar-meta">
            <p>
              <strong>
                {selectedProperty?.name ??
                  (propertyId ? '선택한 휴양소' : '전체 휴양소')}
              </strong>
              {data && (
                <span>
                  이 달과 겹치는 이용 일정 {data.total.toLocaleString('ko-KR')}
                  건
                </span>
              )}
            </p>
            {data && (
              <p>
                최근 조회{' '}
                <time dateTime={data.asOf}>
                  {formatSeoulUpdatedAt(data.asOf)}
                </time>
              </p>
            )}
          </div>
          {calendar.resource.status === 'error' && (
            <div className="calendar-error" role="alert">
              <p>{calendar.resource.message}</p>
              <button type="button" onClick={calendar.refresh}>
                일정 다시 불러오기
              </button>
            </div>
          )}
          <div
            className={`calendar-workspace${data ? '' : ' calendar-workspace--pending'}`}
          >
            <CalendarMonth
              month={month}
              days={days}
              selectedDate={date}
              today={data?.today ?? getSeoulToday()}
              state={calendar.resource.status}
              onSelect={(selected) => select(selected)}
              onPrevious={() => {
                if (previous) select(previous);
              }}
              onNext={() => {
                if (next) select(next);
              }}
              canPrevious={previous !== null}
              canNext={next !== null}
            />
            {data && (
              <SelectedDayStays
                date={date}
                stays={selectedDay?.stays ?? []}
                returnSearch={`?${returnQuery}`}
              />
            )}
          </div>
          <p className="calendar-footnote">
            등록된 이용 일정 기준이며 실제 입·퇴실 여부를 의미하지 않습니다.
            과거 날짜의 체크리스트도 현재 확인 가능한 제출 내역을 반영합니다.
          </p>
        </>
      )}
    </div>
  );
}
