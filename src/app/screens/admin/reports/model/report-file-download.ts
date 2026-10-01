// Keep the object URL alive after clicking: the browser may consume it after
// the current task, and the screen may unmount while the download begins.
const DOWNLOAD_URL_LIFETIME_MS = 60_000;

export function requestReportFileDownload(blob: Blob, filename: string): void {
  const anchor = document.createElement('a');
  const url = URL.createObjectURL(blob);
  try {
    anchor.href = url;
    anchor.download = filename;
    anchor.hidden = true;
    document.body.append(anchor);
    anchor.click();
  } catch (error: unknown) {
    URL.revokeObjectURL(url);
    throw error;
  } finally {
    anchor.remove();
  }
  setTimeout(() => URL.revokeObjectURL(url), DOWNLOAD_URL_LIFETIME_MS);
}
