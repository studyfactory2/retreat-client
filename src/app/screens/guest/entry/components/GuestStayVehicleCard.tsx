import { useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { useGuestStayVehicle } from '../hooks/use-guest-stay-vehicle';
import { formatGuestStayTimestamp } from '../model/guest-entry-model';

export function GuestStayVehicleCard({
  form,
}: {
  form: ReturnType<typeof useGuestStayVehicle>;
}) {
  const [clearVersion, setClearVersion] = useState<number | null>(null);
  const { phase, snapshot, pending, input, error, message } = form;
  const clearing =
    clearVersion !== null &&
    clearVersion === snapshot?.version &&
    phase === 'ready' &&
    form.canClear;

  if (phase === 'idle' || phase === 'denied') return null;
  if (phase === 'disabled')
    return (
      <p className="guest-vehicle-disabled" role="status">
        현재 이 휴양소는 차량 정보를 받지 않습니다.
      </p>
    );

  const review = phase === 'review';
  const blocked = phase === 'blocked' || review;
  const badge = pending
    ? phase === 'saving'
      ? '저장 중'
      : '확인 중'
    : blocked || snapshot?.needsConfirmation
      ? '확인 필요'
      : phase === 'error'
        ? '연결 확인'
        : form.dirty
          ? '저장 전'
          : snapshot?.plateNumber
            ? '저장됨'
            : '입력 없음';

  return (
    <section
      className="guest-card guest-vehicle"
      aria-labelledby="guest-vehicle-title"
      aria-busy={pending}
    >
      <div className="guest-card__heading">
        <h2 id="guest-vehicle-title">차량 정보</h2>
        <span className="guest-badge">{badge}</span>
      </div>
      <p className="guest-vehicle-intro">
        관리자에게 전달할 차량번호 한 개를 입력해 주세요. 차량번호의 법적 유효성
        확인이나 주차 출입 등록을 위한 기능은 아닙니다.
      </p>

      {snapshot && (
        <div className="guest-vehicle-saved">
          <span>
            {blocked || phase === 'error'
              ? '마지막으로 불러온 차량번호'
              : '저장된 차량번호'}
          </span>
          <strong>
            {snapshot.needsConfirmation
              ? '다시 확인해 주세요'
              : (snapshot.plateNumber ?? '저장된 차량번호 없음')}
          </strong>
          {snapshot.updatedAt && (
            <small>
              <time dateTime={snapshot.updatedAt}>
                {formatGuestStayTimestamp(snapshot.updatedAt)}
              </time>
              {' · 한국 시간'}
            </small>
          )}
        </div>
      )}

      {snapshot?.needsConfirmation && (
        <p className="guest-vehicle-notice">
          이용 정보가 변경되어 차량 정보를 다시 확인해야 합니다. 이번 이용에
          사용할 차량번호를 새로 입력하거나, 차량번호 없이 확인해 주세요.
        </p>
      )}

      <div role="status" aria-live="polite" className="guest-vehicle-feedback">
        {message && <p>{message}</p>}
        {phase === 'loading' && <p>차량 정보를 확인하고 있습니다.</p>}
        {phase === 'saving' && <p>차량 정보를 저장하고 있습니다.</p>}
      </div>
      {error && (
        <p
          id="guest-vehicle-error"
          className="guest-vehicle-error"
          role="alert"
        >
          {error}
        </p>
      )}

      {(snapshot || input) && (
        <form
          onSubmit={(event) => {
            event.preventDefault();
            setClearVersion(null);
            void form.save();
          }}
          noValidate
        >
          <div className="guest-vehicle-field">
            <label htmlFor="guest-vehicle-plate">차량번호</label>
            <input
              id="guest-vehicle-plate"
              name="plateNumber"
              type="text"
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              placeholder="예: 123가 4567"
              value={input}
              disabled={!form.canEdit || clearing}
              aria-invalid={Boolean(error)}
              aria-describedby={`guest-vehicle-help${error ? ' guest-vehicle-error' : ''}`}
              onChange={(event) => form.setPlate(event.target.value)}
              onPaste={(event) => {
                const pasted = event.clipboardData.getData('text');
                // Single-line inputs silently strip newlines before onChange.
                // Keep invalid pasted controls in validation state, not a changed plate.
                if (/[\t\r\n]/.test(pasted.trim())) {
                  event.preventDefault();
                  form.setPlate(pasted);
                }
              }}
            />
            <p id="guest-vehicle-help" className="guest-hint">
              공백을 제외한 3~20자 · 숫자를 포함한 한글, 영문, 숫자, 하이픈(-)
              <br />
              일반 공백은 제거되고 영문은 대문자로 저장됩니다.
            </p>
          </div>
          <div className="guest-vehicle-actions">
            <Button type="submit" disabled={!form.canSave || clearing}>
              {snapshot?.needsConfirmation
                ? '이 차량번호로 확인'
                : '차량번호 저장'}
            </Button>
            {form.canClear && (
              <Button
                className="guest-vehicle-secondary"
                disabled={clearing}
                onClick={() => setClearVersion(snapshot?.version ?? null)}
              >
                {snapshot?.needsConfirmation
                  ? '차량번호 없이 확인'
                  : '차량번호 지우기'}
              </Button>
            )}
          </div>
        </form>
      )}

      {clearing && form.canClear && (
        <div
          className="guest-vehicle-confirm"
          role="group"
          aria-label="차량번호 지우기 확인"
        >
          <p>
            저장된 차량번호를 비우고 현재 이용 정보로 확인할까요? 차량이 없다는
            뜻으로 기록되지는 않습니다. 입력 중인 내용도 지워집니다.
          </p>
          <div className="guest-vehicle-actions">
            <Button
              onClick={() => {
                setClearVersion(null);
                void form.clear();
              }}
            >
              비우고 확인
            </Button>
            <Button
              className="guest-vehicle-secondary"
              onClick={() => setClearVersion(null)}
            >
              취소
            </Button>
          </div>
        </div>
      )}

      {review ? (
        <Button
          className="guest-vehicle-reload guest-vehicle-secondary"
          onClick={form.acknowledgeReview}
        >
          최신 내용을 확인했어요
        </Button>
      ) : (
        <Button
          className="guest-vehicle-reload guest-vehicle-secondary"
          disabled={pending}
          onClick={() => {
            setClearVersion(null);
            void form.reload();
          }}
        >
          최신 차량 정보 불러오기
        </Button>
      )}
      <p className="guest-hint guest-vehicle-leave-hint">
        입력한 내용은 저장 버튼을 눌러야 반영됩니다. 저장하기 전에 화면을 닫거나
        이동하면 입력 내용이 사라질 수 있습니다.
      </p>
    </section>
  );
}
