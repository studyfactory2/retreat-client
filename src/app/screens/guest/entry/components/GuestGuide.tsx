import { Link, type To } from 'react-router-dom';
import type {
  GuestEntryContext,
  GuestPropertyGuideDto,
} from '../../../../features/guest-entry/guest-entry.types';
import { PropertyGuideContent } from '../../../../features/property-guide/components/PropertyGuideContent';
import { Button } from '../../../../shared/ui/Button/Button';
import { GuestManagerContact } from '../../components/GuestManagerContact';
import { GuestIcon } from './GuestIcon';
import '../styles/guest-guide.css';

const guideDate = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});
const guideTime = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  hour: '2-digit',
  minute: '2-digit',
  hourCycle: 'h23',
});

function PlannedTime({ label, at }: { label: string; at: string }) {
  const date = new Date(at);
  return (
    <div>
      <dt>{label}</dt>
      <dd>
        <time dateTime={at}>
          <span>{guideDate.format(date)}</span>
          <strong>{guideTime.format(date)}</strong>
        </time>
      </dd>
    </div>
  );
}

export function GuestGuide({
  data,
  entry,
  home,
  onRefresh,
}: {
  data: GuestPropertyGuideDto;
  entry: GuestEntryContext;
  home: To;
  onRefresh: () => void;
}) {
  return (
    <div className="guest-guide-page">
      <div className="guest-guide-toolbar">
        <Link to={home}>
          <span aria-hidden="true">←</span> 홈으로
        </Link>
        <span>휴양소 이용 안내</span>
      </div>
      <header className="guest-guide-heading">
        <p className="guest-guide-heading__property">{data.property.name}</p>
        <h1>{data.guide?.title ?? '이용 안내'}</h1>
        <div className="guest-guide-heading__meta">
          {data.property.region && <span>{data.property.region}</span>}
          {data.guide && (
            <span>
              업데이트{' '}
              <time dateTime={data.guide.updatedAt}>
                {guideDate.format(new Date(data.guide.updatedAt))}
              </time>
            </span>
          )}
        </div>
      </header>
      <div
        className={`guest-guide-context${entry.kind === 'stay' ? ' guest-guide-context--stay' : ''}`}
      >
        {entry.kind === 'stay' && (
          <section
            className="guest-guide-stay"
            aria-label="나의 예정 이용 일정"
          >
            <div className="guest-guide-stay__heading">
              <h2>나의 이용 일정</h2>
              <span>예정 · 한국 시간</span>
            </div>
            <dl>
              <PlannedTime label="입실 예정" at={entry.context.checkInAt} />
              <PlannedTime label="퇴실 예정" at={entry.context.checkOutAt} />
            </dl>
          </section>
        )}
        <GuestManagerContact
          phone={entry.context.property.publicContactPhone}
        />
      </div>
      {data.guide === null ? (
        <section className="guest-guide-empty">
          <GuestIcon name="guide" />
          <h2>아직 등록된 이용 안내가 없어요</h2>
          <p>안내가 게시되면 이곳에서 확인할 수 있습니다.</p>
          <Button onClick={onRefresh}>다시 확인</Button>
        </section>
      ) : (
        <article className="guest-guide-sheet" aria-label="이용 안내 내용">
          <PropertyGuideContent
            key={`${data.property.id}:${data.guide.version}`}
            content={data.guide.content}
          />
        </article>
      )}
    </div>
  );
}
