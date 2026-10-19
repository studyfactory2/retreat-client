import { appRoutes } from '../../../../core/router/routes';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-management-card.css';

type Props = {
  property: AdminPropertyDto;
  returnUrl: string;
  disabled: boolean;
  onNavigate: (url: string) => void;
};

const actions = [
  { label: '담당 직원', route: appRoutes.adminPropertyStaff, icon: 'staff' },
  { label: 'QR 관리', route: appRoutes.adminPropertyQr, icon: 'qr' },
  { label: '체크리스트', route: appRoutes.adminPropertyChecklists, icon: 'checklist' },
  { label: '이용 안내', route: appRoutes.adminPropertyGuide, icon: 'guide' },
];

export function PropertyManagementCard({
  property,
  returnUrl,
  disabled,
  onNavigate,
}: Props) {
  return (
    <section className="property-management-card" aria-labelledby="property-management-title">
      <h2 id="property-management-title">운영 관리</h2>
      <dl className="property-management-card__staff">
        <dt>담당 직원</dt>
        <dd>
          <strong>{property.staff?.name ?? '미배정'}</strong>
          {property.staff && !property.staff.isActive && (
            <span className="property-management-card__inactive">비활성</span>
          )}
        </dd>
      </dl>
      <div className="property-management-card__actions">
        {actions.map(({ label, route, icon }) => (
          <Button
            key={route}
            className="admin-button-secondary property-management-card__action"
            disabled={disabled}
            onClick={() =>
              onNavigate(
                route.replace(':id', property.id) +
                  (route === appRoutes.adminPropertyStaff
                    ? returnUrl.slice(appRoutes.adminProperties.length)
                    : ''),
              )
            }
          >
            <span className="property-management-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                {icon === 'staff' && <><circle cx="9" cy="7" r="3" /><path d="M3 21v-3a6 6 0 0 1 12 0v3m1-17a3 3 0 0 1 0 6m2 4a5 5 0 0 1 3 4v3" /></>}
                {icon === 'qr' && <><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="15" y="3" width="6" height="6" rx="1" /><rect x="3" y="15" width="6" height="6" rx="1" /><path d="M15 15h2v2h4m-6 4h2m4-8v2m-2 6h2v-2M3 12h3m6-9v3m0 6v3" /></>}
                {icon === 'checklist' && <><rect x="5" y="4" width="14" height="17" rx="2" /><rect x="9" y="2" width="6" height="4" rx="1" /><path d="m8 11 1 1 2-2m2 1h3m-8 6 1 1 2-2m2 1h3" /></>}
                {icon === 'guide' && <><path d="M12 5c-3-2-6-2-9-1v15c3-1 6-1 9 1 3-2 6-2 9-1V4c-3-1-6-1-9 1Zm0 0v15M6 8h3m-3 4h3m6-4h3m-3 4h3" /></>}
              </svg>
            </span>
            <span>{label}</span>
            <span className="property-management-card__arrow" aria-hidden="true">→</span>
          </Button>
        ))}
      </div>
    </section>
  );
}
