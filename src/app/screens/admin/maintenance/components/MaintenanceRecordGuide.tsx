export function MaintenanceRecordGuide() {
  return (
    <aside className="maintenance-note" aria-label="기록 확인 안내">
      <p>제출 여부는 실제 정비 품질이나 관리자 승인을 뜻하지 않습니다.</p>
      <details>
        <summary>시간·직원 정보 안내</summary>
        <p>
          작성 시작은 체크리스트를 연 시간이며 실제 작업 시작을 뜻하지 않습니다.
          마지막 저장은 기록을 저장한 시간이며 실시간 접속을 뜻하지 않습니다.
          모든 시간은 한국 시간입니다.
        </p>
        <p>
          기록 직원은 기록에 저장된 이름입니다. ‘제출됨’ 상태의 휴양소
          이름·지역도 저장 당시 정보이며, 휴양소 활성 여부는 현재 상태입니다.
        </p>
      </details>
    </aside>
  );
}
