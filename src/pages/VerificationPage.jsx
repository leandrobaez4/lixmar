import { useEffect, useState } from 'react'
import { Link, Navigate } from 'react-router-dom'
import { clearPublicSession } from '@/auth/publicSession'

export default function VerificationPage() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [expired, setExpired] = useState(false)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    fetch('/api/v1/profile', {
      headers: { Accept: 'application/json' }, credentials: 'same-origin', signal: controller.signal,
    }).then(async (response) => {
      if (response.status === 401 || response.status === 403) {
        clearPublicSession()
        setExpired(true)
        return
      }
      const payload = await response.json().catch(() => ({}))
      if (!response.ok || !payload.data) throw new Error(payload.message || 'No pudimos consultar tu verificación.')
      if (!controller.signal.aborted) setProfile(payload.data)
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [retry])

  if (expired) return <Navigate to="/login" replace />

  return <section className="lixmar-account-panel" aria-labelledby="account-verification-title">
    <header className="lixmar-account__heading"><h1 id="account-verification-title">Verificación de identidad</h1><p>Necesaria para generar confianza y habilitar operaciones como vendedor.</p></header>
    {loading ? <p className="lixmar-account__status" role="status">Consultando tu cuenta…</p> : null}
    {error ? <div className="lixmar-account__status lixmar-account__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div> : null}
    {profile && !loading ? <>
      <article className="lixmar-account__card"><h2>Paso 1 · Documento</h2><p>La carga del frente y dorso de tu DNI estará disponible cuando se habilite la verificación desde el sitio.</p></article>
      <article className="lixmar-account__card"><h2>Paso 2 · Validación</h2><p>Revisaremos que los datos coincidan con tu cuenta una vez que puedas cargar tu documento.</p></article>
      <article className="lixmar-account__card"><h2>Estado</h2><p>Email: {profile.emailVerifiedAt ? 'verificado' : 'pendiente'} · Teléfono: {profile.phoneVerifiedAt ? 'verificado' : 'pendiente'}. La verificación de documento aún no está disponible.</p></article>
    </> : null}
    <Link className="lixmar-account__back" to="/perfil">Volver al perfil</Link>
  </section>
}
