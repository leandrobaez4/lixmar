import { useEffect, useRef, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBars, FaChevronDown, FaXmark } from 'react-icons/fa6'
import CategoriesMenu from './CategoriesMenu'
import { getPublicSession, logoutPublicSession, subscribeToPublicSession, verifyPublicSession } from '@/auth/publicSession'
import { clearPublicCart, fetchPublicCart, getPublicCartCount, subscribeToPublicCart } from '@/cart/publicCart'
import '@/scss/components/layout/Header.scss'

export default function Header() {
  const navigate = useNavigate()
  const [publicSession, setPublicSession] = useState(() => getPublicSession())
  const [cartItemsCount, setCartItemsCount] = useState(() => getPublicCartCount())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [isAccountMenuOpen, setIsAccountMenuOpen] = useState(false)
  const accountMenuRef = useRef(null)
  const accountTriggerRef = useRef(null)
  const mobileTriggerRef = useRef(null)
  const [openMobileSection, setOpenMobileSection] = useState('explore')
  const [searchTerm, setSearchTerm] = useState('')
  const [logoutError, setLogoutError] = useState('')
  const [isLoggingOut, setIsLoggingOut] = useState(false)
  const userDisplayName = publicSession?.name?.trim() || publicSession?.email || 'Mi cuenta'
  const accountGreeting = publicSession?.name?.trim()
    ? `Hola, ${publicSession.name.trim().split(/\s+/)[0]}`
    : 'Mi cuenta'

  const handleLogout = async () => {
    if (isLoggingOut) return
    setIsLoggingOut(true)
    setLogoutError('')
    const loggedOut = await logoutPublicSession()
    setIsLoggingOut(false)
    if (loggedOut) {
      setIsMobileMenuOpen(false)
      setIsAccountMenuOpen(false)
      navigate('/')
    } else {
      setLogoutError('No se pudo cerrar la sesión en el servidor. Inténtalo nuevamente.')
    }
  }

  const handleMobileNavigate = () => {
    setIsMobileMenuOpen(false)
  }

  const toggleMobileSection = (section) => {
    setOpenMobileSection((currentValue) => (currentValue === section ? '' : section))
  }

  const handleSearchSubmit = (event) => {
    event.preventDefault()

    const normalizedTerm = searchTerm.trim()
    navigate(normalizedTerm ? `/buscar?q=${encodeURIComponent(normalizedTerm)}` : '/buscar')
    setIsMobileMenuOpen(false)
  }

  useEffect(() => {
    const unsubscribe = subscribeToPublicSession(() => {
      const session = getPublicSession()
      setPublicSession(session)
      clearPublicCart()
      if (session) fetchPublicCart().catch(clearPublicCart)
    })
    const controller = new AbortController()
    verifyPublicSession(controller.signal)
    return () => {
      controller.abort()
      unsubscribe()
    }
  }, [])

  useEffect(() => {
    return subscribeToPublicCart(() => {
      setCartItemsCount(getPublicCartCount())
    })
  }, [])

  useEffect(() => {
    if (!isAccountMenuOpen) return undefined
    const handlePointerDown = (event) => {
      if (!accountMenuRef.current?.contains(event.target)) setIsAccountMenuOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsAccountMenuOpen(false)
        accountTriggerRef.current?.focus()
      }
    }
    document.addEventListener('pointerdown', handlePointerDown)
    document.addEventListener('keydown', handleKeyDown)
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isAccountMenuOpen])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return () => {}
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsMobileMenuOpen(false)
        mobileTriggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isMobileMenuOpen])

  return (
    <header className="header-ml">
      <div className="header-ml__container">
        <div className="header-ml__top">
          <Link to="/" className="header-ml__logo">
            LIXMAR
          </Link>
          
          <form className="header-ml__search" onSubmit={handleSearchSubmit} role="search">
            <span className="header-ml__search-icon" aria-hidden="true">
              <img src="/assets/header/search.svg" alt="" />
            </span>
            <input 
              type="text" 
              placeholder="Buscar productos, marcas y categorías" 
              aria-label="Buscar productos, marcas y categorías"
              className="header-ml__search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </form>

          <nav className="header-ml__nav" aria-label="Principal">
            <ul className="header-ml__nav-list">
              <CategoriesMenu />
              <li><button type="button" className="fravega-link header-ml__offers" disabled title="Ofertas próximamente">Ofertas</button></li>
            </ul>
          </nav>

          <div className="header-ml__utility" aria-label="Accesos rápidos">
            <Link to="/vender" className="user-link user-link--sell">Vender</Link>
            <Link to={publicSession ? '/compras' : '/login'} className="user-link">Mis compras</Link>
            <Link to={publicSession ? '/mensajes' : '/login'} className="user-link">Mensajes</Link>
            {publicSession ? (
              <div className="user-menu" ref={accountMenuRef}>
                <button type="button" className="user-menu__trigger" aria-label="Menú de usuario" aria-expanded={isAccountMenuOpen} aria-controls="account-menu" ref={accountTriggerRef} onClick={() => setIsAccountMenuOpen((open) => !open)}>
                  <img className="user-menu__avatar" src="/assets/header/account-avatar.svg" alt="" />
                  <span className="user-menu__name">{accountGreeting}</span>
                  <img className="user-menu__chevron-img" src="/assets/header/account-chevron.svg" alt="" />
                </button>
                {isAccountMenuOpen ? <div className="user-menu__dropdown" id="account-menu">
                  <span className="user-menu__caption">{userDisplayName}</span>
                  <Link to="/perfil" className="user-menu__item" onClick={() => setIsAccountMenuOpen(false)}>Perfil</Link>
                  <Link to="/compras" className="user-menu__item" onClick={() => setIsAccountMenuOpen(false)}>Mis compras</Link>
                  <Link to="/ventas" className="user-menu__item" onClick={() => setIsAccountMenuOpen(false)}>Mis ventas</Link>
                  <Link to="/mis-publicaciones" className="user-menu__item" onClick={() => setIsAccountMenuOpen(false)}>Mis publicaciones</Link>
                  <Link to="/favoritos" className="user-menu__item" onClick={() => setIsAccountMenuOpen(false)}>Favoritos</Link>
                  <button type="button" className="user-menu__item user-menu__item--button" onClick={handleLogout} disabled={isLoggingOut}>Salir</button>
                  {logoutError ? <span role="alert">{logoutError}</span> : null}
                </div> : null}
              </div>
            ) : (
              <Link to="/login" className="header-ml__account-link">
                <img className="user-menu__avatar" src="/assets/header/account-avatar.svg" alt="" />
                <span>Mi cuenta</span>
              </Link>
            )}
            <Link to={publicSession ? '/favoritos' : '/login'} className="header-ml__icon-link" aria-label="Favoritos">
              <img src="/assets/header/favorites.svg" alt="" />
            </Link>
            <Link to="/checkout/lista" className="header-ml__icon-link cart-link" aria-label="Carrito de compras">
              <img src="/assets/header/cart.svg" alt="" />
              {cartItemsCount > 0 ? <span className="cart-badge">{cartItemsCount}</span> : null}
            </Link>
          </div>

          <div className="header-ml__mobile-actions">
            <Link to="/checkout/lista" className="cart-link header-ml__mobile-cart" aria-label="Carrito de compras" onClick={handleMobileNavigate}>
              <img src="/assets/header/cart.svg" alt="" />
              {cartItemsCount > 0 ? <span className="cart-badge">{cartItemsCount}</span> : null}
            </Link>
            <button
              type="button"
              className="header-ml__mobile-trigger"
              aria-label={isMobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
              aria-expanded={isMobileMenuOpen}
              aria-controls="mobile-navigation"
              ref={mobileTriggerRef}
              onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            >
              {isMobileMenuOpen ? <FaXmark size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="header-ml__mobile-panel" id="mobile-navigation">
            <div className="header-ml__mobile-accordion">
              <section className="header-ml__mobile-section">
                <button
                  type="button"
                  className="header-ml__mobile-section-trigger"
                  onClick={() => toggleMobileSection('explore')}
                  aria-expanded={openMobileSection === 'explore'}
                >
                  <span>Explorar</span>
                  <span className={`header-ml__mobile-section-chevron${openMobileSection === 'explore' ? ' header-ml__mobile-section-chevron--open' : ''}`}>
                    <FaChevronDown size={12} />
                  </span>
                </button>

                {openMobileSection === 'explore' ? (
                  <div className="header-ml__mobile-section-content">
                    <CategoriesMenu variant="mobile" onNavigate={handleMobileNavigate} />
                    <div className="header-ml__mobile-links">
                      <span className="header-ml__mobile-link" aria-disabled="true">Ofertas · próximamente</span>
                      <Link to="/vender" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Vender</Link>
                    </div>
                  </div>
                ) : null}
              </section>

              <section className="header-ml__mobile-section">
                <button
                  type="button"
                  className="header-ml__mobile-section-trigger"
                  onClick={() => toggleMobileSection('account')}
                  aria-expanded={openMobileSection === 'account'}
                >
                  <span>{publicSession ? userDisplayName : 'Mi cuenta'}</span>
                  <span className={`header-ml__mobile-section-chevron${openMobileSection === 'account' ? ' header-ml__mobile-section-chevron--open' : ''}`}>
                    <FaChevronDown size={12} />
                  </span>
                </button>

                {openMobileSection === 'account' ? (
                  <div className="header-ml__mobile-section-content">
                    {publicSession ? (
                      <div className="header-ml__mobile-links">
                        <Link to="/perfil" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Perfil</Link>
                        <Link to="/compras" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Mis compras</Link>
                        <Link to="/ventas" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Mis ventas</Link>
                        <Link to="/mis-publicaciones" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Mis publicaciones</Link>
                        <Link to="/favoritos" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Favoritos</Link>
                        <Link to="/mensajes" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Mensajes</Link>
                        <button type="button" className="header-ml__mobile-link header-ml__mobile-link--button" onClick={handleLogout} disabled={isLoggingOut}>Salir</button>
                        {logoutError ? <span role="alert">{logoutError}</span> : null}
                      </div>
                    ) : (
                      <div className="header-ml__mobile-links">
                        <Link to="/login" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Ingresa</Link>
                        <Link to="/registro" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Crea tu cuenta</Link>
                      </div>
                    )}
                  </div>
                ) : null}
              </section>
            </div>
          </div>
        ) : null}
      </div>
    </header>
  )
}
