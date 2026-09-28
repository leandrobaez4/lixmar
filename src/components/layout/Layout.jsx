import { Outlet } from 'react-router-dom'
import Header from './Header'
import Footer from './Footer'

export default function Layout() {
  return (
    <>
      <a className="lix-skip-link" href="#contenido-principal">Saltar al contenido principal</a>
      <Header />
      <div id="contenido-principal" tabIndex={-1}><Outlet /></div>
      <Footer />
    </>
  )
}
