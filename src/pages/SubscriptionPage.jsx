import Breadcrumb from '@/components/layout/Breadcrumb'

export default function SubscriptionPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Suscripción' }]} />
      <h2 style={{ margin: '30px 0', fontSize: '24px', fontWeight: 700 }}>Planes de Suscripción</h2>
      <p style={{ color: '#666', marginBottom: '40px' }}>Página en migración — contenido completo próximamente.</p>
    </main>
  )
}
