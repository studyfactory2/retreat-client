import { StaffHeader } from '../../components/StaffHeader';
import { APP_BRAND } from '../../../../core/config/brand';
import type { ReactNode, RefObject } from 'react';
import { StaffIcon } from './StaffIcon';

export function StaffFrame({
  children,
  mainRef,
  loading,
  onRefresh,
}: {
  children: ReactNode;
  mainRef: RefObject<HTMLElement | null>;
  loading: boolean;
  onRefresh?: () => void;
}) {
  return (
    <div className="staff-entry">
      <button
        className="staff-entry-skip"
        type="button"
        onClick={() => {
          mainRef.current?.focus();
          mainRef.current?.scrollIntoView();
        }}
      >
        본문으로 바로가기
      </button>
      <StaffHeader>
        {onRefresh && (
          <button
            type="button"
            className="staff-entry-refresh"
            onClick={onRefresh}
            disabled={loading}
            aria-label="직원 안내 새로고침"
          >
            <StaffIcon name="refresh" />
          </button>
        )}
      </StaffHeader>
      <main
        ref={mainRef}
        className="staff-entry-main"
        tabIndex={-1}
        aria-busy={loading}
      >
        {children}
      </main>
      <footer className="staff-entry-footer">{APP_BRAND.appName}</footer>
    </div>
  );
}
