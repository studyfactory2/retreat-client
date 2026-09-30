import { useRef, useState } from 'react';
import { usePropertyStaffCandidates } from '../hooks/use-property-staff-candidates';
import { Button } from '../../../../shared/ui/Button/Button';

export type StaffSelection = { id: string; name: string } | null;

export function PropertyStaffCandidates({
  token,
  rejectSession,
  disabled,
  selected,
  onSelect,
}: {
  token: string;
  rejectSession: (token: string) => void;
  disabled: boolean;
  selected: StaffSelection;
  onSelect: (staff: StaffSelection) => void;
}) {
  const [draftSearch, setDraftSearch] = useState('');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [revision, setRevision] = useState(0);
  const [searchError, setSearchError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const resource = usePropertyStaffCandidates(
    search,
    page,
    revision,
    token,
    rejectSession,
    setPage,
  );

  return (
    <section
      className="property-staff__candidates"
      aria-labelledby="assignment-candidates-title"
    >
      <h2 id="assignment-candidates-title">배정할 직원 선택</h2>
      <p>활성 직원만 표시됩니다. 한 직원이 여러 휴양소를 담당할 수 있습니다.</p>
      <form
        className="property-staff__search"
        onSubmit={(event) => {
          event.preventDefault();
          if (disabled) return;
          if ([...draftSearch.trim()].length > 100) {
            setSearchError('검색어는 100자 이하여야 합니다.');
            input.current?.focus();
            return;
          }
          setSearchError('');
          setSearch(draftSearch.trim());
          setPage(1);
          setRevision((value) => value + 1);
        }}
      >
        <label htmlFor="assignment-search">이름 · 연락처 · 회사 · 부서</label>
        <div>
          <input
            ref={input}
            id="assignment-search"
            value={draftSearch}
            disabled={disabled}
            onChange={(event) => {
              setDraftSearch(event.target.value);
              setSearchError('');
            }}
            aria-invalid={!!searchError || undefined}
            aria-describedby={
              searchError ? 'assignment-search-error' : undefined
            }
          />
          <Button type="submit" disabled={disabled}>
            검색
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={disabled}
            onClick={() => {
              setDraftSearch('');
              setSearch('');
              setPage(1);
              setSearchError('');
              setRevision((value) => value + 1);
            }}
          >
            초기화
          </Button>
        </div>
        {searchError && (
          <p id="assignment-search-error" role="alert">
            {searchError}
          </p>
        )}
      </form>
      {resource.status === 'loading' && (
        <p role="status">직원 목록을 불러오는 중입니다.</p>
      )}
      {resource.status === 'error' && (
        <div
          role="alert"
          className="properties-banner properties-banner--error"
        >
          <p>{resource.message}</p>
          <Button
            disabled={disabled}
            onClick={() => setRevision((value) => value + 1)}
          >
            다시 불러오기
          </Button>
        </div>
      )}
      {resource.status === 'ready' && (
        <>
          {resource.data.total === 0 ? (
            <p role="status">
              조건에 맞는 활성 직원이 없습니다. 직원 관리에서 등록 또는 활성화해
              주세요.
            </p>
          ) : (
            <>
              <p className="property-staff__count">
                검색 결과 {resource.data.total}명
              </p>
              <ul className="property-staff__options">
                {resource.data.items.map((staff) => (
                  <li key={staff.id}>
                    <button
                      type="button"
                      disabled={disabled}
                      aria-pressed={selected?.id === staff.id}
                      onClick={() =>
                        onSelect({ id: staff.id, name: staff.name })
                      }
                    >
                      <span>
                        <strong>{staff.name}</strong>
                        <span>
                          {[staff.company, staff.department]
                            .filter(Boolean)
                            .join(' · ') || '소속 미등록'}
                        </span>
                        <span>{staff.phone || '연락처 미등록'}</span>
                      </span>
                      <span className="property-staff__option-state">
                        {selected?.id === staff.id ? '선택됨' : '선택'}
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
              <nav
                className="properties-pagination"
                aria-label="배정할 직원 목록 페이지"
              >
                <Button
                  className="admin-button-secondary"
                  disabled={disabled || page <= 1}
                  onClick={() => setPage((value) => value - 1)}
                >
                  이전
                </Button>
                <span>
                  {page} / {resource.data.totalPages}
                </span>
                <Button
                  className="admin-button-secondary"
                  disabled={disabled || page >= resource.data.totalPages}
                  onClick={() => setPage((value) => value + 1)}
                >
                  다음
                </Button>
              </nav>
            </>
          )}
        </>
      )}
    </section>
  );
}
