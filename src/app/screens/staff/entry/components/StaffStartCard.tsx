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
      <h2 id="staff-start-title">정비 기록 시작</h2>
      <p className="staff-entry-hint staff-start-description">
        시작하면 현재 설정된 체크리스트로 임시 기록이 만들어집니다. 정비 완료나
        최종 제출로 처리되지는 않습니다.
      </p>
      {!configured && (
        <p className="staff-entry-empty">
          담당 직원과 사용 가능한 체크리스트가 모두 준비되면 시작할 수 있습니다.
          관리자에게 설정을 문의해 주세요.
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
              표시된 담당 직원 <strong>{context.assignedStaff?.name}</strong>의
              배정을 확인했습니다.
            </span>
          </label>
          <p className="staff-entry-hint">
            담당자 배정을 확인하는 절차이며, 실제 작업자의 본인 인증은 아닙니다.
          </p>
          <Button
            type="submit"
            className="staff-start-submit"
            disabled={!form.canStart}
            loading={pending}
          >
            {state.status === 'checking'
              ? '직원 안내 확인 중'
              : state.status === 'starting'
                ? '정비 기록 만드는 중'
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
            이미 받은 개인 이어쓰기 링크가 있다면 그 링크를 사용해 주세요. 새로
            시작하면 별도의 정비 기록이 생길 수 있습니다.
          </p>
          <Button onClick={form.prepareFresh}>새 정비 기록 준비</Button>
        </div>
      )}
      {opening && (
        <Button className="staff-start-submit" onClick={form.openIssued}>
          발급된 작성 화면 다시 열기
        </Button>
      )}
      <p className="staff-entry-hint staff-start-link-note">
        발급된 개인 이어쓰기 링크를 보관해 주세요. 공용 직원 QR에서는 이전
        기록이나 이어쓰기 링크를 찾을 수 없습니다.
      </p>
    </section>
  );
}
