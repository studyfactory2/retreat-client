import { useEffect, useRef, useState } from 'react'
import { appConfig } from '../../core/config/environment'
import { fetchHealth } from '../../features/health/health-api'
import { Button } from '../../shared/ui/Button/Button'
import { PageState } from '../../shared/ui/PageState/PageState'

type ConnectionState = {
  status: 'idle' | 'checking' | 'success' | 'error'
  message: string
}

export default function ConnectionScreen() {
  const active = useRef<AbortController | null>(null)
  const [state, setState] = useState<ConnectionState>({
    status: 'idle',
    message: '버튼을 눌러 서버 연결을 확인하세요.',
  })

  useEffect(
    () => () => {
      active.current?.abort()
    },
    [],
  )

  async function checkConnection() {
    active.current?.abort()
    const controller = new AbortController()
    active.current = controller
    setState({ status: 'checking', message: '서버 응답을 기다리고 있습니다.' })
    try {
      await fetchHealth(controller.signal)
      if (!controller.signal.aborted)
        setState({
          status: 'success',
          message: 'retreat-api 연결을 확인했습니다.',
        })
    } catch (error) {
      if (!controller.signal.aborted)
        setState({
          status: 'error',
          message:
            error instanceof Error
              ? error.message
              : '연결을 확인하지 못했습니다.',
        })
    }
  }

  return (
    <PageState
      title="개발용 연결 확인"
      description="이 화면은 개발 모드에서만 제공됩니다. 연결 확인은 데이터베이스나 사진 저장소의 정상 작동을 보장하지 않습니다."
    >
      <p>
        <code>{appConfig.apiBaseUrl}</code>
      </p>
      <p role="status" aria-live="polite">
        {state.message}
      </p>
      <Button
        loading={state.status === 'checking'}
        onClick={() => {
          void checkConnection()
        }}
      >
        연결 확인
      </Button>
    </PageState>
  )
}
