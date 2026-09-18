-- =========================================================
-- Capital Connect — esquema de base de datos
--
-- Cómo usarlo:
-- 1. Entra a tu proyecto en supabase.com
-- 2. Abre "SQL Editor" en el menú de la izquierda
-- 3. Pega todo este archivo y presiona "Run"
--
-- Crea dos tablas, las políticas de seguridad y datos de ejemplo.
-- =========================================================

-- ---------------------------------------------------------
-- Tabla principal: empresas que buscan capital
-- ---------------------------------------------------------
create table if not exists public.empresas (
  id                uuid primary key default gen_random_uuid(),
  creado_en         timestamptz not null default now(),

  -- Identificación
  nombre            text not null,
  nit               text,
  sector            text not null,
  ciudad            text not null,
  descripcion       text not null,

  -- Operación
  anios_operacion   integer,
  ventas_anuales    numeric,

  -- Condiciones de la ronda
  instrumento       text not null check (instrumento in ('deuda','equity','convertible')),
  monto_objetivo    numeric not null check (monto_objetivo >= 50000000),
  monto_comprometido numeric not null default 0,
  tasa              text,
  plazo             text,
  garantia          text,
  calificacion      text,
  valoracion        numeric,
  participacion     numeric,

  -- Contacto (no se muestra en el sitio público)
  contacto_nombre   text,
  contacto_email    text not null,

  -- Flujo de trabajo interno
  estado            text not null default 'pendiente'
                    check (estado in ('pendiente','publicada','cerrada','rechazada'))
);

comment on table public.empresas is
  'Empresas registradas. Solo las que están en estado "publicada" se ven en el sitio.';

create index if not exists empresas_estado_idx on public.empresas (estado);
create index if not exists empresas_instrumento_idx on public.empresas (instrumento);

-- ---------------------------------------------------------
-- Análisis de viabilidad generados por el chatbot
-- ---------------------------------------------------------
create table if not exists public.analisis_viabilidad (
  id          uuid primary key default gen_random_uuid(),
  creado_en   timestamptz not null default now(),
  empresa     text,
  sector      text,
  respuestas  jsonb,
  puntaje     integer check (puntaje between 0 and 100),
  veredicto   text
);

comment on table public.analisis_viabilidad is
  'Registro de las evaluaciones preliminares hechas por el asistente de IA.';

-- ---------------------------------------------------------
-- Seguridad a nivel de fila (RLS)
--
-- Sin esto, cualquiera con la clave pública podría leer y
-- borrar toda la tabla. Con esto, el visitante anónimo
-- solo puede: leer empresas publicadas e insertar solicitudes
-- nuevas en estado pendiente. Nada más.
-- ---------------------------------------------------------
alter table public.empresas enable row level security;
alter table public.analisis_viabilidad enable row level security;

-- Lectura pública, únicamente de lo que ya fue aprobado
drop policy if exists "lectura publica de empresas publicadas" on public.empresas;
create policy "lectura publica de empresas publicadas"
  on public.empresas
  for select
  to anon, authenticated
  using (estado = 'publicada');

-- Cualquiera puede postular una empresa, pero siempre entra
-- como pendiente y sin dinero comprometido
drop policy if exists "registro publico de empresas" on public.empresas;
create policy "registro publico de empresas"
  on public.empresas
  for insert
  to anon, authenticated
  with check (
    estado = 'pendiente'
    and monto_comprometido = 0
  );

-- Nadie del público puede modificar ni borrar: no se crean
-- políticas de update ni delete, así que quedan bloqueadas.

-- El chatbot puede guardar análisis, pero nadie puede leerlos
-- desde el navegador
drop policy if exists "registro publico de analisis" on public.analisis_viabilidad;
create policy "registro publico de analisis"
  on public.analisis_viabilidad
  for insert
  to anon, authenticated
  with check (true);

-- ---------------------------------------------------------
-- Datos de ejemplo para que la página no se vea vacía
-- ---------------------------------------------------------
insert into public.empresas
  (nombre, sector, ciudad, descripcion, instrumento, monto_objetivo,
   monto_comprometido, tasa, plazo, garantia, calificacion,
   contacto_email, estado)
values
  ('Verdeagro S.A.S.', 'Agroindustria', 'Rionegro',
   'Ampliación de la planta de empaque para atender tres nuevos contratos de exportación de aguacate hass.',
   'deuda', 1800000000, 1296000000, '14,5% E.A.', '36 meses', 'Maquinaria', 'B+',
   'contacto@verdeagro.co', 'publicada'),

  ('Textiles Corvina', 'Manufactura', 'Itagüí',
   'Compra de dos telares de tejido plano para reducir la maquila tercerizada, hoy el 40% de su costo de producción.',
   'deuda', 1500000000, 465000000, '16,2% E.A.', '24 meses', 'Codeudor', 'B',
   'gerencia@corvina.co', 'publicada'),

  ('Cafetera Altamira', 'Exportación', 'Manizales',
   'Capital de trabajo para la compra de cosecha y apertura de una bodega propia en el puerto de Cartagena.',
   'convertible', 900000000, 792000000, '8% E.A.', '18 meses', 'Descuento 20%', 'B',
   'hola@altamira.co', 'publicada'),

  ('Aula Pacífico', 'Educación', 'Cali',
   'Formación técnica para operarios industriales, con contratos vigentes con cuatro empresas del Valle del Cauca.',
   'convertible', 600000000, 114000000, '7,5% E.A.', '24 meses', 'Descuento 15%', 'C+',
   'direccion@aulapacifico.co', 'publicada');

insert into public.empresas
  (nombre, sector, ciudad, descripcion, instrumento, monto_objetivo,
   monto_comprometido, valoracion, participacion, calificacion,
   contacto_email, estado)
values
  ('Nodo Salud', 'Salud digital', 'Medellín',
   'Agenda e historia clínica para consultorios pequeños. 610 clínicas activas y facturación recurrente creciendo 9% mensual.',
   'equity', 4200000000, 1890000000, 18000000000, 18.9, 'Serie A',
   'founders@nodosalud.co', 'publicada'),

  ('Ruta Andina', 'Logística', 'Bogotá',
   'Última milla para comercio electrónico en ciudades intermedias. Opera en once municipios con flota propia y aliada.',
   'equity', 3000000000, 1890000000, 12000000000, 20, 'Semilla',
   'hola@rutaandina.co', 'publicada');
