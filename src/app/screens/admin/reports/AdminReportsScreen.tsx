import { useState } from 'react';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { ReportDownloadForm } from './components/ReportDownloadForm';
import { ReportContents } from './components/ReportContents';
import { useReportDownload } from './hooks/use-report-download';
import {
  createReportFormValues,
  getReportFormScope,
  getReportMonthRange,
  toAdminReportQuery,
  validateReportForm,
  type ReportFormValues,
} from './model/report-form-model';
import './styles/reports.css';

export function AdminReportsScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <ReportsWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function ReportsWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [values, setValues] = useState(() => createReportFormValues());
  const [errors, setErrors] = useState<ReturnType<typeof validateReportForm>>({});
  const properties = useAdminPropertyOptions(token, rejectSession);
  const download = useReportDownload(token, rejectSession, getReportFormScope(values));
  const busy = download.state.status === 'busy';
  const options = properties.resource.status === 'ready' ? properties.resource.data : [];

  function change(field: keyof ReportFormValues, value: string) {
    download.reset();
    setValues((current) => ({ ...current, [field]: value }));
    setErrors({});
  }

  function chooseMonth(offset: 0 | -1) {
    download.reset();
    setValues((current) => ({ ...current, ...getReportMonthRange(offset) }));
    setErrors({});
  }

  function submit() {
    if (busy || properties.resource.status !== 'ready') return;
    const next = validateReportForm(values);
    if (values.propertyId && !options.some((item) => item.id === values.propertyId))
      next.propertyId = '휴양소 목록에서 다시 선택해 주세요.';
    setErrors(next);
    if (Object.keys(next).length) return;
    void download.download(toAdminReportQuery(values));
  }

  return (
    <div className="admin-reports">
      <header className="reports-heading">
        <p className="reports-heading__eyebrow">OPERATIONS REPORT</p>
        <h1>운영 보고서</h1>
        <p>선택한 기간의 제출 기록과 이상사항을 하나의 엑셀 파일로 내려받습니다.</p>
      </header>

      <section className="reports-card" aria-labelledby="report-download-heading">
        <div className="reports-card__heading">
          <div>
            <h2 id="report-download-heading">엑셀 다운로드</h2>
            <p>기간과 휴양소를 선택해 주세요.</p>
          </div>
          <span className="reports-format">3개 시트 · .xlsx</span>
        </div>
        {properties.resource.status === 'loading' && (
          <p className="reports-notice" role="status">휴양소 목록을 불러오는 중입니다.</p>
        )}
        {properties.resource.status === 'error' && (
          <div className="reports-notice reports-notice--error" role="alert">
            <p>휴양소 목록을 불러오지 못했습니다. {properties.resource.message}</p>
            <Button className="admin-button-secondary" onClick={properties.refresh}>
              목록 다시 불러오기
            </Button>
          </div>
        )}
        <ReportDownloadForm
          values={values}
          errors={errors}
          properties={options}
          propertiesReady={properties.resource.status === 'ready'}
          busy={busy}
          onChange={change}
          onMonth={chooseMonth}
          onSubmit={submit}
        />
        {download.state.status === 'busy' && (
          <p className="reports-notice" role="status">
            엑셀 파일을 생성하고 있습니다. 잠시만 기다려 주세요.
          </p>
        )}
        {download.state.status === 'requested' && (
          <div className="reports-notice" role="status">
            <p>다운로드를 요청했습니다. 브라우저의 다운로드 목록을 확인해 주세요.</p>
            <p className="reports-filename">{download.state.filename}</p>
          </div>
        )}
        {download.state.status === 'error' && (
          <div className="reports-notice reports-notice--error" role="alert">
            <p>{download.state.message}</p>
            <p>조건을 확인한 뒤 엑셀 다운로드를 다시 눌러 주세요.</p>
            {download.state.code === 'PROPERTY_NOT_FOUND' && (
              <Button className="admin-button-secondary" onClick={() => {
                download.reset();
                properties.refresh();
              }}>
                휴양소 목록 새로고침
              </Button>
            )}
          </div>
        )}
      </section>
      <ReportContents />
    </div>
  );
}
