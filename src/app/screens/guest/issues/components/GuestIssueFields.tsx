import type {
  GuestIssueCategoryDto,
  GuestIssueReportFields,
} from '../../../../features/guest-issues/guest-issues.types';

export function GuestIssueFields({
  form,
  categories,
  disabled,
  edit,
}: {
  form: GuestIssueReportFields;
  categories: GuestIssueCategoryDto[];
  disabled: boolean;
  edit: (
    change: (current: GuestIssueReportFields) => GuestIssueReportFields,
  ) => void;
}) {
  return (
    <section
      className="guest-card guest-issue-fields"
      aria-labelledby="issue-fields-title"
    >
      <div className="guest-issue-section-heading">
        <h2 id="issue-fields-title">불편 내용</h2>
      </div>
      <div className="guest-issue-field">
        <label htmlFor="issue-category">
          분류 <span className="guest-issue-required">필수</span>
        </label>
        <select
          id="issue-category"
          required
          disabled={disabled}
          value={form.categoryId}
          onChange={(event) => {
            const categoryId = event.currentTarget.value;
            edit((current) => ({ ...current, categoryId }));
          }}
        >
          <option value="">분류 선택</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
        {form.categoryId &&
          !categories.some((category) => category.id === form.categoryId) && (
            <p className="guest-issue-field-error">
              이전 분류가 변경됐어요. 다시 선택해 주세요.
            </p>
          )}
      </div>
      <div className="guest-issue-field">
        <label htmlFor="issue-guest-name">
          이름 <span className="guest-issue-required">필수</span>
        </label>
        <input
          id="issue-guest-name"
          required
          autoComplete="name"
          maxLength={100}
          disabled={disabled}
          value={form.guestName}
          placeholder="신고하시는 분의 이름"
          onChange={(event) =>
            edit((current) => ({ ...current, guestName: event.target.value }))
          }
        />
      </div>
      <div className="guest-issue-field">
        <label htmlFor="issue-title">
          제목 <span className="guest-issue-required">필수</span>
        </label>
        <input
          id="issue-title"
          required
          maxLength={300}
          disabled={disabled}
          value={form.title}
          placeholder="예: 욕실 온수가 나오지 않아요"
          onChange={(event) =>
            edit((current) => ({ ...current, title: event.target.value }))
          }
        />
      </div>
      <div className="guest-issue-field">
        <label htmlFor="issue-description">
          자세한 내용 <span>선택</span>
        </label>
        <textarea
          id="issue-description"
          rows={3}
          maxLength={2000}
          disabled={disabled}
          value={form.description}
          placeholder="어디에서 어떤 문제가 있었는지 알려주세요."
          onChange={(event) =>
            edit((current) => ({ ...current, description: event.target.value }))
          }
        />
        <p className="guest-issue-hint">최대 2,000자</p>
      </div>
      <label className="guest-issue-urgency">
        <input
          type="checkbox"
          checked={form.isUrgent}
          disabled={disabled}
          aria-describedby="issue-urgency-help"
          onChange={(event) =>
            edit((current) => ({ ...current, isUrgent: event.target.checked }))
          }
        />
        <span>
          <strong>
            긴급한 문제예요 <em>선택</em>
          </strong>
          <small id="issue-urgency-help">
            관리자 우선 확인 표시예요. 알림이나 전화는 자동으로 보내지 않습니다.
          </small>
        </span>
      </label>
    </section>
  );
}
