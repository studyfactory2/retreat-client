import { ApiRequestError } from '../../core/api/api-error';
import type {
  ChecklistItemInput,
  ChecklistSectionInput,
  ChecklistType,
  CreateChecklistTemplateInput,
  UpdateChecklistTemplateInput,
} from './admin-checklist-template.types';

export const CHECKLIST_LIMITS = {
  title: 150,
  sectionTitle: 150,
  itemLabel: 300,
  sections: 20,
  itemsPerSection: 50,
  totalItems: 500,
} as const;
export const MAX_CHECKLIST_VERSION = 2_147_483_647;
export const MAX_WRITABLE_CHECKLIST_VERSION = MAX_CHECKLIST_VERSION - 1;

export function isChecklistId(value: unknown): value is string {
  return (
    typeof value === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function isChecklistType(value: unknown): value is ChecklistType {
  return (
    value === 'CHECK_IN' || value === 'CHECK_OUT' || value === 'MAINTENANCE'
  );
}

export function requireChecklistId(value: unknown): string {
  if (!isChecklistId(value))
    invalidChecklistInput('id', '휴양소 또는 점검표 ID를 확인해 주세요.');
  return value.toLowerCase();
}

export function invalidChecklistResponse(): ApiRequestError {
  return new ApiRequestError(
    '점검표 응답을 확인할 수 없습니다. 최신 정보를 다시 불러와 주세요.',
    200,
    'INVALID_CHECKLIST_TEMPLATE_RESPONSE',
  );
}

function invalidChecklistInput(field: string, message: string): never {
  throw new ApiRequestError(message, 400, 'INVALID_CHECKLIST_TEMPLATE_INPUT', [
    { field, messages: [message] },
  ]);
}

function record(value: unknown, field: string): Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value))
    invalidChecklistInput(field, '점검표 입력 형식을 확인해 주세요.');
  return value as Record<string, unknown>;
}

function text(value: unknown, maximum: number, field: string): string {
  if (typeof value !== 'string' || !value.trim())
    invalidChecklistInput(field, '제목과 항목 문구를 입력해 주세요.');
  const normalized = value.trim();
  if ([...normalized].length > maximum)
    invalidChecklistInput(field, `문구는 ${maximum}자 이하여야 합니다.`);
  return normalized;
}

function entries(value: unknown, maximum: number, field: string): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum)
    invalidChecklistInput(
      field,
      `항목을 1개 이상 ${maximum}개 이하로 입력해 주세요.`,
    );
  return value;
}

function prepareSections(
  value: unknown,
  creating: boolean,
): ChecklistSectionInput[] {
  const used = new Set<string>();
  let total = 0;
  function optionalId(value: unknown, field: string): string | undefined {
    if (value === undefined) return undefined;
    if (creating)
      invalidChecklistInput(
        field,
        '새 점검표의 구역과 항목 ID는 서버에서 생성합니다.',
      );
    if (!isChecklistId(value))
      invalidChecklistInput(field, '구역 또는 항목 ID를 확인해 주세요.');
    const id = value.toLowerCase();
    if (used.has(id))
      invalidChecklistInput(field, '구역과 항목 ID는 중복될 수 없습니다.');
    used.add(id);
    return id;
  }
  return Array.from(
    entries(value, CHECKLIST_LIMITS.sections, 'sections'),
    (value, index) => {
      const field = `sections.${index}`;
      const section = record(value, field);
      const id = optionalId(section.id, `${field}.id`);
      const sourceItems = entries(
        section.items,
        CHECKLIST_LIMITS.itemsPerSection,
        `${field}.items`,
      );
      total += sourceItems.length;
      if (total > CHECKLIST_LIMITS.totalItems)
        invalidChecklistInput(
          'sections',
          '점검표 항목은 전체 500개까지 등록할 수 있습니다.',
        );
      const items = Array.from(
        sourceItems,
        (value, itemIndex): ChecklistItemInput => {
          const itemField = `${field}.items.${itemIndex}`;
          const item = record(value, itemField);
          const itemId = optionalId(item.id, `${itemField}.id`);
          if (itemId !== undefined && id === undefined)
            invalidChecklistInput(
              `${itemField}.id`,
              '기존 항목은 원래 구역 안에서 수정해 주세요.',
            );
          if (
            typeof item.required !== 'boolean' ||
            item.answerType !== 'NORMAL_ABNORMAL'
          )
            invalidChecklistInput(
              itemField,
              '필수 여부와 정상·이상 응답 방식을 확인해 주세요.',
            );
          return {
            ...(itemId === undefined ? {} : { id: itemId }),
            label: text(
              item.label,
              CHECKLIST_LIMITS.itemLabel,
              `${itemField}.label`,
            ),
            required: item.required,
            answerType: 'NORMAL_ABNORMAL',
          };
        },
      );
      return {
        ...(id === undefined ? {} : { id }),
        title: text(
          section.title,
          CHECKLIST_LIMITS.sectionTitle,
          `${field}.title`,
        ),
        items,
      };
    },
  );
}

export function prepareCreateChecklistTemplate(
  input: CreateChecklistTemplateInput,
): CreateChecklistTemplateInput {
  const value = record(input, 'template');
  if (!isChecklistType(value.type))
    invalidChecklistInput('type', '점검표 유형을 확인해 주세요.');
  return {
    propertyId: requireChecklistId(value.propertyId),
    type: value.type,
    title: text(value.title, CHECKLIST_LIMITS.title, 'title'),
    sections: prepareSections(value.sections, true),
  };
}

export function prepareUpdateChecklistTemplate(
  input: UpdateChecklistTemplateInput,
): UpdateChecklistTemplateInput {
  const value = record(input, 'template');
  if (
    typeof value.expectedVersion !== 'number' ||
    !Number.isInteger(value.expectedVersion) ||
    value.expectedVersion < 1 ||
    value.expectedVersion > MAX_WRITABLE_CHECKLIST_VERSION
  )
    invalidChecklistInput(
      'expectedVersion',
      '최신 점검표 버전을 확인해 주세요.',
    );
  if (value.isActive !== undefined && typeof value.isActive !== 'boolean')
    invalidChecklistInput('isActive', '활성 여부를 확인해 주세요.');
  if (
    value.title === undefined &&
    value.sections === undefined &&
    value.isActive === undefined
  )
    throw new ApiRequestError(
      '변경할 점검표 내용을 입력해 주세요.',
      400,
      'EMPTY_UPDATE',
    );
  return {
    expectedVersion: value.expectedVersion,
    ...(value.title === undefined
      ? {}
      : { title: text(value.title, CHECKLIST_LIMITS.title, 'title') }),
    ...(value.sections === undefined
      ? {}
      : { sections: prepareSections(value.sections, false) }),
    ...(value.isActive === undefined ? {} : { isActive: value.isActive }),
  };
}
