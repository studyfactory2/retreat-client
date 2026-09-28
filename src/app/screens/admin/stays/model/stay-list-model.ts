import { isPropertyId } from '../../../../features/admin-properties/admin-property-management-validation';
import type { GetAdminStaysInput } from '../../../../features/admin-stays/admin-stay-management.types';

export function readStayListFilters(
  search: URLSearchParams,
): GetAdminStaysInput {
  const pageText = search.get('page') ?? '1';
  const page = /^\d+$/.test(pageText) ? Number(pageText) : 1;
  const propertyId = search.get('propertyId');
  const status = search.get('status');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    search:
      [...(search.get('search') ?? '').trim()].slice(0, 100).join('') ||
      undefined,
    propertyId: isPropertyId(propertyId) ? propertyId.toLowerCase() : undefined,
    status: status === 'ACTIVE' || status === 'CANCELLED' ? status : undefined,
  };
}

export function stayListSearch(input: GetAdminStaysInput): string {
  const raw = new URLSearchParams({ page: String(input.page) });
  if (input.search !== undefined) raw.set('search', input.search);
  if (input.propertyId !== undefined) raw.set('propertyId', input.propertyId);
  if (input.status !== undefined) raw.set('status', input.status);
  const clean = readStayListFilters(raw);
  const query = new URLSearchParams();
  if (clean.search) query.set('search', clean.search);
  if (clean.propertyId) query.set('propertyId', clean.propertyId);
  if (clean.status) query.set('status', clean.status);
  if (clean.page > 1) query.set('page', String(clean.page));
  return query.size ? `?${query}` : '';
}
