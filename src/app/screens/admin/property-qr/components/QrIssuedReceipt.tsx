import { useEffect, useId, useRef, useState } from 'react';
import type { QrIssue } from '../../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useQrImage } from '../hooks/use-qr-image';
import { qrImageFilename } from '../model/qr-image';
import '../styles/qr-receipt.css';

export function QrIssuedReceipt({
  issue,
  propertyName,
}: {
  issue: QrIssue;
  propertyName: string;
}) {
  const { image, failed, retry } = useQrImage(issue, propertyName);
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const active = useRef(false);
  const copyLock = useRef(false);
  const [message, setMessage] = useState('');
  const [copying, setCopying] = useState(false);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);

  async function copy() {
    if (copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(issue.url);
      if (active.current)
        setMessage('링크를 복사했습니다. 안전한 곳에 보관해 주세요.');
    } catch {
      if (active.current) {
        input.current?.focus();
        input.current?.select();
        setMessage(
          '자동 복사가 되지 않았습니다. 선택된 링크를 직접 복사해 주세요.',
        );
      }
    } finally {
      copyLock.current = false;
      if (active.current) setCopying(false);
    }
  }

  return (
    <section className="property-qr-receipt" aria-label="방금 발급한 QR 보관">
      <div className="property-qr-receipt__notice">
        <strong>지금 QR을 보관해 주세요</strong>
        <p>
          이 화면을 나가거나 새로고침하면 발급한 링크를 다시 볼 수 없습니다.
          링크를 복사하거나 QR 이미지를 저장해 주세요.
        </p>
      </div>
      <div className="property-qr-receipt__image">
        {image ? (
          <img
            src={image}
            alt={`${propertyName} ${issue.flow === 'GUEST' ? '이용객용' : '직원용'} QR`}
          />
        ) : failed ? (
          <div role="alert">
            <p>
              QR 이미지를 만들지 못했습니다. 링크는 아래에서 복사할 수 있습니다.
            </p>
            <Button className="admin-button-secondary" onClick={retry}>
              이미지 다시 만들기
            </Button>
          </div>
        ) : (
          <p role="status">QR 이미지를 만드는 중입니다.</p>
        )}
      </div>
      <label className="property-qr-receipt__label" htmlFor={id}>
        발급한 링크
      </label>
      <input
        id={id}
        ref={input}
        className="property-qr-receipt__link"
        value={issue.url}
        readOnly
        autoComplete="off"
        spellCheck={false}
        onFocus={(event) => event.currentTarget.select()}
      />
      <div className="property-qr-receipt__actions">
        <Button onClick={() => void copy()} loading={copying}>
          링크 복사
        </Button>
        {image && (
          <a
            className="ui-button admin-button-secondary"
            href={image}
            download={qrImageFilename(issue)}
            onClick={() =>
              setMessage(
                '이미지 저장을 요청했습니다. 다운로드한 PNG 파일을 열어 인쇄할 수 있습니다.',
              )
            }
          >
            QR 이미지 저장
          </a>
        )}
      </div>
      <p className="property-qr-receipt__help">
        저장한 PNG 파일을 열어 인쇄할 수 있습니다.{' '}
        {issue.flow === 'STAFF'
          ? '직원용 QR은 담당 직원에게만 전달해 주세요.'
          : '이용객이 확인할 수 있는 곳에 부착해 주세요.'}
      </p>
      {message && (
        <p className="property-qr-receipt__feedback" role="status">
          {message}
        </p>
      )}
    </section>
  );
}
