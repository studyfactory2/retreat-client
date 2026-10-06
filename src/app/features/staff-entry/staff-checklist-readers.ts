import type {
  StaffChecklistDefinition,
  StaffChecklistDto,
} from './staff-entry.types';
import {
  invalidStaffEntryResponse,
  isStaffEntryId,
  isStaffEntryText,
  isStaffEntryVersion,
  readStaffEntryObject,
} from './staff-entry-validation';

function definitionObject(
  value: unknown,
  keys: string[],
): Record<string, unknown> {
  const result = readStaffEntryObject(value);
  if (Object.keys(result).some((key) => !keys.includes(key)))
    throw invalidStaffEntryResponse();
  return result;
}

function definitionArray(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum)
    throw invalidStaffEntryResponse();
  return value;
}

export function readStaffChecklistDefinition(
  value: unknown,
): StaffChecklistDefinition {
  const root = definitionObject(value, ['schemaVersion', 'sections']);
  if (root.schemaVersion !== 1) throw invalidStaffEntryResponse();
  const usedIds = new Set<string>();
  let totalItems = 0;
  function readId(value: unknown): string {
    if (!isStaffEntryId(value)) throw invalidStaffEntryResponse();
    const id = value.toLowerCase();
    if (usedIds.has(id)) throw invalidStaffEntryResponse();
    usedIds.add(id);
    return id;
  }
  return {
    schemaVersion: 1,
    sections: Array.from(definitionArray(root.sections, 20), (value) => {
      const section = definitionObject(value, ['id', 'title', 'items']);
      const id = readId(section.id);
      if (!isStaffEntryText(section.title, 150))
        throw invalidStaffEntryResponse();
      const items = definitionArray(section.items, 50);
      totalItems += items.length;
      if (totalItems > 500) throw invalidStaffEntryResponse();
      return {
        id,
        title: section.title,
        items: Array.from(items, (value) => {
          const item = definitionObject(value, [
            'id',
            'label',
            'required',
            'answerType',
          ]);
          if (
            !isStaffEntryText(item.label, 300) ||
            typeof item.required !== 'boolean' ||
            item.answerType !== 'NORMAL_ABNORMAL'
          )
            throw invalidStaffEntryResponse();
          return {
            id: readId(item.id),
            label: item.label,
            required: item.required,
            answerType: 'NORMAL_ABNORMAL',
          };
        }),
      };
    }),
  };
}

export function readStaffChecklists(value: unknown): StaffChecklistDto[] {
  // The backend has one template per property/type. Staff QR exposes only it.
  if (!Array.isArray(value) || value.length > 1)
    throw invalidStaffEntryResponse();
  return Array.from(value, (value) => {
    const checklist = readStaffEntryObject(value);
    if (
      !isStaffEntryId(checklist.id) ||
      checklist.type !== 'MAINTENANCE' ||
      !isStaffEntryText(checklist.title, 150) ||
      !isStaffEntryVersion(checklist.version)
    )
      throw invalidStaffEntryResponse();
    return {
      id: checklist.id.toLowerCase(),
      type: 'MAINTENANCE',
      title: checklist.title,
      version: checklist.version,
      definition: readStaffChecklistDefinition(checklist.definition),
    };
  });
}
