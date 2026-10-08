import type { GetAdminPropertiesInput } from '../../../../features/admin-properties/admin-property-management.types';

export function normalizePropertySearch(value: string) {
  return [...value.trim()].slice(0, 100).join('') || undefined;
}

export function readPropertyFilters(
  search: URLSearchParams,
): GetAdminPropertiesInput {
  const value = search.get('page') ?? '1';
  const page = /^\d+$/.test(value) ? Number(value) : 1;
  const status = search.get('status');
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 100_000 ? page : 1,
    search: normalizePropertySearch(search.get('search') ?? ''),
    isActive:
      status === 'active' ? true : status === 'inactive' ? false : undefined,
  };
}

export function propertyListSearch(input: GetAdminPropertiesInput): string {
  const query = new URLSearchParams();
  const search = normalizePropertySearch(input.search ?? '');
  if (search) query.set('search', search);
  if (input.isActive !== undefined)
    query.set('status', input.isActive ? 'active' : 'inactive');
  if (input.page > 1) query.set('page', String(input.page));
  return query.size ? `?${query}` : '';
}
