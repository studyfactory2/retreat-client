import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiRequestError } from '../../../core/api/api-error'
import { useAdminSession } from '../../../core/session/use-admin-session'

type FieldErrors = { loginId?: string; password?: string }

function loginErrorMessage(error: unknown): string {
  if (error instanceof ApiRequestError) {
    if (error.status === 401) return '아이디 또는 비밀번호를 확인해 주세요.'
    if (error.status === 403)
      return '관리자 계정으로 로그인할 수 없습니다. 계정 정보를 확인해 주세요.'
    if (error.status === 429)
      return '로그인 시도가 많습니다. 잠시 후 다시 시도해 주세요.'
    if (error.code === 'REQUEST_TIMEOUT')
      return '서버 응답이 지연되고 있습니다. 잠시 후 다시 시도해 주세요.'
    if (error.code === 'NETWORK_ERROR')
      return '서버에 연결할 수 없습니다. 인터넷 연결을 확인한 뒤 다시 시도해 주세요.'
    if (error.status === 400) return '입력한 아이디와 비밀번호를 확인해 주세요.'
  }
  return '로그인하지 못했습니다. 잠시 후 다시 시도해 주세요.'
}

export function useAdminLogin() {
  const { signIn } = useAdminSession()
  const mounted = useRef(true)
  const submitting = useRef(false)
  const [loginId, setLoginId] = useState('')
  const [password, setPassword] = useState('')
  const [autoLogin, setAutoLogin] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [busy, setBusy] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState<string | null>(null)
  const loginIdInput = useRef<HTMLInputElement>(null)
  const passwordInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (submitting.current) return

    const normalizedLoginId = loginId.trim()
    const nextErrors: FieldErrors = {}
    if (!normalizedLoginId) nextErrors.loginId = '아이디를 입력해 주세요.'
    else if ([...normalizedLoginId].length > 80)
      nextErrors.loginId = '아이디는 80자 이하로 입력해 주세요.'
    if (!password) nextErrors.password = '비밀번호를 입력해 주세요.'
    else if (new TextEncoder().encode(password).length > 72)
      nextErrors.password = '비밀번호가 너무 깁니다. 입력한 내용을 확인해 주세요.'
    setFieldErrors(nextErrors)
    setError(null)
    if (nextErrors.loginId || nextErrors.password) {
      if (nextErrors.loginId) loginIdInput.current?.focus()
      else passwordInput.current?.focus()
      return
    }

    submitting.current = true
    setBusy(true)
    try {
      await signIn({ loginId: normalizedLoginId, password, autoLogin })
    } catch (failure) {
      if (
        mounted.current &&
        !(failure instanceof Error && failure.name === 'AbortError')
      ) {
        setError(loginErrorMessage(failure))
      }
    } finally {
      submitting.current = false
      if (mounted.current) setBusy(false)
    }
  }

  return {
    loginId,
    setLoginId,
    loginIdInput,
    password,
    setPassword,
    passwordInput,
    autoLogin,
    setAutoLogin,
    showPassword,
    setShowPassword,
    busy,
    fieldErrors,
    error,
    submit,
  }
}
