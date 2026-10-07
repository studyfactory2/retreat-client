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
import { SubmissionLifecycle } from './components/SubmissionLifecycle';
import { submissionLifecycleSavedMessage } from './model/submission-lifecycle-model';
import { SubmissionCorrection } from './components/SubmissionCorrection';
import { SubmissionRecord } from './components/SubmissionRecord';
import { SubmissionCurrentSummary } from './components/SubmissionCurrentSummary';
import { SubmissionPhotos } from './components/SubmissionPhotos';
import { SubmissionHistory } from './components/SubmissionHistory';
import {
  SubmissionStayLink,
  type SubmissionLinkEditState,
} from './components/SubmissionStayLink';
import { useSubmissionLinkNavigation } from './hooks/use-submission-link-navigation';
import { submissionTypeLabel } from './model/submission-detail-model';
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
  const [activeEditor, setActiveEditor] = useState<
    'stay' | 'correction' | 'cancel' | 'restore'
  >('stay');
  const [notice, setNotice] = useState<string>();
  const navigation = useSubmissionLinkNavigation(
    editState.dirty,
    editState.busy,
  );
  const discardPrompt = useRef<HTMLElement>(null);
  const management = useRef<HTMLElement>(null);
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
      setEditState({ dirty: false, busy: false });
      setActiveEditor('stay');
      refresh();
    });
  function changeEditor(next: 'stay' | 'correction' | 'cancel' | 'restore') {
    if (
      editState.busy ||
      editState.blocked ||
      navigation.pending ||
      next === activeEditor
    )
      return;
    navigation.request(() => {
      setEditState({ dirty: false, busy: false });
      setActiveEditor(next);
    });
  }
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
          <h1>{submissionTypeLabel(revision.record.type)} 상세</h1>
        </div>
        <div className="submission-detail-actions">
          {(detail.currentRevision < 2_147_483_647 ||
            revision.record.type !== 'MAINTENANCE') && (
            <Button
              className="admin-button-secondary"
              onClick={() => {
                management.current?.focus({ preventScroll: true });
                management.current?.scrollIntoView({ block: 'start' });
              }}
            >
              기록 관리
            </Button>
          )}
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
            저장하지 않은 변경 내용을 버릴까요?
          </h2>
          <p>아직 저장하지 않은 답변, 선택과 사유는 사라집니다.</p>
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
      <SubmissionCurrentSummary detail={detail} />
      <div className="submission-detail-evidence">
        <SubmissionRecord record={revision.record} />
        <SubmissionPhotos
          key={revision.id}
          revision={revision}
          token={token}
          rejectSession={rejectSession}
        />
      </div>
      <section
        className="submission-management"
        aria-label="제출 기록 관리"
        ref={management}
        tabIndex={-1}
      >
        {detail.currentRevision < 2_147_483_647 && (
          <div
            className="submission-detail-actions submission-management-toolbar"
            aria-label="제출 기록 관리"
          >
            {detail.status === 'SUBMITTED' && (
              <Button
                className={
                  activeEditor === 'correction' ? '' : 'admin-button-secondary'
                }
                disabled={
                  editState.busy ||
                  !!editState.blocked ||
                  navigation.pending ||
                  activeEditor === 'correction'
                }
                aria-expanded={activeEditor === 'correction'}
                onClick={() => changeEditor('correction')}
              >
                내용 정정
              </Button>
            )}
            {detail.status === 'SUBMITTED' ? (
              <Button
                className="admin-button-secondary submission-lifecycle-danger"
                disabled={
                  editState.busy ||
                  !!editState.blocked ||
                  navigation.pending ||
                  activeEditor === 'cancel'
                }
                aria-expanded={activeEditor === 'cancel'}
                onClick={() => changeEditor('cancel')}
              >
                제출 취소
              </Button>
            ) : (
              <Button
                className="admin-button-secondary"
                disabled={
                  editState.busy ||
                  !!editState.blocked ||
                  navigation.pending ||
                  activeEditor === 'restore'
                }
                aria-expanded={activeEditor === 'restore'}
                onClick={() => changeEditor('restore')}
              >
                제출 복원
              </Button>
            )}
            {activeEditor !== 'stay' && (
              <Button
                className="admin-button-secondary"
                disabled={
                  editState.busy || !!editState.blocked || navigation.pending
                }
                onClick={() => changeEditor('stay')}
              >
                {revision.record.type === 'MAINTENANCE' ||
                detail.status === 'CANCELLED'
                  ? '변경 닫기'
                  : '이용 일정 연결로'}
              </Button>
            )}
          </div>
        )}
        <fieldset
          className="submission-editor-boundary"
          disabled={navigation.pending}
          aria-label="제출 기록 변경"
        >
          {activeEditor === 'cancel' || activeEditor === 'restore' ? (
            <SubmissionLifecycle
              key={`lifecycle:${activeEditor}:${revision.id}`}
              detail={detail}
              action={activeEditor}
              token={token}
              rejectSession={rejectSession}
              onEditStateChange={setEditState}
              onReload={refreshRecord}
              onClose={() => changeEditor('stay')}
              onSaved={(receipt) => {
                navigation.keep();
                setEditState({ dirty: false, busy: false });
                setActiveEditor('stay');
                setNotice(
                  submissionLifecycleSavedMessage(
                    activeEditor,
                    receipt.revision,
                  ),
                );
                refresh();
              }}
            />
          ) : activeEditor === 'correction' && detail.status === 'SUBMITTED' ? (
            <SubmissionCorrection
              key={`correction:${revision.id}`}
              detail={detail}
              token={token}
              rejectSession={rejectSession}
              onEditStateChange={setEditState}
              onReload={refreshRecord}
              onClose={() => changeEditor('stay')}
              onSaved={(receipt) => {
                navigation.keep();
                setEditState({ dirty: false, busy: false });
                setActiveEditor('stay');
                setNotice(
                  receipt.changed
                    ? `정정 내용을 버전 ${receipt.revision}으로 저장했습니다. 현재 내용과 처리 이력을 확인해 주세요.`
                    : '저장된 답변·메모와 같아 새 정정 이력은 추가되지 않았습니다.',
                );
                refresh();
              }}
            />
          ) : (
            revision.record.type !== 'MAINTENANCE' && (
              <SubmissionStayLink
                key={`stay-link:${revision.id}`}
                detail={detail}
                token={token}
                rejectSession={rejectSession}
                onEditStateChange={setEditState}
                onRefresh={refreshRecord}
                onOpenStay={() =>
                  navigation.request(() =>
                    navigate(
                      `/admin/stays/${revision.record.stayId}?view=list`,
                    ),
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
            )
          )}
        </fieldset>
      </section>
      <details className="submission-detail-disclosure submission-history-disclosure">
        <summary>
          <span>
            <strong>
              제출 이력{' '}
              <span className="submission-disclosure-version">
                버전 {detail.currentRevision}
              </span>
            </strong>
            <span className="submission-detail-caption">
              이전 저장 내용 · 변경 사유 · 당시 사진
            </span>
          </span>
          <span className="submission-disclosure-indicator" aria-hidden="true">
            +
          </span>
        </summary>
        <div className="submission-disclosure-body">
          <SubmissionHistory
            submissionId={detail.id}
            currentRevision={detail.currentRevision}
            token={token}
            rejectSession={rejectSession}
            onRefreshDetail={refreshRecord}
          />
        </div>
      </details>
    </div>
  );
}
