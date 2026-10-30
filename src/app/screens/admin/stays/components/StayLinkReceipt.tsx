import { useEffect, useId, useRef, useState } from 'react';
import type { AdminStayLinkIssue } from '../../../../features/admin-stay-links/admin-stay-link.types';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStayLinkQr } from '../hooks/use-stay-link-qr';
import { formatStayLinkTimestamp } from '../model/stay-link-model';
import { stayLinkQrFilename } from '../model/stay-link-qr';

export function StayLinkReceipt({
  receipt,
  stay,
  onClose,
}: {
  receipt: AdminStayLinkIssue;
  stay: AdminStayDto;
  onClose: () => void;
}) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const heading = useRef<HTMLHeadingElement>(null);
  const mounted = useRef(false);
  const locked = useRef(false);
  const [copying, setCopying] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState('');
  const qr = useStayLinkQr(receipt, stay.property.name);
  useEffect(() => {
    mounted.current = true;
    heading.current?.focus({ preventScroll: true });
    return () => {
      mounted.current = false;
    };
  }, []);

  function isValid() {
    return (
      receipt.enabled &&
      receipt.expiresAt !== null &&
      Date.parse(receipt.expiresAt) > Date.now()
    );
  }

  function selectLink() {
    setRevealed(true);
    requestAnimationFrame(() => {
      if (!mounted.current) return;
      input.current?.focus();
      input.current?.select();
    });
  }

  async function copy() {
    if (locked.current || !isValid()) return;
    locked.current = true;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(receipt.url);
      if (mounted.current) setMessage('링크를 복사했습니다.');
    } catch {
      if (mounted.current) {
        selectLink();
        setMessage('선택된 링크를 직접 복사해 주세요.');
      }
    } finally {
      locked.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  return (
    <section className="stay-link__receipt" aria-labelledby={`${id}-title`}>
      <div className="stay-link__receipt-heading">
        <h3 id={`${id}-title`} ref={heading} tabIndex={-1}>
          개인 이용 QR · 링크
        </h3>
        {receipt.canReopen && (
          <Button className="admin-button-secondary" onClick={onClose}>
            닫기
          </Button>
        )}
      </div>
      <div className="stay-link__share-layout">
        <div className="stay-link__qr-frame">
          {qr.image ? (
            <img src={qr.image} alt={`${stay.property.name} 개인 이용 QR`} />
          ) : qr.failed ? (
            <div role="alert">
              <p>QR을 만들지 못했습니다.</p>
              <Button className="admin-button-secondary" onClick={qr.retry}>
                다시 만들기
              </Button>
            </div>
          ) : (
            <p role="status">QR 준비 중…</p>
          )}
        </div>
        <div className="stay-link__share-content">
          <div className="stay-link__recipient">
            <strong>{stay.guestName}</strong>
            <span>{stay.property.name}</span>
          </div>
          <dl className="stay-link__schedule">
            <div>
              <dt>입실 예정</dt>
              <dd>{formatStayLinkTimestamp(stay.checkInAt)}</dd>
            </div>
            <div>
              <dt>퇴실 예정</dt>
              <dd>{formatStayLinkTimestamp(stay.checkOutAt)}</dd>
            </div>
          </dl>
          <div className="stay-link__share-actions">
            <Button loading={copying} onClick={() => void copy()}>
              링크 복사
            </Button>
            {qr.image ? (
              <a
                className="ui-button admin-button-secondary"
                href={qr.image}
                download={stayLinkQrFilename(receipt)}
                onClick={(event) => {
                  if (!isValid()) event.preventDefault();
                }}
              >
                QR 저장
              </a>
            ) : (
              <Button className="admin-button-secondary" disabled>
                QR 저장
              </Button>
            )}
          </div>
          <div className="stay-link__text-actions">
            <a
              href={receipt.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(event) => {
                if (!isValid()) event.preventDefault();
              }}
            >
              이용 화면 열기 ↗
            </a>
            <button
              type="button"
              aria-expanded={revealed}
              aria-controls={`${id}-address`}
              onClick={() => (revealed ? setRevealed(false) : selectLink())}
            >
              {revealed ? '주소 숨기기' : '주소 보기'}
            </button>
          </div>
          {revealed && (
            <div id={`${id}-address`} className="stay-link__address">
              <label htmlFor={id}>개인 이용 링크</label>
              <input
                id={id}
                ref={input}
                value={receipt.url}
                readOnly
                autoComplete="off"
                spellCheck={false}
                onFocus={(event) => event.currentTarget.select()}
              />
            </div>
          )}
          <p className="stay-link__privacy">해당 이용객에게만 전달해 주세요.</p>
          {!receipt.canReopen && (
            <p className="stay-link__legacy">
              이 링크는 다시 조회할 수 없습니다. 닫기 전에 보관해 주세요.
            </p>
          )}
          {message && (
            <p role="status" className="stay-link__copy-status">
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
