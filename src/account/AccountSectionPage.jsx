import { Link } from 'react-router-dom'

const content = {
  mensajes: {
    title: 'Mensajes',
    description: 'Las conversaciones de tu cuenta aparecerán acá cuando estén disponibles en el sitio.',
  },
}

export default function AccountSectionPage({ section }) {
  if (section === 'configuracion') {
    return <section className="lixmar-account-panel">
      <header className="lixmar-account__heading"><h1>Configuración</h1><p>Administrá tus datos y preferencias de cuenta.</p></header>
      <article className="lixmar-account__card"><h2>Direcciones</h2><p>Guardá y administrá tus direcciones de envío.</p><Link className="lixmar-account__button" to="/direcciones">Ver direcciones</Link></article>
      <article className="lixmar-account__card"><h2>Medios de pago</h2><p>Consultá las opciones disponibles para pagar tus compras.</p><Link className="lixmar-account__button" to="/medios-de-pago">Ver medios de pago</Link></article>
      <article className="lixmar-account__card"><h2>Verificación de identidad</h2><p>Consultá el estado de tu cuenta.</p><Link className="lixmar-account__button" to="/verificacion">Ver estado</Link></article>
      <article className="lixmar-account__card"><h2>Datos fiscales</h2><p>La configuración de DNI, CUIT y datos de facturación todavía no está disponible en el sitio.</p></article>
    </section>
  }

  if (section === 'medios-de-pago') {
    return <section className="lixmar-account-panel" aria-labelledby="payment-methods-title">
      <header className="lixmar-account__heading"><h1 id="payment-methods-title">Medios de pago</h1><p>Administrá tarjetas y métodos guardados.</p></header>
      <article className="lixmar-account__card"><h2>Medios guardados</h2><p>Todavía no se pueden consultar ni guardar tarjetas desde el sitio. Podés elegir un medio al pagar una compra.</p><Link className="lixmar-account__button" to="/compras">Ver mis compras</Link></article>
    </section>
  }

  const { title, description } = content[section] || { title: 'Mi cuenta', description: '' }

  return <section className="lixmar-account-panel">
    <header className="lixmar-account__heading"><h1>{title}</h1><p>{description}</p></header>
  </section>
}
