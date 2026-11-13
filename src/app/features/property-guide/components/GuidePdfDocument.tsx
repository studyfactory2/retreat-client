import { useEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../core/api/api-error';
import { Button } from '../../../shared/ui/Button/Button';
import {
  guidePdfSize,
  validateGuidePdfBlob,
  type GuidePdfMetadata,
} from '../guide-pdf';
import '../styles/guide-pdf.css';

type Props = {
  documentKey: string;
  pdf: GuidePdfMetadata;
  load: (signal: AbortSignal) => Promise<Blob>;
  onAccessDenied?: () => void;
  disabled?: boolean;
};

export function GuidePdfDocument(props: Props) {
  return <PdfDocument key={props.documentKey} {...props} />;
}

function PdfDocument({ pdf, load, onAccessDenied, disabled = false }: Props) {
  const [busy, setBusy] = useState<'open' | 'download' | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [readyUrl, setReadyUrl] = useState<string | null>(null);
  const request = useRef<AbortController | null>(null);
  const url = useRef<string | null>(null);
  const pendingTab = useRef<Window | null>(null);
  useEffect(
    () => () => {
      request.current?.abort();
      pendingTab.current?.close();
      if (url.current) URL.revokeObjectURL(url.current);
    },
    [],
  );

  async function open(mode: 'open' | 'download') {
    if (request.current || disabled) return;
    // Reserve the tab during the user gesture so mobile browsers do not block
    // opening a PDF after its authenticated fetch finishes. No token is in a URL.
    const tab = mode === 'open' ? window.open('about:blank', '_blank') : null;
    if (tab) {
      tab.opener = null;
      tab.document.title = 'PDF 불러오는 중';
      tab.document.body.textContent = 'PDF를 불러오는 중입니다…';
      pendingTab.current = tab;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(mode);
    setMessage(null);
    setReadyUrl(null);
    try {
      // Reauthorize each open/download; a previous fetch is not a permanent grant.
      const blob = await validateGuidePdfBlob(await load(controller.signal));
      if (controller.signal.aborted || request.current !== controller) return;
      if (url.current) URL.revokeObjectURL(url.current);
      const nextUrl = URL.createObjectURL(blob);
      url.current = nextUrl;
      if (mode === 'download') {
        const link = document.createElement('a');
        link.href = nextUrl;
        link.download = pdf.filename;
        link.rel = 'noopener noreferrer';
        document.body.append(link);
        link.click();
        link.remove();
      } else if (tab && !tab.closed) {
        tab.location.replace(nextUrl);
        pendingTab.current = null;
      } else {
        setReadyUrl(nextUrl);
      }
    } catch (error) {
      tab?.close();
      pendingTab.current = null;
      if (controller.signal.aborted || request.current !== controller) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        onAccessDenied?.();
      }
      setMessage(
        error instanceof ApiRequestError
          ? error.message
          : 'PDF를 불러오지 못했습니다. 다시 시도해 주세요.',
      );
    } finally {
      if (request.current === controller) {
        request.current = null;
        setBusy(null);
      }
    }
  }

  return (
    <section className="guide-pdf-document" aria-label="PDF 이용 안내">
      <div className="guide-pdf-document__file">
        <span className="guide-pdf-document__icon" aria-hidden="true">
          PDF
        </span>
        <div>
          <strong>{pdf.filename}</strong>
          <span>PDF · {guidePdfSize(pdf.sizeBytes)}</span>
        </div>
      </div>
      <div className="guide-pdf-document__actions">
        <Button
          type="button"
          onClick={() => void open('open')}
          loading={busy === 'open'}
          disabled={disabled || busy !== null}
        >
          PDF 보기
        </Button>
        <Button
          type="button"
          className="admin-button-secondary"
          onClick={() => void open('download')}
          loading={busy === 'download'}
          disabled={disabled || busy !== null}
        >
          다운로드
        </Button>
      </div>
      {readyUrl && (
        <a
          className="guide-pdf-document__ready"
          href={readyUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          준비된 PDF 열기 ↗
        </a>
      )}
      {message && (
        <p className="guide-pdf-document__error" role="alert">
          {message}
        </p>
      )}
    </section>
  );
}
