import type { StayImportRowDto } from '../../../features/admin-stay-imports/admin-stay-imports.types';

export function ImportSourceCells({ row }: { row: StayImportRowDto }) {
  return (
    <details className="stay-import-source">
      <summary>
        원본 셀 보기 · {row.sheetName} {row.rowNumber}행
      </summary>
      <p>
        업로드한 원본 값입니다. 검토 내용을 저장해도 원본은 바뀌지 않습니다.
      </p>
      <dl>
        {row.rawData.cells.map((cell) => (
          <div key={cell.column}>
            <dt>
              {cell.column}
              {cell.formula ? ' · 수식 있음' : ''}
              {cell.type === 'e' ? ' · 셀 오류' : ''}
            </dt>
            <dd>
              {cell.value === null || cell.value === ''
                ? '빈 셀'
                : String(cell.value)}
            </dd>
          </div>
        ))}
      </dl>
    </details>
  );
}
