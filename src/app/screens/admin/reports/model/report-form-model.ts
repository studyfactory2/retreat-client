import type {
  AdminReportErrors,
  AdminReportQuery,
} from '../../../../features/admin-reports/admin-reports.types';
import { validateAdminReportQuery } from '../../../../features/admin-reports/admin-reports-validation';

export interface ReportFormValues {
  from: string;
  to: string;
  propertyId: string;
}

const seoulMonth = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
});

export function getReportMonthRange(
  offset: 0 | -1,
  now: Date = new Date(),
): Pick<ReportFormValues, 'from' | 'to'> {
  const parts = seoulMonth.formatToParts(now);
  const year = Number(parts.find((part) => part.type === 'year')?.value);
  const month = Number(parts.find((part) => part.type === 'month')?.value);
  return {
    from: new Date(Date.UTC(year, month - 1 + offset, 1))
      .toISOString()
      .slice(0, 10),
    to: new Date(Date.UTC(year, month + offset, 0)).toISOString().slice(0, 10),
  };
}

export function createReportFormValues(now: Date = new Date()): ReportFormValues {
  return { ...getReportMonthRange(0, now), propertyId: '' };
}

export function toAdminReportQuery(values: ReportFormValues): AdminReportQuery {
  return {
    from: values.from,
    to: values.to,
    ...(values.propertyId === '' ? {} : { propertyId: values.propertyId }),
  };
}

export function validateReportForm(values: ReportFormValues): AdminReportErrors {
  return validateAdminReportQuery(toAdminReportQuery(values));
}

export function getReportFormScope(values: ReportFormValues): string {
  return JSON.stringify([values.from, values.to, values.propertyId]);
}
