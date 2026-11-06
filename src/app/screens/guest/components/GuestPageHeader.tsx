import { Link, useNavigate } from 'react-router-dom';
import { guestLandingState, type GuestReturnTarget } from '../../../features/guest-entry/guest-landing-return';
import { appRoutes } from '../../../core/router/routes';
import { BrandLogo } from '../../../shared/ui/BrandLogo/BrandLogo';
import { GuestIcon } from '../entry/components/GuestIcon';
import '../styles/guest-page-header.css';

type GuestPageHeaderProps = {
  home?: GuestReturnTarget;
  returnTo?: GuestReturnTarget;
  refresh?: { onClick: () => void; disabled: boolean };
};

export function GuestPageHeader({ home, returnTo = home, refresh }: GuestPageHeaderProps) {
  const navigate = useNavigate();
  const brand = (
    <>
      <BrandLogo />
      <span>휴양소 이용 안내</span>
    </>
  );
  return (
    <header className="guest-page-header">
      <div className="guest-page-header__inner">
        {home ? (
          <Link to={home} className="guest-page-header__brand" aria-label="휴양소 이용 안내 홈">
            {brand}
          </Link>
        ) : (
          <div className="guest-page-header__brand">{brand}</div>
        )}
        <div className="guest-page-header__actions">
          <Link
            className="guest-page-header__landing"
            to={appRoutes.home}
            onClick={(event) => {
              if (!returnTo || event.defaultPrevented || event.button !== 0 ||
                  event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
              event.preventDefault();
              void navigate(appRoutes.home, { state: guestLandingState(returnTo) });
            }}
          >
            서비스 홈
          </Link>
          {refresh && (
            <button type="button" onClick={refresh.onClick} disabled={refresh.disabled} aria-label="안내 새로고침">
              <GuestIcon name="refresh" />
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
