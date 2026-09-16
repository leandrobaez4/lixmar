import { Link } from 'react-router-dom'
import ProductCard from '@/components/ui/ProductCard'
import '@/scss/pages/HomePage.scss'

const categories = [
  {
    id: 'tecnologia',
    name: 'Tecnología',
    href: '/productos?categoria=tecnologia',
    image: '/assets/home/category-tecnologia.png',
  },
  {
    id: 'electro',
    name: 'Electrodomésticos',
    href: '/productos?categoria=electrodomesticos',
    image: '/assets/home/category-electro.png',
  },
  {
    id: 'hogar',
    name: 'Hogar',
    href: '/productos?categoria=hogar',
    image: '/assets/home/category-hogar.png',
  },
  {
    id: 'moda',
    name: 'Moda',
    href: '/productos?categoria=moda',
    image: '/assets/home/category-moda.png',
  },
  {
    id: 'deportes',
    name: 'Deportes',
    href: '/productos?categoria=deportes',
    image: '/assets/home/category-deportes.png',
  },
  {
    id: 'autos',
    name: 'Autos',
    href: '/productos?categoria=autos',
    image: '/assets/home/category-autos.png',
  },
]

const recommendedProducts = [
  {
    id: 1,
    title: 'iPhone 17 Pro Max 256 GB',
    price: 2399999,
    image: '/assets/home/product-iphone-17.png',
    installmentText: '6 cuotas sin interés',
    shippingText: 'Envío gratis a todo el país',
    isFreeShipping: true,
  },
  {
    id: 2,
    title: 'PlayStation 5 Slim 1 TB',
    price: 1249999,
    image: '/assets/home/product-playstation-5.png',
    installmentText: 'Envío gratis',
    shippingText: 'Llega mañana',
    isFreeShipping: true,
  },
  {
    id: 3,
    title: 'MacBook Air 13” M3',
    price: 2149999,
    image: '/assets/home/product-macbook-air.png',
    installmentText: '12 cuotas',
    shippingText: 'Envío asegurado',
    isFreeShipping: false,
  },
  {
    id: 4,
    title: 'Smart TV 55” 4K UHD',
    price: 899999,
    image: '/assets/home/product-smart-tv-55.png',
    installmentText: 'Oferta destacada',
    shippingText: 'Retiro o envío',
    isFreeShipping: false,
  },
]

const recentProducts = [
  {
    id: 3,
    title: 'Smart TV 55” Full HD',
    price: 549999,
    image: '/assets/home/product-smart-tv-fullhd.png',
    installmentText: '6 cuotas',
    shippingText: 'Envío a todo el país',
    isFreeShipping: false,
  },
  {
    id: 4,
    title: 'Carpa para 2 personas',
    price: 1399999,
    image: '/assets/home/product-carpa.png',
    installmentText: 'Envío gratis',
    shippingText: 'Stock disponible',
    isFreeShipping: true,
  },
  {
    id: 2,
    title: 'Campera The North Face',
    price: 1299999,
    image: '/assets/home/product-campera.png',
    installmentText: '10% OFF',
    shippingText: 'Entrega coordinada',
    isFreeShipping: false,
  },
  {
    id: 1,
    title: 'Zapatillas Air Zoom Nike',
    price: 749999,
    image: '/assets/home/product-zapatillas.png',
    installmentText: 'Cuotas disponibles',
    shippingText: 'Llega en 24 h',
    isFreeShipping: false,
  },
]

function SectionHeader({ title, actionLabel, href }) {
  return (
    <div className="ml-home__section-header">
      <h2>{title}</h2>
      <Link to={href}>{actionLabel}</Link>
    </div>
  )
}

function ProductSection({ title, actionLabel, href, products }) {
  return (
    <section className="ml-home__section">
      <SectionHeader title={title} actionLabel={actionLabel} href={href} />
      <div className="ml-home__products-grid">
        {products.map((product) => (
          <ProductCard key={`${title}-${product.id}-${product.title}`} {...product} />
        ))}
      </div>
    </section>
  )
}

export default function HomePage() {
  return (
    <main className="ml-home">
      <div className="ml-home__content">
        <section className="ml-home__hero" aria-label="Encontrá todo lo que necesitás">
          <img src="/assets/home/banner-lix-hero.png" alt="Encontrá todo lo que necesitás en Lixmar" />
        </section>

        <section className="ml-home__categories">
          <SectionHeader title="Explorá por categoría" actionLabel="Ver todas" href="/productos" />
          <div className="ml-home__categories-grid">
            {categories.map((category) => (
              <Link key={category.id} className="ml-home__category-card" to={category.href} aria-label={category.name}>
                <img src={category.image} alt="" loading="lazy" />
              </Link>
            ))}
          </div>
        </section>

        <ProductSection
          title="Recomendados para vos"
          actionLabel="Ver más"
          href="/productos"
          products={recommendedProducts}
        />

        <ProductSection
          title="Publicados recientemente"
          actionLabel="Ver más"
          href="/productos"
          products={recentProducts}
        />

        <div className="ml-home__benefits" aria-label="Beneficios de Lixmar">
          <img src="/assets/home/benefits-lixmar.png" alt="Beneficios de comprar y vender con Lixmar" loading="lazy" />
        </div>
      </div>
    </main>
  )
}
