import { useState } from 'react';
import type { StaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import {
  propertyPhotoLocation,
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
  const [editing, setEditing] = useState(false);
  const purpose = value?.purpose;
  const locations = purpose ? staffPhotoLocations(draft, purpose) : [];
  const location = locations.find((option) => option.value === value?.location);
  const complete = Boolean(purpose && location);

  function selectPurpose(next: StaffPhotoAssignment['purpose']) {
    setEditing(true);
    const general =
      next === 'MAINTENANCE_AFTER' || next === 'MAINTENANCE_BEFORE';
    onChange({
      purpose: next,
      location: general ? propertyPhotoLocation.value : '',
    });
  }

  if (purpose && location && !editing) {
    return (
      <button
        type="button"
        className="staff-photo-assignment-summary"
        disabled={disabled}
        onClick={() => setEditing(true)}
        aria-label={`사진 용도와 위치 변경: ${staffPhotoPurposes[purpose]}, ${location.label}`}
      >
        <span>
          <strong>{staffPhotoPurposes[purpose]}</strong>
          <small>{location.label}</small>
        </span>
        <span>변경</span>
      </button>
    );
  }

  return (
    <fieldset className="staff-flow-photo-fields" disabled={disabled}>
      <legend className="staff-flow-sr-only">사진 용도와 위치</legend>
      <label htmlFor={`staff-purpose-${id}`}>사진 용도</label>
      <select
        id={`staff-purpose-${id}`}
        value={purpose ?? ''}
        onChange={(event) =>
          selectPurpose(event.target.value as StaffPhotoAssignment['purpose'])
        }
      >
        <option value="" disabled>
          용도를 선택해 주세요
        </option>
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
      {purpose && (
        <>
          <label htmlFor={`staff-location-${id}`}>
            {purpose === 'DEFECT' || purpose === 'REPAIR'
              ? '연결할 점검 항목'
              : '사진 위치'}
          </label>
          <select
            id={`staff-location-${id}`}
            value={location?.value ?? ''}
            onChange={(event) =>
              onChange({ purpose, location: event.target.value })
            }
          >
            <option value="">선택해 주세요</option>
            {locations.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </>
      )}
      {editing && complete && (
        <button
          className="staff-photo-fields-done"
          type="button"
          onClick={() => setEditing(false)}
        >
          접기
        </button>
      )}
    </fieldset>
  );
}
