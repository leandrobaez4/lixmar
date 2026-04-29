import Breadcrumb from '@/components/layout/Breadcrumb'

export default function AboutPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Sobre nosotros' }]} />

      <section className="lixmar-about">
        <div className="lixmar-about__hero">
          <div className="lixmar-about__banner" style={{ backgroundImage: "url('/assets/1333657b62d5951cab503cc5588b2c67ff3f5306.png')" }}>
            <h2 className="lixmar-about__title">La mejor manera de vender sin perder ganancias</h2>
            <div className="lixmar-about__subtitle">
              <p className="lixmar-about__subtitle-bold">El único marketplace sin comisiones con plan fijo en Argentina.</p>
              <p className="lixmar-about__subtitle-text">Un lugar donde vendedores y emprendedores pueden publicar sin límites, ganar el 100% de cada venta y crecer sin barreras.</p>
            </div>
          </div>
          <div className="lixmar-about__stats">
            <div className="lixmar-about__stat">
              <p className="lixmar-about__stat-text">NUESTRA MISIÓN ES <span className="lixmar-about__highlight">TRANSFORMAR</span> EL COMERCIO DIGITAL EN <span className="lixmar-about__highlight">ARGENTINA</span></p>
            </div>
            <div className="lixmar-about__stat">
              <p className="lixmar-about__stat-number">+3.200 <span>vendedores</span></p>
              <p className="lixmar-about__stat-desc">Confiando en el modelo sin comisiones.</p>
            </div>
            <div className="lixmar-about__stat">
              <p className="lixmar-about__stat-number">+15.000 <span>productos</span></p>
              <p className="lixmar-about__stat-desc">En categorías generales, tecnología, hogar y más.</p>
            </div>
            <div className="lixmar-about__stat">
              <p className="lixmar-about__stat-label">Modelo único en Argentina</p>
              <p className="lixmar-about__stat-desc">Plan fijo mensual, sin costos ocultos.</p>
            </div>
          </div>
        </div>

        <div className="lixmar-about__mission">
          <div className="lixmar-about__mission-img">
            <img src="/assets/0fc68c2b6b7accb5cf4fcfae1e726e88c78d5b15.png" alt="Nuestra misión" />
          </div>
          <div className="lixmar-about__mission-info">
            <h3 className="lixmar-about__mission-title">NUESTRA MISIÓN Y VISIÓN</h3>
            <p className="lixmar-about__mission-text"><strong>LIXMAR</strong> nació para ofrecer a todos los argentinos un marketplace justo, moderno y transparente. Creemos en potenciar a los vendedores, acompañar a los emprendedores y simplificar el comercio digital con tecnología diseñada para todos.</p>
            <p className="lixmar-about__mission-text">Nuestro objetivo es construir una plataforma sólida, segura y lista para escalar a miles de usuarios, manteniendo siempre la accesibilidad, la transparencia y la igualdad de oportunidades como pilares centrales de <strong>LIXMAR</strong>.</p>
            <a href="#" className="lixmar-about__cta">CÓMO FUNCIONA LIXMAR</a>
          </div>
        </div>
      </section>

      <section className="lixmar-about-features">
        <div className="lixmar-about-features__grid">
          {[
            { title: 'SIN COMISIONES POR VENTA', icon: 'fbde5d23-f465-4430-b41f-e1aedeb4b51d', text: 'En LIXMAR los vendedores se quedan con el 100% de sus ganancias. Solo pagan un plan mensual accesible, sin cargos ocultos ni sorpresas.' },
            { title: 'PUBLICACIÓN EN MINUTOS', icon: 'eac67be8-767e-45e5-ac62-187ef1b1fe0d', text: 'Subí tus productos de manera simple y rápida. Fotos, precio y descripción… ¡y listo!' },
            { title: 'PRECIO ACCESIBLE', icon: '7a02d602-d5bf-448a-ad2d-aff7563644ad', text: 'Un único plan mensual que permite publicar productos ilimitados y acceder a todas las funciones de LIXMAR sin restricciones.' },
          ].map((f) => (
            <div className="lixmar-about-features__card" key={f.title}>
              <div className="lixmar-about-features__header">
                <h4 className="lixmar-about-features__title">{f.title}</h4>
                <span className="lixmar-about-features__icon"><img src={`https://www.figma.com/api/mcp/asset/${f.icon}`} alt={f.title} /></span>
              </div>
              <p className="lixmar-about-features__text">{f.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="lixmar-team">
        <h3 className="lixmar-team__title">Nuestro Equipo</h3>
        <div className="lixmar-team__grid">
          {[
            { name: 'Henry Avery', role: 'Chairman', img: 'cedd94db-6655-4c08-adb8-2738b7391c70' },
            { name: 'Michael Edward', role: 'Vice President', img: '7dc81f7b-e5c1-4451-b78c-a8b2fe91d878' },
            { name: 'Eden Hazard', role: 'CEO', img: 'a87288ed-b945-4b29-9712-683f2695207b' },
            { name: 'Robert Downey Jr', role: 'CEO', img: 'f2cdce8f-9721-4c38-9d91-bdd34b4c7881' },
            { name: 'Nathan Drake', role: 'Strategist Director', img: 'aafd6eac-c63a-44b1-9498-768234d2312f' },
          ].map((member) => (
            <div className="lixmar-team__member" key={member.name}>
              <div className="lixmar-team__photo"><img src={`https://www.figma.com/api/mcp/asset/${member.img}`} alt={member.name} /></div>
              <h4 className="lixmar-team__name">{member.name}</h4>
              <p className="lixmar-team__role">{member.role}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
