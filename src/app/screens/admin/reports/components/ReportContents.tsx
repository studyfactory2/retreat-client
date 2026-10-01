export function ReportContents() {
  return (
    <section className="reports-contents" aria-labelledby="report-contents-heading">
      <h2 id="report-contents-heading">파일에 포함되는 기록</h2>
      <div className="reports-sheets">
        <article>
          <span className="reports-sheets__number">01</span>
          <h3>입퇴실 제출</h3>
          <p className="reports-sheets__basis">체크리스트 제출일 기준</p>
          <p>제출 완료된 입실·퇴실 기록과 작성자, 확인 항목·이상 항목·사진 수를 담습니다.</p>
        </article>
        <article>
          <span className="reports-sheets__number">02</span>
          <h3>정비 제출</h3>
          <p className="reports-sheets__basis">체크리스트 제출일 기준</p>
          <p>제출 완료된 정비 기록과 담당자, 시작·제출 시각, 항목·사진 수를 담습니다.</p>
        </article>
        <article>
          <span className="reports-sheets__number">03</span>
          <h3>이상사항</h3>
          <p className="reports-sheets__basis">이상사항 접수일 기준</p>
          <p>접수된 문제의 제목, 분류, 긴급 여부와 다운로드 시점의 현재 상태를 담습니다.</p>
        </article>
      </div>
      <div className="reports-scope">
        <p>점검한 날짜와 제출한 날짜가 다르면 제출일 기준으로 포함됩니다. 이상사항의 상태는 선택한 기간 말일이 아닌 파일 생성 시점 기준입니다.</p>
        <p>작성 중이거나 취소된 기록은 제외합니다. 사진은 개수만 포함하며, 사진 파일·상세 답변·전체 변경 이력·차량번호는 포함하지 않습니다.</p>
        <p>이 보고서는 제출·접수 활동을 보여 줍니다. 미제출 이용객이나 실제 입실 여부, 객실 준비 완료를 확인하는 자료는 아닙니다. 대상 기록이 없어도 각 시트에 0건으로 표시된 파일을 받을 수 있습니다.</p>
      </div>
    </section>
  );
}
