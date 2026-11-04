import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { ApiRequestError } from '../../../../core/api/api-error';
import { getStayAccess } from '../../../../features/admin-stay-access/admin-stay-access-api';
import type { AdminStayAccessDto } from '../../../../features/admin-stay-access/admin-stay-access.types';
import { getAdminStayLink } from '../../../../features/admin-stay-links/admin-stay-link-api';
import { getAdminStayVehicle } from '../../../../features/admin-stay-vehicles/admin-stay-vehicle-api';
import { getAdminStay } from '../../../../features/admin-stays/admin-stays-api';
import type { AdminStayDto } from '../../../../features/admin-stays/admin-stays.types';
import { stayLinkStatusLabel } from '../model/stay-link-model';
import {
  getStayVehicleScope,
  matchesStayVehicleContext,
} from '../model/stay-vehicle-model';

export type StayDetailSummaryKey = 'password' | 'link' | 'vehicle';
type Summaries = Record<StayDetailSummaryKey, string>;
const loading: Summaries = {
  password: '불러오는 중',
  link: '불러오는 중',
  vehicle: '불러오는 중',
};
const needsReview = '상태 확인 필요';

function accessSummary(stay: AdminStayDto, data: AdminStayAccessDto): string {
  if (
    data.stay.id !== stay.id ||
    data.stay.propertyId !== stay.property.id ||
    data.stay.currentRevision !== stay.currentRevision ||
    data.stay.status !== stay.status ||
    data.stay.checkOutAt !== stay.checkOutAt ||
    data.stay.propertyIsActive !== stay.property.isActive
  )
    return needsReview;
  if (data.blockedReason === 'CANCELLED') return '취소된 예약';
  if (data.blockedReason === 'ENDED') return '종료된 예약';
  if (data.blockedReason) return '설정 확인 필요';
  if (data.state === 'PREPARED') return '번호 준비됨';
  return data.state === 'REVIEW_REQUIRED' ? '확인 필요' : '준비 전';
}

export function useStayDetailSummaries(
  stay: AdminStayDto,
  token: string,
  rejectSession: (token: string) => void,
) {
  const key = getStayVehicleScope(stay);
  const owner = useRef<{ key: string; token: string } | null>(null);
  const overrides = useRef(new Set<StayDetailSummaryKey>());
  const request = useRef<AbortController | null>(null);
  const [result, setResult] = useState<{
    key: string;
    token: string;
    summaries: Summaries;
  }>();

  useLayoutEffect(() => {
    owner.current = { key, token };
    overrides.current = new Set();
    return () => {
      owner.current = null;
      request.current?.abort();
    };
  }, [key, token]);

  const updateSummary = useCallback(
    (field: StayDetailSummaryKey, value: string) => {
      if (owner.current?.key !== key || owner.current.token !== token) return;
      // A panel may close while its metadata is still loading. Keep the last
      // verified label and let the initial read fill an as-yet unknown summary.
      if (value === '불러오는 중') return;
      overrides.current.add(field);
      setResult((previous) => ({
        key,
        token,
        summaries: {
          ...(previous?.key === key && previous.token === token
            ? previous.summaries
            : loading),
          [field]: value,
        },
      }));
    },
    [key, token],
  );

  useEffect(() => {
    const controller = new AbortController();
    request.current = controller;
    const current = () =>
      !controller.signal.aborted &&
      request.current === controller &&
      owner.current?.key === key &&
      owner.current.token === token;
    const publish = (field: StayDetailSummaryKey, value: string) => {
      if (!current() || overrides.current.has(field)) return;
      setResult((previous) => {
        if (!current() || overrides.current.has(field)) return previous;
        return {
          key,
          token,
          summaries: {
            ...(previous?.key === key && previous.token === token
              ? previous.summaries
              : loading),
            [field]: value,
          },
        };
      });
    };
    const failure = (field: StayDetailSummaryKey, error: unknown) => {
      if (!current()) return;
      publish(field, needsReview);
      if (
        error instanceof ApiRequestError &&
        (error.status === 401 || error.status === 403)
      )
        rejectSession(token);
    };

    async function readPassword() {
      try {
        const data = await getStayAccess(stay.id, token, controller.signal);
        publish('password', accessSummary(stay, data));
      } catch (error) {
        failure('password', error);
      }
    }
    async function readLink() {
      const results = await Promise.allSettled([
        getAdminStay(stay.id, token, controller.signal),
        getAdminStayLink(stay.id, token, controller.signal),
      ]);
      if (!current()) return;
      const denied = results.find(
        (entry) =>
          entry.status === 'rejected' &&
          entry.reason instanceof ApiRequestError &&
          (entry.reason.status === 401 || entry.reason.status === 403),
      );
      if (denied?.status === 'rejected') {
        failure('link', denied.reason);
        return;
      }
      const [freshStay, link] = results;
      if (freshStay.status === 'rejected' || link.status === 'rejected') {
        publish('link', needsReview);
        return;
      }
      publish(
        'link',
        getStayVehicleScope(freshStay.value) === key &&
          link.value.stayRevision === stay.currentRevision
          ? stayLinkStatusLabel(link.value, stay)
          : needsReview,
      );
    }
    async function readVehicle() {
      try {
        const data = await getAdminStayVehicle(
          stay.id,
          token,
          controller.signal,
        );
        publish(
          'vehicle',
          !matchesStayVehicleContext(stay, data)
            ? needsReview
            : data.needsReview
              ? '재확인 필요'
              : data.vehicle === null
                ? '미등록'
                : data.vehicle.plateNumber === null
                  ? '번호 없이 저장됨'
                  : '등록됨',
        );
      } catch (error) {
        failure('vehicle', error);
      }
    }
    void Promise.all([readPassword(), readLink(), readVehicle()]);
    return () => controller.abort();
  }, [key, stay, token, rejectSession]);

  return {
    summaries:
      result?.key === key && result.token === token
        ? result.summaries
        : loading,
    updateSummary,
  };
}
