import type { ReactNode } from 'react';
import { BrandLogo } from '../../../shared/ui/BrandLogo/BrandLogo';
import './staff-header.css';

export function StaffHeader({ children }: { children?: ReactNode }) {
  return (
    <header className="staff-header">
      <div className="staff-header__inner">
        <div className="staff-header__brand">
          <BrandLogo />
          <span>직원 정비</span>
        </div>
        {children}
      </div>
    </header>
  );
}
