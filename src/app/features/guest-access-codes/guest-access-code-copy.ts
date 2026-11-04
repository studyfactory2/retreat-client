/** Keep the user gesture on Safari while waiting for fresh authorization. */
export function prepareGuestCodeCopy() {
  let cancelled = false;
  if (navigator.clipboard?.write && typeof ClipboardItem !== 'undefined') {
    let resolve!: (value: Blob) => void;
    let reject!: (reason: Error) => void;
    const text = new Promise<Blob>((accept, decline) => {
      resolve = accept;
      reject = decline;
    });
    // Cancellation may happen before the browser consumes the promised item.
    void text.catch(() => undefined);
    try {
      const completion = navigator.clipboard
        .write([new ClipboardItem({ 'text/plain': text })])
        .then(
          () => true,
          () => false,
        );
      return {
        async write(code: string) {
          if (cancelled) return false;
          resolve(new Blob([code], { type: 'text/plain' }));
          return await completion;
        },
        cancel() {
          cancelled = true;
          reject(new Error('Copy cancelled'));
        },
      };
    } catch {
      reject(new Error('Clipboard unavailable'));
    }
  }
  return {
    async write(code: string) {
      if (cancelled || !navigator.clipboard?.writeText) return false;
      try {
        await navigator.clipboard.writeText(code);
        return true;
      } catch {
        return false;
      }
    },
    cancel() {
      cancelled = true;
    },
  };
}
