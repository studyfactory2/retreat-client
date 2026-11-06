import { useId } from 'react';
import { Button } from '../../../../shared/ui/Button/Button';
import { ROOM_PHOTO } from '../model/guest-flow-model';
import type { GuestDraftDto } from '../../../../features/guest-drafts/guest-drafts.types';
import type { GuestDraftPhotoDto } from '../../../../features/guest-draft-photos/guest-draft-photos.types';

export function GuestPhotoAssignment({
  photo,
  index,
  draft,
  value,
  onChange,
  disabled,
}: {
  photo: GuestDraftPhotoDto;
  index: number;
  draft: GuestDraftDto;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const id = useId();
  const abnormalIds = new Set(
    draft.answers.items
      .filter((answer) => answer.value === 'ABNORMAL')
      .map((answer) => answer.itemId.toLowerCase()),
  );
  const options = draft.template.definition.sections.flatMap((section) =>
    section.items
      .filter((item) => abnormalIds.has(item.id.toLowerCase()))
      .map((item) => ({
        id: item.id,
        label: `${section.title} · ${item.label}`,
      })),
  );
  const checkIn = draft.type === 'CHECK_IN';
  if (checkIn && options.length === 0)
    return (
      <div className="guest-photo-assignment">
        {value === ROOM_PHOTO ? (
          <p>객실 상태 사진</p>
        ) : (
          <>
            <p>{value ? '연결했던 이상 항목이 변경됐어요.' : '사진 용도를 확인해 주세요.'}</p>
            <Button
              className="guest-draft-secondary"
              disabled={disabled}
              onClick={() => onChange(ROOM_PHOTO)}
            >
              객실 상태 사진으로 사용
            </Button>
          </>
        )}
      </div>
    );
  if (checkIn) options.unshift({ id: ROOM_PHOTO, label: '객실 상태 사진' });
  const selected = options.find(
    (item) => item.id.toLowerCase() === value.toLowerCase(),
  );
  const invalidated = value !== '' && !selected;
  const guidance =
    options.length === 0
      ? '시설 확인에서 이상 항목을 선택하거나 이 사진을 삭제해 주세요.'
      : invalidated
        ? '연결했던 항목의 상태가 변경됐어요. 다시 선택해 주세요.'
        : null;
  return (
    <div className="guest-photo-assignment">
      <label htmlFor={id}>사진 {index + 1} · {checkIn ? '사진 용도' : '연결할 이상 항목'}</label>
      <select
        id={id}
        value={selected?.id ?? ''}
        disabled={disabled || options.length === 0}
        aria-describedby={guidance ? `${id}-help` : undefined}
        aria-invalid={invalidated || undefined}
        title={photo.filename}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">{checkIn ? '사진 용도 선택' : '항목 선택'}</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      {guidance && (
        <p id={`${id}-help`} className={invalidated ? 'is-invalid' : undefined}>
          {guidance}
        </p>
      )}
    </div>
  );
}
