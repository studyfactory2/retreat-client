import { useEffect, useRef, useState } from 'react';
import {
  Link,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { SubmissionRecord } from './components/SubmissionRecord';
import { SubmissionPhotos } from './components/SubmissionPhotos';
import { SubmissionHistory } from './components/SubmissionHistory';
import {
  SubmissionStayLink,
  type SubmissionLinkEditState,
} from './components/SubmissionStayLink';
import { useSubmissionLinkNavigation } from './hooks/use-submission-link-navigation';
import {
  submissionActionLabel,
  submissionRoleLabel,
  submissionSourceLabel,
  submissionTime,
  submissionTypeLabel,
} from './model/submission-detail-model';
import {
  readSubmissionListFilters,
  submissionListSearch,
} from './model/submission-list-model';
import { useSubmissionDetail } from './hooks/use-submission-detail';
import { maintenanceReturnPath } from '../maintenance/model/maintenance-navigation';
import './styles/submission-detail.css';

export function AdminSubmissionDetailScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <SubmissionWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function SubmissionWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh } = useSubmissionDetail(id, token, rejectSession);
  const navigate = useNavigate();
  const [editState, setEditState] = useState<SubmissionLinkEditState>({
    dirty: false,
    busy: false,
  });
  const [notice, setNotice] = useState<string>();
  const navigation = useSubmissionLinkNavigation(
    editState.dirty,
    editState.busy,
  );
  const discardPrompt = useRef<HTMLElement>(null);
  const discardTrigger = useRef<HTMLElement | null>(null);
  useEffect(() => {
    if (navigation.pending) {
      discardTrigger.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      discardPrompt.current?.focus();
    }
  }, [navigation.pending]);
  const refreshRecord = () =>
    navigation.request(() => {
      setNotice(undefined);
      refresh();
    });
  const [search] = useSearchParams();
  const maintenanceReturn = maintenanceReturnPath(search);
  const returnTo =
    maintenanceReturn ??
    `/admin/submissions${submissionListSearch(readSubmissionListFilters(search))}`;
  const returnLabel = maintenanceReturn ? '정비 목록으로' : '제출 목록으로';
  useEffect(() => {
    if (resource.status !== 'loading')
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [resource.status]);
  if (resource.status !== 'ready')
    return (
      <div
        className="submission-detail"
        role={resource.status === 'error' ? 'alert' : 'status'}
      >
        <PageState
          title={
            resource.status === 'error'
              ? '제출 내용을 불러오지 못했습니다'
              : '제출 내용을 불러오는 중'
          }
          description={
            resource.status === 'error'
              ? resource.message
              : '저장된 체크리스트와 첨부 정보를 확인하고 있습니다.'
          }
        >
          {resource.status === 'error' && (
            <Button onClick={refresh}>다시 불러오기</Button>
          )}
          <Link className="ui-button admin-button-secondary" to={returnTo}>
            {returnLabel}
          </Link>
        </PageState>
      </div>
    );
  const detail = resource.data;
  const revision = detail.revision;
  return (
    <div className="submission-detail">
      <header className="submission-detail-heading">
        <div>
          <p className="submission-detail-eyebrow">SUBMISSION RECORD</p>
          <h1>{submissionTypeLabel(revision.record.type)} 상세</h1>
          <p>
            {revision.record.property.name} · {revision.record.author.name} ·{' '}
            {revision.record.visitDate}
          </p>
        </div>
        <div className="submission-detail-actions">
          <Link
            className="ui-button admin-button-secondary"
            to={returnTo}
            aria-disabled={editState.busy || undefined}
            onClick={(event) => {
              event.preventDefault();
              navigation.request(() => navigate(returnTo));
            }}
          >
            {returnLabel}
          </Link>
          <Button
            className="admin-button-secondary"
            disabled={editState.busy}
            onClick={refreshRecord}
          >
            새로고침
          </Button>
        </div>
      </header>
      {notice && (
        <p className="submission-detail-notice" role="status">
          {notice}
        </p>
      )}
      {navigation.pending && (
        <section
          className="submission-detail-card"
          role="alertdialog"
          ref={discardPrompt}
          tabIndex={-1}
          aria-labelledby="submission-link-discard-title"
        >
          <h2 id="submission-link-discard-title">
            입력한 연결 변경 내용을 버릴까요?
          </h2>
          <p>아직 저장하지 않은 선택과 사유는 사라집니다.</p>
          <div className="submission-detail-actions">
            <Button
              className="admin-button-secondary"
              onClick={() => {
                navigation.keep();
                discardTrigger.current?.focus();
              }}
            >
              계속 작성
            </Button>
            <Button onClick={navigation.discard}>입력 버리고 계속</Button>
          </div>
        </section>
      )}
      <section className="submission-detail-card submission-current-revision">
        <div className="submission-detail-section-heading">
          <h2>현재 저장된 내용 · 버전 {detail.currentRevision}</h2>
          <span
            className={`submission-detail-badge${detail.status === 'CANCELLED' ? ' submission-detail-badge--danger' : ''}`}
          >
            {detail.status === 'CANCELLED' ? '취소됨' : '제출됨'}
          </span>
        </div>
        <p>
          {submissionActionLabel(revision.action)} ·{' '}
          {submissionTime(revision.createdAt)} · {revision.actor.name} (
          {submissionRoleLabel(revision.actor.role)} /{' '}
          {submissionSourceLabel(revision.actorSource)})
        </p>
        {revision.reason && (
          <p className="submission-detail-text">
            <strong>사유: </strong>
            {revision.reason}
          </p>
        )}
        {detail.status === 'CANCELLED' && (
          <p className="submission-detail-notice">
            취소된 제출 기록입니다. 취소 전후의 저장 내용은 아래 이력에서 확인할
            수 있습니다.
          </p>
        )}
      </section>
      {revision.record.type !== 'MAINTENANCE' && (
        <SubmissionStayLink
          key={`stay-link:${revision.id}`}
          detail={detail}
          token={token}
          rejectSession={rejectSession}
          onEditStateChange={setEditState}
          onRefresh={refreshRecord}
          onOpenStay={() =>
            navigation.request(() =>
              navigate(`/admin/stays/${revision.record.stayId}?view=list`),
            )
          }
          onSaved={(receipt) => {
            navigation.keep();
            setEditState({ dirty: false, busy: false });
            setNotice(
              receipt.changed
                ? '이용 일정 연결 변경이 저장되었습니다. 아래는 최신 제출 기록입니다.'
                : '연결 내용을 확인했습니다. 저장된 연결과 같아 새 이력은 추가되지 않았습니다.',
            );
            refresh();
          }}
        />
      )}
      <SubmissionRecord record={revision.record} />
      <SubmissionPhotos
        key={revision.id}
        revision={revision}
        token={token}
        rejectSession={rejectSession}
      />
      <SubmissionHistory
        submissionId={detail.id}
        currentRevision={detail.currentRevision}
        token={token}
        rejectSession={rejectSession}
        onRefreshDetail={refreshRecord}
      />
    </div>
  );
}
