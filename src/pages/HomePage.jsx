import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '@/components/ui/ProductCard'
import { categoryCardProps, fetchCategories, fetchProducts, productCardProps } from '@/catalog/catalogApi'
import { useDefaultProductImage } from '@/catalog/productImage'
import '@/scss/pages/HomePage.scss'

function SectionHeader({ title, actionLabel, href }) {
  return (
    <div className="ml-home__section-header">
      <h2>{title}</h2>
      <Link to={href}>{actionLabel}</Link>
    </div>
  )
}

function ProductSection({ title, products }) {
  return (
    <section className="ml-home__section">
      <SectionHeader title={title} actionLabel="Ver más" href="/productos" />
      {products.length ? (
        <div className="ml-home__products-grid">
          {products.map((product) => <ProductCard key={product.id} {...productCardProps(product)} />)}
        </div>
      ) : <p>Todavía no hay productos disponibles.</p>}
    </section>
  )
}

export default function HomePage() {
  const [categories, setCategories] = useState([])
  const [recommended, setRecommended] = useState([])
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    Promise.all([
      fetchCategories(controller.signal),
      fetchProducts({ page: 1, per_page: 4 }, controller.signal),
      fetchProducts({ page: 1, per_page: 4, sort: 'newest' }, controller.signal),
    ]).then(([categoryPayload, recommendedPayload, recentPayload]) => {
      if (controller.signal.aborted) return
      setCategories((categoryPayload.data || []).slice(0, 6).map(categoryCardProps))
      setRecommended(recommendedPayload.data || [])
      setRecent(recentPayload.data || [])
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [retry])

  return (
    <main className="ml-home">
      <h1 className="ml-home__sr-only">Lixmar: encontrá todo lo que necesitás</h1>
      <div className="ml-home__content">
        <section className="ml-home__hero" aria-label="Encontrá todo lo que necesitás">
          <img src="/assets/home/banner-lix-hero.png" alt="Encontrá todo lo que necesitás en Lixmar" />
        </section>

        {loading && <p role="status">Cargando catálogo…</p>}
        {error && <div role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((value) => value + 1)}>Reintentar</button></div>}
        {!loading && !error && <>
          <section className="ml-home__categories">
            <SectionHeader title="Explorá por categoría" actionLabel="Ver todas" href="/productos" />
            {categories.length ? <div className="ml-home__categories-grid">
              {categories.map((category) => (
                <Link key={category.id} className="ml-home__category-card" to={`/productos?category_id=${category.id}`} aria-label={category.name}>
                  {category.image && <img src={category.image} alt="" loading="lazy" onError={useDefaultProductImage} />}
                  <span className="ml-home__category-name">{category.name}</span>
                </Link>
              ))}
            </div> : <p>Todavía no hay categorías disponibles.</p>}
          </section>
          <ProductSection title="Recomendados para vos" products={recommended} />
          <ProductSection title="Publicados recientemente" products={recent} />
        </>}

        <div className="ml-home__benefits" aria-label="Beneficios de Lixmar">
          <img src="/assets/home/benefits-lixmar.png" alt="Beneficios de comprar y vender con Lixmar" loading="lazy" />
        </div>
      </div>
    </main>
  )
}
