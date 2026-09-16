import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaArrowDownWideShort, FaFilter, FaMagnifyingGlass, FaSliders } from 'react-icons/fa6'
import ProductCard from '@/components/ui/ProductCard'
import '@/scss/pages/SearchResultsPage.scss'

const searchProducts = [
  {
    id: 1,
    title: 'iPhone 17 Pro Max 256 GB',
    category: 'Tecnología',
    price: 2399999,
    image: '/assets/home/product-iphone-17.png',
    installmentText: '6 cuotas sin interés',
    shippingText: 'Envío gratis a todo el país',
    isFreeShipping: true,
  },
  {
    id: 2,
    title: 'PlayStation 5 Slim 1 TB',
    category: 'Gaming',
    price: 1249999,
    image: '/assets/home/product-playstation-5.png',
    installmentText: 'Envío gratis',
    shippingText: 'Llega mañana',
    isFreeShipping: true,
  },
  {
    id: 3,
    title: 'MacBook Air 13” M3',
    category: 'Tecnología',
    price: 2149999,
    image: '/assets/home/product-macbook-air.png',
    installmentText: '12 cuotas',
    shippingText: 'Envío asegurado',
  },
  {
    id: 4,
    title: 'Smart TV 55” 4K UHD',
    category: 'Electrodomésticos',
    price: 899999,
    image: '/assets/home/product-smart-tv-55.png',
    installmentText: 'Oferta destacada',
    shippingText: 'Retiro o envío',
  },
  {
    id: 5,
    title: 'Smart TV 55” Full HD',
    category: 'Electrodomésticos',
    price: 549999,
    image: '/assets/home/product-smart-tv-fullhd.png',
    installmentText: '6 cuotas',
    shippingText: 'Envío a todo el país',
  },
  {
    id: 6,
    title: 'Carpa para 2 personas',
    category: 'Deportes',
    price: 1399999,
    image: '/assets/home/product-carpa.png',
    installmentText: 'Envío gratis',
    shippingText: 'Stock disponible',
    isFreeShipping: true,
  },
  {
    id: 7,
    title: 'Campera The North Face',
    category: 'Moda',
    price: 1299999,
    image: '/assets/home/product-campera.png',
    installmentText: '10% OFF',
    shippingText: 'Entrega coordinada',
  },
  {
    id: 8,
    title: 'Zapatillas Air Zoom Nike',
    category: 'Moda',
    price: 749999,
    image: '/assets/home/product-zapatillas.png',
    installmentText: 'Cuotas disponibles',
    shippingText: 'Llega en 24 h',
  },
]

const categoryFilters = ['Tecnología', 'Electrodomésticos', 'Gaming', 'Moda', 'Deportes']
const quickFilters = ['Envío gratis', 'Cuotas sin interés', 'Llega rápido', 'Ofertas']

function normalizeText(value) {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

export default function SearchResultsPage() {
  const [searchParams] = useSearchParams()
  const query = searchParams.get('q')?.trim() || ''
  const [activeCategory, setActiveCategory] = useState('Todos')
  const [sortBy, setSortBy] = useState('relevance')

  const results = useMemo(() => {
    const normalizedQuery = normalizeText(query)

    const filteredProducts = searchProducts.filter((product) => {
      const matchesQuery = !normalizedQuery
        || normalizeText(`${product.title} ${product.category}`).includes(normalizedQuery)
      const matchesCategory = activeCategory === 'Todos' || product.category === activeCategory

      return matchesQuery && matchesCategory
    })

    return [...filteredProducts].sort((firstProduct, secondProduct) => {
      if (sortBy === 'price-asc') {
        return firstProduct.price - secondProduct.price
      }

      if (sortBy === 'price-desc') {
        return secondProduct.price - firstProduct.price
      }

      return 0
    })
  }, [activeCategory, query, sortBy])

  const title = query ? `Resultados para "${query}"` : 'Resultados de búsqueda'

  return (
    <main className="lixmar-search">
      <div className="lixmar-search__shell">
        <section className="lixmar-search__hero">
          <div>
            <p className="lixmar-search__eyebrow">Búsqueda</p>
            <h1>{title}</h1>
            <p className="lixmar-search__summary">
              {results.length} productos encontrados en LIXMAR
            </p>
          </div>
          <Link to="/productos" className="lixmar-search__browse-link">Ver catálogo completo</Link>
        </section>

        <section className="lixmar-search__layout">
          <aside className="lixmar-search__filters" aria-label="Filtros de búsqueda">
            <div className="lixmar-search__filters-title">
              <FaFilter size={14} />
              <span>Filtros</span>
            </div>

            <div className="lixmar-search__filter-group">
              <h2>Categoría</h2>
              <div className="lixmar-search__category-list">
                {['Todos', ...categoryFilters].map((category) => (
                  <button
                    key={category}
                    type="button"
                    className={`lixmar-search__category${activeCategory === category ? ' lixmar-search__category--active' : ''}`}
                    onClick={() => setActiveCategory(category)}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </div>

            <div className="lixmar-search__filter-group">
              <h2>También podés filtrar por</h2>
              <div className="lixmar-search__chips">
                {quickFilters.map((filter) => (
                  <span key={filter} className="lixmar-search__chip">{filter}</span>
                ))}
              </div>
            </div>
          </aside>

          <section className="lixmar-search__results" aria-label={title}>
            <div className="lixmar-search__toolbar">
              <div className="lixmar-search__toolbar-label">
                <FaMagnifyingGlass size={14} />
                <span>{query || 'Todos los productos'}</span>
              </div>

              <label className="lixmar-search__sort">
                <FaArrowDownWideShort size={14} />
                <span>Ordenar</span>
                <select value={sortBy} onChange={(event) => setSortBy(event.target.value)}>
                  <option value="relevance">Relevancia</option>
                  <option value="price-asc">Menor precio</option>
                  <option value="price-desc">Mayor precio</option>
                </select>
              </label>
            </div>

            {results.length > 0 ? (
              <div className="lixmar-search__grid">
                {results.map((product) => (
                  <ProductCard key={product.id} {...product} />
                ))}
              </div>
            ) : (
              <div className="lixmar-search__empty">
                <FaSliders size={26} />
                <h2>No encontramos resultados</h2>
                <p>Probá con otra búsqueda o revisá los filtros seleccionados.</p>
              </div>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
