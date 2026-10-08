import { useId, useState } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuestIssuePhotosController } from '../hooks/use-guest-issue-photos';
import { formatIssuePhotoSize } from '../model/guest-issue-photo-model';
import { GuestIssuePhotoCard } from './GuestIssuePhotoCard';
import '../styles/guest-issue-photos.css';

export function GuestIssuePhotos({
  controller,
  readOnly = false,
}: {
  controller: GuestIssuePhotosController;
  readOnly?: boolean;
}) {
  const inputId = useId();
  const [abandonId, setAbandonId] = useState<number | null>(null);
  const { photos, queue, busy, disabled, blocked, unavailable, maxPhotos } =
    controller;
  const selected = photos.length + queue.length;
  const pendingRemoval = photos.some(
    (entry) => entry.status === 'remove-uncertain',
  );
  const paused =
    queue.length > 0 && queue.every((entry) => entry.status === 'queued');
  return (
    <section
      className="guest-issue-photos"
      aria-labelledby={`${inputId}-title`}
      aria-busy={busy}
    >
      <div className="guest-issue-photos__heading">
        <h2 id={`${inputId}-title`}>
          {readOnly ? '첨부 사진' : '사진 첨부'}
          {!readOnly && <span>선택</span>}
        </h2>
        <span>
          {photos.length} / {maxPhotos}장
        </span>
      </div>
      {!readOnly && (
        <p className="guest-issue-photos__intro">
          불편한 부분을 보여 주세요. 사진 없이도 신고할 수 있어요.
        </p>
      )}
      {photos.length ? (
        <div className="guest-issue-photos__grid">
          {photos.map((entry, index) => (
            <GuestIssuePhotoCard
              key={entry.photo.id}
              entry={entry}
              index={index}
              readOnly={readOnly}
              disabled={
                disabled ||
                busy ||
                unavailable ||
                (queue.length > 0 &&
                  entry.status !== 'expired' &&
                  entry.status !== 'unavailable') ||
                (pendingRemoval && entry.status !== 'remove-uncertain')
              }
              getPreview={controller.getPreview}
              onRemove={controller.remove}
              onDiscard={controller.discardUnavailable}
            />
          ))}
        </div>
      ) : (
        <div className="guest-issue-photos__empty">
          <p>{readOnly ? '첨부한 사진 없음' : '아직 첨부한 사진이 없어요.'}</p>
        </div>
      )}
      {readOnly && photos.some((entry) => entry.status !== 'ready') && (
        <p className="guest-issue-photos__help">
          사용할 수 없는 사진은 작성 화면으로 돌아가 확인해 주세요.
        </p>
      )}
      {!readOnly && (
        <>
          <label
            className="guest-issue-photos__picker"
            htmlFor={inputId}
            aria-disabled={disabled || blocked || selected >= maxPhotos}
          >
            <span>＋ 사진 추가</span>
            <input
              id={inputId}
              type="file"
              multiple
              accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
              disabled={disabled || blocked || selected >= maxPhotos}
              onChange={(event) => {
                if (event.currentTarget.files)
                  controller.uploadFiles(event.currentTarget.files);
                event.currentTarget.value = '';
              }}
            />
          </label>
          <p className="guest-issue-photos__help">
            한 장당 최대 10MiB · JPEG, PNG, WebP · 최대 {maxPhotos}장<br />
            HEIC·HEIF 사진은 JPEG로 변환한 뒤 선택해 주세요.
          </p>
          <p className="guest-issue-photos__privacy">
            새로고침하거나 창을 닫으면 사진을 다시 첨부해야 해요. 올린 사진은
            24시간 안에 신고에 사용해 주세요.
          </p>
        </>
      )}
      {controller.notice && (
        <p className="guest-issue-photos__notice" role="status">
          {controller.notice}
        </p>
      )}
      {!readOnly && queue.length > 0 && (
        <div
          className="guest-issue-photos__queue"
          aria-label="선택한 사진의 업로드 상태"
        >
          <h3>선택한 사진</h3>
          {queue.map((entry) => (
            <div
              key={entry.id}
              className={`guest-issue-photos__queued guest-issue-photos__queued--${entry.status}`}
            >
              <div>
                <strong>{entry.file.name}</strong>
                <span>
                  {formatIssuePhotoSize(entry.file.size)} ·{' '}
                  {entry.status === 'queued'
                    ? '대기 중'
                    : entry.status === 'uploading'
                      ? '올리는 중'
                      : entry.status === 'failed'
                        ? '업로드 실패'
                        : '결과 확인 필요'}
                </span>
              </div>
              {entry.message && <p>{entry.message}</p>}
              {entry.status === 'uncertain' && abandonId === entry.id ? (
                <div className="guest-issue-photos__abandon" role="alert">
                  <p>
                    올라간 사진을 다시 불러오거나 이 화면에서 삭제할 수
                    없습니다. 이 신고에 첨부하지 않고 선택을 포기할까요?
                  </p>
                  <div>
                    <Button
                      disabled={disabled || busy}
                      className="guest-issue-photo-secondary"
                      onClick={() => {
                        controller.dismissQueued(entry.id, true);
                        setAbandonId(null);
                      }}
                    >
                      선택 포기
                    </Button>
                    <Button
                      className="guest-issue-photo-secondary"
                      onClick={() => setAbandonId(null)}
                    >
                      돌아가기
                    </Button>
                  </div>
                </div>
              ) : (
                entry.status !== 'uploading' && (
                  <div className="guest-issue-photos__queue-actions">
                    {entry.status === 'failed' && (
                      <Button
                        className="guest-issue-photo-secondary"
                        disabled={disabled || busy}
                        onClick={() => controller.retryUpload(entry.id)}
                      >
                        다시 올리기
                      </Button>
                    )}
                    <Button
                      className="guest-issue-photo-secondary"
                      disabled={disabled || busy}
                      onClick={() => {
                        if (entry.status === 'uncertain')
                          setAbandonId(entry.id);
                        else controller.dismissQueued(entry.id);
                      }}
                    >
                      {entry.status === 'uncertain'
                        ? '이 선택 포기하기'
                        : '선택 취소'}
                    </Button>
                  </div>
                )
              )}
            </div>
          ))}
          {paused && (
            <Button
              disabled={disabled || busy || pendingRemoval}
              className="guest-issue-photo-secondary"
              onClick={() => {
                void controller.continueQueue();
              }}
            >
              남은 사진 올리기
            </Button>
          )}
          <p className="guest-issue-photos__help">
            대기·실패·확인이 필요한 사진을 처리하면 신고 검토를 계속할 수
            있습니다.
          </p>
        </div>
      )}
    </section>
  );
}
