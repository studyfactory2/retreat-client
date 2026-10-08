import { Button } from '../../../shared/ui/Button/Button';

export function AdminListPagination({
  label,
  page,
  totalPages,
  onPage,
}: {
  label: string;
  page: number;
  totalPages: number;
  onPage: (page: number) => void;
}) {
  if (totalPages <= 1) return null;
  return (
    <nav className="admin-directory-pagination" aria-label={label}>
      <Button
        className="admin-button-secondary"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
      >
        이전
      </Button>
      <span aria-current="page">
        <strong>{page}</strong> / {totalPages} 페이지
      </span>
      <Button
        className="admin-button-secondary"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
      >
        다음
      </Button>
    </nav>
  );
}
