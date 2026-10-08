import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { buildGuestViewLocation } from '../../entry/model/guest-entry-model';
import type { GuestIssueReportController } from './use-guest-issue-report';
import { useGuestIssuePhotos } from './use-guest-issue-photos';

export function useGuestIssueWorkspace({
  token,
  hash,
  controller,
}: {
  token: string | null;
  hash: string;
  controller: GuestIssueReportController;
}) {
  const navigate = useNavigate();
  const [leave, setLeave] = useState<{
    token: string | null;
    href: string | null;
    message: string;
  } | null>(null);
  const { resource } = controller;
  const visibleLeave = leave?.token === token ? leave : null;
  const ready = resource.status === 'ready';
  const photos = useGuestIssuePhotos({
    qrToken: token,
    propertyId: ready ? resource.context.property.id : null,
    // Review hides write controls while retaining authorized preview ownership.
    disabled:
      !ready ||
      resource.access !== 'ready' ||
      resource.mode === 'received' ||
      resource.attempt !== null ||
      resource.confirmation !== null ||
      visibleLeave !== null ||
      resource.categories.length === 0,
    onQrRejected: controller.rejectAccess,
  });
  const home = buildGuestViewLocation('qr', hash, 'home');
  const guide = buildGuestViewLocation('qr', hash, 'guide');
  const report = buildGuestViewLocation('qr', hash, 'report');
  const navigationLocked =
    resource.status !== 'ready' ||
    resource.attempt !== null ||
    photos.busy ||
    resource.access !== 'ready';
  const confirmNavigation = (href: string) => {
    const allowed = [home, guide, report].map(
      (to) => `${to.pathname}${to.search}${to.hash}`,
    );
    if (!allowed.includes(href)) return false;
    if (href === allowed[2]) return true;
    if (navigationLocked) {
      setLeave({
        token,
        href: null,
        message: '진행 중인 요청과 접수 결과를 먼저 확인해 주세요.',
      });
      return false;
    }
    if (controller.dirty || photos.dirty) {
      setLeave({
        token,
        href,
        message:
          '작성한 내용과 첨부 사진의 접근 정보가 사라집니다. 이 신고는 임시 저장되지 않습니다.',
      });
      return false;
    }
    return true;
  };
  return {
    photos,
    home,
    guide,
    report,
    visibleLeave,
    navigationLocked,
    confirmNavigation,
    goHome: () => {
      if (confirmNavigation(`${home.pathname}${home.search}${home.hash}`))
        void navigate(home);
    },
    stay: () => setLeave(null),
    discardAndLeave: () => {
      if (!visibleLeave?.href || navigationLocked) return;
      photos.clear();
      void navigate(visibleLeave.href);
    },
  };
}
