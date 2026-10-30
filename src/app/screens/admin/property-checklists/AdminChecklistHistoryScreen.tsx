import { useCallback, useEffect, useRef } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import {
  getChecklistVersion,
  getChecklistVersionHistory,
} from '../../../features/admin-checklist-templates/admin-checklist-history-api';
import type {
  ChecklistTemplateDto,
  ChecklistType,
} from '../../../features/admin-checklist-templates/admin-checklist-template.types';
import type { ChecklistVersionDetail } from '../../../features/admin-checklist-templates/admin-checklist-history.types';
import { MAX_CHECKLIST_HISTORY_PAGE } from '../../../features/admin-checklist-templates/admin-checklist-history-readers';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { AdminBackButton } from '../components/AdminBackButton';
import { ChecklistPreview } from './components/ChecklistPreview';
import { useChecklistResource } from './hooks/use-checklist-resource';
import { useChecklistHistoryRequest } from './hooks/use-checklist-history-request';
import {
  checklistEditorPath,
  checklistTypeLabels,
  parseChecklistType,
} from './model/checklist-form-model';
import './styles/property-checklists.css';
import './styles/checklist-history.css';

type SessionProps = { token: string; rejectSession: (token: string) => void };
const dateFormatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});
function readPositive(value: string | null, fallback?: number) {
  if (value === null) return fallback;
  if (!/^[1-9]\d{0,9}$/.test(value)) return undefined;
  const number = Number(value);
  return number <= 2147483647 ? number : undefined;
}

export function AdminChecklistHistoryScreen() {
  const { id = '', type: segment } = useParams();
  const { state, rejectSession } = useAdminSession();
  const type = parseChecklistType(segment);
  if (state.status !== 'authenticated') return null;
  if (!type)
    return (
      <PageState
        title="체크리스트 유형을 확인해 주세요"
        description="입실·퇴실·정비 체크리스트에서 선택해 주세요."
      >
        <Link className="ui-button" to={appRoutes.adminProperties}>
          휴양소 목록
        </Link>
      </PageState>
    );
  return (
    <HistoryWorkspace
      key={`${id}:${type}:${state.user.id}:${state.expiresAt}`}
      id={id}
      type={type}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function HistoryWorkspace({
  id,
  type,
  token,
  rejectSession,
}: SessionProps & { id: string; type: ChecklistType }) {
  const { resource, refresh } = useChecklistResource(
    id,
    type,
    token,
    rejectSession,
  );
  return (
    <div className="checklist-workspace checklist-history-workspace">
      <header className="checklist-heading">
        <div>
          <p className="checklist-heading__eyebrow">
            {checklistTypeLabels[type]}
          </p>
          <div className="admin-page-heading-title">
            <AdminBackButton
              fallback={appRoutes.adminPropertyChecklists.replace(':id', id)}
              label="이전 페이지로 돌아가기"
            />
            <h1>버전 이력</h1>
          </div>
          <p>
            {resource.status === 'ready'
              ? resource.data.property.name
              : '저장된 체크리스트 구성을 확인합니다.'}
          </p>
        </div>
        <div className="checklist-actions">
          <Link
            className="ui-button admin-button-secondary"
            to={checklistEditorPath(id, type)}
          >
            현재 구성
          </Link>
        </div>
      </header>
      {resource.status === 'ready' ? (
        resource.data.template ? (
          <HistoryBrowser
            key={resource.data.template.id}
            template={resource.data.template}
            token={token}
            rejectSession={rejectSession}
          />
        ) : (
          <p className="checklist-history-state" role="status">
            아직 설정된 체크리스트가 없습니다.
          </p>
        )
      ) : (
        <HistoryState
          status={resource.status}
          message={resource.status === 'error' ? resource.message : undefined}
          retry={refresh}
        />
      )}
    </div>
  );
}

function HistoryBrowser({
  template,
  token,
  rejectSession,
}: SessionProps & { template: ChecklistTemplateDto }) {
  const [params, setParams] = useSearchParams();
  const page = readPositive(params.get('page'), 1);
  const selected = readPositive(params.get('version'));
  const invalid =
    page === undefined ||
    page > MAX_CHECKLIST_HISTORY_PAGE ||
    (params.has('version') && selected === undefined);
  if (invalid)
    return (
      <div className="checklist-history-state" role="alert">
        <p>페이지 또는 버전 번호를 확인해 주세요.</p>
        <Button onClick={() => setParams({}, { replace: true })}>
          버전 목록으로
        </Button>
      </div>
    );
  return (
    <HistoryContent
      template={template}
      token={token}
      rejectSession={rejectSession}
      page={page}
      selected={selected}
      select={(version) =>
        setParams({
          page: String(page),
          ...(version ? { version: String(version) } : {}),
        })
      }
      changePage={(next) => setParams({ page: String(next) })}
    />
  );
}

function HistoryContent({
  template,
  token,
  rejectSession,
  page,
  selected,
  select,
  changePage,
}: SessionProps & {
  template: ChecklistTemplateDto;
  page: number;
  selected?: number;
  select: (version?: number) => void;
  changePage: (page: number) => void;
}) {
  const load = useCallback(
    (signal: AbortSignal) =>
      getChecklistVersionHistory(template.id, page, token, signal),
    [template.id, page, token],
  );
  const { resource, retry } = useChecklistHistoryRequest(
    load,
    token,
    rejectSession,
  );
  const listHeading = useRef<HTMLHeadingElement>(null);
  const previous = useRef({ page, selected });
  useEffect(() => {
    if (
      previous.current.page !== page ||
      (previous.current.selected && !selected)
    )
      listHeading.current?.focus({ preventScroll: true });
    previous.current = { page, selected };
  }, [page, selected]);
  const data = resource.status === 'ready' ? resource.data : undefined;
  const displayedVersion = selected ?? data?.items[0]?.version;
  return (
    <>
      <p className="checklist-scope-note">
        시작할 때의 버전으로 점검을 완료합니다. 이곳에서는 과거 구성을 확인할 수
        있습니다.
      </p>
      <div
        className={`checklist-history${selected ? ' checklist-history--selected' : ''}`}
      >
        <section
          className="checklist-history__list"
          aria-labelledby="checklist-history-list-title"
        >
          <header className="checklist-history__list-heading">
            <h2
              id="checklist-history-list-title"
              tabIndex={-1}
              ref={listHeading}
            >
              저장된 버전 {data && <span>{data.total}개</span>}
            </h2>
            <Button
              className="admin-button-secondary"
              disabled={resource.status === 'loading'}
              onClick={retry}
            >
              새로고침
            </Button>
          </header>
          {data ? (
            <>
              {data.items.length ? (
                <ol className="checklist-history__rows">
                  {data.items.map((item) => (
                    <li key={item.version}>
                      <button
                        type="button"
                        className="checklist-history-row"
                        aria-current={
                          displayedVersion === item.version ? 'true' : undefined
                        }
                        onClick={() => select(item.version)}
                      >
                        <span className="checklist-history-row__top">
                          <strong>버전 {item.version}</strong>
                          <span className="checklist-badge">
                            {item.version === data.currentVersion
                              ? '현재'
                              : item.source === 'BASELINE'
                                ? '기존 구성'
                                : `${item.itemCount}항목`}
                          </span>
                        </span>
                        <span className="checklist-history-row__title">
                          {item.title}
                        </span>
                        <span className="checklist-history-row__meta">
                          {dateFormatter.format(new Date(item.publishedAt))}
                          <br />
                          {item.actor?.name ?? '이력 도입 전 저장 구성'}
                        </span>
                        <span
                          className="checklist-history-row__arrow"
                          aria-hidden="true"
                        >
                          →
                        </span>
                      </button>
                    </li>
                  ))}
                </ol>
              ) : (
                <div className="checklist-history-state">
                  <p>
                    {page > 1
                      ? '이 페이지에 저장된 버전이 없습니다.'
                      : '저장된 버전 이력이 없습니다.'}
                  </p>
                  {page > 1 && (
                    <Button
                      className="admin-button-secondary"
                      onClick={() => changePage(1)}
                    >
                      첫 페이지로
                    </Button>
                  )}
                </div>
              )}
              <nav
                className="checklist-history__pagination"
                aria-label="버전 이력 페이지"
              >
                <Button
                  className="admin-button-secondary"
                  disabled={page <= 1}
                  onClick={() => changePage(page - 1)}
                >
                  이전
                </Button>
                <span>
                  {page} / {Math.max(data.totalPages, 1)}
                </span>
                <Button
                  className="admin-button-secondary"
                  disabled={page >= data.totalPages}
                  onClick={() => changePage(page + 1)}
                >
                  다음
                </Button>
              </nav>
            </>
          ) : (
            <HistoryState
              status={resource.status}
              message={
                resource.status === 'error' ? resource.message : undefined
              }
              retry={retry}
            />
          )}
        </section>
        <section
          className="checklist-history__detail"
          aria-label="선택한 버전의 구성"
        >
          <Button
            className="admin-button-secondary checklist-history__back"
            onClick={() => select()}
          >
            ← 버전 목록
          </Button>
          {displayedVersion ? (
            <VersionDetail
              key={`${template.id}:${displayedVersion}`}
              version={displayedVersion}
              template={template}
              token={token}
              rejectSession={rejectSession}
              currentVersion={data?.currentVersion}
              focus={!!selected}
            />
          ) : (
            <p className="checklist-history-state">
              버전을 선택하면 당시 구성이 표시됩니다.
            </p>
          )}
        </section>
      </div>
    </>
  );
}

function VersionDetail({
  template,
  version,
  currentVersion,
  focus,
  token,
  rejectSession,
}: SessionProps & {
  template: ChecklistTemplateDto;
  version: number;
  currentVersion?: number;
  focus: boolean;
}) {
  const load = useCallback(
    async (signal: AbortSignal) => {
      const detail = await getChecklistVersion(
        template.id,
        version,
        token,
        signal,
      );
      if (
        detail.propertyId !== template.propertyId ||
        detail.type !== template.type
      )
        throw new Error('Unexpected checklist version scope');
      return detail;
    },
    [template.id, template.propertyId, template.type, version, token],
  );
  const { resource, retry } = useChecklistHistoryRequest(
    load,
    token,
    rejectSession,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (focus && resource.status === 'ready')
      heading.current?.focus({ preventScroll: false });
  }, [focus, resource.status]);
  if (resource.status !== 'ready')
    return (
      <HistoryState
        status={resource.status}
        message={resource.status === 'error' ? resource.message : undefined}
        retry={retry}
      />
    );
  const item: ChecklistVersionDetail = resource.data;
  return (
    <article className="checklist-version">
      <header className="checklist-version__heading">
        <div>
          <p className="checklist-eyebrow">읽기 전용</p>
          <h2 ref={heading} tabIndex={-1}>
            버전 {item.version}{' '}
            {currentVersion === item.version && (
              <span className="checklist-badge checklist-badge--active">
                현재
              </span>
            )}
          </h2>
        </div>
        <span
          className={`checklist-badge${item.isActive ? ' checklist-badge--active' : ''}`}
        >
          {item.isActive ? '당시 설정 · 사용' : '당시 설정 · 중지'}
        </span>
      </header>
      <dl className="checklist-version__facts">
        <div>
          <dt>
            {item.source === 'BASELINE' ? '당시 최종 저장' : '저장 일시'} · 한국
            시간
          </dt>
          <dd>{dateFormatter.format(new Date(item.publishedAt))}</dd>
        </div>
        <div>
          <dt>저장자</dt>
          <dd>{item.actor?.name ?? '이전 저장자 정보 없음'}</dd>
        </div>
        <div>
          <dt>구성</dt>
          <dd>
            {item.sectionCount}구역 · {item.itemCount}항목
          </dd>
        </div>
      </dl>
      {item.source === 'BASELINE' && (
        <p className="checklist-version__baseline">
          이력 기능 도입 당시의 구성입니다. 그 이전 변경 이력은 제공되지
          않습니다.
        </p>
      )}
      <ChecklistPreview
        title={item.title}
        sections={item.definition.sections}
        archived
      />
    </article>
  );
}

function HistoryState({
  status,
  message,
  retry,
}: {
  status: string;
  message?: string;
  retry: () => void;
}) {
  return (
    <div
      className="checklist-history-state"
      role={status === 'error' ? 'alert' : 'status'}
    >
      <p>{status === 'error' ? message : '버전 정보를 불러오는 중입니다.'}</p>
      {status === 'error' && (
        <Button className="admin-button-secondary" onClick={retry}>
          다시 불러오기
        </Button>
      )}
    </div>
  );
}
