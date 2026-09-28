import { NavLink, Outlet, useLocation } from 'react-router-dom'

const navigation = [
  { to: '/perfil', label: 'Perfil' },
  { to: '/compras', label: 'Mis compras' },
  { to: '/mis-publicaciones', label: 'Mis publicaciones' },
  { to: '/ventas', label: 'Ventas' },
  { to: '/favoritos', label: 'Favoritos' },
  { to: '/mensajes', label: 'Mensajes' },
  { to: '/notificaciones', label: 'Notificaciones' },
  { to: '/configuracion', label: 'Configuración' },
  { to: '/seguridad', label: 'Seguridad' },
]

export default function AccountLayout() {
  const { pathname } = useLocation()
  return (
    <main className="lixmar-account container">
      <aside className="lixmar-account__sidebar" aria-label="Menú de mi cuenta">
        <h2 className="lixmar-account__sidebar-title">Mi cuenta</h2>
        <nav className="lixmar-account__nav" aria-label="Secciones de mi cuenta">
          {navigation.map(({ to, label }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/perfil'}
              className={({ isActive }) => `lixmar-account__nav-link${isActive || (to === '/configuracion' && ['/direcciones', '/medios-de-pago', '/verificacion'].includes(pathname)) ? ' lixmar-account__nav-link--active' : ''}`}
            >
              <span className="lixmar-account__nav-dot" aria-hidden="true" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="lixmar-account__main"><Outlet /></div>
    </main>
  )
}
