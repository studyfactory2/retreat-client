import type { GuestDraftAnswers } from '../../../../features/guest-drafts/guest-drafts.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatGuestStayTimestamp } from '../../entry/model/guest-entry-model';
import type { DraftResource } from '../hooks/use-guest-draft';
import { changeDraftAnswer, changeDraftDetails } from '../model/guest-draft-model';
import { DraftAnswerField } from './DraftAnswerField';
import { DraftResumeLink } from './DraftResumeLink';

export function GuestDraftForm({ resource, token, dirty, edit, save, reload, recheck }: {
  resource: Extract<DraftResource, { status: 'ready' }>;
  token: string; dirty: boolean;
  edit: (change: (answers: GuestDraftAnswers) => GuestDraftAnswers) => void;
  save: () => Promise<void>;
  reload: () => void;
  recheck: () => void;
}) {
  const { draft, answers, access, mutation, message } = resource;
  const title = draft.type === 'CHECK_IN' ? '입실 체크' : '퇴실 체크';
  const saving = mutation === 'saving';
  const review = mutation === 'conflict' || mutation === 'uncertain';
  const total = draft.template.definition.sections.reduce((count, section) => count + section.items.length, 0);
  const disabled = saving || review || access === 'checking';
  return (
    <>
      <section className="guest-draft-intro">
        <p className="guest-draft-eyebrow">이용객 체크리스트</p>
        <h1>{title}</h1>
        <p className="guest-draft-property">{draft.property.region ? `${draft.property.region} · ` : ''}{draft.property.name}</p>
        <p>시설 상태를 확인해 주세요. 화면을 나가기 전 임시 저장하면 작성 링크에서 이어서 작성할 수 있습니다.</p>
      </section>
      <section className="guest-draft-card guest-draft-person" aria-label="이용 정보">
        <dl>
          <div><dt>이용일</dt><dd>{draft.visitDate.replaceAll('-', '.')}</dd></div>
          <div><dt>이름</dt><dd>{draft.author.name}</dd></div>
          {(draft.author.company || draft.author.department) && <div><dt>회사 · 부서</dt><dd>{[draft.author.company, draft.author.department].filter(Boolean).join(' · ')}</dd></div>}
        </dl>
      </section>
      <div className="guest-draft-progress" aria-label="체크리스트 작성 현황">
        <div><strong>{answers.items.length}<span> / {total} 항목</span></strong><span>작성한 항목</span></div>
        <progress value={answers.items.length} max={total} aria-label="작성한 항목" />
        <p>필수 항목도 일부만 작성하여 임시 저장할 수 있습니다.</p>
      </div>
      {(message || access === 'checking') && (
        <section className={`guest-draft-notice${mutation === 'saved' && access === 'ready' ? ' guest-draft-notice--saved' : ''}`}
          role={mutation === 'saved' || access === 'checking' ? 'status' : 'alert'}>
          <p>{access === 'checking' ? '작성 링크와 최신 저장 상태를 확인하고 있습니다. 현재 입력은 유지됩니다.' : message}</p>
          {access === 'blocked' && <Button className="guest-draft-secondary" onClick={recheck}>연결 다시 확인</Button>}
          {review && access !== 'checking' && <Button className="guest-draft-secondary" onClick={reload}>서버 내용으로 다시 불러오기</Button>}
        </section>
      )}
      <form className="guest-draft-form" onSubmit={(event) => { event.preventDefault(); void save(); }} aria-busy={saving}>
        {draft.template.definition.sections.map((section, index) => (
          <section className="guest-draft-section" key={section.id} aria-labelledby={`draft-section-${section.id}`}>
            <h2 id={`draft-section-${section.id}`}><span>{String(index + 1).padStart(2, '0')}</span>{section.title}</h2>
            {section.items.map((item) => (
              <DraftAnswerField key={item.id} item={item} disabled={disabled}
                answer={answers.items.find((answer) => answer.itemId === item.id)}
                onValue={(value) => edit((current) => changeDraftAnswer(current, item.id, value))}
                onDetails={(change) => edit((current) => changeDraftDetails(current, item.id, change))} />
            ))}
          </section>
        ))}
        <section className="guest-draft-card guest-draft-note">
          <label htmlFor="draft-general-note">추가 전달 사항 <span>선택</span></label>
          <textarea id="draft-general-note" rows={4} maxLength={4000} disabled={disabled}
            placeholder="함께 전달할 내용이 있다면 남겨주세요." value={answers.generalNote ?? ''}
            onChange={(event) => edit((current) => ({ ...current, generalNote: event.target.value || null }))} />
        </section>
        <div className="guest-draft-save">
          <p role="status">{saving ? '저장하고 있습니다…' : dirty ? '아직 저장하지 않은 변경 사항이 있습니다.' : `최근 저장: ${formatGuestStayTimestamp(draft.updatedAt)} · 한국 시간`}</p>
          <Button type="submit" loading={saving} disabled={!dirty || review || access !== 'ready'}>임시 저장</Button>
          <p>현재는 임시 저장만 가능합니다.<br />임시 저장한 내용은 최종 제출된 기록으로 처리되지 않습니다.</p>
        </div>
      </form>
      <DraftResumeLink token={token} expiresAt={draft.expiresAt} disabled={saving || access !== 'ready'} />
      <button type="button" className="guest-draft-reload" disabled={saving || access === 'checking'} onClick={reload}>서버 저장 내용 다시 불러오기</button>
    </>
  );
}
