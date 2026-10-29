import { apiRequest } from '../../core/api/api-client';
import { ApiRequestError } from '../../core/api/api-error';
import { getAdminStaffList } from './admin-staff-api';
import type { AdminStaffDto } from './admin-staff.types';
import { requireStaffId } from './admin-staff-validation';
import {
  prepareStaffDeactivationInput,
  readStaffDeactivationPreview,
  readStaffDeactivationResult,
} from './admin-staff-handover-readers';
import type {
  DeactivateStaffInput,
  StaffDeactivationPreview,
  StaffDeactivationResult,
} from './admin-staff-handover.types';

export async function getStaffDeactivationPreview(
  id: string,
  token: string,
  signal?: AbortSignal,
): Promise<StaffDeactivationPreview> {
  const staffId = requireStaffId(id);
  return readStaffDeactivationPreview(
    await apiRequest<unknown>(`/admin/staff/${staffId}/deactivation-preview`, {
      token,
      signal,
    }),
    staffId,
  );
}

export async function deactivateStaff(
  id: string,
  input: DeactivateStaffInput,
  token: string,
  signal?: AbortSignal,
): Promise<StaffDeactivationResult> {
  const staffId = requireStaffId(id);
  const body = prepareStaffDeactivationInput(staffId, input);
  return readStaffDeactivationResult(
    await apiRequest<unknown>(`/admin/staff/${staffId}/deactivate`, {
      method: 'POST',
      token,
      signal,
      body: { ...body },
    }),
    staffId,
    body,
  );
}

export async function getReplacementStaff(
  excludedId: string,
  token: string,
  signal?: AbortSignal,
): Promise<AdminStaffDto[]> {
  const excluded = requireStaffId(excludedId);
  const staff: AdminStaffDto[] = [];
  const ids = new Set<string>();
  let expectedTotal: number | undefined;
  let expectedPages: number | undefined;
  let page = 1;
  do {
    signal?.throwIfAborted();
    const data = await getAdminStaffList(
      { page, isActive: true },
      token,
      signal,
    );
    if (
      (expectedTotal !== undefined && data.total !== expectedTotal) ||
      (expectedPages !== undefined && data.totalPages !== expectedPages)
    )
      throw changedStaffList();
    expectedTotal ??= data.total;
    expectedPages ??= data.totalPages;
    for (const item of data.items) {
      const previous = staff.at(-1);
      if (
        ids.has(item.id) ||
        (previous &&
          (Date.parse(previous.createdAt) < Date.parse(item.createdAt) ||
            (previous.createdAt === item.createdAt && previous.id <= item.id)))
      )
        throw changedStaffList();
      ids.add(item.id);
      staff.push(item);
    }
    page += 1;
  } while (page <= expectedPages);
  signal?.throwIfAborted();
  return staff.filter((item) => item.id !== excluded);
}

function changedStaffList(): ApiRequestError {
  return new ApiRequestError(
    '활성 직원 목록이 변경되었습니다. 최신 목록을 다시 불러와 주세요.',
    200,
    'STAFF_REPLACEMENT_LIST_CHANGED',
  );
}
