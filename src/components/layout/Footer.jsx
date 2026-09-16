import { Link } from 'react-router-dom'
import '@/scss/components/layout/Footer.scss'

const footerColumns = [
  {
    title: 'Institucional',
    links: [
      { label: 'Quiénes somos', to: '/nosotros' },
      { label: 'Trabajá con nosotros', href: '#' },
      { label: 'Prensa', href: '#' },
      { label: 'Sustentabilidad', href: '#' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Centro de ayuda', href: '#' },
      { label: 'Cómo comprar', href: '#' },
      { label: 'Seguridad', href: '#' },
      { label: 'Términos y condiciones', href: '#' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { label: 'Cómo vender', to: '/vender' },
      { label: 'Planes para vender', to: '/suscripcion' },
      { label: 'Beneficios', href: '#' },
      { label: 'Preguntas frecuentes', href: '#' },
    ],
  },
  {
    title: 'Medios de pago',
    links: [
      { label: 'VISA · Mastercard', href: '#' },
      { label: 'Mercado Pago', href: '#' },
    ],
  },
  {
    title: 'Seguinos',
    links: [
      { label: 'Instagram · Facebook', href: '#' },
      { label: 'TikTok · YouTube', href: '#' },
    ],
  },
]

function FooterLink({ link }) {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>
  }

  return <a href={link.href}>{link.label}</a>
}

export default function Footer() {
  return (
    <footer className="lixmar-footer-v2">
      <div className="lixmar-footer-v2__shell">
        <div className="lixmar-footer-v2__content">
          <div className="lixmar-footer-v2__brand-block">
            <Link to="/" className="lixmar-footer-v2__brand">LIXMAR</Link>
            <p className="lixmar-footer-v2__tagline">El mercado de todo, para todos.</p>
          </div>

          {footerColumns.map((column) => (
            <nav key={column.title} className="lixmar-footer-v2__column" aria-label={column.title}>
              <h2 className="lixmar-footer-v2__title">{column.title}</h2>
              <ul className="lixmar-footer-v2__list">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <FooterLink link={link} />
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <p className="lixmar-footer-v2__copy">© 2026 LIXMAR. Todos los derechos reservados.</p>
      </div>
    </footer>
  )
}
