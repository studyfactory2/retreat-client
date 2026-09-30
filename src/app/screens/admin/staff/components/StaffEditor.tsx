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
  return (
    <div className="staff-editor">
      <header className="staff-heading">
        <div>
          <p className="staff-heading__eyebrow">
            {original ? 'STAFF PROFILE' : 'NEW STAFF'}
          </p>
          <h1>{original ? '직원 정보' : '직원 등록'}</h1>
          <p>
            {original
              ? `${original.name} 님의 정보와 담당 휴양소를 확인하세요.`
              : '휴양소에서 정비를 담당할 직원을 등록하세요.'}
          </p>
        </div>
        <div className="staff-actions">
          <Button
            className="admin-button-secondary"
            disabled={mutation.busy || confirming}
            onClick={editor.returnToList}
          >
            목록으로 돌아가기
          </Button>
          {onReload && (
            <Button
              className="admin-button-secondary"
              disabled={mutation.busy || confirming}
              onClick={() => navigation.request(onReload)}
            >
              최신 정보 불러오기
            </Button>
          )}
        </div>
      </header>
      <div className="staff-banner">
        <p>
          직원 프로필은 휴양소 배정과 정비 기록에 사용됩니다. 관리자 로그인
          계정이나 비밀번호는 생성되지 않습니다.
        </p>
      </div>
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
      <StaffForm
        values={editor.values}
        errors={editor.errors}
        editing={!!original}
        hasAssignments={!!original?.assignedProperties.length}
        busy={mutation.busy}
        blocked={!!mutation.blocked || confirming}
        onChange={editor.change}
        onSubmit={editor.submit}
        onCancel={editor.returnToList}
      />
      {original && <StaffAssignments staff={original} />}
    </div>
  );
}
