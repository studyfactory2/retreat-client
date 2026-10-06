import type { ReactNode, RefObject } from 'react';

export function StaffDraftFrame({
  children,
  mainRef,
  loading,
}: {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
  loading: boolean;
}) {
  return (
    <div className="staff-draft">
      <button
        type="button"
        className="staff-draft-skip"
        onClick={() => mainRef.current?.focus()}
      >
        본문으로 바로가기
      </button>
      <header className="staff-draft-header">
        <div>
          <strong className="staff-draft-brand">
            OH BOK<span>RETREAT</span>
          </strong>
          <span>직원 정비 체크리스트</span>
        </div>
      </header>
      <main
        className="staff-draft-main"
        ref={mainRef}
        tabIndex={-1}
        aria-busy={loading}
      >
        {children}
      </main>
      <footer className="staff-draft-footer">
        좋은 머무름을 함께 준비하는, 오복.
      </footer>
    </div>
  );
}
