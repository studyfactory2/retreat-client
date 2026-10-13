import { InstallApp } from '../../shared/pwa/InstallApp';
import { APP_BRAND } from '../../core/config/brand';
import { RetreatScene } from './components/RetreatScene';
import './entry.css';

const steps = [
  {
    title: '링크 또는 QR로 시작',
    description: '전달받은 개인 이용 링크를 열거나, 현장에 비치된 이용객 QR을 스캔해 주세요.',
  },
  {
    title: '머무를 공간 알아보기',
    description: '휴양소 이용 안내를 읽고, 편안한 머무름에 필요한 내용을 확인해 주세요.',
  },
  {
    title: '입실부터 퇴실까지',
    description: '입실·퇴실 시 화면의 안내에 따라 체크리스트를 작성하고 제출해 주세요.',
  },
];

const questions = [
  {
    title: '개인 이용 링크가 없어요.',
    answer: '이용 안내를 전달한 담당자에게 개인 이용 링크를 요청해 주세요. 휴양소에 도착하셨다면 현장에 비치된 이용객 QR로 안내를 열 수 있습니다.',
  },
  {
    title: '작성하던 체크리스트를 이어서 쓰고 싶어요.',
    answer: '작성 중 저장해 둔 개인 작성 링크 전체를 다시 열어 주세요. 링크를 찾기 어렵거나 열리지 않으면 관리자에게 문의해 주세요.',
  },
  {
    title: 'QR이나 링크가 열리지 않아요.',
    answer: '현장의 QR을 다시 스캔하거나 전달받은 링크 전체를 열어 주세요. 계속 열리지 않으면 관리자에게 이용 가능 여부를 확인해 주세요.',
  },
];

export function EntryScreen() {
  return (
    <div className="entry-screen">
      <section className="entry-hero" aria-labelledby="entry-title">
        <div className="entry-hero__copy">
          <p className="entry-eyebrow">{APP_BRAND.appName} 이용 안내</p>
          <h1 id="entry-title">편안한 쉼,<br />가벼운 시작.</h1>
          <p className="entry-hero__description">
            머무는 동안 필요한 안내를 한곳에서.<br />
            개인 이용 링크 또는 현장 QR로<br className="entry-hero__mobile-break" /> 편안한 휴양을 시작하세요.
          </p>
          <div className="entry-hero__actions">
            <a className="entry-primary-link" href="#how-to-use">
              이용 방법 보기 <span aria-hidden="true">↓</span>
            </a>
            <a className="entry-help-link" href="#entry-help">도움이 필요하신가요?</a>
          </div>
          <p className="entry-hero__note">이용객은 별도의 회원가입 없이 이용할 수 있어요.</p>
        </div>
        <div className="entry-hero__scene">
          <RetreatScene />
        </div>
      </section>

      <section className="entry-guide" id="how-to-use" tabIndex={-1} aria-labelledby="entry-guide-title">
        <div className="entry-section-heading">
          <p className="entry-eyebrow">이용 방법</p>
          <h2 id="entry-guide-title">처음 오셨나요?<br />이렇게 시작해 주세요.</h2>
        </div>
        <ol className="entry-steps">
          {steps.map((step, index) => (
            <li key={step.title}>
              <span className="entry-steps__number" aria-hidden="true">0{index + 1}</span>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="entry-help" id="entry-help" tabIndex={-1} aria-labelledby="entry-help-title">
        <div className="entry-section-heading">
          <p className="entry-eyebrow">자주 묻는 질문</p>
          <h2 id="entry-help-title">시작이 어려울 때</h2>
          <p className="entry-section-description">궁금한 내용을 먼저 확인해 보세요.</p>
        </div>
        <div className="entry-questions">
          {questions.map((question) => (
            <details className="entry-question" key={question.title}>
              <summary>{question.title}<span aria-hidden="true">+</span></summary>
              <p>{question.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <InstallApp />

      <aside className="entry-staff" aria-labelledby="entry-staff-title">
        <div>
          <h2 id="entry-staff-title">정비 직원이신가요?</h2>
          <p>현장의 <strong>직원용 QR</strong>을 스캔해 정비 안내와 체크리스트를 확인해 주세요.</p>
        </div>
        <span className="entry-staff__label">직원용 QR로 시작</span>
      </aside>
    </div>
  );
}
