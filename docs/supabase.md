# Conectar la base de datos

Guía paso a paso para que el sitio deje de mostrar datos de ejemplo y empiece a
leer y escribir en una base de datos real.

## 1. Crear el proyecto

1. Entra a [supabase.com](https://supabase.com) y crea una cuenta. El plan
   gratuito alcanza de sobra para este proyecto.
2. Presiona **New project**.
3. Nombre: `capital-connect`. Contraseña de la base: guárdala, la vas a
   necesitar si algún día usas la CLI.
4. Región: elige la más cercana, por ejemplo `South America (São Paulo)`.
5. Espera un par de minutos mientras se aprovisiona.

## 2. Crear las tablas

1. En el menú izquierdo abre **SQL Editor**.
2. Presiona **New query**.
3. Abre el archivo `supabase/schema.sql` de este repositorio, copia todo el
   contenido y pégalo en el editor.
4. Presiona **Run**.

Deberías ver un mensaje de éxito. En **Table Editor** aparecerán las tablas
`empresas` y `analisis_viabilidad`, la primera con seis filas de ejemplo.

## 3. Copiar las credenciales

1. Ve a **Project Settings** (el engranaje) > **API**.
2. Copia dos valores:
   - **Project URL**, algo como `https://abcdefghijk.supabase.co`
   - **anon public**, una cadena larga que empieza con `eyJ...`
3. Pégalos en `js/config.js`:

```js
window.CONFIG = {
  SUPABASE_URL: 'https://abcdefghijk.supabase.co',
  SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6...',
  FUNCION_CHAT: ''
};
```

Recarga `oportunidades.html`. Arriba del filtro debe decir que los datos vienen
de la base de datos.

## 4. Probar el registro de empresas

Abre `publicar.html`, llena el formulario y envíalo. Luego vuelve a Supabase,
entra a **Table Editor > empresas** y verás la fila nueva con `estado` en
`pendiente`.

Para que aparezca en el sitio, cambia ese campo a `publicada` desde el Table
Editor. Eso simula la revisión del equipo: nadie se publica solo.

## Cómo funciona la seguridad

Te vas a preguntar si es seguro tener la clave en un archivo público. Sí, y esa
es la idea: la clave `anon` está diseñada para ir en el navegador. Quien protege
los datos es el **Row Level Security** (RLS), las reglas del final de
`schema.sql`.

Con las políticas que trae el proyecto, alguien con la clave puede:

| Acción | ¿Permitida? | Por qué |
|---|---|---|
| Leer empresas publicadas | Sí | Es información pública del sitio |
| Leer empresas pendientes o rechazadas | No | La política filtra por `estado = 'publicada'` |
| Insertar una solicitud nueva | Sí, solo como pendiente | El `with check` obliga ese estado |
| Publicar su propia empresa | No | No puede escribir `estado = 'publicada'` |
| Modificar o borrar filas | No | No existe política de `update` ni `delete` |
| Leer los correos de contacto de empresas no publicadas | No | No puede leer esas filas |

Lo que **nunca** debes poner en el repositorio es la clave `service_role`: esa sí
se salta todas las políticas. Vive solo en el servidor.

## Consultar los datos desde el código

Toda la interacción con la base pasa por `js/supabase-cliente.js`. Si necesitas
una consulta nueva, agrégala ahí y no dispersa en las páginas. Ejemplo de cómo
se ve una consulta:

```js
const { data, error } = await db
  .from('empresas')
  .select('*')
  .eq('estado', 'publicada')
  .order('creado_en', { ascending: false });
```

## Ideas para seguir

- **Buscador por sector**: agrega un `.ilike('sector', '%' + texto + '%')`.
- **Autenticación**: Supabase trae login con correo o Google. Con eso podrías
  tener un panel donde cada empresa ve solo su solicitud.
- **Compromisos de inversión**: una tabla `inversiones` con `empresa_id`,
  `monto` e `inversionista_id`, y un trigger que actualice
  `monto_comprometido` al insertar. Así la barra de avance se movería sola.
- **Storage**: Supabase permite subir archivos. Serviría para los estados
  financieros que pide el expediente.
