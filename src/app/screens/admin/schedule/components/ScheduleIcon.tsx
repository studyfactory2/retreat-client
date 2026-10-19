export function ScheduleIcon({
  name,
}: {
  name:
    | 'calendar'
    | 'check'
    | 'upload'
    | 'plus'
    | 'refresh'
    | 'filter'
    | 'chevron'
    | 'arrow';
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'calendar' && (
        <>
          <rect x="4" y="5" width="16" height="16" rx="3" />
          <path d="M8 3v4m8-4v4M4 11h16m-11 4h1m4 0h1" />
        </>
      )}
      {name === 'check' && (
        <>
          <path d="M20 11v7a3 3 0 0 1-3 3H7a3 3 0 0 1-3-3V8a3 3 0 0 1 3-3h7" />
          <path d="m9 11 3 3 8-9" />
        </>
      )}
      {name === 'upload' && (
        <>
          <path d="M12 15V3m-4 4 4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
        </>
      )}
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'refresh' && (
        <path d="M20 5v5h-5M4 19v-5h5M6.1 7a7 7 0 0 1 11.5-1L20 10M4 14l2.4 4A7 7 0 0 0 17.9 17" />
      )}
      {name === 'filter' && (
        <>
          <path d="M4 7h16M4 17h16" />
          <rect x="8" y="4" width="4" height="6" rx="1" />
          <rect x="14" y="14" width="4" height="6" rx="1" />
        </>
      )}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
      {name === 'arrow' && <path d="M5 12h14m-5-5 5 5-5 5" />}
    </svg>
  );
}
