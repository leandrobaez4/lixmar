import { Link } from 'react-router-dom'

export default function Breadcrumb({ items }) {
  return (
    <nav className="lixmar-breadcrumb" aria-label="Breadcrumb">
      {items.map((item, index) => (
        <span key={index}>
          {index > 0 && <span className="lixmar-breadcrumb__sep">/</span>}
          {item.to ? (
            <Link to={item.to} className="lixmar-breadcrumb__link">{item.label}</Link>
          ) : (
            <span className="lixmar-breadcrumb__current">{item.label}</span>
          )}
        </span>
      ))}
    </nav>
  )
}
