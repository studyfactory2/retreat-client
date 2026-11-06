import { Link, type To } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { BrandLogo } from '../../../shared/ui/BrandLogo/BrandLogo';
import { GuestIcon } from '../entry/components/GuestIcon';
import '../styles/guest-page-header.css';

type GuestPageHeaderProps = {
  home?: To;
  refresh?: { onClick: () => void; disabled: boolean };
};

export function GuestPageHeader({ home, refresh }: GuestPageHeaderProps) {
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
          <Link className="guest-page-header__landing" to={appRoutes.home}>
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
