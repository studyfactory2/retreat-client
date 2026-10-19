import { useEffect, useRef } from 'react';
import type { AdminStaffDto } from '../../../../features/admin-staff/admin-staff.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffEditor } from '../hooks/use-staff-editor';
import { StaffAssignments } from './StaffAssignments';
import { StaffConfirmation } from './StaffConfirmation';
import { StaffForm } from './StaffForm';

type Props = {
  original?: AdminStaffDto;
  token: string;
  rejectSession: (token: string) => void;
  returnUrl: string;
  onReload?: () => void;
};
export function StaffEditor({
  original,
  token,
  rejectSession,
  returnUrl,
  onReload,
}: Props) {
  const editor = useStaffEditor({ original, token, rejectSession, returnUrl });
  const { mutation, navigation } = editor;
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (mutation.message) notice.current?.focus();
  }, [mutation.message]);
  const confirming = editor.confirming || navigation.pending;
  const affiliation = original
    ? [original.company, original.department].filter(Boolean).join(' · ')
    : '';
  return (
    <form
      className={`staff-form staff-editor${original ? '' : ' staff-editor--create'}`}
      noValidate
      aria-labelledby="staff-editor-title"
      aria-busy={mutation.busy}
      onSubmit={(event) => {
        event.preventDefault();
        if (!mutation.busy && !mutation.blocked && !confirming) editor.submit();
      }}
    >
      <header className="staff-heading">
        <p className="staff-editor__breadcrumb">관리자 <span aria-hidden="true">›</span> 직원</p>
        <div className="staff-heading__title">
          <h1 id="staff-editor-title">{original ? original.name : '직원 등록'}</h1>
          {original && (
            <span className={`staff-badge${original.isActive ? '' : ' staff-badge--inactive'}`}>
              {original.isActive ? '활성' : '비활성'}
            </span>
          )}
        </div>
        {affiliation && <p className="staff-heading__affiliation">{affiliation}</p>}
      </header>
      <div className="staff-editor__body">
        {mutation.message && (
          <div
            className="staff-banner staff-banner--error"
            role="alert"
            tabIndex={-1}
            ref={notice}
          >
            <p>{mutation.message}</p>
            {mutation.blocked && (
              <>
                <p>
                  입력 내용은 남아 있습니다. 최신 정보를 확인한 뒤 변경 사항을
                  다시 검토해 주세요.
                </p>
                <Button
                  className="admin-button-secondary"
                  disabled={confirming}
                  onClick={
                    onReload
                      ? () => navigation.request(onReload)
                      : editor.returnToList
                  }
                >
                  {onReload ? '최신 직원 정보 확인' : '목록에서 등록 결과 확인'}
                </Button>
              </>
            )}
          </div>
        )}
        {editor.unchanged && (
          <p className="staff-banner" role="status">
            변경된 내용이 없습니다.
          </p>
        )}
        {navigation.pending && (
          <StaffConfirmation
            mode="discard"
            onKeep={navigation.keep}
            onConfirm={navigation.discard}
          />
        )}
        {editor.confirming && (
          <StaffConfirmation
            mode="deactivate"
            name={editor.values.name.trim()}
            onKeep={editor.keepEditing}
            onConfirm={editor.persist}
          />
        )}
        <div
          className={`staff-editor__layout${original ? '' : ' staff-editor__layout--create'}`}
        >
          <StaffForm
            values={editor.values}
            errors={editor.errors}
            editing={!!original}
            hasAssignments={!!original?.assignedProperties.length}
            busy={mutation.busy}
            blocked={!!mutation.blocked || confirming}
            onChange={editor.change}
          />
          {original && <StaffAssignments staff={original} />}
        </div>
        <details className="staff-editor__help">
          <summary>직원 등록 안내</summary>
          <p>휴양소 배정과 정비 기록을 위한 직원 정보입니다. 관리자 로그인 계정은 생성되지 않습니다.</p>
        </details>
      </div>
      <div className="staff-form__actions">
        {onReload && (
          <Button
            className="admin-button-secondary staff-editor__reload"
            disabled={mutation.busy || confirming}
            onClick={() => navigation.request(onReload)}
            aria-label="직원 정보 새로고침"
          >
            <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M20 7v5h-5M4 17v-5h5" /><path d="M6.1 7a7 7 0 0 1 11.55-2L20 8M4 16l2.35 3A7 7 0 0 0 17.9 17" /></svg>
          </Button>
        )}
        <Button
          className="admin-button-secondary staff-editor__back"
          disabled={mutation.busy || !!mutation.blocked || confirming}
          onClick={editor.returnToList}
        >
          <span aria-hidden="true">←</span> {original ? '취소' : '목록'}
        </Button>
        <Button type="submit" loading={mutation.busy} disabled={!!mutation.blocked || confirming}>
          {!mutation.busy && <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m5 12 4 4L19 6" /></svg>}
          {mutation.busy ? '저장 중' : original ? '변경 저장' : '직원 등록'}
        </Button>
      </div>
    </form>
  );
}
