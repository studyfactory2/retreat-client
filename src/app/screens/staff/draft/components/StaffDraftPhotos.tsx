import { useId } from 'react';
import { useNavigationGuard } from '../../../../core/router/navigation/use-navigation-guard';
import { Button } from '../../../../shared/ui/Button/Button';
import { useStaffDraftPhotos } from '../hooks/use-staff-draft-photos';
import {
  STAFF_PHOTO_QUEUE_LIMIT,
  formatStaffPhotoSize,
} from '../model/staff-draft-photo-model';
import { StaffDraftPhotoCard } from './StaffDraftPhotoCard';
import { StaffDraftPhotoQueue } from './StaffDraftPhotoQueue';
import '../styles/staff-draft-photos.css';

export function StaffDraftPhotos({
  token,
  draftId,
  expiresAt,
  locked,
  accessReady,
  onAccessRejected,
}: {
  token: string;
  draftId: string;
  expiresAt: string;
  locked: boolean;
  accessReady: boolean;
  onAccessRejected: () => void;
}) {
  const controller = useStaffDraftPhotos({
    token,
    draftId,
    expiresAt,
    locked,
    accessReady,
    onAccessRejected,
  });
  useNavigationGuard(controller.hasPendingWork);
  const inputId = useId();
  const { resource, items, limits, queue, busy, writing, removal } = controller;
  const limitNames = limits?.acceptedTypes
    .map((type) =>
      type === 'image/jpeg' ? 'JPEG' : type === 'image/png' ? 'PNG' : 'WebP',
    )
    .join(', ');
  return (
    <section
      className="staff-draft-card staff-photos"
      aria-labelledby={`${inputId}-title`}
    >
      <div className="staff-photos-heading">
        <div>
          <span className="staff-draft-eyebrow">정비 사진</span>
          <h2 id={`${inputId}-title`}>
            사진 첨부 <span>선택</span>
          </h2>
        </div>
        {resource.status === 'ready' && limits && (
          <span className="staff-photos-count">
            {items.length} / {limits.maxPhotos}장
          </span>
        )}
      </div>
      <p className="staff-photos-intro">
        정비 현장의 모습을 사진으로 남겨 주세요. 사진을 선택하면 체크리스트의
        임시 저장과 별도로 업로드됩니다.
      </p>
      <p className="staff-photos-separate">
        사진을 추가하거나 삭제해도 작성 중인 체크리스트는 바뀌지 않습니다.
        체크리스트 변경 내용은 위의 임시 저장 버튼으로 저장해 주세요.
      </p>
      {resource.status === 'loading' ? (
        <p className="staff-photos-status" role="status">
          저장된 사진과 업로드 제한을 확인하고 있습니다.
        </p>
      ) : resource.status === 'error' || resource.status === 'unavailable' ? (
        <div className="staff-photos-notice" role="alert">
          <p>{resource.message}</p>
          <Button
            disabled={busy || !accessReady || resource.status === 'unavailable'}
            onClick={() => {
              void controller.refresh();
            }}
          >
            사진 목록 다시 확인
          </Button>
        </div>
      ) : (
        <>
          {items.length ? (
            <div className="staff-photos-grid">
              {items.map((photo, index) => (
                <StaffDraftPhotoCard
                  key={photo.id}
                  photo={photo}
                  index={index}
                  token={token}
                  draftId={draftId}
                  draftExpiresAt={expiresAt}
                  previewEnabled={accessReady}
                  removeDisabled={!controller.canWrite || queue.length > 0}
                  onRemove={controller.remove}
                  onAccessRejected={onAccessRejected}
                />
              ))}
            </div>
          ) : (
            <div className="staff-photos-empty">
              <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                <rect x="3" y="4" width="18" height="16" rx="3" />
                <circle cx="8" cy="9" r="1.5" />
                <path d="m4 17 5-5 4 4 3-3 5 5" />
              </svg>
              <p>아직 첨부한 사진이 없습니다.</p>
              <span>필요한 사진만 자유롭게 추가해 주세요.</span>
            </div>
          )}
        </>
      )}
      {/* Keep the picker mounted while returning from a native file dialog. */}
      <label
        className="staff-photos-picker"
        htmlFor={inputId}
        aria-disabled={!controller.canSelect}
      >
        <span>＋ 사진 선택</span>
        <input
          id={inputId}
          type="file"
          accept={limits?.acceptedTypes.join(',')}
          multiple
          disabled={!controller.canSelect}
          onChange={(event) => {
            if (event.currentTarget.files)
              controller.uploadFiles(event.currentTarget.files);
            event.currentTarget.value = '';
          }}
        />
      </label>
      {limits && (
        <p className="staff-photos-help">
          한 장당 최대 {formatStaffPhotoSize(limits.maxBytes)} · {limitNames} ·
          최대 {limits.maxPhotos}장<br />한 번에 {STAFF_PHOTO_QUEUE_LIMIT}장까지
          선택할 수 있습니다. 처리 중인 사진도 서버 제한에 포함됩니다.
        </p>
      )}
      <p className="staff-photos-help">
        HEIC·HEIF 사진은 JPEG로 변환한 뒤 선택해 주세요.
      </p>
      {!accessReady && (
        <p className="staff-photos-status" role="status">
          작성 링크를 다시 확인하고 있습니다. 선택한 파일은 이 화면에
          보관됩니다.
        </p>
      )}
      {accessReady && locked && (
        <p className="staff-photos-status" role="status">
          체크리스트 저장 또는 확인이 끝나면 사진을 추가·삭제할 수 있습니다.
        </p>
      )}
      {writing && (
        <p className="staff-photos-status" role="status">
          사진을 처리하고 있습니다. 최대 2장씩 올리며, 각 사진의 결과를 아래에서
          확인할 수 있습니다.
        </p>
      )}
      {controller.notice && (
        <p className="staff-photos-status" role="status">
          {controller.notice}
        </p>
      )}
      <StaffDraftPhotoQueue controller={controller} />
      {removal && (
        <div className="staff-photos-notice" role="alert">
          <p>
            {removal.checked
              ? '현재 목록에 사진이 남아 있습니다. 이전 삭제 요청이 아직 처리 중일 수 있습니다. 목록을 확인한 후 필요할 때만 삭제를 다시 선택해 주세요.'
              : '삭제 결과를 확인하지 못했습니다. 사진 목록을 먼저 확인해 주세요. 자동으로 다시 삭제하지 않습니다.'}
          </p>
          <div className="staff-photos-actions">
            <Button
              disabled={busy || !accessReady}
              onClick={() => {
                void controller.refresh();
              }}
            >
              사진 목록 다시 확인
            </Button>
            {removal.checked && (
              <Button
                disabled={busy || locked || !accessReady}
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
          type="button"
          className="staff-photos-refresh"
          disabled={busy || !accessReady}
          onClick={() => {
            void controller.refresh();
          }}
        >
          사진 목록 새로고침
        </button>
      )}
    </section>
  );
}
