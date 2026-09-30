import type { AdminIssueCategoryDto } from '../../../../features/admin-issue-categories/admin-issue-category.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/issue-categories.css';

const dateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

export function CategoryRows({
  items,
  onEdit,
  disabled = false,
}: {
  items: AdminIssueCategoryDto[];
  onEdit: (item: AdminIssueCategoryDto) => void;
  disabled?: boolean;
}) {
  if (!items.length)
    return (
      <div className="category-empty" role="status">
        <h2>조건에 맞는 분류가 없습니다</h2>
        <p>검색 조건을 변경하거나 새 분류를 등록해 주세요.</p>
      </div>
    );
  return (
    <div className="category-table-wrap">
      <table className="category-table" role="table">
        <caption className="category-sr-only">
          표시 순서가 작은 순서로 정렬된 이상사항 분류 목록
        </caption>
        <thead>
          <tr>
            <th scope="col">분류명</th>
            <th scope="col">상태</th>
            <th scope="col">표시 순서</th>
            <th scope="col">최근 변경 · 한국 시간</th>
            <th scope="col">관리</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <th scope="row">
                <div className="category-row__name">
                  <strong>{item.name}</strong>
                  {item.isFallback && (
                    <span className="category-fallback-badge">기본 분류</span>
                  )}
                </div>
                {item.isFallback && (
                  <p className="category-row__note">
                    체크리스트 이상 항목에 사용
                  </p>
                )}
              </th>
              <td>
                <span className="category-mobile-label">상태</span>
                <span
                  className={`category-status${item.isActive ? ' category-status--active' : ''}`}
                >
                  {item.isActive ? '활성' : '비활성'}
                </span>
              </td>
              <td>
                <span className="category-mobile-label">표시 순서</span>
                <span className="category-row__order">
                  {item.sortOrder.toLocaleString('ko-KR')}
                </span>
              </td>
              <td>
                <span className="category-mobile-label">
                  최근 변경 · 한국 시간
                </span>
                <time dateTime={item.updatedAt}>
                  {dateTime.format(new Date(item.updatedAt))}
                </time>
              </td>
              <td>
                <Button
                  className="admin-button-secondary category-row__edit"
                  disabled={disabled}
                  aria-label={`${item.name} 분류 수정`}
                  onClick={() => onEdit(item)}
                >
                  수정<span aria-hidden="true">→</span>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
