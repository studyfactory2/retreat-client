import type { AdminStayVehicleDto } from '../../../../features/admin-stay-vehicles/admin-stay-vehicle.types';
import { formatStayVehicleTimestamp } from '../model/stay-vehicle-model';

export function StayVehicleDetails({ data }: { data: AdminStayVehicleDto }) {
  const { stay, vehicle, needsReview } = data;
  const enabled = stay.property.vehicleRegistrationEnabled;

  return (
    <>
      <dl className="stay-vehicle__details">
        <div>
          <dt>차량번호 수집</dt>
          <dd>{enabled ? '활성' : '비활성'}</dd>
        </div>
        <div>
          <dt>등록 상태</dt>
          <dd>
            {vehicle === null
              ? '미등록'
              : vehicle.plateNumber === null
                ? '차량번호 없이 저장됨'
                : needsReview
                  ? '재확인 필요'
                  : '차량번호 등록됨'}
          </dd>
        </div>
        <div className="stay-vehicle__wide">
          <dt>{needsReview ? '변경 전 일정의 차량번호' : '차량번호'}</dt>
          <dd
            className={vehicle?.plateNumber ? 'stay-vehicle__plate' : undefined}
          >
            {vehicle === null
              ? '등록된 차량 정보가 없습니다.'
              : vehicle.plateNumber === null
                ? '차량번호가 비어 있습니다.'
                : vehicle.plateNumber}
          </dd>
        </div>
        {vehicle !== null && (
          <div className="stay-vehicle__wide">
            <dt>최근 저장 · 한국 시간</dt>
            <dd>
              <time dateTime={vehicle.updatedAt}>
                {formatStayVehicleTimestamp(vehicle.updatedAt)}
              </time>
            </dd>
          </div>
        )}
      </dl>
      {needsReview && (
        <div className="stay-vehicle__review" role="status">
          <strong>차량 정보 재확인이 필요합니다.</strong>
          <p>
            변경 전 일정에 저장된 번호입니다. 이용객이 다시 확인해야 합니다.
          </p>
        </div>
      )}
      {!enabled && (
        <p className="stay-vehicle__help">
          차량번호 수집이 꺼져 있습니다. 이전 정보는 유지됩니다.
        </p>
      )}
      <details className="stay-vehicle__rules">
        <summary>차량 정보 안내</summary>
        {vehicle?.plateNumber == null && (
          <p>차량번호 미등록은 차량을 이용하지 않는다는 확인이 아닙니다.</p>
        )}
        <p>조회용 정보이며, 차량 소유나 주차 승인 여부를 뜻하지 않습니다.</p>
      </details>
    </>
  );
}
