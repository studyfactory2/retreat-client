import { useLayoutEffect, useRef } from 'react';
import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { STAY_IMPORT_MANAGED_SHEETS } from '../../../../features/admin-stay-imports/admin-stay-imports-api';
import { Button } from '../../../../shared/ui/Button/Button';
import { ScheduleIcon } from '../../schedule/components/ScheduleIcon';
import type {
  ImportMappingDraft,
  ImportMappingErrors,
} from '../model/import-upload-model';
import '../styles/import-mappings.css';

export function ImportPropertyMappings({
  mappings,
  errors,
  activeProperties,
  propertyStatus,
  propertyError,
  onRetryProperties,
  onChangeMapping,
  onRemoveMapping,
  onAddMapping,
}: {
  mappings: ImportMappingDraft[];
  errors: ImportMappingErrors;
  activeProperties: AdminPropertyOption[];
  propertyStatus: 'loading' | 'ready' | 'error';
  propertyError?: string;
  onRetryProperties: () => void;
  onChangeMapping: (
    key: number,
    changes: Partial<Pick<ImportMappingDraft, 'sheetName' | 'propertyId'>>,
  ) => void;
  onRemoveMapping: (key: number) => void;
  onAddMapping: () => void;
}) {
  const disclosure = useRef<HTMLDetailsElement>(null);

  useLayoutEffect(() => {
    if (
      disclosure.current &&
      (errors.message || Object.keys(errors.rows).length > 0)
    ) {
      disclosure.current.open = true;
    }
  }, [errors]);

  return (
    <details className="import-mappings" ref={disclosure}>
      <summary
        aria-invalid={!!errors.message || undefined}
        aria-describedby={errors.message ? 'import-mappings-error' : undefined}
      >
        <span className="import-mappings__label">
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
            <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
          </svg>
          <strong>시트별 휴양소 연결</strong>
          <span className="import-mappings__optional">선택</span>
        </span>
        {mappings.length > 0 && (
          <span className="import-mappings__count">{mappings.length}개</span>
        )}
        <span className="import-mappings__chevron">
          <ScheduleIcon name="chevron" />
        </span>
      </summary>
      <div className="import-mappings__body">
        <p className="import-mappings__intro">
          미리 연결하면 검토 단계의 행별 선택을 줄일 수 있어요. 연결하지 않은
          행은 검토 단계에서 휴양소를 선택해 주세요.
        </p>

        {propertyStatus === 'loading' ? (
          <p className="import-mappings__property-state" role="status">
            연결할 휴양소를 불러오고 있습니다. 연결 없이 업로드할 수 있습니다.
          </p>
        ) : propertyStatus === 'error' ? (
          <div className="import-mappings__property-state" role="alert">
            <p>휴양소 목록을 불러오지 못했습니다. {propertyError}</p>
            <Button
              className="admin-button-secondary"
              onClick={onRetryProperties}
            >
              휴양소 다시 불러오기
            </Button>
          </div>
        ) : activeProperties.length === 0 ? (
          <p className="import-mappings__property-state">
            현재 활성 상태인 휴양소가 없습니다. 연결 없이 미리보기를 만든 뒤
            휴양소를 준비하고 검토할 수 있습니다.
          </p>
        ) : null}

        <datalist id="import-upload-sheet-suggestions">
          {STAY_IMPORT_MANAGED_SHEETS.map((name) => (
            <option key={name} value={name} />
          ))}
        </datalist>
        <div className="import-mappings__rows">
          {mappings.map((mapping, index) => {
            const rowErrors = errors.rows[mapping.key];
            const missingProperty =
              mapping.propertyId &&
              !activeProperties.some(
                (property) => property.id === mapping.propertyId,
              );
            return (
              <div
                className="import-mappings__row"
                key={mapping.key}
                role="group"
                aria-labelledby={`import-mapping-${mapping.key}-title`}
              >
                <div className="import-mappings__row-heading">
                  <span id={`import-mapping-${mapping.key}-title`}>
                    연결 {index + 1}
                  </span>
                  <Button
                    className="import-mappings__remove"
                    aria-label={`${index + 1}번째 시트 연결 삭제`}
                    onClick={() => onRemoveMapping(mapping.key)}
                  >
                    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="m6 6 12 12M18 6 6 18" />
                    </svg>
                  </Button>
                </div>
                <div className="import-mappings__grid">
                  <div className="import-mappings__field">
                    <label htmlFor={`import-sheet-${mapping.key}`}>
                      시트 이름
                    </label>
                    <input
                      id={`import-sheet-${mapping.key}`}
                      name={`sheetName-${mapping.key}`}
                      type="text"
                      list="import-upload-sheet-suggestions"
                      maxLength={31}
                      required
                      autoComplete="off"
                      value={mapping.sheetName}
                      onChange={(event) =>
                        onChangeMapping(mapping.key, {
                          sheetName: event.target.value,
                        })
                      }
                      aria-invalid={!!rowErrors?.sheetName || undefined}
                      aria-describedby={`import-upload-sheet-hint${rowErrors?.sheetName ? ` import-sheet-${mapping.key}-error` : ''}`}
                    />
                    {rowErrors?.sheetName && (
                      <p
                        id={`import-sheet-${mapping.key}-error`}
                        className="import-upload__error"
                      >
                        {rowErrors.sheetName}
                      </p>
                    )}
                  </div>
                  <div className="import-mappings__field">
                    <label htmlFor={`import-property-${mapping.key}`}>
                      연결할 휴양소
                    </label>
                    <select
                      id={`import-property-${mapping.key}`}
                      name={`propertyId-${mapping.key}`}
                      value={mapping.propertyId}
                      required
                      disabled={propertyStatus !== 'ready'}
                      onChange={(event) =>
                        onChangeMapping(mapping.key, {
                          propertyId: event.target.value,
                        })
                      }
                      aria-invalid={!!rowErrors?.propertyId || undefined}
                      aria-describedby={
                        rowErrors?.propertyId
                          ? `import-property-${mapping.key}-error`
                          : undefined
                      }
                    >
                      <option value="" disabled>
                        휴양소 선택
                      </option>
                      {missingProperty && (
                        <option value={mapping.propertyId} disabled>
                          선택한 휴양소 · 현재 선택 불가
                        </option>
                      )}
                      {activeProperties.map((property) => (
                        <option key={property.id} value={property.id}>
                          {property.name}
                        </option>
                      ))}
                    </select>
                    {rowErrors?.propertyId && (
                      <p
                        id={`import-property-${mapping.key}-error`}
                        className="import-upload__error"
                      >
                        {rowErrors.propertyId}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {errors.message && (
          <p
            id="import-mappings-error"
            className="import-upload__error"
            role="alert"
          >
            {errors.message}
          </p>
        )}
        <div className="import-mappings__footer">
          <Button
            className="admin-button-secondary import-mappings__add"
            disabled={mappings.length >= 40 || activeProperties.length === 0}
            onClick={onAddMapping}
          >
            <ScheduleIcon name="plus" />
            연결 추가
          </Button>
          <p id="import-upload-sheet-hint">
            파일에 있는 지원 시트 이름을 공백까지 동일하게 입력해 주세요. 지원
            이름은 입력란에서 확인할 수 있습니다.
          </p>
          <p>같은 시트나 휴양소는 한 번만 연결할 수 있습니다.</p>
          {mappings.length >= 40 && (
            <p>시트 연결은 최대 40개까지 추가할 수 있습니다.</p>
          )}
        </div>
      </div>
    </details>
  );
}
