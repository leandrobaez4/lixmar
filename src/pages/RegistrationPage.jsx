import Breadcrumb from '@/components/layout/Breadcrumb'

export default function RegistrationPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Registro' }]} />
      <section className="lixmar-login">
        <div className="lixmar-login__illustration">
          <img src="/assets/0eda5d41eb1c7b3af71cd7be440e6880fbf91c0b.png" alt="Registro illustration" />
        </div>
        <div className="lixmar-login__form">
          <h1 className="lixmar-login__title">Crear Cuenta</h1>
          <p className="lixmar-login__subtitle">REGÍSTRATE PARA COMENZAR</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="lixmar-login__field">
              <label className="lixmar-login__label">Nombre completo</label>
              <input type="text" className="lixmar-login__input" placeholder="Tu nombre" />
            </div>
            <div className="lixmar-login__field">
              <label className="lixmar-login__label">Correo electrónico</label>
              <input type="email" className="lixmar-login__input" placeholder="Ejemplo@gmail.com" />
            </div>
            <div className="lixmar-login__field">
              <label className="lixmar-login__label">Contraseña</label>
              <input type="password" className="lixmar-login__input" placeholder="...." />
            </div>
            <button type="submit" className="lixmar-login__submit">REGISTRARSE</button>
          </form>
        </div>
      </section>
    </main>
  )
}
