import { useEffect, useState } from 'react';
import {
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { updateAdminStay } from '../../../features/admin-stays/admin-stays-api';
import type { AdminStayDto } from '../../../features/admin-stays/admin-stays.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { StayStatusAction } from './StayStatusAction';
import { StayHistory } from './StayHistory';
import { isStayRevision } from '../../../features/admin-stays/admin-stays-validation';
import { StayDetails } from './StayDetails';
import { StayForm } from './StayForm';
import {
  buildUpdateStayInput,
  stayToFormValues,
  validateStayForm,
  type StayFormValues,
} from './stay-form-model';
import { getSavedStayCalendar, getStayNavigation } from './stay-navigation';
import { useAdminStay } from './use-admin-stay';
import { useStaySave } from './use-stay-save';
import { useUnsavedStay } from './use-unsaved-stay';
import { UnsavedStayNotice } from './UnsavedStayNotice';
import { useStayScreenFocus } from './use-stay-screen-focus';
import './stays.css';

export function AdminStayDetailScreen() {
  const { state, rejectSession } = useAdminSession();
  const { id = '' } = useParams();
  if (state.status !== 'authenticated') return null;
  return (
    <DetailWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function DetailWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const { resource, refresh } = useAdminStay(id, token, rejectSession);
  const [editing, setEditing] = useState(false);
  const [changingStatus, setChangingStatus] = useState(false);
  const location = useLocation();
  const initialNotice: unknown = location.state;
  const [notice, setNotice] = useState<string | null>(() =>
    initialNotice &&
    typeof initialNotice === 'object' &&
    'stayNotice' in initialNotice &&
    initialNotice.stayNotice === 'created'
      ? '새 이용 일정이 등록되었습니다.'
      : null,
  );
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const navigation = getStayNavigation(search);
  useStayScreenFocus();
  useEffect(() => {
    if (resource.status === 'ready' && !editing && !changingStatus)
      document.getElementById('main-content')?.focus({ preventScroll: true });
  }, [resource.status, editing, changingStatus]);

  if (resource.status !== 'ready')
    return (
      <div className="admin-stay">
        <PageState
          title={
            resource.status === 'loading'
              ? '이용 일정을 불러오는 중'
              : '이용 일정을 불러오지 못했습니다'
          }
          description={
            resource.status === 'error'
              ? resource.message
              : '잠시만 기다려 주세요.'
          }
        >
          {resource.status === 'error' && (
            <Button onClick={refresh}>다시 불러오기</Button>
          )}
          <Button
            className="admin-button-secondary"
            onClick={() => navigate(navigation.returnTo)}
          >
            {navigation.returnLabel}
          </Button>
        </PageState>
      </div>
    );
  const stay = resource.data;
  if (editing && stay.status === 'ACTIVE')
    return (
      <StayEditor
        key={stay.currentRevision}
        stay={stay}
        token={token}
        rejectSession={rejectSession}
        date={navigation.date}
        fromList={navigation.isList}
        onCancel={() => setEditing(false)}
        onReload={() => {
          setEditing(false);
          setNotice('최신 이용 일정으로 갱신했습니다.');
          refresh();
        }}
      />
    );

  return (
    <div className="admin-stay">
      <header className="stay-heading">
        <div>
          <p className="stay-heading__eyebrow">STAY DETAILS</p>
          <h1>이용 일정 상세</h1>
          <p>
            {stay.property.name} · {stay.guestName}
          </p>
        </div>
        {!changingStatus && (
          <div className="stay-heading__actions">
            <Button
              className="admin-button-secondary"
              onClick={() => navigate(navigation.returnTo)}
            >
              {navigation.returnLabel}
            </Button>
            <Button
              className="admin-button-secondary"
              onClick={() => {
                setNotice(null);
                refresh();
              }}
            >
              새로고침
            </Button>
            {stay.status === 'ACTIVE' &&
              isStayRevision(stay.currentRevision) && (
                <Button onClick={() => setEditing(true)}>수정</Button>
              )}
            {isStayRevision(stay.currentRevision) && (
              <Button
                className="admin-button-secondary"
                disabled={
                  stay.status === 'CANCELLED' && !stay.property.isActive
                }
                onClick={() => {
                  setNotice(null);
                  setChangingStatus(true);
                }}
              >
                {stay.status === 'ACTIVE' ? '일정 취소' : '일정 복원'}
              </Button>
            )}
          </div>
        )}
      </header>
      {notice && (
        <p className="stay-banner stay-banner--success" role="status">
          {notice}
        </p>
      )}
      {changingStatus && (
        <StayStatusAction
          key={`${stay.id}:${stay.currentRevision}`}
          stay={stay}
          token={token}
          rejectSession={rejectSession}
          onClose={() => setChangingStatus(false)}
          onReload={() => {
            setChangingStatus(false);
            setNotice(null);
            refresh();
          }}
          onSaved={(saved) => {
            setChangingStatus(false);
            setNotice(
              saved.status === 'CANCELLED'
                ? '이용 일정이 취소되었습니다. 목록에서 계속 확인할 수 있습니다.'
                : '이용 일정이 복원되었습니다.',
            );
            refresh();
          }}
        />
      )}
      {stay.status === 'CANCELLED' && (
        <p className="stay-banner">
          {stay.property.isActive
            ? '취소된 일정입니다. 수정하려면 먼저 복원해 주세요.'
            : '취소된 일정입니다. 복원하려면 휴양소를 먼저 활성화해 주세요.'}
        </p>
      )}
      <StayDetails stay={stay} />
      <StayHistory
        stayId={stay.id}
        currentRevision={stay.currentRevision}
        token={token}
        rejectSession={rejectSession}
      />
    </div>
  );
}

function StayEditor({
  stay,
  token,
  rejectSession,
  date,
  fromList,
  onCancel,
  onReload,
}: {
  stay: AdminStayDto;
  token: string;
  rejectSession: (token: string) => void;
  date: string;
  fromList: boolean;
  onCancel: () => void;
  onReload: () => void;
}) {
  const navigate = useNavigate();
  const [initial] = useState(() => stayToFormValues(stay));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StayFormValues, string>>
  >({});
  const [unchanged, setUnchanged] = useState(false);
  const mutation = useStaySave(token, rejectSession);
  const leave = useUnsavedStay(
    JSON.stringify(values) !== JSON.stringify(initial),
  );
  useStayScreenFocus(mutation.state.message);

  function submit() {
    if (mutation.state.busy || mutation.state.blocked) return;
    const next = validateStayForm(values, stay);
    setErrors(next);
    if (Object.keys(next).length) {
      window.requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.stay-form [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    const input = buildUpdateStayInput(values, stay);
    if (!input) {
      setUnchanged(true);
      return;
    }
    void mutation.save(
      (signal) => updateAdminStay(stay.id, input, token, signal),
      (saved) => {
        if (fromList) {
          onReload();
          return;
        }
        const destination = getSavedStayCalendar(saved, date);
        if (destination === `/admin/stays/${saved.id}`) {
          onReload();
          return;
        }
        navigate(destination, {
          replace: true,
          state: { stayNotice: 'updated' },
        });
      },
    );
  }

  return (
    <div className="admin-stay">
      <header className="stay-heading">
        <div>
          <p className="stay-heading__eyebrow">EDIT STAY</p>
          <h1>이용 일정 수정</h1>
          <p>변경할 이용 정보만 수정해 주세요.</p>
        </div>
      </header>
      <p className="stay-banner">
        저장된 수정 내용은 이력으로 남습니다. 연결된 체크리스트에 확인 필요
        표시가 생길 수 있습니다.
      </p>
      {unchanged && (
        <p className="stay-banner" role="status">
          변경된 내용이 없습니다. 이용 정보를 수정한 뒤 저장해 주세요.
        </p>
      )}
      {mutation.state.message && (
        <div
          className="stay-banner stay-banner--error"
          role="alert"
          tabIndex={-1}
        >
          <p>{mutation.state.message}</p>
          {mutation.state.blocked && (
            <Button
              className="admin-button-secondary"
              onClick={() => {
                leave.askToLeave(onReload);
              }}
            >
              최신 내용 다시 확인
            </Button>
          )}
        </div>
      )}
      {leave.pending && (
        <UnsavedStayNotice
          onKeep={leave.keepEditing}
          onDiscard={leave.discard}
        />
      )}
      <StayForm
        values={values}
        onChange={(field, value) => {
          setValues((current) => ({ ...current, [field]: value }));
          setErrors((current) => ({ ...current, [field]: undefined }));
          setUnchanged(false);
        }}
        onSubmit={submit}
        onCancel={() => {
          leave.askToLeave(onCancel);
        }}
        properties={[stay.property]}
        original={stay}
        errors={{ ...mutation.state.errors, ...errors }}
        busy={mutation.state.busy}
        blocked={!!mutation.state.blocked || leave.pending}
      />
    </div>
  );
}
