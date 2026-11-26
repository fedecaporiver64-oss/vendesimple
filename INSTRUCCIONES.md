# VendeSimple — estado del proyecto

Aplicación web construida con React, Vite y Supabase.

## Funciones presentes en el código
- Registro e inicio de sesión con Supabase Auth.
- Confirmación de correo cuando el proyecto la exige.
- Solicitud de recuperación de contraseña por correo y formulario para guardar la nueva contraseña.
- Panel privado de comerciante.
- Creación de una tienda en `public.businesses`.
- Alta y listado de productos en `public.products`.
- Interfaz adaptable a celulares y computadoras.

## Configuración local y despliegue
1. En Supabase, abrí Project Settings → API (o Data API / API Keys).
2. Copiá Project URL y la clave pública `anon` / `publishable`. Nunca uses `service_role` ni una secret key en el navegador.
3. Copiá `.env.example` como `.env` y completá:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Instalá dependencias con `npm install`.
5. Ejecutá `npm run build` para comprobar la compilación.
6. Publicá la carpeta `dist` en Netlify.
7. En Supabase → Authentication → URL Configuration, configurá el Site URL y agregá el dominio publicado a Redirect URLs.

## Pendiente antes de producción
- Verificar en Supabase las cinco tablas existentes, sus relaciones, permisos RLS y exposición en Data API. No recrear tablas existentes.
- Confirmar que el dominio publicado esté autorizado para autenticación y recuperación de contraseña.
- Implementar catálogo público, edición y eliminación de productos, y selector de tiendas.
- Implementar creación segura de pedidos mediante función de servidor que valide productos, precios y cantidades.
- Implementar pagos, notificaciones, carga de imágenes y panel administrativo.
- Agregar validación del lado servidor, límites antiabuso, términos, política de privacidad y pruebas de seguridad.

## Seguridad
- La clave del navegador debe ser únicamente la clave pública `anon` / `publishable`.
- Nunca subir archivos `.env`, claves `service_role` ni secretos al repositorio.
- La existencia de las tablas no garantiza que las políticas RLS sean correctas. Verificar cada operación con cuentas de prueba antes de producción.

## Requisitos
Node.js 20 o superior recomendado.
