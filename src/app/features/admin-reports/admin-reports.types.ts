export interface AdminReportQuery {
  from: string;
  to: string;
  propertyId?: string;
}

export type AdminReportErrors = Partial<
  Record<'from' | 'to' | 'propertyId', string>
>;

export interface AdminReportDownload {
  blob: Blob;
  filename: string;
}
