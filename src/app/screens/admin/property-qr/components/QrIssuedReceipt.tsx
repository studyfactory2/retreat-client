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
  const [showLink, setShowLink] = useState(false);
  const [copyAttempt, setCopyAttempt] = useState(0);
  useEffect(() => {
    active.current = true;
    return () => {
      active.current = false;
    };
  }, []);
  useEffect(() => {
    if (showLink && copyAttempt > 0) {
      input.current?.focus();
      input.current?.select();
    }
  }, [showLink, copyAttempt]);

  async function copy() {
    if (copyLock.current) return;
    copyLock.current = true;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(issue.url);
      if (active.current) setMessage('링크를 복사했습니다.');
    } catch {
      if (active.current) {
        setShowLink(true);
        setCopyAttempt((value) => value + 1);
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
    <div className="property-qr-receipt">
      {!issue.canReopen && (
        <p className="property-qr-receipt__legacy" role="status">
          이 주소는 다시 열 수 없습니다. 닫기 전에 링크를 복사하거나 QR을 저장해
          주세요.
        </p>
      )}
      <div className="property-qr-receipt__image">
        {image ? (
          <img
            src={image}
            alt={`${propertyName} ${issue.flow === 'GUEST' ? '이용객용' : '직원용'} QR`}
          />
        ) : failed ? (
          <div role="alert">
            <p>QR 이미지를 만들지 못했습니다.</p>
            <Button className="admin-button-secondary" onClick={retry}>
              다시 만들기
            </Button>
          </div>
        ) : (
          <p role="status">QR 이미지 준비 중…</p>
        )}
      </div>
      <div className="property-qr-receipt__controls">
        <div className="property-qr-receipt__actions">
          <Button onClick={() => void copy()} loading={copying}>
            링크 복사
          </Button>
          {image ? (
            <a
              className="ui-button admin-button-secondary"
              href={image}
              download={qrImageFilename(issue)}
              onClick={() =>
                setMessage(
                  '다운로드를 요청했습니다. 저장된 PNG를 확인해 주세요.',
                )
              }
            >
              QR 저장
            </a>
          ) : (
            <Button className="admin-button-secondary" disabled>
              QR 저장
            </Button>
          )}
        </div>
        <div className="property-qr-receipt__secondary">
          <a href={issue.url} target="_blank" rel="noopener noreferrer">
            이용 화면 열기 ↗
          </a>
          <button
            type="button"
            aria-expanded={showLink}
            aria-controls={id}
            onClick={() => setShowLink((value) => !value)}
          >
            {showLink ? '주소 숨기기' : '주소 보기'}
          </button>
        </div>
        {showLink && (
          <div>
            <label className="property-qr-receipt__label" htmlFor={id}>
              QR 링크
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
          </div>
        )}
        <p className="property-qr-receipt__help">
          {issue.flow === 'STAFF'
            ? '직원 QR은 담당 직원에게만 전달해 주세요.'
            : 'QR 이미지를 저장해 인쇄할 수 있습니다.'}
        </p>
        {message && (
          <p className="property-qr-receipt__feedback" role="status">
            {message}
          </p>
        )}
      </div>
    </div>
  );
}
