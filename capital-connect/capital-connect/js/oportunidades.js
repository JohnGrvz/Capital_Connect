/* =========================================================
   oportunidades.js
   Trae las empresas, las dibuja como tarjetas y las filtra
   por instrumento.
   ========================================================= */

(function () {
  const contenedor = document.getElementById('lista-empresas');
  const mensaje = document.getElementById('estado-lista');
  const fuente = document.getElementById('fuente-datos');
  const tabs = document.querySelectorAll('.tab');

  if (!contenedor) return;

  let empresas = [];
  let filtro = 'todas';

  const ETIQUETAS = {
    deuda: 'Préstamo',
    equity: 'Acciones',
    convertible: 'Convertible'
  };

  /** Formatea 1800000000 como "$1.800 M" */
  function pesos(valor) {
    if (valor === null || valor === undefined || isNaN(valor)) return '—';
    const millones = Number(valor) / 1000000;
    if (millones >= 1000) {
      return '$' + (millones / 1000).toLocaleString('es-CO', { maximumFractionDigits: 1 }) + ' MM';
    }
    return '$' + millones.toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' M';
  }

  function porcentaje(empresa) {
    const objetivo = Number(empresa.monto_objetivo) || 0;
    const comprometido = Number(empresa.monto_comprometido) || 0;
    if (!objetivo) return 0;
    return Math.min(100, Math.round((comprometido / objetivo) * 100));
  }

  /** Evita que texto de la base de datos se interprete como HTML. */
  function limpio(texto) {
    const div = document.createElement('div');
    div.textContent = texto === null || texto === undefined ? '' : String(texto);
    return div.innerHTML;
  }

  function condiciones(e) {
    if (e.instrumento === 'equity') {
      return [
        ['Valoración pre', pesos(e.valoracion)],
        ['Participación', e.participacion ? e.participacion + '%' : '—'],
        ['Ronda', e.calificacion || '—'],
        ['Ciudad', e.ciudad || '—']
      ];
    }
    return [
      ['Tasa', e.tasa || '—'],
      ['Plazo', e.plazo || '—'],
      ['Garantía', e.garantia || '—'],
      ['Calificación', e.calificacion || '—']
    ];
  }

  function tarjeta(e) {
    const pct = porcentaje(e);
    const filas = condiciones(e)
      .map(([k, v]) => `<div><span>${limpio(k)}</span><b>${limpio(v)}</b></div>`)
      .join('');

    return `
      <article class="deal" data-type="${limpio(e.instrumento)}">
        <div class="deal-top">
          <span class="deal-sector">${limpio(e.sector)} · ${limpio(e.ciudad)}</span>
          <span class="tag"><span class="dot ${limpio(e.instrumento)}"></span>${limpio(ETIQUETAS[e.instrumento] || e.instrumento)}</span>
        </div>
        <h3>${limpio(e.nombre)}</h3>
        <p class="pitch">${limpio(e.descripcion)}</p>
        <div class="bar"><i style="width:${pct}%"></i></div>
        <div class="bar-l">
          <span>${pesos(e.monto_comprometido)} comprometidos</span>
          <span>${pct}% de ${pesos(e.monto_objetivo)}</span>
        </div>
        <div class="terms">${filas}</div>
      </article>`;
  }

  function dibujar() {
    const visibles = filtro === 'todas'
      ? empresas
      : empresas.filter((e) => e.instrumento === filtro);

    if (!visibles.length) {
      contenedor.innerHTML = '';
      mensaje.textContent = 'No hay operaciones abiertas con ese instrumento en este momento.';
      mensaje.style.display = 'block';
      return;
    }

    mensaje.style.display = 'none';
    contenedor.innerHTML = visibles.map(tarjeta).join('');
  }

  async function cargar() {
    mensaje.textContent = 'Cargando operaciones...';
    mensaje.style.display = 'block';

    const respuesta = await window.DB.listarEmpresas();
    empresas = respuesta.datos;

    if (fuente) {
      fuente.textContent = respuesta.fuente === 'supabase'
        ? 'Datos en vivo desde la base de datos.'
        : 'Mostrando datos de ejemplo. Conecta Supabase en js/config.js para ver empresas reales.';
    }

    dibujar();
  }

  tabs.forEach(function (t) {
    t.addEventListener('click', function () {
      tabs.forEach((x) => x.setAttribute('aria-pressed', 'false'));
      t.setAttribute('aria-pressed', 'true');
      filtro = t.dataset.filter;
      dibujar();
    });
  });

  cargar();
})();
