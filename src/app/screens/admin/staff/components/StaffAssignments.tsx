import { Link } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import { AdminMenuIcon } from '../../layout/components/AdminMenuIcon';

export function StaffAssignments({ staff }: { staff: AdminStaffDto }) {
  return (
    <section
      className="staff-panel staff-assignment-panel"
      aria-labelledby="staff-assignments-title"
    >
      <div className="staff-panel__heading">
        <h2 id="staff-assignments-title">
          담당 휴양소 <span>{staff.assignedProperties.length}곳</span>
        </h2>
        <p>담당 배정은 휴양소 설정에서 변경할 수 있습니다.</p>
      </div>
      {staff.assignedProperties.length ? (
        <>
          <ul className="staff-assignments" role="list">
            {staff.assignedProperties.map((property) => (
              <li key={property.id}>
                <Link to={`${appRoutes.adminProperties}/${property.id}`}>
                  <span className="staff-assignment-icon" aria-hidden="true">
                    <AdminMenuIcon name="properties" />
                  </span>
                  <span className="staff-assignment-name">
                    <strong>{property.name}</strong>
                    {property.region && <small>{property.region}</small>}
                    {!property.isActive && (
                      <span className="staff-badge staff-badge--inactive">
                        비활성
                      </span>
                    )}
                  </span>
                  <span className="staff-assignment-arrow" aria-hidden="true">
                    →
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <p className="staff-hint">
            비활성 휴양소도 담당 배정에 포함됩니다.
          </p>
        </>
      ) : (
        <div className="staff-assignments-empty">
          <AdminMenuIcon name="properties" />
          <p>담당 휴양소가 없습니다.</p>
          <span>휴양소 관리에서 직원을 배정해 주세요.</span>
        </div>
      )}
      <Link className="staff-text-link" to={appRoutes.adminProperties}>
        휴양소 관리 <span aria-hidden="true">→</span>
      </Link>
    </section>
  );
}
