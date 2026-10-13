import { useEffect, useState } from 'react'
import { Navigate, Outlet } from 'react-router-dom'
import { getPublicSession, verifyPublicSession } from './publicSession'

export default function RequireAnonymousSession() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => (
    getPublicSession() ? true : null
  ))

  useEffect(() => {
    if (isAuthenticated !== null) return undefined

    const controller = new AbortController()
    verifyPublicSession(controller.signal).then((valid) => {
      if (!controller.signal.aborted) setIsAuthenticated(valid)
    })

    return () => controller.abort()
  }, [isAuthenticated])

  if (isAuthenticated === null) return null
  if (isAuthenticated) return <Navigate to="/" replace />

  return <Outlet />
}
