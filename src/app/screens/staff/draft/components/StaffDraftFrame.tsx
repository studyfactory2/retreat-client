import { APP_BRAND } from '../../../../core/config/brand';
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
            {APP_BRAND.name}<span>휴양소 정비 안내</span>
          </strong>
          <span>직원</span>
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
        {APP_BRAND.operatorCredit}
      </footer>
    </div>
  );
}
