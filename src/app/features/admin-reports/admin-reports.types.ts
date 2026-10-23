export type AdminReportMode = 'summary' | 'preservation';

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
}
