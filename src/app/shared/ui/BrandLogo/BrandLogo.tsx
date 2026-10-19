import { APP_BRAND } from '../../../core/config/brand';
import './brand-logo.css';

export function BrandLogo() {
  return (
    <img
      className="brand-logo"
      src={APP_BRAND.logo}
      alt={APP_BRAND.name}
      width={112}
      height={26}
    />
  );
}
