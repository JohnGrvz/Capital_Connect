/* =========================================================
   publicar.js
   Valida el formulario de registro de empresa y lo envía a
   la tabla "empresas" de Supabase.
   ========================================================= */

(function () {
  const form = document.getElementById('form-empresa');
  if (!form) return;

  const boton = document.getElementById('enviar');
  const resultado = document.getElementById('resultado');

  function mostrarError(campo, texto) {
    const destino = document.getElementById('error-' + campo);
    if (destino) destino.textContent = texto || '';
  }

  function limpiarErrores() {
    form.querySelectorAll('.error').forEach((e) => (e.textContent = ''));
  }

  /** Quita puntos, comas y el signo de pesos: "1.800.000" -> 1800000 */
  function aNumero(valor) {
    if (!valor) return null;
    const limpio = String(valor).replace(/[^\d]/g, '');
    return limpio ? Number(limpio) : null;
  }

  function validar(datos) {
    const errores = {};
    if (!datos.nombre) errores.nombre = 'Escribe la razón social de la empresa.';
    if (!datos.sector) errores.sector = 'Indica el sector.';
    if (!datos.ciudad) errores.ciudad = 'Indica la ciudad.';
    if (!datos.contacto_email || !/^\S+@\S+\.\S+$/.test(datos.contacto_email)) {
      errores.contacto_email = 'Escribe un correo válido.';
    }
    if (!datos.monto_objetivo || datos.monto_objetivo < 50000000) {
      errores.monto_objetivo = 'El monto mínimo de una ronda es $50.000.000.';
    }
    if (!datos.descripcion || datos.descripcion.length < 40) {
      errores.descripcion = 'Cuenta en al menos 40 caracteres para qué es el capital.';
    }
    return errores;
  }

  form.addEventListener('submit', async function (evento) {
    evento.preventDefault();
    limpiarErrores();

    const datos = {
      nombre: form.nombre.value.trim(),
      sector: form.sector.value.trim(),
      ciudad: form.ciudad.value.trim(),
      nit: form.nit.value.trim() || null,
      anios_operacion: aNumero(form.anios_operacion.value),
      ventas_anuales: aNumero(form.ventas_anuales.value),
      instrumento: form.instrumento.value,
      monto_objetivo: aNumero(form.monto_objetivo.value),
      plazo: form.plazo.value.trim() || null,
      descripcion: form.descripcion.value.trim(),
      contacto_nombre: form.contacto_nombre.value.trim() || null,
      contacto_email: form.contacto_email.value.trim(),
      // El estado siempre entra como "pendiente": nadie publica
      // directamente desde el formulario público.
      estado: 'pendiente'
    };

    const errores = validar(datos);
    if (Object.keys(errores).length) {
      Object.entries(errores).forEach(([campo, texto]) => mostrarError(campo, texto));
      const primero = form.querySelector('#' + Object.keys(errores)[0]);
      if (primero) primero.focus();
      return;
    }

    boton.disabled = true;
    boton.textContent = 'Enviando...';

    const respuesta = await window.DB.crearEmpresa(datos);

    boton.disabled = false;
    boton.textContent = 'Enviar solicitud';

    if (!respuesta.ok) {
      resultado.className = 'aviso';
      resultado.innerHTML =
        '<h3>No pudimos guardar la solicitud</h3><p>' +
        (respuesta.error || 'Intenta de nuevo en unos minutos.') +
        '</p>';
      resultado.style.display = 'block';
      resultado.scrollIntoView({ block: 'center' });
      return;
    }

    form.style.display = 'none';
    resultado.className = 'aviso';
    resultado.innerHTML =
      '<h3>Solicitud recibida</h3>' +
      '<p>La empresa quedó registrada en estado pendiente. Nuestro equipo revisa ' +
      'el caso y responde al correo que dejaste dentro de los siguientes dos días hábiles.</p>' +
      (respuesta.simulado
        ? '<p class="form-note">Nota: no hay base de datos conectada, así que este envío fue simulado.</p>'
        : '');
    resultado.style.display = 'block';
    resultado.scrollIntoView({ block: 'center' });
  });
})();
