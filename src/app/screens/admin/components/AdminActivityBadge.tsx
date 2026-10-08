export function AdminActivityBadge({ active }: { active: boolean }) {
  return (
    <span
      className={`admin-directory-status${active ? '' : ' admin-directory-status--inactive'}`}
    >
      <span aria-hidden="true" />
      {active ? '활성' : '비활성'}
    </span>
  );
}
