import { Link } from 'react-router-dom'
import Breadcrumb from '@/components/layout/Breadcrumb'

export default function LoginPage() {
  return (
    <main className="container">
      <Breadcrumb items={[{ to: '/', label: 'Inicio' }, { to: '#', label: 'Página' }, { label: 'Ingresar' }]} />

      <section className="lixmar-login">
        <div className="lixmar-login__illustration">
          <img src="/assets/0eda5d41eb1c7b3af71cd7be440e6880fbf91c0b.png" alt="Login illustration" />
        </div>
        <div className="lixmar-login__form">
          <h1 className="lixmar-login__title">Bienvenido de nuevo</h1>
          <p className="lixmar-login__subtitle">INICIA SESIÓN PARA CONTINUAR</p>
          <form onSubmit={(e) => e.preventDefault()}>
            <div className="lixmar-login__field">
              <label className="lixmar-login__label">Dirección de correo electrónico</label>
              <input type="email" className="lixmar-login__input" placeholder="Ejemplo@gmail.com" />
            </div>
            <div className="lixmar-login__field">
              <label className="lixmar-login__label">Contraseña</label>
              <div className="lixmar-login__password-wrap">
                <input type="password" className="lixmar-login__input" placeholder="...." />
                <button type="button" className="lixmar-login__toggle-pass" aria-label="Mostrar contraseña">👁️</button>
              </div>
            </div>
            <a href="#" className="lixmar-login__forgot">¿Olvidaste tu contraseña?</a>
            <button type="submit" className="lixmar-login__submit">INGRESAR</button>
          </form>
          <p className="lixmar-login__register">
            NUEVO USUARIO? <Link to="/registro">REGISTRARSE</Link>
          </p>
        </div>
      </section>
    </main>
  )
}
