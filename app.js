'use strict';
/* ══════════════════════════════════════════════════════════════════
   O-LAB EDITOR · Lógica del prototipo (sin backend, estado en JS)
   Organización: Estado → Utilidades → Zona A → Zona B → Zona C
   → Zona D → Zona E → Copiloto IA → Vista previa → Inicialización
   ══════════════════════════════════════════════════════════════════ */

/* ─── ESTADO GLOBAL ────────────────────────────────────────────── */

const TUTORES = {
  jaime:     { nombre: 'Jaime',     simbolo: '#char-jaime' },
  lola:      { nombre: 'Lola',      simbolo: '#char-lola' },
  ejecutivo: { nombre: 'Andrés',    simbolo: '#char-ejecutivo' },
  doctora:   { nombre: 'Valentina', simbolo: '#char-doctora' },
};

const VOCES = [
  'Jaime — cálida y cercana',
  'Lola — enérgica y alegre',
  'Andrés — profesional y clara',
  'Valentina — serena y pausada',
];

const state = {
  proyecto: '¿Cómo auditar una bodega?',
  escenaActiva: 0,
  seleccion: null, // null | 'avatar' | 'dialog' | 'button'
  editandoDialogo: false,
  escenas: [
    {
      nombre: 'Bienvenida', bg: 'bodega', tutor: 'jaime',
      dialogo: '¡Hola! Qué bueno verte por acá. Bienvenido a la bodega. Hoy te toca ser el líder operativo, así que vamos a darle con todo.',
      boton: 'Continuar', voz: VOCES[0], tono: 'Cercano', posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    },
    {
      nombre: 'Conocimiento previo', bg: 'bodega', tutor: 'jaime',
      dialogo: 'Antes de arrancar, cuéntame: ¿ya habías hecho una auditoría de bodega, o esta es tu primera vez? Así ajusto el recorrido para ti.',
      boton: 'Continuar', voz: VOCES[0], tono: 'Cercano', posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    },
    {
      nombre: 'Hallazgos', bg: 'bodega', tutor: 'jaime',
      dialogo: 'Mira con atención este pasillo. Hay tres hallazgos de seguridad esperándote. Tómate tu tiempo: un buen auditor no deja pasar nada.',
      boton: 'Continuar', voz: VOCES[0], tono: 'Cercano', posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    },
    {
      // Escena incompleta a propósito (indicador ⚠ en la timeline)
      nombre: 'Montacargas', bg: 'bodega', tutor: 'jaime',
      dialogo: '', boton: 'Continuar', voz: VOCES[0], tono: 'Cercano', posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    },
    {
      // Escena incompleta a propósito (indicador ⚠ en la timeline)
      nombre: 'Inspección', bg: 'bodega', tutor: 'jaime',
      dialogo: '', boton: 'Continuar', voz: VOCES[0], tono: 'Cercano', posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    },
    {
      nombre: 'Pantalla final', bg: 'bodega', tutor: 'jaime',
      dialogo: '¡Excelente trabajo! Completaste la auditoría de la bodega. Descarga tu certificado y compártelo con tu equipo. ¡Nos vemos en la próxima misión!',
      boton: 'Finalizar', voz: VOCES[0], tono: 'Motivador', posAvatar: 'izquierda', accion: 'Finalizar simulación',
    },
  ],
};

/* Helpers de acceso al DOM */
const $  = (sel) => document.querySelector(sel);
const $$ = (sel) => Array.from(document.querySelectorAll(sel));

const escenaActual = () => state.escenas[state.escenaActiva];
const tutorActual  = () => TUTORES[escenaActual().tutor];
/* Una escena está completa si tiene diálogo */
const estadoEscena = (esc) => (esc.dialogo.trim() ? 'ok' : 'warn');

/* ─── UTILIDADES: TOASTS + INDICADOR DE GUARDADO ───────────────── */

/**
 * Muestra un toast en la esquina inferior izquierda.
 * tipo: 'ok' (✓ verde) | 'warn' (⚠) | 'info' (i) | 'ia' (✨)
 */
function toast(mensaje, tipo = 'ok') {
  const iconos = { ok: '✓', warn: '⚠', info: 'i', ia: '✨' };
  const el = document.createElement('div');
  el.className = `toast ${tipo}`;
  el.innerHTML = `<span class="toast-icon">${iconos[tipo] || '✓'}</span><span></span>`;
  el.lastElementChild.textContent = mensaje;
  $('#toastStack').appendChild(el);
  requestAnimationFrame(() => el.classList.add('show'));
  setTimeout(() => {
    el.classList.remove('show');
    setTimeout(() => el.remove(), 250);
  }, 3200);
}

/* Indicador de guardado del header (Zona A) */
let saveTimer = null;
function marcarGuardado() {
  const ind = $('#saveIndicator');
  ind.textContent = 'Guardado';
  ind.classList.add('just-saved');
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    ind.classList.remove('just-saved');
    ind.textContent = 'Guardado automáticamente · hace unos segundos';
  }, 2400);
}

/* ══════════════════════════════════════════════════════════════════
   ZONA A · HEADER: nombre editable, vista previa, publicar
   ══════════════════════════════════════════════════════════════════ */

$('#btnBack').addEventListener('click', () => {
  toast('Aquí volverías a “Mis proyectos”', 'info');
});

/* Nombre del proyecto editable inline (clic en el nombre o en el lápiz) */
function editarNombreProyecto() {
  const h1 = $('#projectName');
  if (!h1) return; // ya se está editando
  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'project-name-input';
  input.value = state.proyecto;
  input.setAttribute('aria-label', 'Nombre del proyecto');
  h1.replaceWith(input);
  input.focus();
  input.select();

  const confirmar = () => {
    state.proyecto = input.value.trim() || state.proyecto;
    const nuevo = document.createElement('h1');
    nuevo.className = 'project-name';
    nuevo.id = 'projectName';
    nuevo.title = 'Haz clic para renombrar';
    nuevo.textContent = state.proyecto;
    nuevo.addEventListener('click', editarNombreProyecto);
    input.replaceWith(nuevo);
    $('#publishProjectName').textContent = state.proyecto;
    marcarGuardado();
  };

  input.addEventListener('blur', confirmar);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur();
    if (e.key === 'Escape') { input.value = state.proyecto; input.blur(); }
  });
}
$('#projectName').addEventListener('click', editarNombreProyecto);
$('#btnRename').addEventListener('click', editarNombreProyecto);

/* ── Modal de publicación ── */
const CANALES = {
  web:      { link: 'https://olab.app/c/como-auditar-una-bodega' },
  whatsapp: { link: 'https://olab.app/wa/como-auditar-una-bodega' },
  lms:      { link: 'https://olab.app/lms/scorm/como-auditar-una-bodega.zip' },
  qr:       { link: 'https://olab.app/c/como-auditar-una-bodega' },
};

function abrirModalPublicar() {
  $('#publishModal').hidden = false;
  $('#btnPublishNow').focus();
}
function cerrarModalPublicar() {
  $('#publishModal').hidden = true;
}

$('#btnPublish').addEventListener('click', abrirModalPublicar);
$('#btnCloseModal').addEventListener('click', cerrarModalPublicar);
$('#btnCancelPublish').addEventListener('click', cerrarModalPublicar);
$('#publishModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) cerrarModalPublicar(); // clic en el fondo
});

/* Selección de canal: resalta la tarjeta y actualiza link / QR */
$('#channelGrid').addEventListener('click', (e) => {
  const card = e.target.closest('.channel-card');
  if (!card) return;
  $$('.channel-card').forEach((c) => c.classList.remove('active'));
  card.classList.add('active');
  const canal = card.dataset.channel;
  $('#publishLink').value = CANALES[canal].link;
  const esQR = canal === 'qr';
  $('#qrBlock').hidden = !esQR;
  $('#linkRow').style.display = esQR ? 'none' : 'flex';
});

/* Copiar link (con fallback si el portapapeles no está disponible) */
$('#btnCopyLink').addEventListener('click', async () => {
  const input = $('#publishLink');
  try {
    await navigator.clipboard.writeText(input.value);
  } catch {
    input.select();
    document.execCommand('copy');
  }
  const btn = $('#btnCopyLink');
  const original = btn.textContent;
  btn.textContent = '¡Copiado!';
  setTimeout(() => { btn.textContent = original; }, 1600);
  toast('Link copiado al portapapeles');
});

$('#btnPublishNow').addEventListener('click', () => {
  cerrarModalPublicar();
  toast('🎉 ¡Tu curso ya está publicado!');
});

/* QR de utilería: patrón determinista generado una sola vez */
function dibujarQR() {
  const n = 21;
  const bit = (x, y) => ((x * 7 + y * 11 + x * y) % 5) < 2;
  const enBuscador = (x, y) =>
    (x < 7 && y < 7) || (x >= n - 7 && y < 7) || (x < 7 && y >= n - 7);
  let rects = '';
  for (let y = 0; y < n; y++) {
    for (let x = 0; x < n; x++) {
      if (!enBuscador(x, y) && bit(x, y)) {
        rects += `<rect x="${x}" y="${y}" width="1" height="1"/>`;
      }
    }
  }
  const buscador = (cx, cy) =>
    `<rect x="${cx}" y="${cy}" width="7" height="7"/>` +
    `<rect x="${cx + 1}" y="${cy + 1}" width="5" height="5" fill="#fff"/>` +
    `<rect x="${cx + 2}" y="${cy + 2}" width="3" height="3"/>`;
  $('#qrBox').innerHTML =
    `<svg viewBox="0 0 ${n} ${n}" fill="#0F172A" shape-rendering="crispEdges">` +
    buscador(0, 0) + buscador(n - 7, 0) + buscador(0, n - 7) + rects + '</svg>';
}

/* ══════════════════════════════════════════════════════════════════
   ZONA B · PANEL "AGREGAR": tabs del rail + acciones de cada tab
   ══════════════════════════════════════════════════════════════════ */

function activarTab(nombre) {
  $$('.rail-tab').forEach((t) => {
    const activo = t.dataset.tab === nombre;
    t.classList.toggle('active', activo);
    t.setAttribute('aria-selected', String(activo));
  });
  $$('.tab-pane').forEach((p) => {
    const activo = p.id === `tab-${nombre}`;
    p.classList.toggle('active', activo);
    p.hidden = !activo;
  });
}

$$('.rail-tab').forEach((tab) => {
  tab.addEventListener('click', () => activarTab(tab.dataset.tab));
});

/* Tabs internas de Media */
$$('.media-tab').forEach((tab) => {
  tab.addEventListener('click', () => {
    $$('.media-tab').forEach((t) => {
      const activo = t === tab;
      t.classList.toggle('active', activo);
      t.setAttribute('aria-selected', String(activo));
    });
    $$('.media-pane').forEach((p) => {
      const activo = p.id === `mpane-${tab.dataset.mtab}`;
      p.classList.toggle('active', activo);
      p.hidden = !activo;
    });
  });
});

/* Buscador de media: filtra los elementos visibles por nombre */
$('#mediaSearch').addEventListener('input', (e) => {
  const q = e.target.value.trim().toLowerCase();
  $$('.media-item').forEach((item) => {
    const nombre = (item.dataset.name || '').toLowerCase();
    item.style.display = nombre.includes(q) ? '' : 'none';
  });
});

/* Textos por defecto al agregar una interacción a una escena vacía */
const INTERACCIONES = {
  dialogo:  { dialogo: 'Revisemos juntos esta zona de la bodega. Fíjate bien en cada detalle antes de avanzar.', boton: 'Continuar' },
  quiz:     { dialogo: 'Pregunta: al llegar a la zona de montacargas, ¿qué debes revisar primero?', boton: 'Responder' },
  decision: { dialogo: 'Encuentras una caja bloqueando la salida de emergencia. ¿Qué haces?', boton: 'Elegir' },
  dragdrop: { dialogo: 'Arrastra cada elemento de protección personal a su lugar correcto.', boton: 'Comenzar' },
};

/* Clic en cualquier elemento "agregable" del panel */
$('.add-content').addEventListener('click', (e) => {
  const item = e.target.closest('[data-add]');
  if (!item) return;
  const esc = escenaActual();

  switch (item.dataset.add) {
    case 'escenario':
      esc.bg = item.dataset.bg;
      renderEscena({ mantenerSeleccion: true });
      marcarGuardado();
      toast('Escenario aplicado a la escena');
      break;

    case 'tutor':
      esc.tutor = item.dataset.tutor;
      renderEscena({ mantenerSeleccion: true });
      if (state.seleccion === 'avatar') abrirPropiedades('avatar');
      marcarGuardado();
      toast(`${TUTORES[esc.tutor].nombre} ahora es el tutor de esta escena`);
      break;

    case 'interaccion': {
      // Si la escena está vacía, la interacción la completa de verdad
      if (!esc.dialogo.trim()) {
        const plantilla = INTERACCIONES[item.dataset.int] || INTERACCIONES.dialogo;
        esc.dialogo = plantilla.dialogo;
        esc.boton = plantilla.boton;
        renderEscena();
        marcarGuardado();
      }
      toast('Elemento agregado a la escena');
      break;
    }

    case 'media':
      toast('Elemento agregado a la escena');
      break;
  }
});

$('#btnOpenCopilotFromTab').addEventListener('click', () => abrirCopiloto());

/* ══════════════════════════════════════════════════════════════════
   ZONA C · CANVAS: render de escena, selección, toolbar contextual
   y edición directa del diálogo
   ══════════════════════════════════════════════════════════════════ */

/**
 * Pinta la escena activa en el canvas.
 * mantenerSeleccion: conserva selección/toolbar (para cambios de propiedades);
 * si es false (cambio de escena), se deselecciona todo.
 */
function renderEscena({ mantenerSeleccion = false } = {}) {
  const esc = escenaActual();
  const stage = $('#stage');

  if (!mantenerSeleccion) deseleccionar();

  // Fondo + posición del avatar + variante "escena vacía"
  const conContenidoPrevio = Boolean(esc.dialogo.trim());
  stage.className = `stage bg-${esc.bg}` +
    (esc.posAvatar !== 'izquierda' ? ` avatar-${esc.posAvatar}` : '') +
    (conContenidoPrevio ? '' : ' sin-dialogo');

  // Tutor
  $('#stageAvatarUse').setAttribute('href', tutorActual().simbolo);
  $('#dialogSpeaker').textContent = tutorActual().nombre;

  // Diálogo (si no se está editando en este momento)
  const conContenido = Boolean(esc.dialogo.trim());
  if (!state.editandoDialogo) {
    const texto = $('#dialogText');
    if (texto) texto.textContent = esc.dialogo;
  }
  $('#dialogBtn').textContent = esc.boton;
  $('#dialogCard').style.display = conContenido ? '' : 'none';
  $('#stageEmpty').hidden = conContenido;

  // Chip con el título de la escena
  $('#sceneChip').textContent = `Escena ${state.escenaActiva + 1} · ${esc.nombre}`;

  if (mantenerSeleccion && state.seleccion) posicionarToolbar(state.seleccion);

  renderTimeline();
  actualizarContextoCopiloto();
}

/* ── Selección de elementos ── */

const elementoDe = (tipo) => ({
  avatar: $('#stageAvatar'),
  dialog: $('#dialogCard'),
  button: $('#dialogBtn'),
}[tipo]);

/* Acciones de la toolbar contextual según el elemento */
const ACCIONES_TOOLBAR = {
  dialog: [
    { etiqueta: '✏️ Editar texto', accion: () => iniciarEdicionDialogo() },
    { etiqueta: '🎙 Voz', accion: () => enfocarPropiedad('#propVoice') },
    { etiqueta: '✨ Mejorar con IA', accion: () => abrirCopiloto() },
  ],
  avatar: [
    { etiqueta: '🔄 Cambiar tutor', accion: () => { activarTab('tutores'); toast('Elige un tutor en el panel izquierdo', 'info'); } },
    { etiqueta: '📍 Posición', accion: () => enfocarPropiedad('.segmented button') },
  ],
  button: [
    { etiqueta: '✏️ Editar texto', accion: () => enfocarPropiedad('#propBtnLabel') },
    { etiqueta: '⚡ Acción', accion: () => enfocarPropiedad('#propBtnAction') },
  ],
};

function enfocarPropiedad(selector) {
  abrirPropiedades(state.seleccion);
  const campo = $('#propsBody') && $('#propsBody').querySelector(selector);
  if (campo) campo.focus();
}

function seleccionar(tipo) {
  state.seleccion = tipo;
  $$('.selectable').forEach((el) => el.classList.remove('selected'));
  const el = elementoDe(tipo);
  if (el) el.classList.add('selected');
  construirToolbar(tipo);
  abrirPropiedades(tipo);
  actualizarContextoCopiloto();
}

function deseleccionar() {
  state.seleccion = null;
  $$('.selectable').forEach((el) => el.classList.remove('selected'));
  $('#ctxToolbar').hidden = true;
  cerrarPropiedades();
  actualizarContextoCopiloto();
}

function construirToolbar(tipo) {
  const tb = $('#ctxToolbar');
  tb.innerHTML = '';
  (ACCIONES_TOOLBAR[tipo] || []).forEach((item, i, arr) => {
    const btn = document.createElement('button');
    btn.className = 'tb-btn';
    btn.textContent = item.etiqueta;
    btn.addEventListener('click', (e) => { e.stopPropagation(); item.accion(); });
    tb.appendChild(btn);
    if (i < arr.length - 1) {
      const sep = document.createElement('span');
      sep.className = 'tb-sep';
      tb.appendChild(sep);
    }
  });
  tb.hidden = false;
  posicionarToolbar(tipo);
}

/* Coloca la toolbar flotante justo encima del elemento seleccionado */
function posicionarToolbar(tipo) {
  const tb = $('#ctxToolbar');
  const objetivo = elementoDe(tipo);
  if (!objetivo || tb.hidden) return;
  const stage = $('#stage');
  const rStage = stage.getBoundingClientRect();
  const rEl = objetivo.getBoundingClientRect();

  tb.style.visibility = 'hidden';
  const w = tb.offsetWidth;
  const h = tb.offsetHeight;

  let left = rEl.left - rStage.left + rEl.width / 2 - w / 2;
  left = Math.max(8, Math.min(left, rStage.width - w - 8));
  let top = rEl.top - rStage.top - h - 10;
  if (top < 8) top = rEl.top - rStage.top + rEl.height + 10;

  tb.style.left = `${left}px`;
  tb.style.top = `${top}px`;
  tb.style.visibility = '';
}

/* Delegación de clics dentro del canvas */
$('#stage').addEventListener('click', (e) => {
  if (e.target.closest('.ctx-toolbar')) return;
  if (e.target.closest('.dialog-edit')) return;   // escribiendo en el textarea
  if (e.target.closest('#stageEmpty')) return;    // el estado vacío tiene su propio botón

  const el = e.target.closest('[data-el]');
  if (!el) { deseleccionar(); return; }

  const tipo = el.dataset.el;
  seleccionar(tipo);

  // Clic directo sobre el texto → edición inline inmediata
  if (tipo === 'dialog' && e.target.closest('#dialogText')) {
    iniciarEdicionDialogo();
  }
});

/* Clic en el fondo del área de canvas (fuera de la escena) deselecciona */
$('#canvasArea').addEventListener('click', (e) => {
  if (e.target === e.currentTarget || e.target.classList.contains('stage-wrap')) {
    deseleccionar();
  }
});

$('#btnEmptyAdd').addEventListener('click', () => {
  activarTab('interacciones');
  toast('Elige una interacción para esta escena', 'info');
});

/* ── Edición directa del texto del diálogo ── */

function iniciarEdicionDialogo() {
  if (state.editandoDialogo) return;
  const texto = $('#dialogText');
  if (!texto) return;
  state.editandoDialogo = true;

  const ta = document.createElement('textarea');
  ta.className = 'dialog-edit';
  ta.value = escenaActual().dialogo;
  ta.rows = 2;
  ta.setAttribute('aria-label', 'Editar texto del diálogo');
  texto.replaceWith(ta);

  const ajustar = () => {
    ta.style.height = 'auto';
    ta.style.height = `${ta.scrollHeight}px`;
    if (state.seleccion === 'dialog') posicionarToolbar('dialog');
  };
  ajustar();
  ta.focus();
  ta.setSelectionRange(ta.value.length, ta.value.length);
  ta.addEventListener('input', ajustar);

  let cancelado = false;
  ta.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') { cancelado = true; e.stopPropagation(); ta.blur(); }
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) ta.blur();
  });

  /* Al hacer clic fuera (blur): guarda y confirma en el header */
  ta.addEventListener('blur', () => {
    const esc = escenaActual();
    const nuevo = ta.value.trim();
    const cambio = !cancelado && nuevo && nuevo !== esc.dialogo;
    if (cambio) esc.dialogo = nuevo;

    const p = document.createElement('p');
    p.className = 'dialog-text';
    p.id = 'dialogText';
    p.title = 'Haz clic para editar el texto';
    p.textContent = esc.dialogo;
    ta.replaceWith(p);
    state.editandoDialogo = false;

    if (cambio) {
      marcarGuardado();
      toast('Cambios guardados');
      sincronizarTextoPropiedades();
      renderTimeline();
    }
    if (state.seleccion === 'dialog') posicionarToolbar('dialog');
  });
}

/* ══════════════════════════════════════════════════════════════════
   ZONA D · PANEL DE PROPIEDADES (se abre solo con selección)
   ══════════════════════════════════════════════════════════════════ */

const TITULOS_PROPS = {
  dialog: 'Diálogo',
  avatar: 'Tutor',
  button: 'Botón',
};

function abrirPropiedades(tipo) {
  if (!tipo) return;
  const panel = $('#propsPanel');
  panel.classList.add('open');
  panel.setAttribute('aria-hidden', 'false');
  $('#propsTitle').textContent = TITULOS_PROPS[tipo] || 'Propiedades';
  renderCuerpoPropiedades(tipo);
}

function cerrarPropiedades() {
  const panel = $('#propsPanel');
  panel.classList.remove('open');
  panel.setAttribute('aria-hidden', 'true');
}

$('#btnCloseProps').addEventListener('click', deseleccionar);

/* Acordeón "Configuración avanzada" (contenido dummy) */
$('#advToggle').addEventListener('click', () => {
  const abierto = $('#advToggle').getAttribute('aria-expanded') === 'true';
  $('#advToggle').setAttribute('aria-expanded', String(!abierto));
  $('#advContent').hidden = abierto;
});

/* Contenido del panel según el elemento seleccionado */
function renderCuerpoPropiedades(tipo) {
  const esc = escenaActual();
  const body = $('#propsBody');

  if (tipo === 'dialog') {
    body.innerHTML = `
      <label class="field"><span class="field-label">Texto del diálogo</span>
        <textarea id="propText"></textarea></label>
      <label class="field"><span class="field-label">Voz</span>
        <select id="propVoice">${VOCES.map((v) => `<option${v === esc.voz ? ' selected' : ''}>${v}</option>`).join('')}</select></label>
      <div class="field"><span class="field-label">Tono</span>
        <div class="segmented" id="propTone" role="group" aria-label="Tono del diálogo">
          ${['Cercano', 'Formal', 'Motivador'].map((t) =>
            `<button type="button" class="${t === esc.tono ? 'active' : ''}" data-tono="${t}">${t}</button>`).join('')}
        </div></div>`;

    const ta = body.querySelector('#propText');
    ta.value = esc.dialogo;
    ta.addEventListener('input', () => {
      esc.dialogo = ta.value;
      if (!state.editandoDialogo) {
        const texto = $('#dialogText');
        if (texto) texto.textContent = esc.dialogo;
      }
      marcarGuardado();
      renderTimeline();
    });
    body.querySelector('#propVoice').addEventListener('change', (e) => {
      esc.voz = e.target.value;
      marcarGuardado();
      toast('Voz actualizada');
    });
    body.querySelector('#propTone').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-tono]');
      if (!btn) return;
      esc.tono = btn.dataset.tono;
      body.querySelectorAll('#propTone button').forEach((b) => b.classList.toggle('active', b === btn));
      marcarGuardado();
    });
  }

  if (tipo === 'avatar') {
    body.innerHTML = `
      <div class="field"><span class="field-label">Tutor</span>
        <div class="props-tutor-grid">
          ${Object.entries(TUTORES).map(([clave, t]) => `
            <button type="button" class="props-tutor ${clave === esc.tutor ? 'active' : ''}" data-tutor="${clave}">
              <span class="avatar-thumb"><svg viewBox="32 28 96 96"><use href="${t.simbolo}" width="160" height="230"/></svg></span>
              <span class="props-tutor-name">${t.nombre}</span>
            </button>`).join('')}
        </div></div>
      <div class="field"><span class="field-label">Posición en la escena</span>
        <div class="segmented" id="propPos" role="group" aria-label="Posición del tutor">
          ${[['izquierda', 'Izquierda'], ['centro', 'Centro'], ['derecha', 'Derecha']].map(([v, l]) =>
            `<button type="button" class="${v === esc.posAvatar ? 'active' : ''}" data-pos="${v}">${l}</button>`).join('')}
        </div></div>`;

    body.querySelectorAll('.props-tutor').forEach((btn) => {
      btn.addEventListener('click', () => {
        esc.tutor = btn.dataset.tutor;
        renderEscena({ mantenerSeleccion: true });
        renderCuerpoPropiedades('avatar');
        marcarGuardado();
        toast(`${TUTORES[esc.tutor].nombre} ahora es el tutor de esta escena`);
      });
    });
    body.querySelector('#propPos').addEventListener('click', (e) => {
      const btn = e.target.closest('button[data-pos]');
      if (!btn) return;
      esc.posAvatar = btn.dataset.pos;
      renderEscena({ mantenerSeleccion: true });
      body.querySelectorAll('#propPos button').forEach((b) => b.classList.toggle('active', b === btn));
      marcarGuardado();
    });
  }

  if (tipo === 'button') {
    body.innerHTML = `
      <label class="field"><span class="field-label">Texto del botón</span>
        <input type="text" id="propBtnLabel" /></label>
      <label class="field"><span class="field-label">Acción al hacer clic</span>
        <select id="propBtnAction">
          ${['Ir a la siguiente escena', 'Ir a una escena específica…', 'Repetir la escena', 'Finalizar simulación']
            .map((a) => `<option${a === esc.accion ? ' selected' : ''}>${a}</option>`).join('')}
        </select></label>`;

    const inp = body.querySelector('#propBtnLabel');
    inp.value = esc.boton;
    inp.addEventListener('input', () => {
      esc.boton = inp.value || 'Continuar';
      $('#dialogBtn').textContent = esc.boton;
      if (state.seleccion === 'button') posicionarToolbar('button');
      marcarGuardado();
    });
    body.querySelector('#propBtnAction').addEventListener('change', (e) => {
      esc.accion = e.target.value;
      marcarGuardado();
    });
  }
}

/* Mantiene el textarea de propiedades al día tras editar en el canvas */
function sincronizarTextoPropiedades() {
  const ta = $('#propText');
  if (ta) ta.value = escenaActual().dialogo;
}

/* ══════════════════════════════════════════════════════════════════
   ZONA E · TIMELINE DE ESCENAS
   ══════════════════════════════════════════════════════════════════ */

function renderTimeline() {
  const cont = $('#timelineScroll');
  cont.innerHTML = '';

  state.escenas.forEach((esc, i) => {
    const estado = estadoEscena(esc);
    const card = document.createElement('button');
    card.className = `scene-card${i === state.escenaActiva ? ' active' : ''}`;
    card.dataset.scene = i;
    card.setAttribute('aria-label', `Escena ${i + 1}: ${esc.nombre}` +
      (estado === 'warn' ? ' (falta contenido)' : ' (completa)'));

    const thumb = document.createElement('span');
    thumb.className = `scene-thumb bg-${esc.bg}`;

    const nombre = document.createElement('span');
    nombre.className = 'scene-name';
    nombre.textContent = `${i + 1}. ${esc.nombre}`; // nombre completo, sin truncar

    const status = document.createElement('span');
    status.className = `scene-status ${estado}`;
    status.textContent = estado === 'ok' ? '✓' : '⚠';
    if (estado === 'warn') status.setAttribute('data-tip', 'Falta agregar contenido');

    card.append(thumb, nombre, status);
    card.addEventListener('click', () => {
      if (state.escenaActiva !== i) {
        state.escenaActiva = i;
        renderEscena();
      }
    });
    cont.appendChild(card);
  });
}

/* Agregar una escena nueva al final */
$('#btnAddScene').addEventListener('click', () => {
  state.escenas.push({
    nombre: 'Nueva escena', bg: 'bodega', tutor: 'jaime',
    dialogo: '', boton: 'Continuar', voz: VOCES[0], tono: 'Cercano',
    posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
  });
  state.escenaActiva = state.escenas.length - 1;
  renderEscena();
  $('#timelineScroll').scrollTo({ left: 99999, behavior: 'smooth' });
  marcarGuardado();
  toast('Escena agregada');
});

/* ══════════════════════════════════════════════════════════════════
   ✨ COPILOTO IA — único punto de entrada de IA
   ══════════════════════════════════════════════════════════════════ */

function abrirCopiloto() {
  $('#copilotPanel').hidden = false;
  $('#copilotFab').hidden = true;
  $('#copilotFab').setAttribute('aria-expanded', 'true');
  actualizarContextoCopiloto();
  $('#copilotInput').focus();
}

function cerrarCopiloto() {
  $('#copilotPanel').hidden = true;
  $('#copilotFab').hidden = false;
  $('#copilotFab').setAttribute('aria-expanded', 'false');
}

$('#copilotFab').addEventListener('click', abrirCopiloto);
$('#btnCloseCopilot').addEventListener('click', cerrarCopiloto);

/* El chip de contexto refleja la selección actual */
function actualizarContextoCopiloto() {
  const esc = escenaActual();
  let contexto = `Escena ${state.escenaActiva + 1} — ${esc.nombre}`;
  if (state.seleccion === 'dialog') contexto = `Diálogo de ${tutorActual().nombre}`;
  if (state.seleccion === 'avatar') contexto = `Tutor: ${tutorActual().nombre}`;
  if (state.seleccion === 'button') contexto = `Botón “${esc.boton}”`;
  $('#copilotContext').textContent = `Contexto: ${contexto}`;
}

function agregarMensaje(texto, quien) {
  const el = document.createElement('div');
  el.className = `msg ${quien}`;
  el.textContent = texto;
  $('#copilotMessages').appendChild(el);
  $('#copilotMessages').scrollTop = $('#copilotMessages').scrollHeight;
  return el;
}

/* Respuestas simuladas: sin jerga técnica, siempre en clave de acción */
function responderIA(pedido) {
  const p = pedido.toLowerCase();
  const esc = escenaActual();

  // 1) Reescribir el diálogo con tono motivador (cambia el canvas de verdad)
  if (p.includes('motivador') || p.includes('reescrib')) {
    if (esc.dialogo.trim()) {
      esc.dialogo = '¡Hola! Qué alegría tenerte aquí. Hoy la bodega es tuya: vas a liderar esta auditoría y sé que lo vas a hacer increíble. ¡Confía en tu ojo experto y vamos con todo! 💪';
      esc.tono = 'Motivador';
      renderEscena({ mantenerSeleccion: true });
      sincronizarTextoPropiedades();
      marcarGuardado();
      toast('Diálogo actualizado', 'ia');
    }
    return `¡Listo! Actualicé el diálogo de ${tutorActual().nombre}.`;
  }

  // 2) Generar imagen → aparece en Media con etiqueta "Nuevo"
  if (p.includes('imagen')) {
    const btn = document.createElement('button');
    btn.className = 'thumb-item media-item';
    btn.dataset.add = 'media';
    btn.dataset.name = 'Bodega generada';
    btn.innerHTML = '<span class="thumb m-img m1" aria-hidden="true"><span class="badge-new">NUEVO</span></span><span class="thumb-name">Bodega generada</span>';
    $('#mediaImagesGrid').prepend(btn);
    toast('Imagen generada y guardada en Media', 'ia');
    return '¡Listo! Generé una imagen de bodega y la dejé en Media → Imágenes, marcada como “Nuevo”.';
  }

  // 3) Crear escena de quiz → se agrega a la timeline
  if (p.includes('quiz') || p.includes('montacargas')) {
    state.escenas.push({
      nombre: 'Quiz: Montacargas', bg: 'bodega', tutor: esc.tutor,
      dialogo: 'Pregunta: antes de operar un montacargas, ¿qué es lo primero que debes verificar?',
      boton: 'Responder', voz: esc.voz, tono: 'Formal',
      posAvatar: 'izquierda', accion: 'Ir a la siguiente escena',
    });
    state.escenaActiva = state.escenas.length - 1;
    renderEscena();
    $('#timelineScroll').scrollTo({ left: 99999, behavior: 'smooth' });
    marcarGuardado();
    toast('Escena de quiz agregada', 'ia');
    return '¡Hecho! Creé la escena “Quiz: Montacargas” y la agregué al final de tu curso. Ya puedes ajustar la pregunta.';
  }

  // Respuesta genérica
  return '¡Listo! Apliqué los cambios en tu escena. Revísala y dime si quieres ajustar algo más.';
}

function enviarAlCopiloto(texto) {
  const limpio = texto.trim();
  if (!limpio) return;
  agregarMensaje(limpio, 'user');

  // Indicador "escribiendo…" y respuesta simulada tras 1 segundo
  const typing = document.createElement('div');
  typing.className = 'msg assistant typing';
  typing.innerHTML = '<i></i><i></i><i></i>';
  $('#copilotMessages').appendChild(typing);
  $('#copilotMessages').scrollTop = $('#copilotMessages').scrollHeight;

  setTimeout(() => {
    typing.remove();
    agregarMensaje(responderIA(limpio), 'assistant');
  }, 1000);
}

$('#copilotForm').addEventListener('submit', (e) => {
  e.preventDefault();
  const input = $('#copilotInput');
  enviarAlCopiloto(input.value);
  input.value = '';
  $('#copilotSend').disabled = true;
});

/* El botón de enviar solo se habilita con texto (estado disabled visible) */
$('#copilotInput').addEventListener('input', (e) => {
  $('#copilotSend').disabled = !e.target.value.trim();
});

/* Sugerencias rápidas */
$$('#copilotChips .chip').forEach((chip) => {
  chip.addEventListener('click', () => enviarAlCopiloto(chip.textContent));
});

/* ══════════════════════════════════════════════════════════════════
   VISTA PREVIA (recorre las escenas como las verá el participante)
   ══════════════════════════════════════════════════════════════════ */

let escenaPreview = 0;

function abrirVistaPrevia() {
  escenaPreview = state.escenaActiva;
  $('#previewOverlay').hidden = false;
  renderVistaPrevia();
}

function cerrarVistaPrevia() {
  $('#previewOverlay').hidden = true;
}

function renderVistaPrevia() {
  const esc = state.escenas[escenaPreview];
  const tutor = TUTORES[esc.tutor];
  $('#previewStage').className = `stage bg-${esc.bg}` +
    (esc.posAvatar !== 'izquierda' ? ` avatar-${esc.posAvatar}` : '');
  $('#previewAvatarUse').setAttribute('href', tutor.simbolo);
  $('#previewSpeaker').textContent = tutor.nombre;
  $('#previewText').textContent = esc.dialogo.trim() ||
    '(Esta escena aún no tiene contenido. Agrégalo desde el editor.)';
  $('#previewNext').textContent =
    escenaPreview === state.escenas.length - 1 ? 'Finalizar' : esc.boton;
  $('#previewCounter').textContent =
    `Escena ${escenaPreview + 1} de ${state.escenas.length}`;
}

$('#btnPreview').addEventListener('click', abrirVistaPrevia);
$('#btnClosePreview').addEventListener('click', cerrarVistaPrevia);
$('#previewNext').addEventListener('click', () => {
  if (escenaPreview < state.escenas.length - 1) {
    escenaPreview += 1;
    renderVistaPrevia();
  } else {
    cerrarVistaPrevia();
    toast('¡Completaste la vista previa! 🎉');
  }
});

/* ══════════════════════════════════════════════════════════════════
   ATAJOS GLOBALES + INICIALIZACIÓN
   ══════════════════════════════════════════════════════════════════ */

document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!$('#previewOverlay').hidden) { cerrarVistaPrevia(); return; }
  if (!$('#publishModal').hidden) { cerrarModalPublicar(); return; }
  if (!$('#copilotPanel').hidden) { cerrarCopiloto(); return; }
  if (state.seleccion) deseleccionar();
});

/* La toolbar sigue al elemento si cambia el tamaño de la ventana */
window.addEventListener('resize', () => {
  if (state.seleccion) posicionarToolbar(state.seleccion);
});

function iniciar() {
  dibujarQR();
  renderEscena();
  agregarMensaje(
    '¡Hola! Soy tu asistente. Puedo escribir guiones, crear imágenes o armar escenas nuevas por ti. ¿Qué necesitas?',
    'assistant'
  );
}

iniciar();
