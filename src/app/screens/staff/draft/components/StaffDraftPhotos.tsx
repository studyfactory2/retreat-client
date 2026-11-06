import { useId, type ReactNode } from 'react';
import { useNavigationGuard } from '../../../../core/router/navigation/use-navigation-guard';
import { Button } from '../../../../shared/ui/Button/Button';
import type { StaffDraftPhotosController } from '../hooks/use-staff-draft-photos';
import type { StaffDraftPhotoDto } from '../../../../features/staff-draft-photos/staff-draft-photos.types';
import {
  STAFF_PHOTO_QUEUE_LIMIT,
  formatStaffPhotoSize,
} from '../model/staff-draft-photo-model';
import {
  propertyPhotoLocation,
  type StaffPhotoAssignment,
} from '../model/staff-flow-model';
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
  controller,
  renderAssignment,
  assignments,
  requiredAfter = false,
}: {
  token: string;
  draftId: string;
  expiresAt: string;
  locked: boolean;
  accessReady: boolean;
  onAccessRejected: () => void;
  controller: StaffDraftPhotosController;
  requiredAfter?: boolean;
  assignments: Record<string, StaffPhotoAssignment>;
  renderAssignment: (photo: StaffDraftPhotoDto, index: number) => ReactNode;
}) {
  useNavigationGuard(controller.hasPendingWork);
  const inputId = useId();
  const { resource, items, limits, queue, busy, writing, removal } = controller;
  const afterCount = items.filter((photo) => {
    const assigned = assignments[photo.id];
    return (
      assigned?.purpose === 'MAINTENANCE_AFTER' && Boolean(assigned.location)
    );
  }).length;
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
      <header className="staff-photos-heading">
        <h2 id={`${inputId}-title`}>
          {requiredAfter ? '정비 후 사진' : '정비 사진'}
        </h2>
        {resource.status === 'ready' && (
          <span
            className={`staff-photos-count${requiredAfter && afterCount ? ' is-complete' : ''}`}
            role="status"
          >
            {requiredAfter
              ? afterCount
                ? `정비 후 ${afterCount}장 ✓`
                : '1장 이상 필요'
              : `첨부 ${items.length}장`}
          </span>
        )}
      </header>
      {/* Both pickers stay mounted while the native camera or gallery is open. */}
      <div className="staff-photo-pickers">
        <PhotoPicker
          label="정비 후 사진 추가"
          primary
          accept={limits?.acceptedTypes.join(',')}
          disabled={!controller.canSelect}
          onSelect={(files) =>
            controller.uploadFiles(files, {
              purpose: 'MAINTENANCE_AFTER',
              location: propertyPhotoLocation.value,
            })
          }
        />
        <PhotoPicker
          label="다른 사진 추가"
          accept={limits?.acceptedTypes.join(',')}
          disabled={!controller.canSelect}
          onSelect={(files) => controller.uploadFiles(files)}
        />
      </div>
      {resource.status === 'loading' ? (
        <p className="staff-photos-status" role="status">
          사진 목록을 확인하고 있어요.
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
        items.length > 0 && (
          <div className="staff-photos-grid">
            {items.map((photo, index) => (
              <div className="staff-flow-photo" key={photo.id}>
                <StaffDraftPhotoCard
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
                {renderAssignment(photo, index)}
              </div>
            ))}
          </div>
        )
      )}
      <details className="staff-photos-details">
        <summary>사진 첨부 안내</summary>
        <p className="staff-photos-help">
          사진은 선택하면 업로드됩니다. 용도와 위치는 최종 제출 때 저장되므로,
          작성 링크를 다시 열면 다시 선택해 주세요.
        </p>
        {limits && (
          <p className="staff-photos-help">
            한 장당 최대 {formatStaffPhotoSize(limits.maxBytes)} · {limitNames}{' '}
            · 최대 {limits.maxPhotos}장<br />한 번에 {STAFF_PHOTO_QUEUE_LIMIT}
            장까지 선택할 수 있습니다. 처리 중인 사진도 서버 제한에 포함됩니다.
          </p>
        )}
        <p className="staff-photos-help">
          HEIC·HEIF 사진은 JPEG로 변환한 뒤 선택해 주세요.
        </p>
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
      </details>
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
          사진을 올리고 있어요.
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
    </section>
  );
}

function PhotoPicker({
  label,
  primary = false,
  accept,
  disabled,
  onSelect,
}: {
  label: string;
  primary?: boolean;
  accept?: string;
  disabled: boolean;
  onSelect: (files: FileList) => void;
}) {
  return (
    <label
      className={`staff-photos-picker${primary ? ' is-primary' : ''}`}
      aria-disabled={disabled}
    >
      <span aria-hidden="true">＋</span> {label}
      <input
        aria-label={label}
        type="file"
        multiple
        accept={accept}
        disabled={disabled}
        onChange={(event) => {
          if (event.currentTarget.files) onSelect(event.currentTarget.files);
          event.currentTarget.value = '';
        }}
      />
    </label>
  );
}
