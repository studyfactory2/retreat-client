import { Button } from '../../../../shared/ui/Button/Button';
import type { usePasswordEditor } from '../hooks/use-password-editor';
import { useAccountFormFocus } from '../hooks/use-account-form-focus';
import { AccountField } from './AccountField';

export function AccountPasswordForm({
  editor,
  profilePending,
  loginId,
}: {
  editor: ReturnType<typeof usePasswordEditor>;
  profilePending: boolean;
  loginId: string;
}) {
  const form = useAccountFormFocus(editor.focusRevision);
  const locked = editor.busy || editor.blocked;
  return (
    <form
      ref={form}
      className="account-card account-password-card"
      aria-labelledby="account-password-title"
      aria-busy={editor.busy}
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        void editor.save();
      }}
    >
      <header className="account-card__header">
        <div className="account-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <rect x="5" y="10" width="14" height="11" rx="2" />
            <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
          </svg>
        </div>
        <h2 id="account-password-title">비밀번호 변경</h2>
      </header>
      <input
        type="text"
        name="username"
        autoComplete="username"
        value={loginId}
        readOnly
        hidden
      />
      <div className="account-password-fields">
        <AccountField
          id="account-current-password"
          name="currentPassword"
          label="현재 비밀번호"
          type="password"
          autoComplete="current-password"
          required
          disabled={locked}
          value={editor.values.currentPassword}
          error={editor.errors.currentPassword}
          onChange={(event) =>
            editor.change('currentPassword', event.target.value)
          }
        />
        <AccountField
          id="account-new-password"
          name="newPassword"
          label="새 비밀번호"
          type="password"
          autoComplete="new-password"
          required
          hint="8자 이상 · 현재 비밀번호와 다르게"
          disabled={locked}
          value={editor.values.newPassword}
          error={editor.errors.newPassword}
          onChange={(event) => editor.change('newPassword', event.target.value)}
        />
        <AccountField
          id="account-confirm-password"
          name="confirmPassword"
          label="새 비밀번호 확인"
          type="password"
          autoComplete="new-password"
          required
          disabled={locked}
          value={editor.values.confirmPassword}
          error={editor.errors.confirmPassword}
          onChange={(event) =>
            editor.change('confirmPassword', event.target.value)
          }
        />
      </div>
      {profilePending && (
        <p className="account-field__hint" role="status">
          내 정보 변경을 먼저 저장하거나 취소해 주세요.
        </p>
      )}
      {editor.error && (
        <div
          className="account-notice account-notice--error"
          role="alert"
          tabIndex={-1}
        >
          <p>{editor.error}</p>
          {editor.blocked && (
            <Button onClick={editor.signInAgain}>로그인하여 확인</Button>
          )}
        </div>
      )}
      <footer className="account-password-footer">
        <p className="account-password-note">
          변경 시 모든 기기에서 로그아웃됩니다.
        </p>
        <div className="account-card__actions account-password-actions">
          <Button
            className="admin-button-secondary"
            disabled={locked || !editor.dirty}
            onClick={editor.reset}
          >
            초기화
          </Button>
          <Button
            type="submit"
            disabled={editor.blocked || profilePending}
            loading={editor.busy}
          >
            {editor.busy ? '변경 중' : '비밀번호 변경'}
          </Button>
        </div>
      </footer>
    </form>
  );
}
