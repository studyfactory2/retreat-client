import { ApiRequestError } from '../../core/api/api-error';

export const GUIDE_PDF_MAX_BYTES = 10 * 1024 * 1024;
export interface GuidePdfMetadata {
  filename: string;
  sizeBytes: number;
}

export function readGuidePdfMetadata(
  value: unknown,
  invalid: () => Error,
): GuidePdfMetadata {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    throw invalid();
  const pdf = value as Record<string, unknown>;
  if (
    typeof pdf.filename !== 'string' ||
    !pdf.filename.trim() ||
    [...pdf.filename].length > 255 ||
    /[\r\n\0/\\]/.test(pdf.filename) ||
    !pdf.filename.toLowerCase().endsWith('.pdf') ||
    typeof pdf.sizeBytes !== 'number' ||
    !Number.isSafeInteger(pdf.sizeBytes) ||
    pdf.sizeBytes < 5 ||
    pdf.sizeBytes > GUIDE_PDF_MAX_BYTES
  )
    throw invalid();
  return { filename: pdf.filename, sizeBytes: pdf.sizeBytes };
}

export function guidePdfSize(bytes: number): string {
  return bytes >= 1024 * 1024
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : `${Math.max(1, Math.ceil(bytes / 1024))} KB`;
}

export async function validateGuidePdfBlob(blob: Blob): Promise<Blob> {
  if (
    blob.size < 5 ||
    blob.size > GUIDE_PDF_MAX_BYTES ||
    (blob.type &&
      blob.type.toLowerCase().split(';')[0] !== 'application/pdf') ||
    (await blob.slice(0, 5).text()) !== '%PDF-'
  ) {
    throw new ApiRequestError(
      'PDF 파일을 확인해 주세요. PDF 형식, 최대 10 MB까지 가능합니다.',
      400,
      'INVALID_GUIDE_PDF',
    );
  }
  return blob.type === 'application/pdf'
    ? blob
    : new Blob([blob], { type: 'application/pdf' });
}

export function requireGuidePdfVersion(version: number): number {
  if (!Number.isInteger(version) || version < 1 || version > 2_147_483_647) {
    throw new ApiRequestError(
      '최신 이용 안내를 다시 불러와 주세요.',
      400,
      'INVALID_GUIDE_VERSION',
    );
  }
  return version;
}
