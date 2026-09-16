import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { FaApple, FaEye, FaEyeSlash, FaGoogle, FaArrowLeft } from 'react-icons/fa6'
import { clearPublicEmailVerified } from '@/auth/publicEmailVerification'
import { getPublicSession, setPublicSession } from '@/auth/publicSession'
import BiometricScanner from '@/components/BiometricScanner'

const SEND_VERIFICATION_ENDPOINT = '/api/v1/auth/send-verification'
const VERIFY_CODE_ENDPOINT = '/api/v1/auth/verify-code'

const REGISTER_ENDPOINT = '/api/v1/auth/register'
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export default function RegistrationPage() {
  const navigate = useNavigate()
  const publicSession = getPublicSession()
  const [step, setStep] = useState(1)
  const [showPassword, setShowPassword] = useState(false)
  const [showPasswordConfirmation, setShowPasswordConfirmation] = useState(false)
  const [touchedFields, setTouchedFields] = useState({
    passwordConfirmation: false,
  })
  const [formValues, setFormValues] = useState({
    name: '',
    email: '',
    password: '',
    passwordConfirmation: '',
    termsAccepted: false,
    biometricVerified: false,
  })
  const [fieldErrors, setFieldErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [verificationId, setVerificationId] = useState('')
  const [registeredUserId, setRegisteredUserId] = useState(null)
  const [phoneValue, setPhoneValue] = useState('')
  const [codeSent, setCodeSent] = useState(false)
  const [verificationCodeValue, setVerificationCodeValue] = useState('')
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [isVerifyingCode, setIsVerifyingCode] = useState(false)
  const [step5Error, setStep5Error] = useState('')
  const [devCode, setDevCode] = useState('')

  const normalizedEmail = formValues.email.trim()
  const emailValidationError = normalizedEmail && !EMAIL_PATTERN.test(normalizedEmail)
    ? 'Ingresa un email válido.'
    : ''
  const passwordValidationError = getPasswordValidationError(formValues.password)
  const passwordConfirmationValidationError = getPasswordConfirmationValidationError(
    formValues.password,
    formValues.passwordConfirmation,
    touchedFields.passwordConfirmation,
  )

  if (publicSession) {
    return <Navigate to="/perfil" replace />
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
  }

  function handleFieldBlur(event) {
    const { name } = event.target

    if (name === 'passwordConfirmation') {
      setTouchedFields((currentValue) => ({
        ...currentValue,
        passwordConfirmation: true,
      }))
    }
  }

  function nextStep() {
    if (step === 1) {
      if (!normalizedEmail || emailValidationError || !formValues.password || passwordValidationError || passwordConfirmationValidationError) {
        setFieldErrors({
          email: !normalizedEmail ? 'Ingresa un email' : emailValidationError,
          password: !formValues.password ? 'Ingresa una contraseña' : passwordValidationError,
          password_confirmation: passwordConfirmationValidationError,
        })
        return
      }
    }
    if (step === 2) {
      if (!formValues.name.trim()) {
        setFieldErrors({ name: 'Tu nombre es requerido' })
        return
      }
    }
    setFieldErrors({})
    setStep(step + 1)
  }

  function prevStep() {
    setStep(step - 1)
  }

  async function handleSubmit(event) {
    event.preventDefault()
    setFieldErrors({})

    if (!formValues.termsAccepted) {
      setFieldErrors({ termsAccepted: 'Debes aceptar los términos para continuar' })
      return
    }

    if (!formValues.biometricVerified) {
      setFieldErrors({ termsAccepted: 'Debes completar la validación biométrica' })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch(REGISTER_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: formValues.name.trim(),
          email: normalizedEmail,
          password: formValues.password,
          password_confirmation: formValues.passwordConfirmation,
          termsAccepted: formValues.termsAccepted,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok) {
        if (payload?.errors && typeof payload.errors === 'object') {
          setFieldErrors(payload.errors)
          setIsSubmitting(false)
          return
        }

        if (response.status === 409) {
          navigate('/registro/resultado', {
            state: {
              tone: 'existing',
              title: 'Ya existe una cuenta con ese email.',
              description: 'Probá iniciar sesión con ese correo o recuperar tu contraseña si ya te habías registrado antes.',
            },
          })
          return
        }

        navigate('/registro/resultado', {
          state: {
            tone: 'error',
            title: 'No pudimos completar tu registro.',
            description: payload?.error || payload?.message || 'Hubo un error inesperado. Inténtalo nuevamente más tarde.',
          },
        })
        return
      }

      const registeredEmail = payload?.data?.email || normalizedEmail
      clearPublicEmailVerified(registeredEmail)

      setVerificationId(payload?.data?.verificationId || '')
      setRegisteredUserId(payload?.data?.userId || null)

      setFormValues(prev => ({ ...prev, biometricVerified: prev.biometricVerified }))
      setStep(5)
    } catch (submitError) {
      navigate('/registro/resultado', {
        state: {
          tone: 'error',
          title: 'No pudimos completar tu registro.',
          description: submitError.message || 'Hubo un error inesperado. Inténtalo nuevamente más tarde.',
        },
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  function normalizePhone(raw) {
    // Deja solo dígitos
    const digits = raw.replace(/\D/g, '')
    // Ya viene con código de país completo (ej: 541166871552 o 5491166871552)
    if (digits.startsWith('549') && digits.length >= 12) return '+' + digits
    if (digits.startsWith('54') && digits.length >= 11) {
      // Insertar el 9 de móvil si no está: 54 + area + número → 54 + 9 + area + número
      return '+549' + digits.slice(2)
    }
    // Número local argentino: 10 dígitos (ej: 1166871552)
    if (digits.length === 10) return '+549' + digits
    // 8 dígitos (sin área, asumimos Buenos Aires 11)
    if (digits.length === 8) return '+5491' + digits
    // Devolver tal cual si no encaja
    return '+' + digits
  }

  function extractApiError(payload, fallback) {
    if (payload?.errors) {
      const messages = Object.values(payload.errors).flat()
      if (messages.length) return messages.join(' ')
    }
    return payload?.error || payload?.message || fallback
  }

  async function handleSendCode() {
    setStep5Error('')
    const trimmedPhone = phoneValue.trim()
    if (!trimmedPhone) {
      setStep5Error('Ingresá tu número de teléfono.')
      return
    }
    const e164Phone = normalizePhone(trimmedPhone)
    // Validaci\u00f3n E.164 tras normalizar
    if (!/^\+[1-9]\d{6,14}$/.test(e164Phone)) {
      setStep5Error('N\u00famero inv\u00e1lido. Ingres\u00e1 solo los d\u00edgitos, ej: 1166871552')
      return
    }
    setIsSendingCode(true)
    try {
      const response = await fetch(SEND_VERIFICATION_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: e164Phone, ...(registeredUserId ? { userId: registeredUserId } : {}) }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStep5Error(extractApiError(payload, 'No se pudo enviar el código. Revisá el número e intentá de nuevo.'))
        return
      }
      if (payload?.data?.devCode) setDevCode(payload.data.devCode)
      setCodeSent(true)
    } catch {
      setStep5Error('Error de red. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setIsSendingCode(false)
    }
  }

  async function handleVerifyCode() {
    setStep5Error('')
    if (verificationCodeValue.length !== 5) {
      setStep5Error('El código debe tener 5 dígitos.')
      return
    }
    setIsVerifyingCode(true)
    try {
      const response = await fetch(VERIFY_CODE_ENDPOINT, {
        method: 'POST',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({
          verification_id: verificationId,
          code: verificationCodeValue,
          phone: normalizePhone(phoneValue.trim()),
        }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) {
        setStep5Error(extractApiError(payload, 'Código incorrecto o expirado. Intentá de nuevo.'))
        return
      }
      setPublicSession({
        name: payload?.user?.name || formValues.name,
        email: payload?.user?.email || formValues.email,
        token: payload?.token || '',
        remember: false,
      })
      navigate('/')
    } catch {
      setStep5Error('Error de red. Revisá tu conexión e intentá de nuevo.')
    } finally {
      setIsVerifyingCode(false)
    }
  }

  function getFieldError(fieldName) {
    const fieldError = fieldErrors[fieldName]
    if (Array.isArray(fieldError)) {
      return fieldError[0]
    }
    return typeof fieldError === 'string' ? fieldError : ''
  }

  const emailErrorMessage = getFieldError('email') || emailValidationError
  const passwordErrorMessage = getFieldError('password') || passwordValidationError
  const passwordConfirmationErrorMessage = getFieldError('password_confirmation') || passwordConfirmationValidationError

  return (
    <main className="container">
      <section className="lixmar-login lixmar-login--modern">
        <div className="lixmar-login__form-shell">
          <div className="lixmar-login__form lixmar-login__form--modern">
            <div className="lixmar-login__form-head">
              {step > 1 && (
                <button type="button" onClick={prevStep} className="lixmar-login__back-button" style={{ background: 'none', border: 'none', cursor: 'pointer', float: 'left', marginTop: '4px' }}>
                  <FaArrowLeft size={16} />
                </button>
              )}
              <span className="lixmar-login__badge">Paso {step} de 5</span>
              <h2 className="lixmar-login__title">Crea tu cuenta</h2>
              <p className="lixmar-login__subtitle">REGÍSTRATE PARA EMPEZAR A COMPRAR</p>
            </div>

            <form onSubmit={(e) => { e.preventDefault(); if(step === 4) handleSubmit(e); else nextStep(); }} noValidate>
              
              {/* Paso 1: Cuenta */}
              {step === 1 && (
                <div className="lixmar-login__step">
                  <div className="lixmar-login__field">
                    <label className="lixmar-login__label">Dirección de correo electrónico</label>
                    <input
                      type="email"
                      name="email"
                      className={`lixmar-login__input${emailErrorMessage ? ' lixmar-login__input--error' : ''}`}
                      placeholder="Ejemplo@gmail.com"
                      value={formValues.email}
                      onChange={handleFieldChange}
                      required
                    />
                    {emailErrorMessage ? <p className="lixmar-login__field-error">{emailErrorMessage}</p> : null}
                  </div>

                  <div className="lixmar-login__field">
                    <label className="lixmar-login__label">Contraseña</label>
                    <div className="lixmar-login__password-wrap">
                      <input
                        name="password"
                        type={showPassword ? 'text' : 'password'}
                        className={`lixmar-login__input${passwordErrorMessage ? ' lixmar-login__input--error' : ''}`}
                        placeholder="Crea una contraseña segura"
                        value={formValues.password}
                        onChange={handleFieldChange}
                        required
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

                  <div className="lixmar-login__field">
                    <label className="lixmar-login__label">Confirmar contraseña</label>
                    <div className="lixmar-login__password-wrap">
                      <input
                        name="passwordConfirmation"
                        type={showPasswordConfirmation ? 'text' : 'password'}
                        className={`lixmar-login__input${passwordConfirmationErrorMessage ? ' lixmar-login__input--error' : ''}`}
                        placeholder="Repite tu contraseña"
                        value={formValues.passwordConfirmation}
                        onChange={handleFieldChange}
                        onBlur={handleFieldBlur}
                        required
                      />
                      <button
                        type="button"
                        className="lixmar-login__toggle-pass"
                        aria-label={showPasswordConfirmation ? 'Ocultar confirmación de contraseña' : 'Mostrar confirmación de contraseña'}
                        onClick={() => setShowPasswordConfirmation((currentValue) => !currentValue)}
                      >
                        {showPasswordConfirmation ? <FaEyeSlash size={16} /> : <FaEye size={16} />}
                      </button>
                    </div>
                    {passwordConfirmationErrorMessage ? <p className="lixmar-login__field-error">{passwordConfirmationErrorMessage}</p> : null}
                  </div>
                  
                  <button type="button" onClick={nextStep} className="lixmar-login__submit lixmar-login__submit--wide">
                    CONTINUAR
                  </button>

                  <div className="lixmar-login__divider">
                    <span>o regístrate con</span>
                  </div>

                  <div className="lixmar-login__socials">
                    <button type="button" className="lixmar-login__social-button"><FaGoogle size={16} /> Google</button>
                    <button type="button" className="lixmar-login__social-button"><FaApple size={16} /> Apple</button>
                  </div>

                  <p className="lixmar-login__register lixmar-login__register--modern">
                    ¿YA TIENES CUENTA? <Link to="/login">INGRESAR</Link>
                  </p>
                </div>
              )}

              {/* Paso 2: Datos Personales */}
              {step === 2 && (
                <div className="lixmar-login__step">
                  <div className="lixmar-login__field">
                    <label className="lixmar-login__label">Nombre completo</label>
                    <input
                      type="text"
                      name="name"
                      className={`lixmar-login__input${getFieldError('name') ? ' lixmar-login__input--error' : ''}`}
                      placeholder="Tu nombre y apellido"
                      value={formValues.name}
                      onChange={handleFieldChange}
                    />
                    {getFieldError('name') ? <p className="lixmar-login__field-error">{getFieldError('name')}</p> : null}
                  </div>
                  <button type="button" onClick={nextStep} className="lixmar-login__submit lixmar-login__submit--wide">
                    CONTINUAR
                  </button>
                </div>
              )}

              {/* Paso 3: Validación Biométrica */}
              {step === 3 && (
                <div className="lixmar-login__step">
                  <p style={{ textAlign: 'center', marginBottom: '1rem' }}>
                    Para proteger tu cuenta, necesitamos validar tu identidad con una foto de tu rostro.
                  </p>
                  
                  {formValues.biometricVerified ? (
                    <div style={{ textAlign: 'center', padding: '2rem', backgroundColor: '#e6ffe6', borderRadius: '8px' }}>
                      <p style={{ color: 'green', fontWeight: 'bold' }}>¡Validación biométrica exitosa!</p>
                    </div>
                  ) : (
                    <BiometricScanner onVerify={() => {
                      setFormValues(prev => ({ ...prev, biometricVerified: true }))
                      setTimeout(() => setStep(4), 1500)
                    }} />
                  )}

                  <div style={{ marginTop: '2rem' }}>
                    <button type="button" onClick={nextStep} className="lixmar-login__submit lixmar-login__submit--wide" disabled={!formValues.biometricVerified} style={{ opacity: formValues.biometricVerified ? 1 : 0.5 }}>
                      CONTINUAR
                    </button>
                  </div>
                </div>
              )}

              {/* Paso 5: Verificación de teléfono */}
              {step === 5 && (
                <div className="lixmar-login__step">
                  <p style={{ textAlign: 'center', marginBottom: '1.5rem', color: '#374151', fontSize: '14px' }}>
                    Para activar tu cuenta ingresá tu número de teléfono. Te enviaremos un código de verificación.
                  </p>

                  {!codeSent ? (
                    <>
                      <div className="lixmar-login__field">
                        <label className="lixmar-login__label">Número de teléfono</label>
                        <input
                          type="tel"
                          className="lixmar-login__input"
                          placeholder="1166871552"
                          value={phoneValue}
                          onChange={e => { setPhoneValue(e.target.value); setStep5Error('') }}
                        />
                        <p style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>Solo los dígitos sin el 0 ni el 15, ej: 1166871552</p>
                      </div>
                      {step5Error ? <p className="lixmar-login__field-error">{step5Error}</p> : null}
                      <button
                        type="button"
                        className="lixmar-login__submit lixmar-login__submit--wide"
                        onClick={handleSendCode}
                        disabled={isSendingCode}
                      >
                        {isSendingCode ? 'ENVIANDO...' : 'ENVIAR CÓDIGO'}
                      </button>
                    </>
                  ) : (
                    <>
                      <p style={{ textAlign: 'center', color: '#22c55e', fontWeight: 600, marginBottom: '1rem', fontSize: '14px' }}>
                        ✓ Código enviado a {phoneValue}
                      </p>
                      {devCode && (
                        <div style={{ background: '#fff3ef', border: '1.5px solid var(--color-lixmar-orange, #ff6b35)', borderRadius: '8px', padding: '10px 14px', marginBottom: '1rem', textAlign: 'center' }}>
                          <p style={{ margin: 0, fontSize: '11px', color: '#e55a2b', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Modo desarrollo — código SMS</p>
                          <p style={{ margin: '4px 0 0', fontSize: '26px', fontWeight: 700, letterSpacing: '0.25em', color: '#ff6b35' }}>{devCode}</p>
                        </div>
                      )}
                      <div className="lixmar-login__field">
                        <label className="lixmar-login__label">Código de verificación</label>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={5}
                          className="lixmar-login__input"
                          placeholder="12345"
                          value={verificationCodeValue}
                          onChange={e => { setVerificationCodeValue(e.target.value.replace(/\D/g, '')); setStep5Error('') }}
                        />
                      </div>
                      {step5Error ? <p className="lixmar-login__field-error">{step5Error}</p> : null}
                      <button
                        type="button"
                        className="lixmar-login__submit lixmar-login__submit--wide"
                        onClick={handleVerifyCode}
                        disabled={isVerifyingCode}
                      >
                        {isVerifyingCode ? 'VERIFICANDO...' : 'VERIFICAR Y ENTRAR'}
                      </button>
                      <button
                        type="button"
                        style={{ background: 'none', border: 'none', color: '#6b7280', fontSize: '13px', marginTop: '12px', cursor: 'pointer', textDecoration: 'underline' }}
                        onClick={() => { setCodeSent(false); setVerificationCodeValue(''); setStep5Error('') }}
                      >
                        Cambiar número
                      </button>
                    </>
                  )}
                </div>
              )}

              {/* Paso 4: Confirmación */}
              {step === 4 && (
                <div className="lixmar-login__step">
                  <p style={{ marginBottom: '1rem' }}>
                    Estás a un paso de terminar. Revisa que estés de acuerdo con nuestros términos.
                  </p>
                  
                  <label className="lixmar-login__remember">
                    <input
                      type="checkbox"
                      name="termsAccepted"
                      checked={formValues.termsAccepted}
                      onChange={handleFieldChange}
                      required
                    />
                    <span>Acepto términos, condiciones y políticas de privacidad</span>
                  </label>
                  {getFieldError('termsAccepted') ? <p className="lixmar-login__field-error lixmar-login__field-error--stacked">{getFieldError('termsAccepted')}</p> : null}

                  <button type="submit" className="lixmar-login__submit lixmar-login__submit--wide" disabled={isSubmitting}>
                    {isSubmitting ? 'CREANDO CUENTA...' : 'FINALIZAR Y CREAR CUENTA'}
                  </button>
                </div>
              )}

            </form>
          </div>
        </div>
      </section>
    </main>
  )
}

function getPasswordValidationError(password) {
  if (!password) {
    return ''
  }

  if (password.length < 8) {
    return 'La contraseña debe tener al menos 8 caracteres.'
  }

  if (!/[a-z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra minúscula.'
  }

  if (!/[A-Z]/.test(password)) {
    return 'La contraseña debe incluir al menos una letra mayúscula.'
  }

  if (!/[0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un número.'
  }

  if (!/[^a-zA-Z0-9]/.test(password)) {
    return 'La contraseña debe incluir al menos un carácter especial.'
  }

  return ''
}

function getPasswordConfirmationValidationError(password, passwordConfirmation, isTouched) {
  if (!password && !passwordConfirmation) {
    return ''
  }

  if (isTouched && password && !passwordConfirmation) {
    return 'Confirma tu contraseña.'
  }

  if (password !== passwordConfirmation) {
    return 'La confirmación debe ser igual a la contraseña.'
  }

  return ''
}
