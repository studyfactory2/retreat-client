import { useEffect, useState } from 'react';
import type { AdminStayLinkIssue } from '../../../../features/admin-stay-links/admin-stay-link.types';
import { createStayLinkQr } from '../model/stay-link-qr';

export function useStayLinkQr(
  receipt: AdminStayLinkIssue,
  propertyName: string,
) {
  const [result, setResult] = useState<{
    owner: AdminStayLinkIssue;
    propertyName: string;
    image?: string;
    failed?: boolean;
  }>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void createStayLinkQr(receipt, propertyName).then(
      (image) => {
        if (active) setResult({ owner: receipt, propertyName, image });
      },
      () => {
        if (active) setResult({ owner: receipt, propertyName, failed: true });
      },
    );
    return () => {
      active = false;
    };
  }, [receipt, propertyName, attempt]);
  const current =
    result?.owner === receipt && result.propertyName === propertyName
      ? result
      : undefined;
  return {
    image: current?.image,
    failed: current?.failed ?? false,
    retry: () => {
      setResult(undefined);
      setAttempt((value) => value + 1);
    },
  };
}
