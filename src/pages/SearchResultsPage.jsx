import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { FaArrowDownWideShort, FaFilter, FaMagnifyingGlass, FaSliders } from 'react-icons/fa6'
import ProductCard from '@/components/ui/ProductCard'
import { fetchCategories, fetchProducts, productCardProps } from '@/catalog/catalogApi'
import '@/scss/pages/SearchResultsPage.scss'

function leafCategories(category) {
  if (!category.children?.length) return [{ id: category.id, name: category.name }]
  return category.children.flatMap(leafCategories)
}

export default function SearchResultsPage({ catalogMode = false }) {
  const [searchParams, setSearchParams] = useSearchParams()
  const [categories, setCategories] = useState([])
  const [results, setResults] = useState([])
  const [total, setTotal] = useState(0)
  const [lastPage, setLastPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retryCount, setRetryCount] = useState(0)
  const query = searchParams.get('q')?.trim() || ''
  const categoryId = searchParams.get('category_id') || ''
  const sort = searchParams.get('sort') || 'relevance'
  const page = Math.max(1, Number(searchParams.get('page')) || 1)
  const searchKey = searchParams.toString()
  const title = query ? `Resultados para "${query}"` : catalogMode ? 'Todos los productos' : 'Resultados de búsqueda'

  useEffect(() => {
    const controller = new AbortController()
    fetchCategories(controller.signal).then((payload) => {
      if (!controller.signal.aborted) setCategories((payload.data || []).flatMap(leafCategories))
    }).catch(() => {})
    return () => controller.abort()
  }, [])

  useEffect(() => {
    const controller = new AbortController()
    const params = new URLSearchParams(searchKey)
    params.set('page', String(page))
    params.set('per_page', '20')
    setLoading(true)
    setError('')
    fetchProducts(params, controller.signal).then((payload) => {
      if (!controller.signal.aborted) {
        setResults(payload.data || [])
        setTotal(payload.total || 0)
        setLastPage(payload.last_page || 1)
      }
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [searchKey, page, retryCount])

  const updateFilter = (key, value) => {
    const next = new URLSearchParams(searchParams)
    if (value) next.set(key, value)
    else next.delete(key)
    next.delete('page')
    setSearchParams(next)
  }

  const changePage = (nextPage) => {
    const next = new URLSearchParams(searchParams)
    next.set('page', String(nextPage))
    setSearchParams(next)
  }

  return (
    <main className="lixmar-search">
      <div className="lixmar-search__shell">
        <section className="lixmar-search__hero">
          <div>
            <p className="lixmar-search__eyebrow">{catalogMode ? 'Catálogo' : 'Búsqueda'}</p>
            <h1>{title}</h1>
            <p className="lixmar-search__summary">{loading ? 'Buscando…' : `${total} productos encontrados en LIXMAR`}</p>
          </div>
          <Link to="/productos" className="lixmar-search__browse-link">Ver catálogo completo</Link>
        </section>

        <section className="lixmar-search__layout">
          <aside className="lixmar-search__filters" aria-label="Filtros de búsqueda">
            <div className="lixmar-search__filters-title"><FaFilter size={14} /><span>Filtros</span></div>
            <div className="lixmar-search__filter-group">
              <h2>Categoría</h2>
              <div className="lixmar-search__category-list">
                <button type="button" className={`lixmar-search__category${!categoryId ? ' lixmar-search__category--active' : ''}`}
                  onClick={() => updateFilter('category_id', '')}>Todos</button>
                {categories.map((category) => (
                  <button key={category.id} type="button"
                    className={`lixmar-search__category${categoryId === String(category.id) ? ' lixmar-search__category--active' : ''}`}
                    onClick={() => updateFilter('category_id', String(category.id))}>{category.name}</button>
                ))}
              </div>
            </div>
            <div className="lixmar-search__filter-group">
              <h2>Precio</h2>
              <form key={`${searchParams.get('min_price')}-${searchParams.get('max_price')}`} onSubmit={(event) => {
                event.preventDefault()
                const form = new FormData(event.currentTarget)
                const next = new URLSearchParams(searchParams)
                for (const field of ['min_price', 'max_price']) {
                  const value = String(form.get(field) || '').trim()
                  if (value) next.set(field, value)
                  else next.delete(field)
                }
                next.delete('page')
                setSearchParams(next)
              }}>
                <label>Desde <input type="number" name="min_price" min="0" step="0.01" defaultValue={searchParams.get('min_price') || ''} /></label>
                <label>Hasta <input type="number" name="max_price" min="0" step="0.01" defaultValue={searchParams.get('max_price') || ''} /></label>
                <button type="submit">Aplicar</button>
              </form>
            </div>
            <div className="lixmar-search__filter-group">
              <h2>Estado</h2>
              <select aria-label="Estado del producto" value={searchParams.get('condition') || ''} onChange={(event) => updateFilter('condition', event.target.value)}>
                <option value="">Todos</option><option value="new">Nuevo</option><option value="used">Usado</option>
              </select>
            </div>
          </aside>

          <section className="lixmar-search__results" aria-label={title}>
            <div className="lixmar-search__toolbar">
              <div className="lixmar-search__toolbar-label"><FaMagnifyingGlass size={14} /><span>{query || 'Todos los productos'}</span></div>
              <label className="lixmar-search__sort">
                <FaArrowDownWideShort size={14} /><span>Ordenar</span>
                <select value={sort} onChange={(event) => updateFilter('sort', event.target.value)}>
                  <option value="relevance">Relevancia</option>
                  <option value="price_asc">Menor precio</option>
                  <option value="price_desc">Mayor precio</option>
                  <option value="newest">Más recientes</option>
                </select>
              </label>
            </div>
            {loading && <p role="status">Cargando resultados…</p>}
            {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button></div>}
            {!loading && !error && results.length > 0 && (
              <div className="lixmar-search__grid">
                {results.map((product) => (
                  <ProductCard key={product.id} {...productCardProps(product)} />
                ))}
              </div>
            )}
            {!loading && !error && results.length === 0 && (
              <div className="lixmar-search__empty"><FaSliders size={26} /><h2>No encontramos resultados</h2><p>Probá con otra búsqueda o revisá los filtros seleccionados.</p></div>
            )}
            {!loading && !error && lastPage > 1 && (
              <nav aria-label="Páginas de resultados">
                <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
                <span> Página {page} de {lastPage} </span>
                <button type="button" disabled={page >= lastPage} onClick={() => changePage(page + 1)}>Siguiente</button>
              </nav>
            )}
          </section>
        </section>
      </div>
    </main>
  )
}
