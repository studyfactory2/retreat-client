import { useRef, useState } from 'react';
import { GuidePdfDocument } from '../../../../features/property-guide/components/GuidePdfDocument';
import { GUIDE_PDF_MAX_BYTES } from '../../../../features/property-guide/guide-pdf';
import { Button } from '../../../../shared/ui/Button/Button';
import type { GuideFormValues } from '../model/property-guide-model';

type Props = {
  values: GuideFormValues;
  onChange: (values: GuideFormValues) => void;
  error?: string;
  documentKey: string;
  load: (signal: AbortSignal) => Promise<Blob>;
  onAccessDenied: () => void;
};

export function PropertyGuidePdfField({
  values,
  onChange,
  error,
  documentKey,
  load,
  onAccessDenied,
}: Props) {
  const input = useRef<HTMLInputElement>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  function select(file: File | undefined) {
    if (!file) return;
    if (
      !file.name.toLowerCase().endsWith('.pdf') ||
      [...file.name].length > 255 ||
      file.size < 5 ||
      file.size > GUIDE_PDF_MAX_BYTES ||
      (file.type && file.type !== 'application/pdf')
    ) {
      setFileError('PDF 파일을 선택해 주세요. 최대 10 MB까지 가능합니다.');
      return;
    }
    setFileError(null);
    const pdf = file.type
      ? file
      : new File([file], file.name, {
          type: 'application/pdf',
          lastModified: file.lastModified,
        });
    onChange({
      ...values,
      file: pdf,
      pdf: { filename: pdf.name, sizeBytes: pdf.size },
    });
  }
  return (
    <div className="property-guide-pdf-field">
      <input
        className="property-guide-visually-hidden"
        ref={input}
        type="file"
        tabIndex={-1}
        accept=".pdf,application/pdf"
        aria-label="이용 안내 PDF 파일"
        onChange={(event) => {
          select(event.target.files?.[0]);
          event.target.value = '';
        }}
      />
      {values.pdf ? (
        <>
          <GuidePdfDocument
            documentKey={documentKey}
            pdf={values.pdf}
            load={load}
            onAccessDenied={onAccessDenied}
          />
          <div className="property-guide-pdf-field__tools">
            <span>{values.file ? '선택됨 · 저장 전' : '저장된 파일'}</span>
            <Button
              id="guide-pdf-file-button"
              type="button"
              className="admin-button-secondary"
              onClick={() => input.current?.click()}
            >
              파일 교체
            </Button>
            <button
              type="button"
              className="property-guide-pdf-field__remove"
              onClick={() => {
                setFileError(null);
                onChange({ ...values, file: null, pdf: null });
              }}
            >
              제거
            </button>
          </div>
        </>
      ) : (
        <div className="property-guide-pdf-field__empty">
          <span className="guide-pdf-document__icon" aria-hidden="true">
            PDF
          </span>
          <strong>이용 안내 파일을 올려 주세요</strong>
          <span>PDF · 최대 10 MB</span>
          <Button
            id="guide-pdf-file-button"
            type="button"
            className="admin-button-secondary"
            onClick={() => input.current?.click()}
          >
            PDF 선택
          </Button>
        </div>
      )}
      {(fileError || error) && (
        <p className="property-guide-field__error" role="alert">
          {fileError || error}
        </p>
      )}
    </div>
  );
}
