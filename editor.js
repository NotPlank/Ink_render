// -----------STENCIL----------- // 

const inputImagenes = document.getElementById('input-imagenes');
const galeriaImagenes = document.getElementById('galeria-imagenes'); // ya no existe en el HTML, queda null a propósito
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
const controlSuavizarLinea = document.getElementById('ajuste-suavizar-linea');
const controlInvertir = document.getElementById('ajuste-invertir');
const controlColorFondo = document.getElementById('ajuste-color-fondo');
const controlTolerancia = document.getElementById('ajuste-tolerancia');
const controlNitidezDibujo = document.getElementById('ajuste-nitidez-dibujo');

const grupoAjustesFoto = document.getElementById('grupo-ajustes-foto');
const grupoAjustesDibujo = document.getElementById('grupo-ajustes-dibujo');

const controlesFoto = [
    controlBrillo, controlContraste, controlNitidez, controlSuavizado,
    controlSensibilidad, controlDetalle, controlGrosor
];
const controlesDibujo = [
    controlBrillo, controlContraste, controlColorFondo, controlTolerancia, controlGrosor
];

const todosLosControles = [
    controlBrillo, controlContraste, controlNitidez, controlSuavizado,
    controlSensibilidad, controlDetalle, controlGrosor, controlSuavizarLinea,
    controlColorFondo, controlTolerancia, controlNitidezDibujo
];

const btnGuardar = document.getElementById('btn-guardar');
const btnVolver = document.getElementById('btn-volver');
const btnReset = document.getElementById('btn-reset');
const btnFondo = document.getElementById('btn-fondo');
const btnZoomReset = document.getElementById('btn-zoom-reset');
const listaSubidasPanel = document.getElementById('lista-subidas-panel');
const listaStencilsGuardados = document.getElementById('lista-stencils-guardados');
const VALORES_POR_DEFECTO = {
    brillo: 0,
    contraste: 0,
    nitidez: 30,
    suavizado: 1,
    sensibilidad: 75,
    detalle: 20,
    grosor: 0,
    suavizarLinea: 0,
    invertir: false,
    colorFondo: '#ffffff',
    tolerancia: 40,
    nitidezDibujo: 20
};
const canvasOriginal = document.createElement('canvas');
const ctxOriginal = canvasOriginal.getContext('2d', { willReadFrequently: true });
const TAMANIO_MAXIMO = 650;
let galeria = [];     
let imagenActualId = null;
let actualizacionPendiente = false;
let nivelZoom = 1;

//  SUBIDA DE ARCHIVOS Y GALERÍA

function modoSeleccionadoActual() {
    const radio = document.querySelector('input[name="modo-stencil"]:checked');
    return radio ? radio.value : 'foto';
}

inputImagenes.addEventListener('change', (evento) => {
    const archivos = Array.from(evento.target.files);
    const modo = modoSeleccionadoActual();

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
                galeria.push({ id, nombre: archivo.name, imgElement: img, modo });
                renderizarGaleria();
            };
            img.src = e.target.result;
        };
        lector.readAsDataURL(archivo);
    });

    evento.target.value = '';
});

function renderizarGaleria() {
    if (listaSubidasPanel) listaSubidasPanel.innerHTML = '';

    galeria.forEach((item) => {
        const iconoModo = item.modo === 'dibujo' ? '✏️' : '📷';

        if (listaSubidasPanel) {
            const miniaturaPanel = document.createElement('div');
            miniaturaPanel.className = 'stencil-thumb';
            miniaturaPanel.title = `${iconoModo} ${item.nombre}`;
            miniaturaPanel.innerHTML = `<img src="${item.imgElement.src}" alt="${item.nombre}">`;
            miniaturaPanel.addEventListener('click', () => seleccionarImagen(item.id));
            listaSubidasPanel.appendChild(miniaturaPanel);
        }
    });
}

//  ENTRAR / SALIR DEL MODO EDICIÓN

function seleccionarImagen(id) {
    const item = galeria.find((i) => i.id === id);
    if (!item) return;

    imagenActualId = id;
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
    const esDibujo = item.modo === 'dibujo';
    grupoAjustesFoto.classList.toggle('d-none', esDibujo);
    grupoAjustesDibujo.classList.toggle('d-none', !esDibujo);

    restablecerAjustes(false);
    restablecerZoom();

    zonaSubida.classList.add('d-none');
    if (galeriaImagenes) galeriaImagenes.classList.add('d-none');
    modoEdicion.classList.remove('d-none');

    generarStencil();
}

btnVolver.addEventListener('click', () => {
    modoEdicion.classList.add('d-none');
    zonaSubida.classList.remove('d-none');
    if (galeriaImagenes) galeriaImagenes.classList.remove('d-none');
    imagenActualId = null;
});

//  CONTROLES

todosLosControles.forEach((control) => {
    control.addEventListener('input', () => {
        actualizarEtiquetas();
        solicitarActualizacion();
    });
});
controlInvertir.addEventListener('change', solicitarActualizacion);

// El selector de "Color de fondo" abre el cuentagotas del propio
// navegador/sistema, que puede coger un color de cualquier parte de
// la pantalla — incluido el canvas. Pero si el canvas está mostrando
// el resultado ya procesado (líneas + transparencia), el cuentagotas
// cogería ese color equivocado. Mientras el selector está abierto,
// mostramos la imagen original sin procesar; en cuanto se elige un
// color, el listener de 'input' de arriba ya se encarga de regenerar
// el resultado normalmente.
controlColorFondo.addEventListener('focus', () => {
    const item = galeria.find((i) => i.id === imagenActualId);
    if (!item) return;
    ctxPreview.clearRect(0, 0, canvasPreview.width, canvasPreview.height);
    ctxPreview.drawImage(item.imgElement, 0, 0, canvasPreview.width, canvasPreview.height);
});

function actualizarEtiquetas() {
    document.getElementById('valor-brillo').textContent = controlBrillo.value;
    document.getElementById('valor-contraste').textContent = controlContraste.value;
    document.getElementById('valor-nitidez').textContent = controlNitidez.value;
    document.getElementById('valor-suavizado').textContent = controlSuavizado.value;
    document.getElementById('valor-sensibilidad').textContent = controlSensibilidad.value;
    document.getElementById('valor-detalle').textContent = controlDetalle.value;
    document.getElementById('valor-grosor').textContent = controlGrosor.value;
    document.getElementById('valor-suavizar-linea').textContent = controlSuavizarLinea.value;
    document.getElementById('valor-tolerancia').textContent = controlTolerancia.value;
    document.getElementById('valor-nitidez-dibujo').textContent = controlNitidezDibujo.value;
}
function solicitarActualizacion() {
    if (actualizacionPendiente) return;
    actualizacionPendiente = true;
    requestAnimationFrame(() => {
        actualizacionPendiente = false;
        generarStencil();
    });
}

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
    controlSuavizarLinea.value = VALORES_POR_DEFECTO.suavizarLinea;
    controlInvertir.checked = VALORES_POR_DEFECTO.invertir;
    controlColorFondo.value = VALORES_POR_DEFECTO.colorFondo;
    controlTolerancia.value = VALORES_POR_DEFECTO.tolerancia;
    controlNitidezDibujo.value = VALORES_POR_DEFECTO.nitidezDibujo;
    actualizarEtiquetas();
    if (regenerar) generarStencil();
}

//  VISOR

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

//  IMAGEN

function clamp(valor) {
    return valor < 0 ? 0 : valor > 255 ? 255 : valor;
}

function aplicarBrilloContraste(data, brillo, contraste) {
    const factor = (259 * (contraste + 255)) / (255 * (259 - contraste));
    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(factor * (data[i] - 128) + 128 + brillo);
        data[i + 1] = clamp(factor * (data[i + 1] - 128) + 128 + brillo);
        data[i + 2] = clamp(factor * (data[i + 2] - 128) + 128 + brillo);
    }
}

function aGrises(data) {
    for (let i = 0; i < data.length; i += 4) {
        const gris = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
        data[i] = data[i + 1] = data[i + 2] = gris;
    }
}

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

// Versión para el modo Dibujo: afila cada canal (R, G, B) POR
// SEPARADO, sin aplanarlos a un único valor de gris. Necesario aquí
// porque el modo Dibujo compara color contra el color de fondo
// elegido — si perdiera el color de por medio, esa comparación
// dejaría de tener sentido.
function desenfocarColor(data, ancho, alto, iteraciones) {
    for (let it = 0; it < iteraciones; it++) {
        const copia = new Uint8ClampedArray(data);
        for (let y = 1; y < alto - 1; y++) {
            for (let x = 1; x < ancho - 1; x++) {
                const idx = (y * ancho + x) * 4;
                let sumaR = 0, sumaG = 0, sumaB = 0;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        const i2 = ((y + dy) * ancho + (x + dx)) * 4;
                        sumaR += copia[i2];
                        sumaG += copia[i2 + 1];
                        sumaB += copia[i2 + 2];
                    }
                }
                data[idx] = sumaR / 9;
                data[idx + 1] = sumaG / 9;
                data[idx + 2] = sumaB / 9;
            }
        }
    }
}

function aplicarNitidezColor(data, ancho, alto, cantidad) {
    if (cantidad <= 0) return;
    const suave = new Uint8ClampedArray(data);
    desenfocarColor(suave, ancho, alto, 1);
    const factor = cantidad / 45;
    for (let i = 0; i < data.length; i += 4) {
        data[i] = clamp(data[i] + (data[i] - suave[i]) * factor);
        data[i + 1] = clamp(data[i + 1] + (data[i + 1] - suave[i + 1]) * factor);
        data[i + 2] = clamp(data[i + 2] + (data[i + 2] - suave[i + 2]) * factor);
    }
}


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

function construirAlfaConDobleUmbral(magnitudesFinas, ancho, alto, sensibilidad, extraDetalle) {
    const umbralAlto = sensibilidad;
    const umbralBajo = Math.max(0, sensibilidad - extraDetalle);
    const alfa = new Uint8ClampedArray(magnitudesFinas.length);

    for (let y = 0; y < alto; y++) {
        for (let x = 0; x < ancho; x++) {
            const idx = y * ancho + x;
            const mag = magnitudesFinas[idx];

            if (mag >= umbralAlto) {
                alfa[idx] = 255; 
            } else if (mag >= umbralBajo) {
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
                alfa[idx] = 0; 
            }
        }
    }
    return alfa;
}

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

// Lo opuesto de engrosarAlfa: adelgaza/erosiona la línea (filtro de
// mínimo). Usado tanto para el lado negativo del slider de Grosor
// como, combinado con engrosarAlfa, para suavizar la rugosidad.
function erosionarAlfa(alfa, ancho, alto, iteraciones) {
    let actual = alfa;
    for (let it = 0; it < iteraciones; it++) {
        const nueva = new Uint8ClampedArray(actual.length);
        for (let y = 0; y < alto; y++) {
            for (let x = 0; x < ancho; x++) {
                const idx = y * ancho + x;
                let minimo = actual[idx];
                if (x > 0) minimo = Math.min(minimo, actual[idx - 1]);
                if (x < ancho - 1) minimo = Math.min(minimo, actual[idx + 1]);
                if (y > 0) minimo = Math.min(minimo, actual[idx - ancho]);
                if (y < alto - 1) minimo = Math.min(minimo, actual[idx + ancho]);
                nueva[idx] = minimo;
            }
        }
        actual = nueva;
    }
    return actual;
}

// "Apertura" morfológica (erosionar y luego engrosar el mismo número
// de veces): elimina pelillos y bordes rugosos de la línea sin
// cambiar apenas su grosor global, porque lo que erosiona en el primer
// paso lo recupera en el segundo — salvo las protuberancias sueltas,
// que desaparecen del todo. Es la herramienta correcta para "líneas
// menos rugosas" sin sacrificar grosor ni nitidez real del trazo.
function suavizarMascara(alfa, ancho, alto, iteraciones) {
    if (iteraciones <= 0) return alfa;
    let resultado = erosionarAlfa(alfa, ancho, alto, iteraciones);
    resultado = engrosarAlfa(resultado, ancho, alto, iteraciones);
    return resultado;
}

function generarStencil() {
    const item = galeria.find((i) => i.id === imagenActualId);
    if (!item) return;

    if (item.modo === 'dibujo') {
        generarStencilDibujo(item);
    } else {
        generarStencilFoto(item);
    }
}

function generarStencilFoto(item) {
    const ancho = canvasPreview.width;
    const alto = canvasPreview.height;

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
    const suavizarLinea = parseInt(controlSuavizarLinea.value, 10);
    const grosor = parseInt(controlGrosor.value, 10);
    const invertir = controlInvertir.checked;
    aplicarBrilloContraste(data, brillo, contraste);
    aGrises(data);

    //  Reducir ruido 
    if (suavizado > 0) desenfocarCanal(data, ancho, alto, suavizado);

    //  Nitidez
    aplicarNitidez(data, ancho, alto, nitidez);

    //  Detección de bordes
    const { magnitudes, direccionX, direccionY } = sobel(data, ancho, alto);

    //  Adelgazado
    const magnitudesFinas = adelgazarLineas(magnitudes, direccionX, direccionY, ancho, alto);

    //  Doble umbral
    let alfa = construirAlfaConDobleUmbral(magnitudesFinas, ancho, alto, sensibilidad, detalle);

    // Suavizar rugosidad de la línea (quita "pelillos" sin perder grosor)
    if (suavizarLinea > 0) alfa = suavizarMascara(alfa, ancho, alto, suavizarLinea);

    // Grosor de línea (positivo engorda, negativo adelgaza/erosiona)
    if (grosor > 0) alfa = engrosarAlfa(alfa, ancho, alto, grosor);
    else if (grosor < 0) alfa = erosionarAlfa(alfa, ancho, alto, -grosor);

    //   PNG 
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

function hexARgb(hex) {
    const limpio = hex.replace('#', '');
    return {
        r: parseInt(limpio.substring(0, 2), 16),
        g: parseInt(limpio.substring(2, 4), 16),
        b: parseInt(limpio.substring(4, 6), 16)
    };
}

function generarStencilDibujo(item) {
    const ancho = canvasPreview.width;
    const alto = canvasPreview.height;

    ctxOriginal.clearRect(0, 0, ancho, alto);
    ctxOriginal.drawImage(item.imgElement, 0, 0, ancho, alto);
    const imageData = ctxOriginal.getImageData(0, 0, ancho, alto);
    const data = imageData.data;

    const brillo = parseInt(controlBrillo.value, 10);
    const contraste = parseInt(controlContraste.value, 10);
    const tolerancia = parseInt(controlTolerancia.value, 10);
    const nitidezDibujo = parseInt(controlNitidezDibujo.value, 10);
    const suavizarLinea = parseInt(controlSuavizarLinea.value, 10);
    const grosor = parseInt(controlGrosor.value, 10);
    const invertir = controlInvertir.checked;
    const colorFondo = hexARgb(controlColorFondo.value);

    aplicarBrilloContraste(data, brillo, contraste);
    aplicarNitidezColor(data, ancho, alto, nitidezDibujo);

    let alfa = new Uint8ClampedArray(ancho * alto);
    for (let i = 0, p = 0; i < data.length; i += 4, p++) {
        const dr = data[i] - colorFondo.r;
        const dg = data[i + 1] - colorFondo.g;
        const db = data[i + 2] - colorFondo.b;
        const distancia = Math.sqrt(dr * dr + dg * dg + db * db);
        alfa[p] = distancia > tolerancia ? 255 : 0;
    }

    if (suavizarLinea > 0) alfa = suavizarMascara(alfa, ancho, alto, suavizarLinea);

    if (grosor > 0) alfa = engrosarAlfa(alfa, ancho, alto, grosor);
    else if (grosor < 0) alfa = erosionarAlfa(alfa, ancho, alto, -grosor);

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

//  GUARDAR 

btnGuardar.addEventListener('click', () => {
    const item = galeria.find((i) => i.id === imagenActualId);
    const nombreBase = item ? item.nombre.replace(/\.[^/.]+$/, '') : 'stencil';
    const nombreArchivo = `${nombreBase}_stencil.png`;

    canvasPreview.toBlob((blob) => {
        const url = URL.createObjectURL(blob);
        // Se guarda en el panel "Guardadas"; la descarga se hace
        // desde ahí, haciendo clic en la miniatura (evita descargar
        // dos veces lo mismo sin querer).
        agregarStencilGuardado(url, nombreArchivo);
    }, 'image/png');
});

function agregarStencilGuardado(url, nombreArchivo) {
    if (!listaStencilsGuardados) return;

    const mensajeVacio = listaStencilsGuardados.querySelector('.sin-tatuajes');
    if (mensajeVacio) mensajeVacio.remove();

    const miniatura = document.createElement('div');
    miniatura.className = 'stencil-thumb';
    miniatura.title = 'Clic para descargar';
    miniatura.style.transform = 'scale(0)';

    const imagen = document.createElement('img');
    imagen.src = url;
    imagen.alt = nombreArchivo;
    miniatura.appendChild(imagen);

    const botonEliminar = document.createElement('button');
    botonEliminar.className = 'btn-eliminar';
    botonEliminar.type = 'button';
    botonEliminar.title = 'Quitar de la lista';
    botonEliminar.textContent = '✕';
    botonEliminar.addEventListener('click', (e) => {
        e.stopPropagation();
        URL.revokeObjectURL(url);
        miniatura.remove();
        if (listaStencilsGuardados.children.length === 0) {
            listaStencilsGuardados.innerHTML = '<span class="sin-tatuajes">Aún no has guardado ningún resultado.</span>';
        }
    });
    miniatura.appendChild(botonEliminar);

    miniatura.addEventListener('click', () => {
        const enlace = document.createElement('a');
        enlace.href = url;
        enlace.download = nombreArchivo;
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
    });

    listaStencilsGuardados.appendChild(miniatura);
    requestAnimationFrame(() => { miniatura.style.transform = 'scale(1)'; });
}