import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { appRoutes } from '../../../../core/router/routes';
import {
  createAdminProperty,
  updateAdminProperty,
} from '../../../../features/admin-properties/admin-property-management-api';
import type { AdminPropertyDto } from '../../../../features/admin-properties/admin-property-management.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { PropertyForm } from './PropertyForm';
import {
  buildCreatePropertyInput,
  buildUpdatePropertyInput,
  createPropertyFormValues,
  validatePropertyForm,
  type PropertyFormErrors,
  type PropertyFormValues,
} from '../model/property-form-model';
import { usePropertySave } from '../hooks/use-property-save';

type Props = {
  token: string;
  rejectSession: (token: string) => void;
  original?: AdminPropertyDto;
  returnUrl: string;
};

export function PropertyEditor({
  token,
  rejectSession,
  original,
  returnUrl,
}: Props) {
  const navigate = useNavigate();
  const [initial] = useState(() => createPropertyFormValues(original));
  const [values, setValues] = useState(initial);
  const [errors, setErrors] = useState<PropertyFormErrors>({});
  const [unchanged, setUnchanged] = useState(false);
  const [discarding, setDiscarding] = useState(false);
  const mutation = usePropertySave(token, rejectSession);
  const notice = useRef<HTMLDivElement>(null);
  const discard = useRef<HTMLDivElement>(null);
  const destination = useRef(returnUrl);
  const leaveOrigin = useRef<HTMLElement | null>(null);
  const dirty = JSON.stringify(values) !== JSON.stringify(initial);

  useEffect(() => {
    document.getElementById('main-content')?.focus({ preventScroll: true });
    window.scrollTo({ top: 0, left: 0 });
  }, []);
  useEffect(() => {
    if (mutation.state.message) notice.current?.focus();
  }, [mutation.state.message]);
  useEffect(() => {
    if (discarding) discard.current?.focus();
  }, [discarding]);
  useEffect(() => {
    if (!dirty) return;
    const warn = (event: BeforeUnloadEvent) => {
      event.preventDefault();
      event.returnValue = '';
    };
    window.addEventListener('beforeunload', warn);
    return () => window.removeEventListener('beforeunload', warn);
  }, [dirty]);

  function change(next: PropertyFormValues) {
    setValues(next);
    setErrors((current) => {
      const remaining = { ...mutation.state.errors, ...current };
      for (const field of [
        'name',
        'region',
        'isActive',
        'vehicleRegistrationEnabled',
      ] as const) {
        if (next[field] !== values[field]) remaining[field] = undefined;
      }
      return remaining;
    });
    setUnchanged(false);
  }

  function leave(url: string) {
    if (mutation.state.busy) return;
    destination.current = url;
    if (dirty) {
      leaveOrigin.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setDiscarding(true);
    } else navigate(url);
  }

  function submit() {
    if (mutation.state.busy || mutation.state.uncertain || discarding) return;
    const next = validatePropertyForm(values);
    setErrors(next);
    if (Object.keys(next).length) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.property-form [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }
    const input = original
      ? buildUpdatePropertyInput(values, original)
      : buildCreatePropertyInput(values);
    if (!input) {
      setUnchanged(true);
      return;
    }
    void mutation.save(
      (signal) =>
        original
          ? updateAdminProperty(original.id, input, token, signal)
          : createAdminProperty(
              buildCreatePropertyInput(values),
              token,
              signal,
            ),
      (saved) =>
        navigate(appRoutes.adminProperties, {
          replace: true,
          state: {
            propertyNotice: original ? 'updated' : 'created',
            propertyName: saved.name,
            propertyId: saved.id,
          },
        }),
    );
  }

  return (
    <div className="properties-editor">
      <header className="properties-heading">
        <div>
          <p className="properties-heading__eyebrow">
            {original ? 'PROPERTY SETTINGS' : 'NEW PROPERTY'}
          </p>
          <h1>{original ? '휴양소 정보 수정' : '휴양소 등록'}</h1>
          <p>
            {original
              ? `${original.name}의 운영 정보를 관리하세요.`
              : '휴양소를 등록하면 이용 일정에 연결할 수 있습니다.'}
          </p>
        </div>
      </header>
      {original && (
        <div className="properties-summary">
          <p>
            담당 직원{' '}
            <strong>
              {original.staff
                ? `${original.staff.name}${original.staff.isActive ? '' : ' · 비활성'}`
                : '미배정'}
            </strong>
          </p>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || discarding}
            onClick={() =>
              leave(appRoutes.adminPropertyStaff.replace(':id', original.id))
            }
          >
            담당 직원 관리
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || discarding}
            onClick={() =>
              leave(appRoutes.adminPropertyQr.replace(':id', original.id))
            }
          >
            QR 관리
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || discarding}
            onClick={() =>
              leave(
                appRoutes.adminPropertyChecklists.replace(':id', original.id),
              )
            }
          >
            체크리스트 관리
          </Button>
          <Button
            className="admin-button-secondary"
            disabled={mutation.state.busy || discarding}
            onClick={() =>
              leave(appRoutes.adminPropertyGuide.replace(':id', original.id))
            }
          >
            이용 안내 관리
          </Button>
        </div>
      )}
      {mutation.state.message && (
        <div
          className="properties-banner properties-banner--error"
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <p>{mutation.state.message}</p>
          {mutation.state.uncertain && (
            <Button
              className="admin-button-secondary"
              onClick={() => navigate(appRoutes.adminProperties)}
            >
              목록에서 저장 결과 확인
            </Button>
          )}
        </div>
      )}
      {unchanged && (
        <p className="properties-banner" role="status">
          변경된 내용이 없습니다.
        </p>
      )}
      {discarding && (
        <div
          className="properties-banner"
          role="alertdialog"
          tabIndex={-1}
          ref={discard}
          aria-labelledby="property-discard-title"
          aria-describedby="property-discard-description"
        >
          <h2 id="property-discard-title">입력 내용을 버릴까요?</h2>
          <p id="property-discard-description">
            아직 저장하지 않은 변경 사항이 사라집니다.
          </p>
          <div className="properties-heading__actions">
            <Button
              onClick={() => {
                setDiscarding(false);
                requestAnimationFrame(() => {
                  if (leaveOrigin.current?.isConnected)
                    leaveOrigin.current.focus();
                });
              }}
            >
              계속 작성
            </Button>
            <Button
              className="admin-button-secondary"
              onClick={() => navigate(destination.current)}
            >
              입력 버리기
            </Button>
          </div>
        </div>
      )}
      <PropertyForm
        values={values}
        onChange={change}
        onSubmit={submit}
        onCancel={() => leave(returnUrl)}
        editing={!!original}
        errors={{ ...mutation.state.errors, ...errors }}
        busy={mutation.state.busy}
        blocked={mutation.state.uncertain || discarding}
      />
    </div>
  );
}
