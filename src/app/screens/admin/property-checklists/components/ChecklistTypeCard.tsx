import type {
  ChecklistTemplateDto,
  ChecklistType,
} from '../../../../features/admin-checklist-templates/admin-checklist-template.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-checklists.css';

const descriptions: Record<
  ChecklistType,
  { title: string; description: string }
> = {
  CHECK_IN: {
    title: '입실 체크리스트',
    description: '이용객 · 입실 시 확인할 항목',
  },
  CHECK_OUT: {
    title: '퇴실 체크리스트',
    description: '이용객 · 퇴실 전 확인할 항목',
  },
  MAINTENANCE: {
    title: '정비 체크리스트',
    description: '직원 · 청소와 정비 확인 항목',
  },
};

export function ChecklistTypeCard({
  type,
  template,
  propertyActive,
  onOpen,
  onHistory,
}: {
  type: ChecklistType;
  template?: ChecklistTemplateDto;
  propertyActive: boolean;
  onOpen: () => void;
  onHistory: () => void;
}) {
  const copy = descriptions[type];
  return (
    <section
      className="checklist-type-card"
      aria-labelledby={`checklist-type-${type}`}
    >
      <div className="checklist-type-card__top">
        <h2 id={`checklist-type-${type}`}>{copy.title}</h2>
        <span
          className={`checklist-badge${template?.isActive ? ' checklist-badge--active' : ''}`}
        >
          {template ? (template.isActive ? '활성' : '비활성') : '미설정'}
        </span>
      </div>
      <p className="checklist-type-card__description">{copy.description}</p>
      {template ? (
        <>
          {template.title !== copy.title && (
            <p className="checklist-type-card__title">{template.title}</p>
          )}
          <dl className="checklist-type-card__details">
            <div>
              <dt>버전</dt>
              <dd>v{template.version}</dd>
            </div>
            <div>
              <dt>구역</dt>
              <dd>{template.definition.sections.length}개</dd>
            </div>
            <div>
              <dt>점검 항목</dt>
              <dd>
                {template.definition.sections.reduce(
                  (sum, section) => sum + section.items.length,
                  0,
                )}
                개
              </dd>
            </div>
          </dl>
        </>
      ) : (
        <div className="checklist-type-card__empty">
          <strong>아직 설정되지 않았습니다</strong>
          <p>체크리스트 제목과 구역별 확인 항목을 등록해 주세요.</p>
        </div>
      )}
      {!propertyActive && (
        <p className="checklist-type-card__inactive">
          비활성 휴양소는 체크리스트를 만들거나 수정할 수 없습니다.
        </p>
      )}
      <div className="checklist-type-card__actions">
        {template && (
          <Button className="admin-button-secondary" onClick={onHistory}>
            버전 이력
          </Button>
        )}
        <Button
          className={template ? 'admin-button-secondary' : ''}
          disabled={!template && !propertyActive}
          onClick={onOpen}
        >
          {template
            ? propertyActive
              ? '구성 수정'
              : '내용 확인'
            : '체크리스트 만들기'}
        </Button>
      </div>
    </section>
  );
}
