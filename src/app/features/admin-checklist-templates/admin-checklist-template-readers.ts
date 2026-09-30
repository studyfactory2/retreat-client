import type {
  ChecklistDefinition,
  ChecklistSectionInput,
  ChecklistTemplateDto,
  CreateChecklistTemplateInput,
  UpdateChecklistTemplateInput,
} from './admin-checklist-template.types';
import {
  CHECKLIST_LIMITS,
  invalidChecklistResponse,
  isChecklistId,
  isChecklistType,
  MAX_CHECKLIST_VERSION,
} from './admin-checklist-template-validation';

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function object(value: unknown, keys: string[]): Record<string, unknown> {
  if (!isRecord(value) || Object.keys(value).some((key) => !keys.includes(key)))
    throw invalidChecklistResponse();
  return value;
}

function isText(value: unknown, maximum: number): value is string {
  return (
    typeof value === 'string' &&
    value.length > 0 &&
    value.trim() === value &&
    [...value].length <= maximum
  );
}

function isTimestamp(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  const timestamp = Date.parse(value);
  return (
    Number.isFinite(timestamp) && new Date(timestamp).toISOString() === value
  );
}

function array(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum)
    throw invalidChecklistResponse();
  return value;
}

export function readChecklistDefinition(value: unknown): ChecklistDefinition {
  const root = object(value, ['schemaVersion', 'sections']);
  if (root.schemaVersion !== 1) throw invalidChecklistResponse();
  const used = new Set<string>();
  let total = 0;
  function id(value: unknown): string {
    if (!isChecklistId(value)) throw invalidChecklistResponse();
    const normalized = value.toLowerCase();
    if (used.has(normalized)) throw invalidChecklistResponse();
    used.add(normalized);
    return normalized;
  }
  return {
    schemaVersion: 1,
    sections: Array.from(
      array(root.sections, CHECKLIST_LIMITS.sections),
      (value) => {
        const section = object(value, ['id', 'title', 'items']);
        const sectionId = id(section.id);
        if (!isText(section.title, CHECKLIST_LIMITS.sectionTitle))
          throw invalidChecklistResponse();
        const sourceItems = array(
          section.items,
          CHECKLIST_LIMITS.itemsPerSection,
        );
        total += sourceItems.length;
        if (total > CHECKLIST_LIMITS.totalItems)
          throw invalidChecklistResponse();
        return {
          id: sectionId,
          title: section.title,
          items: Array.from(sourceItems, (value) => {
            const item = object(value, [
              'id',
              'label',
              'required',
              'answerType',
            ]);
            if (
              !isText(item.label, CHECKLIST_LIMITS.itemLabel) ||
              typeof item.required !== 'boolean' ||
              item.answerType !== 'NORMAL_ABNORMAL'
            )
              throw invalidChecklistResponse();
            return {
              id: id(item.id),
              label: item.label,
              required: item.required,
              answerType: 'NORMAL_ABNORMAL',
            };
          }),
        };
      },
    ),
  };
}

export function readChecklistTemplate(
  value: unknown,
  expectedId?: string,
  expectedPropertyId?: string,
): ChecklistTemplateDto {
  if (
    !isRecord(value) ||
    !isChecklistId(value.id) ||
    (expectedId !== undefined &&
      value.id.toLowerCase() !== expectedId.toLowerCase()) ||
    !isChecklistId(value.propertyId) ||
    (expectedPropertyId !== undefined &&
      value.propertyId.toLowerCase() !== expectedPropertyId.toLowerCase()) ||
    !isChecklistType(value.type) ||
    !isText(value.title, CHECKLIST_LIMITS.title) ||
    typeof value.version !== 'number' ||
    !Number.isInteger(value.version) ||
    value.version < 1 ||
    value.version > MAX_CHECKLIST_VERSION ||
    typeof value.isActive !== 'boolean' ||
    !isTimestamp(value.createdAt) ||
    !isTimestamp(value.updatedAt) ||
    Date.parse(value.updatedAt) < Date.parse(value.createdAt) ||
    !isRecord(value.property) ||
    !isChecklistId(value.property.id) ||
    value.property.id.toLowerCase() !== value.propertyId.toLowerCase() ||
    !isText(value.property.name, 100) ||
    (value.property.region !== null && !isText(value.property.region, 100)) ||
    typeof value.property.isActive !== 'boolean'
  )
    throw invalidChecklistResponse();
  return {
    id: value.id.toLowerCase(),
    propertyId: value.propertyId.toLowerCase(),
    type: value.type,
    title: value.title,
    version: value.version,
    definition: readChecklistDefinition(value.definition),
    isActive: value.isActive,
    createdAt: value.createdAt,
    updatedAt: value.updatedAt,
    property: {
      id: value.property.id.toLowerCase(),
      name: value.property.name,
      region: value.property.region,
      isActive: value.property.isActive,
    },
  };
}

export function readPropertyChecklistTemplates(
  value: unknown,
  propertyId: string,
): ChecklistTemplateDto[] {
  if (
    !isRecord(value) ||
    !Array.isArray(value.items) ||
    value.page !== 1 ||
    value.limit !== 3 ||
    typeof value.total !== 'number' ||
    !Number.isInteger(value.total) ||
    value.total < 0 ||
    value.total > 3 ||
    value.items.length !== value.total ||
    value.totalPages !== Math.ceil(value.total / 3)
  )
    throw invalidChecklistResponse();
  const templates = Array.from(value.items, (item) =>
    readChecklistTemplate(item, undefined, propertyId),
  );
  if (
    new Set(templates.map((template) => template.id)).size !==
      templates.length ||
    new Set(templates.map((template) => template.type)).size !==
      templates.length ||
    templates.some(
      (template) =>
        JSON.stringify(template.property) !==
        JSON.stringify(templates[0].property),
    )
  )
    throw invalidChecklistResponse();
  return templates;
}

function matchesSections(
  definition: ChecklistDefinition,
  sections: ChecklistSectionInput[],
): boolean {
  return (
    definition.sections.length === sections.length &&
    sections.every((section, index) => {
      const saved = definition.sections[index];
      return (
        (section.id === undefined || saved.id === section.id) &&
        saved.title === section.title &&
        saved.items.length === section.items.length &&
        section.items.every((item, itemIndex) => {
          const savedItem = saved.items[itemIndex];
          return (
            (item.id === undefined || savedItem.id === item.id) &&
            savedItem.label === item.label &&
            savedItem.required === item.required &&
            savedItem.answerType === item.answerType
          );
        })
      );
    })
  );
}

export function verifyCreatedChecklist(
  template: ChecklistTemplateDto,
  input: CreateChecklistTemplateInput,
): void {
  if (
    template.propertyId !== input.propertyId ||
    template.type !== input.type ||
    template.title !== input.title ||
    template.version !== 1 ||
    !template.isActive ||
    !template.property.isActive ||
    !matchesSections(template.definition, input.sections)
  )
    throw invalidChecklistResponse();
}

export function verifyUpdatedChecklist(
  template: ChecklistTemplateDto,
  input: UpdateChecklistTemplateInput,
): void {
  const hasNewIds = input.sections?.some(
    (section) =>
      section.id === undefined ||
      section.items.some((item) => item.id === undefined),
  );
  if (
    template.type !== 'MAINTENANCE' ||
    !template.property.isActive ||
    (template.version !== input.expectedVersion + 1 &&
      (hasNewIds || template.version !== input.expectedVersion)) ||
    (input.title !== undefined && template.title !== input.title) ||
    (input.isActive !== undefined && template.isActive !== input.isActive) ||
    (input.sections !== undefined &&
      !matchesSections(template.definition, input.sections))
  )
    throw invalidChecklistResponse();
}
