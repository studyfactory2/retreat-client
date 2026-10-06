import type { Location, NavigationType } from 'react-router-dom';

function historyIndex(state: unknown): number | null {
  if (typeof state !== 'object' || state === null || !('idx' in state))
    return null;
  return typeof state.idx === 'number' &&
    Number.isSafeInteger(state.idx) &&
    state.idx >= 0
    ? state.idx
    : null;
}
function historyKey(state: unknown): string {
  return typeof state === 'object' &&
    state !== null &&
    'key' in state &&
    typeof state.key === 'string'
    ? state.key
    : 'default';
}

// Only trusted numeric positions and random router keys are retained. URLs stay
// in memory; credentials are never added to history.state or used as map keys.
export class FragmentHistory {
  readonly routerWindow: Window;
  private readonly browser: Window;
  private readonly entries = new Map<string, number>();
  private lastIndex: number | null;
  private lastKey: string;
  private lastUrl: string;
  private lastLength: number;
  private endIndex: number;

  constructor(browser: Window) {
    this.browser = browser;
    this.lastIndex = historyIndex(browser.history.state);
    this.lastKey = historyKey(browser.history.state);
    this.lastUrl = this.url();
    this.lastLength = browser.history.length;
    this.endIndex = this.lastIndex ?? 0;
    if (this.lastIndex !== null) this.entries.set(this.lastKey, this.lastIndex);
    // BrowserRouter supports a supplied Window. Observe its writes before a
    // following native hash event, rather than waiting for React to commit.
    // The real window/history objects are never patched.
    const routerHistory = new Proxy(browser.history, {
      get: (target, property) => {
        if (property === 'pushState' || property === 'replaceState')
          return (...args: Parameters<History['pushState']>) => {
            target[property](...args);
            this.sync(
              property === 'pushState'
                ? ('PUSH' as NavigationType)
                : ('REPLACE' as NavigationType),
            );
          };
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
    this.routerWindow = new Proxy(browser, {
      get: (target, property) => {
        if (property === 'history') return routerHistory;
        const value: unknown = Reflect.get(target, property, target);
        return typeof value === 'function' ? value.bind(target) : value;
      },
    });
  }

  get index(): number | null {
    const state: unknown = this.browser.history.state;
    const index = historyIndex(state);
    return index !== null && this.entries.get(historyKey(state)) === index
      ? index
      : null;
  }

  matches(location: Location): boolean {
    return this.url() === location.pathname + location.search + location.hash;
  }

  canRestore(index: number, key: string): boolean {
    return (
      this.index !== null &&
      this.entries.get(key) === index &&
      index <= this.endIndex
    );
  }

  sync(action: NavigationType): void {
    const state: unknown = this.browser.history.state;
    const rawIndex = historyIndex(state);
    const key = historyKey(state);
    if (
      this.index !== null &&
      key === this.lastKey &&
      this.url() === this.lastUrl
    ) {
      this.record();
      return;
    }
    if (action === 'PUSH' || action === 'REPLACE') {
      const continuous =
        this.lastIndex !== null &&
        rawIndex === this.lastIndex + (action === 'PUSH' ? 1 : 0);
      if (!continuous) this.entries.clear();
      const index = rawIndex ?? 0;
      if (rawIndex === null) this.stamp(index, key);
      this.remember(index, key, action === 'PUSH' || !continuous);
    }
    this.record();
  }

  private url(): string {
    const { pathname, search, hash } = this.browser.location;
    return pathname + search + hash;
  }

  private stamp(index: number, key: string): void {
    const state: unknown = this.browser.history.state;
    this.browser.history.replaceState(
      {
        ...(typeof state === 'object' && state !== null ? state : {}),
        idx: index,
        key,
      },
      '',
    );
  }

  private remember(index: number, key: string, truncate: boolean): void {
    for (const [knownKey, knownIndex] of this.entries)
      if (knownIndex === index || (truncate && knownIndex > index))
        this.entries.delete(knownKey);
    this.entries.set(key, index);
    this.endIndex = truncate ? index : Math.max(this.endIndex, index);
  }

  private record(): void {
    this.lastIndex = this.index;
    this.lastKey = historyKey(this.browser.history.state);
    this.lastUrl = this.url();
    this.lastLength = this.browser.history.length;
  }

  private readonly observePop = () => {
    const key = historyKey(this.browser.history.state);
    const inherited = key === this.lastKey && this.url() !== this.lastUrl;
    if (this.index === null || inherited) {
      // Exactly one additional history slot proves a new native fragment push.
      // Older/unseen entries and interleaved navigations have unknown direction;
      // never infer a history.go delta for them.
      if (
        this.lastIndex !== null &&
        this.lastIndex === this.endIndex &&
        this.browser.history.length === this.lastLength + 1
      ) {
        const index = this.lastIndex + 1;
        const newKey = this.browser.crypto.randomUUID();
        this.stamp(index, newKey);
        this.remember(index, newKey, true);
      } else this.entries.clear();
    }
    this.record();
  };

  listen(): () => void {
    // Capture runs before BrowserRouter's normal popstate listener reads state.
    this.browser.addEventListener('popstate', this.observePop, true);
    return () =>
      this.browser.removeEventListener('popstate', this.observePop, true);
  }
}
