type EntryIconName = 'scan' | 'book' | 'checklist' | 'down' | 'up-right' | 'plus' | 'wrench';

export function EntryIcon({ name }: { name: EntryIconName }) {
  const paths = {
    scan: <><path d="M8 3H4a1 1 0 0 0-1 1v4m13-5h4a1 1 0 0 1 1 1v4M3 16v4a1 1 0 0 0 1 1h4m13-5v4a1 1 0 0 1-1 1h-4M3 12h18" /></>,
    book: <><path d="M12 5v15M3 4h5a4 4 0 0 1 4 2 4 4 0 0 1 4-2h5v15h-5a5 5 0 0 0-4 2 5 5 0 0 0-4-2H3Z" /></>,
    checklist: <><path d="M9 4H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2h-3" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="m8 13 3 3 5-6" /></>,
    down: <path d="M12 4v16m-6-6 6 6 6-6" />,
    'up-right': <path d="M6 18 18 6M6 6h12v12" />,
    plus: <path d="M12 5v14M5 12h14" />,
    wrench: <path d="M14.5 6.5 17 9l4-4a6 6 0 0 1-7.6 7.6l-7.9 7.9a2.1 2.1 0 0 1-3-3l7.9-7.9A6 6 0 0 1 18 2Z" />,
  };

  return <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
