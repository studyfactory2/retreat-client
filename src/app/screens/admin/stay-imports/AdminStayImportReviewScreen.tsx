import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import {
  confirmStayImport,
  reviewStayImport,
} from '../../../features/admin-stay-imports/admin-stay-imports-api';
import type {
  StayImportRowDto,
  GetStayImportInput,
  ReviewStayImportRowInput,
} from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { isStayRevision } from '../../../features/admin-stays/admin-stays-validation';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AdminBackButton } from '../components/AdminBackButton';
import { useAdminNavigationGuard } from '../hooks/use-admin-navigation-guard';
import {
  ImportRowEditor,
  type ImportEditorNavigation,
} from './components/ImportRowEditor';
import { ImportReviewPanel } from './components/ImportReviewPanel';
import { ScheduleIcon } from '../schedule/components/ScheduleIcon';
import { ImportRows } from './components/ImportRows';
import { importRowsYear } from './model/import-row-presentation';
import { ImportMutationNotice } from './components/ImportMutationNotice';
import {
  readImportFilters,
  importFilterSearch,
} from './model/import-review-model';
import { useStayImport, useImportMutation } from './hooks/use-stay-import';
import { ImportBatchSummary } from './components/ImportBatchSummary';
import { ImportRowFilters } from './components/ImportRowFilters';
import { ImportConfirmation } from './components/ImportConfirmation';
import { ImportSteps } from './components/ImportSteps';
import './styles/stay-import.css';
import './styles/import-review-workspace.css';

export function AdminStayImportReviewScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <ImportWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function ImportWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const navigate = useNavigate();
  const filters = readImportFilters(search);
  const query = importFilterSearch(filters);
  const { resource, refresh } = useStayImport(
    id,
    filters,
    token,
    rejectSession,
  );
  const options = useAdminPropertyOptions(token, rejectSession);
  const mutation = useImportMutation(token, rejectSession);
  const [editor, setEditor] = useState<{
    row: StayImportRowDto;
    version: number;
  } | null>(null);
  const editorNavigation = useRef<ImportEditorNavigation>(null);
  const rowTrigger = useRef<HTMLElement | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');
  useAdminNavigationGuard(() => mutation.hasPendingChanges() || confirming);
  const confirmation = useRef<HTMLDivElement>(null);
  const properties =
    options.resource.status === 'ready' ? options.resource.data : [];
  const clampedPage =
    resource.status === 'ready' &&
    filters.page > Math.max(1, resource.data.rows.totalPages)
      ? Math.max(1, resource.data.rows.totalPages)
      : null;
  const locked = mutation.state.busy || mutation.state.blocked;
  useEffect(() => {
    if (clampedPage !== null)
      setSearch(
        importFilterSearch({
          ...readImportFilters(new URLSearchParams(query)),
          page: clampedPage,
        }),
        { replace: true },
      );
  }, [clampedPage, query, setSearch]);
  useEffect(() => {
    if (confirming) confirmation.current?.focus();
  }, [confirming]);
  useEffect(() => {
    if (resource.status === 'ready' && !editor) {
      const target = rowTrigger.current?.isConnected
        ? rowTrigger.current
        : document.getElementById('main-content');
      target?.focus({ preventScroll: true });
    }
  }, [resource.status, editor]);

  function reload() {
    setEditor(null);
    setConfirming(false);
    setNotice('');
    mutation.reset();
    refresh();
    options.refresh();
  }
  function saveRow(input: ReviewStayImportRowInput, version: number) {
    void mutation.run(
      (signal) =>
        reviewStayImport(
          id,
          { expectedVersion: version, rows: [input] },
          token,
          signal,
        ),
      () => {
        setEditor(null);
        setConfirming(false);
        setNotice('검토 내용을 저장하고 명단 전체를 다시 확인했습니다.');
        refresh();
      },
    );
  }
  function requestTransition(proceed: () => void) {
    if (mutation.state.busy) return;
    if (editor && editorNavigation.current)
      editorNavigation.current.requestLeave(proceed);
    else proceed();
  }
  function changeFilters(next: GetStayImportInput) {
    requestTransition(() => {
      setEditor(null);
      setConfirming(false);
      setSearch(importFilterSearch(next));
    });
  }
  function selectRow(row: StayImportRowDto, version: number) {
    if (editor?.row.id === row.id) return;
    const trigger = document.activeElement;
    requestTransition(() => {
      rowTrigger.current = trigger instanceof HTMLElement ? trigger : null;
      setNotice('');
      setConfirming(false);
      setEditor({ row, version });
    });
  }

  return (
    <div className="stay-import import-review-workspace">
      <header className="stay-import-heading">
        <div>
          <div className="admin-page-heading-title">
            <AdminBackButton
              label="일정 목록으로 돌아가기"
              disabled={mutation.state.busy}
              onBack={() => requestTransition(() => navigate('/admin/stays'))}
            />
            <h1>
              {resource.status === 'ready' &&
              resource.data.batch.status === 'CONFIRMED'
                ? '엑셀 가져오기 완료'
                : '엑셀 명단 검토'}
            </h1>
          </div>
        </div>
        <div className="stay-import-actions">
          <Button
            className="admin-button-secondary import-review-refresh"
            aria-label="명단 새로고침"
            disabled={mutation.state.busy || resource.status === 'loading'}
            onClick={() => requestTransition(reload)}
          >
            <ScheduleIcon name="refresh" />
          </Button>
        </div>
      </header>
      <ImportSteps
        current={
          confirming ||
          (resource.status === 'ready' &&
            resource.data.batch.status === 'CONFIRMED')
            ? 2
            : 1
        }
        complete={resource.status === 'ready' &&
              resource.data.batch.status === 'CONFIRMED'}
      />
      {notice && (
        <p
          className="stay-import-notice stay-import-notice--success"
          role="status"
        >
          {notice}
        </p>
      )}
      {!editor && (
        <ImportMutationNotice
          state={mutation.state}
          rows={resource.status === 'ready' ? resource.data.rows.items : []}
          onReload={reload}
        />
      )}
      {resource.status === 'loading' || clampedPage !== null ? (
        <div role="status">
          <PageState
            title="미리보기를 불러오는 중"
            description="저장된 명단과 검토 결과를 확인하고 있습니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="미리보기를 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
            <Link
              className="ui-button admin-button-secondary"
              to="/admin/stays/imports/new"
            >
              새 파일 가져오기
            </Link>
          </PageState>
        </div>
      ) : (
        (() => {
          const { batch, rows } = resource.data;
          const sharedYear = importRowsYear(rows.items);
          const editable =
            batch.status === 'PREVIEW' && isStayRevision(batch.version);
          const summary = batch.summary;
          const canConfirm =
            editable &&
            summary.invalid === 0 &&
            summary.needsReview === 0 &&
            !mutation.state.needsReview &&
            !locked;
          return (
            <>
              <ImportBatchSummary
                batch={batch}
                input={filters}
                disabled={locked || confirming}
                onChange={changeFilters}
              />
              {!editor && options.resource.status === 'error' && (
                <div
                  className="stay-import-notice stay-import-notice--error"
                  role="alert"
                >
                  <p>
                    휴양소 이름을 불러오지 못했습니다.{' '}
                    {options.resource.message}
                  </p>
                  <Button onClick={options.refresh}>
                    휴양소 다시 불러오기
                  </Button>
                </div>
              )}
              <ImportRowFilters
                input={filters}
                total={rows.total}
                disabled={locked || confirming}
                onChange={changeFilters}
              />
              <div className="import-review-columns">
                <section
                  className="import-review-results"
                  aria-label="검토할 명단"
                >
                  <div className="import-review-results__heading">
                    <h2>
                      명단 <span>{rows.total.toLocaleString('ko-KR')}건</span>
                    </h2>
                    <span>
                      {sharedYear
                        ? `${sharedYear}년 · 한국 시간`
                        : '입·퇴실 · 한국 시간'}
                    </span>
                  </div>
                  {rows.items.length ? (
                    <ImportRows
                      rows={rows.items}
                      sharedYear={sharedYear}
                      properties={properties}
                      busy={locked || confirming}
                      selectedId={editor?.row.id}
                      onSelect={(row) => selectRow(row, batch.version)}
                    />
                  ) : (
                    <div className="stay-import-card">
                      <h2>조건에 맞는 행이 없습니다.</h2>
                      <p>필터를 변경해 다른 행을 확인해 주세요.</p>
                      <Button
                        className="admin-button-secondary"
                        disabled={mutation.state.busy}
                        onClick={() => changeFilters({ page: 1 })}
                      >
                        전체 행 보기
                      </Button>
                    </div>
                  )}
                  {rows.totalPages > 1 && (
                    <nav
                      className="stay-import-pagination"
                      aria-label="명단 행 페이지"
                    >
                      <Button
                        className="admin-button-secondary"
                        disabled={filters.page <= 1 || locked || confirming}
                        onClick={() =>
                          changeFilters({ ...filters, page: filters.page - 1 })
                        }
                      >
                        이전
                      </Button>
                      <span>
                        {filters.page} / {rows.totalPages} 페이지
                      </span>
                      <Button
                        className="admin-button-secondary"
                        disabled={
                          filters.page >= rows.totalPages ||
                          locked ||
                          confirming
                        }
                        onClick={() =>
                          changeFilters({ ...filters, page: filters.page + 1 })
                        }
                      >
                        다음
                      </Button>
                    </nav>
                  )}
                </section>
                {editor ? (
                  <ImportReviewPanel
                    onRequestClose={() =>
                      requestTransition(() => setEditor(null))
                    }
                  >
                    {options.resource.status === 'error' && (
                      <div
                        className="stay-import-notice stay-import-notice--error"
                        role="alert"
                      >
                        <p>{options.resource.message}</p>
                        <Button
                          onClick={options.refresh}
                          disabled={mutation.state.busy}
                        >
                          휴양소 다시 불러오기
                        </Button>
                      </div>
                    )}
                    {options.resource.status === 'loading' && (
                      <p className="stay-import-muted" role="status">
                        휴양소 목록을 불러오는 중입니다.
                      </p>
                    )}
                    <ImportRowEditor
                      key={`${editor.row.id}:${editor.version}`}
                      row={editor.row}
                      editable={editable && !editor.row.stayId}
                      properties={properties}
                      propertiesReady={options.resource.status === 'ready'}
                      state={mutation.state}
                      navigationRef={editorNavigation}
                      onSave={(input) => saveRow(input, editor.version)}
                      onClose={() => setEditor(null)}
                      onReload={reload}
                    />
                  </ImportReviewPanel>
                ) : (
                  <div className="import-review-placeholder">
                    <ScheduleIcon name="check" />
                    <h2>검토할 이용객을 선택하세요</h2>
                    <p>정보를 확인하고 수정하거나 제외할 수 있습니다.</p>
                  </div>
                )}
              </div>
              {editable && (
                <ImportConfirmation
                  summary={summary}
                  confirming={confirming}
                  busy={mutation.state.busy}
                  canConfirm={canConfirm && !editor}
                  confirmationRef={confirmation}
                  onOpen={() => {
                    requestTransition(() => {
                      setNotice('');
                      setConfirming(true);
                    });
                  }}
                  onClose={() => setConfirming(false)}
                  onConfirm={() => {
                    void mutation.run(
                      (signal) =>
                        confirmStayImport(
                          id,
                          { expectedVersion: batch.version },
                          token,
                          signal,
                        ),
                      (receipt) => {
                        setConfirming(false);
                        setNotice(
                          `${receipt.createdCount}건의 이용 일정을 등록했습니다. ${receipt.skippedCount}건은 제외했습니다.`,
                        );
                        refresh();
                      },
                    );
                  }}
                />
              )}
            </>
          );
        })()
      )}
    </div>
  );
}
