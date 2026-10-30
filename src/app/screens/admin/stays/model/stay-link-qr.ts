import { APP_BRAND } from '../../../../core/config/brand';
import type { AdminStayLinkIssue } from '../../../../features/admin-stay-links/admin-stay-link.types';

export function stayLinkQrFilename(receipt: AdminStayLinkIssue): string {
  return `retreat-stay-${receipt.stayId}-personal-qr-v${receipt.version}.png`;
}

// Encode locally. The private URL is never sent to an image service.
export async function createStayLinkQr(
  receipt: AdminStayLinkIssue,
  propertyName: string,
): Promise<string> {
  const { toCanvas } = await import('qrcode');
  const qr = document.createElement('canvas');
  await toCanvas(qr, receipt.url, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 1024,
    color: { dark: '#102344ff', light: '#ffffffff' },
  });
  const poster = document.createElement('canvas');
  const context = poster.getContext('2d');
  if (!context) throw new Error('QR image is unavailable.');
  context.font = '600 38px sans-serif';
  const lines: string[] = [];
  let line = '';
  for (const character of propertyName) {
    if (line && context.measureText(line + character).width > 880) {
      lines.push(line);
      line = '';
    }
    line += character;
  }
  if (line) lines.push(line);
  const headingHeight = 118 + lines.length * 48;
  poster.width = 1024;
  poster.height = headingHeight + 1024 + 78;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, poster.width, poster.height);
  context.textAlign = 'center';
  context.fillStyle = '#132448';
  context.font = '600 38px sans-serif';
  lines.forEach((value, index) =>
    context.fillText(value, 512, 58 + index * 48),
  );
  context.font = '700 42px sans-serif';
  context.fillText('개인 이용 QR', 512, headingHeight - 20);
  context.drawImage(qr, 0, headingHeight);
  context.font = '24px sans-serif';
  context.fillStyle = '#536178';
  context.fillText(APP_BRAND.appName, 512, poster.height - 30);
  return poster.toDataURL('image/png');
}
