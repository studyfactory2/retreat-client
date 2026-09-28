import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import { AccessPendingScreen } from '../../screens/entry/AccessPendingScreen';
import { EntryScreen } from '../../screens/entry/EntryScreen';
import { NotFoundScreen } from '../../screens/entry/NotFoundScreen';
import { AppShell } from '../../shared/layout/AppShell/AppShell';
import { PageState } from '../../shared/ui/PageState/PageState';
import { appRoutes } from './routes';
import { AdminSessionLayout } from './AdminSessionLayout';
import { RequireAdmin } from './RequireAdmin';
import { AdminLoginScreen } from '../../screens/admin/login/AdminLoginScreen';
import { AdminLayout } from '../../screens/admin/layout/AdminLayout';
import { AdminDashboardScreen } from '../../screens/admin/dashboard/AdminDashboardScreen';
import { AdminCalendarScreen } from '../../screens/admin/calendar/AdminCalendarScreen';
import { AdminStayImportUploadScreen } from '../../screens/admin/stay-imports/AdminStayImportUploadScreen';
import { AdminStayImportReviewScreen } from '../../screens/admin/stay-imports/AdminStayImportReviewScreen';
import { AdminStayListScreen } from '../../screens/admin/stays/AdminStayListScreen';
import { AdminStayCreateScreen } from '../../screens/admin/stays/AdminStayCreateScreen';
import { AdminStayDetailScreen } from '../../screens/admin/stays/AdminStayDetailScreen';
import { AdminPropertiesScreen } from '../../screens/admin/properties/AdminPropertiesScreen';
import { AdminPropertyEditorScreen } from '../../screens/admin/properties/AdminPropertyEditorScreen';

const ConnectionScreen = import.meta.env.DEV
  ? lazy(() => import('../../screens/dev/ConnectionScreen'))
  : null;

export function AppRouter() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path={appRoutes.home} element={<EntryScreen />} />
        <Route
          path={appRoutes.guest}
          element={
            <AccessPendingScreen
              title="이용객 안내"
              description="현장 QR로 이용하는 입실·퇴실 체크리스트 화면을 준비하고 있습니다."
            />
          }
        />
        <Route
          path={appRoutes.guestStay}
          element={
            <AccessPendingScreen
              title="나의 휴양소 이용"
              description="전달받으신 개인 링크에서 이용 안내를 확인하는 화면을 준비하고 있습니다."
            />
          }
        />
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
