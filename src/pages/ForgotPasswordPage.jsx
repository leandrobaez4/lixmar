import { useState } from 'react'
import { Link } from 'react-router-dom'

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  async function handleSubmit(event) {
    event.preventDefault()
    const normalizedEmail = email.trim()

    setError('')
    setMessage('')

    if (!normalizedEmail) {
      setError('Ingresá tu email.')
      return
    }

    if (!EMAIL_PATTERN.test(normalizedEmail)) {
      setError('Ingresá un email válido.')
      return
    }

    setBusy(true)

    try {
      const response = await fetch('/api/v1/auth/forgot-password', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ method: 'email', value: normalizedEmail }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        throw new Error(response.status === 429
          ? 'Demasiados intentos. Probá más tarde.'
          : payload.message || 'No pudimos enviar el código.')
      }
      setMessage('Si ese correo está registrado, recibirás las instrucciones para recuperar tu cuenta.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  function handleEmailChange(event) {
    setEmail(event.target.value)
    setError('')
    setMessage('')
  }

  return (
    <main className="lixmar-login-page">
      <section className="lixmar-login lixmar-login--figma" aria-labelledby="forgot-password-title">
        <div className="lixmar-login__form-shell">
          <div className="lixmar-login__form lixmar-login__form--figma">
            <div className="lixmar-login__form-head">
              <h1 id="forgot-password-title" className="lixmar-login__title">Recuperá tu acceso</h1>
              <p className="lixmar-login__subtitle">Te enviaremos un código para recuperar tu cuenta.</p>
            </div>

            {message ? <div className="lixmar-login__feedback lixmar-login__feedback--success" role="status">{message}</div> : null}
            {error ? <div id="forgot-password-error" className="lixmar-login__feedback lixmar-login__feedback--error" role="alert">{error}</div> : null}

            <form onSubmit={handleSubmit} noValidate>
              <div className="lixmar-login__field">
                <label className="lixmar-login__label" htmlFor="reset-email">Email</label>
                <input
                  id="reset-email"
                  className={`lixmar-login__input${error ? ' lixmar-login__input--error' : ''}`}
                  type="email"
                  autoComplete="email"
                  placeholder="Ingresá email"
                  aria-invalid={Boolean(error)}
                  aria-describedby={error ? 'forgot-password-error' : undefined}
                  value={email}
                  onChange={handleEmailChange}
                />
              </div>
              <button className="lixmar-login__submit lixmar-login__submit--wide" type="submit" disabled={busy}>
                {busy ? 'Enviando...' : 'Enviar código'}
              </button>
            </form>

            <p className="lixmar-login__links">
              <Link to="/login">Volver a ingresar</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
