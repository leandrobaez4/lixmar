import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return <main className="container" style={{ paddingBlock: '4rem' }}>
    <h1>Esta página no existe</h1>
    <p>La dirección que buscaste no está disponible.</p>
    <Link to="/productos">Volver al catálogo</Link>
  </main>
}
