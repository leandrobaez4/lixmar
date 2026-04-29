import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer className="lixmar-footer">
      <div className="lixmar-footer__container">
        {/* Column 1: Contact */}
        <div className="lixmar-footer__col lixmar-footer__col--contact">
          <h3 className="lixmar-footer__brand">Lixmar</h3>
          <p className="lixmar-footer__slogan">DESCUENTOS 24/7</p>
          <p className="lixmar-footer__phone">(+54) xxxxxxxx</p>
          <p className="lixmar-footer__address">CABA, Argentina</p>
          <p className="lixmar-footer__email">contact@lixmar.com</p>
          <div className="lixmar-footer__social">
            <a href="#" className="lixmar-footer__social-link" aria-label="Twitter">🐦</a>
            <a href="#" className="lixmar-footer__social-link" aria-label="Facebook">f</a>
            <a href="#" className="lixmar-footer__social-link" aria-label="Google">G</a>
            <a href="#" className="lixmar-footer__social-link" aria-label="YouTube">▶</a>
            <a href="#" className="lixmar-footer__social-link" aria-label="Pinterest">P</a>
          </div>
          <div className="lixmar-footer__selectors">
            <button className="lixmar-footer__selector">
              <span>🇦🇷</span> ARG <span className="lixmar-footer__arrow">▼</span>
            </button>
            <button className="lixmar-footer__selector">
              <img src="/assets/070bdfcb7d0609f801264b0136e1b1ed53d3a117.png" alt="" className="lixmar-footer__flag" /> Esp <span className="lixmar-footer__arrow">▼</span>
            </button>
          </div>
        </div>

        {/* Column 2: Categories */}
        <div className="lixmar-footer__col">
          <h4 className="lixmar-footer__title">Categorías</h4>
          <ul className="lixmar-footer__list">
            <li><a href="#">Laptops</a></li>
            <li><a href="#">PC y Computadoras</a></li>
            <li><a href="#">Celulares</a></li>
            <li><a href="#">Tablets</a></li>
            <li><a href="#">Gaming &amp; VR</a></li>
            <li><a href="#">Oficina</a></li>
            <li><a href="#">Cámaras</a></li>
            <li><a href="#">Sonido</a></li>
            <li><a href="#">Hogar</a></li>
          </ul>
        </div>

        {/* Column 3: Company */}
        <div className="lixmar-footer__col">
          <h4 className="lixmar-footer__title">Compañía</h4>
          <ul className="lixmar-footer__list">
            <li><Link to="/nosotros">Sobre Lixmar</Link></li>
            <li><a href="#">Contacto</a></li>
            <li><a href="#">Carrera</a></li>
            <li><a href="#">Blog</a></li>
            <li><a href="#">Mapa</a></li>
            <li><a href="#">Ubicación</a></li>
          </ul>
        </div>

        {/* Column 4: Help */}
        <div className="lixmar-footer__col">
          <h4 className="lixmar-footer__title">Ayuda</h4>
          <ul className="lixmar-footer__list">
            <li><a href="#">Servicios</a></li>
            <li><a href="#">Políticas</a></li>
            <li><a href="#">Términos</a></li>
            <li><a href="#">Ordenes</a></li>
            <li><a href="#">FAQs</a></li>
            <li><Link to="/perfil">Mi Cuenta</Link></li>
            <li><a href="#">Soporte</a></li>
          </ul>
        </div>

        {/* Column 5: Brands */}
        <div className="lixmar-footer__col">
          <h4 className="lixmar-footer__title">Marcas</h4>
          <ul className="lixmar-footer__list">
            <li><a href="#">Mejores Vendedores</a></li>
            <li><a href="#">Afiliados</a></li>
            <li><a href="#">Advertencias</a></li>
            <li><a href="#">Socios</a></li>
          </ul>
        </div>
      </div>

      {/* Subscribe */}
      <div className="lixmar-footer__subscribe">
        <h4 className="lixmar-footer__subscribe-title">
          Suscríbete y obtén un <span className="lixmar-footer__highlight">10%</span> de descuento en tu primer pedido
        </h4>
        <form className="lixmar-footer__form" onSubmit={(e) => e.preventDefault()}>
          <span className="lixmar-footer__form-icon">✉</span>
          <input type="email" className="lixmar-footer__input" placeholder="Introduce tu dirección de correo electrónico" />
          <button type="submit" className="lixmar-footer__submit">SUSCRIBIRSE →</button>
        </form>
        <p className="lixmar-footer__disclaimer">Al suscribirte, aceptas nuestra Política.</p>
      </div>

      {/* Bottom bar */}
      <div className="lixmar-footer__bottom">
        <div className="lixmar-footer__payments">
          <img src="/assets/070249774abe9c1353b3df5f95c1af218314f3ce.png" alt="PayPal" className="lixmar-footer__pay" />
          <img src="/assets/060925791ca896d5e7de619580ab3e8252ed7be2.png" alt="Visa" className="lixmar-footer__pay" />
          <img src="/assets/02ff328c10a9deef74458b373d3b49da187539bc.png" alt="Stripe" className="lixmar-footer__pay" />
          <img src="/assets/03220409e2afb541e22d8656f76d389c24ec0b83.png" alt="MasterCard" className="lixmar-footer__pay" />
          <img src="/assets/028adf0874d960eaa1566503e549522693b70847.png" alt="Klarna" className="lixmar-footer__pay" />
        </div>
        <a href="#" className="lixmar-footer__app">📱 App celular</a>
      </div>
    </footer>
  )
}
