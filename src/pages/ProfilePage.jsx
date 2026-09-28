import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { clearPublicSession, getPublicSession, setPublicSession } from '@/auth/publicSession'

const PROFILE_ENDPOINT = '/api/v1/profile'
const PROFILE_EMAIL_CHANGE_ENDPOINT = '/api/v1/profile/email'
const PROFILE_PHONE_CHANGE_ENDPOINT = '/api/v1/profile/phone'

export default function ProfilePage() {
  const publicSession = getPublicSession()
  const [firstName = '', ...lastNameParts] = (publicSession?.name?.trim() || '').split(/\s+/)
  const [profileForm, setProfileForm] = useState(() => ({
    firstName,
    lastName: lastNameParts.join(' '),
    email: publicSession?.email || '',
    phone: publicSession?.phone || '',
  }))
  const [saveMessage, setSaveMessage] = useState('')
  const [saveTone, setSaveTone] = useState('success')
  const [isLoadingProfile, setIsLoadingProfile] = useState(Boolean(publicSession))
  const [isSavingProfile, setIsSavingProfile] = useState(false)
  const [isEditingName, setIsEditingName] = useState(false)
  const [emailChange, setEmailChange] = useState(createContactChangeState)
  const [phoneChange, setPhoneChange] = useState(createContactChangeState)
  const [sessionExpired, setSessionExpired] = useState(false)
  const profileName = publicSession?.name?.trim() || [profileForm.firstName, profileForm.lastName].filter(Boolean).join(' ').trim()
  const profileEmail = publicSession?.email || profileForm.email
  const emailVerified = Boolean(publicSession?.emailVerifiedAt)
  const sessionId = publicSession?.id

  useEffect(() => {
    if (!sessionId) {
      setIsLoadingProfile(false)
      return () => {}
    }

    const abortController = new AbortController()

    async function loadProfile() {
      try {
        setIsLoadingProfile(true)
        const currentSession = getPublicSession()

        const response = await fetch(PROFILE_ENDPOINT, {
          headers: { Accept: 'application/json' },
          credentials: 'same-origin',
          signal: abortController.signal,
        })

        const payload = await response.json().catch(() => ({}))

        if (response.status === 401 || response.status === 403) {
          clearPublicSession()
          setSessionExpired(true)
          return
        }

        if (!response.ok || !payload?.data) {
          setSaveTone('error')
          setSaveMessage(payload?.message || 'No pudimos cargar tu perfil real.')
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
          verified: nextProfile.verified,
          emailVerifiedAt: nextProfile.emailVerifiedAt,
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
          setSaveMessage('No pudimos cargar tu perfil real.')
        }
      } finally {
        setIsLoadingProfile(false)
      }
    }

    loadProfile()

    return () => {
      abortController.abort()
    }
  }, [sessionId])

  if (!publicSession || sessionExpired) {
    return <Navigate to="/login" replace />
  }

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

    setIsSavingProfile(true)

    try {
      const response = await fetch(PROFILE_ENDPOINT, {
        method: 'PUT',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        credentials: 'same-origin',
        body: JSON.stringify({
          firstName: profileForm.firstName.trim(),
          lastName: profileForm.lastName.trim(),
          name: nextName,
        }),
      })

      const payload = await response.json().catch(() => ({}))

      if (response.status === 401 || response.status === 403) {
        clearPublicSession()
        setSessionExpired(true)
        return
      }

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
      setIsEditingName(false)
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

    setState((currentValue) => ({ ...currentValue, isBusy: true, message: '' }))

    try {
      const payload = await sendProfileRequest(`${endpoint}/change-request`, {
        method: 'POST',
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
        body: {
          verificationId: state.nextVerificationId || state.verificationId,
          code: state.newCode.trim(),
        },
      })
      const nextUser = payload.data?.user || {}

      if (kind === 'email') {
        const nextEmail = nextUser.email || state.pendingValue.trim()

        setProfileForm((currentValue) => ({
          ...currentValue,
          email: nextEmail,
          emailVerifiedAt: nextUser.emailVerifiedAt || null,
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
    <section className="lixmar-account-panel" aria-labelledby="account-personal-title">
      <header className="lixmar-account__heading">
        <h1 id="account-personal-title">Datos personales</h1>
        <p>Administrá la información principal de tu cuenta.</p>
      </header>

      {isLoadingProfile ? <p className="lixmar-account__status" role="status">Cargando datos del perfil...</p> : null}
      {!isLoadingProfile && saveMessage ? <p className={'lixmar-account__status lixmar-account__status--' + saveTone} role={saveTone === 'error' ? 'alert' : 'status'}>{saveMessage}</p> : null}

      <article className="lixmar-account__card">
        <h2>Nombre y apellido</h2>
        <p>{profileName || 'Todavía no registraste tu nombre.'}</p>
        {isEditingName ? (
          <form className="lixmar-account__edit-form" onSubmit={handleSubmit}>
            <div className="lixmar-account__form-row">
              <label>Nombre
                <input name="firstName" value={profileForm.firstName} onChange={handleFieldChange} required autoComplete="given-name" />
              </label>
              <label>Apellido
                <input name="lastName" value={profileForm.lastName} onChange={handleFieldChange} required autoComplete="family-name" />
              </label>
            </div>
            <div className="lixmar-account__actions">
              <button className="lixmar-account__button" type="submit" disabled={isSavingProfile || isLoadingProfile}>{isSavingProfile ? 'Guardando…' : 'Guardar datos'}</button>
              <button className="lixmar-account__button lixmar-account__button--secondary" type="button" onClick={() => setIsEditingName(false)} disabled={isSavingProfile}>Cancelar</button>
            </div>
          </form>
        ) : <button className="lixmar-account__button" type="button" onClick={() => setIsEditingName(true)} disabled={isLoadingProfile}>Editar datos</button>}
      </article>

      <article className="lixmar-account__card">
        <h2>Email</h2>
        <p>{profileEmail || 'Sin email'} · {emailVerified ? 'Verificado' : 'Pendiente de verificación'}</p>
        <button className="lixmar-account__button" type="button" onClick={() => handleContactRequest('email')} disabled={emailChange.isBusy || isLoadingProfile || emailChange.step !== 'idle'}>Cambiar email</button>
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
      </article>

      <article className="lixmar-account__card">
        <h2>Teléfono</h2>
        <p>{profileForm.phone || 'Todavía no registraste un teléfono.'}</p>
        <button className="lixmar-account__button" type="button" onClick={() => handleContactRequest('phone')} disabled={phoneChange.isBusy || isLoadingProfile || phoneChange.step !== 'idle'}>Editar teléfono</button>
        <ContactChangePanel
          kind="phone"
          valueLabel="Nuevo teléfono"
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
      </article>

      <article className="lixmar-account__card">
        <h2>Datos fiscales</h2>
        <p>DNI / CUIT y datos de facturación · Disponible próximamente</p>
        <button className="lixmar-account__button" type="button" disabled>Configurar</button>
      </article>
    </section>
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

async function sendProfileRequest(url, { method, body }) {
  const response = await fetch(url, {
    method,
    headers: {
      Accept: 'application/json',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
    },
    credentials: 'same-origin',
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

      {state.message ? <p className="lixmar-profile__change-text" role={state.tone === 'error' ? 'alert' : 'status'}>{state.message}</p> : null}
      {state.maskedDestination ? <p className="lixmar-profile__change-hint">Destino actual: {state.maskedDestination}</p> : null}

      {state.step === 'verify-current' ? (
        <>
          <input type="text" inputMode="numeric" maxLength={5} className="lixmar-profile__input" value={state.currentCode} onChange={(event) => onCurrentCodeChange(event.target.value)} placeholder="Código actual de 5 dígitos" aria-label="Código actual de 5 dígitos" />
          <div className="lixmar-profile__change-actions">
            <button type="button" className="lixmar-profile__change-button" onClick={onVerifyCurrent} disabled={state.isBusy || state.currentCode.trim().length !== 5}>Verificar codigo</button>
            <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel} disabled={state.isBusy}>Cancelar</button>
          </div>
        </>
      ) : null}

      {state.step === 'submit-new' ? (
        <>
          <input type={valueType} className="lixmar-profile__input" value={state.pendingValue} onChange={(event) => onPendingValueChange(event.target.value)} placeholder={valuePlaceholder} aria-label={valuePlaceholder} />
          <div className="lixmar-profile__change-actions">
            <button type="button" className="lixmar-profile__change-button" onClick={onSubmitNew} disabled={state.isBusy || !state.pendingValue.trim()}>{valueLabel}</button>
            <button type="button" className="lixmar-profile__change-button lixmar-profile__change-button--ghost" onClick={onCancel} disabled={state.isBusy}>Cancelar</button>
          </div>
        </>
      ) : null}

      {state.step === 'verify-new' ? (
        <>
          <input type="text" inputMode="numeric" maxLength={5} className="lixmar-profile__input" value={state.newCode} onChange={(event) => onNewCodeChange(event.target.value)} placeholder="Código final de 5 dígitos" aria-label="Código final de 5 dígitos" />
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
