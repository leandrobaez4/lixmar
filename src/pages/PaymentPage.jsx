import { Link } from 'react-router-dom'

export default function PaymentPage() {
  return (
    <main className="container">
      <section className="lixmar-payment">
        <h1>Pago de suscripción</h1>
        <p>Elegí tu plan desde Suscripciones. El pago se iniciará con un proveedor externo cuando esté habilitado.</p>
        <Link to="/suscripcion">Ver planes</Link>
      </section>
    </main>
  )
}
