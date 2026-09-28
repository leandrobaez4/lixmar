import { useEffect, useState } from 'react'
import { accountRequest } from '@/account/accountApi'

const sections = [
  { category: 'transactional', title: 'Compras', description: 'Estado de pedidos, entregas y pagos.', locked: true },
  { category: 'system', title: 'Mensajes y avisos', description: 'Novedades importantes de tu cuenta.' },
  { category: 'marketing', title: 'Promociones', description: 'Ofertas y novedades de LIXMAR.' },
]

export default function AccountNotificationsPage() {
  const [preferences, setPreferences] = useState({})
  const [loading, setLoading] = useState(true)
  const [busy, setBusy] = useState('')
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    accountRequest('/notifications/preferences', { signal: controller.signal }).then((payload) => {
      if (controller.signal.aborted) return
      setPreferences(Object.fromEntries((payload.data || []).map((entry) => [entry.category, entry])))
      setError('')
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [retry])

  async function toggleEmail(category) {
    const current = preferences[category]
    const nextEmail = !Boolean(current?.channels?.email)
    setBusy(category)
    setError('')
    setMessage('')
    try {
      await accountRequest('/notifications/preferences', {
        method: 'PUT',
        body: JSON.stringify({ preferences: { [category]: { ...current?.channels, email: nextEmail } } }),
      })
      setMessage(nextEmail ? 'Avisos por email activados.' : 'Avisos por email desactivados.')
      setRetry((value) => value + 1)
    } catch (failure) {
      setError(failure.message)
    } finally {
      setBusy('')
    }
  }

  return <section className="lixmar-account-panel" aria-labelledby="account-notifications-title">
    <header className="lixmar-account__heading"><h1 id="account-notifications-title">Notificaciones</h1><p>Elegí qué novedades querés recibir y por qué canal.</p></header>
    {loading ? <p className="lixmar-account__status" role="status">Cargando preferencias…</p> : null}
    {error ? <p className="lixmar-account__status lixmar-account__status--error" role="alert">{error}</p> : null}
    {message ? <p className="lixmar-account__status" role="status">{message}</p> : null}
    {!loading ? sections.map(({ category, title, description, locked }) => <article className="lixmar-account__card" key={category}>
      <h2>{title}</h2><p>{description}</p>
      {locked ? <span className="lixmar-account__preference-state">Avisos esenciales siempre activados</span> : <button
        className="lixmar-account__button"
        type="button"
        disabled={Boolean(busy)}
        onClick={() => toggleEmail(category)}
        aria-pressed={Boolean(preferences[category]?.channels?.email)}
      >{busy === category ? 'Guardando…' : preferences[category]?.channels?.email ? 'Desactivar email' : 'Activar email'}</button>}
    </article>) : null}
  </section>
}
