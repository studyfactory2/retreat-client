import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';
import { usePropertySelect } from '../hooks/use-property-select';
import '../styles/admin-property-select.css';

export function AdminPropertySelect({
  id,
  value,
  properties,
  loading = false,
  describedBy,
  onChange,
  label = '휴양소',
}: {
  id: string;
  value: string;
  properties?: AdminPropertyOption[];
  loading?: boolean;
  describedBy?: string;
  onChange: (id: string) => void;
  label?: string;
}) {
  const {
    open,
    setOpen,
    query: search,
    setQuery,
    close,
    rootRef,
    buttonRef,
    searchRef,
  } = usePropertySelect();
  const selected = properties?.find((property) => property.id === value);
  const selectedName = value
    ? selected
      ? `${selected.name}${selected.isActive ? '' : ' · 비활성'}`
      : '선택한 휴양소 · 목록 확인 필요'
    : '전체 휴양소';
  const query = search.normalize('NFC').trim().toLocaleLowerCase('ko-KR');
  const matches = (properties ?? []).filter((property) =>
    `${property.name} ${property.region ?? ''}`
      .normalize('NFC')
      .toLocaleLowerCase('ko-KR')
      .includes(query),
  );

  function select(next: string) {
    onChange(next);
    close(true);
  }

  return (
    <div
      className="admin-property-select"
      ref={rootRef}
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) close();
      }}
      onKeyDown={(event) => {
        if (open && event.key === 'Escape') {
          event.preventDefault();
          event.stopPropagation();
          close(true);
        }
      }}
    >
      <label id={`${id}-label`} htmlFor={id}>
        {label}
      </label>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        className="admin-property-select__trigger"
        disabled={loading}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? `${id}-panel` : undefined}
        aria-labelledby={`${id}-label ${id}-value`}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(event) => {
          if (!open && event.key === 'ArrowDown') {
            event.preventDefault();
            setOpen(true);
          }
        }}
      >
        <span id={`${id}-value`} title={selectedName}>
          {loading ? '휴양소 불러오는 중…' : selectedName}
        </span>
        <svg viewBox="0 0 20 20" fill="none" aria-hidden="true">
          <path d="m5 7 5 5 5-5" />
        </svg>
      </button>
      {open && !loading && (
        <div
          id={`${id}-panel`}
          className="admin-property-select__panel"
          role="dialog"
          aria-label={`${label} 선택`}
        >
          <div className="admin-property-select__search-row">
            <label htmlFor={`${id}-search`}>이름·지역으로 찾기</label>
            <input
              ref={searchRef}
              id={`${id}-search`}
              type="search"
              className="admin-property-select__search"
              placeholder="휴양소 이름 또는 지역"
              autoComplete="off"
              value={search}
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                // Searching the picker must not submit its parent filter form.
                if (event.key === 'Enter') event.preventDefault();
              }}
            />
          </div>
          <ul className="admin-property-select__options">
            <li>
              <button
                type="button"
                aria-pressed={!value}
                onClick={() => select('')}
              >
                전체 휴양소
              </button>
            </li>
            {matches.map((property) => (
              <li key={property.id}>
                <button
                  type="button"
                  aria-pressed={value === property.id}
                  onClick={() => select(property.id)}
                >
                  <strong>{property.name}</strong>
                  <small>
                    {property.region || '지역 미등록'}
                    {property.isActive ? '' : ' · 비활성'}
                  </small>
                </button>
              </li>
            ))}
          </ul>
          <p className="admin-property-select__count" role="status">
            {properties === undefined
              ? '휴양소 목록을 다시 불러와 주세요.'
              : matches.length
                ? `${matches.length.toLocaleString('ko-KR')}곳`
                : '검색 결과가 없습니다.'}
          </p>
          <button
            className="admin-property-select__close"
            type="button"
            onClick={() => close(true)}
          >
            닫기
          </button>
        </div>
      )}
    </div>
  );
}
