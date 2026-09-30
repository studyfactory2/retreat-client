import type { GetAdminStaffInput } from '../../../../features/admin-staff/admin-staff.types';

export function readStaffFilters(search: URLSearchParams): GetAdminStaffInput {
  const raw = search.get('page') ?? '1';
  const page = /^\d+$/.test(raw) ? Number(raw) : 1;
  const status = search.get('status');
  return {
    page: Number.isSafeInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    search:
      [...(search.get('search') ?? '').trim()].slice(0, 100).join('') ||
      undefined,
    isActive:
      status === 'active' ? true : status === 'inactive' ? false : undefined,
  };
}

export function staffListSearch(input: GetAdminStaffInput): string {
  const query = new URLSearchParams();
  if (input.search) query.set('search', input.search);
  if (input.isActive !== undefined)
    query.set('status', input.isActive ? 'active' : 'inactive');
  if (input.page > 1) query.set('page', String(input.page));
  return query.size ? `?${query}` : '';
}
