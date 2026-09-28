import { Link } from 'react-router-dom';
import type { StayImportPreviewDto } from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { importTime } from './import-review-model';
export function ImportBatchSummary({
  batch,
}: {
  batch: StayImportPreviewDto['batch'];
}) {
  const summary = batch.summary;
  return (
    <>
      <section className="stay-import-meta">
        <div>
          <strong>{batch.source.filename}</strong>
          <p>
            {(batch.source.sizeBytes / 1024).toFixed(1)} KB · 업로드{' '}
            {importTime(batch.createdAt)}
          </p>
        </div>
        <span className="stay-import-badge">
          {batch.status === 'CONFIRMED'
            ? '가져오기 완료'
            : batch.status === 'PREVIEW'
              ? '검토 중'
              : '처리할 수 없는 명단'}
        </span>
      </section>
      <div className="stay-import-summary" aria-label="명단 전체 요약">
        {(
          [
            ['전체', summary.total, 'total'],
            ['등록 준비', summary.ready, 'ready'],
            ['확인 필요', summary.needsReview, 'review'],
            ['오류', summary.invalid, 'invalid'],
            ['제외', summary.skipped, 'skipped'],
          ] as const
        ).map(([label, count, tone]) => (
          <div key={tone} className={`stay-import-summary__${tone}`}>
            <span>
              {batch.status === 'CONFIRMED' && tone === 'ready'
                ? '등록 완료'
                : label}
            </span>
            <strong>
              {count.toLocaleString('ko-KR')}
              <small>건</small>
            </strong>
          </div>
        ))}
      </div>
      {batch.status === 'CONFIRMED' ? (
        <div
          className="stay-import-notice stay-import-notice--success"
          role="status"
        >
          <h2>이용 일정 등록이 완료되었습니다.</h2>
          <p>
            {summary.ready}건 등록 · {summary.skipped}건 제외 ·{' '}
            {importTime(batch.confirmedAt)}
          </p>
          <p>각 행의 일정 보기에서 등록된 내용을 확인할 수 있습니다.</p>
          <Link to="/admin/calendar">달력에서 확인하기 →</Link>
        </div>
      ) : batch.status === 'PREVIEW' ? (
        <p className="stay-import-notice">
          아직 이용 일정에 반영되지 않았습니다. 확인 필요·오류 행을 검토하거나
          제외해 주세요. 날짜만 있는 행은 입·퇴실 시간을 직접 입력해야 합니다.
        </p>
      ) : (
        <p className="stay-import-notice">
          이 명단은 더 이상 검토하거나 확정할 수 없습니다. 새 파일 가져오기에서
          미리보기를 다시 만들어 주세요.
        </p>
      )}
    </>
  );
}
