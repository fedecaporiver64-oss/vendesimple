# VendeSimple — estado del proyecto

Aplicación web para crear tiendas online, construida con React, Vite y Supabase.

## Funciones implementadas en el código

- Registro, inicio de sesión y cierre de sesión con Supabase Auth.
- Confirmación de correo cuando está habilitada en Supabase.
- Recuperación de contraseña y actualización de contraseña.
- Panel privado del comerciante.
- Creación y selección de tiendas del mismo usuario.
- Alta, listado, edición y eliminación de productos.
- Enlace público por tienda: `/tienda/SLUG`.
- Catálogo público de productos activos.
- Carrito con cantidades y total estimado.
- Envío de pedidos mediante la función segura `create_public_order`.
- Panel del comerciante para consultar pedidos y cambiar su estado.
- Interfaz adaptable a celulares y computadoras.

La compilación de producción se verifica mediante GitHub Actions. Una compilación exitosa no reemplaza las pruebas reales de autenticación, base de datos y pedidos.

## Base de datos Supabase existente

El proyecto utiliza las cinco tablas ya creadas:

- `businesses`
- `products`
- `orders`
- `order_items`
- `subscriptions`

No recrear ni eliminar estas tablas. Las políticas RLS y los permisos deben conservar el aislamiento entre comerciantes.

## Configuración de Supabase

1. En Supabase, abrir Project Settings → API / Data API.
2. Copiar Project URL y la clave pública `anon` o `publishable`.
3. Configurar estas variables en el entorno de compilación y despliegue:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Usar únicamente la clave pública en el navegador. Nunca colocar `service_role`, secret keys ni credenciales privadas en variables `VITE_*` o en el repositorio.
5. En Authentication → URL Configuration, establecer Site URL y agregar el dominio publicado a Redirect URLs.

Para desarrollo local, crear un archivo `.env` a partir de `.env.example`. No subir `.env` al repositorio.

## Función segura de pedidos

El archivo `supabase/create_public_order.sql` contiene la función RPC que crea pedidos, consulta los precios vigentes en la base de datos, valida los productos y las cantidades, comprueba stock y descuenta las unidades disponibles.

**Importante:** el archivo SQL fue reforzado para rechazar carritos nulos, tipos JSON incorrectos y elementos que no sean objetos. Para que la base de datos use esta última versión, ejecutar nuevamente el contenido completo del archivo en Supabase SQL Editor. La operación usa `CREATE OR REPLACE FUNCTION` y no recrea las tablas.

## Pendiente antes de producción

- Configurar el hosting y las variables públicas de Supabase.
- Verificar Site URL, Redirect URLs y disponibilidad de Data API.
- Ejecutar la versión actualizada de `supabase/create_public_order.sql`.
- Probar registro, confirmación de correo, ingreso y recuperación de contraseña.
- Probar aislamiento entre dos cuentas de comerciantes.
- Probar compra pública, validación de stock, creación de pedido y actualización de estado.
- Agregar carga de imágenes de productos.
- Agregar edición de datos de tienda y herramientas de categorías/stock.
- Integrar pagos online si se decide ofrecerlos; actualmente el pedido no cobra online.
- Implementar suscripciones/planes, notificaciones y panel administrativo.
- Incorporar páginas completas de términos y privacidad y pruebas automatizadas de seguridad.

## Compilación

- Node.js 20 o superior.
- Instalar dependencias: `npm install`.
- Compilar: `npm run build`.
- El resultado de Vite se genera en `dist`.

El repositorio incluye un flujo de GitHub Actions que ejecuta la compilación en cada cambio de la rama principal.
