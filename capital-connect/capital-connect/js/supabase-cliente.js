/* =========================================================
   supabase-cliente.js
   Única capa de acceso a datos del sitio.

   Si hay credenciales en config.js, habla con Supabase.
   Si no las hay, devuelve los datos de datos-demo.js, para que
   la página siga funcionando cuando alguien la abre sin base
   de datos (por ejemplo, tu profesora abriendo el HTML suelto).
   ========================================================= */

window.DB = (function () {
  let cliente = null;

  function obtenerCliente() {
    if (cliente) return cliente;
    if (!window.HAY_SUPABASE || !window.supabase) return null;
    cliente = window.supabase.createClient(
      window.CONFIG.SUPABASE_URL,
      window.CONFIG.SUPABASE_ANON_KEY
    );
    return cliente;
  }

  /**
   * Devuelve las empresas publicadas.
   * @returns {Promise<{datos: Array, fuente: 'supabase'|'demo', error: string|null}>}
   */
  async function listarEmpresas() {
    const db = obtenerCliente();

    if (!db) {
      return { datos: window.EMPRESAS_DEMO || [], fuente: 'demo', error: null };
    }

    const { data, error } = await db
      .from('empresas')
      .select('*')
      .eq('estado', 'publicada')
      .order('creado_en', { ascending: false });

    if (error) {
      console.error('Error consultando Supabase:', error.message);
      return { datos: window.EMPRESAS_DEMO || [], fuente: 'demo', error: error.message };
    }

    return { datos: data, fuente: 'supabase', error: null };
  }

  /**
   * Registra una empresa nueva. Queda en estado "pendiente"
   * hasta que alguien del equipo la revise y la publique.
   * @param {Object} empresa
   */
  async function crearEmpresa(empresa) {
    const db = obtenerCliente();

    if (!db) {
      // Sin base de datos, simulamos el envío para poder mostrar el flujo.
      await new Promise((r) => setTimeout(r, 700));
      return { ok: true, simulado: true };
    }

    const { error } = await db.from('empresas').insert([empresa]);

    if (error) {
      console.error('Error insertando empresa:', error.message);
      return { ok: false, simulado: false, error: error.message };
    }

    return { ok: true, simulado: false };
  }

  /**
   * Guarda el resultado de un análisis de viabilidad del chatbot.
   */
  async function guardarAnalisis(analisis) {
    const db = obtenerCliente();
    if (!db) return { ok: true, simulado: true };

    const { error } = await db.from('analisis_viabilidad').insert([analisis]);
    if (error) return { ok: false, error: error.message };
    return { ok: true, simulado: false };
  }

  return { listarEmpresas, crearEmpresa, guardarAnalisis, obtenerCliente };
})();
