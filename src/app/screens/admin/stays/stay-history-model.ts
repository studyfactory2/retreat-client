import { ApiRequestError } from '../../../core/api/api-error';
import type {
  AdminStayRevisionDto,
  AdminStayRevisionListDto,
  AdminStaySnapshot,
} from '../../../features/admin-stays/admin-stay-management.types';

export interface StayHistoryChange {
  label: string;
  before: string;
  after: string;
}

export interface StayHistoryEntry {
  revision: AdminStayRevisionDto;
  changes: StayHistoryChange[] | null;
}

const formatter = new Intl.DateTimeFormat('ko-KR', {
  timeZone: 'Asia/Seoul',
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  second: '2-digit',
  hourCycle: 'h23',
});

export function formatStayHistoryTime(value: string): string {
  const date = new Date(value);
  const text = formatter.format(date);
  return date.getUTCMilliseconds()
    ? `${text}.${String(date.getUTCMilliseconds()).padStart(3, '0')}`
    : text;
}

export function stayHistoryAction(
  action: AdminStayRevisionDto['action'],
): string {
  return {
    CREATED: '일정 등록',
    CORRECTED: '정보 수정',
    CANCELLED: '일정 취소',
    RESTORED: '일정 복원',
  }[action];
}

export function stayHistoryChangedError(): ApiRequestError {
  return new ApiRequestError(
    '변경 이력이 갱신되었습니다. 이력을 새로고침한 뒤 다시 확인해 주세요.',
    200,
    'STAY_HISTORY_CHANGED',
  );
}

const fields = [
  ['guestName', '이용객 이름'],
  ['phone', '연락처'],
  ['company', '회사'],
  ['department', '부서'],
  ['checkInAt', '입실 예정'],
  ['checkOutAt', '퇴실 예정'],
  ['status', '상태'],
  ['notes', '관리자 메모'],
  ['cancellationReason', '취소 사유'],
  ['cancelledAt', '취소 시각'],
  ['source', '등록 방식'],
] as const;

function fieldText(
  snapshot: AdminStaySnapshot,
  field: (typeof fields)[number][0],
): string {
  const value = snapshot[field];
  if (value === null || value === '') return '미입력';
  if (field === 'status') return value === 'ACTIVE' ? '등록됨' : '취소됨';
  if (field === 'source') return value === 'MANUAL' ? '직접 등록' : '엑셀 등록';
  if (
    field === 'checkInAt' ||
    field === 'checkOutAt' ||
    field === 'cancelledAt'
  )
    return formatStayHistoryTime(value);
  return value;
}

export function staySnapshotDetails(
  snapshot: AdminStaySnapshot,
): Array<{ label: string; value: string }> {
  return [
    { label: '휴양소', value: snapshot.property.name },
    { label: '지역', value: snapshot.property.region || '미입력' },
    {
      label: '휴양소 운영 상태',
      value: snapshot.property.isActive ? '활성' : '비활성',
    },
    ...fields.map(([field, label]) => ({
      label,
      value: fieldText(snapshot, field),
    })),
    {
      label: '최초 등록 시각',
      value: formatStayHistoryTime(snapshot.createdAt),
    },
    { label: '변경 시각', value: formatStayHistoryTime(snapshot.updatedAt) },
  ];
}

export function buildStayHistoryEntries(
  page: AdminStayRevisionListDto,
  olderPage?: AdminStayRevisionListDto,
): StayHistoryEntry[] {
  const needsOlder = page.page < page.totalPages;
  if (
    (page.total > 0 && page.items.length === 0) ||
    page.items.some(
      (item, index) =>
        item.version !== page.total - (page.page - 1) * page.limit - index,
    ) ||
    (needsOlder && !olderPage) ||
    (olderPage &&
      (olderPage.page !== page.page + 1 ||
        olderPage.total !== page.total ||
        olderPage.totalPages !== page.totalPages ||
        olderPage.limit !== page.limit ||
        !olderPage.items.length))
  )
    throw stayHistoryChangedError();

  return page.items.map((revision, index) => {
    const previous = page.items[index + 1] ?? olderPage?.items[0];
    if (revision.version === 1) {
      if (previous || revision.action !== 'CREATED')
        throw stayHistoryChangedError();
      return { revision, changes: null };
    }
    if (
      !previous ||
      previous.stayId !== revision.stayId ||
      previous.version !== revision.version - 1
    )
      throw stayHistoryChangedError();
    return {
      revision,
      changes: fields.flatMap(([field, label]) =>
        revision.snapshot[field] === previous.snapshot[field]
          ? []
          : [
              {
                label,
                before: fieldText(previous.snapshot, field),
                after: fieldText(revision.snapshot, field),
              },
            ],
      ),
    };
  });
}
