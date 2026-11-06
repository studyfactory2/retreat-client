import type { ReactNode } from 'react';
import { GuestPhotoPicker } from './GuestPhotoPicker';
import { ROOM_PHOTO } from '../model/guest-flow-model';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestDraftPhotosController } from '../hooks/use-guest-draft-photos';
import { formatGuestPhotoSize } from '../model/guest-draft-photo-model';
import { GuestDraftPhotoCard } from './GuestDraftPhotoCard';
import '../styles/guest-draft-photos.css';

export function GuestDraftPhotos({
  controller,
  renderAssignment,
  checkIn,
  hasIssues,
}: {
  hasIssues: boolean;
  checkIn: boolean;
  controller: GuestDraftPhotosController;
  renderAssignment?: (photo: GuestDraftPhotoDto, index: number) => ReactNode;
}) {
  const { resource, queue, items, limits, busy, locked, removal } = controller;
  const disabled = locked || busy || controller.blocked;
  const canAttach = checkIn || hasIssues;
  const remaining = Math.max(0, (limits?.maxPhotos ?? 40) - items.length);
  const paused =
    queue.length > 0 && queue.every((entry) => entry.status === 'queued');
  let guidance = '이상으로 표시한 항목이 없어요. 사진 없이 계속할 수 있어요.';
  if (checkIn) {
    guidance = hasIssues
      ? '객실 상태 사진을 남기거나 이상 항목에 연결할 수 있어요. 사진은 선택이에요.'
      : '입실 당시 객실 모습을 남길 수 있어요. 사진 없이 계속할 수 있어요.';
  } else if (hasIssues) {
    guidance = '사진은 선택이에요. 첨부한 사진마다 해당하는 이상 항목을 선택해 주세요.';
  } else if (items.length > 0) {
    guidance = '연결할 이상 항목이 없어요. 시설 확인에서 답변을 변경하거나 사진을 삭제해 주세요.';
  }
  return (
    <section
      className="guest-draft-card guest-photos"
      aria-label="첨부 사진"
      aria-busy={busy}
    >
      <div className="guest-photos__heading">
        <h3>{checkIn ? '객실 사진' : '이상 항목 사진'}</h3>
        {resource.status === 'ready' && (
          <span className="guest-photos__count">
            {items.length} / {limits?.maxPhotos ?? 40}장
          </span>
        )}
      </div>
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
          <p className={canAttach ? 'guest-photos__intro' : 'guest-photos__empty'}>
            {guidance}
          </p>
          {items.length > 0 && (
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
          )}
          <GuestPhotoPicker
            label={checkIn ? '객실 상태 사진 추가' : '이상 사진 추가'}
            disabled={disabled || remaining === 0 || !canAttach}
            onPick={(files) =>
              controller.uploadFiles(files, checkIn ? ROOM_PHOTO : undefined)
            }
          />
          <details className="guest-photos__guide">
            <summary>사진 첨부 안내</summary>
            <p>
              JPEG · PNG · WebP · 한 장당 최대{' '}
              {(
                (limits?.maxBytes ?? 10 * 1024 * 1024) /
                (1024 * 1024)
              ).toLocaleString('ko-KR')}
              MiB. HEIC·HEIF는 JPEG로 변환해 주세요.
            </p>
            <p>사진은 즉시 업로드됩니다. 사진 용도와 이상 항목 연결은 최종 제출 시 저장됩니다.</p>
            {items.length > 0 && (
              <p>{checkIn
                ? '링크를 다시 열면 사진 용도를 확인해 주세요.'
                : '링크를 다시 열면 이상 항목을 다시 선택해 주세요.'}</p>
            )}
            {!queue.length && !removal && (
              <button className="guest-photos__refresh" type="button" disabled={busy}
                onClick={() => { void controller.refresh(); }}>
                사진 목록 새로고침
              </button>
            )}
          </details>
        </>
      )}
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
    </section>
  );
}
