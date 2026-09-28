import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaXmark } from 'react-icons/fa6'
import {
  emptyPublicCart, fetchPublicCart,
  removePublicCartItem, updatePublicCartItem,
} from '@/cart/publicCart'

export default function CheckoutListPage() {
  const [cart, setCart] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [needsSession, setNeedsSession] = useState(false)
  const [busy, setBusy] = useState(false)
  const [retryCount, setRetryCount] = useState(0)
  const items = cart?.vendors?.flatMap((vendor) => vendor.items) || []

  useEffect(() => {
    let mounted = true
    setLoading(true)
    setError('')
    setNeedsSession(false)
    fetchPublicCart().then((summary) => {
      if (mounted) setCart(summary)
    }).catch((failure) => {
      if (mounted) {
        setError(failure.message)
        setNeedsSession(failure.code === 'SESSION_REQUIRED')
      }
    }).finally(() => {
      if (mounted) setLoading(false)
    })
    return () => { mounted = false }
  }, [retryCount])

  const mutate = async (operation) => {
    setBusy(true)
    setError('')
    setNeedsSession(false)
    try {
      setCart(await operation())
    } catch (failure) {
      setError(failure.message)
      setNeedsSession(failure.code === 'SESSION_REQUIRED')
    } finally {
      setBusy(false)
    }
  }

  const formatPrice = (amount, currency = cart?.currency || 'ARS') =>
    new Intl.NumberFormat('es-AR', { style: 'currency', currency }).format(Number(amount) || 0)

  return (
    <main className="container">
      <section className="lixmar-cart">
        <h1 className="lixmar-cart__title">Carrito de compras</h1>
        {loading && <p role="status">Cargando carrito…</p>}
        {error && <div role="alert">
          <p>{error}</p>
          {needsSession
            ? <Link to="/login">Iniciar sesión</Link>
            : <button type="button" onClick={() => setRetryCount((count) => count + 1)}>Reintentar</button>}
        </div>}
        {!loading && !error && items.length === 0 && <p>Tu carrito está vacío.</p>}
        {!loading && items.length > 0 && (
          <>
            <div className="lixmar-cart__table-wrap">
              <table className="lixmar-cart__table">
                <thead><tr>
                  <th className="lixmar-cart__th">Producto</th>
                  <th className="lixmar-cart__th">Precio actual</th>
                  <th className="lixmar-cart__th">Cantidad</th>
                  <th className="lixmar-cart__th">Subtotal</th>
                  <th className="lixmar-cart__th">Acción</th>
                </tr></thead>
                <tbody>{items.map((item) => (
                  <tr className="lixmar-cart__row" key={item.id}>
                    <td className="lixmar-cart__td">{item.product?.title || `Producto ${item.product_id}`}</td>
                    <td className="lixmar-cart__td">{formatPrice(item.unit_price, item.currency)}</td>
                    <td className="lixmar-cart__td">
                      <select
                        className="lixmar-cart__qty-select"
                        value={item.quantity}
                        disabled={busy}
                        aria-label={`Cantidad de ${item.product?.title || 'producto'}`}
                        onChange={(event) => mutate(() => updatePublicCartItem(item.id, Number(event.target.value)))}
                      >
                        {Array.from({ length: Math.max(5, item.quantity) }, (_, index) => index + 1)
                          .map((quantity) => <option key={quantity} value={quantity}>{quantity}</option>)}
                      </select>
                    </td>
                    <td className="lixmar-cart__td">{formatPrice(item.subtotal, item.currency)}</td>
                    <td className="lixmar-cart__td">
                      <button type="button" className="lixmar-cart__remove-btn" disabled={busy}
                        aria-label={`Eliminar ${item.product?.title || 'producto'}`}
                        onClick={() => mutate(() => removePublicCartItem(item.id))}><FaXmark size={14} /></button>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
            <p role="status">Total actualizado: {formatPrice(cart.grand_total)} · {cart.items_count} productos</p>
            {!cart.is_valid && <p role="alert">Hay productos sin disponibilidad. Revisá el carrito antes de comprar.</p>}
            <div className="lixmar-cart__actions">
              <Link to="/checkout" className="lixmar-cart__btn lixmar-cart__btn--checkout">Finalizar compra</Link>
              <button type="button" className="lixmar-cart__btn lixmar-cart__btn--clear" disabled={busy}
                onClick={() => mutate(emptyPublicCart)}>Vaciar carrito</button>
            </div>
          </>
        )}
      </section>
    </main>
  )
}
