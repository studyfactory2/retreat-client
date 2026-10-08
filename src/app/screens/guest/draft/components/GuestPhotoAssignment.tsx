import { useId } from 'react';
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
  const selected = options.find(
    (item) => item.id.toLowerCase() === value.toLowerCase(),
  );
  const invalidated = value !== '' && !selected;
  return (
    <div className="guest-photo-assignment">
      <label htmlFor={id}>사진 {index + 1}의 이상 항목</label>
      <select
        id={id}
        value={selected?.id ?? ''}
        disabled={disabled || options.length === 0}
        aria-describedby={`${id}-help`}
        aria-invalid={invalidated || undefined}
        title={photo.filename}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="">항목 선택</option>
        {options.map((item) => (
          <option key={item.id} value={item.id}>
            {item.label}
          </option>
        ))}
      </select>
      <p id={`${id}-help`} className={invalidated ? 'is-invalid' : undefined}>
        {options.length === 0
          ? '이상 항목이 없어요. 이전 단계에서 상태를 확인하거나 이 사진을 삭제해 주세요.'
          : invalidated
            ? '연결한 항목의 상태가 바뀌었어요. 이상 항목을 다시 선택해 주세요.'
            : '사진을 제출하려면 이상 항목 한 곳에 연결해 주세요.'}
      </p>
    </div>
  );
}
