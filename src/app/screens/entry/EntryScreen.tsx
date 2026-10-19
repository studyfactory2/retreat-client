import { InstallApp } from '../../shared/pwa/InstallApp';
import { RetreatScene } from './components/RetreatScene';
import { EntryIcon } from './components/EntryIcon';
import './entry.css';

const steps = [
  {
    title: '링크 또는 QR 열기',
    description: '개인 링크나 현장의 이용객 QR로 시작하세요.',
    icon: 'scan',
  },
  {
    title: '이용 안내 확인',
    description: '시설 이용 방법을 확인하세요.',
    icon: 'book',
  },
  {
    title: '체크리스트 제출',
    description: '입실·퇴실 시 시설 상태를 확인해 주세요.',
    icon: 'checklist',
  },
] as const;

const questions = [
  {
    title: '개인 이용 링크가 없어요.',
    answer: '담당자에게 링크를 요청하거나 현장의 이용객 QR을 스캔해 주세요.',
  },
  {
    title: '이어서 작성하려면 어떻게 하나요?',
    answer: '저장한 개인 작성 링크 전체를 다시 열어 주세요. 링크가 없으면 관리자에게 문의해 주세요.',
  },
  {
    title: 'QR이나 링크가 열리지 않아요.',
    answer: '링크 전체를 열거나 QR을 다시 스캔해 주세요. 계속 열리지 않으면 관리자에게 문의해 주세요.',
  },
];

export function EntryScreen() {
  return (
    <div className="entry-screen">
      <section className="entry-hero" aria-labelledby="entry-title">
        <div className="entry-hero__copy">
          <h1 id="entry-title">편안한 쉼,<br /><span>가벼운 시작.</span></h1>
          <p className="entry-hero__description">
            이용 안내부터 입실·퇴실 체크까지, 한곳에서.
          </p>
          <div className="entry-hero__actions">
            <a className="entry-primary-link" href="#how-to-use">
              이용 방법 <EntryIcon name="down" />
            </a>
            <a className="entry-help-link" href="#entry-help">도움말 <EntryIcon name="up-right" /></a>
          </div>
        </div>
        <div className="entry-hero__scene">
          <RetreatScene />
        </div>
      </section>

      <section className="entry-guide" id="how-to-use" tabIndex={-1} aria-labelledby="entry-guide-title">
        <div className="entry-section-heading">
          <h2 id="entry-guide-title">이용 방법</h2>
        </div>
        <ol className="entry-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="entry-steps__icon"><EntryIcon name={step.icon} /></span>
              <span className="entry-steps__number" aria-hidden="true">0{index + 1}</span>
              <div className="entry-steps__copy">
                <h3>{step.title}</h3>
                <p>{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="entry-help" id="entry-help" tabIndex={-1} aria-labelledby="entry-help-title">
        <div className="entry-section-heading">
          <h2 id="entry-help-title">도움말</h2>
        </div>
        <div className="entry-questions">
          {questions.map((question) => (
            <details className="entry-question" key={question.title}>
              <summary>{question.title}<EntryIcon name="plus" /></summary>
              <p>{question.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <InstallApp compact />

      <aside className="entry-staff" aria-label="정비 직원 안내">
        <EntryIcon name="wrench" />
        <p><strong>정비 직원이신가요?</strong> 현장의 직원용 QR로 시작하세요.</p>
      </aside>
    </div>
  );
}
