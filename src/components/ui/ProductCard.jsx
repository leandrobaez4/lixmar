import { Link } from 'react-router-dom';
import { FaPlus } from 'react-icons/fa6';
import '@/scss/components/ui/ProductCard.scss';

export default function ProductCard({
  id,
  title,
  price,
  originalPrice,
  image,
  isFreeShipping,
  isFreeGift,
  installmentText,
  shippingText,
}) {
  // Generar descuento random si hay precio original
  const discount = originalPrice ? Math.round((1 - price / originalPrice) * 100) : 0;

  // Format currency
  const formatPrice = (val) => new Intl.NumberFormat('es-AR', { style: 'currency', currency: 'ARS', maximumSignificantDigits: 9 }).format(val);

  return (
    <Link to={`/producto/${id || 1}`} className="lixmar-card" style={{ textDecoration: 'none' }}>
      <div className="lixmar-card__image-wrapper">
        {(isFreeShipping || isFreeGift) && (
          <div className="lixmar-card__badges-top">
            {isFreeShipping && <span className="badge-shipping">Envío Gratis</span>}
            {discount > 0 && <span className="badge-discount">-{discount}%</span>}
          </div>
        )}
        <img src={image || '/assets/default-placeholder.png'} alt={title} loading="lazy" />
        
        {/* Quick add button visible on hover */}
        <button className="lixmar-card__quick-add" aria-label="Agregar al carrito" onClick={(e) => { e.preventDefault(); console.log('Added!'); }}>
          <FaPlus size={14} />
        </button>
      </div>

      <div className="lixmar-card__content">
        <h3 className="lixmar-card__title" title={title}>{title}</h3>
        
        <div className="lixmar-card__pricing">
          <div className="lixmar-card__price-main">
            <span className="price-current">{formatPrice(price)}</span>
            {originalPrice && (
              <span className="price-old">{formatPrice(originalPrice)}</span>
            )}
          </div>
          {installmentText ? (
            <span className="lixmar-card__installments">{installmentText}</span>
          ) : null}
          {shippingText ? (
            <span className="lixmar-card__shipping-note">{shippingText}</span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
