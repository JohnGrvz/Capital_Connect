// =========================================================
// Edge Function: analizar-viabilidad
//
// Recibe las respuestas del chatbot, se las pasa a un modelo
// de lenguaje y devuelve un veredicto con puntaje.
//
// Vive en el servidor de Supabase, no en el navegador. Por eso
// puede guardar la clave de la API sin exponerla a los visitantes.
//
// Desplegar:
//   supabase functions deploy analizar-viabilidad
//   supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
// =========================================================

const CORS = {
  'Access-Control-Allow-Origin': '*', // en producción, pon aquí tu dominio
  'Access-Control-Allow-Headers': 'authorization, content-type, apikey',
  'Access-Control-Allow-Methods': 'POST, OPTIONS'
};

const INSTRUCCIONES = `
Eres el analista de riesgo de Capital Connect, una plataforma colombiana que
conecta empresas con inversionistas mediante préstamos, acciones o notas
convertibles.

Recibes las respuestas de un empresario sobre su proyecto. Tu tarea es dar una
lectura preliminar de viabilidad, honesta y útil.

Criterios que debes evaluar:
1. Tracción: ¿hay clientes, ventas o contratos, o solo una idea?
2. Claridad del uso de los recursos: ¿el dinero produce retorno o solo tapa huecos?
3. Coherencia entre el monto pedido y el tamaño de la operación.
4. Capacidad de pago, si lo que busca es deuda.
5. Riesgos que el empresario reconoce y los que no menciona.

Reglas:
- Escribe en español, en segunda persona, máximo 180 palabras.
- Sé concreto: señala qué falta y qué está bien, sin rodeos ni entusiasmo vacío.
- Si la información es insuficiente, dilo y pide lo que falta.
- Nunca prometas aprobación ni rendimientos. Esto es una lectura preliminar.
- Recomienda el instrumento que mejor le calce (préstamo, acciones o convertible).

Responde ÚNICAMENTE con un objeto JSON válido, sin texto adicional y sin
bloques de código, con esta forma exacta:
{"puntaje": <entero de 0 a 100>, "veredicto": "<tu análisis>", "instrumento_sugerido": "<deuda|equity|convertible>"}
`.trim();

Deno.serve(async (peticion: Request) => {
  // El navegador pregunta primero si puede llamar (preflight)
  if (peticion.method === 'OPTIONS') {
    return new Response('ok', { headers: CORS });
  }

  try {
    const { respuestas } = await peticion.json();

    if (!respuestas || typeof respuestas !== 'object') {
      return new Response(
        JSON.stringify({ error: 'Faltan las respuestas del formulario.' }),
        { status: 400, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const clave = Deno.env.get('ANTHROPIC_API_KEY');
    if (!clave) {
      return new Response(
        JSON.stringify({ error: 'No hay clave de API configurada en el servidor.' }),
        { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    // Convierte las respuestas en un texto legible para el modelo
    const resumen = Object.entries(respuestas)
      .map(([campo, valor]) => `${campo}: ${valor}`)
      .join('\n');

    const llamada = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': clave,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 800,
        system: INSTRUCCIONES,
        messages: [
          { role: 'user', content: `Datos del proyecto:\n\n${resumen}` }
        ]
      })
    });

    if (!llamada.ok) {
      const detalle = await llamada.text();
      console.error('Error del proveedor de IA:', detalle);
      return new Response(
        JSON.stringify({ error: 'El servicio de análisis no respondió.' }),
        { status: 502, headers: { ...CORS, 'Content-Type': 'application/json' } }
      );
    }

    const datos = await llamada.json();
    const texto = (datos.content || [])
      .filter((b: { type: string }) => b.type === 'text')
      .map((b: { text: string }) => b.text)
      .join('\n')
      .trim();

    // El modelo devuelve JSON; por si acaso, se limpian los backticks
    let analisis;
    try {
      analisis = JSON.parse(texto.replace(/```json|```/g, '').trim());
    } catch {
      analisis = { puntaje: 50, veredicto: texto };
    }

    return new Response(JSON.stringify(analisis), {
      headers: { ...CORS, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error('Error inesperado:', error);
    return new Response(
      JSON.stringify({ error: 'Error procesando la solicitud.' }),
      { status: 500, headers: { ...CORS, 'Content-Type': 'application/json' } }
    );
  }
});
