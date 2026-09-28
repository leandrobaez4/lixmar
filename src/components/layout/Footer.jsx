import { Link } from 'react-router-dom'
import '@/scss/components/layout/Footer.scss'

const footerColumns = [
  {
    title: 'Institucional',
    links: [
      { label: 'Quiénes somos', to: '/nosotros' },
      { label: 'Trabajá con nosotros' },
      { label: 'Prensa' },
      { label: 'Sustentabilidad' },
    ],
  },
  {
    title: 'Ayuda',
    links: [
      { label: 'Centro de ayuda' },
      { label: 'Cómo comprar' },
      { label: 'Seguridad' },
      { label: 'Términos y condiciones' },
    ],
  },
  {
    title: 'Vender',
    links: [
      { label: 'Cómo vender', to: '/vender' },
      { label: 'Planes para vender', to: '/suscripcion' },
      { label: 'Beneficios' },
      { label: 'Preguntas frecuentes' },
    ],
  },
  {
    title: 'Medios de pago',
    links: [
      { label: 'VISA · Mastercard' },
      { label: 'Mercado Pago' },
    ],
  },
  {
    title: 'Seguinos',
    links: [
      { label: 'Instagram · Facebook' },
      { label: 'TikTok · YouTube' },
    ],
  },
]

function FooterLink({ link }) {
  if (link.to) {
    return <Link to={link.to}>{link.label}</Link>
  }

  return <span className="lixmar-footer-v2__unavailable" aria-disabled="true" title="Próximamente">{link.label}</span>
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
