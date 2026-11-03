import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { revealPropertyAccessCode } from '../../../../features/admin-property-access/admin-property-access-api';
import type {
  AccessCodeField as FieldName,
  AccessCodeKind,
} from '../../../../features/admin-property-access/admin-property-access.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { codeLabels, type CodeEdit } from '../model/property-access-model';

type Props = {
  field: FieldName;
  kind: AccessCodeKind;
  propertyId: string;
  version: number;
  token: string;
  saved: boolean;
  edit: CodeEdit;
  onChange: (edit: CodeEdit) => void;
  rejectSession: (token: string) => void;
  onConflict: () => void;
  disabled: boolean;
  readOnly?: boolean;
  error?: string;
};

export function AccessCodeField({
  field,
  kind,
  propertyId,
  version,
  token,
  saved,
  edit,
  onChange,
  rejectSession,
  onConflict,
  disabled,
  readOnly = false,
  error,
}: Props) {
  const [revealed, setRevealed] = useState<string | null>(null);
  const [inputVisible, setInputVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const request = useRef<AbortController | null>(null);
  const mounted = useRef(false);
  const id = `access-${field}`;
  const editing =
    edit.action === 'replace' || (!saved && edit.action !== 'clear');
  const label = codeLabels[field];

  useLayoutEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
      request.current?.abort();
      request.current = null;
    };
  }, []);

  function conceal() {
    request.current?.abort();
    request.current = null;
    setRevealed(null);
    setInputVisible(false);
    setBusy(false);
  }
  useEffect(() => {
    const hide = () => {
      if (document.visibilityState === 'hidden') conceal();
    };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  useEffect(() => {
    if (!revealed && !inputVisible) return;
    const timeout = window.setTimeout(conceal, 30_000);
    return () => window.clearTimeout(timeout);
  }, [revealed, inputVisible]);
  useLayoutEffect(() => {
    if (disabled) {
      // Hide visible secrets before painting a review/blocked editor.
      // oxlint-disable-next-line react/set-state-in-effect -- confidentiality boundary, not derived display state.
      conceal();
    }
  }, [disabled]);

  function change(next: CodeEdit) {
    if (disabled || readOnly) return;
    conceal();
    setMessage('');
    onChange(next);
  }
  async function reveal() {
    if (disabled || request.current || !saved || edit.action !== 'keep') return;
    if (revealed) {
      conceal();
      return;
    }
    const controller = new AbortController();
    request.current = controller;
    setBusy(true);
    setMessage('');
    const current = () =>
      mounted.current &&
      request.current === controller &&
      !controller.signal.aborted &&
      document.visibilityState !== 'hidden';
    try {
      const result = await revealPropertyAccessCode(
        propertyId,
        kind,
        version,
        token,
        controller.signal,
      );
      if (current()) setRevealed(result.code);
    } catch (error) {
      if (!current()) return;
      if (
        error instanceof ApiRequestError &&
        [401, 403].includes(error.status ?? 0)
      ) {
        rejectSession(token);
        return;
      }
      if (
        error instanceof ApiRequestError &&
        [404, 409].includes(error.status ?? 0)
      ) {
        onConflict();
        return;
      }
      setMessage('비밀번호를 확인하지 못했습니다. 잠시 후 다시 시도해 주세요.');
    } finally {
      if (request.current === controller) {
        request.current = null;
        if (mounted.current) setBusy(false);
      }
    }
  }

  return (
    <div className="access-code-field" id={`${id}-field`} tabIndex={-1}>
      <div className="access-code-field__label">
        <label htmlFor={editing ? id : undefined} id={`${id}-label`}>
          {label}
        </label>
        <span
          className={`access-code-field__status${edit.action !== 'keep' ? ' access-code-field__status--changed' : ''}`}
        >
          {edit.action === 'clear'
            ? '삭제 예정'
            : edit.action === 'replace'
              ? '변경 중'
              : saved
                ? '저장됨'
                : '미등록'}
        </span>
      </div>
      {edit.action === 'clear' ? (
        <div className="access-code-field__stored">
          <span>저장 시 삭제됩니다.</span>
          <Button
            className="access-text-button"
            disabled={disabled || readOnly}
            onClick={() => change({ action: 'keep', value: '' })}
          >
            되돌리기
          </Button>
        </div>
      ) : editing ? (
        <>
          <div className="access-code-field__input">
            <input
              id={id}
              name={`property-${field}`}
              type={inputVisible ? 'text' : 'password'}
              autoComplete="off"
              autoCapitalize="off"
              spellCheck={false}
              inputMode="text"
              maxLength={32}
              value={edit.value}
              disabled={disabled || readOnly}
              placeholder="비밀번호 입력"
              aria-invalid={!!error}
              aria-describedby={`${id}-hint${error ? ` ${id}-error` : ''}`}
              onChange={(event) => {
                if (disabled || readOnly) return;
                setMessage('');
                onChange({
                  action: !saved && !event.target.value ? 'keep' : 'replace',
                  value: event.target.value,
                });
              }}
            />
            <button
              type="button"
              aria-label={`${label} ${inputVisible ? '숨기기' : '보기'}`}
              aria-pressed={inputVisible}
              disabled={disabled || readOnly}
              onClick={() => setInputVisible((value) => !value)}
            >
              {inputVisible ? '숨김' : '보기'}
            </button>
          </div>
          <div className="access-code-field__hint">
            <span id={`${id}-hint`}>숫자 · * · #, 최대 32자</span>
            {saved && (
              <Button
                className="access-text-button"
                disabled={disabled || readOnly}
                onClick={() => change({ action: 'keep', value: '' })}
              >
                변경 취소
              </Button>
            )}
          </div>
        </>
      ) : (
        <>
          <div className="access-code-field__stored">
            <span
              className="access-code-field__value"
              aria-labelledby={`${id}-label`}
              aria-label={revealed ? undefined : '저장된 비밀번호 숨김'}
            >
              {revealed ?? '••••••••'}
            </span>
            <Button
              className="access-text-button"
              disabled={disabled || busy}
              loading={busy}
              aria-label={`${label} ${revealed ? '숨기기' : '보기'}`}
              onClick={() => void reveal()}
            >
              {revealed ? '숨기기' : '보기'}
            </Button>
          </div>
          <div className="access-code-field__tools">
            <span>
              {revealed
                ? '30초 후 자동으로 숨깁니다.'
                : '필요할 때만 확인하세요.'}
            </span>
            <div>
              <Button
                className="access-text-button"
                disabled={disabled || readOnly}
                onClick={() => {
                  change({ action: 'replace', value: '' });
                  requestAnimationFrame(() =>
                    document.getElementById(id)?.focus(),
                  );
                }}
              >
                변경
              </Button>
              <Button
                className="access-text-button access-text-button--danger"
                disabled={disabled || readOnly}
                onClick={() => change({ action: 'clear', value: '' })}
              >
                삭제
              </Button>
            </div>
          </div>
        </>
      )}
      {error && (
        <p className="access-field-error" id={`${id}-error`} role="alert">
          {error}
        </p>
      )}
      {message && (
        <p className="access-field-error" role="alert">
          {message}
        </p>
      )}
    </div>
  );
}
