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
          <strong>이용객의 차량 정보 재확인이 필요합니다.</strong>
          <p>
            표시된 번호는 변경 전 일정 기준으로 저장되었습니다. 이용객 정보·예정
            날짜·관리자 메모 등을 수정하면 차량 정보도 다시 확인해야 합니다.
          </p>
        </div>
      )}
      {!enabled && (
        <p className="stay-vehicle__help">
          이 휴양소는 현재 차량번호를 수집하지 않습니다. 이전에 저장된 정보는
          관리자에게 계속 표시됩니다.
        </p>
      )}
      {vehicle?.plateNumber == null && (
        <p className="stay-vehicle__help">
          차량번호가 없다는 뜻이며, 차량을 이용하지 않는다는 확인은 아닙니다.
        </p>
      )}
      <p className="stay-vehicle__help">
        차량 정보는 조회만 할 수 있습니다. 차량 소유 확인이나 주차 승인 여부를
        의미하지 않습니다.
      </p>
    </>
  );
}
