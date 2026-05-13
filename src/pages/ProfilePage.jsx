import { useState } from 'react'
import Breadcrumb from '@/components/layout/Breadcrumb'

const tabs = [
  { id: 'info', label: 'Informacion Personal' },
  { id: 'verify', label: 'Validar identidad' },
  { id: 'orders', label: 'Mi orden' },
  { id: 'address', label: 'Mi direccion' },
  { id: 'password', label: 'Cambiar contraseña' },
]

export default function ProfilePage() {
  const [activeTab, setActiveTab] = useState('info')

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Perfil' }]} />

      <section className="lixmar-profile">
        {/* Sidebar */}
        <aside className="lixmar-profile__sidebar">
          <div className="lixmar-profile__avatar">
            <img src="/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png" alt="Avatar" className="lixmar-profile__avatar-img" />
          </div>
          <h5 className="lixmar-profile__name">Mark Cole</h5>
          <p className="lixmar-profile__email">swoo@gmail.com</p>

          <nav className="lixmar-profile__tabs">
            {tabs.map(tab => (
              <a
                href="#"
                className={`lixmar-profile__tab${activeTab === tab.id ? ' lixmar-profile__tab--active' : ''}`}
                key={tab.id}
                onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
              >
                <span>{tab.label}</span>
                <span className="lixmar-profile__tab-arrow">→</span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="lixmar-profile__content">
          <h4 className="lixmar-profile__title">Informacion Personal</h4>

          <form className="lixmar-profile__form" onSubmit={(e) => { e.preventDefault(); alert('¡Datos guardados!'); }}>
            <div className="lixmar-profile__row">
              <div className="lixmar-profile__field">
                <label className="lixmar-profile__label" htmlFor="profName">Nombre <span className="lixmar-profile__required">*</span></label>
                <input type="text" id="profName" className="lixmar-profile__input" defaultValue="Mark" />
              </div>
              <div className="lixmar-profile__field">
                <label className="lixmar-profile__label" htmlFor="profLastname">Apellido <span className="lixmar-profile__required">*</span></label>
                <input type="text" id="profLastname" className="lixmar-profile__input" defaultValue="Cole" />
              </div>
            </div>

            <div className="lixmar-profile__field">
              <label className="lixmar-profile__label" htmlFor="profEmail">Correo electronico <span className="lixmar-profile__required">*</span></label>
              <input type="email" id="profEmail" className="lixmar-profile__input" defaultValue="swoo@gmail.com" />
            </div>

            <div className="lixmar-profile__field">
              <label className="lixmar-profile__label" htmlFor="profPhone">Numero de telefono <span className="lixmar-profile__optional">(Opcional)</span></label>
              <input type="tel" id="profPhone" className="lixmar-profile__input" defaultValue="+54 1234 5678" />
            </div>

            <button type="submit" className="lixmar-profile__save">GUARDAR</button>
          </form>
        </div>
      </section>
    </main>
  )
}
