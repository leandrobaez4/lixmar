import { useEffect, useState } from 'react'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { verifyPublicSession } from './publicSession'

export default function RequirePublicSession() {
  const location = useLocation()
  const [verifiedPath, setVerifiedPath] = useState(null)

  useEffect(() => {
    const controller = new AbortController()
    setVerifiedPath(null)
    verifyPublicSession(controller.signal).then((valid) => {
      if (!controller.signal.aborted) setVerifiedPath(valid ? location.pathname : false)
    })
    return () => controller.abort()
  }, [location.pathname])

  if (verifiedPath === false) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (verifiedPath !== location.pathname) return null

  return <Outlet />
}
