import { Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import LoginPage from '@/pages/LoginPage'
import RegistrationPage from '@/pages/RegistrationPage'
import ProductsPage from '@/pages/ProductsPage'
import SingleProductPage from '@/pages/SingleProductPage'
import SingleProductPayPage from '@/pages/SingleProductPayPage'
import CheckoutPage from '@/pages/CheckoutPage'
import CheckoutListPage from '@/pages/CheckoutListPage'
import PaymentPage from '@/pages/PaymentPage'
import ProfilePage from '@/pages/ProfilePage'
import VerificationPage from '@/pages/VerificationPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import StepPage from '@/pages/StepPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/registro" element={<RegistrationPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/producto/:id" element={<SingleProductPage />} />
        <Route path="/producto/:id/comprar" element={<SingleProductPayPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/checkout/lista" element={<CheckoutListPage />} />
        <Route path="/pago" element={<PaymentPage />} />
        <Route path="/perfil" element={<ProfilePage />} />
        <Route path="/verificacion" element={<VerificationPage />} />
        <Route path="/suscripcion" element={<SubscriptionPage />} />
        <Route path="/pasos" element={<StepPage />} />
      </Route>
    </Routes>
  )
}
