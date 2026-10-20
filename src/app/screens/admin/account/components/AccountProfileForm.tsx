import { Button } from '../../../../shared/ui/Button/Button';
import type { useProfileEditor } from '../hooks/use-profile-editor';
import { useAccountFormFocus } from '../hooks/use-account-form-focus';
import { AccountField } from './AccountField';

export function AccountProfileForm({
  editor,
  disabled,
  onReload,
}: {
  editor: ReturnType<typeof useProfileEditor>;
  disabled: boolean;
  onReload: () => void;
}) {
  const form = useAccountFormFocus(editor.focusRevision);
  const locked = disabled || editor.busy || editor.blocked;
  return (
    <form
      ref={form}
      className="account-card"
      aria-labelledby="account-profile-title"
      noValidate
      aria-busy={editor.busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!disabled) void editor.save();
      }}
    >
      <header className="account-card__header">
        <div className="account-card__icon" aria-hidden="true">
          <svg viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="8" r="3.5" />
            <path d="M5 21v-3a7 7 0 0 1 14 0v3" />
          </svg>
        </div>
        <div>
          <h2 id="account-profile-title">내 정보</h2>
          <p>이름과 연락처를 관리하세요.</p>
        </div>
      </header>
      <div className="account-login-id">
        <dl>
          <dt>로그인 아이디</dt>
          <dd>{editor.original.loginId}</dd>
        </dl>
        <span>관리자</span>
      </div>
      <div className="account-profile-fields">
        <AccountField
          id="account-name"
          name="name"
          label="이름"
          required
          autoComplete="name"
          value={editor.values.name}
          error={editor.errors.name}
          disabled={locked}
          onChange={(event) => editor.change('name', event.target.value)}
        />
        <AccountField
          id="account-phone"
          name="phone"
          label="연락처"
          type="tel"
          autoComplete="tel"
          placeholder="010-0000-0000"
          value={editor.values.phone}
          error={editor.errors.phone}
          disabled={locked}
          onChange={(event) => editor.change('phone', event.target.value)}
        />
        <AccountField
          id="account-company"
          name="company"
          label="회사"
          autoComplete="organization"
          placeholder="회사명 (선택)"
          value={editor.values.company}
          error={editor.errors.company}
          disabled={locked}
          onChange={(event) => editor.change('company', event.target.value)}
        />
        <AccountField
          id="account-department"
          name="department"
          label="부서"
          placeholder="부서명 (선택)"
          value={editor.values.department}
          error={editor.errors.department}
          disabled={locked}
          onChange={(event) => editor.change('department', event.target.value)}
        />
      </div>
      {editor.error && (
        <div
          className="account-notice account-notice--error"
          role="alert"
          tabIndex={-1}
        >
          <p>{editor.error}</p>
          {editor.blocked && (
            <Button className="admin-button-secondary" onClick={onReload}>
              최신 정보 다시 불러오기
            </Button>
          )}
        </div>
      )}
      {editor.saved && (
        <p className="account-notice account-notice--success" role="status">
          내 정보를 저장했습니다.
        </p>
      )}
      <footer className="account-card__actions">
        <Button
          className="admin-button-secondary"
          disabled={locked || !editor.dirty}
          onClick={editor.reset}
        >
          변경 취소
        </Button>
        <Button
          type="submit"
          disabled={disabled || editor.blocked || !editor.dirty}
          loading={editor.busy}
        >
          {editor.busy ? '저장 중' : '내 정보 저장'}
        </Button>
      </footer>
    </form>
  );
}
