import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { IssueActionMutation } from '../model/issue-action-model';

export function IssueMutationNotice({
  mutation,
  onReload,
}: {
  mutation: IssueActionMutation;
  onReload: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  const visible = mutation.status !== 'idle' && mutation.status !== 'saving';
  const blocked =
    mutation.status === 'conflict' || mutation.status === 'unknown';
  useEffect(() => {
    if (visible) notice.current?.focus();
  }, [visible, mutation.status, mutation.message]);
  if (!visible) return null;
  return (
    <div
      className="issue-action-notice"
      role="alert"
      ref={notice}
      tabIndex={-1}
    >
      <p>{mutation.message || '저장 결과와 입력 내용을 확인해 주세요.'}</p>
      {blocked && (
        <>
          <p>
            아직 저장하지 않은 입력을 확인한 뒤 최신 기록과 이력을 불러와
            주세요.
          </p>
          <Button className="admin-button-secondary" onClick={onReload}>
            최신 기록 확인
          </Button>
        </>
      )}
    </div>
  );
}
