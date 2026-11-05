import { Link } from 'react-router-dom';
import type {
  GetStayImportInput,
  StayImportPreviewDto,
} from '../../../../features/admin-stay-imports/admin-stay-imports.types';
import { importTime } from '../model/import-review-model';
import '../styles/import-review-list.css';

export function ImportBatchSummary({
  batch,
  input,
  disabled,
  onChange,
}: {
  batch: StayImportPreviewDto['batch'];
  input: GetStayImportInput;
  disabled: boolean;
  onChange: (input: GetStayImportInput) => void;
}) {
  const summary = batch.summary;
  const counts: {
    label: string;
    count: number;
    tone: string;
    filter: GetStayImportInput;
  }[] = [
    { label: '전체', count: summary.total, tone: 'total', filter: { page: 1 } },
    {
      label: batch.status === 'CONFIRMED' ? '등록 완료' : '등록 준비',
      count: summary.ready,
      tone: 'ready',
      filter: { page: 1, validationStatus: 'VALID', action: 'CREATE' },
    },
    {
      label: '확인 필요',
      count: summary.needsReview,
      tone: 'review',
      filter: { page: 1, validationStatus: 'NEEDS_REVIEW', action: 'CREATE' },
    },
    {
      label: '오류',
      count: summary.invalid,
      tone: 'invalid',
      filter: { page: 1, validationStatus: 'INVALID', action: 'CREATE' },
    },
    {
      label: '제외',
      count: summary.skipped,
      tone: 'skipped',
      filter: { page: 1, action: 'SKIP' },
    },
  ];
  return (
    <>
      <section className="import-review-summary" aria-label="명단 전체 요약">
        <div className="import-review-summary__file">
          <div>
            <strong>{batch.source.filename}</strong>
            <p>
              {(batch.source.sizeBytes / 1024).toFixed(1)} KB · 업로드{' '}
              {importTime(batch.createdAt)}
            </p>
          </div>
          <span className="import-review-summary__state">
            {batch.status === 'CONFIRMED'
              ? '가져오기 완료'
              : batch.status === 'PREVIEW'
                ? '검토 중'
                : '처리할 수 없는 명단'}
          </span>
        </div>
        <div
          className="import-review-summary__counts"
          aria-label="요약별 명단 보기"
        >
          {counts.map(({ label, count, tone, filter }) => (
            <button
              type="button"
              key={tone}
              className={`import-review-summary__count import-review-summary__count--${tone}`}
              disabled={disabled}
              aria-pressed={
                input.validationStatus === filter.validationStatus &&
                input.action === filter.action
              }
              aria-label={`${label} ${count.toLocaleString('ko-KR')}건 보기`}
              onClick={() => onChange(filter)}
            >
              <span>{label}</span>
              <strong>{count.toLocaleString('ko-KR')}</strong>
            </button>
          ))}
        </div>
      </section>
      {batch.status === 'CONFIRMED' ? (
        <div
          className="import-review-state import-review-state--success"
          role="status"
        >
          <h2>이용 일정 등록이 완료되었습니다.</h2>
          <p>
            {summary.ready}건 등록 · {summary.skipped}건 제외 ·{' '}
            {importTime(batch.confirmedAt)}
          </p>
          <p>행을 열어 등록된 일정을 확인할 수 있습니다.</p>
          <Link
            className="ui-button admin-button-secondary"
            to="/admin/calendar"
          >
            이용 달력 보기 →
          </Link>
        </div>
      ) : batch.status !== 'PREVIEW' ? (
        <p className="import-review-state" role="status">
          이 명단은 더 이상 검토하거나 확정할 수 없습니다. 새 파일 가져오기에서
          미리보기를 다시 만들어 주세요.
        </p>
      ) : null}
    </>
  );
}
