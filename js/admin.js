/* =========================================================
   admin.js — panel de administración.
   La seguridad NO está aquí: está en las políticas RLS de
   admin.sql. Este archivo solo es la interfaz.
   ========================================================= */
(function () {
  const db = window.DB && window.DB.obtenerCliente();
  const $ = (id) => document.getElementById(id);
  const ESTADOS = ['pendiente', 'publicada', 'cerrada', 'rechazada'];
  let empresas = [], analisis = [], vista = 'pendiente';

  const esc = (t) => { const d = document.createElement('div'); d.textContent = t == null ? '' : String(t); return d.innerHTML; };
  const pesos = (v) => v == null ? '—' : '$' + (Number(v) / 1e6).toLocaleString('es-CO', { maximumFractionDigits: 0 }) + ' M';
  const fecha = (f) => new Date(f).toLocaleDateString('es-CO');

  function aviso(texto) { $('mensaje').textContent = texto || ''; $('mensaje').hidden = !texto; }
  function pantalla(cual) {
    $('vista-login').hidden = cual !== 'login';
    $('vista-panel').hidden = cual !== 'panel';
    $('salir').hidden = cual !== 'panel';
  }

  async function entrar() {
    const { data: esAdmin, error } = await db.rpc('es_admin');
    if (error || !esAdmin) {
      await db.auth.signOut();
      pantalla('login');
      aviso('Esta cuenta no tiene permisos de administrador.');
      return;
    }
    aviso('');
    pantalla('panel');
    await cargar();
  }

  async function cargar() {
    const [e, a] = await Promise.all([
      db.rpc('admin_listar_empresas'),
      db.from('analisis_viabilidad').select('*').order('creado_en', { ascending: false }).limit(100)
    ]);
    if (e.error) return aviso('Error cargando empresas: ' + e.error.message);
    empresas = e.data || [];
    analisis = a.data || [];
    dibujar();
  }

  function dibujar() {
    const cuenta = (s) => empresas.filter((x) => x.estado === s).length;
    $('tabs').innerHTML = ESTADOS.map((s) =>
      `<button class="btn ${vista === s ? '' : 'btn-outline'}" data-vista="${s}">${s} (${cuenta(s)})</button>`
    ).join('') + `<button class="btn ${vista === 'analisis' ? '' : 'btn-outline'}" data-vista="analisis">chatbot (${analisis.length})</button>`;

    if (vista === 'analisis') {
      $('cabecera').innerHTML = '<tr><th>Fecha</th><th>Empresa</th><th>Puntaje</th><th>Veredicto</th></tr>';
      $('filas').innerHTML = analisis.map((x) =>
        `<tr><td>${fecha(x.creado_en)}</td><td>${esc(x.empresa)}<small>${esc(x.sector)}</small></td><td>${esc(x.puntaje)}</td><td>${esc(x.veredicto)}</td></tr>`
      ).join('') || '<tr><td colspan="4">Sin análisis.</td></tr>';
      return;
    }

    $('cabecera').innerHTML = '<tr><th>Empresa</th><th>Ronda</th><th>Contacto</th><th>Acciones</th></tr>';
    $('filas').innerHTML = empresas.filter((x) => x.estado === vista).map((x) => `
      <tr>
        <td><b>${esc(x.nombre)}</b><small>${esc(x.sector)} · ${esc(x.ciudad)} · ${fecha(x.creado_en)}</small><small>${esc(x.descripcion)}</small></td>
        <td>${esc(x.instrumento)}<small>Objetivo ${pesos(x.monto_objetivo)}</small><small>Comprometido ${pesos(x.monto_comprometido)}</small></td>
        <td>${esc(x.contacto_nombre)}<small>${esc(x.contacto_email)}</small></td>
        <td><div class="acciones">
          ${ESTADOS.filter((s) => s !== x.estado).map((s) => `<button data-id="${esc(x.id)}" data-estado="${s}">${s}</button>`).join('')}
          <button data-id="${esc(x.id)}" data-monto="1">monto</button>
          <button class="peligro" data-id="${esc(x.id)}" data-borrar="1">eliminar</button>
        </div></td>
      </tr>`).join('') || '<tr><td colspan="4">No hay empresas en este estado.</td></tr>';
  }

  async function actualizar(id, cambios) {
    const { data, error } = await db.from('empresas').update(cambios).eq('id', id).select('id');
    if (error) return aviso('Error: ' + error.message);
    // RLS bloquea sin error: si no volvió ninguna fila, no se aplicó.
    if (!data || !data.length) return aviso('No se aplicó el cambio. ¿Ejecutaste admin.sql?');
    aviso('');
    await cargar();
  }

  async function borrar(id) {
    const { data, error } = await db.from('empresas').delete().eq('id', id).select('id');
    if (error) return aviso('Error: ' + error.message);
    if (!data || !data.length) return aviso('No se eliminó. ¿Ejecutaste admin.sql?');
    aviso('');
    await cargar();
  }

  $('tabs').addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-vista]');
    if (b) { vista = b.dataset.vista; dibujar(); }
  });

  $('filas').addEventListener('click', (ev) => {
    const b = ev.target.closest('button[data-id]');
    if (!b) return;
    const id = b.dataset.id;
    const e = empresas.find((x) => x.id === id);
    if (b.dataset.estado) return actualizar(id, { estado: b.dataset.estado });
    if (b.dataset.borrar) {
      if (confirm('¿Eliminar "' + e.nombre + '" definitivamente?')) borrar(id);
      return;
    }
    if (b.dataset.monto) {
      const r = prompt('Monto comprometido en pesos (objetivo: ' + e.monto_objetivo + ')', e.monto_comprometido);
      if (r === null) return;
      const n = Number(String(r).replace(/[^\d]/g, ''));
      if (n > Number(e.monto_objetivo) && !confirm('Supera el monto objetivo. ¿Continuar?')) return;
      actualizar(id, { monto_comprometido: n });
    }
  });

  $('vista-login').addEventListener('submit', async (ev) => {
    ev.preventDefault();
    aviso('');
    const { error } = await db.auth.signInWithPassword({ email: $('correo').value.trim(), password: $('clave').value });
    if (error) return aviso('No se pudo iniciar sesión: ' + error.message);
    $('clave').value = '';
    entrar();
  });

  $('salir').addEventListener('click', async () => { await db.auth.signOut(); pantalla('login'); });

  (async function iniciar() {
    if (!db) { pantalla('none'); return aviso('Configura SUPABASE_URL y SUPABASE_ANON_KEY en js/config.js.'); }
    const { data } = await db.auth.getSession();
    data.session ? entrar() : pantalla('login');
  })();
})();