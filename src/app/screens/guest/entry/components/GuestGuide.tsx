import { Link, type To } from 'react-router-dom';
import type { GuestPropertyGuideDto } from '../../../../features/guest-entry/guest-entry.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../model/guest-entry-model';
import { GuestIcon } from './GuestIcon';

export function GuestGuide({ data, home, onRefresh }: {
  data: GuestPropertyGuideDto;
  home: To;
  onRefresh: () => void;
}) {
  return (
    <>
      <Link className="guest-home-link" to={home}><span aria-hidden="true">←</span> 홈으로</Link>
      <div className="guest-guide-property">
        <p className="guest-eyebrow">{data.property.region || 'OH BOK RETREAT'}</p>
        <p>{data.property.name}</p>
      </div>
      {data.guide === null ? (
        <section className="guest-card guest-empty">
          <div className="guest-state__icon"><GuestIcon name="guide" /></div>
          <h1>아직 등록된 이용 안내가 없습니다</h1>
          <p>안내가 게시되면 이곳에서 확인할 수 있습니다.</p>
          <Button onClick={onRefresh}>다시 확인</Button>
        </section>
      ) : (
        <article className="guest-card guest-guide">
          <header>
            <span className="guest-badge">이용 안내</span>
            <h1>{data.guide.title}</h1>
            <p>최근 업데이트 <time dateTime={data.guide.updatedAt}>{formatGuestStayTimestamp(data.guide.updatedAt)}</time></p>
          </header>
          <div className="guest-guide__content">{data.guide.content}</div>
        </article>
      )}
    </>
  );
}
