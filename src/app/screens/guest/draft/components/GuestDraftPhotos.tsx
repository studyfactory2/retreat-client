import { useId, type ReactNode } from 'react';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestDraftPhotosController } from '../hooks/use-guest-draft-photos';
import { formatGuestPhotoSize } from '../model/guest-draft-photo-model';
import { GuestDraftPhotoCard } from './GuestDraftPhotoCard';
import '../styles/guest-draft-photos.css';

export function GuestDraftPhotos({
  controller,
  renderAssignment,
}: {
  controller: GuestDraftPhotosController;
  renderAssignment?: (photo: GuestDraftPhotoDto, index: number) => ReactNode;
}) {
  const inputId = useId();
  const { resource, queue, items, limits, busy, locked, removal } = controller;
  const disabled = locked || busy || controller.blocked;
  const remaining = Math.max(0, (limits?.maxPhotos ?? 40) - items.length);
  const paused =
    queue.length > 0 && queue.every((entry) => entry.status === 'queued');
  return (
    <section
      className="guest-draft-card guest-photos"
      aria-labelledby={`${inputId}-title`}
      aria-busy={busy}
    >
      <div className="guest-photos__heading">
        <h2 id={`${inputId}-title`}>
          사진 첨부 <span>선택</span>
        </h2>
        {resource.status === 'ready' && (
          <span className="guest-photos__count">
            {items.length} / {limits?.maxPhotos ?? 40}장
          </span>
        )}
      </div>
      <p className="guest-photos__intro">
        사진 없이도 제출할 수 있어요. 사진을 추가했다면 이상 항목을 연결해
        주세요.
      </p>
      {resource.status === 'loading' ? (
        <p className="guest-photos__status" role="status">
          첨부 사진을 불러오고 있습니다.
        </p>
      ) : resource.status === 'error' || resource.status === 'unavailable' ? (
        <div className="guest-photos__notice" role="alert">
          <p>{resource.message}</p>
          <Button
            className="guest-draft-secondary"
            loading={busy}
            disabled={resource.status === 'unavailable' && locked}
            onClick={() => {
              void controller.refresh();
            }}
          >
            사진 목록 다시 확인
          </Button>
        </div>
      ) : (
        <>
          {items.length > 0 ? (
            <div className="guest-photos__grid">
              {items.map((photo, index) => (
                <GuestDraftPhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  disabled={disabled}
                  getPreview={controller.getPreview}
                  onRemove={controller.remove}
                  assignment={renderAssignment?.(photo, index)}
                />
              ))}
            </div>
          ) : (
            <div className="guest-photos__empty">
              <span aria-hidden="true">+</span>
              <p>첨부한 사진이 없어요.</p>
              <small>필요한 경우에만 추가해 주세요.</small>
            </div>
          )}
          <label
            className="guest-photos__picker"
            htmlFor={inputId}
            aria-disabled={disabled || remaining === 0}
          >
            <span>＋ 사진 추가</span>
            <input
              id={inputId}
              type="file"
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              multiple
              disabled={disabled || remaining === 0}
              onChange={(event) => {
                if (event.currentTarget.files)
                  controller.uploadFiles(event.currentTarget.files);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <p className="guest-photos__help">
            한 장당 최대{' '}
            {(
              (limits?.maxBytes ?? 10 * 1024 * 1024) /
              (1024 * 1024)
            ).toLocaleString('ko-KR')}
            MiB · JPEG, PNG, WebP · 최대 {limits?.maxPhotos ?? 40}장
            <br />
            HEIC·HEIF 사진은 JPEG로 변환한 뒤 선택해 주세요.
          </p>
        </>
      )}
      <p className="guest-photos__help">
        사진은 답변과 별도로 바로 올라갑니다. 항목 연결은 최종 제출할 때
        저장되며, 이 화면 안에서는 유지되지만 링크를 다시 열면 다시 선택해야
        해요.
      </p>
      {controller.notice && (
        <p className="guest-photos__status" role="status">
          {controller.notice}
        </p>
      )}
      {queue.length > 0 && (
        <div
          className="guest-photos__queue"
          aria-label="선택한 사진의 업로드 상태"
        >
          <h3>선택한 사진</h3>
          {queue.map((entry) => (
            <div
              className={`guest-photos__queued guest-photos__queued--${entry.status}`}
              key={entry.id}
            >
              <div>
                <strong>{entry.file.name}</strong>
                <span>
                  {formatGuestPhotoSize(entry.file.size)} ·{' '}
                  {entry.status === 'uploading'
                    ? '올리는 중'
                    : entry.status === 'queued'
                      ? '대기 중'
                      : entry.status === 'uncertain'
                        ? '결과 확인 필요'
                        : '업로드 실패'}
                </span>
              </div>
              {entry.message && <p>{entry.message}</p>}
              {entry.status === 'uncertain' && entry.checked && (
                <p>
                  목록을 새로 불러왔습니다. 사진이 보이지 않아도 처리 중일 수
                  있습니다. 확인 후 이 선택을 닫고, 필요할 때만 다시 추가해
                  주세요.
                </p>
              )}
              {entry.status !== 'uploading' && (
                <div className="guest-photos__queue-actions">
                  {entry.status === 'failed' && (
                    <Button
                      className="guest-draft-secondary"
                      disabled={busy || locked || resource.status !== 'ready'}
                      onClick={() => controller.retry(entry.id)}
                    >
                      다시 올리기
                    </Button>
                  )}
                  {entry.status === 'uncertain' && !entry.checked && (
                    <Button
                      className="guest-draft-secondary"
                      loading={busy}
                      onClick={() => {
                        void controller.refresh();
                      }}
                    >
                      사진 목록 다시 확인
                    </Button>
                  )}
                  <Button
                    className="guest-draft-secondary"
                    disabled={
                      busy ||
                      locked ||
                      (entry.status === 'uncertain' && !entry.checked)
                    }
                    onClick={() => controller.dismiss(entry.id)}
                  >
                    {entry.status === 'uncertain'
                      ? '목록 확인 후 이 선택 닫기'
                      : '선택 취소'}
                  </Button>
                </div>
              )}
            </div>
          ))}
          {paused && (
            <Button
              className="guest-draft-secondary"
              disabled={
                busy ||
                locked ||
                resource.status !== 'ready' ||
                removal !== null
              }
              onClick={() => {
                void controller.continueQueue();
              }}
            >
              남은 사진 올리기
            </Button>
          )}
          <p className="guest-photos__help">
            실패하거나 확인이 필요한 사진을 처리해야 최종 제출을 계속할 수
            있습니다. 이 화면을 나가면 아직 올리지 않은 파일 선택은 사라집니다.
          </p>
        </div>
      )}
      {removal && (
        <div className="guest-photos__notice" role="alert">
          <p>
            {removal.checked
              ? '사진이 현재 목록에 남아 있습니다. 아직 삭제 처리 중일 수 있습니다. 목록을 확인하고 계속해 주세요.'
              : '삭제 결과를 알 수 없습니다. 사진 목록을 확인하기 전에는 추가·삭제 또는 최종 제출을 할 수 없습니다.'}
          </p>
          <div className="guest-photos__queue-actions">
            <Button
              className="guest-draft-secondary"
              loading={busy}
              onClick={() => {
                void controller.refresh();
              }}
            >
              사진 목록 다시 확인
            </Button>
            {removal.checked && (
              <Button
                className="guest-draft-secondary"
                disabled={busy || locked}
                onClick={controller.acknowledgeRemoval}
              >
                목록 확인 완료
              </Button>
            )}
          </div>
        </div>
      )}
      {resource.status === 'ready' && !queue.length && !removal && (
        <button
          className="guest-photos__refresh"
          type="button"
          disabled={busy}
          onClick={() => {
            void controller.refresh();
          }}
        >
          첨부 사진 목록 새로고침
        </button>
      )}
    </section>
  );
}
