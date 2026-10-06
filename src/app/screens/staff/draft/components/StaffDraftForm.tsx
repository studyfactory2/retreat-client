import { Button } from '../../../../shared/ui/Button/Button';
import type { useStaffDraft } from '../hooks/use-staff-draft';
import { changeStaffDraftDetails } from '../model/staff-draft-model';
import { formatStaffDraftTime } from '../model/staff-draft-display';
import { StaffDraftAnswerField } from './StaffDraftAnswerField';
import { StaffDraftLink } from './StaffDraftLink';

type DraftSession = ReturnType<typeof useStaffDraft>;
type ReadyResource = Extract<DraftSession['resource'], { status: 'ready' }>;
export function StaffDraftForm({
  session,
  resource,
  token,
}: {
  session: DraftSession;
  resource: ReadyResource;
  token: string;
}) {
  const { draft, answers } = resource;
  const unresolved =
    resource.mutation === 'conflict' || resource.mutation === 'uncertain';
  const saving = resource.mutation === 'saving';
  return (
    <>
      <section className="staff-draft-intro">
        <span className="staff-draft-eyebrow">MAINTENANCE · 정비 작성 중</span>
        <h1>{draft.property.name}</h1>
        {draft.property.region && <p>{draft.property.region}</p>}
        <dl className="staff-draft-identity">
          <div>
            <dt>담당 직원</dt>
            <dd>{draft.author.name}</dd>
          </div>
          <div>
            <dt>정비일</dt>
            <dd>{draft.visitDate}</dd>
          </div>
          <div>
            <dt>시작 시각</dt>
            <dd>{formatStaffDraftTime(draft.startedAt)}</dd>
          </div>
        </dl>
        <p className="staff-draft-hint">
          시작 시 지정된 직원과 체크리스트로 작성합니다. 날짜와 시각은 한국
          시간을 기준으로 합니다.
        </p>
      </section>
      <section
        className="staff-draft-card staff-draft-status"
        aria-live="polite"
      >
        <h2>
          {saving
            ? '임시 저장 중입니다'
            : resource.access === 'checking'
              ? '접근 상태를 확인하고 있습니다'
              : unresolved
                ? '저장 내용을 확인해 주세요'
                : session.dirty
                  ? '저장하지 않은 변경이 있습니다'
                  : '저장된 내용을 보고 있습니다'}
        </h2>
        <p>마지막 저장: {formatStaffDraftTime(draft.updatedAt)}</p>
        <p>
          일부 항목만 작성해도 임시 저장할 수 있습니다. 임시 저장은 정비 완료나
          최종 제출이 아닙니다.
        </p>
        <p>
          다른 화면으로 이동하거나 뒤로 가기 전에 저장해 주세요. 저장하지 않은
          입력은 사라질 수 있습니다.
        </p>
        {resource.message && (
          <p className="staff-draft-feedback" role="status">
            {resource.message}
          </p>
        )}
        <div className="staff-draft-actions">
          <Button disabled={session.busy} onClick={session.recheck}>
            저장 상태 다시 확인
          </Button>
          {(unresolved || resource.access === 'blocked') && (
            <Button disabled={session.busy} onClick={session.reload}>
              서버 내용으로 다시 불러오기
            </Button>
          )}
        </div>
      </section>
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void session.save();
        }}
      >
        <section className="staff-draft-card">
          <span className="staff-draft-eyebrow">
            시작할 때 저장된 체크리스트
          </span>
          <h2 className="staff-draft-template-title">{draft.template.title}</h2>
          <p className="staff-draft-hint">
            필수 항목도 나중에 이어서 작성할 수 있습니다.
          </p>
          {draft.template.definition.sections.map((section) => (
            <section
              className="staff-draft-section"
              key={section.id}
              aria-labelledby={`staff-section-${section.id}`}
            >
              <h3 id={`staff-section-${section.id}`}>{section.title}</h3>
              {section.items.map((item) => (
                <StaffDraftAnswerField
                  key={item.id}
                  item={item}
                  disabled={!session.canEdit}
                  answer={answers.items.find(
                    (answer) => answer.itemId === item.id,
                  )}
                  onValue={(value) => session.setAnswer(item.id, value)}
                  onDetails={(change) =>
                    session.edit((current) =>
                      changeStaffDraftDetails(current, item.id, change),
                    )
                  }
                />
              ))}
            </section>
          ))}
        </section>
        <section className="staff-draft-card">
          <label
            className="staff-draft-note-label"
            htmlFor="staff-general-note"
          >
            전체 메모 <span>(선택)</span>
          </label>
          <textarea
            id="staff-general-note"
            disabled={!session.canEdit}
            value={answers.generalNote ?? ''}
            rows={4}
            placeholder="정비 중 확인한 내용을 남겨 주세요."
            onChange={(event) =>
              session.edit((current) => ({
                ...current,
                generalNote: event.target.value,
              }))
            }
          />
          <p className="staff-draft-hint">최대 4,000자</p>
        </section>
        <div className="staff-draft-savebar">
          <div>
            <strong>
              {session.dirty ? '변경 내용 임시 저장' : '현재 내용 저장됨'}
            </strong>
            <span>아직 최종 제출되지 않았습니다.</span>
          </div>
          <Button type="submit" disabled={!session.canSave} loading={saving}>
            임시 저장
          </Button>
        </div>
      </form>
      <StaffDraftLink
        token={token}
        expiresAt={draft.expiresAt}
        disabled={resource.access !== 'ready'}
      />
    </>
  );
}
