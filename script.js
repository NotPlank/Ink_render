import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { OBJLoader } from 'three/addons/loaders/OBJLoader.js';
import { DecalGeometry } from 'three/addons/geometries/DecalGeometry.js';
// ==========================================
// 1. CONFIGURACIÓN DE PANTALLA Y ENTORNO
// ==========================================
const contenedor = document.getElementById('contenedor3d');
let ancho = contenedor.clientWidth;
let alto = contenedor.clientHeight;

const scene = new THREE.Scene();
scene.background = new THREE.Color('#3d3a42');


const camera = new THREE.PerspectiveCamera(45, ancho / alto, 0.1, 100);
camera.position.set(0, 2, 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
renderer.setSize(ancho, alto);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
contenedor.appendChild(renderer.domElement);


const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 1.5;
controls.maxDistance = 10;
controls.target.set(0, 1, 0);


// ==========================================
// 2. ILUMINACIÓN Y ESCENARIO
// ==========================================
const luzAmbiental = new THREE.AmbientLight(0xffffff, 0.4);
scene.add(luzAmbiental);

const luzPrincipal = new THREE.DirectionalLight(0xffffff, 1.8);
luzPrincipal.position.set(5, 8, 20);
luzPrincipal.castShadow = true;
luzPrincipal.shadow.mapSize.width = 2048;
luzPrincipal.shadow.mapSize.height = 2048;
scene.add(luzPrincipal);

const luzDeRelleno = new THREE.DirectionalLight(0xffffff, 4.4);
luzDeRelleno.position.set(-5, 4, -5);
scene.add(luzDeRelleno);

const sueloGeo = new THREE.PlaneGeometry(20, 0);
const sueloMat = new THREE.ShadowMaterial({ opacity: 0.3 });
const suelo = new THREE.Mesh(sueloGeo, sueloMat);
suelo.rotation.x = -Math.PI / 2;
suelo.receiveShadow = true;
scene.add(suelo);

// ==========================================
// 3. CARGA DEL MODELO 3D
// ==========================================
const modeloGrupo = new THREE.Group();
scene.add(modeloGrupo);
const objLoader = new OBJLoader();

objLoader.load(
    'modelos/Male.OBJ',
    (objeto) => {
        objeto.traverse((hijo) => {
            if (hijo.isMesh) {
                hijo.material = new THREE.MeshStandardMaterial({
                    color: 0xceccd9,
                });
                hijo.castShadow = true;
                hijo.receiveShadow = true;
            }
        });
        objeto.scale.set(1, 1, 1);
        objeto.position.set(0, 1, 0);
        modeloGrupo.add(objeto);
    },
    (progreso) => {
        if (progreso.total) {
            console.log('Cargando modelo: ' + (progreso.loaded / progreso.total * 100).toFixed(0) + '%');
        }
    },
    (error) => {
        console.error('Error al cargar el modelo OBJ ❌', error);
    }
);

// ==========================================
// 4. VARIABLES Y LÓGICA DEL TATUAJE
// ==========================================
let texturaTatuajeActiva = null;
const textureLoader = new THREE.TextureLoader();
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

let escalaTatuaje = 0.2;
let rotacionTatuaje = 0;
let desplazamientoX = 0;
let desplazamientoY = 0;

let ultimoTatuajeMalla = null;
let datosUltimoImpacto = null;
const ventanaEditor = document.getElementById('ventana-editor-tatuaje');

window.aplicarTatuaje = function (urlImagen) {
    textureLoader.load(urlImagen, (textura) => {
        textura.minFilter = THREE.LinearFilter;
        textura.colorSpace = THREE.SRGBColorSpace;

        texturaTatuajeActiva = textura;
        console.log("Tatuaje listo. Haz clic en el modelo.");
    },
        undefined,
        (error) => {
            console.error("Error al cargar la imagen con Three.js:", error);
        });
}

function actualizarTatuajeEnTiempoReal() {
    if (!datosUltimoImpacto || (!texturaTatuajeActiva && !ultimoTatuajeMalla)) return;

    const texturaUsar = texturaTatuajeActiva || ultimoTatuajeMalla.material.map;

    if (ultimoTatuajeMalla) {
        scene.remove(ultimoTatuajeMalla);
        if (ultimoTatuajeMalla.geometry) ultimoTatuajeMalla.geometry.dispose();
        if (ultimoTatuajeMalla.material) ultimoTatuajeMalla.material.dispose();
    }

    // Calcular posición desplazada localmente usando vectores directos de la superficie
    const posicionFinal = datosUltimoImpacto.posicion.clone();

    const vectorDerecha = new THREE.Vector3(1, 0, 0).applyEuler(datosUltimoImpacto.orientacionBase);
    const vectorArriba = new THREE.Vector3(0, 1, 0).applyEuler(datosUltimoImpacto.orientacionBase);

    posicionFinal.addScaledVector(vectorDerecha, desplazamientoX);
    posicionFinal.addScaledVector(vectorArriba, desplazamientoY);

    // Calcular la rotación sobre el eje local
    const nuevaOrientacion = datosUltimoImpacto.orientacionBase.clone();
    const radianesExtra = (rotacionTatuaje * Math.PI) / 180;
    nuevaOrientacion.z += radianesExtra;

    const tamañoFinal = new THREE.Vector3(escalaTatuaje, escalaTatuaje, escalaTatuaje);

    const geometriaDecal = new DecalGeometry(
        datosUltimoImpacto.mallaCuerpo,
        posicionFinal,
        nuevaOrientacion,
        tamañoFinal
    );

    const materialDecal = new THREE.MeshStandardMaterial({
        map: texturaUsar,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4
    });

    ultimoTatuajeMalla = new THREE.Mesh(geometriaDecal, materialDecal);
    scene.add(ultimoTatuajeMalla);
}

contenedor.addEventListener('click', (evento) => {
    if (!texturaTatuajeActiva) return;

    const rect = contenedor.getBoundingClientRect();
    mouse.x = ((evento.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((evento.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children, true);

    // Evitar interactuar si se hace clic en el suelo
    const impactosValidos = intersects.filter(i => i.object !== suelo);

    if (impactosValidos.length > 0) {
        const posicion = impactosValidos[0].point;
        const mallaCuerpo = impactosValidos[0].object;

        const orientacionBase = new THREE.Euler();
        const normalDeLaPiel = impactosValidos[0].face.normal.clone();
        normalDeLaPiel.transformDirection(mallaCuerpo.matrixWorld);

        const objetivoCámara = posicion.clone().add(normalDeLaPiel);
        const matrizGiro = new THREE.Matrix4();
        matrizGiro.lookAt(posicion, objetivoCámara, THREE.Object3D.DEFAULT_UP);
        orientacionBase.setFromRotationMatrix(matrizGiro);

        // Resetear parámetros de transformación locales
        escalaTatuaje = 0.2;
        rotacionTatuaje = 0;
        desplazamientoX = 0;
        desplazamientoY = 0;
        ultimoTatuajeMalla = null;

        datosUltimoImpacto = {
            mallaCuerpo: mallaCuerpo,
            posicion: posicion,
            orientacionBase: orientacionBase
        };

        actualizarTatuajeEnTiempoReal();

        // Bloquear el puntero general y desplegar la ventana de edición XP
        texturaTatuajeActiva = null;
        if (ventanaEditor) ventanaEditor.style.display = 'block';
    }
});

// ==========================================
// 5. INTERFAZ: CONTROLES DEL MODELO HUMANO
// ==========================================
const pasoMover = 0.1;
const pasoRotar = 0.15;
const pasoEscala = 0.1;

window.moverModelo = function (direccion) {
    switch (direccion) {
        case 'izquierda': modeloGrupo.position.x -= pasoMover; break;
        case 'derecha': modeloGrupo.position.x += pasoMover; break;
        case 'arriba': modeloGrupo.position.y += pasoMover; break;
        case 'abajo': modeloGrupo.position.y -= pasoMover; break;
        case 'adelante': modeloGrupo.position.z -= pasoMover; break;
        case 'atras': modeloGrupo.position.z += pasoMover; break;
    }
};

window.rotarModelo = function (direccion) {
    if (direccion === 'izquierda') modeloGrupo.rotation.y -= pasoRotar;
    if (direccion === 'derecha') modeloGrupo.rotation.y += pasoRotar;
};

window.escalarModelo = function (accion) {
    const factor = accion === 'crecer' ? (1 + pasoEscala) : (1 - pasoEscala);
    modeloGrupo.scale.multiplyScalar(factor);
};

window.resetCamara = function () {
    camera.position.set(0, 2, 5);
    controls.target.set(0, 1, 0);
    controls.update();
};

// ==========================================
// 6. INTERFAZ: CONTROLES FLOTANTES DEL TATUAJE
// ==========================================
window.ajustarEscalaTatuaje = function (factor) {
    escalaTatuaje = Math.max(0.05, escalaTatuaje + factor);
    actualizarTatuajeEnTiempoReal();
};

window.girarTatuaje = function (grados) {
    rotacionTatuaje = (rotacionTatuaje + grados) % 360;
    actualizarTatuajeEnTiempoReal();
};

window.moverTatuaje = function (direccion) {
    const pasoDesplazamiento = 0.01; // Ajuste fino milimétrico
    switch (direccion) {
        case 'arriba': desplazamientoY += pasoDesplazamiento; break;
        case 'abajo': desplazamientoY -= pasoDesplazamiento; break;
        case 'derecha': desplazamientoX -= pasoDesplazamiento; break;
        case 'izquierda': desplazamientoX += pasoDesplazamiento; break;
    }
    actualizarTatuajeEnTiempoReal();
};

window.fijarTatuajeActual = function () {
    // Romper las referencias temporales. El tatuaje queda grabado estático en la piel.
    ultimoTatuajeMalla = null;
    datosUltimoImpacto = null;
    if (ventanaEditor) ventanaEditor.style.display = 'none';
    console.log("Tatuaje fijado permanentemente en el cuerpo.");
};

// ==========================================
// 7. GESTOR DE SUBIDA DE ARCHIVOS
// ==========================================
const inputTatuajes = document.getElementById('subir-tatuaje');
const listaTatuajes = document.getElementById('lista-tatuajes');
window.tatuajesCargados = [];

inputTatuajes.addEventListener('change', (evento) => {
    const archivos = Array.from(evento.target.files);

    archivos.forEach((archivo) => {
        if (archivo.type !== 'image/png') {
            console.warn(`"${archivo.name}" no es un PNG y se ha ignorado.`);
            return;
        }

        const url = URL.createObjectURL(archivo);
        const mensajeVacio = listaTatuajes.querySelector('.sin-tatuajes');
        if (mensajeVacio) mensajeVacio.remove();

        const miniatura = document.createElement('div');
        miniatura.className = 'tatuaje-thumb';
        miniatura.title = archivo.name;
        miniatura.style.cursor = 'pointer';

        const imagen = document.createElement('img');
        imagen.src = url;
        imagen.alt = archivo.name;
        imagen.addEventListener('click', () => {
            window.aplicarTatuaje(url);
        });

        const botonEliminar = document.createElement('button');
        botonEliminar.className = 'btn-eliminar';
        botonEliminar.type = 'button';
        botonEliminar.title = 'Eliminar';
        botonEliminar.textContent = '✕';
        botonEliminar.addEventListener('click', (e) => {
            e.stopPropagation();
            URL.revokeObjectURL(url);
            miniatura.remove();
            window.tatuajesCargados = window.tatuajesCargados.filter(t => t.url !== url);
            if (listaTatuajes.children.length === 0) {
                listaTatuajes.innerHTML = '<span class="sin-tatuajes">Aún no has subido ningún tatuaje.</span>';
            }
        });

        miniatura.appendChild(imagen);
        miniatura.appendChild(botonEliminar);
        listaTatuajes.appendChild(miniatura);
        window.tatuajesCargados.push({ nombre: archivo.name, url: url });
    });

    evento.target.value = '';
});

// ==========================================
// 8. BUCLE DE RENDERIZADO Y RESIZE
// ==========================================
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}
animate();

window.addEventListener('resize', () => {
    ancho = contenedor.clientWidth;
    alto = contenedor.clientHeight;
    camera.aspect = ancho / alto;
    camera.updateProjectionMatrix();
    renderer.setSize(ancho, alto);
});


/// Stencil 

const fileInput = document.getElementById('fileInput');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const btnLoad = document.getElementById('btnLoad');
const btnDownload = document.getElementById('btnDownload');
const btnPick = document.getElementById('btnPick');
const swatch = document.getElementById('swatch');

// Canvas oculto para almacenar la imagen original sin alteraciones
const baseCanvas = document.createElement('canvas');
const baseCtx = baseCanvas.getContext('2d');

let hasImage = false;
let eyedropperActive = false;

const state = { 
  bgOn: false, 
  bgTolerance: 40, 
  pickedColor: null, 
  stencilOn: false, 
  stencilThreshold: 120 
};

// Cargar imagen de archivo al Canvas
function srcToCanvas(file) {
  if (!file || !file.type.startsWith('image/')) return;
  const img = new Image();
  const url = URL.createObjectURL(file);
  img.onload = () => {
    // Redimensionar si la imagen supera los 1200px para no congelar el navegador
    const scale = Math.min(1, 1200 / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.round(img.naturalWidth * scale);
    const h = Math.round(img.naturalHeight * scale);
    
    baseCanvas.width = canvas.width = w; 
    baseCanvas.height = canvas.height = h;
    
    baseCtx.drawImage(img, 0, 0, w, h);
    hasImage = true; 
    btnDownload.disabled = false; 
    state.pickedColor = null; 
    if(swatch) swatch.style.display = 'none';
    
    render(); 
    URL.revokeObjectURL(url);
  };
  img.src = url;
}

btnLoad.addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', e => srcToCanvas(e.target.files[0]));

// Eventos de Checkboxes y Deslizadores
document.getElementById('bgOn').addEventListener('change', e => { state.bgOn = e.target.checked; render(); });
document.getElementById('stencilOn').addEventListener('change', e => { state.stencilOn = e.target.checked; render(); });

function bindInput(id, key, labelId) {
  document.getElementById(id).addEventListener('input', e => {
    state[key] = parseInt(e.target.value);
    document.getElementById(labelId).textContent = e.target.value;
    render();
  });
}
bindInput('bgTolerance', 'bgTolerance', 'v-bgTolerance');
bindInput('stencilThreshold', 'stencilThreshold', 'v-stencilThreshold');

// Lógica del Cuentagotas (Elegir color)
btnPick.addEventListener('click', () => {
  if (!hasImage) return;
  eyedropperActive = !eyedropperActive;
  canvas.style.cursor = eyedropperActive ? 'crosshair' : 'default';
});

canvas.addEventListener('click', e => {
  if (!eyedropperActive || !hasImage) return;
  const rect = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - rect.left) * (canvas.width / rect.width));
  const y = Math.floor((e.clientY - rect.top) * (canvas.height / rect.height));
  
  // Extraer el color del píxel de la imagen original
  const p = baseCtx.getImageData(x, y, 1, 1).data;
  
  state.pickedColor = { r: p[0], g: p[1], b: p[2] };
  if(swatch) {
    swatch.style.display = 'inline-block';
    swatch.style.backgroundColor = `rgb(${p[0]},${p[1]},${p[2]})`;
  }
  eyedropperActive = false; 
  canvas.style.cursor = 'default';
  render();
});

// Descargar Archivo Final
btnDownload.addEventListener('click', () => {
  const link = document.createElement('a'); 
  link.download = 'imagen_procesada.png';
  link.href = canvas.toDataURL(); 
  link.click();
});

// MOTOR DE PROCESAMIENTO DE PÍXELES (Core)
function render() {
  if (!hasImage) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(baseCanvas, 0, 0);
  if (!state.bgOn && !state.stencilOn) return;

  const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imgData.data;
  const w = canvas.width;
  const h = canvas.height;

  // 1. Algoritmo Quitar Fondo (Flood Fill desde los bordes perimetrales)
  if (state.bgOn && state.pickedColor) {
    const target = state.pickedColor, tol = state.bgTolerance;
    const visited = new Uint8Array(w * h), queue = [];
    
    for (let x = 0; x < w; x++) { queue.push(x, 0, x, h - 1); visited[x] = visited[x + (h - 1) * w] = 1; }
    for (let y = 1; y < h - 1; y++) { queue.push(0, y, w - 1, y); visited[y * w] = visited[(w - 1) + y * w] = 1; }
    
    let head = 0;
    while (head < queue.length) {
      const cx = queue[head++], cy = queue[head++];
      const idx = (cy * w + cx) * 4;
      const dist = Math.sqrt(Math.pow(data[idx]-target.r,2) + Math.pow(data[idx+1]-target.g,2) + Math.pow(data[idx+2]-target.b,2));
      
      if (dist <= tol) {
        data[idx + 3] = 0; // Canal Alfa a cero (Transparente)
        const dx = [0, 0, -1, 1], dy = [-1, 1, 0, 0];
        for (let i = 0; i < 4; i++) {
          const nx = cx + dx[i], ny = cy + dy[i];
          if (nx >= 0 && nx < w && ny >= 0 && ny < h && !visited[ny * w + nx]) {
            visited[ny * w + nx] = 1; queue.push(nx, ny);
          }
        }
      }
    }
  }

  // 2. Algoritmo Traducir a Línea (Filtro espacial Sobel para detección de contornos)
  if (state.stencilOn) {
    const output = new Uint8ClampedArray(data.length);
    const threshold = state.stencilThreshold;
    const gray = new Uint8Array(w * h);
    
    // Pasar a escala de grises para analizar luminosidad
    for (let i = 0; i < data.length; i += 4) {
      gray[i/4] = 0.299*data[i] + 0.587*data[i+1] + 0.114*data[i+2];
    }

    for (let y = 1; y < h - 1; y++) {
      for (let x = 1; x < w - 1; x++) {
        const idx = (y * w + x) * 4;
        if (data[idx + 3] === 0) continue; // Si ya es transparente por el fondo, saltar

        const hGrad = -gray[(y-1)*w+(x-1)] + gray[(y-1)*w+(x+1)] - 2*gray[y*w+(x-1)] + 2*gray[y*w+(x+1)] - gray[(y+1)*w+(x-1)] + gray[(y+1)*w+(x+1)];
        const vGrad = -gray[(y-1)*w+(x-1)] - 2*gray[(y-1)*w+x] - gray[(y-1)*w+(x+1)] + gray[(y+1)*w+(x-1)] + 2*gray[(y+1)*w+x] + gray[(y+1)*w+(x+1)];
        
        if (Math.sqrt(hGrad*hGrad + vGrad*vGrad) > threshold) {
          output[idx] = output[idx+1] = output[idx+2] = 0; output[idx+3] = 255; // Píxel de línea (Negro)
        } else {
          output[idx+3] = 0; // Espacio vacío transparente
        }
      }
    }
    for (let i = 0; i < data.length; i++) data[i] = output[i];
  }
  ctx.putImageData(imgData, 0, 0);
}
/// BOTON SALIR ROJO TERMINAR
document.addEventListener('DOMContentLoaded', () => {
    // CORREGIDO: Ahora busca el elemento que tiene la clase 'xp-btn' y la clase 'close'
    const btnClose = document.querySelector('.close');

    if (btnClose) {
        btnClose.addEventListener('click', () => {
            window.location.href = 'index.html'; 
        });
    }
});