export type AdminMenuIconName =
  | 'overview'
  | 'calendar'
  | 'maintenance'
  | 'issues'
  | 'submissions'
  | 'properties'
  | 'staff'
  | 'more';
export function AdminMenuIcon({ name }: { name: AdminMenuIconName }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      {name === 'overview' && (
        <>
          <rect x="3" y="3" width="7" height="7" rx="1.5" />
          <rect x="14" y="3" width="7" height="7" rx="1.5" />
          <rect x="3" y="14" width="7" height="7" rx="1.5" />
          <rect x="14" y="14" width="7" height="7" rx="1.5" />
        </>
      )}
      {name === 'calendar' && (
        <>
          <rect x="3" y="5" width="18" height="16" rx="2" />
          <path d="M7 3v4m10-4v4M3 11h18M7 15h2m6 0h2m-10 3h2" />
        </>
      )}
      {name === 'maintenance' && (
        <path d="M14 6a5 5 0 0 0-6 6L3 17a2.8 2.8 0 0 0 4 4l5-5a5 5 0 0 0 6-6l-3 3-4-4 3-3Z" />
      )}
      {name === 'issues' && (
        <>
          <path d="m10.3 4.2-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.7-2.8l-8-14a2 2 0 0 0-3.4 0Z" />
          <path d="M12 9v5m0 3v.1" />
        </>
      )}
      {name === 'submissions' && (
        <>
          <path d="M8 4H6a2 2 0 0 0-2 2v14a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1V6a2 2 0 0 0-2-2h-2M8 10h8M8 14h8M8 18h5" />
          <rect x="8" y="2" width="8" height="4" rx="1" />
        </>
      )}
      {name === 'properties' && (
        <path d="M4 21V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v17M16 9h4v12M2 21h20M8 7h4M8 11h4M8 15h4M8 21v-3h4v3" />
      )}
      {name === 'more' && (
        <>
          <circle cx="5" cy="12" r="1.5" />
          <circle cx="12" cy="12" r="1.5" />
          <circle cx="19" cy="12" r="1.5" />
        </>
      )}
      {name === 'staff' && (
        <>
          <circle cx="9" cy="7" r="3" />
          <path d="M3 21v-3a6 6 0 0 1 12 0v3M16 4a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" />
        </>
      )}
    </svg>
  );
}
