import { useEffect, useRef } from 'react';

export function useAccountFormFocus(revision: number) {
  const form = useRef<HTMLFormElement>(null);
  useEffect(() => {
    if (!revision) return;
    const target =
      form.current?.querySelector<HTMLElement>('[aria-invalid="true"]') ??
      form.current?.querySelector<HTMLElement>('[role="alert"]');
    target?.focus();
  }, [revision]);
  return form;
}
