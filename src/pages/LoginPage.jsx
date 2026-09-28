import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { getPublicSession, verifyPublicSession } from '@/auth/publicSession'

const LOGIN_ENDPOINT = '/api/v1/auth/login'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const publicSession = getPublicSession()
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [feedbackMessage, setFeedbackMessage] = useState('')
  const [feedbackTone, setFeedbackTone] = useState('error')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const normalizedEmail = formValues.email.trim()
  const emailValidationError = normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)
    ? 'Ingresa un email válido.'
    : ''

  if (publicSession) {
    return <Navigate to="/" replace />
  }

  function handleFieldChange(event) {
    const { name, value } = event.target

    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))

    setFieldErrors((currentValue) => ({
      ...currentValue,
      [name]: undefined,
    }))
    setFeedbackMessage('')
  }

  function getFieldError(fieldName) {
    const fieldError = fieldErrors[fieldName]

    if (Array.isArray(fieldError)) {
      return fieldError[0]
    }

    return typeof fieldError === 'string' ? fieldError : ''
  }

  async function completeLogin() {
    if (!await verifyPublicSession()) {
      setFeedbackTone('error')
      setFeedbackMessage('No se pudo validar la sesión. Inténtalo nuevamente.')
      return
    }
    setFeedbackTone('success')
    setFeedbackMessage('Ingresaste correctamente. Redirigiendo...')
    navigate('/')
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldErrors({})
    setFeedbackMessage('')

    if (!normalizedEmail) {
      setFieldErrors({ email: 'Ingresa tu email.' })
      return
    }

    if (emailValidationError) {
      setFieldErrors({ email: emailValidationError })
      return
    }

    if (!formValues.password) {
      setFieldErrors({ password: 'Ingresa tu contraseña.' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(LOGIN_ENDPOINT, {
        method: 'POST',
        credentials: 'same-origin',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: normalizedEmail,
          password: formValues.password,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (payload?.errors && typeof payload.errors === 'object') {
          setFieldErrors(payload.errors)
          return
        }

        if (response.status === 422 && payload?.needsVerification) {
          setFeedbackTone('error')
          setFeedbackMessage('Debes verificar tu email con el link de confirmación antes de iniciar sesión por primera vez.')
          return
        }

        setFeedbackTone('error')
        setFeedbackMessage(payload?.error || payload?.message || 'No pudimos iniciar tu sesión. Inténtalo nuevamente.')
        return
      }

      await completeLogin()
    } catch (submitError) {
      setFeedbackTone('error')
      setFeedbackMessage(submitError.message || 'No pudimos iniciar tu sesión. Inténtalo nuevamente.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const emailErrorMessage = getFieldError('email') || emailValidationError
  const passwordErrorMessage = getFieldError('password')

  return (
    <main className="lixmar-login-page">
      <section className="lixmar-login lixmar-login--figma" aria-labelledby="login-title">
        <div className="lixmar-login__form-shell">
          <div className="lixmar-login__form lixmar-login__form--figma">
            <div className="lixmar-login__form-head">
              <h1 id="login-title" className="lixmar-login__title">Ingresá a LIXMAR</h1>
              <p className="lixmar-login__subtitle">Accedé a tus compras, favoritos, mensajes y publicaciones.</p>
            </div>

            {feedbackMessage ? (
              <div className={`lixmar-login__feedback lixmar-login__feedback--${feedbackTone}`} role={feedbackTone === 'error' ? 'alert' : 'status'}>
                {feedbackMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate>
              <div className="lixmar-login__field">
                <label htmlFor="login-email" className="lixmar-login__label">Email</label>
                <input
                  id="login-email"
                  type="email"
                  name="email"
                  autoComplete="email"
                  aria-invalid={Boolean(emailErrorMessage)}
                  aria-describedby={emailErrorMessage ? 'login-email-error' : undefined}
                  className={`lixmar-login__input${emailErrorMessage ? ' lixmar-login__input--error' : ''}`}
                  placeholder="Ingresá email"
                  value={formValues.email}
                  onChange={handleFieldChange}
                />
                {emailErrorMessage ? <p id="login-email-error" className="lixmar-login__field-error" role="alert">{emailErrorMessage}</p> : null}
              </div>
              <div className="lixmar-login__field">
                <label htmlFor="login-password" className="lixmar-login__label">Contraseña</label>
                <input
                  id="login-password"
                  type="password"
                  name="password"
                  autoComplete="current-password"
                  aria-invalid={Boolean(passwordErrorMessage)}
                  aria-describedby={passwordErrorMessage ? 'login-password-error' : undefined}
                  className={`lixmar-login__input${passwordErrorMessage ? ' lixmar-login__input--error' : ''}`}
                  placeholder="Ingresá contraseña"
                  value={formValues.password}
                  onChange={handleFieldChange}
                />
                {passwordErrorMessage ? <p id="login-password-error" className="lixmar-login__field-error" role="alert">{passwordErrorMessage}</p> : null}
              </div>

              <button type="submit" className="lixmar-login__submit lixmar-login__submit--wide" disabled={isSubmitting}>
                {isSubmitting ? 'Ingresando...' : 'Ingresar'}
              </button>
            </form>

            <p className="lixmar-login__links">
              <Link to="/recuperar-contrasena">¿Olvidaste tu contraseña?</Link>
              <span aria-hidden="true">·</span>
              <Link to="/registro">Crear cuenta</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
