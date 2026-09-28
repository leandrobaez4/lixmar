# Lixmar

Marketplace de publicaciones con planes de suscripción. Este repositorio contiene la tienda pública en React 19 y Vite 8. La API, el panel de administración y los procesos de catálogo, órdenes y búsqueda están en el repositorio hermano [`lixmar-backoffice-v2`](../lixmar-backoffice-v2/README.md). El frontend consulta `/api/v1/...` y Vite envía `/api` a Laravel en `127.0.0.1:8001` mediante [`vite.config.js`](vite.config.js).

## Desarrollo local

Requisitos: Node.js compatible con Vite 8, npm, PHP y Composer compatibles con el backend, y Docker Compose para PostgreSQL, Redis y OpenSearch. Usá terminales separadas:

```sh
# Terminal 1: servicios del backend (desde ../lixmar-backoffice-v2)
cd ../lixmar-backoffice-v2
docker compose -f docker-compose.local.yml up -d postgres redis opensearch
composer install
cp .env.example .env       # solo la primera vez; conservá tus valores locales
php artisan key:generate  # solo al crear el .env
php artisan migrate
php artisan storage:link
php artisan search:setup-index
php artisan serve --host=127.0.0.1 --port=8001

# Terminal 2: trabajos de indexación y otros procesos en segundo plano (desde este repositorio)
cd ../lixmar-backoffice-v2
php artisan queue:work --tries=3 --timeout=90

# Terminal 3: tienda pública (desde este repositorio)
npm ci
npm run dev
```

Abrí `http://localhost:5173`. El archivo `.env` de Laravel se crea desde `.env.example` y no se versiona. Para usar PostgreSQL del Compose local, configurá `DB_CONNECTION=pgsql`, `DB_HOST=127.0.0.1`, `DB_PORT=5433`, `DB_DATABASE=lixmar`, `DB_USERNAME=lixmar` y la contraseña definida en `docker-compose.local.yml`. Configurá `APP_URL=http://127.0.0.1:8001`, `FRONTEND_URL=http://localhost:5173` y `QUEUE_CONNECTION=database`. El ejemplo de Laravel usa SQLite por defecto, por eso el cambio de `DB_*` es necesario si seguís estos pasos con PostgreSQL. Ajustá `MAIL_*` para probar correos reales; `MAIL_MAILER=log` solo registra mensajes localmente. Nunca copies credenciales reales al README ni a Git.

OpenSearch local escucha en `http://127.0.0.1:9200`. El backend usa `SEARCH_ENABLED=true`, `ELASTIC_HOST=127.0.0.1:9200` y, si corresponde, `OPENSEARCH_USERNAME`, `OPENSEARCH_PASSWORD` y `OPENSEARCH_SSL_VERIFY`. El Compose local desactiva la seguridad de OpenSearch y sirve únicamente para desarrollo. `php artisan search:setup-index` crea el índice `products` y reindexa productos existentes; si el índice ya existe, el comando pregunta antes de recrearlo. Las altas y modificaciones se sincronizan mediante el worker de cola. `php artisan search:update-mapping` actualiza el mapeo cuando hace falta. La búsqueda pública usa OpenSearch para consultas de relevancia por página; si el servicio falla, vuelve a SQL. `SEARCH_ENABLED=false` usa SQL; también se usa SQL para cursor y ordenamientos no basados en relevancia. Un resultado vacío de OpenSearch no activa el fallback.

Los servicios adicionales del Compose (`soketi`) se necesitan para las funciones en tiempo real del backend; iniciá el conjunto completo con `docker compose -f docker-compose.local.yml up -d` cuando trabajes en ellas. Revisá [deployment/README.md](../lixmar-backoffice-v2/deployment/README.md) y [docs/deployment.md](../lixmar-backoffice-v2/docs/deployment.md) para el despliegue del backend. Los proveedores de pagos, envíos, correo y verificación requieren sus propias credenciales y flujos de prueba antes de usarlos en producción.

## Verificación y compilación

```sh
npm run lint
npm test
npm run build
npm run preview
```

`npm run build` genera `dist/` desde el código fuente; desplegá ese directorio como sitio estático con fallback de rutas a `index.html` y un proxy `/api` hacia Laravel. La configuración de proxy de Vite rige únicamente en desarrollo. En el backend, ejecutá `php artisan test` y mantené el worker y los servicios configurados para el entorno. El frontend no debe servir el backend administrativo ni su `frontend/` interno como si fueran esta tienda.

## Organización y limpieza

- `src/pages/`, `src/components/`, `src/auth/`, `src/catalog/`, `src/cart/` y `src/account/` contienen las rutas y clientes de API de la tienda.
- `public/assets/` contiene imágenes y SVG usados por la interfaz; `public/assets/default-placeholder.svg` cubre productos sin imagen válida.
- `public/facetec/`, `src/facetec/` y `src/components/BiometricScanner.jsx` contienen un SDK de biometría ligado al ticket LIXMA-9. Revisá licencia, integración y uso real antes de aislarlo o retirarlo.
- Las páginas de prueba `StepPage.jsx` y `SingleProductPayPage.jsx` ya fueron retiradas de las rutas. `public/assets/` contiene imágenes con nombres hash; auditá referencias y duplicados por contenido antes de borrar recursos heredados.
- `.gitignore` excluye `node_modules/`, `dist/`, `build/`, cachés, capturas de `.playwright-mcp/`, logs, archivos `.env` y archivos locales del sistema. Los archivos generados previamente rastreados deben quitarse del índice de Git para que el ignore surta efecto; el estado actual ya registra esas eliminaciones. Conservá `package-lock.json` para instalaciones reproducibles.
