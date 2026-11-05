import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import type { StayImportRowDto } from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import { importRowStatus } from '../model/import-review-model';
import {
  importRowActionBadge,
  importRowPeriod,
} from '../model/import-row-presentation';
import '../styles/import-review-list.css';

export function ImportRows({
  rows,
  properties,
  busy,
  onSelect,
  selectedId,
  sharedYear,
}: {
  rows: StayImportRowDto[];
  properties: AdminPropertyOption[];
  busy: boolean;
  onSelect: (row: StayImportRowDto) => void;
  selectedId?: string;
  sharedYear?: string;
}) {
  return (
    <ul className="import-review-list" aria-label="명단 행별 검토 결과">
      {rows.map((row) => {
        const data = row.normalizedData;
        const guest =
          data?.guestName || (data ? '이름 확인 필요' : '안내 / 기타 행');
        const property = row.propertyId
          ? (properties.find((item) => item.id === row.propertyId)?.name ??
            '연결된 휴양소')
          : data
            ? '휴양소 연결 필요'
            : '원본 행';
        const status = importRowStatus(row);
        const tone = row.stayId
          ? 'ready'
          : row.action === 'SKIP'
            ? 'skipped'
            : row.action === 'UPDATE' || row.validationStatus === 'INVALID'
              ? 'invalid'
              : row.validationStatus === 'NEEDS_REVIEW'
                ? 'review'
                : 'ready';
        const badge = importRowActionBadge(row);
        const start = data
          ? importRowPeriod(data.checkInAt, data.checkInDate, sharedYear)
          : '';
        const end = data
          ? importRowPeriod(data.checkOutAt, data.checkOutDate, sharedYear)
          : '';
        const label = [
          guest,
          property,
          `${row.sheetName} · 원본 ${row.rowNumber}행`,
          ...(data
            ? [
                `입실 ${importRowPeriod(data.checkInAt, data.checkInDate)}${!data.checkInAt ? ' · 시간 확인 필요' : ''}`,
                `퇴실 ${importRowPeriod(data.checkOutAt, data.checkOutDate)}${!data.checkOutAt ? ' · 시간 확인 필요' : ''}`,
                '한국 시간 기준',
              ]
            : []),
          status,
          ...row.validationMessages.map((message) => message.message),
          badge.label,
          '상세 보기',
        ].join(' · ');
        return (
          <li key={row.id}>
            <button
              type="button"
              className={`import-review-row${selectedId === row.id ? ' is-selected' : ''}`}
              disabled={busy}
              aria-current={selectedId === row.id ? true : undefined}
              aria-label={label}
              onClick={() => onSelect(row)}
            >
              <span className="import-review-row__content">
                <span className="import-review-row__heading">
                  <span className="import-review-row__identity">
                    <strong>{guest}</strong>
                  </span>
                  <span
                    className={`import-review-status import-review-status--${tone}`}
                  >
                    {badge.label}
                    {badge.additional > 0 && (
                      <span
                        className="import-review-status__more"
                        aria-label={`추가 확인 ${badge.additional}건`}
                      >
                        +{badge.additional}
                      </span>
                    )}
                  </span>
                </span>
                {data ? (
                  <span className="import-review-row__period">
                    <span>{start}</span>
                    <span aria-hidden="true">→</span>
                    <span>{end}</span>
                  </span>
                ) : (
                  <span className="import-review-row__source">
                    {row.sheetName} · {row.rowNumber}행
                  </span>
                )}
              </span>
              <span className="import-review-row__arrow" aria-hidden="true">
                <ScheduleIcon name="chevron" />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
