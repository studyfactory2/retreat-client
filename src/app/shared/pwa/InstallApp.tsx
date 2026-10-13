import { APP_BRAND } from '../../core/config/brand';
import { usePwa } from '../../core/pwa/pwa-context';
import { Button } from '../ui/Button/Button';
import './pwa.css';

export function InstallApp({ compact = false }: { compact?: boolean }) {
  const { canInstall, installed, installing, installNotice, install } = usePwa();
  const content = (
    <>
      <div className="pwa-install__layout">
        <div className="pwa-install__intro">
          <div className="pwa-install__identity">
            <img src="/icons/app-icon-192.png" width="48" height="48" alt="" />
            <p>
              {APP_BRAND.appName}
              <span>앱으로 이용하기</span>
            </p>
          </div>
          <h2>
            {installed ? '앱 설치가 확인되었어요' : compact ? (
              '홈 화면에서 더 가깝게'
            ) : (
              <>휴양소 안내를,<br />홈 화면에서 바로.</>
            )}
          </h2>
          <p className="pwa-install__description">
            {installed
              ? '이제 홈 화면의 앱 아이콘으로 간편하게 열어 보세요.'
              : '홈 화면에 추가하고, 필요할 때 간편하게 열어 보세요.'}
          </p>
        </div>
        <div className="pwa-install__actions">
          {installed ? (
            <div className="pwa-install__complete">
              <span className="pwa-install__check" aria-hidden="true">✓</span>
              <h3>설정이 완료되었어요</h3>
              <p>이용객과 직원은 전달받은 링크 또는 현장 QR로 안내를 열어 주세요.</p>
            </div>
          ) : (
            <>
              <h3>내 기기에 설치하기</h3>
              {(canInstall || installing) ? (
                <Button
                  className="pwa-install__button"
                  loading={installing}
                  onClick={() => { void install(); }}
                >
                  앱 설치하기
                  {!installing && (
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M12 3v12m-4-4 4 4 4-4M5 16v4h14v-4" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  )}
                </Button>
              ) : (
                <p className="pwa-install__hint">사용 중인 기기에 맞는 설치 방법을 확인해 주세요.</p>
              )}
              {installNotice && (
                <p className="pwa-install__notice" role="status">{installNotice}</p>
              )}
              <details className="pwa-install__instructions">
                <summary>
                  기기별 설치 방법
                  <span className="pwa-install__chevron" aria-hidden="true" />
                </summary>
                <div className="pwa-install__steps">
                  <div>
                    <h4>iPhone · iPad</h4>
                    <p>Safari에서 이 사이트를 열고 공유 메뉴의 <strong>홈 화면에 추가</strong>를 선택해 주세요. <strong>웹 앱으로 열기</strong>가 표시되면 켠 뒤 추가해 주세요.</p>
                  </div>
                  <div>
                    <h4>Android · 컴퓨터</h4>
                    <p>Chrome 등 지원되는 브라우저에서 메뉴의 <strong>앱 설치</strong> 또는 <strong>홈 화면에 추가</strong>를 선택해 주세요. 메뉴 이름과 설치 지원 여부는 브라우저에 따라 달라요.</p>
                  </div>
                  <p>메뉴가 보이지 않으면 Safari나 Chrome에서 직접 열어 주세요. 설치하지 않아도 웹으로 이용할 수 있어요.</p>
                </div>
              </details>
            </>
          )}
        </div>
      </div>
      <div className="pwa-install__footnote">
        <p>앱은 홈 화면에서 시작해요. 개인 이용 링크는 따로 보관해 주세요.</p>
        <p>저장·제출과 사진 업로드에는 인터넷 연결이 필요해요.</p>
      </div>
    </>
  );
  return compact ? (
    <details className="pwa-install pwa-install--compact" id="install-app">
      <summary className="pwa-install__toggle">
        앱 설치 안내
        <span className="pwa-install__chevron" aria-hidden="true" />
      </summary>
      <div className="pwa-install__body">{content}</div>
    </details>
  ) : (
    <section className="pwa-install" id="install-app" aria-label="앱으로 이용하기">
      {content}
    </section>
  );
}
