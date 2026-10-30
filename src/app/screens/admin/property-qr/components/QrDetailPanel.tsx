import { useEffect, useRef } from 'react';
import type {
  QrFlow,
  QrIssue,
  QrState,
} from '../../../../features/admin-property-qr/admin-property-qr.types';
import { Button } from '../../../../shared/ui/Button/Button';
import { formatQrTimestamp, qrStateLabel } from '../model/property-qr-model';
import { QrIssuedReceipt } from './QrIssuedReceipt';

export function QrDetailPanel({
  flow,
  state,
  issue,
  propertyName,
  disabled,
  opening,
  issuing,
  reviewRequired,
  onOpen,
  onClose,
  onIssue,
}: {
  flow: QrFlow;
  state: QrState;
  issue?: QrIssue;
  propertyName: string;
  disabled: boolean;
  opening: boolean;
  issuing: boolean;
  reviewRequired: boolean;
  onOpen: () => void;
  onClose: () => void;
  onIssue: () => void;
}) {
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (issue) heading.current?.focus();
  }, [issue]);
  return (
    <section
      id="property-qr-preview"
      className="property-qr-panel"
      role="tabpanel"
      aria-labelledby={`qr-${flow}-select`}
    >
      <div className="property-qr-panel__heading">
        <h2 id="property-qr-preview-title" ref={heading} tabIndex={-1}>
          {flow === 'GUEST' ? '입실 · 퇴실 · 이용 안내' : '청소 · 정비 점검'}
        </h2>
        <span
          className={`property-qr-card__badge${state.enabled ? ' property-qr-card__badge--active' : ''}`}
        >
          {qrStateLabel(state)}
        </span>
      </div>
      <div className="property-qr-panel__meta">
        {state.rotatedAt && (
          <p className="property-qr-panel__date">
            최근 발급{' '}
            <time dateTime={state.rotatedAt}>
              {formatQrTimestamp(state.rotatedAt)}
            </time>
          </p>
        )}
        {issue && (
          <Button
            className="admin-button-ghost property-qr-panel__close"
            disabled={disabled}
            onClick={onClose}
          >
            QR 닫기
          </Button>
        )}
      </div>
      {issue ? (
        <QrIssuedReceipt
          key={`${flow}:${issue.rotatedAt}`}
          issue={issue}
          propertyName={propertyName}
        />
      ) : (
        <div className="property-qr-panel__empty">
          <strong>
            {reviewRequired
              ? '최신 상태를 확인해 주세요'
              : opening
                ? 'QR을 불러오는 중'
                : issuing
                  ? 'QR을 발급하는 중'
                  : !state.issued
                    ? 'QR을 발급해 주세요'
                    : !state.enabled
                      ? '현재 접근이 중지되어 있습니다'
                      : state.canReopen
                        ? 'QR을 열어 공유하세요'
                        : '기존 QR 사용 중'}
          </strong>
          <p>
            {reviewRequired
              ? '새로고침으로 발급 결과를 확인해 주세요.'
              : opening || issuing
                ? '잠시만 기다려 주세요.'
                : !state.issued
                  ? '발급 후 링크 복사와 이미지 저장이 가능합니다.'
                  : !state.enabled
                    ? '휴양소를 다시 활성화한 뒤 확인해 주세요.'
                    : state.canReopen
                      ? '기존 QR을 바꾸지 않고 복사·저장할 수 있습니다.'
                      : '이전에 저장한 QR을 사용해 주세요. 이 QR은 다시 보기를 지원하지 않습니다.'}
          </p>
          {state.issued && state.canReopen && state.enabled && (
            <Button
              id={`qr-${flow}-open`}
              disabled={disabled}
              loading={opening}
              onClick={onOpen}
            >
              QR 열기
            </Button>
          )}
          {!state.issued && (
            <Button
              id={`qr-${flow}-review`}
              disabled={disabled}
              loading={issuing}
              onClick={onIssue}
            >
              QR 발급
            </Button>
          )}
        </div>
      )}
      {state.issued && (
        <details className="property-qr-manage">
          <summary>QR 교체</summary>
          <div>
            <p>교체하면 이전 QR과 인쇄물은 사용할 수 없습니다.</p>
            <Button
              id={`qr-${flow}-review`}
              className="admin-button-secondary"
              disabled={disabled}
              onClick={onIssue}
            >
              새 QR로 교체
            </Button>
          </div>
        </details>
      )}
    </section>
  );
}
