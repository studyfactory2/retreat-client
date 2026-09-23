export type AdminUser = {
  id: string
  name: string
  loginId: string
  role: 'ADMIN'
}

export type AdminLoginInput = {
  loginId: string
  password: string
  autoLogin?: boolean
}

export type AdminLoginResponse = {
  user: AdminUser
  token: string
  tokenType: 'Bearer'
  expiresIn: number
}
