import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FaApple, FaEye, FaEyeSlash, FaGoogle } from 'react-icons/fa6'
import { isPublicEmailVerified } from '@/auth/publicEmailVerification'
import { getPublicSession, setPublicSession } from '@/auth/publicSession'

const LOGIN_ENDPOINT = '/api/v1/auth/login'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function LoginPage() {
  const navigate = useNavigate()
  const publicSession = getPublicSession()
  const [showPassword, setShowPassword] = useState(false)
  const [formValues, setFormValues] = useState({
    email: '',
    password: '',
    remember: false,
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
    const { name, value, type, checked } = event.target

    setFormValues((currentValue) => ({
      ...currentValue,
      [name]: type === 'checkbox' ? checked : value,
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

  function completeLogin(sessionData = {}, options = {}) {
    setPublicSession({
      name: sessionData.name || '',
      email: sessionData.email || normalizedEmail,
      token: sessionData.token || '',
      remember: formValues.remember,
    })

    setFeedbackTone('success')
    setFeedbackMessage(options.message || 'Ingresaste correctamente. Redirigiendo...')
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
          if (isPublicEmailVerified(normalizedEmail)) {
            completeLogin({
              email: payload?.data?.email || normalizedEmail,
            })
            return
          }

          setFeedbackTone('error')
          setFeedbackMessage('Debes verificar tu email con el link de confirmación antes de iniciar sesión por primera vez.')
          return
        }

        setFeedbackTone('error')
        setFeedbackMessage(payload?.error || payload?.message || 'No pudimos iniciar tu sesión. Inténtalo nuevamente.')
        return
      }

      const authenticatedUser = payload?.data?.user || {}

      completeLogin({
        name: authenticatedUser.name || '',
        email: authenticatedUser.email || normalizedEmail,
        token: payload?.data?.token || '',
      })
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
    <main className="container">
      <section className="lixmar-login lixmar-login--modern">
        <div className="lixmar-login__form-shell">
          <div className="lixmar-login__form lixmar-login__form--modern">
            <div className="lixmar-login__form-head">
              <span className="lixmar-login__badge">Lixmar ID</span>
              <h2 className="lixmar-login__title">Bienvenido de nuevo</h2>
              <p className="lixmar-login__subtitle">INICIA SESIÓN PARA CONTINUAR</p>
            </div>

            {feedbackMessage ? (
              <div className={`lixmar-login__feedback lixmar-login__feedback--${feedbackTone}`}>
                {feedbackMessage}
              </div>
            ) : null}

            <form onSubmit={handleSubmit} noValidate>
              <div className="lixmar-login__field">
                <label className="lixmar-login__label">Dirección de correo electrónico</label>
                <input
                  type="email"
                  name="email"
                  className={`lixmar-login__input${emailErrorMessage ? ' lixmar-login__input--error' : ''}`}
                  placeholder="Ejemplo@gmail.com"
                  value={formValues.email}
                  onChange={handleFieldChange}
                />
                {emailErrorMessage ? <p className="lixmar-login__field-error">{emailErrorMessage}</p> : null}
              </div>
              <div className="lixmar-login__field">
                <div className="lixmar-login__label-row">
                  <label className="lixmar-login__label">Contraseña</label>
                  <a href="#" className="lixmar-login__forgot lixmar-login__forgot--inline">¿Olvidaste tu contraseña?</a>
                </div>
                <div className="lixmar-login__password-wrap">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    name="password"
                    className={`lixmar-login__input${passwordErrorMessage ? ' lixmar-login__input--error' : ''}`}
                    placeholder="Ingresa tu contraseña"
                    value={formValues.password}
                    onChange={handleFieldChange}
                  />
                  <button
                    type="button"
                    className="lixmar-login__toggle-pass"
                    aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                    onClick={() => setShowPassword((currentValue) => !currentValue)}
                  >
                    {showPassword ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                  </button>
                </div>
                {passwordErrorMessage ? <p className="lixmar-login__field-error">{passwordErrorMessage}</p> : null}
              </div>

              <label className="lixmar-login__remember">
                <input type="checkbox" name="remember" checked={formValues.remember} onChange={handleFieldChange} />
                <span>Mantener mi sesión iniciada</span>
              </label>

              <button type="submit" className="lixmar-login__submit lixmar-login__submit--wide" disabled={isSubmitting}>
                {isSubmitting ? 'INGRESANDO...' : 'INGRESAR'}
              </button>
            </form>

            <div className="lixmar-login__divider">
              <span>o continúa con</span>
            </div>

            <div className="lixmar-login__socials">
              <button type="button" className="lixmar-login__social-button"><FaGoogle size={16} /> Google</button>
              <button type="button" className="lixmar-login__social-button"><FaApple size={16} /> Apple</button>
            </div>

            <p className="lixmar-login__register lixmar-login__register--modern">
              NUEVO USUARIO? <Link to="/registro">REGISTRARSE</Link>
            </p>
          </div>
        </div>
      </section>
    </main>
  )
}
