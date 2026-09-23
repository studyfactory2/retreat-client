import { apiRequest } from '../../core/api/api-client'
import { ApiRequestError } from '../../core/api/api-error'

export type HealthResponse = { status: 'ok'; service: 'retreat-api' }

export async function fetchHealth(
  signal?: AbortSignal,
): Promise<HealthResponse> {
  const value = await apiRequest<unknown>('/health', { signal })
  if (
    typeof value !== 'object' ||
    value === null ||
    !('status' in value) ||
    value.status !== 'ok' ||
    !('service' in value) ||
    value.service !== 'retreat-api'
  ) {
    throw new ApiRequestError(
      '휴양소 서버의 응답이 아닙니다.',
      200,
      'INVALID_HEALTH_RESPONSE',
    )
  }
  return { status: 'ok', service: 'retreat-api' }
}
