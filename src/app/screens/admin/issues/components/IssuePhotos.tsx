import type { AdminIssueEventDto } from '../../../../features/admin-issues/admin-issues.types';
import { IssuePhotoGallery } from './IssuePhotoGallery';
import '../styles/issue-evidence.css';

export function IssuePhotos({
  event,
  title = '첨부 사진',
  token,
  rejectSession,
}: {
  event: AdminIssueEventDto;
  title?: string;
  token: string;
  rejectSession: (token: string) => void;
}) {
  return (
    <section className="issue-evidence-photos" aria-label={title}>
      <div className="issue-evidence-photos__heading">
        <h3>{title} <span>{event.photos.length}</span></h3>
        <span>버전 {event.version}</span>
      </div>
      {event.photos.length === 0 ? (
        <p className="issue-detail-caption">첨부 사진 없음</p>
      ) : (
        <ul className="issue-evidence-photos__grid">
          {event.photos.map((photo, index) => (
            <IssuePhotoGallery key={`${event.id}:${photo.id}`} event={event} photo={photo} index={index} token={token} rejectSession={rejectSession} />
          ))}
        </ul>
      )}
    </section>
  );
}
