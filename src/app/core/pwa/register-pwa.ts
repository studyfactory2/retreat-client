declare const __APP_BUILD_ID__: string;

const VERSION_TIMEOUT = 2500;

export function readWorkerBuild(worker: ServiceWorker): Promise<string | null> {
  return new Promise((resolve) => {
    const channel = new MessageChannel();
    const finish = (value: string | null) => {
      window.clearTimeout(timeout);
      channel.port1.close();
      channel.port2.close();
      resolve(value);
    };
    const timeout = window.setTimeout(() => finish(null), VERSION_TIMEOUT);
    channel.port1.onmessage = (event: MessageEvent<unknown>) => {
      const value = event.data;
      finish(
        typeof value === 'object' && value !== null &&
        'type' in value && value.type === 'BUILD_ID' &&
        'buildId' in value && typeof value.buildId === 'string'
          ? value.buildId : null,
      );
    };
    try {
      worker.postMessage({ type: 'GET_BUILD_ID' }, [channel.port2]);
    } catch {
      finish(null);
    }
  });
}

/** Observe new releases without activating a worker or reloading any tab. */
export function watchPwaUpdates(onUpdate: (buildId: string | null) => void): () => void {
  if (!import.meta.env.PROD || !window.isSecureContext || !('serviceWorker' in navigator))
    return () => {};
  let stopped = false;
  let registration: ServiceWorkerRegistration | null = null;
  let lastCheck = 0;
  let inspection = 0;
  const cleanups: Array<() => void> = [];
  const inspectWaiting = async () => {
    const sequence = ++inspection;
    const worker = registration?.waiting;
    if (!worker) return;
    const build = await readWorkerBuild(worker);
    if (stopped || sequence !== inspection || registration?.waiting !== worker) return;
    // A refreshed page may already run the release whose worker is still waiting
    // for other open tabs. Never turn that into an endless refresh prompt.
    onUpdate(build && build !== __APP_BUILD_ID__ ? build : null);
  };
  const watchInstalling = () => {
    const worker = registration?.installing;
    if (!worker) return;
    const changed = () => {
      if (worker.state === 'installed') void inspectWaiting();
    };
    worker.addEventListener('statechange', changed);
    cleanups.push(() => worker.removeEventListener('statechange', changed));
    changed();
  };
  const check = () => {
    if (!registration || document.visibilityState !== 'visible' || !navigator.onLine) return;
    void inspectWaiting();
    if (Date.now() - lastCheck < 60_000) return;
    lastCheck = Date.now();
    void registration.update().catch(() => {});
  };
  void navigator.serviceWorker.register('/service-worker.js', {
    scope: '/', updateViaCache: 'none',
  }).then((value) => {
    if (stopped) return;
    registration = value;
    registration.addEventListener('updatefound', watchInstalling);
    cleanups.push(() => value.removeEventListener('updatefound', watchInstalling));
    watchInstalling();
    void inspectWaiting();
    document.addEventListener('visibilitychange', check);
    window.addEventListener('online', check);
    cleanups.push(() => {
      document.removeEventListener('visibilitychange', check);
      window.removeEventListener('online', check);
    });
    check();
  }).catch(() => {
    // Installation support is progressive; registration failure leaves the web
    // application available. Do not log request details or private URLs.
  });
  return () => {
    stopped = true;
    cleanups.forEach((cleanup) => cleanup());
  };
}
