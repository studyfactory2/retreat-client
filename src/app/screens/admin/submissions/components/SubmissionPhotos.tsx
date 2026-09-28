import { useEffect, useRef, useState } from 'react';
import type {
  AdminSubmissionPhoto,
  AdminSubmissionRevision,
} from '../../../../features/admin-submissions/admin-submissions.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  submissionPhotoLocation,
  submissionPhotoPurpose,
  submissionTime,
} from '../model/submission-detail-model';
import { useSubmissionPhoto } from '../hooks/use-submission-photo';

export function SubmissionPhotos({
  revision,
  token,
  rejectSession,
}: {
  revision: AdminSubmissionRevision;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const photo = revision.photos.find((candidate) => candidate.id === selected);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  function close() {
    setSelected(null);
    if (photo) buttons.current.get(photo.id)?.focus();
  }
  return (
    <section className="submission-detail-card submission-photos">
      <div className="submission-detail-section-heading">
        <h3>첨부 사진</h3>
        <p>
          {revision.photos.length}장 · 버전 {revision.version}
        </p>
      </div>
      {revision.photos.length === 0 ? (
        <p className="submission-detail-muted">첨부된 사진이 없습니다.</p>
      ) : (
        <>
          <p className="submission-detail-caption">
            사진 보기를 누르면 해당 버전에 첨부된 사진을 불러옵니다.
          </p>
          <ul className="submission-photo-list">
            {revision.photos.map((item, index) => (
              <li key={item.id}>
                <div>
                  <span className="submission-detail-badge">
                    {submissionPhotoPurpose(item.purpose)}
                  </span>
                  <strong>
                    {submissionPhotoLocation(item, revision.record)}
                  </strong>
                  <span className="submission-detail-caption">
                    사진 {index + 1} · {item.filename} ·{' '}
                    {(item.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="ui-button admin-button-secondary"
                  aria-expanded={photo?.id === item.id}
                  ref={(element) => {
                    if (element) buttons.current.set(item.id, element);
                    else buttons.current.delete(item.id);
                  }}
                  onClick={() =>
                    setSelected((current) =>
                      current === item.id ? null : item.id,
                    )
                  }
                >
                  {photo?.id === item.id ? '사진 닫기' : '사진 보기'}
                </button>
              </li>
            ))}
          </ul>
          {photo && (
            <PhotoViewer
              key={`${revision.id}:${photo.id}`}
              submissionId={revision.submissionId}
              revisionId={revision.id}
              photo={photo}
              label={`${submissionPhotoPurpose(photo.purpose)} · ${submissionPhotoLocation(photo, revision.record)}`}
              token={token}
              rejectSession={rejectSession}
              onClose={close}
            />
          )}
        </>
      )}
    </section>
  );
}

function PhotoViewer({
  submissionId,
  revisionId,
  photo,
  label,
  token,
  rejectSession,
  onClose,
}: {
  submissionId: string;
  revisionId: string;
  photo: AdminSubmissionPhoto;
  label: string;
  token: string;
  rejectSession: (token: string) => void;
  onClose: () => void;
}) {
  const { resource, refresh, imageFailed } = useSubmissionPhoto(
    submissionId,
    revisionId,
    photo.id,
    token,
    rejectSession,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus({ preventScroll: true });
  }, []);
  return (
    <div className="submission-photo-viewer">
      <div className="submission-detail-section-heading">
        <h4 ref={heading} tabIndex={-1}>
          {label}
        </h4>
        <Button className="admin-button-secondary" onClick={onClose}>
          닫기
        </Button>
      </div>
      {resource.status === 'loading' ? (
        <p role="status">사진을 불러오는 중입니다.</p>
      ) : resource.status === 'ready' ? (
        <>
          <img
            key={resource.url}
            src={resource.url}
            alt={label}
            width={photo.width}
            height={photo.height}
            referrerPolicy="no-referrer"
            onError={imageFailed}
          />
          <p className="submission-detail-caption">
            사진 열람 만료: {submissionTime(resource.expiresAt)} · 만료되면 다시
            불러올 수 있습니다.
          </p>
        </>
      ) : (
        <div role={resource.status === 'error' ? 'alert' : 'status'}>
          <p>
            {resource.status === 'expired'
              ? '사진 열람 시간이 만료되었습니다.'
              : '사진을 불러오지 못했습니다. 접근 권한이나 연결 상태를 확인한 뒤 다시 시도해 주세요.'}
          </p>
          <Button className="admin-button-secondary" onClick={refresh}>
            사진 다시 불러오기
          </Button>
        </div>
      )}
    </div>
  );
}
