import type {
  GuestChecklistDefinition,
  GuestChecklistDto,
} from './guest-entry.types';
import {
  invalidGuestEntryResponse,
  isGuestId,
  isGuestText,
  isGuestVersion,
  readGuestObject,
} from './guest-entry-validation';

function definitionObject(value: unknown, keys: string[]): Record<string, unknown> {
  const result = readGuestObject(value);
  if (Object.keys(result).some((key) => !keys.includes(key)))
    throw invalidGuestEntryResponse();
  return result;
}

function definitionArray(value: unknown, maximum: number): unknown[] {
  if (!Array.isArray(value) || value.length < 1 || value.length > maximum)
    throw invalidGuestEntryResponse();
  return value;
}

export function readGuestChecklistDefinition(
  value: unknown,
): GuestChecklistDefinition {
  const root = definitionObject(value, ['schemaVersion', 'sections']);
  if (root.schemaVersion !== 1) throw invalidGuestEntryResponse();
  const usedIds = new Set<string>();
  let totalItems = 0;
  function readId(value: unknown): string {
    if (!isGuestId(value)) throw invalidGuestEntryResponse();
    const id = value.toLowerCase();
    if (usedIds.has(id)) throw invalidGuestEntryResponse();
    usedIds.add(id);
    return id;
  }
  return {
    schemaVersion: 1,
    sections: Array.from(definitionArray(root.sections, 20), (value) => {
      const section = definitionObject(value, ['id', 'title', 'items']);
      const id = readId(section.id);
      if (!isGuestText(section.title, 150)) throw invalidGuestEntryResponse();
      const items = definitionArray(section.items, 50);
      totalItems += items.length;
      if (totalItems > 500) throw invalidGuestEntryResponse();
      return {
        id,
        title: section.title,
        items: Array.from(items, (value) => {
          const item = definitionObject(value, ['id', 'label', 'required', 'answerType']);
          if (
            !isGuestText(item.label, 300) ||
            typeof item.required !== 'boolean' ||
            item.answerType !== 'NORMAL_ABNORMAL'
          )
            throw invalidGuestEntryResponse();
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

export function readGuestChecklists(value: unknown): GuestChecklistDto[] {
  if (!Array.isArray(value) || value.length > 2) throw invalidGuestEntryResponse();
  const usedIds = new Set<string>();
  const usedTypes = new Set<string>();
  return Array.from(value, (value) => {
    const item = readGuestObject(value);
    if (
      !isGuestId(item.id) ||
      (item.type !== 'CHECK_IN' && item.type !== 'CHECK_OUT') ||
      !isGuestText(item.title, 150) ||
      !isGuestVersion(item.version)
    )
      throw invalidGuestEntryResponse();
    const id = item.id.toLowerCase();
    if (usedIds.has(id) || usedTypes.has(item.type)) throw invalidGuestEntryResponse();
    usedIds.add(id);
    usedTypes.add(item.type);
    return {
      id,
      type: item.type,
      title: item.title,
      version: item.version,
      definition: readGuestChecklistDefinition(item.definition),
    };
  });
}
