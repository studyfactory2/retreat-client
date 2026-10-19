import { useId, useLayoutEffect, useRef, useState } from 'react';
import type {
  AdminMaintenanceInput,
  AdminMaintenanceItem,
} from '../../../../features/admin-maintenance/admin-maintenance.types';
import { maintenanceStatuses } from '../model/maintenance-presentation';
import { MaintenanceRecordPanel } from './MaintenanceRecordPanel';

const startFormatter = new Intl.DateTimeFormat('en', {
  timeZone: 'Asia/Seoul', month: 'numeric', day: 'numeric',
  hour: '2-digit', minute: '2-digit', hourCycle: 'h23',
});

function shortStart(value: string) {
  const parts = startFormatter.formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? '';
  return `${part('month')}. ${part('day')}. ${part('hour')}:${part('minute')}`;
}

export function MaintenanceRows({ items, filters }: {
  items: AdminMaintenanceItem[];
  filters: AdminMaintenanceInput;
}) {
  const panelId = useId();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(false);
  const workspace = useRef<HTMLDivElement>(null);
  const lastFocused = useRef<HTMLElement | null>(null);
  const backButton = useRef<HTMLButtonElement>(null);
  const rowButtons = useRef(new Map<string, HTMLButtonElement>());
  const focusTarget = useRef<'panel' | 'list' | null>(null);
  const selected = items.find((item) => item.id === selectedId) ?? items[0];

  useLayoutEffect(() => {
    if (!focusTarget.current) return;
    const target = focusTarget.current;
    focusTarget.current = null;
    if (target === 'list' && selected) {
      rowButtons.current.get(selected.id)?.focus();
    } else if (backButton.current?.getClientRects().length) {
      // The back action is visible only when the panel replaces the mobile list.
      backButton.current.focus();
    }
  }, [panelOpen, selected]);

  useLayoutEffect(() => {
    const root = workspace.current;
    if (!root) return;
    const active = document.activeElement;
    if (active instanceof HTMLElement && root.contains(active)) lastFocused.current = active;
    const isSplit = () => getComputedStyle(root).getPropertyValue('--maintenance-split').trim() === '1';
    let previousSplit = isSplit();
    function rememberFocus(event: FocusEvent) {
      if (!(event.target instanceof HTMLElement) || event.target === document.body) return;
      lastFocused.current = root?.contains(event.target) ? event.target : null;
    }
    const observer = new ResizeObserver(() => {
      const split = isSplit();
      if (split === previousSplit) return;
      previousSplit = split;
      const previous = lastFocused.current;
      if (!previous || !root.contains(previous) || previous.getClientRects().length) return;
      // A breakpoint can hide a focused control without causing a React update.
      if (split && selected) {
        rowButtons.current.get(selected.id)?.focus();
      } else if (panelOpen) {
        backButton.current?.focus();
      } else if (previous.closest('.maintenance-record-panel')) {
        focusTarget.current = 'panel';
        setPanelOpen(true);
      }
    });
    document.addEventListener('focusin', rememberFocus);
    observer.observe(root);
    return () => {
      document.removeEventListener('focusin', rememberFocus);
      observer.disconnect();
    };
  }, [panelOpen, selected]);

  if (!selected) return null;

  function select(item: AdminMaintenanceItem) {
    focusTarget.current = 'panel';
    setSelectedId(item.id);
    setPanelOpen(true);
  }

  function showList() {
    focusTarget.current = 'list';
    setPanelOpen(false);
  }

  return (
    <div className="maintenance-record-workspace" data-panel-open={panelOpen} ref={workspace}>
      <ul className="maintenance-picker" aria-label="청소·정비 기록 선택">
        {items.map((item) => {
          const status = maintenanceStatuses[item.status];
          return (
            <li key={item.id}>
              <button
                type="button"
                className="maintenance-choice"
                data-record-id={item.id}
                aria-pressed={selected.id === item.id}
                aria-controls={panelId}
                ref={(element) => {
                  if (element) rowButtons.current.set(item.id, element);
                  else rowButtons.current.delete(item.id);
                }}
                onClick={() => select(item)}
              >
                <span className="maintenance-choice-property">
                  <strong>{item.property.name}</strong>
                  {!item.property.isActive && <span className="maintenance-inactive">비활성</span>}
                </span>
                <span className={`maintenance-status maintenance-status--${status.tone}`}>{status.label}</span>
                <span className="maintenance-choice-meta">
                  <span>{item.staff.name ?? '직원 확인 필요'}</span>
                  <span className="maintenance-choice-time">
                    <span>작성 시작</span>
                    {item.startedAt ? <time dateTime={item.startedAt}>{shortStart(item.startedAt)}</time> : <span>기록 없음</span>}
                  </span>
                </span>
                <svg className="maintenance-choice-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="m9 6 6 6-6 6" /></svg>
              </button>
            </li>
          );
        })}
      </ul>
      <MaintenanceRecordPanel
        key={selected.id}
        id={panelId}
        item={selected}
        filters={filters}
        backButton={backButton}
        onBack={showList}
      />
    </div>
  );
}
