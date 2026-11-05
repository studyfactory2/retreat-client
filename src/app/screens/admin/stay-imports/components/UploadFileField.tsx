import { ImportTemplateLinks } from './ImportPreparation';

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
        <h2 id="import-upload-file-title">명단 파일</h2>
        <span className="import-upload__required">필수</span>
      </div>
      <ImportTemplateLinks />
      <div className="import-upload__file-field">
        <div
          className={`import-upload__picker${file ? ' import-upload__picker--selected' : ''}${error ? ' import-upload__picker--invalid' : ''}`}
        >
          <span className="import-upload__file-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6Z" />
              <path d="M14 3v6h6M8 13h8M8 17h5" />
            </svg>
          </span>
          <div className="import-upload__file-description">
            <strong title={file?.name}>
              {file ? file.name : '명단 파일을 선택하세요'}
            </strong>
            {file && (
              <span>
                {(file.size / 1024).toLocaleString('ko-KR', {
                  maximumFractionDigits: 1,
                })}
                KB · 선택됨
              </span>
            )}
          </div>
          <span className="import-upload__choose" aria-hidden="true">
            {file ? '변경' : '파일 선택 +'}
          </span>
          <input
            className="import-upload__file-input"
            id="import-upload-file"
            name="file"
            type="file"
            accept=".xls,application/vnd.ms-excel"
            required
            aria-label={file ? '명단 파일 변경' : '명단 파일 선택'}
            aria-invalid={!!error || undefined}
            aria-describedby={`import-upload-file-hint${file ? ' import-upload-selected-file' : ''}${error ? ' import-upload-file-error' : ''}`}
            onChange={(event) => {
              const nextFile = event.target.files?.[0];
              if (nextFile) onChange(nextFile);
            }}
          />
        </div>
        {file && (
          <span id="import-upload-selected-file" className="import-upload__legend">
            선택한 파일: {file.name}
          </span>
        )}
        <p id="import-upload-file-hint" className="import-upload__hint">
          .xls · 최대 5MB · .xlsx 미지원
        </p>
        {error && (
          <p id="import-upload-file-error" className="import-upload__error">
            {error}
          </p>
        )}
      </div>
    </section>
  );
}
