import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import type { StartStaffDraftDto } from '../../../../features/staff-drafts/staff-drafts.types';
import { rememberStaffHome } from '../../../../features/staff-entry/staff-home-return';

export function useOpenStaffDraft() {
  const navigate = useNavigate();
  return useCallback(
    (start: StartStaffDraftDto, qrToken: string) => {
      // The start API validates the canonical origin, path and private token.
      const destination = new URL(start.url);
      if (destination.origin !== window.location.origin) {
        window.location.assign(start.url);
        return;
      }
      rememberStaffHome(start, qrToken);
      void navigate(destination.pathname + destination.hash);
    },
    [navigate],
  );
}
