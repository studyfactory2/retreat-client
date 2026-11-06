export function GuestPhotoPicker({
  label,
  disabled,
  onPick,
}: {
  label: string;
  disabled: boolean;
  onPick: (files: FileList) => void;
}) {
  return (
    <label className="guest-photos__picker" aria-disabled={disabled}>
      <span>＋ {label}</span>
      <input
        aria-label={label}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        multiple
        disabled={disabled}
        onChange={(event) => {
          const files = event.currentTarget.files;
          if (files?.length) onPick(files);
          event.currentTarget.value = '';
        }}
      />
    </label>
  );
}
