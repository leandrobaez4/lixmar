import { useState } from 'react'
import { Link } from 'react-router-dom'
import './Header.scss'

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <header className="header-ml">
      <div className="header-ml__container">
        {/* ROW 1: Logo, Search, Promo */}
        <div className="header-ml__top">
          <Link to="/" className="header-ml__logo">
            <span className="logo-text">LIX</span>
            <span className="logo-text highlight">MAR</span>
          </Link>
          
          <div className="header-ml__search">
            <input 
              type="text" 
              placeholder="Buscar productos, marcas y más…" 
              className="header-ml__search-input"
            />
            <button className="header-ml__search-btn" aria-label="Buscar">
              🔍
            </button>
          </div>

          <div className="header-ml__promo">
            <img src="/assets/a84219cc-c7d5-48e5-b304-6c6db0a23dfb.png" alt="Promo" className="header-ml__promo-img" onError={(e) => e.target.style.display = 'none'} />
          </div>
        </div>

        {/* ROW 2: Envío, Nav Links, User Menu */}
        <div className="header-ml__bottom">
          <div className="header-ml__location">
            <span className="location-icon">📍</span>
            <div className="location-text">
              <span className="location-send">Abre hoy</span>
              <span className="location-zip">OFERTAS 24/7</span>
            </div>
          </div>

          <nav className="header-ml__nav">
            <ul className="header-ml__nav-list">
              <li>
                <Link to="/categorias" className="nav-btn-categorias">
                  <span className="hamburger-icon">☰</span> Categorías
                </Link>
              </li>
              <li><Link to="/ofertas" className="fravega-link">Ofertas</Link></li>
              <li><Link to="/historial" className="fravega-link">Historial</Link></li>
              <li><Link to="/supermercado" className="fravega-link">Supermercado</Link></li>
              <li><Link to="/vender" className="fravega-link">Vender</Link></li>
              <li><Link to="/ayuda" className="fravega-link">Ayuda</Link></li>
            </ul>
          </nav>

          <div className="header-ml__user">
            <Link to="/login" className="user-link">Ingresa</Link>
            <Link to="/registro" className="user-link">Crea tu cuenta</Link>
            <Link to="/compras" className="user-link">Mis compras</Link>
            <Link to="/cart" className="cart-link">
              🛒 <span className="cart-badge">2</span>
            </Link>
          </div>
        </div>
      </div>
    </header>
  )
}
