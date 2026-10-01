export function GuestIcon({ name }: { name: 'home' | 'guide' | 'arrow' | 'refresh' | 'notice' }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" className="guest-icon">
      {name === 'home' && <path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1V10Z" />}
      {name === 'guide' && <>
        <path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15M6 8h3m6 0h3M6 12h3m6 0h3" />
      </>}
      {name === 'arrow' && <path d="M5 12h14m-6-6 6 6-6 6" />}
      {name === 'refresh' && <path d="M20 10a8 8 0 1 0-1 7M20 4v6h-6" />}
      {name === 'notice' && <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v6m0 4v.1" />
      </>}
    </svg>
  );
}
