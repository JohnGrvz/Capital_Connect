/* =========================================================
   chatbot.js
   Asistente de viabilidad.

   El navegador NUNCA habla directamente con el proveedor de IA:
   eso obligaría a poner la clave de la API en el código, donde
   cualquiera puede leerla. En vez de eso, esta página llama a
   una Edge Function de Supabase (supabase/functions/analizar-viabilidad),
   que guarda la clave del lado del servidor.

   Si no hay función configurada, el widget funciona igual pero
   responde con un análisis local básico, para poder mostrar el
   flujo sin depender de ningún servicio.
   ========================================================= */

(function () {
  const PREGUNTAS = [
    { clave: 'empresa',   texto: '¿Cómo se llama la empresa o el proyecto?' },
    { clave: 'sector',    texto: '¿En qué sector opera y en qué ciudad?' },
    { clave: 'tiempo',    texto: '¿Hace cuánto está operando y cuántas ventas tuvo el último año?' },
    { clave: 'problema',  texto: '¿Qué problema resuelve y quién le paga hoy?' },
    { clave: 'capital',   texto: '¿Cuánto capital necesita y para qué lo usaría?' },
    { clave: 'riesgo',    texto: 'Por último, ¿qué es lo que más podría salir mal?' }
  ];

  const respuestas = {};
  let indice = 0;
  let cargando = false;

  // ----- Interfaz -----
  const boton = document.createElement('button');
  boton.className = 'chat-toggle';
  boton.type = 'button';
  boton.setAttribute('aria-expanded', 'false');
  boton.textContent = 'Evaluar mi proyecto';

  const panel = document.createElement('section');
  panel.className = 'chat-panel';
  panel.setAttribute('aria-label', 'Asistente de viabilidad');
  panel.innerHTML = `
    <div class="chat-head">
      <h3>Asistente de viabilidad</h3>
      <p>Seis preguntas y te doy una lectura preliminar.</p>
    </div>
    <div class="chat-log" id="chat-log" role="log" aria-live="polite"></div>
    <form class="chat-form" id="chat-form">
      <label class="visually-hidden" for="chat-input">Tu respuesta</label>
      <input id="chat-input" type="text" autocomplete="off" placeholder="Escribe tu respuesta">
      <button class="btn" type="submit">Enviar</button>
    </form>`;

  document.body.appendChild(boton);
  document.body.appendChild(panel);

  const log = panel.querySelector('#chat-log');
  const form = panel.querySelector('#chat-form');
  const input = panel.querySelector('#chat-input');

  function mensaje(texto, tipo) {
    const div = document.createElement('div');
    div.className = 'msg ' + (tipo || 'bot');
    div.textContent = texto;
    log.appendChild(div);
    log.scrollTop = log.scrollHeight;
    return div;
  }

  function preguntar() {
    if (indice < PREGUNTAS.length) {
      mensaje(PREGUNTAS[indice].texto, 'bot');
    } else {
      analizar();
    }
  }

  boton.addEventListener('click', function () {
    const abierto = panel.classList.toggle('open');
    boton.setAttribute('aria-expanded', abierto ? 'true' : 'false');
    if (abierto && !log.childElementCount) {
      mensaje('Hola. Te hago unas preguntas cortas sobre tu empresa y te doy una evaluación preliminar de viabilidad. No reemplaza la debida diligencia, pero sirve para saber si vale la pena postularse.', 'bot');
      preguntar();
      input.focus();
    }
  });

  form.addEventListener('submit', function (evento) {
    evento.preventDefault();
    const texto = input.value.trim();
    if (!texto || cargando) return;

    mensaje(texto, 'user');
    respuestas[PREGUNTAS[indice].clave] = texto;
    indice++;
    input.value = '';
    setTimeout(preguntar, 250);
  });

  // ----- Análisis -----
  async function analizar() {
    cargando = true;
    const espera = mensaje('Analizando la información...', 'sistema');

    let salida;
    if (window.CONFIG && window.CONFIG.FUNCION_CHAT) {
      salida = await consultarIA();
    } else {
      salida = analisisLocal();
    }

    espera.remove();
    cargando = false;

    mensaje(salida.texto, 'bot');

    const pie = document.createElement('div');
    pie.className = 'veredicto';
    pie.innerHTML =
      '<b>Puntaje preliminar: ' + salida.puntaje + '/100</b><br>' +
      '<span style="color:var(--muted)">Esta lectura es orientativa y no constituye una aprobación.</span>';
    panel.appendChild(pie);

    form.style.display = 'none';

    // Guarda el análisis si hay base de datos.
    if (window.DB) {
      window.DB.guardarAnalisis({
        empresa: respuestas.empresa || null,
        sector: respuestas.sector || null,
        respuestas: respuestas,
        puntaje: salida.puntaje,
        veredicto: salida.texto.slice(0, 2000)
      });
    }
  }

  async function consultarIA() {
    try {
      const peticion = await fetch(window.CONFIG.FUNCION_CHAT, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ' + (window.CONFIG.SUPABASE_ANON_KEY || '')
        },
        body: JSON.stringify({ respuestas: respuestas })
      });

      if (!peticion.ok) throw new Error('Respuesta ' + peticion.status);

      const datos = await peticion.json();
      return {
        texto: datos.veredicto || 'No recibí un análisis legible.',
        puntaje: typeof datos.puntaje === 'number' ? datos.puntaje : 50
      };
    } catch (error) {
      console.error('Error llamando a la función de IA:', error);
      return analisisLocal();
    }
  }

  /**
   * Evaluación de respaldo, sin IA. Da una nota basada en señales
   * simples del texto para que el flujo siempre termine en algo.
   */
  function analisisLocal() {
    let puntaje = 50;
    const notas = [];
    const texto = Object.values(respuestas).join(' ').toLowerCase();

    if (/\d/.test(respuestas.tiempo || '')) {
      puntaje += 12;
      notas.push('Diste cifras concretas de tiempo o ventas, lo que facilita la evaluación.');
    } else {
      puntaje -= 8;
      notas.push('Falta concretar cuánto lleva operando y cuánto vende: sin eso ningún inversionista avanza.');
    }

    if ((respuestas.problema || '').length > 80) {
      puntaje += 10;
      notas.push('El problema que resuelve está descrito con suficiente detalle.');
    } else {
      notas.push('La descripción del problema es corta. Conviene explicar quién paga y por qué.');
    }

    if (/(cliente|contrato|factur|venta|ingreso)/.test(texto)) {
      puntaje += 12;
      notas.push('Mencionas clientes o ingresos existentes, que es la señal más fuerte para una ronda.');
    } else {
      puntaje -= 10;
      notas.push('No aparecen clientes ni ingresos: eso ubica el proyecto en etapa muy temprana.');
    }

    if ((respuestas.riesgo || '').length > 40) {
      puntaje += 8;
      notas.push('Identificar el riesgo principal con claridad juega a tu favor.');
    } else {
      notas.push('Conviene nombrar el riesgo más grande de forma explícita.');
    }

    puntaje = Math.max(5, Math.min(95, puntaje));

    const cierre = puntaje >= 70
      ? 'Con esta información el caso se ve razonable para postularse a una ronda de deuda o convertible.'
      : puntaje >= 45
        ? 'El caso es intermedio: conviene reforzar las cifras antes de postularse.'
        : 'Todavía es temprano. Vale la pena consolidar ventas y documentación antes de buscar capital.';

    return {
      texto: notas.join(' ') + ' ' + cierre,
      puntaje: puntaje
    };
  }
})();
