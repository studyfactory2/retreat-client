import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import {
  staffPhotoLocations,
  staffPhotoPurposes,
  type StaffPhotoAssignment,
} from '../model/staff-flow-model';

export function StaffPhotoAssignmentFields({
  id,
  draft,
  value,
  disabled,
  onChange,
}: {
  id: string;
  draft: StaffDraftDto;
  value?: StaffPhotoAssignment;
  disabled: boolean;
  onChange: (value: StaffPhotoAssignment) => void;
}) {
  const purpose = value?.purpose ?? 'MAINTENANCE_AFTER';
  const locations = staffPhotoLocations(draft, purpose);
  const location = locations.some((item) => item.value === value?.location)
    ? value?.location
    : '';
  return (
    <fieldset className="staff-flow-photo-fields" disabled={disabled}>
      <legend className="staff-flow-sr-only">사진 종류와 위치</legend>
      <label htmlFor={`staff-purpose-${id}`}>어떤 사진인가요?</label>
      <select
        id={`staff-purpose-${id}`}
        value={purpose}
        onChange={(event) =>
          onChange({
            purpose: event.target.value as StaffPhotoAssignment['purpose'],
            location: '',
          })
        }
      >
        {Object.entries(staffPhotoPurposes).map(([key, label]) => (
          <option
            key={key}
            value={key}
            disabled={
              staffPhotoLocations(draft, key as StaffPhotoAssignment['purpose'])
                .length === 0
            }
          >
            {label}
          </option>
        ))}
      </select>
      <label htmlFor={`staff-location-${id}`}>사진 위치</label>
      <select
        id={`staff-location-${id}`}
        value={location}
        onChange={(event) =>
          onChange({ purpose, location: event.target.value })
        }
      >
        <option value="">위치를 선택해 주세요</option>
        {locations.map((item) => (
          <option key={item.value} value={item.value}>
            {item.label}
          </option>
        ))}
      </select>
    </fieldset>
  );
}
