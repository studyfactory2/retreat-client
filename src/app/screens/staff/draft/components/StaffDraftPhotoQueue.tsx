import { Button } from '../../../../shared/ui/Button/Button';
import type { useStaffDraftPhotos } from '../hooks/use-staff-draft-photos';
import { formatStaffPhotoSize } from '../model/staff-draft-photo-model';

export function StaffDraftPhotoQueue({
  controller,
}: {
  controller: ReturnType<typeof useStaffDraftPhotos>;
}) {
  const { queue, busy, writing, resource } = controller;
  if (!queue.length) return null;
  const labels = {
    invalid: '파일 확인 필요',
    queued: '대기 중',
    uploading: '확인·업로드 중',
    failed: '업로드 실패',
    uncertain: '결과 확인 필요',
  };
  return (
    <div className="staff-photos-queue" aria-label="선택한 사진의 업로드 상태">
      <h3>
        사진 업로드 <span>{queue.length}장 남음</span>
      </h3>
      <ul>
        {queue.map((entry) => (
          <li
            key={entry.id}
            className={`staff-photos-queued staff-photos-queued--${entry.status}`}
          >
            <strong>{entry.filename}</strong>
            <span>
              {formatStaffPhotoSize(entry.sizeBytes)} · {labels[entry.status]}
            </span>
            {entry.status === 'uploading' && (
              <progress aria-label={`${entry.filename} 업로드 중`} />
            )}
            {entry.message && <p role="status">{entry.message}</p>}
            {entry.checked && entry.status === 'uncertain' && (
              <p>
                목록을 확인했습니다. 사진이 아직 처리 중일 수 있으니, 필요할
                때만 다시 선택해 주세요. 다시 올리면 중복될 수 있습니다.
              </p>
            )}
            {entry.status !== 'uploading' && (
              <div className="staff-photos-actions">
                {(entry.status === 'failed' || entry.status === 'uncertain') &&
                  !entry.checked && (
                    <Button
                      disabled={
                        busy ||
                        resource.status === 'loading' ||
                        resource.status === 'unavailable'
                      }
                      onClick={() => {
                        void controller.refresh();
                      }}
                    >
                      사진 목록 확인
                    </Button>
                  )}
                {entry.status === 'failed' && entry.checked && entry.file && (
                  <Button
                    disabled={
                      busy ||
                      !controller.canWrite ||
                      resource.status !== 'ready'
                    }
                    onClick={() => controller.retry(entry.id)}
                  >
                    다시 올리기
                  </Button>
                )}
                <Button
                  disabled={
                    writing || (entry.status === 'uncertain' && !entry.checked)
                  }
                  onClick={() => controller.dismiss(entry.id)}
                >
                  {entry.status === 'uncertain'
                    ? '확인 후 선택 닫기'
                    : '선택 취소'}
                </Button>
              </div>
            )}
          </li>
        ))}
      </ul>
      {queue.every((entry) => entry.status === 'queued') && (
        <Button
          disabled={busy || !controller.canWrite}
          onClick={() => {
            void controller.continueQueue();
          }}
        >
          남은 사진 올리기
        </Button>
      )}
      <p className="staff-photos-help">
        업로드 결과를 확인한 뒤 이동해 주세요. 아직 올리지 않은 파일 선택은
        화면을 떠나면 사라집니다.
      </p>
    </div>
  );
}
