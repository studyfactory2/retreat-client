import type {
  QrFlow,
  QrIssue,
  QrState,
} from '../../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../../shared/ui/Button/Button';
import {
  formatQrTimestamp,
  qrFlowLabels,
  qrStateLabel,
} from '../model/property-qr-model';
import { QrIssuedReceipt } from './QrIssuedReceipt';

export function QrFlowCard({
  flow,
  state,
  issue,
  propertyName,
  disabled,
  busy,
  reviewRequired,
  onIssue,
}: {
  flow: QrFlow;
  state: QrState;
  issue?: QrIssue;
  propertyName: string;
  disabled: boolean;
  busy: boolean;
  reviewRequired: boolean;
  onIssue: () => void;
}) {
  const label = qrFlowLabels[flow];
  return (
    <section className="property-qr-card" aria-labelledby={`qr-${flow}-title`}>
      <div className="property-qr-card__heading">
        <div>
          <p className="property-qr-card__eyebrow">
            {flow === 'GUEST' ? 'GUEST ACCESS' : 'STAFF ACCESS'}
          </p>
          <h2 id={`qr-${flow}-title`}>{label} QR</h2>
        </div>
        <span
          className={`property-qr-card__badge${state.enabled ? ' property-qr-card__badge--active' : ''}`}
        >
          {busy
            ? '발급 처리 중'
            : reviewRequired
              ? '상태 재확인 필요'
              : qrStateLabel(state)}
        </span>
      </div>
      <p className="property-qr-card__description">
        {flow === 'GUEST'
          ? '이용객에게 안내하는 휴양소 공용 QR입니다.'
          : '담당 직원에게 안내하는 정비용 QR입니다.'}
      </p>
      <dl className="property-qr-card__details">
        <div>
          <dt>최근 발급 시각 · 한국 시간</dt>
          <dd>
            {state.rotatedAt ? (
              <time dateTime={state.rotatedAt}>
                {formatQrTimestamp(state.rotatedAt)}
              </time>
            ) : (
              '발급 이력 없음'
            )}
          </dd>
        </div>
        <div>
          <dt>현재 주소</dt>
          <dd>
            {issue
              ? '이 화면에서 발급한 주소 보관 중'
              : state.issued
                ? '기존 주소는 다시 조회할 수 없음'
                : '발급 후 한 번만 제공'}
          </dd>
        </div>
      </dl>
      {issue ? (
        <QrIssuedReceipt
          key={issue.rotatedAt}
          issue={issue}
          propertyName={propertyName}
        />
      ) : (
        <div className="property-qr-card__empty">
          <strong>
            {reviewRequired
              ? '최신 발급 상태를 확인해 주세요'
              : busy
                ? '새 QR을 발급하고 있습니다'
                : state.issued
                  ? state.enabled
                    ? '보관한 QR을 확인해 주세요'
                    : '휴양소 비활성으로 접근 중지'
                  : '아직 발급된 QR이 없습니다'}
          </strong>
          <p>
            {reviewRequired
              ? '발급 결과나 변경된 상태를 확인한 뒤 QR을 보관하거나 다시 발급해 주세요.'
              : busy
                ? '처리가 끝날 때까지 이 화면을 유지해 주세요.'
                : state.issued
                  ? state.enabled
                    ? '주소나 인쇄물을 잃어버렸다면 새 QR로 교체해야 합니다. 교체 시 이전 QR은 사용할 수 없습니다.'
                    : '기존 QR은 유지되며 휴양소를 다시 활성화하면 접근도 다시 활성화됩니다.'
                  : '발급 직후 주소를 복사하거나 QR 이미지를 내려받아 보관할 수 있습니다.'}
          </p>
        </div>
      )}
      <div className="property-qr-card__footer">
        <Button
          id={`qr-${flow}-review`}
          disabled={disabled}
          loading={busy}
          onClick={onIssue}
        >
          {state.issued ? `${label} QR 교체 확인` : `${label} QR 발급 확인`}
        </Button>
        <p>발급과 교체는 해당 용도의 QR에만 적용됩니다.</p>
      </div>
    </section>
  );
}
