# El asistente de viabilidad

El sitio incluye un chatbot que hace seis preguntas sobre una empresa y devuelve
una lectura preliminar de viabilidad con un puntaje. Este documento explica cómo
está armado y qué caminos existen para conectarle una IA de verdad.

## La regla que no se puede romper

**La clave de la API nunca puede estar en el JavaScript del navegador.**

Si escribes tu clave en un archivo `.js`, cualquier persona que abra el sitio
puede verla con Ctrl+U o en la pestaña de red del inspector. Con esa clave puede
gastar tu saldo hasta vaciarlo. Esto pasa seguido y no hay forma de ocultarlo:
todo lo que llega al navegador es visible.

La solución siempre es la misma: un intermediario en el servidor. El navegador
le habla a tu servidor, tu servidor le habla al proveedor de IA con la clave
guardada, y devuelve solo la respuesta.

```
Navegador  ──(pregunta)──▶  Tu función en el servidor  ──(pregunta + clave)──▶  Modelo de IA
Navegador  ◀──(respuesta)──  Tu función en el servidor  ◀──(respuesta)──────────  Modelo de IA
```

## Opción 1: Edge Function de Supabase (la que viene implementada)

Ya que vas a usar Supabase para la base de datos, la función va en el mismo
lugar. No necesitas contratar nada más.

El código está en `supabase/functions/analizar-viabilidad/index.ts`.

**Desplegarla:**

```bash
npm install -g supabase
supabase login
supabase link --project-ref TU-REFERENCIA
supabase functions deploy analizar-viabilidad
supabase secrets set ANTHROPIC_API_KEY=sk-ant-...
```

La referencia del proyecto está en la URL de Supabase o en Project Settings.

Una vez desplegada, el chatbot la detecta solo: `js/config.js` arma la URL a
partir de `SUPABASE_URL`.

**Ventajas:** todo en un solo proveedor, capa gratuita generosa, la clave queda
protegida en los secrets.
**Desventajas:** se escribe en TypeScript sobre Deno, que quizá no hayas usado.

## Opción 2: Backend propio

Si el curso te pide mostrar un backend, puedes hacer lo mismo con Node y
Express. La lógica es idéntica:

```js
import express from 'express';
const app = express();
app.use(express.json());

app.post('/api/viabilidad', async (req, res) => {
  const respuesta = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,  // desde variable de entorno
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 800,
      system: INSTRUCCIONES,
      messages: [{ role: 'user', content: JSON.stringify(req.body.respuestas) }]
    })
  });
  res.json(await respuesta.json());
});

app.listen(3000);
```

Luego apuntas `FUNCION_CHAT` en `config.js` a `http://localhost:3000/api/viabilidad`.

Para publicarlo gratis: Render, Railway, Fly.io o Vercel Functions.

**Ventajas:** es el enfoque que suelen pedir en clase, y ves el servidor
completo.
**Desventajas:** un servicio más que desplegar y mantener.

## Opción 3: Servicio de chatbot ya armado

Si lo que te interesa es el resultado y no construir la integración, hay
plataformas donde subes un documento con tus criterios y te dan un widget para
pegar en el HTML: Voiceflow, Chatbase, Botpress o Dialogflow.

**Ventajas:** funciona en una tarde, sin código de servidor.
**Desventajas:** menos control, marca del proveedor visible, y planes que se
vuelven de pago rápido.

## Cómo está diseñada la conversación

El chatbot no es una conversación abierta: es un cuestionario de seis preguntas
fijas y un análisis al final. Esto es a propósito.

1. **Nombre de la empresa o proyecto**
2. **Sector y ciudad**
3. **Tiempo operando y ventas del último año**
4. **Qué problema resuelve y quién le paga**
5. **Cuánto capital necesita y para qué**
6. **Qué es lo que más podría salir mal**

Un cuestionario estructurado da mejores resultados que un chat libre, porque el
modelo recibe siempre la misma información en el mismo orden y no se va por las
ramas. Además es más barato: una sola llamada a la API por usuario en vez de una
por mensaje.

Las preguntas están en el arreglo `PREGUNTAS` al inicio de `js/chatbot.js`, si
quieres cambiarlas.

## Las instrucciones del modelo

Están en la constante `INSTRUCCIONES` de la Edge Function. Definen cinco
criterios de evaluación (tracción, uso de los recursos, coherencia del monto,
capacidad de pago y riesgos), un límite de 180 palabras y la obligación de
responder en JSON.

Pedir JSON es lo que permite separar el puntaje del texto y guardarlo en la
tabla `analisis_viabilidad`. Si el modelo devuelve algo que no se puede
interpretar, el código cae a un puntaje neutro de 50 en vez de romperse.

Dos reglas de las instrucciones importan más de lo que parecen:

- **Nunca prometer aprobación.** Un chatbot que dice "tu proyecto es excelente,
  seguro te aprueban" genera una expectativa que después alguien tiene que
  desmentir. La instrucción lo prohíbe explícitamente.
- **Pedir lo que falta.** Si el empresario responde en dos palabras, la respuesta
  útil no es un puntaje inventado sino decirle qué información hace falta.

## El modo sin IA

Si no hay función configurada, `js/chatbot.js` usa `analisisLocal()`, que da una
nota a partir de señales simples del texto: si mencionó cifras, si describió el
problema con detalle, si nombró clientes o ingresos, si reconoció un riesgo.

No es inteligencia artificial y no pretende serlo. Está para que el flujo se
pueda mostrar sin depender de que un servicio externo esté disponible, algo útil
si vas a presentar el proyecto en un salón con internet inestable.

## Límite importante

Este asistente da una lectura orientativa. No reemplaza la debida diligencia ni
constituye una aprobación ni una recomendación de inversión, y así se lo dice al
usuario al final de cada análisis. Conviene que esa advertencia se quede: es la
diferencia entre una herramienta de apoyo y una que promete algo que no puede
cumplir.
