// Datos globales de la inspección
let datosInspeccion = {
    fotos: [],
    ubicacion: null,
    respuestas: {},
    estados: {}
};

// Inicializar la aplicación
document.addEventListener('DOMContentLoaded', function() {
    console.log('🚀 Aplicación de Inspección iniciada');
    cargarDatosGuardados();
    verificarHTTPS();
});

// ========== VERIFICAR HTTPS ==========
function verificarHTTPS() {
    if (location.protocol !== 'https:' && location.hostname !== 'localhost' && location.hostname !== '127.0.0.1') {
        console.warn('⚠️ La app no está en HTTPS. El GPS puede no funcionar correctamente.');
    }
}

// ========== GPS MEJORADO ==========
function obtenerUbicacion() {
    const gpsStatus = document.getElementById('gps-status');
    
    if (!navigator.geolocation) {
        mostrarMensaje('Error', 'Tu navegador no soporta geolocalización');
        return;
    }

    gpsStatus.innerHTML = '🔄 Solicitando permiso de ubicación...';
    gpsStatus.style.background = '#fff3cd';
    gpsStatus.style.borderLeftColor = '#ffc107';

    // Opciones mejoradas para GPS
    const opcionesGPS = {
        enableHighAccuracy: true,
        timeout: 20000,
        maximumAge: 60000
    };

    // Usar Promise para mejor manejo
    new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, opcionesGPS);
    })
    .then((position) => {
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        const precision = position.coords.accuracy;
        
        datosInspeccion.ubicacion = {
            lat: lat,
            lon: lon,
            precision: precision,
            timestamp: new Date().toISOString()
        };
        
        gpsStatus.innerHTML = `📍 Ubicación: ${lat.toFixed(6)}, ${lon.toFixed(6)} (±${Math.round(precision)}m)`;
        gpsStatus.style.background = '#d4edda';
        gpsStatus.style.borderLeftColor = '#28a745';
        
        mostrarMensaje('Éxito', `✅ Ubicación obtenida correctamente\n\n📍 Coordenadas: ${lat.toFixed(6)}, ${lon.toFixed(6)}\n📏 Precisión: ${Math.round(precision)} metros`);
    })
    .catch((error) => {
        manejarErrorGPS(error);
    });
}

function manejarErrorGPS(error) {
    const gpsStatus = document.getElementById('gps-status');
    let mensaje = '';
    
    switch(error.code) {
        case error.PERMISSION_DENIED:
            mensaje = 'Permiso de ubicación denegado.';
            mostrarInstruccionesGPS();
            break;
        case error.POSITION_UNAVAILABLE:
            mensaje = 'Ubicación no disponible. Verifica que el GPS esté activado.';
            break;
        case error.TIMEOUT:
            mensaje = 'Tiempo de espera agotado. Intenta nuevamente.';
            break;
        default:
            mensaje = 'Error desconocido: ' + error.message;
    }
    
    gpsStatus.innerHTML = '📍 Ubicación GPS: Error';
    gpsStatus.style.background = '#f8d7da';
    gpsStatus.style.borderLeftColor = '#dc3545';
    
    if (error.code !== error.PERMISSION_DENIED) {
        mostrarMensaje('Error GPS', '❌ ' + mensaje);
    }
}

function mostrarInstruccionesGPS() {
    const esIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
    const esAndroid = /Android/i.test(navigator.userAgent);
    
    let instruccionesEspecificas = '';
    
    if (esAndroid) {
        instruccionesEspecificas = `
            <div style="background: #e3f2fd; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4>📱 En Chrome Android:</h4>
                <ol>
                    <li>Toca los <strong>3 puntos (⋮)</strong> arriba a la derecha</li>
                    <li>Ve a <strong>"Configuración"</strong></li>
                    <li>Selecciona <strong>"Configuración del sitio"</strong></li>
                    <li>Busca <strong>"Ubicación"</strong> y actívala</li>
                    <li>Vuelve a la app y recarga la página</li>
                </ol>
                <p><strong>También verifica:</strong></p>
                <ul>
                    <li>GPS activado en ajustes del dispositivo</li>
                    <li>Modo de alta precisión en ubicación</li>
                </ul>
            </div>
        `;
    } else if (esIOS) {
        instruccionesEspecificas = `
            <div style="background: #fff3cd; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4>📱 En Safari iOS:</h4>
                <ol>
                    <li>Ve a <strong>Ajustes del iPhone</strong></li>
                    <li>Desplázate y selecciona <strong>"Safari"</strong></li>
                    <li>Ve a <strong>"Configuración de sitios web"</strong></li>
                    <li>Selecciona <strong>"Ubicación"</strong></li>
                    <li>Cambia a <strong>"Preguntar"</strong> o <strong>"Permitir"</strong></li>
                </ol>
                <p><strong>También verifica:</strong></p>
                <ul>
                    <li>Servicios de ubicación activados</li>
                    <li>Safari tiene permiso para ubicación</li>
                </ul>
            </div>
        `;
    } else {
        instruccionesEspecificas = `
            <div style="background: #f8f9fa; padding: 15px; border-radius: 8px; margin: 10px 0;">
                <h4>🌐 En otros navegadores:</h4>
                <ol>
                    <li>Busca el icono de <strong>🔒 candado</strong> en la barra de direcciones</li>
                    <li>Haz click en <strong>"Permisos del sitio"</strong></li>
                    <li>Habilita el permiso de <strong>"Ubicación"</strong></li>
                    <li>Recarga la página</li>
                </ol>
            </div>
        `;
    }

    const instruccionesHTML = `
        <div style="text-align: left; padding: 10px;">
            <h3 style="color: #e74c3c;">🔧 Permiso de Ubicación Requerido</h3>
            <p>Para usar el GPS, necesitas permitir el acceso a tu ubicación.</p>
            
            ${instruccionesEspecificas}
            
            <div style="background: #d4edda; padding: 12px; border-radius: 8px; margin: 15px 0;">
                <h4>💡 Consejos importantes:</h4>
                <ul>
                    <li>Asegúrate de estar en un lugar con buena señal GPS</li>
                    <li>Verifica que los servicios de ubicación estén activados</li>
                    <li>Si usas WiFi, asegúrate de tener conexión a internet</li>
                </ul>
            </div>
            
            <div style="display: flex; gap: 10px; flex-wrap: wrap; margin-top: 20px;">
                <button onclick="reintentarGPS()" style="background: #3498db; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    🔄 Reintentar GPS
                </button>
                <button onclick="usarUbicacionManual()" style="background: #95a5a6; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    📝 Ubicación Manual
                </button>
                <button onclick="cerrarModal()" style="background: #e74c3c; color: white; border: none; padding: 12px 20px; border-radius: 8px; cursor: pointer; flex: 1; min-width: 120px;">
                    ❌ Cerrar
                </button>
            </div>
        </div>
    `;
    
    mostrarMensajeHTML('Permiso de Ubicación', instruccionesHTML);
}

function reintentarGPS() {
    cerrarModal();
    setTimeout(() => {
        obtenerUbicacion();
    }, 1000);
}

function usarUbicacionManual() {
    cerrarModal();
    
    const ubicacionManual = prompt(
        'Ingresa la ubicación manualmente:\n\nEjemplo: "Granja Montana - Zona Almacén" o "Galpón 5 - Área Norte"',
        datosInspeccion.ubicacion?.descripcion || ''
    );
    
    if (ubicacionManual && ubicacionManual.trim()) {
        datosInspeccion.ubicacion = {
            manual: true,
            descripcion: ubicacionManual.trim(),
            timestamp: new Date().toISOString()
        };
        
        const gpsStatus = document.getElementById('gps-status');
        gpsStatus.innerHTML = `📍 Ubicación Manual: ${ubicacionManual.trim()}`;
        gpsStatus.style.background = '#e3f2fd';
        gpsStatus.style.borderLeftColor = '#2196f3';
        
        mostrarMensaje('Éxito', '✅ Ubicación manual guardada correctamente');
    } else if (ubicacionManual !== null) {
        mostrarMensaje('Error', '❌ Debes ingresar una ubicación válida');
    }
}

// ========== CÁMARA ==========
function tomarFoto() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        // Fallback para navegadores que no soportan camera attribute
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = 'image/*';
        
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                procesarFoto(file);
            }
        };
        
        input.click();
        return;
    }

    // Intentar usar cámara directamente
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    
    // Solo agregar capture en dispositivos móviles
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        input.capture = 'environment'; // Cámara trasera
    }
    
    input.onchange = function(e) {
        const file = e.target.files[0];
        if (file) {
            procesarFoto(file);
        }
    };
    
    input.click();
}

function procesarFoto(file) {
    // Validar tamaño de archivo (máximo 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB en bytes
    if (file.size > maxSize) {
        mostrarMensaje('Error', '❌ La imagen es demasiado grande. Máximo 10MB permitido.');
        return;
    }

    const reader = new FileReader();
    
    reader.onload = function(e) {
        const fotoData = {
            id: Date.now(),
            data: e.target.result,
            nombre: `foto_${new Date().toISOString().replace(/[:.]/g, '-')}.jpg`,
            timestamp: new Date().toISOString(),
            descripcion: `Foto tomada el ${new Date().toLocaleString()}`
        };
        
        datosInspeccion.fotos.push(fotoData);
        actualizarGaleria();
        mostrarMensaje('Éxito', '✅ Foto tomada correctamente');
    };
    
    reader.onerror = function() {
        mostrarMensaje('Error', '❌ Error al procesar la foto');
    };
    
    reader.readAsDataURL(file);
}

function actualizarGaleria() {
    const galeria = document.getElementById('galeria-fotos');
    const contador = document.getElementById('contador-fotos');
    
    contador.textContent = `Fotos tomadas: ${datosInspeccion.fotos.length}`;
    galeria.innerHTML = '';
    
    datosInspeccion.fotos.forEach((foto, index) => {
        const fotoContainer = document.createElement('div');
        fotoContainer.className = 'foto-container';
        fotoContainer.style.position = 'relative';
        fotoContainer.style.display = 'inline-block';
        fotoContainer.style.margin = '5px';
        fotoContainer.style.textAlign = 'center';
        
        const img = document.createElement('img');
        img.src = foto.data;
        img.className = 'foto-miniatura';
        img.alt = `Foto ${index + 1}`;
        img.style.cursor = 'pointer';
        img.onclick = () => verFotoCompleta(foto.data);
        
        const numeroFoto = document.createElement('div');
        numeroFoto.textContent = `Foto ${index + 1}`;
        numeroFoto.style.fontSize = '12px';
        numeroFoto.style.marginTop = '5px';
        numeroFoto.style.color = '#666';
        
        // Botón para eliminar foto
        const btnEliminar = document.createElement('button');
        btnEliminar.innerHTML = '❌';
        btnEliminar.className = 'btn-eliminar-foto';
        btnEliminar.style.position = 'absolute';
        btnEliminar.style.top = '5px';
        btnEliminar.style.right = '5px';
        btnEliminar.style.background = 'rgba(255,0,0,0.7)';
        btnEliminar.style.border = 'none';
        btnEliminar.style.borderRadius = '50%';
        btnEliminar.style.width = '25px';
        btnEliminar.style.height = '25px';
        btnEliminar.style.cursor = 'pointer';
        btnEliminar.style.color = 'white';
        btnEliminar.style.fontSize = '12px';
        btnEliminar.onclick = function(e) {
            e.stopPropagation();
            eliminarFoto(index);
        };
        
        fotoContainer.appendChild(img);
        fotoContainer.appendChild(numeroFoto);
        fotoContainer.appendChild(btnEliminar);
        galeria.appendChild(fotoContainer);
    });
}

function verFotoCompleta(src) {
    const modalFoto = document.createElement('div');
    modalFoto.style.position = 'fixed';
    modalFoto.style.top = '0';
    modalFoto.style.left = '0';
    modalFoto.style.width = '100%';
    modalFoto.style.height = '100%';
    modalFoto.style.backgroundColor = 'rgba(0,0,0,0.9)';
    modalFoto.style.display = 'flex';
    modalFoto.style.justifyContent = 'center';
    modalFoto.style.alignItems = 'center';
    modalFoto.style.zIndex = '10000';
    
    const imgCompleta = document.createElement('img');
    imgCompleta.src = src;
    imgCompleta.style.maxWidth = '90%';
    imgCompleta.style.maxHeight = '90%';
    imgCompleta.style.borderRadius = '10px';
    
    const btnCerrar = document.createElement('button');
    btnCerrar.innerHTML = '✕';
    btnCerrar.style.position = 'absolute';
    btnCerrar.style.top = '20px';
    btnCerrar.style.right = '20px';
    btnCerrar.style.background = 'rgba(255,255,255,0.2)';
    btnCerrar.style.border = 'none';
    btnCerrar.style.borderRadius = '50%';
    btnCerrar.style.width = '40px';
    btnCerrar.style.height = '40px';
    btnCerrar.style.cursor = 'pointer';
    btnCerrar.style.color = 'white';
    btnCerrar.style.fontSize = '20px';
    btnCerrar.onclick = () => document.body.removeChild(modalFoto);
    
    modalFoto.appendChild(imgCompleta);
    modalFoto.appendChild(btnCerrar);
    modalFoto.onclick = (e) => {
        if (e.target === modalFoto) {
            document.body.removeChild(modalFoto);
        }
    };
    
    document.body.appendChild(modalFoto);
}

function eliminarFoto(index) {
    if (confirm('¿Estás seguro de que quieres eliminar esta foto?')) {
        datosInspeccion.fotos.splice(index, 1);
        actualizarGaleria();
        mostrarMensaje('Info', '🗑️ Foto eliminada');
    }
}

// ========== FORMULARIO ==========
function seleccionarRespuesta(boton, pregunta) {
    // Remover selección de otros botones del mismo grupo
    const grupo = boton.parentElement;
    grupo.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    
    // Seleccionar el botón clickeado
    boton.classList.add('seleccionado');
    
    // Guardar respuesta
    const respuesta = boton.classList.contains('btn-si') ? 'SI' : 'NO';
    datosInspeccion.respuestas[pregunta] = respuesta;
    
    console.log(`Respuesta guardada: ${pregunta} = ${respuesta}`);
}

function seleccionarEstado(boton, tipo) {
    // Remover selección de otros botones del mismo grupo
    const grupo = boton.parentElement;
    grupo.querySelectorAll('button').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    
    // Seleccionar el botón clickeado
    boton.classList.add('seleccionado');
    
    // Guardar estado
    const estado = boton.classList.contains('btn-bueno') ? 'BUENO' : 'MALO';
    datosInspeccion.estados[tipo] = estado;
    
    console.log(`Estado guardado: ${tipo} = ${estado}`);
}

// ========== GUARDAR INSPECCIÓN ==========
function guardarInspeccion() {
    if (!validarFormulario()) {
        return;
    }
    
    // Recopilar datos del formulario
    const datos = {
        id: `INS-${Date.now()}`,
        trabajador: {
            nombre: document.getElementById('nombre').value.trim(),
            cedula: document.getElementById('cedula').value.trim()
        },
        ubicacion: {
            granja: document.getElementById('granja').value,
            zona: document.getElementById('zona').value,
            actividad: document.getElementById('actividad').value,
            gps: datosInspeccion.ubicacion
        },
        evaluacion: {
            ...datosInspeccion.respuestas,
            estado_panetes: datosInspeccion.estados.panetes,
            estado_estructura: datosInspeccion.estados.estructura
        },
        novedades: document.getElementById('novedades').value.trim(),
        fotos: datosInspeccion.fotos,
        fecha: new Date().toISOString()
    };
    
    // Guardar en localStorage
    try {
        const inspecciones = JSON.parse(localStorage.getItem('inspecciones') || '[]');
        inspecciones.push(datos);
        localStorage.setItem('inspecciones', JSON.stringify(inspecciones));
        
        // Guardar datos actuales
        datosInspeccion = datos;
        
        mostrarMensaje('Éxito', `✅ Inspección guardada correctamente\n\n📋 ID: ${datos.id}\n👤 Trabajador: ${datos.trabajador.nombre}\n📅 Fecha: ${new Date().toLocaleString()}`);
        console.log('Inspección guardada:', datos);
    } catch (error) {
        mostrarMensaje('Error', '❌ Error al guardar la inspección: ' + error.message);
    }
}

function validarFormulario() {
    const campos = [
        { id: 'nombre', nombre: 'Nombre y apellidos' },
        { id: 'cedula', nombre: 'Cédula' },
        { id: 'granja', nombre: 'Granja' },
        { id: 'zona', nombre: 'Zona' },
        { id: 'actividad', nombre: 'Tipo de actividad' }
    ];
    
    const errores = [];
    
    // Validar campos obligatorios
    campos.forEach(campo => {
        const elemento = document.getElementById(campo.id);
        if (!elemento.value.trim()) {
            errores.push(campo.nombre);
            elemento.style.borderColor = '#dc3545';
            elemento.style.backgroundColor = '#f8d7da';
        } else {
            elemento.style.borderColor = '#28a745';
            elemento.style.backgroundColor = '#d4edda';
        }
    });
    
    // Validar respuestas
    const preguntasRequeridas = [
        'rev_muros', 
        'fisuras', 
        'asentamientos', 
        'humedad', 
        'materiales'
    ];
    
    const estadosRequeridos = ['panetes', 'estructura'];
    
    // Verificar preguntas SI/NO
    preguntasRequeridas.forEach(pregunta => {
        if (!datosInspeccion.respuestas[pregunta]) {
            errores.push(`Pregunta: "${obtenerTextoPregunta(pregunta)}"`);
        }
    });
    
    // Verificar estados BUENO/MALO
    estadosRequeridos.forEach(estado => {
        if (!datosInspeccion.estados[estado]) {
            errores.push(`Estado: "${obtenerTextoEstado(estado)}"`);
        }
    });
    
    if (errores.length > 0) {
        mostrarMensaje('Error', '❌ Complete los siguientes campos:\n• ' + errores.join('\n• '));
        return false;
    }
    
    return true;
}

function obtenerTextoPregunta(clave) {
    const preguntas = {
        'rev_muros': '¿SE REVISA EL ESTADO GENERAL DE LOS MUROS?',
        'fisuras': '¿SE IDENTIFICAN FISURAS EN LOS MUROS?',
        'asentamientos': '¿SE IDENTIFICAN ASENTAMIENTOS EN LOS MUROS?',
        'humedad': '¿SE IDENTIFICA HUMEDAD Y HONGOS EN LOS MUROS?',
        'materiales': '¿SE SOLICITAN MATERIALES AL AUXILIAR ADMINISTRATIVO?'
    };
    return preguntas[clave] || clave;
}

function obtenerTextoEstado(clave) {
    const estados = {
        'panetes': 'ESTADO DE LOS PAÑETES',
        'estructura': 'ESTADO DE LA ESTRUCTURA'
    };
    return estados[clave] || clave;
}

// ========== GENERAR PDF CON IMÁGENES ==========
function generarPDF() {
    if (!datosInspeccion.id) {
        mostrarMensaje('Error', '❌ Primero guarde la inspección');
        return;
    }
    
    try {
        // Crear contenido HTML para el PDF con imágenes
        const contenido = crearContenidoPDF();
        
        // Abrir en nueva ventana para imprimir/guardar como PDF
        const ventana = window.open('', '_blank');
        if (!ventana) {
            mostrarMensaje('Error', '❌ Permitir ventanas emergentes para generar el PDF');
            return;
        }
        
        ventana.document.write(contenido);
        ventana.document.close();
        
        // Esperar a que se carguen las imágenes
        setTimeout(() => {
            ventana.print();
            mostrarMensaje('Éxito', '📄 PDF generado correctamente\n\nUse la opción de imprimir y:\n• Seleccione "Guardar como PDF"\n• O envíe directamente a la impresora');
        }, 1000);
        
    } catch (error) {
        mostrarMensaje('Error', '❌ Error al generar PDF: ' + error.message);
    }
}

function crearContenidoPDF() {
    const fechaFormateada = new Date(datosInspeccion.fecha).toLocaleString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
    });
    
    // Crear HTML de las imágenes
    let htmlFotos = '';
    if (datosInspeccion.fotos.length > 0) {
        htmlFotos = `
            <div class="section">
                <h2>📷 REGISTRO FOTOGRÁFICO</h2>
                <div class="foto-info">Total de fotos: ${datosInspeccion.fotos.length}</div>
                <div class="galeria">
                    ${datosInspeccion.fotos.map((foto, index) => `
                        <div class="foto-container">
                            <div class="foto-info">Foto ${index + 1} - ${new Date(foto.timestamp).toLocaleString()}</div>
                            <img src="${foto.data}" class="foto" alt="Foto ${index + 1}">
                        </div>
                    `).join('')}
                </div>
            </div>
        `;
    }
    
    // Crear HTML de las respuestas
    let htmlEvaluacion = '';
    Object.entries(datosInspeccion.evaluacion).forEach(([pregunta, respuesta]) => {
        if (pregunta.includes('estado')) {
            const claseEstado = respuesta === 'BUENO' ? 'estado-bueno' : 'estado-malo';
            htmlEvaluacion += `<div class="valor"><span class="label">${obtenerTextoEstado(pregunta)}:</span> <span class="${claseEstado}">${respuesta}</span></div>`;
        } else {
            const claseRespuesta = respuesta === 'SI' ? 'respuesta-si' : 'respuesta-no';
            htmlEvaluacion += `<div class="valor"><span class="label">${obtenerTextoPregunta(pregunta)}:</span> <span class="${claseRespuesta}">${respuesta}</span></div>`;
        }
    });
    
    return `
        <!DOCTYPE html>
        <html>
        <head>
            <title>Inspección ${datosInspeccion.id}</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    margin: 20px; 
                    line-height: 1.6;
                    color: #333;
                }
                h1 { 
                    color: #2c3e50; 
                    border-bottom: 3px solid #3498db; 
                    padding-bottom: 10px;
                    text-align: center;
                    margin-bottom: 30px;
                }
                h2 { 
                    color: #34495e; 
                    margin-top: 25px;
                    border-left: 5px solid #3498db;
                    padding-left: 15px;
                    background: #f8f9fa;
                    padding: 12px;
                    border-radius: 0 8px 8px 0;
                }
                .section { 
                    margin-bottom: 25px;
                    border: 1px solid #e0e0e0;
                    padding: 20px;
                    border-radius: 8px;
                    background: white;
                }
                .label { 
                    font-weight: bold; 
                    color: #2c3e50;
                    display: inline-block;
                    width: 300px;
                    vertical-align: top;
                }
                .valor { 
                    margin-bottom: 12px;
                    padding: 8px 0;
                    border-bottom: 1px solid #f0f0f0;
                }
                .foto-container {
                    margin: 20px 0;
                    page-break-inside: avoid;
                }
                .foto {
                    max-width: 100%;
                    max-height: 300px;
                    border: 2px solid #ddd;
                    border-radius: 8px;
                    box-shadow: 0 4px 8px rgba(0,0,0,0.1);
                    display: block;
                    margin: 10px 0;
                }
                .foto-info {
                    font-size: 14px;
                    color: #666;
                    margin-bottom: 8px;
                    font-style: italic;
                }
                .galeria {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 20px;
                    margin-top: 15px;
                }
                .respuesta-si {
                    color: #27ae60;
                    font-weight: bold;
                    background: #d4edda;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid #c3e6cb;
                }
                .respuesta-no {
                    color: #e74c3c;
                    font-weight: bold;
                    background: #f8d7da;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid #f5c6cb;
                }
                .estado-bueno {
                    color: #27ae60;
                    font-weight: bold;
                    background: #d4edda;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid #c3e6cb;
                }
                .estado-malo {
                    color: #e74c3c;
                    font-weight: bold;
                    background: #f8d7da;
                    padding: 4px 12px;
                    border-radius: 20px;
                    border: 1px solid #f5c6cb;
                }
                .header-pdf {
                    text-align: center;
                    margin-bottom: 30px;
                    padding: 20px;
                    background: linear-gradient(135deg, #2c3e50, #34495e);
                    color: white;
                    border-radius: 10px;
                }
                .novedades {
                    background: #fff3cd;
                    padding: 15px;
                    border-radius: 8px;
                    border-left: 4px solid #ffc107;
                    white-space: pre-line;
                }
                @media print {
                    .foto {
                        max-width: 90%;
                        max-height: 250px;
                    }
                    .section {
                        page-break-inside: avoid;
                    }
                }
            </style>
        </head>
        <body>
            <div class="header-pdf">
                <h1>📋 INFORME DE INSPECCIÓN TÉCNICA</h1>
                <p><strong>Sistema Móvil de Inspección</strong> • ${fechaFormateada}</p>
            </div>
            
            <!-- Información del Trabajador -->
            <div class="section">
                <h2>👤 INFORMACIÓN DEL TRABAJADOR</h2>
                <div class="valor"><span class="label">Nombre completo:</span> ${datosInspeccion.trabajador.nombre}</div>
                <div class="valor"><span class="label">Número de cédula:</span> ${datosInspeccion.trabajador.cedula}</div>
                <div class="valor"><span class="label">ID de inspección:</span> <strong>${datosInspeccion.id}</strong></div>
                <div class="valor"><span class="label">Fecha y hora:</span> ${fechaFormateada}</div>
            </div>
            
            <!-- Ubicación de Trabajo -->
            <div class="section">
                <h2>📍 UBICACIÓN DE TRABAJO</h2>
                <div class="valor"><span class="label">Granja:</span> ${datosInspeccion.ubicacion.granja}</div>
                <div class="valor"><span class="label">Zona:</span> ${datosInspeccion.ubicacion.zona}</div>
                <div class="valor"><span class="label">Tipo de actividad:</span> ${datosInspeccion.ubicacion.actividad}</div>
                <div class="valor"><span class="label">Ubicación GPS:</span> 
                    ${datosInspeccion.ubicacion && datosInspeccion.ubicacion.manual ? 
                        datosInspeccion.ubicacion.descripcion :
                        (datosInspeccion.ubicacion && datosInspeccion.ubicacion.lat ? 
                            `${datosInspeccion.ubicacion.lat.toFixed(6)}, ${datosInspeccion.ubicacion.lon.toFixed(6)} (Precisión: ${Math.round(datosInspeccion.ubicacion.precision)}m)` : 
                            'No obtenida')}
                </div>
            </div>
            
            <!-- Evaluación Técnica -->
            <div class="section">
                <h2>🔍 EVALUACIÓN TÉCNICA</h2>
                ${htmlEvaluacion}
            </div>
            
            <!-- Novedades y Observaciones -->
            ${datosInspeccion.novedades ? `
            <div class="section">
                <h2>📝 OBSERVACIONES Y NOVEDADES</h2>
                <div class="novedades">${datosInspeccion.novedades}</div>
            </div>
            ` : ''}
            
            <!-- Fotos -->
            ${htmlFotos}
            
            <!-- Pie de página -->
            <div style="margin-top: 40px; padding-top: 20px; border-top: 2px solid #ecf0f1; text-align: center; color: #7f8c8d; font-size: 12px;">
                <p>Documento generado automáticamente por el Sistema Móvil de Inspección</p>
                <p>${new Date().toLocaleString('es-ES')}</p>
            </div>
        </body>
        </html>
    `;
}

// ========== UTILIDADES ==========
function limpiarFormulario() {
    if (!confirm('¿Está seguro de que desea limpiar todo el formulario? Se perderán todos los datos no guardados.')) {
        return;
    }
    
    // Limpiar inputs
    document.getElementById('nombre').value = '';
    document.getElementById('cedula').value = '';
    document.getElementById('granja').value = '';
    document.getElementById('zona').value = '';
    document.getElementById('actividad').value = '';
    document.getElementById('novedades').value = '';
    
    // Restablecer estilos de inputs
    const inputs = document.querySelectorAll('input, select, textarea');
    inputs.forEach(input => {
        input.style.borderColor = '#ecf0f1';
        input.style.backgroundColor = '';
    });
    
    // Limpiar GPS
    document.getElementById('gps-status').innerHTML = '📍 Ubicación GPS: No obtenida';
    document.getElementById('gps-status').style.background = '#e3f2fd';
    document.getElementById('gps-status').style.borderLeftColor = '#2196f3';
    
    // Limpiar botones de respuesta
    document.querySelectorAll('.btn-si, .btn-no, .btn-bueno, .btn-malo').forEach(btn => {
        btn.classList.remove('seleccionado');
    });
    
    // Limpiar fotos
    datosInspeccion.fotos = [];
    document.getElementById('galeria-fotos').innerHTML = '';
    document.getElementById('contador-fotos').textContent = 'Fotos tomadas: 0';
    
    // Limpiar datos
    datosInspeccion = {
        fotos: [],
        ubicacion: null,
        respuestas: {},
        estados: {}
    };
    
    mostrarMensaje('Info', '🔄 Formulario limpiado correctamente\n\n✅ Listo para nueva inspección');
}

function cargarDatosGuardados() {
    try {
        const inspecciones = JSON.parse(localStorage.getItem('inspecciones') || '[]');
        console.log(`📊 Inspecciones guardadas: ${inspecciones.length}`);
        
        if (inspecciones.length > 0) {
            console.log('Última inspección:', inspecciones[inspecciones.length - 1]);
        }
    } catch (error) {
        console.error('Error al cargar datos guardados:', error);
    }
}

function mostrarMensaje(titulo, mensaje) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-mensaje').textContent = mensaje;
    document.getElementById('modal').style.display = 'flex';
}

function mostrarMensajeHTML(titulo, contenidoHTML) {
    document.getElementById('modal-titulo').textContent = titulo;
    document.getElementById('modal-mensaje').innerHTML = contenidoHTML;
    document.getElementById('modal').style.display = 'flex';
}

function cerrarModal() {
    document.getElementById('modal').style.display = 'none';
}

// Cerrar modal al hacer click fuera
document.getElementById('modal').addEventListener('click', function(e) {
    if (e.target === this) {
        cerrarModal();
    }
});

// Prevenir envío del formulario
document.querySelector('form')?.addEventListener('submit', function(e) {
    e.preventDefault();
});

// Mejorar experiencia táctil en móviles
document.addEventListener('touchstart', function() {}, { passive: true });

// Detectar si es móvil y optimizar
if (/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
    document.body.classList.add('movil');
    
    // Optimizar para móviles
    const metas = document.querySelectorAll('input, textarea, select');
    metas.forEach(meta => {
        meta.addEventListener('focus', function() {
            setTimeout(() => {
                this.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }, 300);
        });
    });
}

console.log('✅ Aplicación cargada correctamente');
