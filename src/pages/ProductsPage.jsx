import { useState } from 'react'
import { Link } from 'react-router-dom'
import Breadcrumb from '@/components/layout/Breadcrumb'

const categories = [
  { name: 'iPhone (iOS)', count: 74, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png' },
  { name: 'Android', count: 35, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png' },
  { name: '5G Support', count: 12, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png' },
  { name: 'Apple Tablets', count: 22, img: '/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png' },
  { name: 'Cargadores', count: 33, img: '/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png' },
  { name: 'Gaming', count: 9, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png' },
  { name: 'Xiaomi', count: 52, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png' },
  { name: 'Accesorios', count: 29, img: '/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png' },
  { name: 'Samsung Tablets', count: 26, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png' },
  { name: 'eReader', count: 5, img: '/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png' },
]

const sidebarCategories = [
  'Todos', 'Iphone', 'Samsung', 'Xiaomi', 'Asus', 'Oppo',
  'Gaming Smartphone', 'Ipad', 'Windows Tablets', 'eReader',
  'Smartphone Chargers', '5G Support Smartphone',
  'Accesorios para Celulares', 'Accesorios para Tablets'
]

const bestsellers = [
  { name: 'uLosk Mini case 2.0, Xenon i10 / 32GB / SSD 512GB', price: 1729000, oldPrice: 2119000, rating: 5, reviews: 8, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png', freeShipping: false, stock: 'out', save: 59000 },
  { name: 'Opplo Watch Series 8 GPS + Cellular Stainless Steel', price: 979000, img: '/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png', freeShipping: false, stock: 'pre' },
  { name: 'iSmart 24V Charger', price: 9000, oldPrice: 12000, rating: 5, reviews: 9, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png', freeShipping: false, stock: 'contact', save: 3000 },
  { name: 'OPod Pro 12.9 Inch M1 2023, 64GB + Wifi, GPS', price: 569000, oldPrice: 759000, rating: 5, reviews: 152, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png', freeShipping: true, stock: 'in', save: 199000 },
]

const products = [
  { id: 1, name: 'SROK Smart Phone 128GB, Oled Retina', price: 579000, oldPrice: 859000, rating: 5, reviews: 152, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png', freeShipping: true, stock: 'in', save: 199000 },
  { id: 2, name: 'aPod Pro Tablet 2023 LTE + Wifi, GPS Cellular 12.9 Inch, 512GB', price: 979000, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png', freeShipping: false, stock: 'in' },
  { id: 3, name: 'Samsung Galaxy X6 Ultra LTE 4G/128 Gb, Black Smartphone', price: 659000, rating: 3, reviews: 5, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png', freeShipping: true, gift: true, stock: 'in' },
  { id: 4, name: 'Xiamoi Redmi Note 5, 64GB', price: 1239000, oldPrice: 1619000, rating: 5, reviews: 9, img: '/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png', freeShipping: true, stock: 'contact', save: 59000 },
  { id: 5, name: 'Microsute Alpha Ultra S5 Surface 128GB 2022', price: 1729000, rating: 5, reviews: 8, img: '/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png', freeShipping: true, stock: 'contact' },
  { id: 6, name: 'OPod Pro 12.9 Inch M1 2023, 64GB + Wifi, GPS', price: 569000, oldPrice: 759000, rating: 3, reviews: 152, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png', freeShipping: true, stock: 'in', save: 199000 },
  { id: 7, name: 'Xioma Redmi Note 11 Pro 256GB 2023, Black Smartphone', price: 59000, rating: 5, reviews: 2, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png', freeShipping: true, stock: 'in' },
  { id: 8, name: 'aPod Pro Tablet 2023 LTE + Wifi, GPS Cellular', price: 279000, img: '/assets/090404d25cc6c0aad946d6693b949b48e3f57252.png', freeShipping: false, stock: 'in' },
  { id: 9, name: 'Lenovo Redmi Note 5, 64GB', price: 69000, img: '/assets/0dd99e210091b5ecadf239bd35b5f22c0f9e2645.png', freeShipping: true, stock: 'in' },
  { id: 10, name: 'LG Pro Tablet 2023 LTE + Wifi, GPS Cellular', price: 179000, img: '/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png', freeShipping: false, stock: 'pre', badge: 'nuevo' },
  { id: 11, name: 'Samsung Galaxy X6 Ultra LTE 4G/128 Gb, Black Smartphone', price: 659000, rating: 3, reviews: 5, img: '/assets/0b070ec76034ae637ff589014ed8e2419a754a32.png', freeShipping: true, gift: true, stock: 'in', badge: 'out of stock' },
  { id: 12, name: 'SROK Smart Phone 128GB, Oled Retina', price: 579000, oldPrice: 859000, rating: 5, reviews: 152, img: '/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png', freeShipping: true, stock: 'in', save: 199000 },
]

const formatPrice = (val) => `$${val.toLocaleString('es-AR')}`

const stars = (n) => '★'.repeat(n) + (n < 5 ? '☆'.repeat(5 - n) : '')

export default function ProductsPage() {
  const [activeFilters, setActiveFilters] = useState(['Min: $45.000', '10.9 pulgadas', 'Color: Rojo', '128GB'])
  const [viewMode, setViewMode] = useState('grid')

  const removeFilter = (f) => setActiveFilters(prev => prev.filter(x => x !== f))

  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Productos' }]} />

      {/* Best Phones & Tablets Banner */}
      <section className="lixmar-bestbanner">
        <h3 className="lixmar-bestbanner__title">Mejores celulares y tablets</h3>
        <div className="lixmar-bestbanner__layout">
          <div className="lixmar-bestbanner__slider">
            <div className="lixmar-bestbanner__slide lixmar-bestbanner__slide--active">
              <img src="/assets/0b7bdc132f3d60c767e3b92de9cb2a68c1bfd50f.png" alt="Auriculares con cancelación de sonido" className="lixmar-bestbanner__slide-img" />
              <div className="lixmar-bestbanner__slide-content">
                <h4 className="lixmar-bestbanner__slide-title">
                  <span className="lixmar-bestbanner__slide-title--light">Auriculares con</span><br />
                  Cancelacion de sonido
                </h4>
                <ul className="lixmar-bestbanner__features">
                  <li>Auriculares Boso Over-Ear</li>
                  <li>Wifi, Voice Assistant,</li>
                  <li>Modo de juego de baja latencia</li>
                </ul>
                <a href="#" className="lixmar-bestbanner__btn lixmar-bestbanner__btn--white">COMPRAR AHORA</a>
              </div>
            </div>
            <div className="lixmar-bestbanner__controls">
              <button className="lixmar-bestbanner__ctrl-arrow" aria-label="Anterior">←</button>
              <span className="lixmar-bestbanner__ctrl-count">3 / 3</span>
              <button className="lixmar-bestbanner__ctrl-arrow" aria-label="Siguiente">→</button>
            </div>
          </div>
          <div className="lixmar-bestbanner__side">
            <img src="/assets/09b322b4fe86b16de5a9d343c6e82b51ff89fa52.png" alt="Redmi note 12 Pro+ 5g" className="lixmar-bestbanner__side-img" />
            <div className="lixmar-bestbanner__side-content">
              <h4 className="lixmar-bestbanner__side-title">Redmi note 12<br />Pro+ 5g</h4>
              <p className="lixmar-bestbanner__side-sub">Acepte el desafío</p>
            </div>
            <a href="#" className="lixmar-bestbanner__btn lixmar-bestbanner__btn--black">COMPRAR AHORA</a>
          </div>
        </div>
      </section>

      {/* Popular Categories */}
      <section className="lixmar-catpop">
        <h3 className="lixmar-catpop__title">Categorias populares</h3>
        <div className="lixmar-catpop__grid">
          {categories.map(cat => (
            <a href="#" className="lixmar-catpop__item" key={cat.name}>
              <div className="lixmar-catpop__info">
                <span className="lixmar-catpop__name">{cat.name}</span>
                <span className="lixmar-catpop__count">{cat.count} Items</span>
              </div>
              <img src={cat.img} alt={cat.name} className="lixmar-catpop__img" />
            </a>
          ))}
        </div>
      </section>

      {/* Shop Layout: Sidebar + Products */}
      <section className="lixmar-shop">
        <div className="lixmar-shop__layout">

          {/* LEFT SIDEBAR */}
          <aside className="lixmar-shop__sidebar">
            <div className="lixmar-shop__catbox">
              <h3 className="lixmar-shop__catbox-title">Categorias</h3>
              <a href="#" className="lixmar-shop__catbox-all">Todas las categorias</a>
              <h4 className="lixmar-shop__catbox-heading">Celulares y Tablets</h4>
              <ul className="lixmar-shop__catbox-list">
                {sidebarCategories.map(c => (
                  <li key={c}><a href="#">{c}</a></li>
                ))}
              </ul>
            </div>

            <div className="lixmar-shop__filterbox">
              <div className="lixmar-shop__filter-header">
                <h3 className="lixmar-shop__filter-title">Categorias</h3>
                <a href="#" className="lixmar-shop__filter-reset">Restablecer</a>
              </div>

              <div className="lixmar-shop__filter-tags">
                {activeFilters.map(f => (
                  <span className="lixmar-shop__filter-tag" key={f}>
                    {f} <button className="lixmar-shop__tag-remove" onClick={() => removeFilter(f)}>×</button>
                  </span>
                ))}
              </div>

              {/* Price Filter */}
              <div className="lixmar-shop__filter-group">
                <div className="lixmar-shop__filter-group-header">
                  <span className="lixmar-shop__filter-group-title">Por Precio</span>
                  <span className="lixmar-shop__filter-toggle">▼</span>
                </div>
                <div className="lixmar-shop__price-slider">
                  <div className="lixmar-shop__price-bar">
                    <div className="lixmar-shop__price-progress"></div>
                  </div>
                </div>
                <div className="lixmar-shop__price-fields">
                  <div className="lixmar-shop__price-field">
                    <span className="lixmar-shop__price-sign">$</span>
                    <input type="text" defaultValue="0" className="lixmar-shop__price-input" />
                  </div>
                  <span className="lixmar-shop__price-sep">—</span>
                  <div className="lixmar-shop__price-field">
                    <span className="lixmar-shop__price-sign">$</span>
                    <input type="text" defaultValue="100.000" className="lixmar-shop__price-input" />
                  </div>
                  <button className="lixmar-shop__price-go">Ir</button>
                </div>
              </div>

              {/* Rating Filter */}
              <div className="lixmar-shop__filter-group">
                <div className="lixmar-shop__filter-group-header">
                  <span className="lixmar-shop__filter-group-title">Por Valoración</span>
                  <span className="lixmar-shop__filter-toggle">▼</span>
                </div>
                <div className="lixmar-shop__filter-checks">
                  {[5,4,3,2].map(n => (
                    <label className="lixmar-shop__check" key={n}>
                      <input type="checkbox" />
                      <span className="lixmar-shop__stars">{stars(n)}</span>
                      <span className="lixmar-shop__check-count">({[52,24,5,1][5-n]})</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Screen Size */}
              <div className="lixmar-shop__filter-group">
                <div className="lixmar-shop__filter-group-header">
                  <span className="lixmar-shop__filter-group-title">Por Tamaño de pantalla</span>
                  <span className="lixmar-shop__filter-toggle">▼</span>
                </div>
                <div className="lixmar-shop__size-pills">
                  <span className="lixmar-shop__size-pill">7" y Menor</span>
                  <span className="lixmar-shop__size-pill">7.1" - 8.9"</span>
                  <span className="lixmar-shop__size-pill">9" - 10.9"</span>
                  <span className="lixmar-shop__size-pill">11" y Mayor</span>
                </div>
              </div>

              {/* Color */}
              <div className="lixmar-shop__filter-group">
                <div className="lixmar-shop__filter-group-header">
                  <span className="lixmar-shop__filter-group-title">By Color</span>
                  <span className="lixmar-shop__filter-toggle">▼</span>
                </div>
                <div className="lixmar-shop__color-swatches">
                  {['#a42a2a','#2f557b','#439abb','#222','#fff','#1aba1a','#696969','#534898'].map(c => (
                    <span className={`lixmar-shop__swatch${c === '#fff' ? ' lixmar-shop__swatch--white' : ''}`} style={{ background: c }} key={c}></span>
                  ))}
                </div>
              </div>

              {/* Condition */}
              <div className="lixmar-shop__filter-group">
                <div className="lixmar-shop__filter-group-header">
                  <span className="lixmar-shop__filter-group-title">Por Condición</span>
                  <span className="lixmar-shop__filter-toggle">▼</span>
                </div>
                <div className="lixmar-shop__filter-checks">
                  {[{l:'Nuevo',c:21},{l:'Usado',c:2},{l:'Reacondicionado',c:38}].map(x => (
                    <label className="lixmar-shop__check" key={x.l}>
                      <input type="checkbox" /> {x.l} <span className="lixmar-shop__check-count">({x.c})</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* RIGHT: MAIN CONTENT */}
          <div className="lixmar-shop__main">
            {/* Best Sellers */}
            <div className="lixmar-shop__bestsellers">
              <h3 className="lixmar-shop__bestsellers-title">Los más vendidos en esta categoría</h3>
              <div className="lixmar-shop__bestsellers-wrap">
                <button className="lixmar-shop__bs-arrow lixmar-shop__bs-arrow--prev">←</button>
                <div className="lixmar-shop__bs-track">
                  {bestsellers.map((p, i) => (
                    <div className="lixmar-shop__bs-card" key={i}>
                      <div className="lixmar-shop__bs-card-top">
                        {p.save && <span className="lixmar-shop__badge lixmar-shop__badge--green">ahorra<br /><strong>{formatPrice(p.save)}</strong></span>}
                        <button className="lixmar-shop__fav">♡</button>
                      </div>
                      <img src={p.img} alt={p.name} className="lixmar-shop__bs-img" />
                      <div className="lixmar-shop__bs-info">
                        {p.rating && (
                          <div className="lixmar-shop__bs-stars">
                            <span className="lixmar-shop__stars">{stars(p.rating)}</span>
                            <span className="lixmar-shop__check-count">({p.reviews})</span>
                          </div>
                        )}
                        <h4 className="lixmar-shop__bs-name">{p.name}</h4>
                        <div className="lixmar-shop__bs-prices">
                          <span className={p.oldPrice ? 'lixmar-shop__price-sale' : 'lixmar-shop__price-current'}>{formatPrice(p.price)}</span>
                          {p.oldPrice && <span className="lixmar-shop__price-old">{formatPrice(p.oldPrice)}</span>}
                        </div>
                        <span className={`lixmar-shop__tag lixmar-shop__tag--${p.freeShipping ? 'green' : 'dark'}`}>
                          {p.freeShipping ? 'ENVIO GRATIS' : '$2.980 ENVIO'}
                        </span>
                        <div className={`lixmar-shop__bs-stock${p.stock === 'in' ? ' lixmar-shop__bs-stock--in' : p.stock === 'out' ? ' lixmar-shop__bs-stock--out' : ''}`}>
                          {p.stock === 'in' ? '● En stock' : p.stock === 'out' ? '● Fuera de stock' : p.stock === 'pre' ? 'COMPRA ANTICIPADA' : '● Contacto'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <button className="lixmar-shop__bs-arrow lixmar-shop__bs-arrow--next">→</button>
              </div>
            </div>

            {/* Toolbar */}
            <div className="lixmar-shop__toolbar">
              <div className="lixmar-shop__toolbar-left">
                <span className="lixmar-shop__results"><strong>1 - 40</strong> de 120 resultados</span>
                <span className="lixmar-shop__toolbar-label">Mostrar articulos</span>
                <div className="lixmar-shop__show-nums">
                  <span className="lixmar-shop__show-num lixmar-shop__show-num--active">24</span>
                  <span className="lixmar-shop__show-num">48</span>
                  <span className="lixmar-shop__show-num">72</span>
                </div>
              </div>
              <div className="lixmar-shop__toolbar-right">
                <span className="lixmar-shop__toolbar-label">Ordenar por</span>
                <select className="lixmar-shop__sort-select">
                  <option>Default</option>
                  <option>Precio: menor a mayor</option>
                  <option>Precio: mayor a menor</option>
                </select>
                <span className="lixmar-shop__toolbar-label">Ver Como</span>
                <button className={`lixmar-shop__view-btn${viewMode === 'grid' ? ' lixmar-shop__view-btn--active' : ''}`} onClick={() => setViewMode('grid')}>⊞</button>
                <button className={`lixmar-shop__view-btn${viewMode === 'list' ? ' lixmar-shop__view-btn--active' : ''}`} onClick={() => setViewMode('list')}>☰</button>
              </div>
            </div>

            {/* Product Grid */}
            <div className="lixmar-shop__grid">
              {products.map(p => (
                <div className="lixmar-shop__product" key={p.id}>
                  <div className="lixmar-shop__product-top">
                    {p.save && <span className="lixmar-shop__badge lixmar-shop__badge--green">ahorra<br /><strong>{formatPrice(p.save)}</strong></span>}
                    {p.badge && <span className="lixmar-shop__badge lixmar-shop__badge--dark">{p.badge}</span>}
                    <button className="lixmar-shop__fav">♡</button>
                  </div>
                  <Link to={`/producto/${p.id}`}>
                    <img src={p.img} alt={p.name} className="lixmar-shop__product-img" />
                  </Link>
                  <div className="lixmar-shop__product-info">
                    {p.rating && (
                      <div className="lixmar-shop__bs-stars">
                        <span className="lixmar-shop__stars">{stars(p.rating)}</span>
                        <span className="lixmar-shop__check-count">({p.reviews})</span>
                      </div>
                    )}
                    <h4 className="lixmar-shop__product-name">{p.name}</h4>
                    <div className="lixmar-shop__bs-prices">
                      <span className={p.oldPrice ? 'lixmar-shop__price-sale' : 'lixmar-shop__price-current'}>{formatPrice(p.price)}</span>
                      {p.oldPrice && <span className="lixmar-shop__price-old">{formatPrice(p.oldPrice)}</span>}
                    </div>
                    <div className="lixmar-shop__tag-row">
                      <span className={`lixmar-shop__tag lixmar-shop__tag--${p.freeShipping ? 'green' : 'dark'}`}>
                        {p.freeShipping ? 'ENVIO GRATIS' : '$2.980 ENVIO'}
                      </span>
                      {p.gift && <span className="lixmar-shop__tag lixmar-shop__tag--red">REGALO GRATIS</span>}
                    </div>
                    <div className={`lixmar-shop__bs-stock${p.stock === 'in' ? ' lixmar-shop__bs-stock--in' : ''}`}>
                      {p.stock === 'in' ? '● En stock' : p.stock === 'pre' ? 'COMPRA ANTICIPADA' : '● Contacto'}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
