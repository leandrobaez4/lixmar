import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { accountRequest } from '@/account/accountApi'
import { getPublicSession, subscribeToPublicSession } from '@/auth/publicSession'

export default function ProductReviews({ productId }) {
  const [session, setSession] = useState(getPublicSession())
  const [reviews, setReviews] = useState([])
  const [meta, setMeta] = useState(null)
  const [page, setPage] = useState(1)
  const [eligibility, setEligibility] = useState(null)
  const [rating, setRating] = useState(5)
  const [body, setBody] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => subscribeToPublicSession(() => setSession(getPublicSession())), [])

  useEffect(() => {
    let active = true
    setReviews([])
    setMeta(null)
    accountRequest(`/catalog/products/${productId}/reviews?page=${page}`)
      .then((result) => { if (active) { setReviews(result.data || []); setMeta(result.meta) } })
      .catch(() => { if (active) setMessage('No se pudieron cargar las reseñas.') })
    return () => { active = false }
  }, [productId, page])

  useEffect(() => {
    let active = true
    setEligibility(null)
    if (session) accountRequest(`/catalog/products/${productId}/reviews/eligibility`)
      .then((result) => { if (active) setEligibility(result.data) })
      .catch(() => { if (active) setEligibility(null) })
    return () => { active = false }
  }, [productId, session])

  const submit = async (event) => {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      await accountRequest(`/catalog/products/${productId}/reviews`, {
        method: 'POST', body: JSON.stringify({ rating: Number(rating), body: body.trim() || null }),
      })
      setEligibility({ eligible: false, reason: 'Tu reseña está pendiente de moderación.' })
      setBody('')
      setMessage('Tu reseña está pendiente de moderación.')
    } catch (error) {
      setMessage(error.message)
    } finally {
      setBusy(false)
    }
  }

  return <section className="lix-reviews-card" aria-label="Reseñas del producto">
    <h2>Opiniones del producto</h2>
    {meta?.total ? <div className="lix-reviews-layout">
      <div className="lix-review-summary">
        <strong>{String(meta.average_rating).replace('.', ',')}</strong>
        <div><span aria-label="Calificación de compradores">★★★★★</span><p>{meta.total} opinion{meta.total === 1 ? '' : 'es'}</p></div>
      </div>
      <div className="lix-review-list">
        {reviews.map((review) => <article key={review.id} className="lix-review">
          <span aria-label={`${review.rating} de 5 estrellas`}>{'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}</span>
          {review.body && <p>{review.body}</p>}
          <small>Compra verificada · {new Date(review.created_at).toLocaleDateString('es-AR')}</small>
        </article>)}
      </div>
    </div> : <p>Todavía no hay reseñas aprobadas.</p>}
    {meta?.last_page > 1 && <nav className="lix-reviews-pages" aria-label="Páginas de reseñas">
      <button type="button" disabled={page === 1} onClick={() => setPage(page - 1)}>Anterior</button>
      <span>Página {page} de {meta.last_page}</span>
      <button type="button" disabled={page === meta.last_page} onClick={() => setPage(page + 1)}>Siguiente</button>
    </nav>}
    {!session && <p><Link to="/login">Iniciá sesión</Link> para reseñar una compra recibida.</p>}
    {eligibility?.eligible && <form className="lix-review-form" onSubmit={submit}>
      <h3>Reseñá tu compra</h3>
      <label>Calificación <select value={rating} onChange={(event) => setRating(event.target.value)}>
        {[5, 4, 3, 2, 1].map((value) => <option key={value} value={value}>{value} estrellas</option>)}
      </select></label>
      <label>Tu experiencia <textarea maxLength="1000" value={body} onChange={(event) => setBody(event.target.value)} /></label>
      <button type="submit" disabled={busy}>{busy ? 'Enviando…' : 'Enviar reseña'}</button>
    </form>}
    {eligibility && !eligibility.eligible && <p>{eligibility.reason}</p>}
    {message && <p role="status">{message}</p>}
  </section>
}
