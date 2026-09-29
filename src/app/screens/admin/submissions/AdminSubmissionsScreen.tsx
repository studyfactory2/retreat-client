import { useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { SubmissionListFilters } from './components/SubmissionListFilters';
import { SubmissionRows } from './components/SubmissionRows';
import {
  readSubmissionListFilters,
  submissionFilterErrors,
  submissionListSearch,
} from './model/submission-list-model';
import { useAdminSubmissions } from './hooks/use-admin-submissions';
import './styles/submission-list.css';

export function AdminSubmissionsScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <SubmissionListWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function SubmissionListWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search, setSearch] = useSearchParams();
  const input = readSubmissionListFilters(search);
  const query = submissionListSearch(input);
  const filterErrors = submissionFilterErrors(input);
  const invalidFilters = Object.keys(filterErrors).length > 0;
  const { resource, refresh } = useAdminSubmissions(
    input,
    token,
    rejectSession,
    !invalidFilters,
  );
  const properties = useAdminPropertyOptions(token, rejectSession);
  const correctedPage =
    resource.status === 'ready' &&
    input.page > Math.max(1, resource.data.totalPages)
      ? Math.max(1, resource.data.totalPages)
      : null;
  const filtered = !!(
    input.propertyId ||
    input.stayId ||
    input.type ||
    input.status ||
    input.linkStatus ||
    input.from ||
    input.to
  );
  useEffect(() => {
    if (correctedPage !== null) {
      setSearch(
        submissionListSearch({
          ...readSubmissionListFilters(new URLSearchParams(query)),
          page: correctedPage,
        }),
        { replace: true },
      );
    } else if (search.toString() !== query.slice(1)) {
      setSearch(query, { replace: true });
    }
  }, [correctedPage, query, search, setSearch]);
  return (
    <div className="admin-submissions">
      <header className="submission-heading">
        <div>
          <p className="submission-heading__eyebrow">운영 기록</p>
          <h1>체크리스트 기록</h1>
          <p>현재 저장된 입실·퇴실·정비 기록을 확인하세요.</p>
        </div>
        <Button
          className="admin-button-secondary"
          disabled={!invalidFilters && resource.status === 'loading'}
          onClick={() => {
            refresh();
            properties.refresh();
          }}
        >
          새로고침
        </Button>
      </header>
      {input.stayId && (
        <div className="submission-linked-filter">
          <div>
            <strong>연결된 이용 일정의 기록</strong>
            <p>선택한 일정에 연결된 기록만 조회하고 있습니다.</p>
          </div>
          <Button
            className="admin-button-secondary"
            onClick={() =>
              setSearch(
                submissionListSearch({ ...input, page: 1, stayId: undefined }),
              )
            }
          >
            연결된 일정 조건 해제
          </Button>
        </div>
      )}
      <SubmissionListFilters
        key={query}
        input={input}
        properties={
          properties.resource.status === 'ready'
            ? properties.resource.data
            : undefined
        }
        propertiesLoading={properties.resource.status === 'loading'}
        onApply={(next) => setSearch(submissionListSearch(next))}
      />
      {properties.resource.status === 'error' && (
        <div className="submission-banner" role="alert">
          <p>
            휴양소 선택 목록을 불러오지 못했습니다.{' '}
            {properties.resource.message}
          </p>
          <Button
            className="admin-button-secondary"
            onClick={properties.refresh}
          >
            휴양소 다시 불러오기
          </Button>
        </div>
      )}
      {invalidFilters ? (
        <div className="submission-banner" role="alert">
          <strong>기록 조회 조건을 확인해 주세요.</strong>
          <p>{Object.values(filterErrors).join(' ')}</p>
          <p>조건을 수정하고 조회하면 기록을 불러옵니다.</p>
        </div>
      ) : resource.status === 'loading' || correctedPage !== null ? (
        <div role="status">
          <PageState
            title="체크리스트 기록을 불러오는 중"
            description="조회 조건에 맞는 기록을 확인하고 있습니다."
          />
        </div>
      ) : resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="체크리스트 기록을 불러오지 못했습니다"
            description={resource.message}
          >
            <Button onClick={refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : (
        <>
          <div className="submission-list-summary" role="status">
            <p>
              {filtered ? '조회 결과' : '전체 기록'}{' '}
              <strong>{resource.data.total.toLocaleString('ko-KR')}건</strong>
            </p>
            <span>
              이상 응답은 체크리스트 답변 기준이며, 현재 처리 중인 문제 수와
              다릅니다.
            </span>
          </div>
          {resource.data.items.length === 0 ? (
            <PageState
              title={
                filtered
                  ? '조건에 맞는 기록이 없습니다'
                  : '제출된 체크리스트 기록이 없습니다'
              }
              description={
                filtered
                  ? '휴양소, 유형, 상태, 일정 연결 또는 방문일 조건을 변경해 주세요.'
                  : '제출된 입실·퇴실·정비 체크리스트가 이곳에 표시됩니다.'
              }
            >
              {filtered && (
                <Button
                  onClick={() =>
                    setSearch(
                      submissionListSearch({ page: 1, stayId: input.stayId }),
                    )
                  }
                >
                  조회 조건 초기화
                </Button>
              )}
            </PageState>
          ) : (
            <SubmissionRows items={resource.data.items} detailSearch={query} />
          )}
          {resource.data.totalPages > 1 && (
            <nav
              className="submission-pagination"
              aria-label="체크리스트 기록 페이지"
            >
              <Button
                className="admin-button-secondary"
                disabled={input.page <= 1}
                onClick={() =>
                  setSearch(
                    submissionListSearch({ ...input, page: input.page - 1 }),
                  )
                }
              >
                이전
              </Button>
              <span aria-current="page">
                {input.page} / {resource.data.totalPages} 페이지
              </span>
              <Button
                className="admin-button-secondary"
                disabled={input.page >= resource.data.totalPages}
                onClick={() =>
                  setSearch(
                    submissionListSearch({ ...input, page: input.page + 1 }),
                  )
                }
              >
                다음
              </Button>
            </nav>
          )}
        </>
      )}
    </div>
  );
}
