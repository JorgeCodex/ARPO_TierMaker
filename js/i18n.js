// ============================================================================
// INTERNACIONALIZACIÓN (Español / Inglés)
// ============================================================================

const TRANSLATIONS = {
  es: {
    'header.undo': 'Deshacer',
    'header.redo': 'Rehacer',
    'header.save': 'Guardar',
    'header.saveMenu': 'Más opciones de guardado',
    'header.saveAs': 'Guardar como…',
    'header.open': 'Abrir',
    'header.jpg': 'Guardar como JPG',
    'header.settings': 'Ajustes',
    'header.autoLayout': 'Autoalinear por jerarquía',

    'drawer.characters': 'Personajes',
    'drawer.hint': 'Haz clic o arrastra al tablero',
    'drawer.addChar': 'Agregar personaje',
    'drawer.toggle': 'Mostrar / ocultar personajes',
    'drawer.empty': 'No hay personajes en el banco.',

    'pan.hint': 'Espacio + Arrastre para mover el canvas',

    'char.titleAdd': 'Añadir Nuevo Personaje',
    'char.titleEdit': 'Editar Personaje',
    'char.fields': 'Datos del Personaje',
    'char.addField': '+ Añadir campo',
    'char.image': 'Imagen',
    'char.imageEmpty': 'Sin imagen',
    'char.changeImage': 'Cambiar imagen',
    'char.adjustZoom': 'Ajustar zoom',
    'char.removeImage': 'Quitar imagen',
    'char.namePlaceholder': 'Nombre del personaje',
    'char.fieldPlaceholder': 'Campo adicional',
    'char.removeField': 'Quitar campo',

    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',

    'crop.title': 'Recortar Imagen',
    'crop.round': 'Redondo',
    'crop.zoomOut': 'Alejar',
    'crop.zoomIn': 'Acercar',
    'crop.hint': 'Arrastra para encuadrar · Rueda del ratón para zoom',
    'crop.accept': 'Aceptar',

    'edge.titleNew': 'Nueva Conexión',
    'edge.titleEdit': 'Editar Conexión',
    'edge.relation': 'Relación',
    'edge.green.name': 'Verde',
    'edge.green.desc': 'Superioridad 100% Objetiva',
    'edge.orange.name': 'Naranja',
    'edge.orange.desc': 'Superioridad Probable (Indicios)',
    'edge.blue.name': 'Azul',
    'edge.blue.desc': 'Empate / Igualdad de Poder',
    'edge.purple.name': 'Morado',
    'edge.purple.desc': 'Indeterminada (Regla 4)',
    'edge.note': 'Nota (opcional)',
    'edge.notePlaceholder': 'Ej. Saga de Majin Buu',
    'edge.delete': 'Eliminar',

    'settings.title': 'Ajustes',
    'settings.theme': 'Tema',
    'settings.themeLight': 'Claro',
    'settings.themeDark': 'Oscuro',
    'settings.language': 'Idioma',
    'settings.about': '¿Qué es A.R.P.O.?',
    'settings.shortcuts': 'Atajos de teclado',

    'about.title': 'Árbol de Relaciones de Poder Objetivas',
    'about.rule1': '1. Si dos personajes están unidos por una línea <span class="kw green">VERDE</span>, el de arriba es <span class="kw green">claramente superior</span> (verdad objetiva).',
    'about.rule2': '2. Si dos personajes están unidos por una línea <span class="kw orange">NARANJA</span>, el de arriba es <span class="kw orange">probablemente superior</span> (subjetivo).',
    'about.rule3': '3. Si dos personajes están unidos por una línea <span class="kw blue">AZUL</span>, están <span class="kw blue">prácticamente igualados</span> en nivel de poder.',
    'about.rule4': '4. Si dos personajes están en alturas iguales o diferentes y <span class="kw red">NO</span> están unidos por líneas o sucesiones de líneas unidireccionales, su relación de poder es <span class="kw red">indeterminada</span> y abierta a la <span class="kw red">subjetividad</span>.',

    'sc.undo': 'Deshacer',
    'sc.redo': 'Rehacer',
    'sc.save': 'Guardar',
    'sc.open': 'Abrir',
    'sc.settings': 'Abrir ajustes',
    'sc.toggleDrawer': 'Mostrar/ocultar personajes',
    'sc.theme': 'Cambiar tema',
    'sc.delete': 'Eliminar personaje',
    'sc.centerView': 'Centrar vista',
    'sc.pan': 'Mover el lienzo',
    'sc.zoom': 'Zoom',
    'sc.escape': 'Cerrar / deseleccionar',

    'toast.undone': 'Deshecho',
    'toast.redone': 'Rehecho',
    'toast.aligned': 'Personajes autoalineados',
    'toast.placed': '"{name}" colocado en el tablero',
    'toast.deleted': 'Personaje "{name}" eliminado',
    'toast.edgeCreated': 'Conexión creada',
    'toast.edgeDeleted': 'Conexión eliminada',
    'toast.edgeExists': 'Ya existe una conexión entre estos personajes',
    'toast.noCanvasChars': 'No hay personajes en el lienzo',
    'toast.jpgDone': 'Imagen JPG generada',
    'toast.jpgErr': 'No se pudo generar la imagen',
    'toast.saved': 'Plantilla guardada',
    'toast.savedAs': 'Plantilla guardada como nuevo archivo',
    'toast.savedDownload': 'Plantilla descargada (tu navegador no permite sobrescribir)',
    'toast.openOk': 'Plantilla abierta',
    'toast.openErr': 'Archivo inválido',
    'toast.saveErr': 'No se pudo guardar la plantilla',
    'toast.needServer': 'Para sobrescribir el archivo, abre la app desde un servidor local (no con doble clic). Se descargó una copia.',
    'toast.browserNoSupport': '{browser} no permite sobrescribir archivos. Usa Chrome o Edge. Se descargó una copia.',

    'confirm.deleteChar': '¿Eliminar a "{name}" del tablero y del banco?',
    'alert.charEmpty': 'Introduce algún dato o una imagen para el personaje.',
    'alert.invalidImage': 'Selecciona un archivo de imagen válido.',
    'alert.loadImage': 'No se pudo cargar la imagen.',
    'alert.cropImage': 'No se pudo recortar la imagen.',
    'alert.addImage': 'Error al agregar la imagen: '
  },
  en: {
    'header.undo': 'Undo',
    'header.redo': 'Redo',
    'header.save': 'Save',
    'header.saveMenu': 'More save options',
    'header.saveAs': 'Save as…',
    'header.open': 'Open',
    'header.jpg': 'Save as JPG',
    'header.settings': 'Settings',
    'header.autoLayout': 'Auto-align by hierarchy',

    'drawer.characters': 'Characters',
    'drawer.hint': 'Click or drag to the board',
    'drawer.addChar': 'Add character',
    'drawer.toggle': 'Show / hide characters',
    'drawer.empty': 'No characters in the bank.',

    'pan.hint': 'Space + Drag to move the canvas',

    'char.titleAdd': 'Add New Character',
    'char.titleEdit': 'Edit Character',
    'char.fields': 'Character Data',
    'char.addField': '+ Add field',
    'char.image': 'Image',
    'char.imageEmpty': 'No image',
    'char.changeImage': 'Change image',
    'char.adjustZoom': 'Adjust zoom',
    'char.removeImage': 'Remove image',
    'char.namePlaceholder': 'Character name',
    'char.fieldPlaceholder': 'Extra field',
    'char.removeField': 'Remove field',

    'common.cancel': 'Cancel',
    'common.save': 'Save',

    'crop.title': 'Crop Image',
    'crop.round': 'Round',
    'crop.zoomOut': 'Zoom out',
    'crop.zoomIn': 'Zoom in',
    'crop.hint': 'Drag to frame · Mouse wheel to zoom',
    'crop.accept': 'Accept',

    'edge.titleNew': 'New Connection',
    'edge.titleEdit': 'Edit Connection',
    'edge.relation': 'Relationship',
    'edge.green.name': 'Green',
    'edge.green.desc': '100% Objective Superiority',
    'edge.orange.name': 'Orange',
    'edge.orange.desc': 'Probable Superiority (Hints)',
    'edge.blue.name': 'Blue',
    'edge.blue.desc': 'Tie / Equal Power',
    'edge.purple.name': 'Purple',
    'edge.purple.desc': 'Indeterminate (Rule 4)',
    'edge.note': 'Note (optional)',
    'edge.notePlaceholder': 'E.g. Majin Buu Saga',
    'edge.delete': 'Delete',

    'settings.title': 'Settings',
    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.language': 'Language',
    'settings.about': 'What is A.R.P.O.?',
    'settings.shortcuts': 'Keyboard shortcuts',

    'about.title': 'Objective Power Relations Tree',
    'about.rule1': '1. If two characters are connected by a <span class="kw green">GREEN</span> line, the one above is <span class="kw green">clearly superior</span> (objective truth).',
    'about.rule2': '2. If two characters are connected by an <span class="kw orange">ORANGE</span> line, the one above is <span class="kw orange">probably superior</span> (subjective).',
    'about.rule3': '3. If two characters are connected by a <span class="kw blue">BLUE</span> line, they are <span class="kw blue">practically equal</span> in power level.',
    'about.rule4': '4. If two characters are at equal or different heights and are <span class="kw red">NOT</span> connected by lines or chains of unidirectional lines, their power relation is <span class="kw red">undetermined</span> and open to <span class="kw red">subjectivity</span>.',

    'sc.undo': 'Undo',
    'sc.redo': 'Redo',
    'sc.save': 'Save',
    'sc.open': 'Open',
    'sc.settings': 'Open settings',
    'sc.toggleDrawer': 'Toggle characters',
    'sc.theme': 'Toggle theme',
    'sc.delete': 'Delete character',
    'sc.centerView': 'Center view',
    'sc.pan': 'Move the canvas',
    'sc.zoom': 'Zoom',
    'sc.escape': 'Close / deselect',

    'toast.undone': 'Undone',
    'toast.redone': 'Redone',
    'toast.aligned': 'Characters auto-aligned',
    'toast.placed': '"{name}" placed on the board',
    'toast.deleted': 'Character "{name}" deleted',
    'toast.edgeCreated': 'Connection created',
    'toast.edgeDeleted': 'Connection deleted',
    'toast.edgeExists': 'A connection already exists between these characters',
    'toast.noCanvasChars': 'There are no characters on the canvas',
    'toast.jpgDone': 'JPG image generated',
    'toast.jpgErr': 'Could not generate the image',
    'toast.saved': 'Template saved',
    'toast.savedAs': 'Template saved as a new file',
    'toast.savedDownload': 'Template downloaded (your browser cannot overwrite)',
    'toast.openOk': 'Template opened',
    'toast.openErr': 'Invalid file',
    'toast.saveErr': 'Could not save the template',
    'toast.needServer': 'To overwrite the file, open the app from a local server (not by double-clicking). A copy was downloaded.',
    'toast.browserNoSupport': '{browser} cannot overwrite files. Use Chrome or Edge. A copy was downloaded.',

    'confirm.deleteChar': 'Delete "{name}" from the board and the bank?',
    'alert.charEmpty': 'Enter some data or an image for the character.',
    'alert.invalidImage': 'Select a valid image file.',
    'alert.loadImage': 'Could not load the image.',
    'alert.cropImage': 'Could not crop the image.',
    'alert.addImage': 'Error adding the image: '
  }
};

let currentLang = 'es';

function t(key, params) {
  const dict = TRANSLATIONS[currentLang] || TRANSLATIONS.es;
  let value = dict[key] || TRANSLATIONS.es[key] || key;
  if (params) {
    Object.keys(params).forEach(k => {
      value = value.replace('{' + k + '}', params[k]);
    });
  }
  return value;
}

function applyTranslations() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.dataset.i18n);
  });
  document.querySelectorAll('[data-i18n-html]').forEach(el => {
    el.innerHTML = t(el.dataset.i18nHtml);
  });
  document.querySelectorAll('[data-i18n-title]').forEach(el => {
    el.title = t(el.dataset.i18nTitle);
  });
  document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
    el.placeholder = t(el.dataset.i18nPlaceholder);
  });
  document.documentElement.lang = currentLang;
}

function setLang(lang) {
  currentLang = (lang === 'en') ? 'en' : 'es';
  try {
    localStorage.setItem('arpo-lang', currentLang);
  } catch (e) {
    // localStorage no disponible
  }
  applyTranslations();
  if (typeof updateLanguageButtons === 'function') updateLanguageButtons();
  if (typeof render === 'function') render();
}

function getLang() {
  return currentLang;
}

function initLang() {
  let saved = null;
  try {
    saved = localStorage.getItem('arpo-lang');
  } catch (e) {
    // localStorage no disponible
  }
  currentLang = (saved === 'en') ? 'en' : 'es';
  applyTranslations();
}

initLang();
