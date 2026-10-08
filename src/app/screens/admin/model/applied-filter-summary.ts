import type { AdminPropertyOption } from '../../../features/admin-properties/admin-properties.types';

export function appliedPropertyLabel(
  propertyId?: string,
  properties?: AdminPropertyOption[],
): string {
  if (!propertyId) return '전체 휴양소';
  const property = properties?.find((item) => item.id === propertyId);
  return property
    ? `${property.name}${property.isActive ? '' : ' · 비활성'}`
    : '선택한 휴양소 · 목록 확인 필요';
}

// Callers validate applied filters before showing a summary.
export function appliedDateRange(from?: string, to?: string): string {
  if (from && to)
    return `${from.replaceAll('-', '.')} ~ ${to.replaceAll('-', '.')}`;
  if (from) return `${from.replaceAll('-', '.')}부터`;
  if (to) return `${to.replaceAll('-', '.')}까지`;
  return '전체 기간';
}
