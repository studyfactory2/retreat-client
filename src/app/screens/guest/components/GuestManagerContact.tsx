import { publicContactTel } from '../../../features/property-contact/public-contact';
import '../styles/guest-manager-contact.css';

export function GuestManagerContact({
  phone,
  disabled = false,
}: {
  phone: string | null;
  disabled?: boolean;
}) {
  const href = publicContactTel(phone);
  const content = (
    <>
      <span className="guest-manager-contact__icon" aria-hidden="true">
        <svg viewBox="0 0 24 24" fill="none">
          <path d="m8 3 3 5-3 3a14 14 0 0 0 5 5l3-3 5 3v3a2 2 0 0 1-2 2A18 18 0 0 1 3 5a2 2 0 0 1 2-2h3Z" />
        </svg>
      </span>
      <span className="guest-manager-contact__text">
        <strong>관리자에게 연락</strong>
        <span>{href ? phone : '등록된 연락처가 없습니다.'}</span>
      </span>
      {href && <small>{disabled ? '확인 중' : '전화 앱 열기'}</small>}
    </>
  );
  return href && !disabled ? (
    <a
      className="guest-manager-contact"
      href={href}
      referrerPolicy="no-referrer"
      aria-label={`관리자에게 연락 · ${phone} · 전화 앱 열기`}
    >
      {content}
    </a>
  ) : (
    <div className="guest-manager-contact guest-manager-contact--unavailable">
      {content}
    </div>
  );
}
