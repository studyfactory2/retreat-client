import type {
  ChecklistSectionInput,
  ChecklistTemplateDto,
  ChecklistType,
  CreateChecklistTemplateInput,
  UpdateChecklistTemplateInput,
} from '../../../../features/admin-checklist-templates/admin-checklist-template.types';
import { CHECKLIST_LIMITS } from '../../../../features/admin-checklist-templates/admin-checklist-template-validation';

export type EditorItem = {
  key: string;
  id?: string;
  label: string;
  required: boolean;
};
export type EditorSection = {
  key: string;
  id?: string;
  title: string;
  items: EditorItem[];
};
export type ChecklistFormValues = {
  title: string;
  isActive: boolean;
  sections: EditorSection[];
};
export type ChecklistFormErrors = Record<string, string>;

export const checklistTypes: ChecklistType[] = [
  'CHECK_IN',
  'CHECK_OUT',
  'MAINTENANCE',
];
export const checklistTypeLabels: Record<ChecklistType, string> = {
  CHECK_IN: '입실 체크리스트',
  CHECK_OUT: '퇴실 체크리스트',
  MAINTENANCE: '정비 체크리스트',
};
const checklistSegments: Record<ChecklistType, string> = {
  CHECK_IN: 'check-in',
  CHECK_OUT: 'check-out',
  MAINTENANCE: 'maintenance',
};
export function parseChecklistType(
  segment: string | undefined,
): ChecklistType | undefined {
  return checklistTypes.find((type) => checklistSegments[type] === segment);
}
export function checklistEditorPath(
  propertyId: string,
  type: ChecklistType,
): string {
  return `/admin/properties/${encodeURIComponent(propertyId)}/checklists/${checklistSegments[type]}`;
}
export function makeEditorItem(): EditorItem {
  return { key: crypto.randomUUID(), label: '', required: true };
}
export function makeEditorSection(): EditorSection {
  return { key: crypto.randomUUID(), title: '', items: [makeEditorItem()] };
}
export function createChecklistValues(
  type: ChecklistType,
  template?: ChecklistTemplateDto,
): ChecklistFormValues {
  return template
    ? {
        title: template.title,
        isActive: template.isActive,
        sections: template.definition.sections.map((section) => ({
          key: section.id,
          id: section.id,
          title: section.title,
          items: section.items.map((item) => ({
            key: item.id,
            id: item.id,
            label: item.label,
            required: item.required,
          })),
        })),
      }
    : {
        title: checklistTypeLabels[type],
        isActive: true,
        sections: [makeEditorSection()],
      };
}
export function validateChecklistForm(
  values: ChecklistFormValues,
): ChecklistFormErrors {
  const errors: ChecklistFormErrors = {};
  function text(value: string, maximum: number, key: string, label: string) {
    if (!value.trim()) errors[key] = `${label} 입력해 주세요.`;
    else if ([...value.trim()].length > maximum)
      errors[key] = `${maximum}자 이하로 입력해 주세요.`;
  }
  text(values.title, CHECKLIST_LIMITS.title, 'title', '체크리스트 제목을');
  if (
    !values.sections.length ||
    values.sections.length > CHECKLIST_LIMITS.sections
  )
    errors.sections = `구역은 1~${CHECKLIST_LIMITS.sections}개까지 설정할 수 있습니다.`;
  if (
    values.sections.reduce((sum, section) => sum + section.items.length, 0) >
    CHECKLIST_LIMITS.totalItems
  )
    errors.sections = `전체 항목은 ${CHECKLIST_LIMITS.totalItems}개까지 설정할 수 있습니다.`;
  for (const section of values.sections) {
    text(
      section.title,
      CHECKLIST_LIMITS.sectionTitle,
      `sections.${section.key}.title`,
      '구역 제목을',
    );
    if (
      !section.items.length ||
      section.items.length > CHECKLIST_LIMITS.itemsPerSection
    )
      errors[`sections.${section.key}.items`] =
        `구역마다 1~${CHECKLIST_LIMITS.itemsPerSection}개 항목을 입력해 주세요.`;
    for (const item of section.items)
      text(
        item.label,
        CHECKLIST_LIMITS.itemLabel,
        `items.${item.key}.label`,
        '체크 항목을',
      );
  }
  return errors;
}
export function checklistSectionsInput(
  values: ChecklistFormValues,
): ChecklistSectionInput[] {
  return values.sections.map((section) => ({
    ...(section.id ? { id: section.id } : {}),
    title: section.title.trim(),
    items: section.items.map((item) => ({
      ...(item.id ? { id: item.id } : {}),
      label: item.label.trim(),
      required: item.required,
      answerType: 'NORMAL_ABNORMAL',
    })),
  }));
}
export function buildCreateChecklistInput(
  propertyId: string,
  type: ChecklistType,
  values: ChecklistFormValues,
): CreateChecklistTemplateInput {
  return {
    propertyId,
    type,
    title: values.title.trim(),
    sections: checklistSectionsInput(values),
  };
}
export function buildUpdateChecklistInput(
  original: ChecklistTemplateDto,
  values: ChecklistFormValues,
): UpdateChecklistTemplateInput | null {
  const result: UpdateChecklistTemplateInput = {
    expectedVersion: original.version,
  };
  if (values.title.trim() !== original.title)
    result.title = values.title.trim();
  if (values.isActive !== original.isActive) result.isActive = values.isActive;
  const sections = checklistSectionsInput(values);
  if (JSON.stringify(sections) !== JSON.stringify(original.definition.sections))
    result.sections = sections;
  return Object.keys(result).length > 1 ? result : null;
}
