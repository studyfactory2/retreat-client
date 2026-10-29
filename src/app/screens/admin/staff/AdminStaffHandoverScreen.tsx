import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { appRoutes } from '../../../core/router/routes';
import { useAdminSession } from '../../../core/session/use-admin-session';
import type { StaffDeactivationAudit } from '../../../features/admin-staff/admin-staff-handover.types';
import { Button } from '../../../shared/ui/Button/Button';
import { PageState } from '../../../shared/ui/PageState/PageState';
import { useStaffHandover } from './hooks/use-staff-handover';
import './styles/staff-handover.css';

export function AdminStaffHandoverScreen() {
  const { id = '' } = useParams();
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <HandoverWorkspace
      key={`${id}:${state.user.id}:${state.expiresAt}`}
      id={id}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function HandoverWorkspace({
  id,
  token,
  rejectSession,
}: {
  id: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const flow = useStaffHandover(id, token, rejectSession);
  const [bulk, setBulk] = useState('');
  const heading = useRef<HTMLHeadingElement>(null);
  const notice = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (flow.message) notice.current?.focus();
  }, [flow.message]);
  useEffect(() => {
    if (flow.reviewing || flow.result) {
      heading.current?.focus();
      window.scrollTo({ top: 0 });
    }
  }, [flow.reviewing, flow.result]);
  const detailUrl = appRoutes.adminStaffDetail.replace(':id', id);
  const reload = () => {
    setBulk('');
    flow.reload();
  };
  if (flow.resource.status !== 'ready')
    return (
      <div className="staff-handover">
        <PageState
          title={
            flow.resource.status === 'loading'
              ? '인계 정보 확인 중'
              : '인계 정보를 불러오지 못했습니다'
          }
          description={
            flow.resource.status === 'error'
              ? flow.resource.message
              : '담당 휴양소와 미제출 기록을 확인합니다.'
          }
        >
          {flow.resource.status === 'error' && (
            <Button onClick={reload}>다시 불러오기</Button>
          )}
          <Link className="ui-button admin-button-secondary" to={detailUrl}>
            직원 정보로
          </Link>
        </PageState>
      </div>
    );
  const { preview, replacements } = flow.resource;
  const finished = !!flow.result || !preview.staff.isActive;
  const audit = flow.result ?? preview.latestDeactivation;
  const operating = preview.properties.filter((property) => property.isActive);
  const archived = preview.properties.filter((property) => !property.isActive);
  const noReplacement = operating.length > 0 && replacements.length === 0;
  return (
    <div className="staff-handover">
      <header className="staff-handover__heading">
        <Link className="staff-handover__back" to={detailUrl}>
          ← 직원 정보
        </Link>
        <div className="staff-handover__title">
          <h1 ref={heading} tabIndex={-1}>
            {finished ? '직원 인계 기록' : '담당 인계 · 비활성화'}
          </h1>
          <span>{preview.staff.name}</span>
        </div>
        <p>
          {finished
            ? '현재 비활성 상태입니다. 기존 제출 기록과 사진은 유지됩니다.'
            : '새 담당자를 정하고 기존 직원의 활동을 마무리합니다.'}
        </p>
      </header>
      {finished ? (
        <>
          <div
            className="staff-handover__notice staff-handover__notice--success"
            role="status"
          >
            <strong>
              {flow.result
                ? '인계와 비활성화가 완료되었습니다.'
                : '이 직원은 비활성 상태입니다.'}
            </strong>
            <p>
              다시 활성화해도 휴양소가 자동 배정되거나 기존 직원 링크가
              복구되지는 않습니다.
            </p>
          </div>
          {audit ? (
            <HandoverRecord audit={audit} />
          ) : (
            <p className="staff-handover__notice">
              이전 방식으로 비활성화된 직원은 인계 기록이 없을 수 있습니다.
            </p>
          )}
          <div className="staff-handover__done-actions">
            <Link
              className="ui-button admin-button-secondary"
              to={appRoutes.adminStaff}
            >
              직원 목록
            </Link>
            <Link className="ui-button" to={detailUrl}>
              직원 정보 확인
            </Link>
          </div>
        </>
      ) : (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (flow.reviewing) void flow.save();
            else flow.review();
          }}
          aria-busy={flow.busy}
        >
          <div className="staff-handover__steps" aria-label="인계 단계">
            <span aria-current={!flow.reviewing ? 'step' : undefined}>
              1 담당자 선택
            </span>
            <span aria-hidden="true">→</span>
            <span aria-current={flow.reviewing ? 'step' : undefined}>
              2 확인 · 완료
            </span>
          </div>
          {flow.message && (
            <div
              ref={notice}
              tabIndex={-1}
              className="staff-handover__notice staff-handover__notice--error"
              role="alert"
            >
              <p>{flow.message}</p>
              {flow.blocked && (
                <>
                  <p>다시 확인하면 현재 선택은 초기화됩니다.</p>
                  <Button className="admin-button-secondary" onClick={reload}>
                    최신 상태 확인
                  </Button>
                </>
              )}
            </div>
          )}
          <div className="staff-handover__layout">
            <section
              className="staff-handover__panel"
              aria-labelledby="handover-properties-title"
            >
              <div className="staff-handover__section-heading">
                <h2 id="handover-properties-title">
                  {flow.reviewing ? '인계 내용 확인' : '담당 휴양소'}
                </h2>
                <span>{preview.properties.length}곳</span>
              </div>
              {!preview.properties.length && (
                <p className="staff-handover__empty">
                  담당 휴양소가 없습니다. 직원 비활성화와 기존 작성 링크 해제를
                  진행합니다.
                </p>
              )}
              {noReplacement && (
                <div className="staff-handover__notice" role="status">
                  <strong>선택할 활성 직원이 없습니다.</strong>
                  <p>
                    새 직원을 등록하거나 기존 직원을 활성화한 뒤 다시 확인해
                    주세요.
                  </p>
                  <Link to={appRoutes.adminStaff}>직원 관리 →</Link>
                </div>
              )}
              {!flow.reviewing && operating.length > 1 && !noReplacement && (
                <div className="staff-handover__bulk">
                  <label htmlFor="handover-bulk">
                    운영 중인 휴양소에 같은 직원 지정
                  </label>
                  <div>
                    <select
                      id="handover-bulk"
                      value={bulk}
                      disabled={flow.busy || flow.blocked}
                      onChange={(event) => setBulk(event.target.value)}
                    >
                      <option value="">직원 선택</option>
                      {replacements.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                          {staff.company ? ` · ${staff.company}` : ''}
                          {staff.phone ? ` · ${staff.phone}` : ''}
                        </option>
                      ))}
                    </select>
                    <Button
                      className="admin-button-secondary"
                      disabled={!bulk || flow.busy || flow.blocked}
                      onClick={() => flow.applyToAll(bulk)}
                    >
                      전체 적용
                    </Button>
                  </div>
                </div>
              )}
              <ul className="staff-handover__properties">
                {preview.properties.map((property) => (
                  <li key={property.id}>
                    <div className="staff-handover__property-heading">
                      <div>
                        <strong>{property.name}</strong>
                        {property.region && <small>{property.region}</small>}
                      </div>
                      <span
                        className={`staff-handover__status${property.isActive ? '' : ' staff-handover__status--muted'}`}
                      >
                        {property.isActive ? '운영 중' : '운영 제외'}
                      </span>
                    </div>
                    {property.isActive ? (
                      flow.reviewing ? (
                        <div className="staff-handover__assignment">
                          <span>새 담당자</span>
                          <strong>
                            {
                              replacements.find(
                                (staff) =>
                                  staff.id === flow.selections[property.id],
                              )?.name
                            }
                          </strong>
                        </div>
                      ) : (
                        <div className="staff-handover__field">
                          <label htmlFor={`handover-${property.id}`}>
                            새 담당자
                          </label>
                          <select
                            id={`handover-${property.id}`}
                            value={flow.selections[property.id] ?? ''}
                            disabled={
                              noReplacement || flow.busy || flow.blocked
                            }
                            aria-invalid={
                              !!flow.errors[property.id] || undefined
                            }
                            aria-describedby={
                              flow.errors[property.id]
                                ? `handover-error-${property.id}`
                                : undefined
                            }
                            onChange={(event) =>
                              flow.select(property.id, event.target.value)
                            }
                          >
                            <option value="">직원 선택</option>
                            {replacements.map((staff) => (
                              <option key={staff.id} value={staff.id}>
                                {staff.name}
                                {staff.company ? ` · ${staff.company}` : ''}
                                {staff.phone ? ` · ${staff.phone}` : ''}
                              </option>
                            ))}
                          </select>
                          {flow.errors[property.id] && (
                            <p
                              id={`handover-error-${property.id}`}
                              className="staff-handover__field-error"
                            >
                              {flow.errors[property.id]}
                            </p>
                          )}
                        </div>
                      )
                    ) : (
                      <p className="staff-handover__clear">
                        담당 배정 해제 · 기존 기록 유지
                      </p>
                    )}
                    {property.unfinishedDraftCount > 0 && (
                      <p className="staff-handover__draft-count">
                        미제출 {property.unfinishedDraftCount}건 · 새 담당자에게
                        이전되지 않음
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </section>
            <aside
              className="staff-handover__panel staff-handover__summary"
              aria-labelledby="handover-summary-title"
            >
              <h2 id="handover-summary-title">
                {flow.reviewing
                  ? '이 내용으로 마무리할까요?'
                  : '인계 시 적용되는 내용'}
              </h2>
              <dl>
                <div>
                  <dt>새 담당자 배정</dt>
                  <dd>{operating.length}곳</dd>
                </div>
                <div>
                  <dt>운영 제외 · 배정 해제</dt>
                  <dd>{archived.length}곳</dd>
                </div>
                <div>
                  <dt>직원 상태</dt>
                  <dd>활성 → 비활성</dd>
                </div>
              </dl>
              <ul className="staff-handover__guidance">
                <li>제출 기록과 사진은 원래 작성자 이름으로 남습니다.</li>
                <li>이용 일정과 이용객 QR은 유지됩니다.</li>
                <li>
                  기존 직원 QR과 개인 작성 링크는 사용할 수 없게 됩니다. 인계 후
                  새 직원 QR을 발급해 전달해 주세요.
                </li>
              </ul>
              {preview.unfinishedDraftCount > 0 && (
                <div className="staff-handover__warning">
                  <strong>
                    미제출 {preview.unfinishedDraftCount}건 확인 필요
                  </strong>
                  <p>
                    다른 담당자에게 이전되지 않습니다. 제출 가능한 기록 중
                    필요한 내용은 먼저 마무리해 주세요.
                  </p>
                  <p>만료·접근 제한 및 이전 담당 휴양소 기록도 포함합니다.</p>
                </div>
              )}
            </aside>
          </div>
          <div className="staff-handover__actions">
            {flow.reviewing && (
              <Button
                className="admin-button-secondary"
                disabled={flow.busy || flow.blocked}
                onClick={flow.edit}
              >
                계속 수정
              </Button>
            )}
            <Button
              type="submit"
              loading={flow.busy}
              disabled={flow.blocked || noReplacement}
            >
              {flow.busy
                ? '처리 중'
                : flow.reviewing
                  ? '인계 후 비활성화'
                  : '인계 내용 확인'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
}

function HandoverRecord({ audit }: { audit: StaffDeactivationAudit }) {
  const time = new Intl.DateTimeFormat('ko-KR', {
    timeZone: 'Asia/Seoul',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(audit.deactivatedAt));
  return (
    <section
      className="staff-handover__panel"
      aria-labelledby="handover-record-title"
    >
      <div className="staff-handover__section-heading">
        <h2 id="handover-record-title">최근 인계 내역</h2>
        <span>{audit.assignments.length}곳</span>
      </div>
      <p className="staff-handover__audit-meta">
        {time} · {audit.actor.name} · 한국 시간
      </p>
      {!!audit.staffQrReissuePropertyIds.length && (
        <div className="staff-handover__notice">
          <strong>새 직원 QR을 발급해 전달해 주세요.</strong>
          <p>
            아래 QR 관리에서 현재 담당자를 확인하고 새 직원 QR을 발급할 수
            있습니다.
          </p>
        </div>
      )}
      <ul className="staff-handover__properties">
        {audit.assignments.map((assignment) => (
          <li key={assignment.propertyId}>
            <div className="staff-handover__property-heading">
              <div>
                <strong>{assignment.propertyName}</strong>
                <small>
                  {assignment.replacementStaffName
                    ? `인계 당시 새 담당자 · ${assignment.replacementStaffName}`
                    : '운영 제외 · 담당 배정 해제'}
                </small>
              </div>
            </div>
            {audit.staffQrReissuePropertyIds.includes(
              assignment.propertyId,
            ) && (
              <Link
                className="staff-handover__qr-link"
                to={appRoutes.adminPropertyQr.replace(
                  ':id',
                  assignment.propertyId,
                )}
              >
                직원 QR 관리 <span aria-hidden="true">→</span>
              </Link>
            )}
          </li>
        ))}
      </ul>
      <p className="staff-handover__audit-meta">
        인계 당시의 기록입니다. 이후 담당자 변경이나 QR 발급 여부는 각
        휴양소에서 확인해 주세요.
      </p>
    </section>
  );
}
