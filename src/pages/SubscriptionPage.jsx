import Breadcrumb from '@/components/layout/Breadcrumb'

const plans = [
  {
    name: 'Plan Inicial', icon: '🌐', price: '$4,99',
    desc: 'Ideal para empezar a vender sin límites.',
    btnClass: 'lixmar-pricing__btn--dark',
    features: ['Hasta 3 publicaciones por categoría','0% comisiones','Visibilidad estándar en listados','Panel de ventas simple','Soporte por email'],
  },
  {
    name: 'Plan PRO', icon: '★', iconClass: 'lixmar-pricing__icon--star', price: '$9,99',
    desc: 'El plan más elegido para crecer tu tienda.',
    btnClass: 'lixmar-pricing__btn--orange', popular: true,
    features: ['Hasta 10 publicaciones por categoría','0% comisiones','Alta visibilidad + prioridad en búsquedas','Estadísticas de ventas','Soporte prioritario'],
  },
  {
    name: 'Plan Empresarial', icon: '⚡', iconClass: 'lixmar-pricing__icon--bolt', price: '$49,99',
    desc: 'Pensado para marcas, distribuidores y grandes catálogos.',
    btnClass: 'lixmar-pricing__btn--dark',
    features: ['Publicaciones ilimitadas + carga masiva','0% comisiones','Integración API / ERP','Analíticas avanzadas','Soporte directo / WhatsApp'],
  },
]

export default function SubscriptionPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Suscripción' }]} />
      <section className="lixmar-pricing">
        <span className="lixmar-pricing__badge">Precios</span>
        <h2 className="lixmar-pricing__heading">Elegí tu plan</h2>
        <div className="lixmar-pricing__grid">
          {plans.map(plan => (
            <div className={`lixmar-pricing__card${plan.popular ? ' lixmar-pricing__card--popular' : ''}`} key={plan.name}>
              {plan.popular && <span className="lixmar-pricing__popular-tag">Más popular</span>}
              <div className="lixmar-pricing__card-header">
                <span className={`lixmar-pricing__icon${plan.iconClass ? ` ${plan.iconClass}` : ''}`}>{plan.icon}</span>
                <h3 className="lixmar-pricing__plan-name">{plan.name}</h3>
              </div>
              <div className="lixmar-pricing__price-row">
                <span className="lixmar-pricing__price">{plan.price}</span>
                <span className="lixmar-pricing__period">/ mes</span>
              </div>
              <p className="lixmar-pricing__desc">{plan.desc}</p>
              <a href="#" className={`lixmar-pricing__btn ${plan.btnClass}`}>Suscribirme</a>
              <ul className="lixmar-pricing__features">
                {plan.features.map(f => (
                  <li key={f}><span className="lixmar-pricing__check">✓</span> {f}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
