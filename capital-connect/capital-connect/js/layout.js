/* =========================================================
   layout.js
   Inserta la cabecera y el pie de página en todas las páginas.
   Así el menú se edita en un solo archivo y no en siete.
   Cada página declara su identificador con:
   <body data-pagina="oportunidades">
   ========================================================= */

(function () {
  const LOGO = `
    <svg class="mark" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="6" cy="6" r="3.2" stroke="#F1F2ED" stroke-width="1.6"/>
      <circle cx="18" cy="18" r="3.2" fill="#0E9A8C"/>
      <path d="M8.4 8.4C10 10 10.5 12 11 14c.5 2 1.5 3 4 3.6"
            stroke="#0E9A8C" stroke-width="1.6" stroke-linecap="round"/>
    </svg>`;

  const MENU = [
    { id: 'inicio',         texto: 'Inicio',              url: 'index.html' },
    { id: 'como-funciona',  texto: 'Cómo funciona',       url: 'como-funciona.html' },
    { id: 'oportunidades',  texto: 'Oportunidades',       url: 'oportunidades.html' },
    { id: 'empresas',       texto: 'Para empresas',       url: 'empresas.html' },
    { id: 'inversionistas', texto: 'Para inversionistas', url: 'inversionistas.html' },
    { id: 'nosotros',       texto: 'Nosotros',            url: 'nosotros.html' }
  ];

  const actual = document.body.dataset.pagina || 'inicio';

  const enlaces = (clase) => MENU.map(function (m) {
    const activo = m.id === actual ? ' aria-current="page"' : '';
    return `<a href="${m.url}"${activo}>${m.texto}</a>`;
  }).join('');

  document.getElementById('site-header').innerHTML = `
    <header class="topbar">
      <div class="wrap">
        <a class="wordmark" href="index.html">${LOGO} Capital Connect</a>
        <nav class="nav" aria-label="Navegación principal">${enlaces()}</nav>
        <a class="btn btn-ghost" href="contacto.html">Ingresar</a>
        <a class="btn" href="publicar.html">Publicar empresa</a>
        <button class="burger" id="burger" aria-label="Abrir menú" aria-expanded="false" aria-controls="drawer">
          <svg width="20" height="14" viewBox="0 0 20 14" fill="none" aria-hidden="true">
            <path d="M0 1h20M0 7h20M0 13h20" stroke="currentColor" stroke-width="1.6"/>
          </svg>
        </button>
      </div>
    </header>
    <div class="drawer" id="drawer">
      <div class="wrap">
        ${enlaces()}
        <a href="contacto.html">Contacto</a>
        <a href="publicar.html">Publicar empresa</a>
      </div>
    </div>`;

  document.getElementById('site-footer').innerHTML = `
    <footer>
      <div class="wrap">
        <div class="foot-grid">
          <div>
            <a class="wordmark" href="index.html">${LOGO} Capital Connect</a>
            <p style="max-width:34ch;margin-top:.9rem;">
              Capital que encuentra empresa, y empresa que encuentra capital.
            </p>
          </div>
          <div>
            <h4>Plataforma</h4>
            <ul>
              <li><a href="como-funciona.html">Cómo funciona</a></li>
              <li><a href="oportunidades.html">Oportunidades</a></li>
              <li><a href="empresas.html">Para empresas</a></li>
              <li><a href="inversionistas.html">Para inversionistas</a></li>
            </ul>
          </div>
          <div>
            <h4>Compañía</h4>
            <ul>
              <li><a href="nosotros.html">Nosotros</a></li>
              <li><a href="publicar.html">Publicar empresa</a></li>
              <li><a href="contacto.html">Contacto</a></li>
            </ul>
          </div>
          <div>
            <h4>Legal</h4>
            <ul>
              <li><a href="como-funciona.html">Términos</a></li>
              <li><a href="como-funciona.html">Privacidad</a></li>
              <li><a href="inversionistas.html">Riesgos</a></li>
            </ul>
          </div>
        </div>
        <p class="legal">
          Proyecto académico. Capital Connect no es una empresa real: las cifras,
          operaciones, personas y compañías que aparecen son ficticias y solo
          sirven para mostrar el diseño y el funcionamiento del sitio.
        </p>
      </div>
    </footer>`;

  // Menú móvil
  const burger = document.getElementById('burger');
  const drawer = document.getElementById('drawer');
  burger.addEventListener('click', function () {
    const abierto = drawer.classList.toggle('open');
    burger.setAttribute('aria-expanded', abierto ? 'true' : 'false');
  });
})();
