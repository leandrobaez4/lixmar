import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { FaBars, FaChevronDown, FaXmark } from 'react-icons/fa6'
import CategoriesMenu from './CategoriesMenu'
import { clearPublicSession, getPublicSession, subscribeToPublicSession } from '@/auth/publicSession'
import { getPublicCartCount, subscribeToPublicCart } from '@/cart/publicCart'
import '@/scss/components/layout/Header.scss'

export default function Header() {
  const navigate = useNavigate()
  const [publicSession, setPublicSession] = useState(() => getPublicSession())
  const [cartItemsCount, setCartItemsCount] = useState(() => getPublicCartCount())
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [openMobileSection, setOpenMobileSection] = useState('explore')
  const [searchTerm, setSearchTerm] = useState('')
  const userDisplayName = publicSession?.name?.trim() || publicSession?.email || 'Mi cuenta'

  const handleLogout = () => {
    clearPublicSession()
    setIsMobileMenuOpen(false)
    navigate('/')
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
    return subscribeToPublicSession(() => {
      setPublicSession(getPublicSession())
    })
  }, [])

  useEffect(() => {
    return subscribeToPublicCart(() => {
      setCartItemsCount(getPublicCartCount())
    })
  }, [])

  useEffect(() => {
    if (!isMobileMenuOpen) {
      return () => {}
    }

    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.body.style.overflow = previousOverflow
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
              className="header-ml__search-input"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
            />
          </form>

          <nav className="header-ml__nav" aria-label="Principal">
            <ul className="header-ml__nav-list">
              <CategoriesMenu />
              <li><Link to="/ofertas" className="fravega-link">Ofertas</Link></li>
              <li><Link to="/buscar?q=iphone" className="fravega-link">Prueba</Link></li>
            </ul>
          </nav>

          <div className="header-ml__utility" aria-label="Accesos rápidos">
            {publicSession ? (
              <Link to="/perfil" className="user-link">Mis compras</Link>
            ) : (
              <Link to="/login" className="user-link">Mis compras</Link>
            )}
            <Link to="/vender" className="user-link user-link--sell">Vender</Link>
            <Link to="/checkout/lista" className="header-ml__icon-link cart-link" aria-label="Carrito de compras">
              <img src="/assets/header/cart.svg" alt="" />
              {cartItemsCount > 0 ? <span className="cart-badge">{cartItemsCount}</span> : null}
            </Link>
            <Link to="/favoritos" className="header-ml__icon-link" aria-label="Favoritos">
              <img src="/assets/header/favorites.svg" alt="" />
            </Link>
            <Link to="/mensajes" className="header-ml__icon-link" aria-label="Mensajes">
              <img src="/assets/header/messages.svg" alt="" />
            </Link>
            <span className="header-ml__divider" aria-hidden="true" />
            {publicSession ? (
              <div className="user-menu">
                <button type="button" className="user-menu__trigger" aria-label="Menú de usuario">
                  <img className="user-menu__avatar" src="/assets/header/account-avatar.svg" alt="" />
                  <span className="user-menu__name">{userDisplayName}</span>
                  <img className="user-menu__chevron-img" src="/assets/header/account-chevron.svg" alt="" />
                </button>
                <div className="user-menu__dropdown">
                  <span className="user-menu__caption">{userDisplayName}</span>
                  <Link to="/perfil" className="user-menu__item">Perfil</Link>
                  <button type="button" className="user-menu__item user-menu__item--button" onClick={handleLogout}>Salir</button>
                </div>
              </div>
            ) : (
              <Link to="/login" className="header-ml__account-link">
                <img className="user-menu__avatar" src="/assets/header/account-avatar.svg" alt="" />
                <span>Mi cuenta</span>
              </Link>
            )}
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
              onClick={() => setIsMobileMenuOpen((currentValue) => !currentValue)}
            >
              {isMobileMenuOpen ? <FaXmark size={18} /> : <FaBars size={18} />}
            </button>
          </div>
        </div>

        {isMobileMenuOpen ? (
          <div className="header-ml__mobile-panel">
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
                      <Link to="/ofertas" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Ofertas</Link>
                      <Link to="/buscar?q=iphone" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Prueba</Link>
                      <Link to="/historial" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Historial</Link>
                      <Link to="/vender" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Vender</Link>
                      <Link to="/ayuda" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Ayuda</Link>
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
                        <Link to="/perfil" className="header-ml__mobile-link" onClick={handleMobileNavigate}>Mis compras</Link>
                        <button type="button" className="header-ml__mobile-link header-ml__mobile-link--button" onClick={handleLogout}>Salir</button>
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
