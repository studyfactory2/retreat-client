import type {
  GuestPropertyDto,
  GuestPropertyGuideDto,
  GuestQrContextDto,
  GuestStayContextDto,
} from './guest-entry.types';
import { readGuestChecklists } from './guest-checklist-readers';
import {
  invalidGuestEntryResponse,
  isGuestId,
  isGuestText,
  isGuestTimestamp,
  isGuestVersion,
  readGuestObject,
} from './guest-entry-validation';

function readGuestProperty(value: unknown): GuestPropertyDto {
  const property = readGuestObject(value);
  if (
    !isGuestId(property.id) ||
    !isGuestText(property.name, 100) ||
    (property.region !== null && !isGuestText(property.region, 100))
  )
    throw invalidGuestEntryResponse();
  return {
    id: property.id.toLowerCase(),
    name: property.name,
    region: property.region,
  };
}

export function readGuestQrContext(value: unknown): GuestQrContextDto {
  const context = readGuestObject(value);
  if (context.flow !== 'GUEST') throw invalidGuestEntryResponse();
  return {
    flow: 'GUEST',
    property: readGuestProperty(context.property),
    checklists: readGuestChecklists(context.checklists),
  };
}

export function readGuestStayContext(value: unknown): GuestStayContextDto {
  const context = readGuestObject(value);
  const property = readGuestObject(context.property);
  if (
    !isGuestId(context.stayId) ||
    !isGuestText(context.guestName, 100) ||
    !isGuestTimestamp(context.checkInAt) ||
    !isGuestTimestamp(context.checkOutAt) ||
    !isGuestTimestamp(context.expiresAt) ||
    Date.parse(context.checkInAt) >= Date.parse(context.checkOutAt) ||
    Date.parse(context.expiresAt) !== Date.parse(context.checkOutAt) + 7 * 86_400_000 ||
    typeof property.vehicleRegistrationEnabled !== 'boolean'
  )
    throw invalidGuestEntryResponse();
  // Authorization and expiry are decided by the backend. Do not compare its
  // response timestamp to a potentially skewed device clock here.
  return {
    stayId: context.stayId.toLowerCase(),
    guestName: context.guestName,
    checkInAt: context.checkInAt,
    checkOutAt: context.checkOutAt,
    expiresAt: context.expiresAt,
    property: {
      ...readGuestProperty(property),
      vehicleRegistrationEnabled: property.vehicleRegistrationEnabled,
    },
    checklists: readGuestChecklists(context.checklists),
  };
}

export function readGuestPropertyGuide(value: unknown): GuestPropertyGuideDto {
  const response = readGuestObject(value);
  const property = readGuestProperty(response.property);
  if (response.guide === null) return { property, guide: null };
  const guide = readGuestObject(response.guide);
  if (
    !isGuestText(guide.title, 100) ||
    /[\r\n\0]/.test(guide.title) ||
    !isGuestText(guide.content, 20_000) ||
    /[\r\0]/.test(guide.content) ||
    !isGuestVersion(guide.version) ||
    !isGuestTimestamp(guide.updatedAt)
  )
    throw invalidGuestEntryResponse();
  return {
    property,
    guide: {
      title: guide.title,
      content: guide.content,
      version: guide.version,
      updatedAt: guide.updatedAt,
    },
  };
}
