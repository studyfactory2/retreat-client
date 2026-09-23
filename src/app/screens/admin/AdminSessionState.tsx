import { useAdminSession } from "../../core/session/use-admin-session";
import { Button } from "../../shared/ui/Button/Button";
import { PageState } from "../../shared/ui/PageState/PageState";
import "./admin.css";

export function AdminSessionState() {
  const { state, retry, logout } = useAdminSession();

  if (state.status === "checking") {
    return (
      <div className="admin-session" role="status" aria-live="polite">
        <PageState
          title="로그인 확인 중"
          description="관리자 계정을 확인하고 있습니다. 잠시만 기다려 주세요."
        />
      </div>
    );
  }

  if (state.status === "unavailable") {
    return (
      <div className="admin-session">
        <PageState
          title="로그인을 확인할 수 없습니다"
          description={state.message}
        >
          <Button onClick={retry}>다시 확인</Button>
          <Button className="admin-button-secondary" onClick={logout}>
            로그인 화면으로
          </Button>
        </PageState>
      </div>
    );
  }

  return null;
}
