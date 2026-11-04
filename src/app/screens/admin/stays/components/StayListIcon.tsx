export function StayListIcon({
  name,
}: {
  name: 'plus' | 'upload' | 'more' | 'filter' | 'chevron' | 'refresh';
}) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'plus' && <path d="M12 5v14M5 12h14" />}
      {name === 'upload' && (
        <path d="M12 15V3m-4 4 4-4 4 4M5 14v5a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-5" />
      )}
      {name === 'more' && (
        <>
          <circle cx="12" cy="5" r="1" />
          <circle cx="12" cy="12" r="1" />
          <circle cx="12" cy="19" r="1" />
        </>
      )}
      {name === 'filter' && (
        <>
          <path d="M4 7h16M4 17h16" />
          <rect x="8" y="4" width="4" height="6" rx="1" />
          <rect x="14" y="14" width="4" height="6" rx="1" />
        </>
      )}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
      {name === 'refresh' && (
        <path d="M20 5v5h-5M4 19v-5h5M6.1 7a7 7 0 0 1 11.5-1L20 10M4 14l2.4 4A7 7 0 0 0 17.9 17" />
      )}
    </svg>
  );
}
