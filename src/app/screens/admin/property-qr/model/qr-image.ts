import type { QrIssue } from '../../../../features/admin-property-qr/admin-property-qr.types';

export function qrImageFilename(issue: QrIssue): string {
  return `retreat-${issue.propertyId}-${issue.flow.toLowerCase()}-qr-${issue.rotatedAt.replace(/[:.]/g, '-')}.png`;
}

function wrapLabel(context: CanvasRenderingContext2D, text: string): string[] {
  const lines: string[] = [];
  let line = '';
  for (const character of text) {
    if (line && context.measureText(line + character).width > 880) {
      lines.push(line);
      line = '';
    }
    line += character;
  }
  if (line) lines.push(line);
  return lines;
}

// The credential stays inside this browser; no remote image service is used.
export async function createQrImage(
  issue: QrIssue,
  propertyName: string,
): Promise<string> {
  const { toCanvas } = await import('qrcode');
  const qr = document.createElement('canvas');
  await toCanvas(qr, issue.url, {
    errorCorrectionLevel: 'M',
    margin: 4,
    width: 1024,
    color: { dark: '#102344ff', light: '#ffffffff' },
  });
  const poster = document.createElement('canvas');
  const context = poster.getContext('2d');
  if (!context) throw new Error('QR image is unavailable.');
  context.font = '600 40px sans-serif';
  const lines = wrapLabel(context, propertyName);
  const headingHeight = 126 + lines.length * 52;
  poster.width = 1024;
  poster.height = headingHeight + 1024 + 72;
  context.fillStyle = '#ffffff';
  context.fillRect(0, 0, poster.width, poster.height);
  context.textAlign = 'center';
  context.fillStyle = '#132448';
  context.font = '600 40px sans-serif';
  lines.forEach((line, index) => context.fillText(line, 512, 66 + index * 52));
  context.font = '700 44px sans-serif';
  context.fillText(
    issue.flow === 'GUEST' ? '이용객용 QR' : '직원용 QR',
    512,
    headingHeight - 22,
  );
  context.drawImage(qr, 0, headingHeight);
  context.font = '24px sans-serif';
  context.fillStyle = '#536178';
  context.fillText('OH BOK · RETREAT', 512, poster.height - 30);
  return poster.toDataURL('image/png');
}
