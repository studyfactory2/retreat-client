import { useEffect, useId, useRef, useState } from 'react';
import type {
  AdminIssueEventDto,
  AdminIssuePhotoDto,
} from '../../../../features/admin-issues/admin-issues.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { useIssuePhoto } from '../hooks/use-issue-photo';
import { issueEventLabel, issueTime } from '../model/issue-presentation';

export function IssuePhotos({
  event,
  token,
  rejectSession,
}: {
  event: AdminIssueEventDto;
  token: string;
  rejectSession: (token: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const buttons = useRef(new Map<string, HTMLButtonElement>());
  const viewerId = useId();
  const selectedIndex = event.photos.findIndex(
    (candidate) => candidate.id === selected,
  );
  const photo = event.photos[selectedIndex];
  function close() {
    setSelected(null);
    if (photo) buttons.current.get(photo.id)?.focus();
  }
  return (
    <section className="issue-photos">
      <div className="issue-detail-section-heading">
        <h4>첨부 사진</h4>
        <p className="issue-detail-caption">
          {event.photos.length}장 · 버전 {event.version}
        </p>
      </div>
      {event.photos.length === 0 ? (
        <p className="issue-detail-caption">
          이 이력에 첨부된 사진이 없습니다.
        </p>
      ) : (
        <>
          <p className="issue-detail-caption">
            사진 보기를 누르면 이 이력에 저장된 사진을 불러옵니다.
          </p>
          <ul className="issue-photo-list">
            {event.photos.map((item, index) => (
              <li key={item.id}>
                <div>
                  <strong>사진 {index + 1}</strong>
                  <span className="issue-detail-caption">
                    {item.filename} · {(item.sizeBytes / 1024).toFixed(0)} KB
                  </span>
                </div>
                <button
                  type="button"
                  className="ui-button admin-button-secondary"
                  aria-expanded={photo?.id === item.id}
                  aria-controls={photo?.id === item.id ? viewerId : undefined}
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
              key={`${event.id}:${photo.id}`}
              id={viewerId}
              issueId={event.issueId}
              eventId={event.id}
              photo={photo}
              label={`${issueEventLabel(event.type)} · 사진 ${selectedIndex + 1}`}
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
  id,
  issueId,
  eventId,
  photo,
  label,
  token,
  rejectSession,
  onClose,
}: {
  id: string;
  issueId: string;
  eventId: string;
  photo: AdminIssuePhotoDto;
  label: string;
  token: string;
  rejectSession: (token: string) => void;
  onClose: () => void;
}) {
  const { resource, refresh, imageFailed } = useIssuePhoto(
    issueId,
    eventId,
    photo.id,
    token,
    rejectSession,
  );
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    heading.current?.focus();
  }, []);
  return (
    <div className="issue-photo-viewer" id={id}>
      <div className="issue-detail-section-heading">
        <h4 tabIndex={-1} ref={heading}>
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
          <p className="issue-detail-caption">
            사진 열람 만료: {issueTime(resource.expiresAt)} · 만료되면 다시
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
