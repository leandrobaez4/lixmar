import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { FaXmark } from 'react-icons/fa6'
import { getPublicCartItems, setPublicCartItems } from '@/cart/publicCart'

export default function CheckoutListPage() {
  const [cartItems, setCartItems] = useState(() => getPublicCartItems())

  useEffect(() => {
    setPublicCartItems(cartItems)
  }, [cartItems])

  const formatPrice = (val) => `$${val.toLocaleString('es-AR')}`

  const updateQty = (id, newQty) => {
    setCartItems(prev => prev.map(item =>
      item.id === id ? { ...item, qty: Math.max(1, newQty) } : item
    ))
  }

  const removeItem = (id) => {
    setCartItems(prev => prev.filter(item => item.id !== id))
  }

  return (
    <main className="container">
      <section className="lixmar-cart">
        <h2 className="lixmar-cart__title">Carrito de compras</h2>

        <div className="lixmar-cart__table-wrap">
          <table className="lixmar-cart__table">
            <thead>
              <tr>
                <th className="lixmar-cart__th lixmar-cart__th--img"></th>
                <th className="lixmar-cart__th">Nombre del producto</th>
                <th className="lixmar-cart__th">Precio</th>
                <th className="lixmar-cart__th">Cantidad</th>
                <th className="lixmar-cart__th">Sub total</th>
                <th className="lixmar-cart__th lixmar-cart__th--action"></th>
              </tr>
            </thead>
            <tbody>
              {cartItems.map(item => (
                <tr className="lixmar-cart__row" key={item.id}>
                  <td className="lixmar-cart__td lixmar-cart__td--img">
                    <img src={item.img} alt={item.name} className="lixmar-cart__product-img" />
                  </td>
                  <td className="lixmar-cart__td lixmar-cart__td--name">
                    <span className="lixmar-cart__product-name">{item.name}</span>
                  </td>
                  <td className="lixmar-cart__td lixmar-cart__td--price">
                    <span className="lixmar-cart__price">{formatPrice(item.price)}</span>
                  </td>
                  <td className="lixmar-cart__td lixmar-cart__td--qty">
                    <select className="lixmar-cart__qty-select" value={item.qty} onChange={(e) => updateQty(item.id, parseInt(e.target.value))}>
                      {[1,2,3,4,5].map(n => <option key={n} value={n}>{n}</option>)}
                    </select>
                  </td>
                  <td className="lixmar-cart__td lixmar-cart__td--subtotal">
                    <span className="lixmar-cart__subtotal">{formatPrice(item.price * item.qty)}</span>
                  </td>
                  <td className="lixmar-cart__td lixmar-cart__td--remove">
                    <button className="lixmar-cart__remove-btn" aria-label="Eliminar" onClick={() => removeItem(item.id)}><FaXmark size={14} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="lixmar-cart__actions">
          <Link to="/checkout" className="lixmar-cart__btn lixmar-cart__btn--checkout">Finalizar Compra</Link>
          <button className="lixmar-cart__btn lixmar-cart__btn--clear" onClick={() => setCartItems([])}>Eliminar Todo</button>
        </div>
      </section>
    </main>
  )
}
