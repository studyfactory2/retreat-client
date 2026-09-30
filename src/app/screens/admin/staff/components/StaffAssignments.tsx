import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';

export function StaffAssignments({ staff }: { staff: AdminStaffDto }) {
  return (
    <section className="staff-panel" aria-labelledby="staff-assignments-title">
      <div className="staff-panel__heading">
        <h2 id="staff-assignments-title">
          담당 휴양소 <span>{staff.assignedProperties.length}곳</span>
        </h2>
        <p>담당 직원 변경과 배정 해제는 각 휴양소의 설정에서 진행하세요.</p>
      </div>
      {staff.assignedProperties.length ? (
        <>
          <ul className="staff-assignments">
            {staff.assignedProperties.map((property) => (
              <li key={property.id}>
                <Link to={`${appRoutes.adminProperties}/${property.id}`}>
                  <span>
                    <strong>{property.name}</strong>
                    {property.region && <small>{property.region}</small>}
                  </span>
                  <span>
                    {!property.isActive && (
                      <span className="staff-badge staff-badge--inactive">
                        비활성 휴양소
                      </span>
                    )}
                    <span aria-hidden="true">→</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="staff-hint">
            비활성 휴양소도 배정에 포함됩니다. 직원을 비활성화하려면 먼저 모든
            배정을 해제하거나 변경해 주세요.
          </p>
        </>
      ) : (
        <p className="staff-hint">
          아직 담당 휴양소가 없습니다. 휴양소 관리에서 이 직원을 배정할 수
          있습니다.
        </p>
      )}
      <Link className="staff-text-link" to={appRoutes.adminProperties}>
        휴양소 관리로 이동 →
      </Link>
    </section>
  );
}
