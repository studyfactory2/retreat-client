import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getAdminIssueCategories } from '../../../../features/admin-issue-categories/admin-issue-category-api';
import type {
  AdminIssueCategoryListDto,
  GetAdminIssueCategoriesInput,
} from '../../../../features/admin-issue-categories/admin-issue-category.types';
import { categorySearch } from '../model/issue-category-model';

type Resource =
  | { status: 'loading' }
  | { status: 'error'; message: string }
  | { status: 'ready'; data: AdminIssueCategoryListDto };

export function useCategoryList(
  input: GetAdminIssueCategoriesInput,
  token: string,
  rejectSession: (token: string) => void,
  enabled: boolean,
) {
  const [revision, setRevision] = useState(0);
  const { page, search, isActive } = input;
  const scope = `${categorySearch(input)}:${revision}:${enabled}:${token}`;
  const owner = useRef<string | null>(scope);
  const [result, setResult] = useState<{ scope: string; resource: Resource }>();
  useLayoutEffect(() => {
    owner.current = scope;
    return () => {
      owner.current = null;
    };
  }, [scope]);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    const current = () => !controller.signal.aborted && owner.current === scope;
    void getAdminIssueCategories(
      { page, search, isActive },
      token,
      controller.signal,
    ).then(
      (data) => {
        if (current())
          setResult({ scope, resource: { status: 'ready', data } });
      },
      (error: unknown) => {
        if (!current()) return;
        if (
          error instanceof ApiRequestError &&
          [401, 403].includes(error.status ?? 0)
        ) {
          rejectSession(token);
          return;
        }
        setResult({
          scope,
          resource: {
            status: 'error',
            message:
              error instanceof ApiRequestError
                ? error.message
                : '분류 목록을 확인하지 못했습니다. 다시 불러와 주세요.',
          },
        });
      },
    );
    return () => controller.abort();
  }, [page, search, isActive, token, rejectSession, enabled, scope]);
  return {
    resource:
      result?.scope === scope
        ? result.resource
        : ({ status: 'loading' } as Resource),
    refresh: () => setRevision((value) => value + 1),
  };
}
