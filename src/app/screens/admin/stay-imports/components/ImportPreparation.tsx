import '../styles/import-preparation.css';

export function ImportPreparation() {
  return (
    <section
      className="import-preparation"
      aria-labelledby="import-preparation-title"
    >
      <div className="import-preparation__heading">
        <div>
          <h2 id="import-preparation-title">명단 양식 준비</h2>
          <p>빈 양식에 이용객과 입·퇴실 일시를 입력해 주세요.</p>
        </div>
        <a
          href="/downloads/stay-import-guide.html"
          target="_blank"
          rel="noreferrer"
        >
          작성 안내 <span className="import-preparation__new-tab">(새 창)</span>{' '}
          ↗
        </a>
      </div>
      <div className="import-preparation__downloads">
        <a
          className="ui-button admin-button-secondary"
          href="/downloads/stay-roster-template.xls"
          download="휴양소_이용자명단_빈양식.xls"
        >
          빈 양식 다운로드
        </a>
        <a
          className="ui-button admin-button-secondary"
          href="/downloads/stay-roster-example.xls"
          download="휴양소_이용자명단_작성예시.xls"
        >
          작성 예시 다운로드
        </a>
        <span>.xls · 예시 파일은 가상 정보입니다.</span>
      </div>
      <details className="import-preparation__help">
        <summary>입력 방법과 날짜·시간 예시</summary>
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
          한국 시간 · 24시간제로 입력하세요. 위 시간은 예시이며, 실제 이용
          시간을 입력해야 합니다.
        </p>
        <p>
          시트 이름과 1행의 제목·열 순서를 유지하세요. 날짜만 입력한 행은 검토
          단계에서 시간을 추가해야 합니다.
        </p>
      </details>
    </section>
  );
}
