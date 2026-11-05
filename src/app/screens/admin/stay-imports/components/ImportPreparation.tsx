import '../styles/import-preparation.css';

export function ImportTemplateLinks() {
  return (
    <div className="import-preparation__downloads">
      <span>양식이 필요하신가요?</span>
      <div>
        <a
          href="/downloads/stay-roster-template.xls"
          download="휴양소_이용자명단_빈양식.xls"
          aria-label="빈 양식 다운로드"
        >
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M12 3v12m-4-4 4 4 4-4M5 17v3h14v-3" />
          </svg>
          빈 양식
        </a>
        <a
          href="/downloads/stay-roster-example.xls"
          download="휴양소_이용자명단_작성예시.xls"
          aria-label="작성 예시 다운로드"
        >
          작성 예시
        </a>
      </div>
    </div>
  );
}

export function ImportPreparation() {
  return (
    <details className="import-preparation">
      <summary>작성 도움말</summary>
      <div className="import-preparation__body">
        <dl>
          <div>
            <dt>D열 · 이동전화</dt>
            <dd>텍스트 형식으로 입력하여 앞자리 0을 유지하세요.</dd>
          </div>
          <div>
            <dt>E / F / G / H열</dt>
            <dd>
              회사 / 부서 / 이름 / 직급 순서입니다. 빈 제목 셀도 그대로 두세요.
            </dd>
          </div>
          <div>
            <dt>I열 · 시작일</dt>
            <dd>
              <time dateTime="2026-11-02T15:00:00+09:00">2026-11-02 15:00</time>
            </dd>
          </div>
          <div>
            <dt>J열 · 종료일</dt>
            <dd>
              <time dateTime="2026-11-04T11:00:00+09:00">2026-11-04 11:00</time>
            </dd>
          </div>
        </dl>
        <p>
          한국 시간 · 24시간제로 실제 이용 시간을 입력하세요. 작성 예시 파일은
          가상 정보입니다.
        </p>
        <p>
          시트 이름과 1행의 제목·열 순서를 유지하세요. 날짜만 입력한 행은 검토
          단계에서 시간을 추가해야 합니다.
        </p>
        <p>미리보기 주소를 보관하면 같은 주소에서 검토를 이어갈 수 있습니다.</p>
        <a
          href="/downloads/stay-import-guide.html"
          target="_blank"
          rel="noreferrer"
        >
          전체 작성 안내 <span>(새 창) ↗</span>
        </a>
      </div>
    </details>
  );
}
