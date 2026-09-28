import type { AdminPropertyOption } from '../../../../features/admin-properties/admin-properties.types';
import { STAY_IMPORT_MANAGED_SHEETS } from '../../../../features/admin-stay-imports/admin-stay-imports-api';
import { Button } from '../../../../shared/ui/Button/Button';
import type {
  ImportMappingDraft,
  ImportMappingErrors,
} from '../model/import-upload-model';

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
  return (
    <section
      className="import-upload__card"
      aria-labelledby="import-upload-mappings-title"
    >
      <div className="import-upload__section-heading">
        <span aria-hidden="true">02</span>
        <div>
          <h2 id="import-upload-mappings-title">
            시트와 휴양소 연결 <small>선택</small>
          </h2>
          <p>파일의 시트 이름을 실제 휴양소와 연결할 수 있습니다.</p>
        </div>
      </div>
      <div className="import-upload__mapping-guide">
        <p>
          연결 없이 업로드할 수도 있습니다. 연결하지 않은 시트의 이용 일정은
          미리보기에서 휴양소를 선택하고 검토해야 합니다.
        </p>
        <p id="import-upload-sheet-hint">
          시트 이름은 파일에 적힌 공백까지 그대로 입력해 주세요. 추천 이름과
          다르면 직접 입력할 수 있습니다.
        </p>
      </div>

      {propertyStatus === 'loading' ? (
        <p className="import-upload__property-state" role="status">
          연결할 휴양소를 불러오고 있습니다. 연결 없이 업로드할 수 있습니다.
        </p>
      ) : propertyStatus === 'error' ? (
        <div className="import-upload__property-state" role="alert">
          <p>휴양소 목록을 불러오지 못했습니다. {propertyError}</p>
          <Button
            className="admin-button-secondary"
            onClick={onRetryProperties}
          >
            휴양소 다시 불러오기
          </Button>
        </div>
      ) : activeProperties.length === 0 ? (
        <p className="import-upload__property-state">
          현재 활성 상태인 휴양소가 없습니다. 연결 없이 미리보기를 만든 뒤
          휴양소를 준비하고 검토할 수 있습니다.
        </p>
      ) : null}

      <datalist id="import-upload-sheet-suggestions">
        {STAY_IMPORT_MANAGED_SHEETS.map((name) => (
          <option key={name} value={name} />
        ))}
      </datalist>
      {mappings.length === 0 && (
        <p className="import-upload__empty">아직 연결한 시트가 없습니다.</p>
      )}
      <div className="import-upload__mappings">
        {mappings.map((mapping, index) => {
          const rowErrors = errors.rows[mapping.key];
          const missingProperty =
            mapping.propertyId &&
            !activeProperties.some(
              (property) => property.id === mapping.propertyId,
            );
          return (
            <fieldset className="import-upload__mapping" key={mapping.key}>
              <legend>연결 {index + 1}</legend>
              <div className="import-upload__mapping-grid">
                <div className="import-upload__field">
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
                <div className="import-upload__field">
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
                <Button
                  className="admin-button-secondary import-upload__remove"
                  aria-label={`${index + 1}번째 시트 연결 삭제`}
                  onClick={() => onRemoveMapping(mapping.key)}
                >
                  삭제
                </Button>
              </div>
            </fieldset>
          );
        })}
      </div>
      {errors.message && (
        <p className="import-upload__error" role="alert">
          {errors.message}
        </p>
      )}
      <div className="import-upload__mapping-footer">
        <Button
          className="admin-button-secondary"
          disabled={mappings.length >= 40 || activeProperties.length === 0}
          onClick={onAddMapping}
        >
          시트 연결 추가
        </Button>
        <span>
          {mappings.length} / 40개 · 같은 시트나 휴양소는 한 번만 연결할 수
          있습니다.
        </span>
      </div>
    </section>
  );
}
