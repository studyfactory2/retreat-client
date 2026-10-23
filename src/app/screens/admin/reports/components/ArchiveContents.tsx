const contents = [
  [
    'XLSX',
    '기록.xlsx',
    '안내 · 일정 · 점검 · 답변 · 이상사항 · 이력 · 사진 목록',
  ],
  ['JPG', '사진 폴더', '휴양소별로 정리한 사진 · 같은 사진은 한 번만'],
  ['TXT', '다운로드안내.txt', '포함·제외 건수와 사진별 제외 사유'],
] as const;

export function ArchiveContents() {
  return (
    <section
      className="reports-contents reports-contents--archive"
      aria-labelledby="report-contents-heading"
    >
      <div className="reports-contents__heading">
        <h2 id="report-contents-heading">한 번에 보관하세요</h2>
        <span>ZIP 파일 1개</span>
      </div>
      <p className="reports-archive-intro">
        기록과 사진을 함께 받아 휴대폰이나 PC에 보관하세요.
      </p>
      <ol className="reports-package">
        {contents.map(([format, name, description]) => (
          <li key={format}>
            <span
              className={`reports-package__format reports-package__format--${format.toLowerCase()}`}
              aria-hidden="true"
            >
              {format}
            </span>
            <div>
              <h3>{name}</h3>
              <p>{description}</p>
            </div>
          </li>
        ))}
      </ol>
      <p className="reports-package__hint">
        ZIP을 풀고 엑셀의 <strong>사진 목록</strong>에서 파일 경로를 확인하세요.
      </p>
      <p className="reports-contents__basis">
        취소된 기록과 이전 버전의 보관된 사진도 포함합니다. 삭제되거나 없는
        파일은 사유를 남깁니다.
      </p>
      <details className="reports-scope">
        <summary>포함 범위와 다운로드 제한</summary>
        <ul>
          <li>
            일정은 선택 기간과 겹치는 일정, 점검은 최초 제출일, 이상사항은
            접수일 기준입니다. 보관된 휴양소도 선택할 수 있습니다.
          </li>
          <li>
            대상 기록의 모든 버전과 사진 연결을 포함합니다. 선택 기간 이후의
            변경도 포함하며, 사진을 올린 날짜로 거르지 않습니다.
          </li>
          <li>
            엑셀에는 같은 사진의 여러 연결이 표시될 수 있지만 파일은 사진 ID당
            한 번만 저장합니다. 사진은 앱에 저장된 JPG이며 촬영 원본 파일은
            아닙니다.
          </li>
          <li>
            최대 62일 · 사진 100장 · 사진 합계 100 MiB · ZIP 128 MiB입니다. 준비
            시간이 초과되거나 용량이 크면 기간이나 휴양소 범위를 줄여 주세요.
          </li>
          <li>
            엑셀은 기록 5,000건 · 버전/이벤트 10,000건 · 상세 50,000행 · 텍스트
            32 MiB · 파일 16 MiB까지 포함합니다. 제한 초과 시 일부만 잘라
            저장하지 않습니다.
          </li>
          <li>
            사진이 없어도 엑셀과 안내 파일을 받습니다. 제외된 사진은 다운로드
            결과와 안내 파일에 표시하며, 접속 오류가 나면 다시 요청해야 합니다.
          </li>
          <li>
            작성 중 기록, 차량번호, 로그인·QR 정보는 제외합니다. 자동 백업이나
            앱으로 다시 불러오는 복원 기능은 아닙니다.
          </li>
        </ul>
      </details>
    </section>
  );
}
