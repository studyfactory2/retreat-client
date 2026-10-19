import '../styles/import-steps.css';

export function ImportSteps({
  current,
  complete = false,
}: {
  current: 0 | 1 | 2;
  complete?: boolean;
}) {
  const labels = ['파일 업로드', '명단 검토', complete ? '등록 완료' : '등록 확인'];
  return (
    <ol className="import-steps" aria-label="엑셀 가져오기 진행 단계">
      {labels.map((label, index) => (
        <li
          key={index}
          className={`${index === current ? 'is-current' : ''}${index < current || complete ? ' is-complete' : ''}`}
          aria-current={index === current ? 'step' : undefined}
        >
          <span className="import-steps__number" aria-hidden="true">
            {index < current || complete ? '✓' : index + 1}
          </span>
          <span>{label}</span>
        </li>
      ))}
    </ol>
  );
}
