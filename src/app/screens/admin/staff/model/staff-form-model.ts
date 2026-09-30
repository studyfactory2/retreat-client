import type {
  AdminStaffDto,
  CreateAdminStaffInput,
  UpdateAdminStaffInput,
} from '../../../../features/admin-staff/admin-staff.types';

export interface StaffFormValues {
  name: string;
  phone: string;
  company: string;
  department: string;
  isActive: boolean;
}
export type StaffFormErrors = Partial<Record<keyof StaffFormValues, string>>;
export const staffTextFields = [
  { key: 'name', label: '직원 이름', limit: 100 },
  { key: 'phone', label: '연락처', limit: 32 },
  { key: 'company', label: '회사명', limit: 100 },
  { key: 'department', label: '부서명', limit: 100 },
] as const;

export function createStaffFormValues(staff?: AdminStaffDto): StaffFormValues {
  return {
    name: staff?.name ?? '',
    phone: staff?.phone ?? '',
    company: staff?.company ?? '',
    department: staff?.department ?? '',
    isActive: staff?.isActive ?? true,
  };
}

export function validateStaffForm(
  values: StaffFormValues,
  original?: AdminStaffDto,
): StaffFormErrors {
  const errors: StaffFormErrors = {};
  for (const { key, label, limit } of staffTextFields) {
    if ([...values[key].trim()].length > limit)
      errors[key] = `${label}은(는) ${limit}자 이하여야 합니다.`;
  }
  if (!values.name.trim()) errors.name = '직원 이름을 입력해 주세요.';
  if (
    !values.isActive &&
    original?.isActive &&
    original.assignedProperties.length
  ) {
    errors.isActive =
      '담당 휴양소를 모두 해제하거나 다른 직원으로 변경한 뒤 비활성화해 주세요.';
  }
  return errors;
}

export function buildCreateStaffInput(
  values: StaffFormValues,
): CreateAdminStaffInput {
  return {
    name: values.name.trim(),
    phone: values.phone.trim() || null,
    company: values.company.trim() || null,
    department: values.department.trim() || null,
  };
}

export function buildUpdateStaffInput(
  values: StaffFormValues,
  original: AdminStaffDto,
): UpdateAdminStaffInput | null {
  const input: UpdateAdminStaffInput = {};
  if (values.name.trim() !== original.name.trim())
    input.name = values.name.trim();
  for (const field of ['phone', 'company', 'department'] as const) {
    const value = values[field].trim() || null;
    if (value !== (original[field]?.trim() || null)) input[field] = value;
  }
  if (values.isActive !== original.isActive) input.isActive = values.isActive;
  return Object.keys(input).length ? input : null;
}
