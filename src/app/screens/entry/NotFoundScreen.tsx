import { Link } from 'react-router-dom'
import { PageState } from '../../shared/ui/PageState/PageState'
import './entry.css'

export function NotFoundScreen() {
  return (
    <PageState
      title="페이지를 찾을 수 없습니다"
      description="주소를 다시 확인해 주세요. 안내받은 링크가 있다면 해당 링크로 다시 접속해 주세요."
    >
      <Link className="entry-home-link" to="/">
        홈으로 돌아가기 <span aria-hidden="true">→</span>
      </Link>
    </PageState>
  )
}
