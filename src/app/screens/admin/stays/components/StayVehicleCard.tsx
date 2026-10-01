import { useId } from 'react';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStayVehicle } from '../hooks/use-stay-vehicle';
import { StayVehicleDetails } from './StayVehicleDetails';
import '../styles/stay-vehicle.css';

export function StayVehicleCard({
  stay,
  token,
  rejectSession,
  onReloadStay,
  actionsDisabled,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  onReloadStay: () => void;
  actionsDisabled: boolean;
}) {
  const title = useId();
  const { resource, refresh } = useStayVehicle(stay, token, rejectSession);

  return (
    <section
      className="stay-card stay-vehicle"
      aria-labelledby={title}
      aria-busy={resource.status === 'loading'}
    >
      <div className="stay-vehicle__heading">
        <h2 id={title}>차량 정보</h2>
        <Button
          className="admin-button-secondary"
          disabled={actionsDisabled || resource.status === 'loading'}
          onClick={() => refresh()}
        >
          차량 정보 새로고침
        </Button>
      </div>
      <p>이 이용 일정에 저장된 차량번호를 확인합니다.</p>

      {resource.status === 'loading' && (
        <p className="stay-vehicle__message" role="status">
          차량 정보를 불러오는 중입니다.
        </p>
      )}
      {resource.status === 'error' && (
        <div className="stay-banner stay-banner--error" role="alert">
          <p>{resource.message}</p>
          {resource.needsStayRefresh && (
            <Button
              className="admin-button-secondary"
              disabled={actionsDisabled}
              onClick={onReloadStay}
            >
              이용 일정 다시 불러오기
            </Button>
          )}
        </div>
      )}
      {resource.status === 'ready' && (
        <StayVehicleDetails data={resource.data} />
      )}
    </section>
  );
}
