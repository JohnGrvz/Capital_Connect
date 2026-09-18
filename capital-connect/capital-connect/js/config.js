/* =========================================================
   config.js
   Datos de conexión del proyecto.

   Reemplaza los dos valores de abajo con los de tu proyecto
   de Supabase (Project Settings > API). Mientras estén vacíos,
   el sitio funciona con los datos de ejemplo de datos-demo.js.

   La clave "anon" es pública por diseño: está pensada para ir
   en el navegador. Lo que protege la base de datos son las
   políticas RLS del archivo supabase/schema.sql, no el secreto
   de esta clave. NUNCA pongas aquí la clave service_role.
   ========================================================= */

window.CONFIG = {
  SUPABASE_URL: '',      // ej: https://abcdefghijk.supabase.co
  SUPABASE_ANON_KEY: '', // ej: eyJhbGciOiJIUzI1NiIsInR5cCI6...

  // URL de la Edge Function que responde al chatbot.
  // Se completa sola si defines SUPABASE_URL; también la puedes
  // escribir a mano si alojas la función en otro lado.
  FUNCION_CHAT: ''
};

// Deriva la URL de la función si no se especificó.
if (!window.CONFIG.FUNCION_CHAT && window.CONFIG.SUPABASE_URL) {
  window.CONFIG.FUNCION_CHAT =
    window.CONFIG.SUPABASE_URL + '/functions/v1/analizar-viabilidad';
}

// Atajo para saber si hay base de datos configurada.
window.HAY_SUPABASE = Boolean(
  window.CONFIG.SUPABASE_URL && window.CONFIG.SUPABASE_ANON_KEY
);
