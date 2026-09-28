import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'

export default function ResetPasswordPage() {
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const email = params.get('email') || ''
  const [validating, setValidating] = useState(true)
  const [valid, setValid] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [validationRetry, setValidationRetry] = useState(0)
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)

  useEffect(() => {
    if (!token || !email) { setValidating(false); setValid(false); return undefined }
    const controller = new AbortController()
    setValidating(true)
    setValidationError('')
    fetch(`/api/v1/auth/validate-reset-token?${new URLSearchParams({ token, email })}`, {
      headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal,
    }).then((response) => {
      if (controller.signal.aborted) return
      if (response.status === 422) { setValid(false); return }
      if (!response.ok) throw new Error(response.status === 429 ? 'Demasiados intentos. Probá más tarde.' : 'No pudimos validar el enlace. Revisá tu conexión.')
      setValid(true)
    }).catch((failure) => {
      if (!controller.signal.aborted) setValidationError(failure.message || 'No pudimos validar el enlace. Revisá tu conexión.')
    }).finally(() => {
      if (!controller.signal.aborted) setValidating(false)
    })
    return () => controller.abort()
  }, [token, email, validationRetry])

  async function handleSubmit(event) {
    event.preventDefault()
    setError('')
    if (password !== confirmation) { setError('Las contraseñas no coinciden.'); return }
    setBusy(true)
    try {
      const response = await fetch('/api/v1/auth/reset-password-email', {
        method: 'POST', credentials: 'same-origin',
        headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, email, password, password_confirmation: confirmation }),
      })
      const payload = await response.json().catch(() => ({}))
      if (!response.ok) throw new Error(response.status === 429 ? 'Demasiados intentos. Probá más tarde.' : payload.error || payload.message || 'No pudimos restablecer la contraseña.')
      setDone(true)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <main className="container"><section className="lixmar-login lixmar-login--modern">
    <div className="lixmar-login__form-shell"><div className="lixmar-login__form lixmar-login__form--modern">
      <h1 className="lixmar-login__title">Restablecer contraseña</h1>
      {validating && <p role="status">Validando enlace…</p>}
      {!validating && validationError && <div role="alert"><p>{validationError}</p><button type="button" onClick={() => setValidationRetry((value) => value + 1)}>Reintentar</button></div>}
      {!validating && !valid && !validationError && <p role="alert">El enlace no es válido o venció. <Link to="/recuperar-contrasena">Solicitar otro enlace</Link></p>}
      {done && <p role="status">Contraseña actualizada. <Link to="/login">Ingresar</Link></p>}
      {error && <p role="alert">{error}</p>}
      {!validating && valid && !done && <form onSubmit={handleSubmit}>
        <label className="lixmar-login__label" htmlFor="new-password">Nueva contraseña</label>
        <input id="new-password" className="lixmar-login__input" type="password" required minLength="8" autoComplete="new-password" value={password} onChange={(event) => setPassword(event.target.value)} />
        <label className="lixmar-login__label" htmlFor="confirm-password">Confirmar contraseña</label>
        <input id="confirm-password" className="lixmar-login__input" type="password" required minLength="8" autoComplete="new-password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} />
        <button className="lixmar-login__submit lixmar-login__submit--wide" type="submit" disabled={busy}>{busy ? 'GUARDANDO...' : 'GUARDAR CONTRASEÑA'}</button>
      </form>}
    </div></div>
  </section></main>
}
