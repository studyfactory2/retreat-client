import { Link } from 'react-router-dom'
import './entry.css'

const entries = [
  {
    number: '01',
    title: '관리자',
    english: 'MANAGER',
    to: '/admin/login',
    description: '휴양소 운영과 이용 기록을 관리하는 공간입니다.',
  },
  {
    number: '02',
    title: '이용객',
    english: 'GUEST',
    to: '/guest',
    description: '휴양소 이용 안내와 입실·퇴실 체크리스트를 확인합니다.',
  },
  {
    number: '03',
    title: '정비 직원',
    english: 'STAFF',
    to: '/staff',
    description: '휴양소 정비 항목을 확인하고 작업 내용을 기록합니다.',
  },
]

export function EntryScreen() {
  return (
    <div className="entry-screen">
      <section className="entry-screen__intro">
        <div>
          <p className="entry-screen__eyebrow">PEOPLE · SPACE · CARE</p>
          <h1>
            좋은 공간이
            <br />
            좋은 일상을 만듭니다.
          </h1>
        </div>
        <p className="entry-screen__description">
          머무는 사람도, 돌보는 사람도 편안하도록.
          <br />
          오복과 함께하는 휴양소 관리.
        </p>
      </section>

      <section
        className="entry-screen__entries"
        aria-labelledby="entry-heading"
      >
        <div className="entry-screen__section-heading">
          <h2 id="entry-heading">어떤 공간을 찾으시나요?</h2>
          <span>서비스 화면을 준비하고 있습니다.</span>
        </div>
        <div className="entry-screen__grid">
          {entries.map((entry) => (
            <Link className="entry-card" key={entry.to} to={entry.to}>
              <div className="entry-card__top">
                <span>
                  {entry.number} / {entry.english}
                </span>
                <span className="entry-card__arrow" aria-hidden="true">
                  ↗
                </span>
              </div>
              <h3>{entry.title}</h3>
              <p>{entry.description}</p>
              <span className="entry-card__status">화면 준비 중</span>
            </Link>
          ))}
        </div>
      </section>
      <p className="entry-screen__note">
        이용객은 개인 링크 또는 현장 QR로, 정비 직원은 직원용 현장 QR로 이용하게
        됩니다.
      </p>
    </div>
  )
}
