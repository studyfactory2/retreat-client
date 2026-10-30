import { useContext } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { AdminPageNavigationContext } from '../layout/model/admin-page-navigation';
import { adminParentPath } from '../layout/model/admin-page-history';
import '../styles/admin-page-heading.css';

export function AdminBackButton({
  fallback,
  onBack,
  disabled = false,
  label = '이전 페이지',
}: {
  fallback?: string;
  onBack?: () => void;
  disabled?: boolean;
  label?: string;
}) {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const history = useContext(AdminPageNavigationContext);
  return (
    <button
      type="button"
      className="admin-back-button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={() => {
        if (onBack) onBack();
        else
          void navigate(
            history?.destination(pathname, fallback) ??
              fallback ??
              adminParentPath(pathname),
          );
      }}
    >
      <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="m14 6-6 6 6 6M8 12h12" />
      </svg>
    </button>
  );
}
