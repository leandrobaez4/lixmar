import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import '@/scss/pages/SubscriptionPage.scss'

const plans = [
  {
    name: 'Básico',
    price: '$ 0',
    description: 'Para empezar a vender',
    slugs: ['basico', 'basic', 'inicial', 'initial'],
  },
  {
    name: 'Profesional',
    price: '$ 14.999',
    description: 'Más herramientas y visibilidad',
    slugs: ['profesional', 'professional', 'pro'],
    featured: true,
  },
  {
    name: 'Avanzado',
    price: '$ 29.999',
    description: 'Para vendedores con mayor volumen',
    slugs: ['avanzado', 'advanced', 'empresarial', 'enterprise'],
  },
]

const features = ['Publicaciones activas', 'Soporte LIXMAR', 'Gestión desde tu perfil']

export default function SubscriptionPage() {
  const { state } = useLocation()
  const [subscription, setSubscription] = useState(null)
  const [subscriptionError, setSubscriptionError] = useState(false)
  const [selectedPlan, setSelectedPlan] = useState(null)

  useEffect(() => {
    const controller = new AbortController()

    async function loadSubscription() {
      try {
        const response = await fetch('/api/v1/billing/subscription', {
          credentials: 'same-origin',
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        })
        if (!response.ok) throw new Error('No se pudo consultar la suscripción.')
        const payload = await response.json()
        if (payload?.success !== true || (payload.data !== null && typeof payload.data !== 'object')) {
          throw new Error('Respuesta de suscripción inválida.')
        }
        if (!controller.signal.aborted) setSubscription(payload.data)
      } catch (error) {
        if (!controller.signal.aborted && error.name !== 'AbortError') setSubscriptionError(true)
      }
    }

    loadSubscription()
    return () => controller.abort()
  }, [])

  const currentSlug = subscription?.is_active === true
    ? subscription.plan?.slug?.toLowerCase()
    : null

  return (
    <main className="container">
      <section className="plan-picker" aria-labelledby="plan-picker-title">
        <h1 id="plan-picker-title" className="plan-picker__title">Elegí tu plan</h1>
        {state?.reason ? (
          <p className="plan-picker__notice" role="status">
            {state.reason === 'SELLER_REQUIRED'
              ? 'Necesitás habilitar tu cuenta como vendedor antes de publicar.'
              : 'Necesitás una suscripción activa para publicar.'}
          </p>
        ) : null}
        {subscriptionError ? (
          <p className="plan-picker__notice" role="alert">No pudimos verificar tu plan actual. Intentá actualizar la página.</p>
        ) : null}
        <div className="plan-picker__grid">
          {plans.map((plan) => {
            const isCurrent = plan.slugs.includes(currentSlug)
            return (
              <article className={`plan-picker__card${plan.featured ? ' plan-picker__card--featured' : ''}`} key={plan.name}>
                <h2 className="plan-picker__name">{plan.name}</h2>
                <p className="plan-picker__price">{plan.price}</p>
                <p className="plan-picker__period">/ mes</p>
                <p className="plan-picker__description">{plan.description}</p>
                <ul className="plan-picker__features">
                  {features.map((feature) => <li key={feature}><span aria-hidden="true">✓</span> {feature}</li>)}
                </ul>
                <button
                  type="button"
                  className={`plan-picker__button${isCurrent || plan.featured ? ' plan-picker__button--filled' : ''}`}
                  disabled={isCurrent}
                  onClick={() => setSelectedPlan(plan)}
                >
                  {isCurrent ? 'Plan actual' : 'Ver plan'}
                </button>
              </article>
            )
          })}
        </div>
        {selectedPlan ? (
          <div className="plan-picker__details" role="status">
            <strong>{selectedPlan.name}</strong>: {selectedPlan.description}. La contratación online estará disponible próximamente.
          </div>
        ) : null}
      </section>
    </main>
  )
}
