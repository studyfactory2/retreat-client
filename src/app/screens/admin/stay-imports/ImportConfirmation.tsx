import type { RefObject } from 'react';
import type { StayImportPreviewDto } from '../../../features/admin-stay-imports/admin-stay-imports.types';
import { Button } from '../../../shared/ui/Button/Button';

export function ImportConfirmation({
  summary,
  confirming,
  busy,
  canConfirm,
  confirmationRef,
  onOpen,
  onClose,
  onConfirm,
}: {
  summary: StayImportPreviewDto['batch']['summary'];
  confirming: boolean;
  busy: boolean;
  canConfirm: boolean;
  confirmationRef: RefObject<HTMLDivElement | null>;
  onOpen: () => void;
  onClose: () => void;
  onConfirm: () => void;
}) {
  return (
    <section className="stay-import-confirm">
      <div>
        <h2>검토한 명단을 이용 일정으로</h2>
        <p>
          {summary.ready}건 등록 준비 · {summary.skipped}건 제외
        </p>
        {summary.invalid + summary.needsReview > 0 && (
          <p>
            확인 필요·오류 {summary.invalid + summary.needsReview}건을 먼저
            검토하거나 제외해 주세요.
          </p>
        )}
      </div>
      {confirming ? (
        <div
          className="stay-import-notice"
          role="alertdialog"
          aria-labelledby="import-confirm-heading"
          tabIndex={-1}
          ref={confirmationRef}
        >
          <h3 id="import-confirm-heading">
            {summary.ready > 0
              ? `${summary.ready}건의 이용 일정을 등록할까요?`
              : '모든 행을 제외하고 가져오기를 마칠까요?'}
          </h3>
          <p>
            명단 전체에 적용됩니다. 확정 후에는 각 이용 일정에서 수정·취소할 수
            있습니다.
          </p>
          <div className="stay-import-actions">
            <Button
              disabled={busy}
              className="admin-button-secondary"
              onClick={onClose}
            >
              계속 검토
            </Button>
            <Button loading={busy} disabled={!canConfirm} onClick={onConfirm}>
              가져오기 확정
            </Button>
          </div>
        </div>
      ) : (
        <Button disabled={!canConfirm} onClick={onOpen}>
          최종 확인
        </Button>
      )}
      {busy && (
        <p role="status">
          명단을 처리하고 있습니다. 행이 많으면 시간이 걸릴 수 있습니다.
        </p>
      )}
    </section>
  );
}
