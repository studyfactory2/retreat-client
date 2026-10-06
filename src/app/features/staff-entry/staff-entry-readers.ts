import type { StaffQrContextDto } from './staff-entry.types';
import { readStaffChecklists } from './staff-checklist-readers';
import {
  invalidStaffEntryResponse,
  isStaffEntryId,
  isStaffEntryText,
  readStaffEntryObject,
} from './staff-entry-validation';

function readAssignedStaff(value: unknown): StaffQrContextDto['assignedStaff'] {
  if (value === null) return null;
  const staff = readStaffEntryObject(value);
  if (!isStaffEntryId(staff.id) || !isStaffEntryText(staff.name, 100))
    throw invalidStaffEntryResponse();
  return { id: staff.id.toLowerCase(), name: staff.name };
}

export function readStaffQrContext(value: unknown): StaffQrContextDto {
  const context = readStaffEntryObject(value);
  const property = readStaffEntryObject(context.property);
  if (
    context.flow !== 'STAFF' ||
    !isStaffEntryId(property.id) ||
    !isStaffEntryText(property.name, 100) ||
    (property.region !== null && !isStaffEntryText(property.region, 100))
  )
    throw invalidStaffEntryResponse();
  return {
    flow: 'STAFF',
    property: {
      id: property.id.toLowerCase(),
      name: property.name,
      region: property.region,
    },
    assignedStaff: readAssignedStaff(context.assignedStaff),
    checklists: readStaffChecklists(context.checklists),
  };
}
