# Capital Connect

Sitio web de una plataforma que conecta inversionistas con empresas que buscan
financiación, mediante préstamos, compra de acciones o notas convertibles.

Proyecto académico. Las empresas, cifras y personas que aparecen son ficticias.

## Qué incluye

- Siete páginas en HTML5 semántico, sin framework ni dependencias de compilación
- Hoja de estilos propia con variables CSS, modo claro y oscuro, y diseño responsive
- JavaScript sin librerías para el menú, los filtros y los formularios
- Conexión opcional a Supabase para listar y registrar empresas
- Asistente de viabilidad con IA, servido por una Edge Function

## Estructura

```
capital-connect/
├── index.html              Portada
├── como-funciona.html      Proceso y preguntas frecuentes
├── oportunidades.html      Listado de empresas (lee la base de datos)
├── empresas.html           Información para empresas
├── inversionistas.html     Información para inversionistas
├── nosotros.html           Equipo y modelo de negocio
├── contacto.html           Formulario de contacto
├── publicar.html           Formulario de registro de empresa
├── css/
│   └── styles.css          Estilos de todo el sitio
├── js/
│   ├── config.js           Credenciales y configuración
│   ├── layout.js           Cabecera y pie compartidos
│   ├── datos-demo.js       Datos de ejemplo sin base de datos
│   ├── supabase-cliente.js Capa de acceso a datos
│   ├── oportunidades.js    Listado y filtros
│   ├── publicar.js         Validación y envío del formulario
│   └── chatbot.js          Asistente de viabilidad
├── supabase/
│   ├── schema.sql          Tablas, políticas RLS y datos de ejemplo
│   └── functions/
│       └── analizar-viabilidad/
│           └── index.ts    Edge Function que llama al modelo de IA
└── docs/
    ├── supabase.md         Guía paso a paso de la base de datos
    └── chatbot.md          Opciones para el asistente con IA
```

## Cómo verlo

**Opción rápida.** Abre `index.html` con doble clic. Funciona sin instalar nada;
verás los datos de ejemplo.

**Con servidor local.** Recomendado, evita problemas con rutas relativas:

```bash
python3 -m http.server 8000
# luego abre http://localhost:8000
```

**Publicado.** El repositorio funciona tal cual en GitHub Pages: entra a
Settings > Pages, elige la rama `main` y la carpeta raíz.

## Conectar la base de datos

1. Crea un proyecto gratis en [supabase.com](https://supabase.com)
2. Abre el SQL Editor y ejecuta `supabase/schema.sql`
3. Copia la URL y la clave `anon` desde Project Settings > API
4. Pégalas en `js/config.js`

Desde ese momento, `oportunidades.html` muestra las empresas de la base de datos
y `publicar.html` guarda las solicitudes nuevas. Detalles en
[`docs/supabase.md`](docs/supabase.md).

## Activar el asistente de IA

El chatbot funciona sin configuración, con una evaluación local básica. Para que
use un modelo de lenguaje de verdad, despliega la Edge Function:

```bash
supabase functions deploy analizar-viabilidad
supabase secrets set ANTHROPIC_API_KEY=tu-clave
```

Detalles y alternativas en [`docs/chatbot.md`](docs/chatbot.md).

## Seguridad

La clave `anon` de Supabase es pública por diseño y va en el navegador. Lo que
protege los datos son las políticas RLS de `schema.sql`: el visitante anónimo
solo puede leer empresas ya publicadas e insertar solicitudes en estado
pendiente. No puede modificar ni borrar nada.

La clave del proveedor de IA nunca va en el navegador: vive en la Edge Function.

## Licencia

MIT
