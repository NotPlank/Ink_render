// ============================================================
// EDITOR DE IMÁGENES - STENCIL MAKER
// Sube fotos/dibujos, ajusta filtros con previsualización en
// vivo, y genera un PNG con líneas de contorno (negras/grises)
// y fondo transparente, listo para usar como stencil de tatuaje
// ============================================================

// --- Referencias del DOM ---
const inputImagenes = document.getElementById('input-imagenes');
const galeriaImagenes = document.getElementById('galeria-imagenes');
const modoEdicion = document.getElementById('modo-edicion');
const zonaSubida = document.getElementById('zona-subida');
const canvasPreview = document.getElementById('canvas-preview');
const canvasWrapper = document.getElementById('canvas-wrapper');
const ctxPreview = canvasPreview.getContext('2d');

const controlBrillo = document.getElementById('ajuste-brillo');
const controlContraste = document.getElementById('ajuste-contraste');
const controlNitidez = document.getElementById('ajuste-nitidez');
const controlSuavizado = document.getElementById('ajuste-suavizado');
const controlSensibilidad = document.getElementById('ajuste-sensibilidad');
const controlDetalle = document.getElementById('ajuste-detalle');
const controlGrosor = document.getElementById('ajuste-grosor');
const controlInvertir = document.getElementById('ajuste-invertir');

const todosLosControles = [
    controlBrillo, controlContraste, controlNitidez, controlSuavizado,
    controlSensibilidad, controlDetalle, controlGrosor
];

const btnGuardar = document.getElementById('btn-guardar');
const btnVolver = document.getElementById('btn-volver');
const btnReset = document.getElementById('btn-reset');
const btnFondo = document.getElementById('btn-fondo');
const btnZoomReset = document.getElementById('btn-zoom-reset');

// Valores por defecto, usados también por el botón "Restablecer"
const VALORES_POR_DEFECTO = {
    brillo: 0,
    contraste: 0,
    nitidez: 30,
    suavizado: 1,
    sensibilidad: 75,
    detalle: 20,
    grosor: 0,
    invertir: false
};

// Canvas oculto auxiliar donde reconstruimos la imagen original
// cada vez que cambia un ajuste (nunca se pinta en pantalla)
const canvasOriginal = document.createElement('canvas');
const ctxOriginal = canvasOriginal.getContext('2d', { willReadFrequently: true });

// Tamaño máximo de trabajo (resolución del procesado, no del CSS)
const TAMANIO_MAXIMO = 650;

// --- Estado ---
let galeria = [];       // { id, nombre, imgElement }
let imagenActualId = null;
let actualizacionPendiente = false;
let nivelZoom = 1;

// ============================================================
// 1. SUBIDA DE ARCHIVOS Y GALERÍA
// ============================================================

inputImagenes.addEventListener('change', (evento) => {
    const archivos = Array.from(evento.target.files);

    archivos.forEach((archivo) => {
        if (archivo.type !== 'image/jpeg' && archivo.type !== 'image/png') {
            console.warn(`"${archivo.name}" no es JPG ni PNG y se ha ignorado.`);
            return;
        }

        const lector = new FileReader();
        lector.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                const id = 'img_' + Date.now() + '_' + Math.random().toString(36).slice(2, 8);
                galeria.push({ id, nombre: archivo.name, imgElement: img });
                renderizarGaleria();
            };
            img.src = e.target.result;
        };
        lector.readAsDataURL(archivo);
    });

    evento.target.value = '';
});

function renderizarGaleria() {
    galeriaImagenes.innerHTML = '';

    galeria.forEach((item) => {
        const miniatura = document.createElement('div');
        miniatura.className = 'miniatura-galeria';
        miniatura.innerHTML = `
            <img class="miniatura-img" src="${item.imgElement.src}" alt="${item.nombre}">
            <span class="miniatura-nombre">${item.nombre}</span>
        `;
        miniatura.addEventListener('click', () => seleccionarImagen(item.id));
        galeriaImagenes.appendChild(miniatura);
    });
}

// ============================================================
// 2. ENTRAR / SALIR DEL MODO EDICIÓN
// ============================================================

function seleccionarImagen(id) {
    const item = galeria.find((i) => i.id === id);
    if (!item) return;

    imagenActualId = id;

    // Calculamos el tamaño de trabajo manteniendo la proporción
    const img = item.imgElement;
    let ancho = img.naturalWidth;
    let alto = img.naturalHeight;

    if (ancho > alto && ancho > TAMANIO_MAXIMO) {
        alto = Math.round((alto * TAMANIO_MAXIMO) / ancho);
        ancho = TAMANIO_MAXIMO;
    } else if (alto > TAMANIO_MAXIMO) {
        ancho = Math.round((ancho * TAMANIO_MAXIMO) / alto);
        alto = TAMANIO_MAXIMO;
    }

    canvasPreview.width = ancho;
    canvasPreview.height = alto;
    canvasOriginal.width = ancho;
    canvasOriginal.height = alto;

    restablecerAjustes(false);
    restablecerZoom();

    zonaSubida.classList.add('d-none');
    galeriaImagenes.classList.add('d-none');
    modoEdicion.classList.remove('d-none');

    generarStencil();
}

btnVolver.addEventListener('click', () => {
    modoEdicion.classList.add('d-none');
    zonaSubida.classList.remove('d-none');
    galeriaImagenes.classList.remove('d-none');
    imagenActualId = null;
});

// ============================================================
// 3. CONTROLES: recalcular en vivo al mover cualquier slider
// ============================================================

todosLosControles.forEach((control) => {
    control.addEventListener('input', () => {
        actualizarEtiquetas();
        solicitarActualizacion();
    });
});
controlInvertir.addEventListener('change', solicitarActualizacion);

function actualizarEtiquetas() {
    document.getElementById('valor-brillo').textContent = controlBrillo.value;
    document.getElementById('valor-contraste').textContent = controlContraste.value;
    document.getElementById('valor-nitidez').textContent = controlNitidez.value;
    document.getElementById('valor-suavizado').textContent = controlSuavizado.value;
    document.getElementById('valor-sensibilidad').textContent = controlSensibilidad.value;
    document.getElementById('valor-detalle').textContent = controlDetalle.value;
    document.getElementById('valor-grosor').textContent = controlGrosor.value;
}

// Evita recalcular decenas de veces por segundo mientras se
// arrastra un slider rápido: agrupa las peticiones en cada frame
function solicitarActualizacion() {
    if (actualizacionPendiente) return;
    actualizacionPendiente = true;
    requestAnimationFrame(() => {
        actualizacionPendiente = false;
        generarStencil();
    });
}

// Botón "Restablecer ajustes"
btnReset.addEventListener('click', () => {
    restablecerAjustes(true);
});

function restablecerAjustes(regenerar) {
    controlBrillo.value = VALORES_POR_DEFECTO.brillo;
    controlContraste.value = VALORES_POR_DEFECTO.contraste;
    controlNitidez.value = VALORES_POR_DEFECTO.nitidez;
    controlSuavizado.value = VALORES_POR_DEFECTO.suavizado;
    controlSensibilidad.value = VALORES_POR_DEFECTO.sensibilidad;
    controlDetalle.value = VALORES_POR_DEFECTO.detalle;
    controlGrosor.value = VALORES_POR_DEFECTO.grosor;
    controlInvertir.checked = VALORES_POR_DEFECTO.invertir;
    actualizarEtiquetas();
    if (regenerar) generarStencil();
}

// ============================================================
// 4. VISOR: fondo blanco/transparencia y zoom con rueda
// ============================================================

btnFondo.addEventListener('click', () => {
    canvasWrapper.classList.toggle('ver-transparencia');
    btnFondo.classList.toggle('activo');
});

canvasWrapper.addEventListener('wheel', (evento) => {
    evento.preventDefault();
    const paso = 0.15;
    nivelZoom += evento.deltaY < 0 ? paso : -paso;
    nivelZoom = Math.min(3, Math.max(0.4, nivelZoom));
    canvasPreview.style.transform = `scale(${nivelZoom})`;
}, { passive: false });

btnZoomReset.addEventListener('click', restablecerZoom);

function restablecerZoom() {
    nivelZoom = 1;
    canvasPreview.style.transform = 'scale(1)';
}

// ============================================================
// 5. PROCESAMIENTO DE IMAGEN (el "motor" del stencil)
// ============================================================

function clamp(valor) {
    return valor < 0 ? 0 : valor > 255 ? 255 : valor;
}

// Ajuste de brillo y contraste sobre los canales RGB
function aplicarBrilloContraste(data, brillo, contraste) {
    const factor = (259 * (contraste + 255)) / (255 * (259 - contraste));
    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(factor * (data[i] - 128) + 128 + brillo);
        data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brillo);
        data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brillo);
    }
}

// Escala de grises (luminosidad perceptual)
function aGrises(data) {
    for (let i = 0; i < data.length; i += 4) {
        const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gris;
    }
}

// Desenfoque simple (caja 3x3) repetido N veces sobre un array
// de píxeles (RGBA) - se usa tanto para reducir ruido como,
// aparte, como base para la nitidez (unsharp mask)
function desenfocarCanal(data, ancho, alto, iteraciones) {
    for (let it = 0; it < iteraciones; it++) {
        const copia = new Uint8ClampedArray(data);
        for (let y = 1; y < alto - 1; y++) {
            for (let x = 1; x < ancho - 1; x++) {
                const idx = (y * ancho + x) * 4;
                let suma = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const i2 = ((y + dy) * ancho + (x + dx)) * 4;
                        suma += copia[i2];
                    }
                }
                const promedio = suma / 9;
                data[idx] = data[idx + 1] = data[idx + 2] = promedio;
            }
        }
    }
}

// Nitidez (unsharp mask): compara la imagen con una versión
// desenfocada de sí misma y exagera la diferencia → bordes más
// marcados y definidos, líneas de contorno más finas y limpias
function aplicarNitidez(data, ancho, alto, cantidad) {
    if (cantidad <= 0) return;
    const suave = new Uint8ClampedArray(data);
    desenfocarCanal(suave, ancho, alto, 1);
    const factor = cantidad / 45;
    for (let i = 0; i < data.length; i += 4) {
        const valor = clamp(data[i] + (data[i] - suave[i]) * factor);
        data[i] = data[i + 1] = data[i + 2] = valor;
    }
}

// Detección de bordes con el operador Sobel: devuelve la
// magnitud del gradiente en cada píxel Y también su dirección
// (gx, gy), necesaria luego para adelgazar la línea al mínimo.
function sobel(data, ancho, alto) {
    const magnitudes = new Float32Array(ancho * alto);
    const direccionX = new Float32Array(ancho * alto);
    const direccionY = new Float32Array(ancho * alto);
    const gx = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const gy = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    for (let y = 1; y < alto - 1; y++) {
        for (let x = 1; x < ancho - 1; x++) {
            let sumaX = 0;
            let sumaY = 0;
            let k = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    const idx = ((y + dy) * ancho + (x + dx)) * 4;
                    const valor = data[idx];
                    sumaX += valor * gx[k];
                    sumaY += valor * gy[k];
                    k++;
                }
            }
            const i = y * ancho + x;
            magnitudes[i] = Math.sqrt(sumaX * sumaX + sumaY * sumaY);
            direccionX[i] = sumaX;
            direccionY[i] = sumaY;
        }
    }
    return { magnitudes, direccionX, direccionY };
}

// ADELGAZADO (non-maximum suppression): para cada píxel de
// borde, mira sus dos vecinos en la dirección perpendicular a
// la línea. Si no es el más fuerte de los tres, se descarta.
// Esto reduce cualquier borde "grueso" a un trazo de 1 píxel,
// que es la base para conseguir líneas finas y precisas.
function adelgazarLineas(magnitudes, direccionX, direccionY, ancho, alto) {
    const salida = new Float32Array(magnitudes.length);

    for (let y = 1; y < alto - 1; y++) {
        for (let x = 1; x < ancho - 1; x++) {
            const idx = y * ancho + x;
            const mag = magnitudes[idx];
            if (mag === 0) continue;

            let angulo = Math.atan2(direccionY[idx], direccionX[idx]) * (180 / Math.PI);
            if (angulo < 0) angulo += 180;

            let vecinoA, vecinoB;
            if (angulo < 22.5 || angulo >= 157.5) {
                vecinoA = magnitudes[idx - 1];
                vecinoB = magnitudes[idx + 1];
            } else if (angulo < 67.5) {
                vecinoA = magnitudes[idx - ancho + 1];
                vecinoB = magnitudes[idx + ancho - 1];
            } else if (angulo < 112.5) {
                vecinoA = magnitudes[idx - ancho];
                vecinoB = magnitudes[idx + ancho];
            } else {
                vecinoA = magnitudes[idx - ancho - 1];
                vecinoB = magnitudes[idx + ancho + 1];
            }

            salida[idx] = (mag >= vecinoA && mag >= vecinoB) ? mag : 0;
        }
    }
    return salida;
}

// DOBLE UMBRAL (estilo Canny): las líneas "importantes" son las
// que superan el umbral alto (sensibilidad) → van bien marcadas,
// opacas. Las líneas débiles solo se conservan (como guía tenue)
// si tocan directamente a una línea importante; si están
// sueltas, se consideran ruido y se descartan por completo. Esto
// es justo lo que da el efecto de "líneas mínimas, solo las que
// importan" en vez de rellenar la imagen de trazos sueltos.
function construirAlfaConDobleUmbral(magnitudesFinas, ancho, alto, sensibilidad, extraDetalle) {
    const umbralAlto = sensibilidad;
    const umbralBajo = Math.max(0, sensibilidad - extraDetalle);
    const alfa = new Uint8ClampedArray(magnitudesFinas.length);

    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            const idx = y * ancho + x;
            const mag = magnitudesFinas[idx];

            if (mag >= umbralAlto) {
                alfa[idx] = 255; // línea principal, bien marcada
            } else if (mag >= umbralBajo) {
                // línea débil: solo se conserva (tenue) si toca una línea fuerte
                let conectada = false;
                for (let dy = -1; dy <= 1 && !conectada; dy++) {
                    for (let dx = -1; dx <= 1 && !conectada; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const ny = y + dy;
                        const nx = x + dx;
                        if (ny < 0 || ny >= alto || nx < 0 || nx >= ancho) continue;
                        if (magnitudesFinas[ny * ancho + nx] >= umbralAlto) conectada = true;
                    }
                }
                alfa[idx] = conectada ? 150 : 0;
            } else {
                alfa[idx] = 0; // ruido, se descarta
            }
        }
    }
    return alfa;
}

// Engrosar las líneas de forma gradual: filtro de máximo local
// en 4 direcciones (no en diagonal), y trabajando sobre el canal
// alfa continuo en vez de una máscara binaria. Esto hace que
// cada paso de "grosor" sea un incremento fino y controlable,
// en vez de duplicar el grosor de golpe.
function engrosarAlfa(alfa, ancho, alto, iteraciones) {
    let actual = alfa;
    for (let it = 0; it < iteraciones; it++) {
        const nueva = new Uint8ClampedArray(actual.length);
        for (let y = 0; y < alto; y++) {
            for (let x = 0; x < ancho; x++) {
                const idx = y * ancho + x;
                let maximo = actual[idx];
                if (x > 0) maximo = Math.max(maximo, actual[idx - 1]);
                if (x < ancho - 1) maximo = Math.max(maximo, actual[idx + 1]);
                if (y > 0) maximo = Math.max(maximo, actual[idx - ancho]);
                if (y < alto - 1) maximo = Math.max(maximo, actual[idx + ancho]);
                nueva[idx] = maximo;
            }
        }
        actual = nueva;
    }
    return actual;
}

// Pipeline completo: de la imagen original a un PNG de líneas
// con fondo transparente, según los ajustes actuales del panel
function generarStencil() {
    const item = galeria.find((i) => i.id === imagenActualId);
    if (!item) return;

    const ancho = canvasPreview.width;
    const alto = canvasPreview.height;

    // 1. Redibujamos siempre desde la imagen original (nunca acumulamos filtros)
    ctxOriginal.clearRect(0, 0, ancho, alto);
    ctxOriginal.drawImage(item.imgElement, 0, 0, ancho, alto);
    const imageData = ctxOriginal.getImageData(0, 0, ancho, alto);
    const data = imageData.data;

    const brillo = parseInt(controlBrillo.value, 10);
    const contraste = parseInt(controlContraste.value, 10);
    const nitidez = parseInt(controlNitidez.value, 10);
    const suavizado = parseInt(controlSuavizado.value, 10);
    const sensibilidad = parseInt(controlSensibilidad.value, 10);
    const detalle = parseInt(controlDetalle.value, 10);
    const grosor = parseInt(controlGrosor.value, 10);
    const invertir = controlInvertir.checked;

    // 2. Brillo/contraste + escala de grises
    aplicarBrilloContraste(data, brillo, contraste);
    aGrises(data);

    // 3. Reducir ruido ANTES de afilar (si no, se afila también el ruido)
    if (suavizado > 0) desenfocarCanal(data, ancho, alto, suavizado);

    // 4. Nitidez: define y afina el trazo antes de buscar bordes
    aplicarNitidez(data, ancho, alto, nitidez);

    // 5. Detección de bordes (magnitud + dirección)
    const { magnitudes, direccionX, direccionY } = sobel(data, ancho, alto);

    // 6. Adelgazado: reduce cada borde a su trazo mínimo (1 píxel)
    const magnitudesFinas = adelgazarLineas(magnitudes, direccionX, direccionY, ancho, alto);

    // 7. Doble umbral: línea importante (opaca) vs. línea débil conectada
    // (tenue, solo si toca a una importante) vs. ruido (se descarta)
    let alfa = construirAlfaConDobleUmbral(magnitudesFinas, ancho, alto, sensibilidad, detalle);

    // 8. Grosor de línea, gradual (a partir de la línea ya adelgazada)
    if (grosor > 0) alfa = engrosarAlfa(alfa, ancho, alto, grosor);

    // 9. Construimos el PNG final: RGB del color de línea, alfa = intensidad de borde
    const salida = ctxPreview.createImageData(ancho, alto);
    const colorLinea = invertir ? 255 : 0;
    for (let i = 0; i < alfa.length; i++) {
        const idx = i * 4;
        salida.data[idx] = colorLinea;
        salida.data[idx + 1] = colorLinea;
        salida.data[idx + 2] = colorLinea;
        salida.data[idx + 3] = alfa[i];
    }

    ctxPreview.putImageData(salida, 0, 0);
}

// ============================================================
// 6. GUARDAR RESULTADO COMO PNG
// ============================================================

btnGuardar.addEventListener('click', () => {
    const item = galeria.find((i) => i.id === imagenActualId);
    const nombreBase = item ? item.nombre.replace(/\.[^/.]+$/, '') : 'stencil';

    canvasPreview.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = `${nombreBase}_stencil.png`;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        URL.revokeObjectURL(url);
    }, 'image/png');
});
