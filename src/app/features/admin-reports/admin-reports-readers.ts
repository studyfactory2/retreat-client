import {
  invalidAdminReportResponse,
  invalidArchiveResponse,
  ARCHIVE_CONTENT_TYPE,
  ARCHIVE_MAX_BYTES,
  ARCHIVE_MAX_PHOTOS,
  REPORT_CONTENT_TYPE,
  REPORT_MAX_BYTES,
} from './admin-reports-validation';
import type { ArchivePhotoCounts } from './admin-reports.types';

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

export async function readAdminArchive(response: {
  blob: Blob;
  headers: Headers;
}): Promise<{ blob: Blob; photos: ArchivePhotoCounts }> {
  const { blob, headers } = response;
  if (
    !(blob instanceof Blob) ||
    blob.type !== ARCHIVE_CONTENT_TYPE ||
    blob.size < 22 ||
    blob.size > ARCHIVE_MAX_BYTES
  )
    throw invalidArchiveResponse();
  const count = (name: string) => {
    const value = headers.get(name);
    if (value === null || !/^(?:0|[1-9]\d*)$/.test(value))
      throw invalidArchiveResponse();
    const parsed = Number(value);
    if (!Number.isSafeInteger(parsed) || parsed > ARCHIVE_MAX_PHOTOS)
      throw invalidArchiveResponse();
    return parsed;
  };
  const photos = {
    total: count('X-Archive-Photos-Total'),
    included: count('X-Archive-Photos-Included'),
    skipped: count('X-Archive-Photos-Skipped'),
  };
  if (photos.total !== photos.included + photos.skipped)
    throw invalidArchiveResponse();
  let header: Uint8Array;
  try {
    header = new Uint8Array(await blob.slice(0, 4).arrayBuffer());
  } catch {
    throw invalidArchiveResponse();
  }
  // Validate the container signature, not individual ZIP entries in the browser.
  // The server builds and verifies the package before exposing these counts.
  if (
    header[0] !== 0x50 ||
    header[1] !== 0x4b ||
    header[2] !== 0x03 ||
    header[3] !== 0x04
  )
    throw invalidArchiveResponse();
  return { blob, photos };
}
