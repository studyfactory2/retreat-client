import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import { createAdminStay } from '../../../features/admin-stays/admin-stays-api';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { StayForm } from './components/StayForm';
import {
  buildCreateStayInput,
  createStayFormValues,
  validateStayForm,
  type StayFormValues,
} from './model/stay-form-model';
import { getSavedStayCalendar, getStayNavigation } from './model/stay-navigation';
import { useStaySave } from './hooks/use-stay-save';
import { useUnsavedStay } from './hooks/use-unsaved-stay';
import { UnsavedStayNotice } from './components/UnsavedStayNotice';
import { useStayScreenFocus } from './hooks/use-stay-screen-focus';
import './styles/stays.css';

export function AdminStayCreateScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <CreateWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function CreateWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const navigation = getStayNavigation(search);
  const [initial] = useState(() =>
    createStayFormValues(navigation.date, navigation.propertyId),
  );
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<
    Partial<Record<keyof StayFormValues, string>>
  >({});
  const properties = useAdminPropertyOptions(token, rejectSession);
  const mutation = useStaySave(token, rejectSession);
  const leave = useUnsavedStay(
    JSON.stringify(values) !== JSON.stringify(initial),
  );
  useStayScreenFocus(mutation.state.message);
  const options =
    properties.resource.status === 'ready' ? properties.resource.data : [];
  const hasActiveProperty = options.some((property) => property.isActive);

  function submit() {
    if (mutation.state.busy || mutation.state.blocked) return;
    const next = validateStayForm(values);
    if (
      !options.some(
        (property) => property.id === values.propertyId && property.isActive,
      )
    )
      next.propertyId = '운영 중인 휴양소를 선택해 주세요.';
    setErrors(next);
    if (Object.keys(next).length) {
      window.requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.stay-form [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    const input = buildCreateStayInput(values);
    void mutation.save(
      (signal) => createAdminStay(input, token, signal),
      (stay) => {
        navigate(
          navigation.isList
            ? `/admin/stays/${stay.id}${navigation.detailSearch}`
            : getSavedStayCalendar(stay, navigation.date),
          {
            replace: true,
            state: { stayNotice: 'created' },
          },
        );
      },
    );
  }

  return (
    <div className="admin-stay">
      <header className="stay-heading">
        <div>
          <p className="stay-heading__eyebrow">NEW STAY</p>
          <h1>이용 일정 등록</h1>
          <p>휴양소와 이용객 정보를 입력해 새 일정을 등록하세요.</p>
        </div>
      </header>
      {properties.resource.status === 'loading' ? (
        <PageState
          title="휴양소를 불러오는 중"
          description="잠시만 기다려 주세요."
        />
      ) : properties.resource.status === 'error' ? (
        <div role="alert">
          <PageState
            title="휴양소를 불러오지 못했습니다"
            description={properties.resource.message}
          >
            <Button onClick={properties.refresh}>다시 불러오기</Button>
          </PageState>
        </div>
      ) : !hasActiveProperty ? (
        <PageState
          title="등록 가능한 휴양소가 없습니다"
          description="운영 중인 휴양소를 먼저 등록하거나 활성화해 주세요."
        >
          <Button onClick={() => navigate(navigation.returnTo)}>
            {navigation.returnLabel}
          </Button>
        </PageState>
      ) : (
        <>
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
                  onClick={() =>
                    navigate(
                      getStayNavigation(
                        new URLSearchParams({
                          date: values.checkInAt.slice(0, 10),
                          propertyId: values.propertyId,
                        }),
                      ).calendar,
                    )
                  }
                >
                  일정 확인하기
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
            }}
            onSubmit={submit}
            onCancel={() => {
              leave.askToLeave(() => navigate(navigation.returnTo));
            }}
            properties={options}
            errors={{ ...mutation.state.errors, ...errors }}
            busy={mutation.state.busy}
            blocked={!!mutation.state.blocked || leave.pending}
          />
        </>
      )}
    </div>
  );
}
