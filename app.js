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
});

// ========== GPS ==========
function obtenerUbicacion() {
    const gpsStatus = document.getElementById('gps-status');
    
    if (!navigator.geolocation) {
        mostrarMensaje('Error', 'Tu navegador no soporta geolocalización');
        return;
    }

    gpsStatus.innerHTML = '🔄 Obteniendo ubicación...';
    gpsStatus.style.background = '#fff3cd';
    gpsStatus.style.borderLeftColor = '#ffc107';

    // Opciones mejoradas para GPS
    const opcionesGPS = {
        enableHighAccuracy: true,
        timeout: 30000, // 30 segundos
        maximumAge: 60000
    };

    navigator.geolocation.getCurrentPosition(
        function(position) {
            const lat = position.coords.latitude;
            const lon = position.coords.longitude;
            const precision = position.coords.accuracy;
            
            datosInspeccion.ubicacion = {
                lat: lat,
                lon: lon,
                precision: precision,
                timestamp: new Date().toISOString()
            };
            
            gpsStatus.innerHTML = `📍 Ubicación: ${lat.toFixed(6)}, ${lon.toFixed(6)} (Precisión: ${Math.round(precision)}m)`;
            gpsStatus.style.background = '#d4edda';
            gpsStatus.style.borderLeftColor = '#28a745';
            
            mostrarMensaje('Éxito', `Ubicación GPS obtenida correctamente\nPrecisión: ${Math.round(precision)} metros`);
        },
        function(error) {
            let mensaje = '';
            switch(error.code) {
                case error.PERMISSION_DENIED:
                    mensaje = 'Permiso de ubicación denegado. Por favor, permite el acceso a la ubicación en la configuración de tu navegador.';
                    break;
                case error.POSITION_UNAVAILABLE:
                    mensaje = 'Información de ubicación no disponible. Verifica tu conexión o GPS.';
                    break;
                case error.TIMEOUT:
                    mensaje = 'Tiempo de espera agotado. Intenta nuevamente.';
                    break;
                default:
                    mensaje = 'Error desconocido al obtener la ubicación.';
            }
            
            gpsStatus.innerHTML = '📍 Ubicación GPS: Error';
            gpsStatus.style.background = '#f8d7da';
            gpsStatus.style.borderLeftColor = '#dc3545';
            
            mostrarMensaje('Error GPS', mensaje);
        },
        opcionesGPS
    );
}

// ========== CÁMARA ==========
function tomarFoto() {
    // Verificar si el navegador soporta la cámara
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
        mostrarMensaje('Éxito', 'Foto tomada correctamente');
    };
    
    reader.onerror = function() {
        mostrarMensaje('Error', 'Error al procesar la foto');
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
        
        const img = document.createElement('img');
        img.src = foto.data;
        img.className = 'foto-miniatura';
        img.alt = `Foto ${index + 1}`;
        img.style.cursor = 'pointer';
        
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
        btnEliminar.onclick = function(e) {
            e.stopPropagation();
            eliminarFoto(index);
        };
        
        fotoContainer.appendChild(img);
        fotoContainer.appendChild(btnEliminar);
        galeria.appendChild(fotoContainer);
    });
}

function eliminarFoto(index) {
    datosInspeccion.fotos.splice(index, 1);
    actualizarGaleria();
    mostrarMensaje('Info', 'Foto eliminada');
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
        
        mostrarMensaje('Éxito', `✅ Inspección guardada correctamente\n📋 ID: ${datos.id}\n👤 Trabajador: ${datos.trabajador.nombre}`);
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
        ventana.onload = function() {
            setTimeout(() => {
                ventana.print();
                mostrarMensaje('Éxito', '📄 PDF generado correctamente\n\nUse la opción de imprimir y:\n• Seleccione "Guardar como PDF"\n• O envíe directamente a la impresora');
            }, 1000);
        };
        
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
                    ${datosInspeccion.ubicacion.gps ? 
                        `${datosInspeccion.ubicacion.gps.lat.toFixed(6)}, ${datosInspeccion.ubicacion.gps.lon.toFixed(6)} (Precisión: ${Math.round(datosInspeccion.ubicacion.gps.precision)}m)` : 
                        'No obtenida'}
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