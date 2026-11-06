import { StaffHeader } from '../../components/StaffHeader';
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
      <StaffHeader />
      <main
        className="staff-draft-main"
        ref={mainRef}
        tabIndex={-1}
        aria-busy={loading}
      >
        {children}
      </main>
    </div>
  );
}
