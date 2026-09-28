export function UploadFileField({
  file,
  error,
  onChange,
}: {
  file: File | null;
  error?: string;
  onChange: (file: File | null) => void;
}) {
  return (
    <section
      className="import-upload__card"
      aria-labelledby="import-upload-file-title"
    >
      <div className="import-upload__section-heading">
        <span aria-hidden="true">01</span>
        <div>
          <h2 id="import-upload-file-title">명단 파일 선택</h2>
          <p>전달받은 이용자 명단과 같은 양식의 .xls 파일을 선택해 주세요.</p>
        </div>
      </div>
      <div className="import-upload__file-field">
        <label htmlFor="import-upload-file">
          이용자 명단 <span>필수</span>
        </label>
        <input
          id="import-upload-file"
          name="file"
          type="file"
          accept=".xls,application/vnd.ms-excel"
          required
          aria-invalid={!!error || undefined}
          aria-describedby={`import-upload-file-hint${error ? ' import-upload-file-error' : ''}`}
          onChange={(event) => onChange(event.target.files?.[0] ?? null)}
        />
        <p id="import-upload-file-hint" className="import-upload__hint">
          최대 5MB · .xlsx 파일은 지원하지 않습니다.
        </p>
        {file && (
          <p className="import-upload__file-info">
            선택한 파일: <strong>{file.name}</strong> ·{' '}
            {(file.size / 1024).toLocaleString('ko-KR', {
              maximumFractionDigits: 1,
            })}
            KB
          </p>
        )}
        {error && (
          <p id="import-upload-file-error" className="import-upload__error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
