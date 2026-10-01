import {
  invalidAdminReportResponse,
  REPORT_CONTENT_TYPE,
  REPORT_MAX_BYTES,
} from './admin-reports-validation';

export async function readAdminReportBlob(value: unknown): Promise<Blob> {
  if (
    !(value instanceof Blob) ||
    value.type !== REPORT_CONTENT_TYPE ||
    value.size === 0 ||
    value.size > REPORT_MAX_BYTES
  )
    throw invalidAdminReportResponse();

  let header: Uint8Array;
  try {
    header = new Uint8Array(await value.slice(0, 4).arrayBuffer());
  } catch {
    throw invalidAdminReportResponse();
  }
  // XLSX is a ZIP container. This checks its local-file header only; it does
  // not parse sheets or claim complete workbook/integrity validation.
  if (
    header.length !== 4 ||
    header[0] !== 0x50 ||
    header[1] !== 0x4b ||
    header[2] !== 0x03 ||
    header[3] !== 0x04
  )
    throw invalidAdminReportResponse();
  return value;
}
