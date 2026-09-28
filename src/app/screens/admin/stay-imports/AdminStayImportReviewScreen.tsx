import { useEffect, useRef, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import {
  confirmStayImport,
  reviewStayImport,
} from '../../../features/admin-stay-imports/admin-stay-imports-api';
import type {
  StayImportRowDto,
  ReviewStayImportRowInput,
} from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { isStayRevision } from '../../../features/admin-stays/admin-stays-validation';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { ImportRowEditor } from './components/ImportRowEditor';
import { ImportRows } from './components/ImportRows';
import { ImportMutationNotice } from './components/ImportMutationNotice';
import { readImportFilters, importFilterSearch } from './model/import-review-model';
import { useStayImport, useImportMutation } from './hooks/use-stay-import';
import { ImportBatchSummary } from './components/ImportBatchSummary';
import { ImportRowFilters } from './components/ImportRowFilters';
import { ImportConfirmation } from './components/ImportConfirmation';
import './styles/stay-import.css';

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
  const [skip, setSkip] = useState<{
    row: StayImportRowDto;
    version: number;
  } | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [notice, setNotice] = useState('');
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
    if (confirming || skip) confirmation.current?.focus();
  }, [confirming, skip]);
  useEffect(() => {
    if (resource.status === 'ready' && !editor)
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [resource.status, editor]);

  function reload() {
    setEditor(null);
    setSkip(null);
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
        setSkip(null);
        setConfirming(false);
        setNotice('검토 내용을 저장하고 명단 전체를 다시 확인했습니다.');
        refresh();
      },
    );
  }
  if (editor)
    return (
      <div className="stay-import">
        {options.resource.status === 'error' && (
          <div
            className="stay-import-notice stay-import-notice--error"
            role="alert"
          >
            <p>{options.resource.message}</p>
            <Button onClick={options.refresh}>휴양소 다시 불러오기</Button>
          </div>
        )}
        {options.resource.status === 'loading' && (
          <p role="status">휴양소 목록을 불러오는 중입니다.</p>
        )}
        <ImportRowEditor
          key={`${editor.row.id}:${editor.version}`}
          row={editor.row}
          properties={properties}
          propertiesReady={options.resource.status === 'ready'}
          state={mutation.state}
          onSave={(input) => saveRow(input, editor.version)}
          onClose={() => {
            setEditor(null);
          }}
          onReload={reload}
        />
      </div>
    );

  return (
    <div className="stay-import">
      <header className="stay-import-heading">
        <div>
          <p className="stay-import-eyebrow">ROSTER IMPORT</p>
          <h1>엑셀 명단 검토</h1>
          <p>원본과 검토 결과를 확인한 뒤 이용 일정을 등록하세요.</p>
        </div>
        <div className="stay-import-actions">
          <Link className="ui-button admin-button-secondary" to="/admin/stays">
            일정 목록
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || resource.status === 'loading'}
            onClick={reload}
          >
            새로고침
          </Button>
        </div>
      </header>
      {notice && (
        <p
          className="stay-import-notice stay-import-notice--success"
          role="status"
        >
          {notice}
        </p>
      )}
      <ImportMutationNotice
        state={mutation.state}
        rows={resource.status === 'ready' ? resource.data.rows.items : []}
        onReload={reload}
      />
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
              <ImportBatchSummary batch={batch} />
              {options.resource.status === 'error' && (
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
                disabled={mutation.state.busy || !!skip || confirming}
                onChange={(next) => setSearch(importFilterSearch(next))}
              />
              {skip && (
                <div
                  className="stay-import-notice"
                  role="alertdialog"
                  aria-labelledby="import-skip-heading"
                  tabIndex={-1}
                  ref={confirmation}
                >
                  <h2 id="import-skip-heading">
                    이 행을 가져오기에서 제외할까요?
                  </h2>
                  <p>
                    {skip.row.sheetName} · {skip.row.rowNumber}행 ·{' '}
                    {skip.row.normalizedData?.guestName ?? '이름 미입력'}
                  </p>
                  <p>확정 전에는 다시 포함할 수 있습니다.</p>
                  <div className="stay-import-actions">
                    <Button
                      disabled={mutation.state.busy}
                      className="admin-button-secondary"
                      onClick={() => setSkip(null)}
                    >
                      돌아가기
                    </Button>
                    <Button
                      disabled={locked}
                      loading={mutation.state.busy}
                      onClick={() =>
                        saveRow(
                          { id: skip.row.id, action: 'SKIP' },
                          skip.version,
                        )
                      }
                    >
                      이 행 제외
                    </Button>
                  </div>
                </div>
              )}
              {rows.items.length ? (
                <ImportRows
                  rows={rows.items}
                  properties={properties}
                  editable={editable}
                  busy={locked || !!skip || confirming}
                  onEdit={(row) => {
                    setNotice('');
                    setEditor({ row, version: batch.version });
                  }}
                  onSkip={(row) => {
                    setNotice('');
                    setSkip({ row, version: batch.version });
                  }}
                />
              ) : (
                <div className="stay-import-card">
                  <h2>조건에 맞는 행이 없습니다.</h2>
                  <p>필터를 변경해 다른 행을 확인해 주세요.</p>
                  <Button
                    className="admin-button-secondary"
                    disabled={mutation.state.busy}
                    onClick={() => setSearch({})}
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
                    disabled={
                      filters.page <= 1 || locked || !!skip || confirming
                    }
                    onClick={() =>
                      setSearch(
                        importFilterSearch({
                          ...filters,
                          page: filters.page - 1,
                        }),
                      )
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
                      !!skip ||
                      confirming
                    }
                    onClick={() =>
                      setSearch(
                        importFilterSearch({
                          ...filters,
                          page: filters.page + 1,
                        }),
                      )
                    }
                  >
                    다음
                  </Button>
                </nav>
              )}
              {editable && (
                <ImportConfirmation
                  summary={summary}
                  confirming={confirming}
                  busy={mutation.state.busy}
                  canConfirm={canConfirm && !skip}
                  confirmationRef={confirmation}
                  onOpen={() => {
                    setNotice('');
                    setConfirming(true);
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
