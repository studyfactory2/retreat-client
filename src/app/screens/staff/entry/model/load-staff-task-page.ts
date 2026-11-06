import { ApiRequestError } from '../../../../core/api/api-error';
import { getStaffCleaningTasks } from '../../../../features/cleaning-tasks/cleaning-tasks-api';

const syncIntervalMs = 60_000;

// Reconciliation is property-wide. Only its timing is shared across visits;
// each read still sends the current QR credential to the server.
const syncWindows = new Map<string, { until: number; deferred: boolean }>();

export async function loadStaffTaskPage(
  token: string,
  propertyId: string,
  page: number,
  completed: boolean,
  signal: AbortSignal,
) {
  // Let a discarded effect abort before dispatching a reconciliation.
  await Promise.resolve();
  signal.throwIfAborted();

  const now = Date.now();
  for (const [id, window] of syncWindows) {
    if (window.until <= now) syncWindows.delete(id);
  }
  let window = syncWindows.get(propertyId);

  if (!completed && page === 1 && !window) {
    window = { until: now + syncIntervalMs, deferred: true };
    syncWindows.set(propertyId, window);
    try {
      const list = await getStaffCleaningTasks(token, true, signal, page);
      window.deferred = false;
      return { list, syncDeferred: false };
    } catch (error) {
      signal.throwIfAborted();
      if (!(error instanceof ApiRequestError) || error.status !== 429) {
        syncWindows.delete(propertyId);
        throw error;
      }
      window.until = Date.now() + syncIntervalMs;
    }
  }

  const list = await getStaffCleaningTasks(
    token,
    false,
    signal,
    page,
    completed,
  );
  return { list, syncDeferred: !completed && window?.deferred === true };
}
