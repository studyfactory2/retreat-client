import type { AdminUser } from '../admin-auth/admin-auth.types';

export type AdminAccount = AdminUser & {
  phone: string | null;
  company: string | null;
  department: string | null;
  updatedAt: string;
};
export type ProfileValues = {
  name: string;
  phone: string;
  company: string;
  department: string;
};
export type PasswordValues = {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
};
export type AccountFieldErrors<T> = Partial<Record<keyof T, string>>;
