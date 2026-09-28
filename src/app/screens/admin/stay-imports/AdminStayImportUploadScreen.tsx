import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ApiRequestError } from '../../../core/api/api-error';
import { useAdminSession } from '../../../core/session/use-admin-session';
import { useAdminPropertyOptions } from '../../../features/admin-properties/use-admin-property-options';
import {
  previewStayImport,
  STAY_IMPORT_MAX_FILE_BYTES,
} from '../../../features/admin-stay-imports/admin-stay-imports-api';
import { Button } from '../../../shared/ui/Button/Button';
import {
  validateImportFile,
  validateImportMappings,
  type ImportMappingDraft,
  type ImportMappingErrors,
} from './model/import-upload-model';
import { ImportPropertyMappings } from './components/ImportPropertyMappings';
import { UploadFileField } from './components/UploadFileField';
import './styles/import-upload.css';

type UploadState = {
  busy: boolean;
  uncertain?: boolean;
  message?: string;
  details?: string[];
};

export function AdminStayImportUploadScreen() {
  const { state, rejectSession } = useAdminSession();
  if (state.status !== 'authenticated') return null;
  return (
    <UploadWorkspace
      key={`${state.user.id}:${state.expiresAt}`}
      token={state.token}
      rejectSession={rejectSession}
    />
  );
}

function UploadWorkspace({
  token,
  rejectSession,
}: {
  token: string;
  rejectSession: (token: string) => void;
}) {
  const navigate = useNavigate();
  const properties = useAdminPropertyOptions(token, rejectSession);
  const [file, setFile] = useState<File | null>(null);
  const [mappings, setMappings] = useState<ImportMappingDraft[]>([]);
  const [fileError, setFileError] = useState<string>();
  const [mappingErrors, setMappingErrors] = useState<ImportMappingErrors>({
    rows: {},
  });
  const [result, setResult] = useState<{ owner: string; state: UploadState }>();
  const pending = useRef<AbortController | null>(null);
  const retryRequired = useRef(false);
  const nextKey = useRef(1);
  const notice = useRef<HTMLDivElement>(null);
  const state: UploadState =
    result?.owner === token ? result.state : { busy: false };
  const activeProperties =
    properties.resource.status === 'ready'
      ? properties.resource.data.filter((property) => property.isActive)
      : [];

  useEffect(() => {
    retryRequired.current = false;
    return () => {
      pending.current?.abort();
      pending.current = null;
    };
  }, [token]);
  useEffect(() => {
    if (state.message) notice.current?.focus();
  }, [state.message]);

  function changeMapping(
    key: number,
    changes: Partial<Pick<ImportMappingDraft, 'sheetName' | 'propertyId'>>,
  ) {
    setMappings((current) =>
      current.map((mapping) =>
        mapping.key === key ? { ...mapping, ...changes } : mapping,
      ),
    );
    setMappingErrors({ rows: {} });
  }

  async function upload(explicitRetry = false) {
    if (pending.current || state.busy) return;
    if (retryRequired.current && !explicitRetry) {
      notice.current?.focus();
      return;
    }
    const nextFileError = validateImportFile(file, STAY_IMPORT_MAX_FILE_BYTES);
    const nextMappingErrors = validateImportMappings(
      mappings,
      properties.resource.status === 'ready'
        ? new Set(activeProperties.map((property) => property.id))
        : null,
    );
    setFileError(nextFileError);
    setMappingErrors(nextMappingErrors);
    if (
      nextFileError ||
      nextMappingErrors.message ||
      Object.keys(nextMappingErrors.rows).length ||
      !file
    ) {
      requestAnimationFrame(() =>
        document
          .querySelector<HTMLElement>('.import-upload [aria-invalid="true"]')
          ?.focus(),
      );
      return;
    }

    const controller = new AbortController();
    pending.current = controller;
    retryRequired.current = false;
    setResult({ owner: token, state: { busy: true } });
    try {
      const preview = await previewStayImport(
        file,
        mappings.map(({ sheetName, propertyId }) => ({
          sheetName,
          propertyId,
        })),
        token,
        controller.signal,
      );
      if (!controller.signal.aborted)
        navigate(`/admin/stays/imports/${preview.batch.id}`, { replace: true });
    } catch (error: unknown) {
      if (controller.signal.aborted) return;
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      ) {
        retryRequired.current = true;
        rejectSession(token);
        return;
      }
      const uncertain =
        !(error instanceof ApiRequestError) ||
        error.status === null ||
        error.status >= 500 ||
        (error.status >= 200 && error.status < 300);
      retryRequired.current = uncertain;
      setResult({
        owner: token,
        state: {
          busy: false,
          uncertain,
          message: uncertain
            ? '미리보기 생성 결과를 확인하지 못했습니다.'
            : error instanceof ApiRequestError
              ? error.message
              : '파일을 업로드하지 못했습니다.',
          details:
            !uncertain && error instanceof ApiRequestError
              ? error.errors.flatMap((entry) => entry.messages).slice(0, 8)
              : undefined,
        },
      });
    } finally {
      if (pending.current === controller) pending.current = null;
    }
  }

  return (
    <div className="import-upload">
      <header className="import-upload__heading">
        <div>
          <p className="import-upload__eyebrow">이용 일정 가져오기</p>
          <h1>명단 파일 업로드</h1>
          <p>이용자 명단을 올리고, 미리보기에서 등록할 내용을 검토하세요.</p>
        </div>
        <Button
          className="admin-button-secondary"
          disabled={state.busy}
          onClick={() => navigate('/admin/stays')}
        >
          목록으로 돌아가기
        </Button>
      </header>

      <div className="import-upload__guide">
        <strong>업로드 후 바로 일정이 등록되지는 않습니다.</strong>
        <p>
          미리보기에서 휴양소와 이용객 정보를 검토하고 등록을 확정해야 실제 이용
          일정에 반영됩니다.
        </p>
      </div>

      {state.message && (
        <div
          className={`import-upload__notice${state.uncertain ? ' import-upload__notice--uncertain' : ''}`}
          role="alert"
          tabIndex={-1}
          ref={notice}
        >
          <h2>{state.message}</h2>
          {state.uncertain ? (
            <>
              <p>
                서버에 미리보기가 만들어졌을 수 있습니다. 이 단계에서는 이용
                일정이 등록되지 않습니다.
              </p>
              <p>
                다시 업로드하면 별도의 미리보기가 생성될 수 있습니다. 이미
                미리보기 주소를 알고 있다면 해당 주소에서 이어서 검토해 주세요.
              </p>
              <Button
                className="admin-button-secondary"
                onClick={() => {
                  void upload(true);
                }}
                disabled={state.busy}
              >
                새 미리보기로 다시 업로드
              </Button>
            </>
          ) : (
            state.details &&
            state.details.length > 0 && (
              <ul>
                {state.details.map((message, index) => (
                  <li key={`${index}:${message}`}>{message}</li>
                ))}
              </ul>
            )
          )}
        </div>
      )}

      <form
        noValidate
        onSubmit={(event) => {
          event.preventDefault();
          void upload();
        }}
        aria-busy={state.busy}
      >
        <fieldset className="import-upload__fields" disabled={state.busy}>
          <legend className="import-upload__legend">
            명단 파일과 시트 연결 정보
          </legend>
          <UploadFileField
            file={file}
            error={fileError}
            onChange={(nextFile) => {
              setFile(nextFile);
              setFileError(undefined);
            }}
          />
          <ImportPropertyMappings
            mappings={mappings}
            errors={mappingErrors}
            activeProperties={activeProperties}
            propertyStatus={properties.resource.status}
            propertyError={
              properties.resource.status === 'error'
                ? properties.resource.message
                : undefined
            }
            onRetryProperties={properties.refresh}
            onChangeMapping={changeMapping}
            onRemoveMapping={(key) => {
              setMappings((current) =>
                current.filter((item) => item.key !== key),
              );
              setMappingErrors({ rows: {} });
            }}
            onAddMapping={() => {
              const key = nextKey.current++;
              setMappings((current) =>
                current.length < 40
                  ? [...current, { key, sheetName: '', propertyId: '' }]
                  : current,
              );
              setMappingErrors({ rows: {} });
            }}
          />
        </fieldset>
        <div className="import-upload__actions">
          <p>
            {state.busy
              ? '미리보기를 만들고 있습니다. 업로드가 끝날 때까지 화면을 유지해 주세요.'
              : '업로드한 내용은 다음 단계에서 검토합니다.'}
          </p>
          <Button type="submit" loading={state.busy} disabled={state.uncertain}>
            {state.busy ? '미리보기 만드는 중' : '미리보기 만들기'}
          </Button>
        </div>
      </form>
      <p className="import-upload__resume">
        미리보기가 열리면 화면 주소를 보관해 주세요. 같은 주소로 다시 접속하면
        검토를 이어갈 수 있습니다.
      </p>
    </div>
  );
}
