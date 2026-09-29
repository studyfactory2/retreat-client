import { Link } from 'react-router-dom';
import { AdminMenuIcon } from '../layout/components/AdminMenuIcon';
import { adminSecondaryMenu } from '../layout/model/admin-menu';
import './styles/admin-more.css';

export function AdminMoreScreen() {
  return (
    <div className="admin-more">
      <header>
        <p>휴양소 관리 도구</p>
        <h1>더보기</h1>
        <span>기록을 확인하고 휴양소 운영 정보를 관리하세요.</span>
      </header>
      <nav aria-label="추가 관리자 메뉴">
        <ul>
          {adminSecondaryMenu.map((item) => (
            <li key={item.to}>
              <Link to={item.to}>
                <span className="admin-more__icon">
                  <AdminMenuIcon name={item.icon} />
                </span>
                <span>
                  <strong>{item.label}</strong>
                  <span className="admin-more__description">
                    {item.description}
                  </span>
                </span>
                <span className="admin-more__arrow" aria-hidden="true">
                  →
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </div>
  );
}
