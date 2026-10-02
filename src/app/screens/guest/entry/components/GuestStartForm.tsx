import type { ChangeEvent } from 'react';
import { Link, type To } from 'react-router-dom';
import { getSeoulToday } from '../../../../core/dates/seoul-date';
import type { GuestDraftType } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestEntryContext } from '../../../../features/guest-entry/guest-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
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
  const locked =
    pending || state.status === 'uncertain' || state.status === 'denied';
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
      <Link to={home} className="guest-home-link">
        ‹ 홈으로 돌아가기
      </Link>
      <header className="guest-start-heading">
        <span className="guest-eyebrow">{entry.context.property.name}</span>
        <h1>{title}</h1>
        <p>이용 정보를 확인하고 시설 상태를 기록해 주세요.</p>
      </header>
      {!checklist ? (
        <section className="guest-card guest-empty">
          <h2>체크리스트를 준비하고 있습니다</h2>
          <p>현재 {title}를 시작할 수 없습니다. 관리자에게 문의해 주세요.</p>
        </section>
      ) : (
        <form
          className="guest-card guest-start-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.start();
          }}
        >
          <div className="guest-card__heading">
            <h2>이용객 정보</h2>
            <span className="guest-badge">
              {entry.kind === 'stay' ? '개인 이용 일정' : '휴양소 공용 QR'}
            </span>
          </div>
          {entry.kind === 'stay' ? (
            <>
              <dl className="guest-start-summary">
                <div>
                  <dt>이용객</dt>
                  <dd>{entry.context.guestName}</dd>
                </div>
                <div>
                  <dt>{type === 'CHECK_IN' ? '입실일' : '퇴실일'}</dt>
                  <dd>
                    {getSeoulToday(
                      new Date(
                        type === 'CHECK_IN'
                          ? entry.context.checkInAt
                          : entry.context.checkOutAt,
                      ),
                    )}
                  </dd>
                </div>
                <div>
                  <dt>휴양소</dt>
                  <dd>{entry.context.property.name}</dd>
                </div>
              </dl>
              <p className="guest-hint">
                개인 이용 일정에 등록된 정보로 작성됩니다. 변경이 필요하면
                관리자에게 문의해 주세요.
              </p>
            </>
          ) : (
            <fieldset disabled={locked} className="guest-start-fields">
              <legend className="guest-start-sr-only">이용객 정보 입력</legend>
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
                  {type === 'CHECK_IN' ? '입실일' : '퇴실일'} <span>필수</span>
                </label>
                <input
                  {...inputProps('visitDate')}
                  type="date"
                  min="1900-01-01"
                  max="2100-12-31"
                  required
                />
                {error('visitDate')}
                <p className="guest-hint">
                  한국 시간 기준으로 실제 이용일을 선택해 주세요.
                </p>
              </div>
              {optionalFields.map((field) => (
                <div className="guest-start-field" key={field.name}>
                  <label htmlFor={`guest-start-${field.name}`}>
                    {field.label}{' '}
                    <span className="guest-start-optional">선택</span>
                  </label>
                  <input
                    {...inputProps(field.name)}
                    type={field.name === 'phone' ? 'tel' : 'text'}
                    autoComplete={field.autoComplete}
                  />
                  {error(field.name)}
                </div>
              ))}
            </fieldset>
          )}
          <div className="guest-start-notice">
            <GuestIcon name="notice" />
            <p>
              체크리스트를 시작하면 답변을 임시 저장할 수 있습니다. 발급되는
              개인 이어쓰기 링크를 보관해 주세요.
            </p>
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
            disabled={locked}
          >
            {state.status === 'checking'
              ? '이용 정보 확인 중'
              : state.status === 'starting'
                ? '체크리스트 시작 중'
                : `${title} 시작하기`}
          </Button>
        </form>
      )}
    </div>
  );
}
