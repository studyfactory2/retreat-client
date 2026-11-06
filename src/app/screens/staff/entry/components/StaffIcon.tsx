export function StaffIcon({
  name,
}: {
  name: 'checklist' | 'refresh' | 'notice' | 'chevron' | 'location' | 'record';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="staff-entry-icon"
    >
      {name === 'checklist' && (
        <>
          <path d="M8 4H5v17h14V4h-3M8 3h8v4H8V3Zm2 9h6m-6 5h6" />
          <path d="m6 12 .5.5 1-1m-1.5 5.5.5.5 1-1" />
        </>
      )}
      {name === 'refresh' && <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" />}
      {name === 'notice' && (
        <>
          <circle cx="12" cy="12" r="9" />
          <path d="M12 7v6m0 4v.1" />
        </>
      )}
      {name === 'location' && (
        <>
          <path d="M19 10c0 5-7 11-7 11S5 15 5 10a7 7 0 1 1 14 0Z" />
          <circle cx="12" cy="10" r="2.5" />
        </>
      )}
      {name === 'record' && (
        <path d="M13 3H6a1 1 0 0 0-1 1v16a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9l-6-6Zm0 0v6h6m-7 3v5m-2.5-2.5h5" />
      )}
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}
