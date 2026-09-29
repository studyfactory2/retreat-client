import { appRoutes } from '../../../../core/router/routes';
import type { AdminMenuIconName } from '../components/AdminMenuIcon';
interface AdminMenuEntry {
  to: string;
  label: string;
  mobileLabel: string;
  icon: AdminMenuIconName;
  description?: string;
}
export const adminPrimaryMenu: AdminMenuEntry[] = [
  {
    to: appRoutes.admin,
    label: '운영 현황',
    mobileLabel: '운영',
    icon: 'overview',
  },
  {
    to: appRoutes.adminCalendar,
    label: '이용 일정',
    mobileLabel: '일정',
    icon: 'calendar',
  },
  {
    to: appRoutes.adminMaintenance,
    label: '청소·정비',
    mobileLabel: '정비',
    icon: 'maintenance',
  },
  {
    to: appRoutes.adminIssues,
    label: '이상사항',
    mobileLabel: '이상사항',
    icon: 'issues',
  },
];
export const adminSecondaryMenu: AdminMenuEntry[] = [
  {
    to: appRoutes.adminSubmissions,
    label: '제출 기록',
    mobileLabel: '제출 기록',
    icon: 'submissions',
    description: '입·퇴실과 정비 체크리스트, 사진, 저장 이력을 확인합니다.',
  },
  {
    to: appRoutes.adminProperties,
    label: '휴양소 관리',
    mobileLabel: '휴양소 관리',
    icon: 'properties',
    description: '휴양소를 등록하고 운영 정보를 관리합니다.',
  },
];
