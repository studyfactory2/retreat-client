const paths = {
  password: 'M15 7a4 4 0 1 1-4 4L4 18v3H1v-4l8-8a4 4 0 0 1 6-2Z',
  link: 'm10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 2 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0',
  message: 'M4 4h16v12H9l-5 4V4Zm4 4h8m-8 4h5',
  vehicle: 'm5 7 2-4h10l2 4M3 9h18v9H3V9Zm2 9v3m14-3v3M6 13h2m8 0h2',
  history: 'M3 10a9 9 0 1 1 1 8M3 3v7h7m2-4v6l4 3',
  checks: 'M8 4H5v17h14V4h-3M9 2h6v4H9V2Zm-1 11 3 3 5-6',
  info: 'M12 10v7m0-11v1M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z',
  chevron: 'm9 5 7 7-7 7',
  refresh:
    'M20 7v5h-5M4 17v-5h5M6 7a7 7 0 0 1 12-1l2 2M4 16l2 2a7 7 0 0 0 12-1',
  close: 'm6 6 12 12M18 6 6 18',
  more: 'M12 5h.01M12 12h.01M12 19h.01',
} as const;

export function StayDetailIcon({ name }: { name: keyof typeof paths }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d={paths[name]} />
    </svg>
  );
}
