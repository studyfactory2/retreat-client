const sheets = [
  ['안내', '기간 · 건수 · 엑셀 읽는 방법'],
  ['이용 일정', '이용객 · 입퇴실 예정 시각 · 취소 정보'],
  ['점검 기록', '입실·퇴실·정비 · 작성자 · 전체 메모'],
  ['점검 답변', '질문별 답변 · 이상 내용 · 직원 조치'],
  ['이상사항', '신고 내용 · 처리 상태 · 해결 시각'],
  ['변경 이력', '누가 · 언제 · 왜 · 변경 전후 내용'],
  ['사진 목록', '파일명 · 사진 ID · 연결 버전 · 파일 상태'],
] as const;

export function PreservationContents() {
  return (
    <section
      className="reports-contents reports-contents--preservation"
      aria-labelledby="report-contents-heading"
    >
      <div className="reports-contents__heading">
        <h2 id="report-contents-heading">보관용 엑셀</h2>
        <span>7개 시트</span>
      </div>
      <p className="reports-archive-intro">
        최신 기록과 변경 이력을 한 파일에 보관하세요.
      </p>
      <ol className="reports-archive-sheets">
        {sheets.map(([title, description], index) => (
          <li key={title}>
            <span className="reports-archive-sheets__number" aria-hidden="true">
              {String(index + 1).padStart(2, '0')}
            </span>
            <div>
              <h3>{title}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="reports-contents__basis">
        취소된 기록도 포함합니다. 사진 파일은 포함되지 않습니다.
      </p>
      <details className="reports-scope">
        <summary>기록 범위와 사용 방법</summary>
        <ul>
          <li>
            일정은 선택 기간과 겹치는 일정, 점검은 최초 제출일, 이상사항은
            접수일 기준입니다. 보관된 휴양소도 선택할 수 있습니다.
          </li>
          <li>
            주요 시트는 다운로드 시점의 최신 내용입니다. 이력은 대상 기록의 모든
            버전을 포함하므로 선택 기간 이후의 변경도 표시됩니다.
          </li>
          <li>
            당시 저장된 이름과 질문을 유지합니다. 같은 기록 ID로 시트를
            연결하고, 엑셀 필터로 상태나 버전을 선택하세요.
          </li>
          <li>
            사진 목록은 버전별 연결 정보이며 같은 사진이 여러 행에 표시될 수
            있습니다. 파일 상태는 데이터베이스 기준으로, 실제 파일 존재 여부는
            확인하지 않습니다.
          </li>
          <li>
            최대 62일 · 기록 5,000건 · 버전/이벤트 10,000건 · 상세 50,000행 ·
            텍스트 32 MiB · 파일 16 MiB. 초과 시 범위를 줄여 주세요. 일부만
            저장하지 않습니다.
          </li>
          <li>
            작성 중 기록, 차량번호, 로그인·QR 정보는 제외합니다. 앱에 다시
            업로드하여 복구하는 파일은 아닙니다.
          </li>
        </ul>
      </details>
    </section>
  );
}
