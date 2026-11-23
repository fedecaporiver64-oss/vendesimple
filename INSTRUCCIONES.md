# VendeSimple — primera versión

Esta carpeta contiene la primera interfaz web de VendeSimple (React + Vite + Supabase).

## Qué incluye
- Registro e inicio de sesión con Supabase Auth.
- Mensaje de verificación de correo cuando Supabase requiere confirmación.
- Panel privado de comerciante.
- Creación de una tienda en `public.businesses`.
- Alta y listado de productos en `public.products`.
- Diseño adaptable a celular y computadora.

## Antes de publicar
1. En Supabase, abrí Project Settings → API (o Data API / API Keys, según la versión del panel).
2. Copiá Project URL y la clave pública `anon` / `publishable` (nunca la `service_role` ni una secret key).
3. Creá un archivo llamado `.env` a partir de `.env.example` y completá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Instalá dependencias con `npm install` y probá con `npm run dev`.
5. Para publicar, ejecutá `npm run build` y desplegá la carpeta `dist` en Netlify.
6. En Supabase → Authentication → URL Configuration, configurá el Site URL con el dominio final y agregá ese dominio a Redirect URLs.

## Seguridad y alcance actual
- La clave del navegador debe ser únicamente la clave pública `anon`/`publishable`.
- Nunca coloques `service_role` o claves secretas en el frontend.
- La app aún no implementa el catálogo público ni la creación pública de pedidos. Tampoco pagos, suscripciones cobrables, carga de imágenes, recuperación de contraseña ni panel administrativo global.
- Las políticas SQL actuales no permiten aún insertar pedidos desde compradores anónimos; esto se hará con una función de servidor que valide productos, precios y cantidades.
- Antes de producción se deben agregar validación del lado servidor, límites antiabuso, política de privacidad, términos y pruebas de seguridad.

## Requisitos
Node.js 20 o superior recomendado.
