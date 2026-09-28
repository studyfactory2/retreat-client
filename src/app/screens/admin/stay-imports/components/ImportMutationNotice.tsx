import { useEffect, useRef } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { ImportMutationState } from '../hooks/use-stay-import';
import type { StayImportRowDto } from '../../../../features/admin-stay-imports/admin-stay-imports.types';

export function ImportMutationNotice({
  state,
  rows,
  onReload,
}: {
  state: ImportMutationState;
  rows: StayImportRowDto[];
  onReload: () => void;
}) {
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (state.message) notice.current?.focus();
  }, [state.message]);
  if (!state.message) return null;
  return (
    <div
      className="stay-import-notice stay-import-notice--error"
      role="alert"
      tabIndex={-1}
      ref={notice}
    >
      <p>{state.message}</p>
      {state.errors.length > 0 && (
        <ul>
          {state.errors.map((error, index) => {
            const row = rows.find((item) => error.field === `rows.${item.id}`);
            return (
              <li key={`${error.field}:${index}`}>
                {row ? `${row.sheetName} ${row.rowNumber}행: ` : ''}
                {error.messages.join(' ')}
              </li>
            );
          })}
        </ul>
      )}
      {state.needsReview && (
        <p>
          위 내용은 확정 시점에 다시 확인한 결과입니다. 해당 행의 검토 내용을
          저장하거나 제외하면 미리보기가 다시 검증됩니다.
        </p>
      )}
      {state.blocked && (
        <Button className="admin-button-secondary" onClick={onReload}>
          최신 미리보기 확인
        </Button>
      )}
    </div>
  );
}
