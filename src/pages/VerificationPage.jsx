import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '@/components/layout/Breadcrumb'

const tabs = [
  { id: 'info', label: 'Informacion Personal', to: '/perfil' },
  { id: 'verify', label: 'Validar identidad', to: null },
  { id: 'orders', label: 'Mi orden', to: null },
  { id: 'address', label: 'Mi direccion', to: null },
  { id: 'password', label: 'Cambiar contraseña', to: null },
]

const guidelines = [
  { title: 'Documentos Válidos', text: 'Asegúrate de que tu documento de identidad, pasaporte, carnet de residente, etc, sea válido en el país que selecciones.' },
  { title: 'Calidad Y Claridad De La Foto', text: 'Encuentra un lugar bien iluminado con un fondo limpio. Asegúrate de que la foto sea clara, sin obstrucciones ni borrosidades.' },
  { title: 'Selfie En Lugar De Carga De Foto', text: 'No uses imágenes de rostros de fotos o dispositivos digitales, ya que la detección de vida no funcionará.' },
  { title: 'Importante', text: 'Solo puedes verificar una cuenta con tus datos de identidad, si verificas esta cuenta no podrás verificar ninguna otra cuenta con la misma información.' },
]

export default function VerificationPage() {
  const [confirmed, setConfirmed] = useState(false)

  const handleVerify = (e) => {
    e.preventDefault()
    if (!confirmed) {
      alert('Debes confirmar que esta es tu cuenta principal.')
      return
    }
    alert('¡Verificación iniciada!')
  }

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Verificación' }]} />

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
              tab.to ? (
                <Link
                  to={tab.to}
                  className="lixmar-profile__tab"
                  key={tab.id}
                >
                  <span>{tab.label}</span>
                  <span className="lixmar-profile__tab-arrow">→</span>
                </Link>
              ) : (
                <a
                  href="#"
                  className={`lixmar-profile__tab${tab.id === 'verify' ? ' lixmar-profile__tab--active' : ''}`}
                  key={tab.id}
                  onClick={(e) => e.preventDefault()}
                >
                  <span>{tab.label}</span>
                  <span className="lixmar-profile__tab-arrow">→</span>
                </a>
              )
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="lixmar-profile__content">
          <h4 className="lixmar-profile__title">Verificación De Identidad</h4>

          {/* Status Banner */}
          <div className="lixmar-verify__banner">
            <div className="lixmar-verify__icon">
              <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
                <rect x="0" y="28" width="40" height="40" rx="4" transform="rotate(-45 0 28)" fill="#b3b3b3"/>
              </svg>
            </div>
            <p className="lixmar-verify__status">Sin Verificar</p>
          </div>

          {/* Verify Header */}
          <div className="lixmar-verify__header">
            <h4 className="lixmar-verify__title">Verifica Tu Cuenta</h4>
            <div className="lixmar-verify__veriff">
              <span>Asegurado e impulsado por</span>
              <strong> Veriff</strong>
            </div>
          </div>

          <p className="lixmar-verify__intro">Aquí tienes algunas pautas generales para una verificación fácil:</p>

          {/* Guidelines */}
          <div className="lixmar-verify__guidelines">
            {guidelines.map(g => (
              <div className="lixmar-verify__guideline" key={g.title}>
                <h5 className="lixmar-verify__guideline-title">{g.title}</h5>
                <p className="lixmar-verify__guideline-text">{g.text}</p>
              </div>
            ))}
          </div>

          {/* Checkbox */}
          <label className="lixmar-verify__confirm">
            <input
              type="checkbox"
              className="lixmar-verify__checkbox"
              checked={confirmed}
              onChange={(e) => setConfirmed(e.target.checked)}
            />
            <span className="lixmar-verify__confirm-text">Entiendo, Esta Es Mi Cuenta Principal.</span>
          </label>

          {/* CTA Button */}
          <div className="lixmar-verify__cta">
            <a href="#" className="lixmar-verify__btn" onClick={handleVerify}>VERIFICAR ESTA CUENTA</a>
          </div>
        </div>
      </section>
    </main>
  )
}
