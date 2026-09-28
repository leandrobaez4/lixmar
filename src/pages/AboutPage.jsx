import { FaCamera, FaCoins, FaStore } from 'react-icons/fa6'

const features = [
  {
    title: 'Sin comisiones por venta',
    icon: FaCoins,
    text: 'Los vendedores publican con un plan mensual y conservan el importe de sus ventas, sujeto a los costos del medio de pago que elijan.',
  },
  {
    title: 'Publicá tus productos',
    icon: FaCamera,
    text: 'Agregá fotos, precio y descripción para mostrar tus productos a quienes buscan comprar.',
  },
  {
    title: 'Tu tienda en Lixmar',
    icon: FaStore,
    text: 'Administrá tus publicaciones y pedidos desde un mismo lugar.',
  },
]

export default function AboutPage() {
  return (
    <main className="container">
      <section className="lixmar-about" aria-labelledby="about-title">
        <div className="lixmar-about__hero">
          <div className="lixmar-about__banner">
            <h1 className="lixmar-about__title" id="about-title">Una forma simple de vender en línea</h1>
            <div className="lixmar-about__subtitle">
              <p className="lixmar-about__subtitle-bold">Un marketplace para emprendedores y vendedores de Argentina.</p>
              <p className="lixmar-about__subtitle-text">Publicá tus productos con un plan mensual y administrá tu actividad desde Lixmar.</p>
            </div>
          </div>
        </div>

        <div className="lixmar-about__mission">
          <div className="lixmar-about__mission-info">
            <h2 className="lixmar-about__mission-title">Nuestra misión</h2>
            <p className="lixmar-about__mission-text">Queremos facilitar la venta en línea con herramientas claras para publicar productos y gestionar pedidos.</p>
            <p className="lixmar-about__mission-text">Trabajamos para que comprar y vender sea una experiencia sencilla y accesible.</p>
            <a href="#como-funciona" className="lixmar-about__cta">Cómo funciona Lixmar</a>
          </div>
        </div>
      </section>

      <section className="lixmar-about-features" id="como-funciona" aria-labelledby="about-features-title">
        <h2 className="lixmar-about-features__heading" id="about-features-title">Cómo funciona</h2>
        <div className="lixmar-about-features__grid">
          {features.map(({ title, icon: Icon, text }) => (
            <div className="lixmar-about-features__card" key={title}>
              <div className="lixmar-about-features__header">
                <h3 className="lixmar-about-features__title">{title}</h3>
                <span className="lixmar-about-features__icon" aria-hidden="true"><Icon /></span>
              </div>
              <p className="lixmar-about-features__text">{text}</p>
            </div>
          ))}
        </div>
      </section>
    </main>
  )
}
