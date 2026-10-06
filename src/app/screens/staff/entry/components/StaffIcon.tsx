export function StaffIcon({
  name,
}: {
  name: 'property' | 'checklist' | 'refresh' | 'notice' | 'chevron';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden="true"
      className="staff-entry-icon"
    >
      {name === 'property' && (
        <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />
      )}
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
      {name === 'chevron' && <path d="m6 9 6 6 6-6" />}
    </svg>
  );
}
