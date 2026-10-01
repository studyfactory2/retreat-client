import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AccessPendingScreen } from '../../screens/entry/AccessPendingScreen';
import { EntryScreen } from '../../screens/entry/EntryScreen';
import { NotFoundScreen } from '../../screens/entry/NotFoundScreen';
import { GuestEntryScreen } from '../../screens/guest/entry';
import { AppShell } from '../../shared/layout/AppShell/AppShell';
import { PageState } from '../../shared/ui/PageState/PageState';
import { appRoutes } from './routes';
import { AdminSessionLayout } from './AdminSessionLayout';
import { RequireAdmin } from './RequireAdmin';
import { AdminLoginScreen } from '../../screens/admin/login';
import { AdminLayout } from '../../screens/admin/layout';
import { AdminDashboardScreen } from '../../screens/admin/dashboard';
import { AdminMaintenanceScreen } from '../../screens/admin/maintenance';
import {
  AdminIssuesScreen,
  AdminIssueDetailScreen,
} from '../../screens/admin/issues';
import { AdminPropertyQrScreen } from '../../screens/admin/property-qr';
import { AdminPropertyGuideScreen } from '../../screens/admin/property-guide';
import { AdminIssueCategoriesScreen } from '../../screens/admin/issue-categories';
import {
  AdminPropertyChecklistsScreen,
  AdminChecklistEditorScreen,
} from '../../screens/admin/property-checklists';
import { AdminMoreScreen } from '../../screens/admin/more';
import { AdminReportsScreen } from '../../screens/admin/reports';
import { AdminCalendarScreen } from '../../screens/admin/calendar';
import {
  AdminStayImportUploadScreen,
  AdminStayImportReviewScreen,
} from '../../screens/admin/stay-imports';

import {
  AdminStayListScreen,
  AdminStayCreateScreen,
  AdminStayDetailScreen,
} from '../../screens/admin/stays';

import {
  AdminPropertiesScreen,
  AdminPropertyEditorScreen,
  AdminPropertyStaffScreen,
} from '../../screens/admin/properties';
import {
  AdminStaffScreen,
  AdminStaffEditorScreen,
} from '../../screens/admin/staff';

import {
  AdminSubmissionsScreen,
  AdminSubmissionDetailScreen,
} from '../../screens/admin/submissions';

const ConnectionScreen = import.meta.env.DEV
  ? lazy(() => import('../../screens/dev/ConnectionScreen'))
  : null;

export function AppRouter() {
  return (
    <Routes>
      <Route path={appRoutes.guest} element={<GuestEntryScreen kind="qr" />} />
      <Route path={appRoutes.guestStay} element={<GuestEntryScreen kind="stay" />} />
      <Route element={<AppShell />}>
        <Route path={appRoutes.home} element={<EntryScreen />} />
        <Route
          path={appRoutes.staff}
          element={
            <AccessPendingScreen
              title="정비 직원 안내"
              description="담당 휴양소의 정비 체크리스트와 사진 등록 화면을 준비하고 있습니다."
            />
          }
        />
        <Route
          path={appRoutes.draft}
          element={
            <AccessPendingScreen
              title="체크리스트 확인"
              description="체크리스트 작성과 제출 내역 확인 화면을 준비하고 있습니다."
            />
          }
        />
        {ConnectionScreen && (
          <Route
            path={appRoutes.connection}
            element={
              <Suspense
                fallback={
                  <PageState
                    title="불러오는 중"
                    description="잠시만 기다려 주세요."
                  />
                }
              >
                <ConnectionScreen />
              </Suspense>
            }
          />
        )}
        <Route path="*" element={<NotFoundScreen />} />
      </Route>
      <Route element={<AdminSessionLayout />}>
        <Route element={<AppShell />}>
          <Route path={appRoutes.adminLogin} element={<AdminLoginScreen />} />
        </Route>
        <Route element={<RequireAdmin />}>
          <Route element={<AdminLayout />}>
            <Route path={appRoutes.admin} element={<AdminDashboardScreen />} />
            <Route
              path={appRoutes.adminCalendar}
              element={<AdminCalendarScreen />}
            />
            <Route
              path={appRoutes.adminMaintenance}
              element={<AdminMaintenanceScreen />}
            />
            <Route
              path={appRoutes.adminIssues}
              element={<AdminIssuesScreen />}
            />
            <Route
              path={appRoutes.adminIssueCategories}
              element={<AdminIssueCategoriesScreen />}
            />
            <Route
              path={appRoutes.adminIssueDetail}
              element={<AdminIssueDetailScreen />}
            />
            <Route path={appRoutes.adminMore} element={<AdminMoreScreen />} />
            <Route path={appRoutes.adminReports} element={<AdminReportsScreen />} />
            <Route path={appRoutes.adminStaff} element={<AdminStaffScreen />} />
            <Route
              path={appRoutes.adminStaffCreate}
              element={<AdminStaffEditorScreen creating />}
            />
            <Route
              path={appRoutes.adminStaffDetail}
              element={<AdminStaffEditorScreen />}
            />
            <Route
              path={appRoutes.adminPropertyQr}
              element={<AdminPropertyQrScreen />}
            />
            <Route
              path={appRoutes.adminPropertyGuide}
              element={<AdminPropertyGuideScreen />}
            />
            <Route
              path={appRoutes.adminPropertyChecklists}
              element={<AdminPropertyChecklistsScreen />}
            />
            <Route
              path={appRoutes.adminChecklistEditor}
              element={<AdminChecklistEditorScreen />}
            />
            <Route
              path={appRoutes.adminPropertyStaff}
              element={<AdminPropertyStaffScreen />}
            />
            <Route
              path={appRoutes.adminSubmissions}
              element={<AdminSubmissionsScreen />}
            />
            <Route
              path={appRoutes.adminSubmissionDetail}
              element={<AdminSubmissionDetailScreen />}
            />
            <Route
              path={appRoutes.adminStays}
              element={<AdminStayListScreen />}
            />
            <Route
              path={appRoutes.adminStayImportCreate}
              element={<AdminStayImportUploadScreen />}
            />
            <Route
              path={appRoutes.adminStayImportDetail}
              element={<AdminStayImportReviewScreen />}
            />
            <Route
              path={appRoutes.adminStayCreate}
              element={<AdminStayCreateScreen />}
            />
            <Route
              path={appRoutes.adminStayDetail}
              element={<AdminStayDetailScreen />}
            />
            <Route
              path={appRoutes.adminProperties}
              element={<AdminPropertiesScreen />}
            />
            <Route
              path={appRoutes.adminPropertyCreate}
              element={<AdminPropertyEditorScreen creating />}
            />
            <Route
              path={appRoutes.adminPropertyDetail}
              element={<AdminPropertyEditorScreen />}
            />
          </Route>
        </Route>
      </Route>
    </Routes>
  );
}
