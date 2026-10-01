import { ApiRequestError } from '../../core/api/api-error';
import type { AdminReportErrors, AdminReportQuery } from './admin-reports.types';

export const REPORT_MAX_DAYS = 62;
export const REPORT_MAX_BYTES = 16 * 1024 * 1024;
export const REPORT_CONTENT_TYPE =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

export function isAdminReportDate(value: unknown): value is string {
  if (
    typeof value !== 'string' ||
    !/^(?:19\d{2}|20\d{2}|2100)-\d{2}-\d{2}$/.test(value)
  )
    return false;
  const date = new Date(`${value}T00:00:00.000Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

export function isAdminReportPropertyId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function validateAdminReportQuery(
  query: AdminReportQuery,
): AdminReportErrors {
  const errors: AdminReportErrors = {};
  if (!isAdminReportDate(query?.from))
    errors.from =
      '시작일은 1900~2100년의 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (!isAdminReportDate(query?.to))
    errors.to =
      '종료일은 1900~2100년의 올바른 YYYY-MM-DD 날짜로 입력해 주세요.';
  if (query?.propertyId !== undefined && !isAdminReportPropertyId(query.propertyId))
    errors.propertyId = '보고서를 받을 휴양소를 다시 선택해 주세요.';
  if (!errors.from && !errors.to) {
    const days =
      (Date.parse(`${query.to}T00:00:00.000Z`) -
        Date.parse(`${query.from}T00:00:00.000Z`)) /
        86_400_000 +
      1;
    if (days < 1) errors.to = '종료일은 시작일과 같거나 이후여야 합니다.';
    else if (days > REPORT_MAX_DAYS)
      errors.to = '보고서 기간은 시작일과 종료일을 포함해 최대 62일입니다.';
  }
  return errors;
}

export function prepareAdminReportQuery(query: AdminReportQuery): AdminReportQuery {
  const errors = validateAdminReportQuery(query);
  if (Object.keys(errors).length)
    throw new ApiRequestError(
      '보고서 기간과 휴양소를 확인해 주세요.',
      400,
      'INVALID_REPORT_QUERY',
      Object.entries(errors).map(([field, message]) => ({
        field,
        messages: [message],
      })),
    );
  // Snapshot only the supported fields before awaiting the download.
  return {
    from: query.from,
    to: query.to,
    ...(query.propertyId === undefined
      ? {}
      : { propertyId: query.propertyId.toLowerCase() }),
  };
}

export function invalidAdminReportResponse(): ApiRequestError {
  return new ApiRequestError(
    '엑셀 보고서 파일을 확인할 수 없습니다. 조건을 확인한 뒤 다시 요청해 주세요.',
    200,
    'INVALID_REPORT_RESPONSE',
  );
}
