import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { getPublicSession, verifyPublicSession } from './publicSession'

export default function RequirePublicSession() {
  const location = useLocation()
  const [verified, setVerified] = useState(() => Boolean(getPublicSession()))

  useEffect(() => {
    if (getPublicSession()) {
      setVerified(true)
      return undefined
    }

    const controller = new AbortController()
    verifyPublicSession(controller.signal).then((valid) => {
      if (!controller.signal.aborted) setVerified(valid)
    })
    return () => controller.abort()
  }, [])

  if (verified === false) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (verified !== true) return null

  return <Outlet />
}
