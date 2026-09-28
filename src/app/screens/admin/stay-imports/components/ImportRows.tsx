import { Link } from 'react-router-dom';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { StayImportRowDto } from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { ImportSourceCells } from './ImportSourceCells';
import { importRowStatus, importTime } from '../model/import-review-model';

export function ImportRows({
  rows,
  properties,
  editable,
  busy,
  onEdit,
  onSkip,
}: {
  rows: StayImportRowDto[];
  properties: AdminPropertyOption[];
  editable: boolean;
  busy: boolean;
  onEdit: (row: StayImportRowDto) => void;
  onSkip: (row: StayImportRowDto) => void;
}) {
  return (
    <div className="stay-import-table-wrap">
      <table className="stay-import-table">
        <caption className="stay-import-sr-only">명단 행별 검토 결과</caption>
        <thead>
          <tr>
            <th scope="col">원본 / 이용객</th>
            <th scope="col">휴양소 / 이용 기간</th>
            <th scope="col">검토 결과</th>
            <th scope="col">처리</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id}>
              <td>
                <p className="stay-import-row-source">
                  {row.sheetName} · {row.rowNumber}행
                </p>
                <strong>
                  {row.normalizedData?.guestName ||
                    (row.normalizedData ? '이름 확인 필요' : '안내 / 기타 행')}
                </strong>
                <p>
                  {[row.normalizedData?.company, row.normalizedData?.department]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
                <ImportSourceCells row={row} />
              </td>
              <td>
                <strong>
                  {row.propertyId
                    ? (properties.find(
                        (property) => property.id === row.propertyId,
                      )?.name ?? '연결된 휴양소')
                    : row.normalizedData
                      ? '휴양소 연결 필요'
                      : '—'}
                </strong>
                {row.normalizedData && (
                  <dl className="stay-import-period">
                    <div>
                      <dt>입실</dt>
                      <dd>
                        {row.normalizedData.checkInAt
                          ? importTime(row.normalizedData.checkInAt)
                          : `${row.normalizedData.checkInDate ?? '날짜 확인 필요'} · 시간 확인 필요`}
                      </dd>
                    </div>
                    <div>
                      <dt>퇴실</dt>
                      <dd>
                        {row.normalizedData.checkOutAt
                          ? importTime(row.normalizedData.checkOutAt)
                          : `${row.normalizedData.checkOutDate ?? '날짜 확인 필요'} · 시간 확인 필요`}
                      </dd>
                    </div>
                  </dl>
                )}
              </td>
              <td>
                <span
                  className={`stay-import-badge stay-import-badge--${row.action === 'SKIP' ? 'skip' : row.validationStatus.toLowerCase()}`}
                >
                  {importRowStatus(row)}
                </span>
                {row.validationMessages.length > 0 && (
                  <ul className="stay-import-messages">
                    {row.validationMessages.map((message, index) => (
                      <li key={`${message.code}:${index}`}>
                        {message.message}
                      </li>
                    ))}
                  </ul>
                )}
                {row.normalizedData?.review && (
                  <p className="stay-import-reviewer">
                    최근 검토: {row.normalizedData.review.actor.name}
                    <br />
                    {importTime(row.normalizedData.review.at)}
                  </p>
                )}
              </td>
              <td>
                <div className="stay-import-row-actions">
                  {row.stayId ? (
                    <Link
                      className="ui-button admin-button-secondary"
                      to={`/admin/stays/${row.stayId}?view=list`}
                      aria-label={`${row.rowNumber}행 등록된 일정 보기`}
                    >
                      일정 보기
                    </Link>
                  ) : editable && row.normalizedData ? (
                    <>
                      <Button
                        disabled={busy}
                        onClick={() => onEdit(row)}
                        aria-label={`${row.rowNumber}행 ${row.action === 'SKIP' ? '다시 포함 검토' : '검토'}`}
                      >
                        {row.action === 'SKIP' ? '다시 포함 검토' : '검토'}
                      </Button>
                      {row.action !== 'SKIP' && (
                        <Button
                          disabled={busy}
                          className="admin-button-secondary"
                          onClick={() => onSkip(row)}
                          aria-label={`${row.rowNumber}행 제외`}
                        >
                          제외
                        </Button>
                      )}
                    </>
                  ) : (
                    <span className="stay-import-muted">
                      {row.action === 'SKIP' ? '제외된 행' : '읽기 전용'}
                    </span>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
