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
      <h2 id="staff-start-title">담당 직원 확인</h2>
      {!configured && (
        <p className="staff-entry-empty">
          관리자에게 담당 직원 배정과 정비 항목 설정을 요청해 주세요.
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
              담당 직원 <strong>{context.assignedStaff?.name}</strong>입니다.
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
                : '추가 정비 시작'}
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
      {configured && !uncertain && !opening && (
        <p className="staff-start-link-note">
          추가 기록은 개인 이어쓰기 링크로 다시 열 수 있어요.
        </p>
      )}
    </section>
  );
}
