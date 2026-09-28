import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { accountRequest, formatMoney } from '@/account/accountApi'

const statusLabels = {
  pending: 'Pendiente', paid: 'Pagada', shipped: 'Enviada', delivered: 'Entregada',
  completed: 'Completada', canceled: 'Cancelada', refunded: 'Reembolsada',
}

const sellerFilters = [
  ['', 'Todas'], ['pending', 'Pendientes'], ['paid', 'A preparar'],
  ['shipped', 'En camino'], ['delivered', 'Entregadas'], ['canceled', 'Canceladas'],
]

function orderDate(date) {
  return date ? new Date(date).toLocaleDateString('es-AR', { day: 'numeric', month: 'long', year: 'numeric' }) : 'Fecha no disponible'
}

export default function AccountOrdersPage({ seller = false }) {
  const { id } = useParams()
  const [params, setParams] = useSearchParams()
  const page = Math.max(1, Number(params.get('page')) || 1)
  const status = params.get('status') || ''
  const base = seller ? '/ventas' : '/compras'
  const endpoint = seller ? '/sales' : '/orders'
  const title = seller ? 'Ventas' : 'Mis compras'
  const [orders, setOrders] = useState([])
  const [order, setOrder] = useState(null)
  const [meta, setMeta] = useState({ current_page: 1, last_page: 1 })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [retry, setRetry] = useState(0)

  useEffect(() => {
    const controller = new AbortController()
    setLoading(true)
    setError('')
    setOrder(null)
    const query = new URLSearchParams({ page: String(page) })
    if (status) query.set('status', status)
    const path = id ? `${endpoint}/${encodeURIComponent(id)}` : `${endpoint}?${query}`
    accountRequest(path, { signal: controller.signal }).then((payload) => {
      if (controller.signal.aborted) return
      if (id) setOrder(payload.data)
      else {
        setOrders(payload.data || [])
        setMeta(payload.meta || { current_page: 1, last_page: 1 })
      }
    }).catch((failure) => {
      if (!controller.signal.aborted) setError(failure.message)
    }).finally(() => {
      if (!controller.signal.aborted) setLoading(false)
    })
    return () => controller.abort()
  }, [endpoint, id, page, status, retry])

  const changePage = (next) => setParams({ page: String(next), ...(status ? { status } : {}) })
  const changeStatus = (next) => setParams({ page: '1', ...(next ? { status: next } : {}) })
  const lines = order?.lines || []
  const pageRevenue = orders.reduce((sum, item) => sum + (Number(item.totals?.grand_total) || 0), 0)
  const awaitingDispatch = orders.filter((item) => item.status === 'paid').length

  return <section className="lixmar-account-panel" aria-labelledby="account-orders-title">
    {!id ? <header className="lixmar-account__heading lixmar-account__heading--action">
      <div><h1 id="account-orders-title">{title}</h1><p>{seller ? 'Gestioná pedidos, cobros y entregas de tus publicaciones.' : 'Revisá tus pedidos, pagos y entregas.'}</p></div>
      {seller ? <Link className="lixmar-account__button lixmar-account__button--compact" to="/vender">Nueva publicación</Link> : null}
    </header> : null}

    {loading ? <p className="lixmar-account__status" role="status">Cargando {title.toLowerCase()}…</p> : null}
    {error ? <div className="lixmar-account__status lixmar-account__status--error" role="alert"><p>{error}</p><button type="button" onClick={() => setRetry((count) => count + 1)}>Reintentar</button></div> : null}

    {!loading && !error && id && order ? <section className="lixmar-account-panel" aria-labelledby="order-detail-title">
      <header className="lixmar-account__heading">
        <Link className="lixmar-account__back" to={base}>← Volver a {seller ? 'ventas' : 'mis compras'}</Link>
        <h1 id="order-detail-title">Detalle de {seller ? 'venta' : 'compra'}</h1>
        <p>{seller ? 'Venta' : 'Compra'} #{order.id} · {orderDate(order.created_at)}</p>
      </header>
      <div className="lixmar-account__order-status" aria-label="Estado de la orden">
        <strong>{order.status_label || statusLabels[order.status] || order.status}</strong>
        {order.payment ? <span>Pago: {order.payment.status}</span> : null}
        {order.shipment ? <span>Envío: {order.shipment.status}</span> : null}
      </div>
      {lines.map((line) => <article className="lixmar-account__product" key={line.id}>
        <div className="lixmar-account__product-copy">
          <h2>{line.product_title}</h2>
          <p>Cantidad: {line.quantity} · {seller ? order.buyer?.name || 'Comprador' : order.seller?.name || 'Vendedor'}</p>
          <strong>{formatMoney(line.subtotal, order.totals?.currency)}</strong>
        </div>
        {line.product_id ? <Link className="lixmar-account__button lixmar-account__button--compact" to={'/producto/' + line.product_id}>Ver publicación</Link> : null}
      </article>)}
      <article className="lixmar-account__card">
        <h2>Entrega</h2>
        <p>{order.shipping_address_snapshot?.street || 'Dirección no disponible'} {order.shipping_address_snapshot?.street_number || ''}</p>
        <p>{order.shipment ? [order.shipment.carrier, order.shipment.tracking_number].filter(Boolean).join(' · ') || 'Seguimiento aún no disponible' : 'El envío todavía no fue creado.'}</p>
      </article>
      <article className="lixmar-account__card"><h2>Pago</h2><p>{order.payment ? order.payment.gateway + ' · ' + order.payment.status : 'Todavía no hay un pago registrado.'}</p></article>
      <article className="lixmar-account__card"><h2>Resumen</h2>
        <dl className="lixmar-account__summary">
          <div><dt>Productos</dt><dd>{formatMoney(order.totals?.items_subtotal, order.totals?.currency)}</dd></div>
          <div><dt>Envío</dt><dd>{formatMoney(order.totals?.shipping_cost, order.totals?.currency)}</dd></div>
          <div className="lixmar-account__summary-total"><dt>Total</dt><dd>{formatMoney(order.totals?.grand_total, order.totals?.currency)}</dd></div>
        </dl>
      </article>
    </section> : null}

    {!loading && !error && !id ? <>
      {seller ? <>
        <div className="lixmar-account__metrics" aria-label="Resumen de ventas">
          <div><span>Ventas registradas</span><strong>{meta.total ?? orders.length}</strong></div>
          <div><span>Ingresos de esta página</span><strong>{formatMoney(pageRevenue)}</strong></div>
          <div><span>Por despachar en esta página</span><strong>{awaitingDispatch}</strong></div>
        </div>
        <nav className="lixmar-account__filters" aria-label="Filtrar ventas por estado">
          {sellerFilters.map(([value, label]) => <button key={label} type="button" aria-current={status === value ? 'page' : undefined} onClick={() => changeStatus(value)}>{label}</button>)}
        </nav>
      </> : null}
      {orders.length === 0 ? <p className="lixmar-account__empty">Todavía no tenés {seller ? 'ventas para este estado' : 'compras'}.</p> :
        <div className="lixmar-account__table-wrap"><table className="lixmar-account__table">
          <thead><tr><th>Pedido</th><th>Publicación</th><th>{seller ? 'Comprador' : 'Vendedor'}</th><th>Total</th><th>Estado</th><th>Acción</th></tr></thead>
          <tbody>{orders.map((item) => <tr key={item.id}>
            <td>#{item.id}</td><td>{item.lines?.map((line) => line.product_title).join(', ') || 'Sin productos'}</td>
            <td>{seller ? item.buyer?.name || 'Sin datos' : item.seller?.name || 'Sin datos'}</td>
            <td>{formatMoney(item.totals?.grand_total, item.totals?.currency)}</td>
            <td>{item.status_label || statusLabels[item.status] || item.status}</td>
            <td><Link className="lixmar-account__button lixmar-account__button--small" to={base + '/' + item.id}>Ver {seller ? 'venta' : 'compra'}</Link></td>
          </tr>)}</tbody>
        </table></div>}
      {meta.last_page > 1 ? <nav className="lixmar-account__pagination" aria-label={'Páginas de ' + title.toLowerCase()}>
        <button type="button" disabled={page <= 1} onClick={() => changePage(page - 1)}>Anterior</button>
        <span>Página {page} de {meta.last_page}</span>
        <button type="button" disabled={page >= meta.last_page} onClick={() => changePage(page + 1)}>Siguiente</button>
      </nav> : null}
    </> : null}
  </section>
}
