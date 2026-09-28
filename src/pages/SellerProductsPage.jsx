import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { accountRequest, formatMoney } from '@/account/accountApi'

const statusLabels = {
  draft: 'Borrador', pending_review: 'En revisión', active: 'Activa',
  paused: 'Pausada', rejected: 'Rechazada', banned: 'Bloqueada', sold: 'Vendida',
}

export default function SellerProductsPage() {
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const status = params.get('status') || ''
  const [products, setProducts] = useState([])
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1, total: 0 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    const query = new URLSearchParams({ page: String(page) })
    if (status) query.set('status', status)
    accountRequest(`/catalog/products/mine?${query}`, { signal: controller.signal }).then((payload) => {
      if (controller.signal.aborted) return
      setProducts(Array.isArray(payload.data) ? payload.data : [])
      setMeta({ current_page: payload.current_page || 1, last_page: payload.last_page || 1, total: payload.total || 0 })
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [page, status, retry])

  const changeParams = (nextStatus, nextPage) => {
    const next = new URLSearchParams({ page: String(nextPage) })
    if (nextStatus) next.set('status', nextStatus)
    setParams(next)
  }

  return <section className="lixmar-account-panel" aria-labelledby="account-publications-title">
    <header className="lixmar-account__heading lixmar-account__heading--action">
      <div><h1 id="account-publications-title">Mis publicaciones</h1><p>Gestioná el estado y stock de tus publicaciones.</p></div>
      <Link className="lixmar-account__button lixmar-account__button--compact" to="/vender">Nueva publicación</Link>
    </header>
    <div className="lixmar-account__filters">
      <label htmlFor="publication-status">Estado</label>
      <select id="publication-status" value={status} onChange={(event) => changeParams(event.target.value, 1)}>
        <option value="">Todos</option>
        {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
      </select>
      <Link to="/ventas">Ver ventas</Link>
    </div>
    {loading ? <p className="lixmar-account__status" role="status">Cargando publicaciones…</p> : null}
    {error ? <div className="lixmar-account__status lixmar-account__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((count) => count + 1)}>Reintentar</button></div> : null}
    {!loading && !error ? <>
      <p className="lixmar-account__count">{meta.total} publicaciones</p>
      {products.length === 0 ? <p className="lixmar-account__empty">No hay publicaciones para este estado.</p> : null}
      <div className="lixmar-account__publication-list">
        {products.map((product) => <article className="lixmar-account__product" key={product.id}>
          <div className="lixmar-account__product-copy">
            <h2>{product.title}</h2>
            <p>{statusLabels[product.status] || product.status} · {product.has_unlimited_stock ? 'Stock sin límite' : 'Stock disponible: ' + (product.stock_available ?? 'No informado')}</p>
            <strong>{formatMoney(product.price, product.currency)}</strong>
            {product.rejection_reason ? <p role="status">Motivo de rechazo: {product.rejection_reason}</p> : null}
          </div>
          {product.status === 'active' ? <Link className="lixmar-account__button lixmar-account__button--compact" to={'/producto/' + product.id}>Ver publicación</Link> : null}
        </article>)}
      </div>
      {meta.last_page > 1 ? <nav className="lixmar-account__pagination" aria-label="Páginas de publicaciones">
        <button type="button" disabled={page <= 1} onClick={() => changeParams(status, page - 1)}>Anterior</button>
        <span>Página {page} de {meta.last_page}</span>
        <button type="button" disabled={page >= meta.last_page} onClick={() => changeParams(status, page + 1)}>Siguiente</button>
      </nav> : null}
    </> : null}
  </section>
}
