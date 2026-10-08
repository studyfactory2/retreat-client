import { Link } from 'react-router-dom';

export function AdminListHeader({
  title,
  description,
  createLabel,
  createHref,
}: {
  title: string;
  description: string;
  createLabel: string;
  createHref: string;
}) {
  return (
    <header className="admin-directory-heading">
      <div>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      <Link className="ui-button" to={createHref}>
        <span aria-hidden="true">＋</span> {createLabel}
      </Link>
    </header>
  );
}
