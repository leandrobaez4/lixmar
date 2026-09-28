import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'

export default function RequireSellerPublication() {
  const location = useLocation()
  const [eligibility, setEligibility] = useState(null)
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setEligibility(null)

    fetch('/api/v1/billing/publication-eligibility', {
      headers: { Accept: 'application/json' },
      credentials: 'same-origin',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (response.status === 401 || response.status === 403) return { reason: 'SESSION_EXPIRED' }
        if (!response.ok) throw new Error('Eligibility unavailable')
        const payload = await response.json()
        return payload.data
      })
      .then((data) => {
        if (!controller.signal.aborted) setEligibility(data || { reason: 'UNAVAILABLE' })
      })
      .catch(() => {
        if (!controller.signal.aborted) setEligibility({ reason: 'UNAVAILABLE' })
      })

    return () => controller.abort()
  }, [location.pathname, retry])

  if (!eligibility) return null
  if (eligibility.reason === 'SESSION_EXPIRED') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  if (eligibility.reason === 'UNAVAILABLE') {
    return <p role="alert">No pudimos verificar tu plan. <button type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></p>
  }
  if (!eligibility.can_publish) {
    return <Navigate to="/suscripcion" replace state={{ reason: eligibility.reason }} />
  }

  return <Outlet context={eligibility} />
}
