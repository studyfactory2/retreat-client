import { AdminMenuIcon } from '../../layout/components/AdminMenuIcon';

export function ReportContents() {
  return (
    <section
      className="reports-contents"
      aria-labelledby="report-contents-heading"
    >
      <div className="reports-contents__heading">
        <h2 id="report-contents-heading">포함되는 기록</h2>
        <span>3개 시트</span>
      </div>
      <ol className="reports-sheets" role="list">
        <li>
          <span className="reports-sheets__icon" aria-hidden="true">
            <AdminMenuIcon name="submissions" />
          </span>
          <div className="reports-sheets__label">
            <h3>입퇴실 제출</h3>
            <p className="reports-sheets__basis">제출일 기준</p>
          </div>
          <p className="reports-sheets__description">
            제출 완료 기록 · 작성자 · 확인·이상 항목 수 · 사진 수
          </p>
        </li>
        <li>
          <span className="reports-sheets__icon" aria-hidden="true">
            <AdminMenuIcon name="maintenance" />
          </span>
          <div className="reports-sheets__label">
            <h3>정비 제출</h3>
            <p className="reports-sheets__basis">제출일 기준</p>
          </div>
          <p className="reports-sheets__description">
            제출 완료 기록 · 담당자 · 시작·제출 시각 · 항목·사진 수
          </p>
        </li>
        <li>
          <span className="reports-sheets__icon" aria-hidden="true">
            <AdminMenuIcon name="issues" />
          </span>
          <div className="reports-sheets__label">
            <h3>이상사항</h3>
            <p className="reports-sheets__basis">접수일 기준</p>
          </div>
          <p className="reports-sheets__description">
            제목 · 분류 · 긴급 여부 · 현재 처리 상태
          </p>
        </li>
      </ol>
      <p className="reports-contents__basis">
        사진은 개수만 포함합니다. 이상사항 상태는 기간 말일이 아닌
        다운로드 시점 기준입니다.
      </p>
      <details className="reports-scope">
        <summary>포함 범위와 다운로드 제한</summary>
        <ul>
          <li>
            점검일과 제출일이 다르면 제출일로 조회합니다. 비활성 휴양소의
            기록도 선택하여 받을 수 있습니다.
          </li>
          <li>
            작성 중이거나 취소된 기록은 제외합니다. 사진은 개수만 포함하며, 사진
            파일·상세 답변·전체 변경 이력·차량번호는 포함하지 않습니다.
          </li>
          <li>
            제출·접수 활동을 보여 주는 보고서입니다. 미제출 이용객, 실제 입실
            여부, 객실 준비 완료를 확인하는 자료는 아닙니다.
          </li>
          <li>
            3개 시트 합계 최대 5,000건, 파일 최대 16 MiB입니다. 초과하면
            기간이나 휴양소 범위를 줄여 주세요.
          </li>
          <li>
            대상 기록이 없어도 각 시트에 0건으로 표시된 파일을 받을 수 있습니다.
          </li>
        </ul>
      </details>
    </section>
  );
}
