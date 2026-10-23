import type { AdminReportMode } from '../../../../features/admin-reports/admin-reports.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { ReportDownloadState } from '../hooks/use-report-download';

export function ReportDownloadFeedback({
  state,
  mode,
  onCancel,
  onReload,
}: {
  state: ReportDownloadState;
  mode: AdminReportMode;
  onCancel: () => void;
  onReload: () => void;
}) {
  if (state.status === 'idle') return null;
  if (state.status === 'busy')
    return (
      <div className="reports-notice reports-notice--preparing" role="status">
        <div>
          <strong>
            {mode === 'archive'
              ? '엑셀과 사진을 모으고 있습니다'
              : '엑셀 파일을 생성하고 있습니다'}
          </strong>
          <p>이 화면에서 잠시 기다려 주세요.</p>
        </div>
        <Button className="admin-button-secondary" onClick={onCancel}>
          준비 취소
        </Button>
      </div>
    );
  if (state.status === 'cancelled')
    return (
      <p className="reports-notice" role="status">
        다운로드 준비를 취소했습니다.
      </p>
    );
  if (state.status === 'error')
    return (
      <div className="reports-notice reports-notice--error" role="alert">
        <p>{state.message}</p>
        <p>조건을 확인한 뒤 다운로드를 다시 눌러 주세요.</p>
        {state.code === 'PROPERTY_NOT_FOUND' && (
          <Button className="admin-button-secondary" onClick={onReload}>
            휴양소 목록 새로고침
          </Button>
        )}
      </div>
    );
  const partial = !!state.photos?.skipped;
  return (
    <div
      className={`reports-notice${partial ? ' reports-notice--partial' : ''}`}
      role="status"
    >
      <strong>다운로드를 요청했습니다</strong>
      {state.photos && (
        <p className="reports-photo-result">
          사진 {state.photos.total}장 중{' '}
          <strong>{state.photos.included}장 포함</strong>
          {partial && <span> · {state.photos.skipped}장 제외</span>}
        </p>
      )}
      {partial && <p>제외 사유는 ZIP 안의 다운로드안내.txt에서 확인하세요.</p>}
      <p>브라우저의 다운로드 목록을 확인해 주세요.</p>
      <p className="reports-filename">{state.filename}</p>
    </div>
  );
}
