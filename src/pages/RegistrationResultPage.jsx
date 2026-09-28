import { useEffect, useState } from 'react'
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom'

const toneMap = {
  success: {
    kicker: 'Revisa tu bandeja',
    primaryTo: '/login',
    primaryLabel: 'Ir a ingresar',
    secondaryTo: '/',
    secondaryLabel: 'Volver al inicio',
  },
  existing: {
    kicker: 'Cuenta ya registrada',
    primaryTo: '/login',
    primaryLabel: 'Ir a ingresar',
    secondaryTo: '/registro',
    secondaryLabel: 'Volver al registro',
  },
  error: {
    kicker: 'No pudimos completar el proceso',
    primaryTo: '/registro',
    primaryLabel: 'Intentar nuevamente',
    secondaryTo: '/',
    secondaryLabel: 'Volver al inicio',
  },
}

export default function RegistrationResultPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const state = location.state || {}
  const [isConfirmingDev, setIsConfirmingDev] = useState(false)
  const [devConfirmationMessage, setDevConfirmationMessage] = useState('')
  const [devConfirmationTone, setDevConfirmationTone] = useState('success')
  const [isEmailVerified, setIsEmailVerified] = useState(false)
  const [shouldAutoRedirectToLogin, setShouldAutoRedirectToLogin] = useState(false)

  const config = toneMap[state?.tone] || toneMap.error
  const primaryLabel = state.tone === 'success' && isEmailVerified ? 'Ingresar ahora' : config.primaryLabel
  const statusTitle = state.tone === 'success' && isEmailVerified ? 'Email confirmado' : 'Estado del registro'
  const statusText = state.tone === 'success' && isEmailVerified
    ? `El email ${state.registeredEmail || 'registrado'} ya fue confirmado. Ya puedes iniciar sesión por primera vez.`
    : state.description

  useEffect(() => {
    if (!shouldAutoRedirectToLogin) {
      return () => {}
    }

    const timeoutId = window.setTimeout(() => {
      navigate('/login', { replace: true })
    }, 1200)

    return () => {
      window.clearTimeout(timeoutId)
    }
  }, [navigate, shouldAutoRedirectToLogin])

  if (!state?.tone || !toneMap[state.tone]) {
    return <Navigate to="/registro" replace />
  }

  async function handleDevConfirmation() {
    if (!state.devConfirmationUrl || isConfirmingDev) {
      return
    }

    setIsConfirmingDev(true)
    setDevConfirmationMessage('')

    try {
      const response = await fetch(state.devConfirmationUrl, {
        headers: {
          Accept: 'application/json',
        },
      })
      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.success) {
        setDevConfirmationTone('error')
        setDevConfirmationMessage(payload?.error || payload?.message || 'No se pudo confirmar la cuenta de desarrollo.')
        return
      }

      setDevConfirmationTone('success')
      setDevConfirmationMessage(payload?.message || 'Cuenta confirmada para desarrollo.')

      if (state.registeredEmail) {
        setIsEmailVerified(true)
      }

      setDevConfirmationMessage('Cuenta confirmada para desarrollo. Redirigiendo al login...')
      setShouldAutoRedirectToLogin(true)
    } catch (error) {
      setDevConfirmationTone('error')
      setDevConfirmationMessage(error.message || 'No se pudo confirmar la cuenta de desarrollo.')
    } finally {
      setIsConfirmingDev(false)
    }
  }

  return (
    <main className="container">
      <section className="lixmar-login lixmar-login--modern">
        <div className="lixmar-login__form-shell">
          <div className="lixmar-login__form lixmar-login__form--modern lixmar-login__form--result">
            <div className="lixmar-login__form-head lixmar-login__form-head--result">
              <span className="lixmar-login__badge">{config.kicker}</span>
              <h1 className="lixmar-login__title">{state.title}</h1>
              <p className="lixmar-login__subtitle lixmar-login__subtitle--result">{state.description}</p>
            </div>

            <div className={`lixmar-login__status lixmar-login__status--${state.tone}`}>
              <strong className="lixmar-login__status-title">{statusTitle}</strong>
              <p className="lixmar-login__status-text">{statusText}</p>
              {state.tone === 'success' && !isEmailVerified ? (
                <p className="lixmar-login__status-note">Tu primer ingreso quedará habilitado después de confirmar el email desde el link.</p>
              ) : null}
              {import.meta.env.DEV && state.devConfirmationUrl ? (
                <div className="lixmar-login__dev-helper">
                  <strong className="lixmar-login__dev-helper-title">Link de desarrollo</strong>
                  <span className="lixmar-login__dev-helper-link">
                    {state.devConfirmationUrl}
                  </span>
                  <button
                    type="button"
                    className="lixmar-login__dev-helper-button"
                    onClick={handleDevConfirmation}
                    disabled={isConfirmingDev || isEmailVerified}
                  >
                    {isConfirmingDev ? 'Confirmando...' : isEmailVerified ? 'Email ya confirmado' : 'Confirmar sin salir de la app'}
                  </button>
                  {devConfirmationMessage ? (
                    <p className={`lixmar-login__dev-helper-message lixmar-login__dev-helper-message--${devConfirmationTone}`}>
                      {devConfirmationMessage}
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>

            <div className="lixmar-login__result-actions">
              <Link to={config.primaryTo} className="lixmar-login__submit lixmar-login__submit--wide lixmar-login__submit--link">
                {primaryLabel}
              </Link>
              <Link to={config.secondaryTo} className="lixmar-login__status-link lixmar-login__status-link--secondary">
                {config.secondaryLabel}
              </Link>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
