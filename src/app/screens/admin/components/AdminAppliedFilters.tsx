import '../styles/admin-applied-filters.css';

export function AdminAppliedFilters({
  items,
}: {
  items: { label: string; value: string }[];
}) {
  return (
    <section className="admin-applied-filters" aria-label="적용된 조회 조건">
      <span className="admin-applied-filters__heading">적용 조건</span>
      <dl>
        {items.map(({ label, value }) => (
          <div key={label}>
            <dt>{label}</dt>
            <dd>{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
