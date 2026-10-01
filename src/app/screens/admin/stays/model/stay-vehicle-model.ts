import type { AdminStayVehicleDto } from '../../../../features/admin-stay-vehicles/admin-stay-vehicle.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';

export function getStayVehicleScope(stay: AdminStayDto): string {
  return JSON.stringify([
    stay.id,
    stay.currentRevision,
    stay.guestName,
    stay.checkInAt,
    stay.checkOutAt,
    stay.status,
    stay.propertyId,
    stay.property.id,
    stay.property.name,
    stay.property.region,
    stay.property.isActive,
  ]);
}

export function matchesStayVehicleContext(
  stay: AdminStayDto,
  response: AdminStayVehicleDto,
): boolean {
  const current = response.stay;
  return (
    current.id === stay.id &&
    current.currentRevision === stay.currentRevision &&
    current.guestName === stay.guestName &&
    current.checkInAt === stay.checkInAt &&
    current.checkOutAt === stay.checkOutAt &&
    current.status === stay.status &&
    current.property.id === stay.propertyId &&
    current.property.id === stay.property.id &&
    current.property.name === stay.property.name &&
    current.property.region === stay.property.region &&
    current.property.isActive === stay.property.isActive
  );
}

const seoulDateTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatStayVehicleTimestamp(value: string): string {
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? seoulDateTime.format(date) : '확인 필요';
}
