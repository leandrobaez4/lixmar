// LIXMAR - Main JavaScript

document.addEventListener('DOMContentLoaded', function() {
    initializeEventListeners();
    initializeCart();
    initializeMobileMenu();
});

// Inicializar menú móvil
function initializeMobileMenu() {
    const mobileToggle = document.querySelector('.mobile-menu-toggle');
    const navMain = document.querySelector('.nav-main');
    const navItems = document.querySelectorAll('.nav-item');

    if (mobileToggle && navMain) {
        // Toggle menú móvil
        mobileToggle.addEventListener('click', function(e) {
            e.stopPropagation();
            this.classList.toggle('active');
            navMain.classList.toggle('mobile-open');
            document.body.style.overflow = navMain.classList.contains('mobile-open') ? 'hidden' : '';
        });

        // Toggle submenús en móvil
        navItems.forEach(item => {
            const dropdownLink = item.querySelector('.nav-link.dropdown');
            if (dropdownLink) {
                dropdownLink.addEventListener('click', function(e) {
                    if (window.innerWidth <= 768) {
                        e.preventDefault();
                        item.classList.toggle('submenu-open');
                    }
                });
            }
        });

        // Cerrar menú al hacer click fuera
        document.addEventListener('click', function(e) {
            if (navMain.classList.contains('mobile-open') && 
                !navMain.contains(e.target) && 
                !mobileToggle.contains(e.target)) {
                mobileToggle.classList.remove('active');
                navMain.classList.remove('mobile-open');
                document.body.style.overflow = '';
            }
        });

        // Cerrar menú al redimensionar ventana
        window.addEventListener('resize', function() {
            if (window.innerWidth > 768 && navMain.classList.contains('mobile-open')) {
                mobileToggle.classList.remove('active');
                navMain.classList.remove('mobile-open');
                document.body.style.overflow = '';
            }
        });
    }
}

// Inicializar event listeners
function initializeEventListeners() {
    // Botones de carrito
    const addToCartButtons = document.querySelectorAll('.btn-add-cart');
    addToCartButtons.forEach(button => {
        button.addEventListener('click', addToCart);
    });

    // Formulario de newsletter
    const newsletterForm = document.querySelector('.newsletter-form');
    if (newsletterForm) {
        newsletterForm.addEventListener('submit', handleNewsletterSubscription);
    }

    // Navegación suave
    const navLinks = document.querySelectorAll('.nav-main a');
    navLinks.forEach(link => {
        link.addEventListener('click', handleNavigation);
    });
}

// Agregar producto al carrito
function addToCart(event) {
    event.preventDefault();
    
    const productCard = event.target.closest('.product-card');
    const productTitle = productCard.querySelector('h3').textContent;
    const productPrice = productCard.querySelector('.sale-price').textContent;
    
    // Obtener carrito del localStorage o crear uno nuevo
    let cart = JSON.parse(localStorage.getItem('lixmarCart')) || [];
    
    // Agregar producto al carrito
    const product = {
        id: Date.now(),
        title: productTitle,
        price: productPrice,
        quantity: 1,
        timestamp: new Date().toISOString()
    };
    
    cart.push(product);
    localStorage.setItem('lixmarCart', JSON.stringify(cart));
    
    // Mostrar notificación
    showNotification(`${productTitle} agregado al carrito`);
    
    // Actualizar contador del carrito
    updateCartCount();
}

// Inicializar carrito
function initializeCart() {
    updateCartCount();
}

// Actualizar contador del carrito
function updateCartCount() {
    const cart = JSON.parse(localStorage.getItem('lixmarCart')) || [];
    const cartButton = document.querySelector('.btn-cart');
    const cartCount = document.querySelector('.cart-count');
    
    if (cartCount) {
        cartCount.textContent = cart.length;
    }
    
    if (cartButton) {
        if (cart.length > 0) {
            cartButton.textContent = `🛒 (${cart.length})`;
        } else {
            cartButton.textContent = '🛒';
        }
    }
}

// Manejar suscripción a newsletter
function handleNewsletterSubscription(event) {
    event.preventDefault();
    
    const email = event.target.querySelector('input[type="email"]').value;
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    
    if (emailRegex.test(email)) {
        // Guardar suscripción
        let subscribers = JSON.parse(localStorage.getItem('lixmarSubscribers')) || [];
        
        if (!subscribers.includes(email)) {
            subscribers.push(email);
            localStorage.setItem('lixmarSubscribers', JSON.stringify(subscribers));
        }
        
        showNotification('¡Gracias por suscribirte!');
        event.target.reset();
    } else {
        showNotification('Por favor ingresa un email válido', 'error');
    }
}

// Manejar navegación suave
function handleNavigation(event) {
    const href = event.target.getAttribute('href');
    
    if (href && href.startsWith('#')) {
        event.preventDefault();
        const targetId = href.substring(1);
        const targetElement = document.getElementById(targetId);
        
        if (targetElement) {
            targetElement.scrollIntoView({ behavior: 'smooth' });
        }
    }
}

// Mostrar notificación
function showNotification(message, type = 'success') {
    // Crear elemento de notificación
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.textContent = message;
    
    // Estilos de notificación
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 15px 25px;
        border-radius: 5px;
        color: white;
        font-weight: bold;
        z-index: 1000;
        animation: slideIn 0.3s ease-out;
        ${type === 'success' 
            ? 'background-color: #4caf50;' 
            : 'background-color: #f44336;'
        }
    `;
    
    document.body.appendChild(notification);
    
    // Eliminar notificación después de 3 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease-out';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Agregar animaciones CSS
const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }
`;
document.head.appendChild(style);

// Funcionalidad adicional: Búsqueda
const searchButton = document.querySelector('.btn-search');
if (searchButton) {
    searchButton.addEventListener('click', function() {
        const searchTerm = prompt('¿Qué deseas buscar?');
        if (searchTerm) {
            console.log('Buscando:', searchTerm);
            // Aquí se implementaría la lógica de búsqueda
        }
    });
}

// Funcionalidad de cuenta
const accountButton = document.querySelector('.btn-account');
if (accountButton) {
    accountButton.addEventListener('click', function() {
        alert('Funcionalidad de cuenta próximamente disponible');
    });
}

// Funcionalidad del carrito
const cartButton = document.querySelector('.btn-cart');
if (cartButton) {
    cartButton.addEventListener('click', function() {
        const cart = JSON.parse(localStorage.getItem('lixmarCart')) || [];
        
        if (cart.length === 0) {
            alert('Tu carrito está vacío');
        } else {
            let cartSummary = 'Tu carrito:\n\n';
            cart.forEach((item, index) => {
                cartSummary += `${index + 1}. ${item.title} - ${item.price}\n`;
            });
            alert(cartSummary);
        }
    });
}

console.log('LIXMAR - Sistema de ecommerce cargado correctamente');
