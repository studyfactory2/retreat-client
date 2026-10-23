import { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { ReportDownloadForm } from './components/ReportDownloadForm';
import { ReportContents } from './components/ReportContents';
import { ReportDownloadFeedback } from './components/ReportDownloadFeedback';
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
  const [search] = useSearchParams();
  if (state.status !== 'authenticated') return null;
  return (
    <ReportsWorkspace
      key={`${state.user.id}:${state.expiresAt}:${search.toString()}`}
      search={search}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function ReportsWorkspace({
  token,
  rejectSession,
  search,
}: {
  token: string;
  rejectSession: (token: string) => void;
  search: URLSearchParams;
}) {
  const [values, setValues] = useState(() =>
    createReportFormValues(new Date(), search),
  );
  const [errors, setErrors] = useState<ReturnType<typeof validateReportForm>>(
    {},
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const download = useReportDownload(
    token,
    rejectSession,
    getReportFormScope(values),
  );
  const busy = download.state.status === 'busy';
  const options =
    properties.resource.status === 'ready' ? properties.resource.data : [];

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
    if (
      values.propertyId &&
      !options.some((item) => item.id === values.propertyId)
    )
      next.propertyId = '휴양소 목록에서 다시 선택해 주세요.';
    setErrors(next);
    if (Object.keys(next).length) return;
    void download.download(toAdminReportQuery(values));
  }

  return (
    <div className="admin-reports">
      <header className="reports-heading">
        <h1>운영 보고서</h1>
      </header>
      <div className="reports-workspace">
        <section
          className="reports-card"
          aria-labelledby="report-download-heading"
        >
          <div className="reports-card__heading">
            <span className="reports-card__icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none">
                <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Zm0 0v6h6M8 14h8M8 18h5" />
              </svg>
            </span>
            <h2 id="report-download-heading">다운로드 조건</h2>
            <span className="reports-format">
              {values.mode === 'archive' ? 'ZIP' : 'XLSX'}
            </span>
          </div>
          {properties.resource.status === 'loading' && (
            <p className="reports-notice" role="status">
              휴양소 목록을 불러오는 중입니다.
            </p>
          )}
          {properties.resource.status === 'error' && (
            <div className="reports-notice reports-notice--error" role="alert">
              <p>
                휴양소 목록을 불러오지 못했습니다. {properties.resource.message}
              </p>
              <Button
                className="admin-button-secondary"
                onClick={properties.refresh}
              >
                목록 다시 불러오기
              </Button>
            </div>
          )}
          <ReportDownloadForm
            values={values}
            errors={errors}
            properties={options}
            propertiesReady={properties.resource.status === 'ready'}
            propertiesLoading={properties.resource.status === 'loading'}
            busy={busy}
            onChange={change}
            onMonth={chooseMonth}
            onSubmit={submit}
          />
          <ReportDownloadFeedback
            state={download.state}
            mode={values.mode}
            onCancel={download.cancel}
            onReload={() => {
              download.reset();
              properties.refresh();
            }}
          />
        </section>
        <ReportContents mode={values.mode} />
      </div>
    </div>
  );
}
