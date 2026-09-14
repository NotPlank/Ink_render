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

// Material reutilizado para el decal: antes se creaba uno nuevo en
// CADA ajuste (mover/girar/escalar), lo cual era parte del motivo de
// la lentitud. Ahora solo se crea una vez y se le cambia la textura.
const materialDecal = new THREE.MeshStandardMaterial({
    transparent: true,
    depthTest: true,
    depthWrite: false,
    polygonOffset: true,
    polygonOffsetFactor: -4
});

window.aplicarTatuaje = function (urlImagen) {
    textureLoader.load(urlImagen, (textura) => {
        textura.minFilter = THREE.LinearFilter;
        textura.colorSpace = THREE.SRGBColorSpace;

        texturaTatuajeActiva = textura;
        console.log("Tatuaje listo. Haz clic en el modelo.");

        // Pista visual: el cursor cambia mientras está "armado" un
        // tatuaje, para que quede claro que el siguiente clic sobre
        // el maniquí es el que lo coloca.
        contenedor.style.cursor = 'crosshair';

        // Aviso automático de la mascota (si existe en esta página)
        avisarMascota('Ahora haz clic sobre el maniquí para colocar el tatuaje ahí 👆');
    },
        undefined,
        (error) => {
            console.error("Error al cargar la imagen con Three.js:", error);
        });
}

// Envía un mensaje a la mascota del footer (pet.html, dentro de un
// iframe) para que muestre un bocadillo con el texto indicado.
// Si la mascota no está en esta página, simplemente no hace nada.
function avisarMascota(texto) {
    const iframePet = document.getElementById('pet-frame');
    if (iframePet && iframePet.contentWindow) {
        iframePet.contentWindow.postMessage(
            { tipo: 'tip3d', texto: texto },
            window.location.origin
        );
    }
}

function actualizarTatuajeEnTiempoReal() {
    if (!datosUltimoImpacto || (!texturaTatuajeActiva && !materialDecal.map)) return;

    const texturaUsar = texturaTatuajeActiva || materialDecal.map;

    if (ultimoTatuajeMalla) {
        modeloGrupo.remove(ultimoTatuajeMalla);
        if (ultimoTatuajeMalla.geometry) ultimoTatuajeMalla.geometry.dispose();
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

    // CLAVE DEL ARREGLO: el decal se calcula en coordenadas del
    // mundo, pero lo vamos a colgar de modeloGrupo. Convertimos su
    // geometría al espacio LOCAL de modeloGrupo (aplicando su matriz
    // inversa) para que, a partir de ahora, se mueva/gire/escale
    // exactamente igual que el resto del cuerpo.
    geometriaDecal.applyMatrix4(modeloGrupo.matrixWorld.clone().invert());

    materialDecal.map = texturaUsar;
    materialDecal.needsUpdate = true;

    ultimoTatuajeMalla = new THREE.Mesh(geometriaDecal, materialDecal);
    modeloGrupo.add(ultimoTatuajeMalla); // antes: scene.add(...)
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
        contenedor.style.cursor = 'default';
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

// Agrupa varias llamadas seguidas (p.ej. clics rápidos en ➕/➖) en
// una sola reconstrucción por frame, en vez de una por clic.
let actualizacionTatuajePendiente = false;
function solicitarActualizacionTatuaje() {
    if (actualizacionTatuajePendiente) return;
    actualizacionTatuajePendiente = true;
    requestAnimationFrame(() => {
        actualizacionTatuajePendiente = false;
        actualizarTatuajeEnTiempoReal();
    });
}

// ==========================================
// 6. INTERFAZ: CONTROLES FLOTANTES DEL TATUAJE
// ==========================================
window.ajustarEscalaTatuaje = function (factor) {
    escalaTatuaje = Math.max(0.05, escalaTatuaje + factor);
    solicitarActualizacionTatuaje();
};

window.girarTatuaje = function (grados) {
    rotacionTatuaje = (rotacionTatuaje + grados) % 360;
    solicitarActualizacionTatuaje();
};

window.moverTatuaje = function (direccion) {
    const pasoDesplazamiento = 0.01; // Ajuste fino milimétrico
    switch (direccion) {
        case 'arriba': desplazamientoY += pasoDesplazamiento; break;
        case 'abajo': desplazamientoY -= pasoDesplazamiento; break;
        case 'derecha': desplazamientoX -= pasoDesplazamiento; break;
        case 'izquierda': desplazamientoX += pasoDesplazamiento; break;
    }
    solicitarActualizacionTatuaje();
};

window.fijarTatuajeActual = function () {
    // Romper las referencias temporales. El tatuaje se queda donde
    // está, colgado de modeloGrupo, así que seguirá moviéndose con
    // el modelo aunque dejemos de editarlo.
    ultimoTatuajeMalla = null;
    datosUltimoImpacto = null;
    if (ventanaEditor) ventanaEditor.style.display = 'none';
    console.log("Tatuaje fijado permanentemente en el cuerpo.");
};

// ==========================================
// 6.1 VENTANA FLOTANTE ARRASTRABLE
// ==========================================
(function hacerArrastrable(panel) {
    if (!panel) return;
    const tirador = panel.querySelector('.xp-t');
    if (!tirador) return;

    let arrastrando = false;
    let offsetX = 0;
    let offsetY = 0;

    tirador.style.cursor = 'move';

    tirador.addEventListener('pointerdown', (evento) => {
        arrastrando = true;
        const rect = panel.getBoundingClientRect();
        offsetX = evento.clientX - rect.left;
        offsetY = evento.clientY - rect.top;
        tirador.setPointerCapture(evento.pointerId);
    });

    tirador.addEventListener('pointermove', (evento) => {
        if (!arrastrando) return;
        panel.style.left = (evento.clientX - offsetX) + 'px';
        panel.style.top = (evento.clientY - offsetY) + 'px';
        panel.style.right = 'auto'; // anulamos el "right" inicial para que mande "left"
    });

    tirador.addEventListener('pointerup', () => { arrastrando = false; });
    tirador.addEventListener('pointercancel', () => { arrastrando = false; });
})(ventanaEditor);

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