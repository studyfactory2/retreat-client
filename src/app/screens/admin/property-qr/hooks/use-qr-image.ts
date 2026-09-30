import { useEffect, useState } from 'react';
import type { QrIssue } from '../../../../features/admin-property-qr/admin-property-qr.types';
import { createQrImage } from '../model/qr-image';

type ImageState = {
  owner: QrIssue;
  name: string;
  image?: string;
  failed?: boolean;
};

export function useQrImage(issue: QrIssue, propertyName: string) {
  const [result, setResult] = useState<ImageState>();
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    void createQrImage(issue, propertyName).then(
      (image) => {
        if (active) setResult({ owner: issue, name: propertyName, image });
      },
      () => {
        if (active)
          setResult({ owner: issue, name: propertyName, failed: true });
      },
    );
    return () => {
      active = false;
    };
  }, [issue, propertyName, attempt]);
  const current =
    result?.owner === issue && result.name === propertyName
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
