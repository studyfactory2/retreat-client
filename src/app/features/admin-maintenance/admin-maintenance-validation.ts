import type { AdminMaintenanceInput } from './admin-maintenance.types';

export type MaintenanceFilterErrors = Partial<
  Record<'propertyId' | 'from' | 'to' | 'dateField' | 'view', string>
>;

export function isMaintenanceId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

function isMaintenanceDate(value: string): boolean {
  if (!/^(?:19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function validateMaintenanceFilters(
  input: AdminMaintenanceInput,
): MaintenanceFilterErrors {
  const errors: MaintenanceFilterErrors = {};
  if (input.propertyId !== undefined && !isMaintenanceId(input.propertyId))
    errors.propertyId = '조회할 휴양소를 다시 선택해 주세요.';
  if (input.dateField !== 'STARTED' && input.dateField !== 'SUBMITTED')
    errors.dateField = '날짜 기준을 다시 선택해 주세요.';
  if (!['ALL', 'UNFINISHED', 'COMPLETED'].includes(input.view))
    errors.view = '조회할 기록을 다시 선택해 주세요.';
  if (input.dateField === 'SUBMITTED' && input.view === 'UNFINISHED')
    errors.dateField = '미완료 기록은 시작일 기준으로 조회해 주세요.';
  if (input.from !== undefined && !isMaintenanceDate(input.from))
    errors.from =
      '시작일은 1900~2100년의 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (input.to !== undefined && !isMaintenanceDate(input.to))
    errors.to =
      '종료일은 1900~2100년의 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (input.from !== undefined && input.to === undefined)
    errors.to = '시작일과 종료일을 함께 입력해 주세요.';
  if (input.to !== undefined && input.from === undefined)
    errors.from = '시작일과 종료일을 함께 입력해 주세요.';
  if (
    !errors.from &&
    !errors.to &&
    input.from !== undefined &&
    input.to !== undefined
  ) {
    const days =
      (Date.parse(`${input.to}T00:00:00.000Z`) -
        Date.parse(`${input.from}T00:00:00.000Z`)) /
        86_400_000 +
      1;
    if (days < 1) errors.to = '종료일은 시작일과 같거나 이후여야 합니다.';
    else if (days > 62)
      errors.to = '조회 기간은 시작일과 종료일을 포함해 최대 62일입니다.';
  }
  return errors;
}
