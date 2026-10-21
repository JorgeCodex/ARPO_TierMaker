// ============================================================================
// INTERNACIONALIZACIÓN (Español / Inglés)
// ============================================================================

const TRANSLATIONS = {
  es: {
    'menu.file': 'Archivo',
    'menu.edit': 'Editar',
    'menu.settings': 'Ajustes',
    'menu.interface': 'Interfaz',
    'menu.help': 'Ayuda',
    'menu.new': 'Nuevo',
    'menu.open': 'Abrir',
    'menu.close': 'Cerrar',
    'menu.save': 'Guardar',
    'menu.saveAs': 'Guardar como…',
    'menu.exportAs': 'Exportar como',
    'menu.import': 'Importar…',
    'menu.undo': 'Deshacer',
    'menu.redo': 'Rehacer',
    'menu.clearAll': 'Suprimir todo',
    'menu.autoAlign': 'Autoalinear',
    'menu.deleteChar': 'Eliminar personaje',
    'menu.view': 'Vista',
    'menu.centerView': 'Centrar vista',
    'menu.zoomIn': 'Acercar',
    'menu.zoomOut': 'Alejar',

    'tab.untitled': 'Sin título-{n}',
    'tab.new': 'Nuevo lienzo',
    'tab.close': 'Cerrar lienzo',
    'tab.unsaved': 'Cambios sin guardar',

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
    'char.delete': 'Eliminar personaje',
    'char.sendToPool': 'Enviar al banco',
    'char.unnamed': 'Sin nombre',

    'common.cancel': 'Cancelar',
    'common.save': 'Guardar',

'crop.title': 'Recortar Imagen',
'crop.format': 'Formato',
'crop.square': 'Cuadrado',
'crop.round': 'Redondo',
'crop.wide': '16:9',
'crop.standard': '4:3',
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
    'edge.deleteConnection': 'Eliminar conexión',
    'edge.reverse': 'Invertir dirección',
    'edge.close': 'Deseleccionar conexión',
    'edge.connect': 'Conectar con otro personaje',

    'settings.theme': 'Tema',
    'settings.themeLight': 'Claro',
    'settings.themeDark': 'Oscuro',
    'settings.language': 'Idioma',
    'settings.about': '¿Qué es A.R.P.O.?',
    'sc.toggleDrawer': 'Mostrar / Ocultar personajes',
    'settings.confirmDelete': 'Confirmar antes de eliminar',
    'settings.autoSave': 'Recuperación automática',
    'settings.includeNotes': 'Incluir notas en el export',
    'settings.exportScale': 'Escala de exportación',
    'settings.showNotes': 'Mostrar notas de las conexiones',
    'settings.lineWidth': 'Grosor de líneas',
'settings.nodeSize': 'Tamaño de personajes',
    'lineWidth.thin': 'Fino',
    'lineWidth.normal': 'Normal',
    'lineWidth.thick': 'Grueso',

    'unsaved.title': 'Cambios sin guardar',
    'unsaved.message': 'El lienzo actual tiene cambios sin guardar. ¿Quieres guardarlos antes de continuar?',
    'unsaved.dontSave': 'No guardar',

    'about.title': 'Árbol de Relaciones de Poder Objetivas',
    'about.rule1': '1. Si dos personajes están unidos por una línea <span class="kw green">VERDE</span>, el de arriba es <span class="kw green">claramente superior</span> (verdad objetiva).',
    'about.rule2': '2. Si dos personajes están unidos por una línea <span class="kw orange">NARANJA</span>, el de arriba es <span class="kw orange">probablemente superior</span> (subjetivo).',
    'about.rule3': '3. Si dos personajes están unidos por una línea <span class="kw blue">AZUL</span>, están <span class="kw blue">prácticamente igualados</span> en nivel de poder.',
    'about.rule4': '4. Si dos personajes están en alturas iguales o diferentes y <span class="kw red">NO</span> están unidos por líneas o sucesiones de líneas unidireccionales, su relación de poder es <span class="kw red">indeterminada</span> y abierta a la <span class="kw red">subjetividad</span>.',

    'toast.undone': 'Deshecho',
    'toast.redone': 'Rehecho',
    'toast.aligned': 'Personajes autoalineados',
    'toast.placed': '"{name}" colocado en el tablero',
    'toast.deleted': 'Personaje "{name}" eliminado',
    'toast.deletedMany': '{count} personajes eliminados',
    'toast.edgeCreated': 'Conexión creada',
    'toast.edgeDeleted': 'Conexión eliminada',
    'toast.edgeExists': 'Ya existe una conexión entre estos personajes',
    'toast.connectHint': 'Haz clic en el personaje de destino (Esc para cancelar)',
    'toast.noCanvasChars': 'No hay personajes en el lienzo',
    'toast.exportDone': 'Imagen exportada',
    'toast.exportErr': 'No se pudo exportar la imagen',
    'toast.noSelection': 'Selecciona un personaje primero',
    'toast.draftRestored': 'Se recuperó el trabajo sin guardar',
    'toast.newCanvas': 'Nuevo lienzo creado',
    'toast.closed': 'Lienzo cerrado',
    'toast.cleared': 'Todos los personajes volvieron a la barra',
    'toast.imported': '{count} personaje(s) importado(s) al banco',
    'toast.importErr': 'No se pudieron importar las imágenes',
    'toast.saved': 'Plantilla guardada',
    'toast.savedAs': 'Plantilla guardada como nuevo archivo',
    'toast.savedDownload': 'Plantilla descargada (tu navegador no permite sobrescribir)',
    'toast.openOk': 'Plantilla abierta',
    'toast.openErr': 'Archivo inválido',
    'toast.saveErr': 'No se pudo guardar la plantilla',
    'toast.needServer': 'Para sobrescribir el archivo, abre la app desde un servidor local (no con doble clic). Se descargó una copia.',
    'toast.browserNoSupport': '{browser} no permite sobrescribir archivos. Usa Chrome o Edge. Se descargó una copia.',

    'confirm.deleteChar': '¿Eliminar a "{name}" del tablero y del banco?',
    'confirm.deleteMultiple': '¿Eliminar los {count} personajes seleccionados del tablero y del banco?',
    'alert.charEmpty': 'Introduce algún dato o una imagen para el personaje.',
    'alert.invalidImage': 'Selecciona un archivo de imagen válido.',
    'alert.loadImage': 'No se pudo cargar la imagen.',
    'alert.cropImage': 'No se pudo recortar la imagen.',
    'alert.addImage': 'Error al agregar la imagen: '
  },
  en: {
    'menu.file': 'File',
    'menu.edit': 'Edit',
    'menu.settings': 'Settings',
    'menu.interface': 'Interface',
    'menu.help': 'Help',
    'menu.new': 'New',
    'menu.open': 'Open',
    'menu.close': 'Close',
    'menu.save': 'Save',
    'menu.saveAs': 'Save as…',
    'menu.exportAs': 'Export as',
    'menu.import': 'Import…',
    'menu.undo': 'Undo',
    'menu.redo': 'Redo',
    'menu.clearAll': 'Clear all',
    'menu.autoAlign': 'Auto-align',
    'menu.deleteChar': 'Delete character',
    'menu.view': 'View',
    'menu.centerView': 'Center view',
    'menu.zoomIn': 'Zoom in',
    'menu.zoomOut': 'Zoom out',

    'tab.untitled': 'Untitled-{n}',
    'tab.new': 'New canvas',
    'tab.close': 'Close canvas',
    'tab.unsaved': 'Unsaved changes',

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
    'char.delete': 'Delete character',
    'char.sendToPool': 'Send to bank',
    'char.unnamed': 'Unnamed',

    'common.cancel': 'Cancel',
    'common.save': 'Save',

'crop.title': 'Crop Image',
'crop.format': 'Format',
'crop.square': 'Square',
'crop.round': 'Round',
'crop.wide': '16:9',
'crop.standard': '4:3',
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
    'edge.deleteConnection': 'Delete connection',
    'edge.reverse': 'Reverse direction',
    'edge.close': 'Deselect connection',
    'edge.connect': 'Connect to another character',

    'settings.theme': 'Theme',
    'settings.themeLight': 'Light',
    'settings.themeDark': 'Dark',
    'settings.language': 'Language',
    'settings.about': 'What is A.R.P.O.?',
    'sc.toggleDrawer': 'Show / Hide characters',
    'settings.confirmDelete': 'Confirm before deleting',
    'settings.autoSave': 'Automatic recovery',
    'settings.includeNotes': 'Include notes in export',
    'settings.exportScale': 'Export scale',
    'settings.showNotes': 'Show connection notes',
    'settings.lineWidth': 'Line thickness',
'settings.nodeSize': 'Character size',
    'lineWidth.thin': 'Thin',
    'lineWidth.normal': 'Normal',
    'lineWidth.thick': 'Thick',

    'unsaved.title': 'Unsaved changes',
    'unsaved.message': 'The current canvas has unsaved changes. Do you want to save them before continuing?',
    'unsaved.dontSave': "Don't save",

    'about.title': 'Objective Power Relations Tree',
    'about.rule1': '1. If two characters are connected by a <span class="kw green">GREEN</span> line, the one above is <span class="kw green">clearly superior</span> (objective truth).',
    'about.rule2': '2. If two characters are connected by an <span class="kw orange">ORANGE</span> line, the one above is <span class="kw orange">probably superior</span> (subjective).',
    'about.rule3': '3. If two characters are connected by a <span class="kw blue">BLUE</span> line, they are <span class="kw blue">practically equal</span> in power level.',
    'about.rule4': '4. If two characters are at equal or different heights and are <span class="kw red">NOT</span> connected by lines or chains of unidirectional lines, their power relation is <span class="kw red">undetermined</span> and open to <span class="kw red">subjectivity</span>.',

    'toast.undone': 'Undone',
    'toast.redone': 'Redone',
    'toast.aligned': 'Characters auto-aligned',
    'toast.placed': '"{name}" placed on the board',
    'toast.deleted': 'Character "{name}" deleted',
    'toast.deletedMany': '{count} characters deleted',
    'toast.edgeCreated': 'Connection created',
    'toast.edgeDeleted': 'Connection deleted',
    'toast.edgeExists': 'A connection already exists between these characters',
    'toast.connectHint': 'Click the target character (Esc to cancel)',
    'toast.noCanvasChars': 'There are no characters on the canvas',
    'toast.exportDone': 'Image exported',
    'toast.exportErr': 'Could not export the image',
    'toast.noSelection': 'Select a character first',
    'toast.draftRestored': 'Unsaved work was recovered',
    'toast.newCanvas': 'New canvas created',
    'toast.closed': 'Canvas closed',
    'toast.cleared': 'All characters returned to the bar',
    'toast.imported': '{count} character(s) imported to the bank',
    'toast.importErr': 'Could not import the images',
    'toast.saved': 'Template saved',
    'toast.savedAs': 'Template saved as a new file',
    'toast.savedDownload': 'Template downloaded (your browser cannot overwrite)',
    'toast.openOk': 'Template opened',
    'toast.openErr': 'Invalid file',
    'toast.saveErr': 'Could not save the template',
    'toast.needServer': 'To overwrite the file, open the app from a local server (not by double-clicking). A copy was downloaded.',
    'toast.browserNoSupport': '{browser} cannot overwrite files. Use Chrome or Edge. A copy was downloaded.',

    'confirm.deleteChar': 'Delete "{name}" from the board and the bank?',
    'confirm.deleteMultiple': 'Delete the {count} selected characters from the board and the bank?',
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
  if (typeof updateTabBar === 'function') updateTabBar();
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
