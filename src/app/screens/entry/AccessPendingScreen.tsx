import { Link } from 'react-router-dom'
import { PageState } from '../../shared/ui/PageState/PageState'
import './entry.css'

type AccessPendingScreenProps = { title: string; description: string }

export function AccessPendingScreen({
  title,
  description,
}: AccessPendingScreenProps) {
  return (
    <PageState title={title} description={description}>
      <span className="entry-pending-label">화면 준비 중</span>
      <Link className="entry-home-link" to="/">
        홈으로 돌아가기 <span aria-hidden="true">→</span>
      </Link>
    </PageState>
  )
}
