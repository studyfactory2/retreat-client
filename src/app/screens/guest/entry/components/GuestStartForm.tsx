import { useState, type ChangeEvent } from 'react';
import { Link, type To } from 'react-router-dom';
import type { GuestDraftType } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestChecklistProgress } from '../../components/GuestChecklistProgress';
import type { useGuestStart } from '../hooks/use-guest-start';
import {
  guestStartTitle,
  type GuestStartFields,
} from '../model/guest-start-model';
import { GuestIcon } from './GuestIcon';

const optionalFields = [
  { name: 'company', label: '회사', autoComplete: 'organization' },
  { name: 'department', label: '부서', autoComplete: 'off' },
  { name: 'phone', label: '연락처', autoComplete: 'tel' },
] as const;

const reservationDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: 'numeric',
  day: 'numeric',
  weekday: 'short',
});

export function GuestStartForm({
  entry,
  type,
  home,
  form,
}: {
  entry: GuestEntryContext;
  type: GuestDraftType;
  home: To;
  form: ReturnType<typeof useGuestStart>;
}) {
  const title = guestStartTitle(type);
  const checklist = entry.context.checklists.find(
    (value) => value.type === type,
  );
  const { state, pending, setField } = form;
  const [optionalOpen, setOptionalOpen] = useState(false);
  const optionalHasErrors = optionalFields.some(
    (field) => state.errors[field.name],
  );
  const opening = state.status === 'opening';
  const locked =
    pending ||
    opening ||
    state.status === 'uncertain' ||
    state.status === 'denied';
  const error = (field: keyof GuestStartFields) =>
    state.errors[field] ? (
      <span className="guest-start-error" id={`guest-start-${field}-error`}>
        {state.errors[field]}
      </span>
    ) : null;
  const inputProps = (field: keyof GuestStartFields) => ({
    id: `guest-start-${field}`,
    name: field,
    value: state.fields[field],
    'aria-invalid': state.errors[field] ? true : undefined,
    'aria-describedby': state.errors[field]
      ? `guest-start-${field}-error`
      : undefined,
    onChange: (event: ChangeEvent<HTMLInputElement>) =>
      setField(field, event.target.value),
  });

  return (
    <div className="guest-start">
      <header className="guest-start-heading">
        <Link
          to={home}
          className="guest-start-back"
          aria-label="홈으로 돌아가기"
        >
          <GuestIcon name="arrow" />
        </Link>
        <div>
          <h1>{title}</h1>
          <p>{entry.context.property.name}</p>
        </div>
      </header>
      {!checklist && !opening ? (
        <section className="guest-card guest-empty">
          <h2>체크리스트 준비 중</h2>
          <p>{title}가 필요하면 관리자에게 문의해 주세요.</p>
        </section>
      ) : (
        <form
          className="guest-start-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (opening) form.openIssued();
            else void form.start();
          }}
        >
          <GuestChecklistProgress step={1} />
          <div className="guest-card guest-start-panel">
            {entry.kind === 'stay' ? (
              <>
                <dl
                  className="guest-start-summary"
                  aria-label="예약 정보 · 한국 시간"
                >
                  <div>
                    <dt>이용객</dt>
                    <dd>{entry.context.guestName}</dd>
                  </div>
                  <div>
                    <dt>
                      {type === 'CHECK_IN' ? '입실 예정일' : '퇴실 예정일'}
                    </dt>
                    <dd>
                      {reservationDate.format(
                        new Date(
                          type === 'CHECK_IN'
                            ? entry.context.checkInAt
                            : entry.context.checkOutAt,
                        ),
                      )}
                    </dd>
                  </div>
                </dl>
                <p className="guest-hint">
                  예약 정보 변경은 관리자에게 문의해 주세요.
                </p>
              </>
            ) : (
              <fieldset disabled={locked} className="guest-start-fields">
                <legend className="guest-start-sr-only">
                  이용객 정보 입력
                </legend>
                <div className="guest-start-field">
                  <label htmlFor="guest-start-guestName">
                    이름 <span>필수</span>
                  </label>
                  <input
                    {...inputProps('guestName')}
                    type="text"
                    autoComplete="name"
                    required
                    placeholder="이용객 이름"
                  />
                  {error('guestName')}
                </div>
                <div className="guest-start-field">
                  <label htmlFor="guest-start-visitDate">
                    {type === 'CHECK_IN' ? '입실일' : '퇴실일'}{' '}
                    <span>필수 · 한국 시간</span>
                  </label>
                  <input
                    {...inputProps('visitDate')}
                    type="date"
                    min="1900-01-01"
                    max="2100-12-31"
                    required
                  />
                  {error('visitDate')}
                </div>
                <details
                  className="guest-start-optional-fields"
                  open={optionalOpen || optionalHasErrors}
                  onToggle={(event) =>
                    setOptionalOpen(event.currentTarget.open)
                  }
                >
                  <summary>
                    회사 · 부서 · 연락처 <span>선택</span>
                  </summary>
                  <div>
                    {optionalFields.map((field) => (
                      <div className="guest-start-field" key={field.name}>
                        <label htmlFor={`guest-start-${field.name}`}>
                          {field.label}
                        </label>
                        <input
                          {...inputProps(field.name)}
                          type={field.name === 'phone' ? 'tel' : 'text'}
                          autoComplete={field.autoComplete}
                        />
                        {error(field.name)}
                      </div>
                    ))}
                  </div>
                </details>
              </fieldset>
            )}
          </div>
          {state.message && (
            <div
              className={`guest-start-feedback${state.status === 'uncertain' ? ' guest-start-feedback--uncertain' : ''}`}
              role="status"
              aria-live="polite"
            >
              <p>{state.message}</p>
              {state.status === 'uncertain' && (
                <>
                  <p>
                    이미 받은 이어쓰기 링크가 있다면 그 링크를 사용해 주세요.
                    새로 시작하면 별도의 체크리스트가 생길 수 있습니다.
                  </p>
                  <Button
                    onClick={() => {
                      void form.prepareFresh();
                    }}
                    disabled={pending}
                  >
                    새 체크리스트 준비
                  </Button>
                </>
              )}
            </div>
          )}
          <Button
            type="submit"
            className="guest-start-submit"
            loading={pending}
            disabled={locked && !opening}
          >
            {opening
              ? '시설 확인 계속하기'
              : state.status === 'checking'
                ? '이용 정보 확인 중'
                : state.status === 'starting'
                  ? '체크리스트 시작 중'
                  : '시설 확인하기'}
            {!pending && <GuestIcon name="arrow" />}
          </Button>
        </form>
      )}
    </div>
  );
}
