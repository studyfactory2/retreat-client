import type { TaskPasswordController } from '../hooks/use-task-password';

export function taskPasswordRequirement(
  controller: TaskPasswordController,
): string | null {
  const { context, status, guestDeparted, passwordChanged } = controller;
  if (status === 'loading') return '도어락 상태를 확인하고 있어요.';
  if (status === 'error' || !context)
    return '도어락 상태를 다시 확인해 주세요.';
  if (!context.canComplete)
    return context.blockedReason ?? '관리자에게 도어락 설정을 확인해 주세요.';
  if (!guestDeparted) return '이전 이용객의 퇴실을 확인해 주세요.';
  if (context.requiresChange && !passwordChanged)
    return '현장에서 도어락을 변경한 뒤 체크해 주세요.';
  return null;
}
