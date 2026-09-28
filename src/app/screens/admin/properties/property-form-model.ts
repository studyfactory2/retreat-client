import { ApiRequestError } from '../../../core/api/api-error';
import type {
  AdminPropertyDto,
  CreateAdminPropertyInput,
  UpdateAdminPropertyInput,
} from '../../../features/admin-properties/admin-property-management.types';

export interface PropertyFormValues {
  name: string;
  region: string;
  vehicleRegistrationEnabled: boolean;
  isActive: boolean;
}

export type PropertyFormErrors = Partial<
  Record<keyof PropertyFormValues, string>
>;

function nullableText(value: string): string | null {
  return value.trim() || null;
}

export function createPropertyFormValues(
  property?: AdminPropertyDto,
): PropertyFormValues {
  return {
    name: property?.name ?? '',
    region: property?.region ?? '',
    vehicleRegistrationEnabled: property?.vehicleRegistrationEnabled ?? false,
    isActive: property?.isActive ?? true,
  };
}

export function validatePropertyForm(
  values: PropertyFormValues,
): PropertyFormErrors {
  const errors: PropertyFormErrors = {};
  if (!values.name.trim()) errors.name = '휴양소 이름을 입력해 주세요.';
  else if ([...values.name.trim()].length > 100)
    errors.name = '휴양소 이름은 100자 이하여야 합니다.';
  if ([...values.region.trim()].length > 100)
    errors.region = '지역은 100자 이하여야 합니다.';
  if (typeof values.vehicleRegistrationEnabled !== 'boolean')
    errors.vehicleRegistrationEnabled = '차량 등록 사용 여부를 선택해 주세요.';
  if (typeof values.isActive !== 'boolean')
    errors.isActive = '운영 상태를 선택해 주세요.';
  return errors;
}

function requireValid(values: PropertyFormValues) {
  const errors = validatePropertyForm(values);
  if (Object.keys(errors).length)
    throw new ApiRequestError(
      '입력 내용을 확인해 주세요.',
      400,
      'VALIDATION_ERROR',
      Object.entries(errors).map(([field, message]) => ({
        field,
        messages: [message],
      })),
    );
}

export function buildCreatePropertyInput(
  values: PropertyFormValues,
): CreateAdminPropertyInput {
  requireValid(values);
  return {
    name: values.name.trim(),
    region: nullableText(values.region),
    vehicleRegistrationEnabled: values.vehicleRegistrationEnabled,
  };
}

export function buildUpdatePropertyInput(
  values: PropertyFormValues,
  original: AdminPropertyDto,
): UpdateAdminPropertyInput | null {
  requireValid(values);
  const changes: UpdateAdminPropertyInput = {};
  if (values.name.trim() !== original.name.trim())
    changes.name = values.name.trim();
  const region = nullableText(values.region);
  if (region !== nullableText(original.region ?? '')) changes.region = region;
  if (values.vehicleRegistrationEnabled !== original.vehicleRegistrationEnabled)
    changes.vehicleRegistrationEnabled = values.vehicleRegistrationEnabled;
  if (values.isActive !== original.isActive) changes.isActive = values.isActive;
  return Object.keys(changes).length ? changes : null;
}
