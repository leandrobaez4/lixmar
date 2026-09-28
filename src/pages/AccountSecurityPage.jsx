import { useEffect, useState } from 'react'
import { accountRequest } from '@/account/accountApi'

export default function AccountSecurityPage() {
  const [status, setStatus] = useState(null)
  const [passwords, setPasswords] = useState({ currentPassword: '', newPassword: '' })
  const [editing, setEditing] = useState(false)
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    accountRequest('/security/status', { signal: controller.signal }).then((payload) => {
      if (!controller.signal.aborted) setStatus(payload.data)
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [])

  async function changePassword(event) {
    event.preventDefault()
    setBusy(true)
    setError('')
    setMessage('')
    try {
      await accountRequest('/auth/change-password', {
        method: 'POST', body: JSON.stringify(passwords),
      })
      setPasswords({ currentPassword: '', newPassword: '' })
      setEditing(false)
      setMessage('Contraseña actualizada correctamente.')
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="lixmar-account-panel" aria-labelledby="account-security-title">
    <header className="lixmar-account__heading"><h1 id="account-security-title">Seguridad</h1><p>Protegé tu cuenta y revisá las opciones de acceso.</p></header>
    {loading ? <p className="lixmar-account__status" role="status">Cargando seguridad…</p> : null}
    {error ? <p className="lixmar-account__status lixmar-account__status--error" role="alert">{error}</p> : null}
    {message ? <p className="lixmar-account__status" role="status">{message}</p> : null}

    <article className="lixmar-account__card">
      <h2>Contraseña</h2><p>Elegí una contraseña nueva para proteger tu cuenta.</p>
      {editing ? <form className="lixmar-account__edit-form" onSubmit={changePassword}>
        <div className="lixmar-account__form-row">
          <label>Contraseña actual<input type="password" autoComplete="current-password" required value={passwords.currentPassword} onChange={(event) => setPasswords({ ...passwords, currentPassword: event.target.value })} /></label>
          <label>Contraseña nueva<input type="password" autoComplete="new-password" required minLength={8} value={passwords.newPassword} onChange={(event) => setPasswords({ ...passwords, newPassword: event.target.value })} /></label>
        </div>
        <div className="lixmar-account__actions">
          <button className="lixmar-account__button" type="submit" disabled={busy}>{busy ? 'Guardando…' : 'Guardar contraseña'}</button>
          <button className="lixmar-account__button lixmar-account__button--secondary" type="button" onClick={() => setEditing(false)} disabled={busy}>Cancelar</button>
        </div>
      </form> : <button className="lixmar-account__button" type="button" onClick={() => setEditing(true)}>Cambiar contraseña</button>}
    </article>

    <article className="lixmar-account__card">
      <h2>Verificación en dos pasos</h2>
      <p>{status?.twoFactorEnabled ? 'Activada en tu cuenta.' : 'La activación para el acceso web estará disponible cuando se complete el flujo de verificación de inicio de sesión.'}</p>
    </article>
    <article className="lixmar-account__card"><h2>Sesiones activas</h2><p>La consulta y el cierre de sesiones de otros dispositivos todavía no están disponibles en el sitio.</p></article>
  </section>
}
