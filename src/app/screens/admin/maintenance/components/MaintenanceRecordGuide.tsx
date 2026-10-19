import type { ReactNode } from 'react';

export function MaintenanceRecordGuide({ children }: { children?: ReactNode }) {
  return (
    <details className="maintenance-note">
      <summary>기록 안내</summary>
      <div className="maintenance-note__body">
        <p>선택한 날짜 기준으로 최근 기록부터 표시하며, 날짜가 없는 기록은 마지막에 표시합니다.</p>
        <p>‘미완료’에는 기한 만료·접근 불가·확인 필요가 포함됩니다. ‘제출 기록’에도 확인 필요 상태가 포함될 수 있습니다.</p>
        <p>직원이 시작한 체크리스트마다 기록이 하나씩 표시됩니다. 제출 여부는 실제 정비 품질이나 관리자 승인을 뜻하지 않습니다.</p>
        <p>작성 시작은 체크리스트를 연 시간이며 실제 작업 시작을 뜻하지 않습니다. 마지막 저장은 기록을 저장한 시간이며 실시간 접속을 뜻하지 않습니다. 모든 시간은 한국 시간입니다.</p>
        <p>기록 직원은 기록에 저장된 이름입니다. ‘제출됨’ 상태의 휴양소 이름·지역도 저장 당시 정보이며, 휴양소 활성 여부는 현재 상태입니다.</p>
        {children}
      </div>
    </details>
  );
}
