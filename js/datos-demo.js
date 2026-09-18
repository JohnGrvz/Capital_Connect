/* =========================================================
   datos-demo.js
   Datos de ejemplo que se usan cuando todavía no hay una base
   de datos conectada. Tienen exactamente la misma forma que
   las filas de la tabla "empresas" de Supabase, así que el
   código que las dibuja funciona igual en los dos casos.
   ========================================================= */

window.EMPRESAS_DEMO = [
  {
    id: 'demo-1',
    nombre: 'Verdeagro S.A.S.',
    sector: 'Agroindustria',
    ciudad: 'Rionegro',
    descripcion: 'Ampliación de la planta de empaque para atender tres nuevos contratos de exportación de aguacate hass.',
    instrumento: 'deuda',
    monto_objetivo: 1800000000,
    monto_comprometido: 1296000000,
    tasa: '14,5% E.A.',
    plazo: '36 meses',
    garantia: 'Maquinaria',
    calificacion: 'B+',
    estado: 'publicada'
  },
  {
    id: 'demo-2',
    nombre: 'Nodo Salud',
    sector: 'Salud digital',
    ciudad: 'Medellín',
    descripcion: 'Agenda e historia clínica para consultorios pequeños. 610 clínicas activas y facturación recurrente creciendo 9% mensual.',
    instrumento: 'equity',
    monto_objetivo: 4200000000,
    monto_comprometido: 1890000000,
    valoracion: 18000000000,
    participacion: 18.9,
    calificacion: 'Serie A',
    estado: 'publicada'
  },
  {
    id: 'demo-3',
    nombre: 'Cafetera Altamira',
    sector: 'Exportación',
    ciudad: 'Manizales',
    descripcion: 'Capital de trabajo para la compra de cosecha y apertura de una bodega propia en el puerto de Cartagena.',
    instrumento: 'convertible',
    monto_objetivo: 900000000,
    monto_comprometido: 792000000,
    tasa: '8% E.A.',
    plazo: '18 meses',
    garantia: 'Descuento 20%',
    calificacion: 'B',
    estado: 'publicada'
  },
  {
    id: 'demo-4',
    nombre: 'Textiles Corvina',
    sector: 'Manufactura',
    ciudad: 'Itagüí',
    descripcion: 'Compra de dos telares de tejido plano para reducir la maquila tercerizada, hoy el 40% de su costo de producción.',
    instrumento: 'deuda',
    monto_objetivo: 1500000000,
    monto_comprometido: 465000000,
    tasa: '16,2% E.A.',
    plazo: '24 meses',
    garantia: 'Codeudor',
    calificacion: 'B',
    estado: 'publicada'
  },
  {
    id: 'demo-5',
    nombre: 'Ruta Andina',
    sector: 'Logística',
    ciudad: 'Bogotá',
    descripcion: 'Última milla para comercio electrónico en ciudades intermedias. Opera en once municipios con flota propia y aliada.',
    instrumento: 'equity',
    monto_objetivo: 3000000000,
    monto_comprometido: 1890000000,
    valoracion: 12000000000,
    participacion: 20,
    calificacion: 'Semilla',
    estado: 'publicada'
  },
  {
    id: 'demo-6',
    nombre: 'Aula Pacífico',
    sector: 'Educación',
    ciudad: 'Cali',
    descripcion: 'Formación técnica para operarios industriales, con contratos vigentes con cuatro empresas del Valle del Cauca.',
    instrumento: 'convertible',
    monto_objetivo: 600000000,
    monto_comprometido: 114000000,
    tasa: '7,5% E.A.',
    plazo: '24 meses',
    garantia: 'Descuento 15%',
    calificacion: 'C+',
    estado: 'publicada'
  }
];
