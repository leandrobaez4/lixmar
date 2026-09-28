import { Navigate, Routes, Route } from 'react-router-dom'
import Layout from '@/components/layout/Layout'
import HomePage from '@/pages/HomePage'
import AboutPage from '@/pages/AboutPage'
import LoginPage from '@/pages/LoginPage'
import ForgotPasswordPage from '@/pages/ForgotPasswordPage'
import ResetPasswordPage from '@/pages/ResetPasswordPage'
import RegistrationPage from '@/pages/RegistrationPage'
import RegistrationResultPage from '@/pages/RegistrationResultPage'
import ProductsPage from '@/pages/ProductsPage'
import SearchResultsPage from '@/pages/SearchResultsPage'
import NewPublicationPage from '@/pages/NewPublicationPage'
import SellerProductsPage from '@/pages/SellerProductsPage'
import SingleProductPage from '@/pages/SingleProductPage'
import CheckoutPage from '@/pages/CheckoutPage'
import CheckoutListPage from '@/pages/CheckoutListPage'
import PaymentPage from '@/pages/PaymentPage'
import ProfilePage from '@/pages/ProfilePage'
import VerificationPage from '@/pages/VerificationPage'
import SubscriptionPage from '@/pages/SubscriptionPage'
import NotFoundPage from '@/pages/NotFoundPage'
import AccountOrdersPage from '@/pages/AccountOrdersPage'
import FavoritesPage from '@/pages/FavoritesPage'
import RequirePublicSession from '@/auth/RequirePublicSession'
import RequireSellerPublication from '@/auth/RequireSellerPublication'
import AccountLayout from '@/account/AccountLayout'
import AccountSectionPage from '@/account/AccountSectionPage'
import AddressesPage from '@/pages/AddressesPage'
import AccountNotificationsPage from '@/pages/AccountNotificationsPage'
import AccountSecurityPage from '@/pages/AccountSecurityPage'
import AccountMessagesPage from '@/pages/AccountMessagesPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route path="/" element={<HomePage />} />
        <Route path="/nosotros" element={<AboutPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/recuperar-contrasena" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/registro" element={<RegistrationPage />} />
        <Route path="/registro/resultado" element={<RegistrationResultPage />} />
        <Route path="/productos" element={<ProductsPage />} />
        <Route path="/buscar" element={<SearchResultsPage />} />
        <Route path="/producto/:id" element={<SingleProductPage />} />
        <Route path="/checkout/lista" element={<CheckoutListPage />} />
        <Route path="/pasos" element={<Navigate to="/checkout/lista" replace />} />
        <Route path="/ofertas" element={<Navigate to="/productos" replace />} />
        <Route element={<RequirePublicSession />}>
          <Route element={<RequireSellerPublication />}>
            <Route path="/vender" element={<NewPublicationPage />} />
          </Route>
          <Route path="/producto/:id/comprar" element={<SingleProductPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/pago" element={<PaymentPage />} />
          <Route element={<AccountLayout />}>
            <Route path="/perfil" element={<ProfilePage />} />
            <Route path="/compras" element={<AccountOrdersPage />} />
            <Route path="/compras/:id" element={<AccountOrdersPage />} />
            <Route path="/ventas" element={<AccountOrdersPage seller />} />
            <Route path="/mis-publicaciones" element={<SellerProductsPage />} />
            <Route path="/ventas/:id" element={<AccountOrdersPage seller />} />
            <Route path="/favoritos" element={<FavoritesPage />} />
            <Route path="/verificacion" element={<VerificationPage />} />
            <Route path="/mensajes" element={<AccountMessagesPage />} />
            <Route path="/notificaciones" element={<AccountNotificationsPage />} />
            <Route path="/configuracion" element={<AccountSectionPage section="configuracion" />} />
            <Route path="/seguridad" element={<AccountSecurityPage />} />
            <Route path="/direcciones" element={<AddressesPage />} />
            <Route path="/medios-de-pago" element={<AccountSectionPage section="medios-de-pago" />} />
          </Route>
          <Route path="/suscripcion" element={<SubscriptionPage />} />
        </Route>
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
