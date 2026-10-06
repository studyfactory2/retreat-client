import type { StaffQrContextDto } from '../../../../features/staff-entry/staff-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { useStaffStart } from '../hooks/use-staff-start';
import { staffStartConfigured } from '../model/staff-start-model';

export function StaffStartCard({
  context,
  form,
}: {
  context: StaffQrContextDto;
  form: ReturnType<typeof useStaffStart>;
}) {
  const { state, pending } = form;
  const configured = staffStartConfigured(context);
  const uncertain = state.status === 'uncertain';
  const opening = state.status === 'opening';
  return (
    <section
      className="staff-entry-card staff-start"
      aria-labelledby="staff-start-title"
      aria-busy={pending}
    >
      <span className="staff-entry-eyebrow">시작 전 확인</span>
      <h2 id="staff-start-title">담당 직원을 확인해 주세요</h2>
      <p className="staff-entry-hint staff-start-description">
        확인 후 정비 항목을 작성할 수 있습니다.
      </p>
      {!configured && (
        <p className="staff-entry-empty">
          담당 직원과 정비 항목이 준비되면 시작할 수 있습니다. 관리자에게 문의해
          주세요.
        </p>
      )}
      {configured && !uncertain && !opening && (
        <form
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void form.start();
          }}
        >
          <label className="staff-start-confirm">
            <input
              type="checkbox"
              checked={state.confirmed}
              disabled={!form.canConfirm}
              onChange={(event) => form.setConfirmed(event.target.checked)}
            />
            <span>
              <strong>{context.assignedStaff?.name}</strong>님의 담당 직원
              배정을 확인했습니다.
            </span>
          </label>
          <Button
            type="submit"
            className="staff-start-submit"
            disabled={!form.canStart}
            loading={pending}
          >
            {state.status === 'checking'
              ? '담당 직원 확인 중'
              : state.status === 'starting'
                ? '정비 시작 중'
                : '정비 시작'}
          </Button>
        </form>
      )}
      {state.message && (
        <div
          className={`staff-start-feedback${uncertain ? ' staff-start-feedback--uncertain' : ''}`}
          role="status"
          aria-live="polite"
        >
          <p>{state.message}</p>
        </div>
      )}
      {uncertain && (
        <div className="staff-start-recovery">
          <p>
            받은 작성 링크가 있다면 그 링크를 열어 주세요. 새로 시작하면 정비
            기록이 중복될 수 있습니다.
          </p>
          <Button onClick={form.prepareFresh}>새 정비 기록 준비</Button>
        </div>
      )}
      {opening && (
        <Button className="staff-start-submit" onClick={form.openIssued}>
          작성 화면 열기
        </Button>
      )}
      <details className="staff-start-details">
        <summary>시작 전에 알아두기</summary>
        <ul>
          <li>시작하면 임시 기록이 만들어집니다. 정비 완료는 아닙니다.</li>
          <li>담당 직원 배정 확인이며, 작업자 본인 인증은 아닙니다.</li>
          <li>
            작성 화면의 이어쓰기 링크를 보관해 주세요. 이 QR에서는 이전 기록을
            찾을 수 없습니다.
          </li>
        </ul>
      </details>
    </section>
  );
}
