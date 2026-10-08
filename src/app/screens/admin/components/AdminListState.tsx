import type { ReactNode } from 'react';

export function AdminListState({
  title,
  description,
  error = false,
  loading = false,
  children,
}: {
  title: string;
  description: string;
  error?: boolean;
  loading?: boolean;
  children?: ReactNode;
}) {
  return (
    <section
      className="admin-directory-state"
      role={error ? 'alert' : 'status'}
      aria-busy={loading || undefined}
    >
      <h2>{title}</h2>
      <p>{description}</p>
      {children && (
        <div className="admin-directory-state-actions">{children}</div>
      )}
    </section>
  );
}
