import type {
  ChecklistTemplateDto,
  ChecklistType,
} from '../../../../features/admin-checklist-templates/admin-checklist-template.types';
import { Button } from '../../../../shared/ui/Button/Button';
import '../styles/property-checklists.css';

const descriptions: Record<
  ChecklistType,
  { title: string; eyebrow: string; description: string }
> = {
  CHECK_IN: {
    title: '입실 체크리스트',
    eyebrow: 'GUEST · CHECK-IN',
    description: '이용객이 입실할 때 확인할 공간과 시설을 구성합니다.',
  },
  CHECK_OUT: {
    title: '퇴실 체크리스트',
    eyebrow: 'GUEST · CHECK-OUT',
    description: '이용객이 퇴실 전에 확인할 정리 상태와 시설을 구성합니다.',
  },
  MAINTENANCE: {
    title: '정비 체크리스트',
    eyebrow: 'STAFF · MAINTENANCE',
    description: '담당 직원이 정비할 때 확인할 구역과 항목을 구성합니다.',
  },
};

export function ChecklistTypeCard({
  type,
  template,
  propertyActive,
  onOpen,
}: {
  type: ChecklistType;
  template?: ChecklistTemplateDto;
  propertyActive: boolean;
  onOpen: () => void;
}) {
  const copy = descriptions[type];
  return (
    <section
      className="checklist-type-card"
      aria-labelledby={`checklist-type-${type}`}
    >
      <div className="checklist-type-card__top">
        <p className="checklist-eyebrow">{copy.eyebrow}</p>
        <span
          className={`checklist-badge${template?.isActive ? ' checklist-badge--active' : ''}`}
        >
          {template ? (template.isActive ? '활성' : '비활성') : '미설정'}
        </span>
      </div>
      <h2 id={`checklist-type-${type}`}>{copy.title}</h2>
      <p className="checklist-type-card__description">{copy.description}</p>
      {template ? (
        <>
          <p className="checklist-type-card__title">{template.title}</p>
          <dl className="checklist-type-card__details">
            <div>
              <dt>현재 버전</dt>
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
      <p className="checklist-type-card__policy">
        {type === 'MAINTENANCE'
          ? '생성 후 구성과 활성 상태를 변경할 수 있습니다.'
          : '생성 후 구성과 활성 상태를 수정할 수 없습니다.'}
      </p>
      {!propertyActive && (
        <p className="checklist-type-card__inactive">
          비활성 휴양소는 체크리스트를 만들거나 수정할 수 없습니다.
        </p>
      )}
      <Button
        className={template ? 'admin-button-secondary' : ''}
        disabled={!template && !propertyActive}
        onClick={onOpen}
      >
        {template
          ? type === 'MAINTENANCE' && propertyActive
            ? '내용 확인·수정'
            : '내용 확인'
          : '체크리스트 만들기'}
      </Button>
    </section>
  );
}
