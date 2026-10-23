export type AdminReportMode = 'summary' | 'preservation' | 'archive';

export interface AdminReportQuery {
  from: string;
  to: string;
  propertyId?: string;
  mode?: AdminReportMode;
}

export type AdminReportErrors = Partial<
  Record<'from' | 'to' | 'propertyId' | 'mode', string>
>;

export interface AdminReportDownload {
  blob: Blob;
  filename: string;
  photos?: ArchivePhotoCounts;
}

export interface ArchivePhotoCounts {
  total: number;
  included: number;
  skipped: number;
}
