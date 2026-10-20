import { useEffect, useRef } from 'react';
import type { StayImportRowDto } from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { ImportSourceValues } from './ImportSourceCells';

export function ImportSourceDialog({
  row,
  onClose,
}: {
  row: StayImportRowDto;
  onClose: () => void;
}) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);

  return (
    <dialog
      ref={dialog}
      className="stay-import-source-dialog"
      aria-labelledby="import-source-title"
      onClose={() => {
        if (!dialog.current?.open) onClose();
      }}
    >
      <header>
        <div>
          <h2 id="import-source-title">원본 셀</h2>
          <p>
            {row.sheetName} · {row.rowNumber}행
          </p>
        </div>
        <form method="dialog">
          <button className="ui-button admin-button-secondary">닫기</button>
        </form>
      </header>
      <p>업로드한 원본 값입니다. 검토 후에도 원본은 유지됩니다.</p>
      <ImportSourceValues row={row} />
    </dialog>
  );
}
