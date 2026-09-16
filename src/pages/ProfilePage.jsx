import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { FaChevronRight } from 'react-icons/fa6'
import { clearPublicEmailVerified, isPublicEmailVerified, markPublicEmailVerified } from '@/auth/publicEmailVerification'
import { getPublicSession, setPublicSession } from '@/auth/publicSession'

const PROFILE_ENDPOINT = '/api/v1/profile'
const PROFILE_EMAIL_CHANGE_ENDPOINT = '/api/v1/profile/email'
const PROFILE_PHONE_CHANGE_ENDPOINT = '/api/v1/profile/phone'

const tabs = [
  { id: 'info', label: 'Informacion Personal' },
  { id: 'verify', label: 'Validar identidad' },
  { id: 'orders', label: 'Mi orden' },
  { id: 'address', label: 'Mi direccion' },
  { id: 'password', label: 'Cambiar contraseña' },
]

export default function ProfilePage() {
  const publicSession = getPublicSession()
  const sessionToken = publicSession?.token || ''
  const [firstName = '', ...lastNameParts] = (publicSession?.name?.trim() || '').split(/\s+/)
  const [profileForm, setProfileForm] = useState(() => ({
    firstName,
    lastName: lastNameParts.join(' '),
    email: publicSession?.email || '',
    phone: publicSession?.phone || '',
  }))
  const [activeTab, setActiveTab] = useState('info')
  const [saveMessage, setSaveMessage] = useState('')
  const [saveTone, setSaveTone] = useState('success')
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(publicSession?.token))
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [emailChange, setEmailChange] = useState(createContactChangeState)
  const [phoneChange, setPhoneChange] = useState(createContactChangeState)
  const profileName = publicSession?.name?.trim() || [profileForm.firstName, profileForm.lastName].filter(Boolean).join(' ').trim()
  const profileEmail = publicSession?.email || profileForm.email
  const emailVerified = isPublicEmailVerified(profileEmail)

  if (!publicSession) {
    return <Navigate to="/login" replace />
  }

  useEffect(() => {
    if (!sessionToken) {
      setIsLoadingProfile(false)
      return () => {}
    }

    const abortController = new AbortController()

    async function loadProfile() {
      try {
        setIsLoadingProfile(true)
        const currentSession = getPublicSession()

        const response = await fetch(PROFILE_ENDPOINT, {
          headers: {
            Accept: 'application/json',
            Authorization: `Bearer ${sessionToken}`,
          },
          signal: abortController.signal,
        })

        const payload = await response.json().catch(() => ({}))

        if (!response.ok || !payload?.data) {
          return
        }

        const nextProfile = payload.data
        const nextName = nextProfile.name || [nextProfile.firstName, nextProfile.lastName].filter(Boolean).join(' ').trim()

        setProfileForm({
          firstName: nextProfile.firstName || '',
          lastName: nextProfile.lastName || '',
          email: nextProfile.email || currentSession?.email || '',
          phone: nextProfile.phone || '',
        })

        const nextSession = {
          ...currentSession,
          name: nextName,
          email: nextProfile.email || currentSession?.email || '',
          phone: nextProfile.phone || '',
          avatar: nextProfile.avatar || '',
          firstName: nextProfile.firstName || '',
          lastName: nextProfile.lastName || '',
          username: nextProfile.username || '',
        }

        if (
          currentSession?.name !== nextSession.name ||
          currentSession?.email !== nextSession.email ||
          currentSession?.phone !== nextSession.phone ||
          currentSession?.avatar !== nextSession.avatar ||
          currentSession?.firstName !== nextSession.firstName ||
          currentSession?.lastName !== nextSession.lastName ||
          currentSession?.username !== nextSession.username
        ) {
          setPublicSession(nextSession)
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          setSaveTone('error')
          setSaveMessage('No pudimos cargar tu perfil real. Mostramos la sesión local disponible.')
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      abortController.abort()
    }
  }, [sessionToken])

  function handleFieldChange(event) {
    const { name, value } = event.target

    setProfileForm((currentValue) => ({
      ...currentValue,
      [name]: value,
    }))
    setSaveMessage('')
  }

  async function handleSubmit(event) {
    event.preventDefault()

    const nextName = [profileForm.firstName.trim(), profileForm.lastName.trim()].filter(Boolean).join(' ').trim()

    if (!publicSession?.token) {
      setPublicSession({
        ...publicSession,
        name: nextName,
        email: profileForm.email.trim(),
        phone: profileForm.phone.trim(),
      })

      setSaveTone('success')
      setSaveMessage('Datos guardados correctamente en esta sesión.')
      return
    }

    setIsSavingProfile(true)

    try {
      const response = await fetch(PROFILE_ENDPOINT, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
          Authorization: `Bearer ${publicSession.token}`,
        },
        body: JSON.stringify({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          name: nextName,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (!response.ok || !payload?.data) {
        setSaveTone('error')
        setSaveMessage(payload?.error?.message || payload?.message || 'No pudimos guardar el perfil.')
        return
      }

      const nextProfile = payload.data
      const confirmedName = nextProfile.name || nextName

      setProfileForm((currentValue) => ({
        ...currentValue,
        firstName: nextProfile.firstName || currentValue.firstName,
        lastName: nextProfile.lastName || currentValue.lastName,
        email: nextProfile.email || currentValue.email,
        phone: nextProfile.phone || currentValue.phone,
      }))

      setPublicSession({
        ...publicSession,
        name: confirmedName,
        email: nextProfile.email || publicSession.email || '',
        phone: nextProfile.phone || '',
        avatar: nextProfile.avatar || publicSession.avatar || '',
        firstName: nextProfile.firstName || '',
        lastName: nextProfile.lastName || '',
        username: nextProfile.username || '',
      })

      setSaveTone('success')
      setSaveMessage('Datos guardados correctamente.')
    } catch (error) {
      setSaveTone('error')
      setSaveMessage(error.message || 'No pudimos guardar el perfil.')
    } finally {
      setIsSavingProfile(false)
    }
  }

  async function handleContactRequest(kind) {
    const setState = kind === 'email' ? setEmailChange : setPhoneChange
    const endpoint = kind === 'email' ? PROFILE_EMAIL_CHANGE_ENDPOINT : PROFILE_PHONE_CHANGE_ENDPOINT

    if (!publicSession?.token) {
      setState((currentValue) => ({
        ...currentValue,
        tone: 'error',
        message: 'Necesitas una sesión válida para iniciar este cambio.',
      }))
      return
    }

    setState((currentValue) => ({ ...currentValue, isBusy: true, message: '' }))

    try {
      const payload = await sendProfileRequest(`${endpoint}/change-request`, {
        method: 'POST',
        token: publicSession.token,
      })
      const data = payload.data || {}

      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        step: 'verify-current',
        verificationId: data.verificationId || '',
        maskedDestination: data.maskedEmail || data.maskedPhone || '',
        tone: 'info',
        message: `Enviamos un código al ${kind === 'email' ? 'email' : 'teléfono'} actual ${data.maskedEmail || data.maskedPhone || ''}.`,
      }))
    } catch (error) {
      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        tone: 'error',
        message: error.message,
      }))
    }
  }

  async function handleContactVerifyCurrent(kind) {
    const state = kind === 'email' ? emailChange : phoneChange
    const setState = kind === 'email' ? setEmailChange : setPhoneChange
    const endpoint = kind === 'email' ? PROFILE_EMAIL_CHANGE_ENDPOINT : PROFILE_PHONE_CHANGE_ENDPOINT

    setState((currentValue) => ({ ...currentValue, isBusy: true, message: '' }))

    try {
      await sendProfileRequest(`${endpoint}/verify-current`, {
        method: 'POST',
        token: publicSession.token,
        body: {
          verificationId: state.verificationId,
          code: state.currentCode.trim(),
        },
      })

      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        step: 'submit-new',
        currentCode: '',
        tone: 'info',
        message: `Ahora ingresá el nuevo ${kind === 'email' ? 'email' : 'teléfono'} que querés usar.`,
      }))
    } catch (error) {
      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        tone: 'error',
        message: error.message,
      }))
    }
  }

  async function handleContactSubmitNew(kind) {
    const state = kind === 'email' ? emailChange : phoneChange
    const setState = kind === 'email' ? setEmailChange : setPhoneChange
    const endpoint = kind === 'email' ? PROFILE_EMAIL_CHANGE_ENDPOINT : PROFILE_PHONE_CHANGE_ENDPOINT
    const payloadField = kind === 'email' ? 'newEmail' : 'newPhone'

    setState((currentValue) => ({ ...currentValue, isBusy: true, message: '' }))

    try {
      const payload = await sendProfileRequest(`${endpoint}/change`, {
        method: 'POST',
        token: publicSession.token,
        body: {
          verificationId: state.verificationId,
          [payloadField]: state.pendingValue.trim(),
        },
      })
      const data = payload.data || {}

      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        step: 'verify-new',
        nextVerificationId: data.verificationId || '',
        maskedDestination: data.maskedEmail || data.maskedPhone || '',
        tone: 'info',
        message: `Enviamos un código al nuevo ${kind === 'email' ? 'email' : 'teléfono'} ${data.maskedEmail || data.maskedPhone || ''}.`,
      }))
    } catch (error) {
      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        tone: 'error',
        message: error.message,
      }))
    }
  }

  async function handleContactVerifyNew(kind) {
    const state = kind === 'email' ? emailChange : phoneChange
    const setState = kind === 'email' ? setEmailChange : setPhoneChange
    const endpoint = kind === 'email' ? PROFILE_EMAIL_CHANGE_ENDPOINT : PROFILE_PHONE_CHANGE_ENDPOINT

    setState((currentValue) => ({ ...currentValue, isBusy: true, message: '' }))

    try {
      const payload = await sendProfileRequest(`${endpoint}/verify-new`, {
        method: 'POST',
        token: publicSession.token,
        body: {
          verificationId: state.nextVerificationId || state.verificationId,
          code: state.newCode.trim(),
        },
      })
      const nextUser = payload.data?.user || {}

      if (kind === 'email') {
        const previousEmail = publicSession?.email || profileForm.email
        const nextEmail = nextUser.email || state.pendingValue.trim()

        clearPublicEmailVerified(previousEmail)
        markPublicEmailVerified(nextEmail)

        setProfileForm((currentValue) => ({
          ...currentValue,
          email: nextEmail,
        }))
        setPublicSession({
          ...publicSession,
          email: nextEmail,
        })
      } else {
        const nextPhone = nextUser.phone || state.pendingValue.trim()

        setProfileForm((currentValue) => ({
          ...currentValue,
          phone: nextPhone,
        }))
        setPublicSession({
          ...publicSession,
          phone: nextPhone,
        })
      }

      setState({
        ...createContactChangeState(),
        step: 'completed',
        tone: 'success',
        message: payload.data?.message || payload.message || `${kind === 'email' ? 'Email' : 'Teléfono'} actualizado correctamente.`,
      })
    } catch (error) {
      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        tone: 'error',
        message: error.message,
      }))
    }
  }

  async function handleContactCancel(kind) {
    const state = kind === 'email' ? emailChange : phoneChange
    const setState = kind === 'email' ? setEmailChange : setPhoneChange
    const endpoint = kind === 'email' ? PROFILE_EMAIL_CHANGE_ENDPOINT : PROFILE_PHONE_CHANGE_ENDPOINT

    if (!state.verificationId) {
      setState(createContactChangeState())
      return
    }

    setState((currentValue) => ({ ...currentValue, isBusy: true }))

    try {
      await sendProfileRequest(`${endpoint}/cancel`, {
        method: 'POST',
        token: publicSession.token,
        body: {
          verificationId: state.verificationId,
        },
      })
      setState(createContactChangeState())
    } catch (error) {
      setState((currentValue) => ({
        ...currentValue,
        isBusy: false,
        tone: 'error',
        message: error.message,
      }))
    }
  }

  function handleContactFieldChange(kind, field, value) {
    const setState = kind === 'email' ? setEmailChange : setPhoneChange

    setState((currentValue) => ({
      ...currentValue,
      [field]: value,
      message: currentValue.tone === 'error' ? '' : currentValue.message,
      tone: currentValue.tone === 'error' ? 'info' : currentValue.tone,
    }))
  }

  return (
    <main className="container">
      <section className="lixmar-profile">
        {/* Sidebar */}
        <aside className="lixmar-profile__sidebar">
          <h5 className="lixmar-profile__name">{profileName}</h5>
          <p className="lixmar-profile__email">{profileEmail}</p>
          <span className={`lixmar-profile__email-status${emailVerified ? ' lixmar-profile__email-status--verified' : ''}`}>
            {emailVerified ? 'Email verificado' : 'Email pendiente de verificación'}
          </span>

          <nav className="lixmar-profile__tabs">
            {tabs.map(tab => (
              <a
                href="#"
                className={`lixmar-profile__tab${activeTab === tab.id ? ' lixmar-profile__tab--active' : ''}`}
                key={tab.id}
                onClick={(e) => { e.preventDefault(); setActiveTab(tab.id); }}
              >
                <span>{tab.label}</span>
                <span className="lixmar-profile__tab-arrow"><FaChevronRight size={12} /></span>
              </a>
            ))}
          </nav>
        </aside>

        {/* Main Content */}
        <div className="lixmar-profile__content">
          <div className={`lixmar-profile__notice${emailVerified ? ' lixmar-profile__notice--verified' : ''}`}>
            <strong>{emailVerified ? 'Cuenta lista para ingresar' : 'Verificación pendiente'}</strong>
            <p>
              {emailVerified
                ? 'Tu email ya fue confirmado y tu cuenta quedó habilitada para usar el marketplace.'
                : 'Todavía necesitamos confirmar tu email para completar el alta de la cuenta.'}
            </p>
          </div>

          <h4 className="lixmar-profile__title">Informacion Personal</h4>

          {isLoadingProfile ? <p className="lixmar-profile__save-message">Cargando datos del perfil...</p> : null}
          {!isLoadingProfile && saveMessage ? <p className={`lixmar-profile__save-message lixmar-profile__save-message--${saveTone}`}>{saveMessage}</p> : null}

          <form className="lixmar-profile__form" onSubmit={handleSubmit}>
            <div className="lixmar-profile__row">
              <div className="lixmar-profile__field">
                <label className="lixmar-profile__label" htmlFor="profName">Nombre <span className="lixmar-profile__required">*</span></label>
                <input type="text" id="profName" name="firstName" className="lixmar-profile__input" value={profileForm.firstName} onChange={handleFieldChange} />
              </div>
              <div className="lixmar-profile__field">
                <label className="lixmar-profile__label" htmlFor="profLastname">Apellido <span className="lixmar-profile__required">*</span></label>
                <input type="text" id="profLastname" name="lastName" className="lixmar-profile__input" value={profileForm.lastName} onChange={handleFieldChange} />
              </div>
            </div>

            <div className="lixmar-profile__field">
              <div className="lixmar-profile__field-head">
                <label className="lixmar-profile__label" htmlFor="profEmail">Correo electronico <span className="lixmar-profile__required">*</span></label>
                <button type="button" className="lixmar-profile__change-trigger" onClick={() => handleContactRequest('email')} disabled={emailChange.isBusy || isLoadingProfile || !publicSession?.token || emailChange.step !== 'idle'}>
                  {emailChange.step === 'idle' ? 'Cambiar email' : 'Cambio en curso'}
                </button>
              </div>
              <input type="email" id="profEmail" name="email" className="lixmar-profile__input lixmar-profile__input--readonly" value={profileForm.email} readOnly />
              <p className="lixmar-profile__field-hint">El backend exige verificar primero el email actual y luego confirmar el nuevo.</p>
              <ContactChangePanel
                kind="email"
                valueLabel="Nuevo email"
                valuePlaceholder="nuevo@email.com"
                valueType="email"
                state={emailChange}
                onCurrentCodeChange={(value) => handleContactFieldChange('email', 'currentCode', value)}
                onPendingValueChange={(value) => handleContactFieldChange('email', 'pendingValue', value)}
                onNewCodeChange={(value) => handleContactFieldChange('email', 'newCode', value)}
                onVerifyCurrent={() => handleContactVerifyCurrent('email')}
                onSubmitNew={() => handleContactSubmitNew('email')}
                onVerifyNew={() => handleContactVerifyNew('email')}
                onCancel={() => handleContactCancel('email')}
              />
            </div>

            <div className="lixmar-profile__field">
              <div className="lixmar-profile__field-head">
                <label className="lixmar-profile__label" htmlFor="profPhone">Numero de telefono <span className="lixmar-profile__optional">(Opcional)</span></label>
                <button type="button" className="lixmar-profile__change-trigger" onClick={() => handleContactRequest('phone')} disabled={phoneChange.isBusy || isLoadingProfile || !publicSession?.token || phoneChange.step !== 'idle'}>
                  {phoneChange.step === 'idle' ? 'Cambiar telefono' : 'Cambio en curso'}
                </button>
              </div>
              <input type="tel" id="profPhone" name="phone" className="lixmar-profile__input lixmar-profile__input--readonly" value={profileForm.phone} readOnly />
              <p className="lixmar-profile__field-hint">El backend exige formato internacional, por ejemplo +5491123456789.</p>
              <ContactChangePanel
                kind="phone"
                valueLabel="Nuevo telefono"
                valuePlaceholder="+5491123456789"
                valueType="tel"
                state={phoneChange}
                onCurrentCodeChange={(value) => handleContactFieldChange('phone', 'currentCode', value)}
                onPendingValueChange={(value) => handleContactFieldChange('phone', 'pendingValue', value)}
                onNewCodeChange={(value) => handleContactFieldChange('phone', 'newCode', value)}
                onVerifyCurrent={() => handleContactVerifyCurrent('phone')}
                onSubmitNew={() => handleContactSubmitNew('phone')}
                onVerifyNew={() => handleContactVerifyNew('phone')}
                onCancel={() => handleContactCancel('phone')}
              />
            </div>

            <button type="submit" className="lixmar-profile__save" disabled={isSavingProfile || isLoadingProfile}>
              {isSavingProfile ? 'GUARDANDO...' : 'GUARDAR'}
            </button>
          </form>
        </div>
      </section>
    </main>
  )
}

function createContactChangeState() {
  return {
    step: 'idle',
    verificationId: '',
    nextVerificationId: '',
    maskedDestination: '',
    currentCode: '',
    pendingValue: '',
    newCode: '',
    message: '',
    tone: 'info',
    isBusy: false,
  }
}

async function sendProfileRequest(url, { method, token, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  })

  const payload = await response.json().catch(() => ({}))

  if (!response.ok || payload?.success === false) {
    throw new Error(getProfileErrorMessage(payload, 'No pudimos completar la operación.'))
  }

  return payload
}

function getProfileErrorMessage(payload, fallbackMessage) {
  if (payload?.errors) {
    const firstError = Object.values(payload.errors).flat().find(Boolean)

    if (typeof firstError === 'string') {
      return firstError
    }
  }

  if (typeof payload?.error === 'string') {
    return payload.error
  }

  if (typeof payload?.error?.message === 'string') {
    return payload.error.message
  }

  if (typeof payload?.message === 'string') {
    return payload.message
  }

  return fallbackMessage
}

function ContactChangePanel({
  kind,
  valueLabel,
  valuePlaceholder,
  valueType,
  state,
  onCurrentCodeChange,
  onPendingValueChange,
  onNewCodeChange,
  onVerifyCurrent,
  onSubmitNew,
  onVerifyNew,
  onCancel,
}) {
  if (state.step === 'idle') {
    return null
  }

  return (
    <div className={`lixmar-profile__change-card lixmar-profile__change-card--${state.tone}`}>
      <div className="lixmar-profile__change-header">
        <strong className="lixmar-profile__change-title">
          {kind === 'email' ? 'Cambio de email' : 'Cambio de telefono'}
        </strong>
        <span className="lixmar-profile__change-step">{getContactStepLabel(state.step)}</span>
      </div>

      {state.message ? <p className="lixmar-profile__change-text">{state.message}</p> : null}
      {state.maskedDestination ? <p className="lixmar-profile__change-hint">Destino actual: {state.maskedDestination}</p> : null}
      {state.step !== 'completed' ? <p className="lixmar-profile__change-hint">En desarrollo podés usar el código 12345.</p> : null}

      {state.step === 'verify-current' ? (
        <>
          <input type="text" inputMode="numeric" maxLength={5} className="lixmar-profile__input" value={state.currentCode} onChange={(event) => onCurrentCodeChange(event.target.value)} placeholder="Código actual de 5 dígitos" />
          <div className="lixmar-profile__change-actions">
            <button type="button" className="lixmar-profile__change-button" onClick={onVerifyCurrent} disabled={state.isBusy || state.currentCode.trim().length !== 5}>Verificar codigo</button>
            <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel} disabled={state.isBusy}>Cancelar</button>
          </div>
        </>
      ) : null}

      {state.step === 'submit-new' ? (
        <>
          <input type={valueType} className="lixmar-profile__input" value={state.pendingValue} onChange={(event) => onPendingValueChange(event.target.value)} placeholder={valuePlaceholder} />
          <div className="lixmar-profile__change-actions">
            <button type="button" className="lixmar-profile__change-button" onClick={onSubmitNew} disabled={state.isBusy || !state.pendingValue.trim()}>{valueLabel}</button>
            <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel} disabled={state.isBusy}>Cancelar</button>
          </div>
        </>
      ) : null}

      {state.step === 'verify-new' ? (
        <>
          <input type="text" inputMode="numeric" maxLength={5} className="lixmar-profile__input" value={state.newCode} onChange={(event) => onNewCodeChange(event.target.value)} placeholder="Código final de 5 dígitos" />
          <div className="lixmar-profile__change-actions">
            <button type="button" className="lixmar-profile__change-button" onClick={onVerifyNew} disabled={state.isBusy || state.newCode.trim().length !== 5}>Confirmar cambio</button>
            <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel} disabled={state.isBusy}>Cancelar</button>
          </div>
        </>
      ) : null}

      {state.step === 'completed' ? (
        <div className="lixmar-profile__change-actions">
          <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel}>Cerrar</button>
        </div>
      ) : null}
    </div>
  )
}

function getContactStepLabel(step) {
  switch (step) {
    case 'verify-current':
      return 'Paso 1 de 3'
    case 'submit-new':
      return 'Paso 2 de 3'
    case 'verify-new':
      return 'Paso 3 de 3'
    case 'completed':
      return 'Completado'
    default:
      return ''
  }
}
