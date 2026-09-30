import { useEffect, useId, useRef, useState } from 'react';
import type { AdminStayLinkIssue } from '../../../../features/admin-stay-links/admin-stay-link.types';
import { Button } from '../../../../shared/ui/Button/Button';

export function StayLinkReceipt({ receipt }: { receipt: AdminStayLinkIssue }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const mounted = useRef(false);
  const locked = useRef(false);
  const [copying, setCopying] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    mounted.current = true;
    return () => { mounted.current = false; };
  }, []);

  async function copy() {
    if (locked.current || !receipt.expiresAt || Date.parse(receipt.expiresAt) <= Date.now()) return;
    locked.current = true;
    setCopying(true);
    try {
      await navigator.clipboard.writeText(receipt.url);
      if (mounted.current) setMessage('링크를 복사했습니다. 해당 이용객에게만 전달해 주세요.');
    } catch {
      if (mounted.current) {
        input.current?.focus();
        input.current?.select();
        setMessage('자동 복사가 되지 않았습니다. 선택된 링크를 직접 복사해 주세요.');
      }
    } finally {
      locked.current = false;
      if (mounted.current) setCopying(false);
    }
  }

  return (
    <div className="stay-link__receipt">
      <strong>지금 링크를 보관해 주세요</strong>
      <p>이 화면을 나가거나 전체 새로고침하면 주소를 다시 볼 수 없습니다. 주소를 잃어버리면 새 링크로 교체해야 합니다.</p>
      <label htmlFor={id}>발급한 개인 이용 링크</label>
      <input id={id} ref={input} value={receipt.url} readOnly autoComplete="off"
        spellCheck={false} onFocus={(event) => event.currentTarget.select()} />
      <Button loading={copying} onClick={() => void copy()}>링크 복사</Button>
      <p>이 주소를 가진 사람은 해당 이용 일정에 접근할 수 있습니다. 해당 이용객에게만 전달해 주세요.</p>
      {message && <p role="status">{message}</p>}
    </div>
  );
}
