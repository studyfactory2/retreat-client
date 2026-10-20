import { useState, type InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
};
export function AccountField({
  id,
  label,
  error,
  hint,
  type = 'text',
  required,
  ...input
}: Props) {
  const [visible, setVisible] = useState(false);
  const password = type === 'password';
  const description =
    [hint ? `${id}-hint` : '', error ? `${id}-error` : '']
      .filter(Boolean)
      .join(' ') || undefined;
  return (
    <div className="account-field">
      <label htmlFor={id}>
        {label}
        {required && (
          <span className="account-required" aria-hidden="true">
            {' '}
            *
          </span>
        )}
      </label>
      <div className={password ? 'account-field__password' : undefined}>
        <input
          {...input}
          id={id}
          type={password && visible ? 'text' : type}
          required={required}
          aria-invalid={!!error}
          aria-describedby={description}
        />
        {password && (
          <button
            type="button"
            className="account-field__visibility"
            disabled={input.disabled}
            aria-label={`${label} ${visible ? '숨기기' : '보기'}`}
            title={visible ? '비밀번호 숨기기' : '비밀번호 보기'}
            aria-controls={id}
            aria-pressed={visible}
            onClick={() => setVisible((value) => !value)}
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12Z" />
              <circle cx="12" cy="12" r="3" />
              {visible && <path d="m3 3 18 18" />}
            </svg>
          </button>
        )}
      </div>
      {hint && (
        <p id={`${id}-hint`} className="account-field__hint">
          {hint}
        </p>
      )}
      {error && (
        <p id={`${id}-error`} className="account-field__error">
          {error}
        </p>
      )}
    </div>
  );
}
