const STORAGE_KEY = "cookiePreferences";
const GOOGLE_ANALYTICS_ID = "G-zcrznflaXA6ctiNeK7sLw16d8G_p2ItCKSc0Ww9tK18";
//   Id de google real

const banner = document.getElementById("cookie-banner");
const settingsPanel = document.getElementById("cookie-settings");

const btnAceptar = document.getElementById("btn-accept-cookies");
const btnRechazar = document.getElementById("btn-reject-cookies");
const btnConfigurar = document.getElementById("btn-configure-cookies");
const btnGuardar = document.getElementById("save-cookie-settings");
const btnCancelar = document.getElementById("close-cookie-settings");

const enlaceCambiar = document.getElementById("change-cookie-settings");
const enlaceReiniciar = document.getElementById("reset-cookie-settings");

const checkAnalytics = document.getElementById("cookies-analytics");
const checkMarketing = document.getElementById("cookies-marketing");
// para las variables 
let analyticsCargado = false;
// para evitar que google analitics se cargue dos veces

function guardarPreferencias(preferencias) {
    try {
        // solo guarda texto, esto lo combierte en un objeto 
        localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify(preferencias)
        );

        return true;
        // para que sepas que el guardado ha funcionado 
    } catch (error) {
        console.error("No se pudieron guardar las preferencias:", error);
        return false;
    }
}
//leer las preferencias
function obtenerPreferencias() {
    try {
        const guardadas = localStorage.getItem(STORAGE_KEY); // recuperamos el texto guardado

        if (guardadas === null) {
            return null;
        }

        const preferencias = JSON.parse(guardadas);// combertimos el json en un objeto de js

        if (
            typeof preferencias.analytics !== "boolean" || // comprobamos true o false
            typeof preferencias.marketing !== "boolean"
        ) {
            return null;
        }

        return preferencias;

    } catch (error) {
        console.error("No se pudieron leer las preferencias:", error);
        return null;
    }
}

function borrarPreferencias() {
    try {
        localStorage.removeItem(STORAGE_KEY); // eliminamos la clave 
    } catch (error) {
        console.error("No se pudieron borrar las preferencias:", error);
    }
}

function activarGoogleAnalytics() {
    if (analyticsCargado) {
        return; // si esta cargado terminamos la funcion 
    }

    if (GOOGLE_ANALYTICS_ID === "G-XXXXXXXXXX") { // si ve que no has cambiado el numero al real se sale tb
        return;
    }

    const script = document.createElement("script"); // que se cargue dinamicamente, esto evita que se cargue directametne al entrar en la web , creo el script, en la id va la id de google analytics

    script.async = true;
    script.src =
        "https://www.googletagmanager.com/gtag/js?id=" +
        encodeURIComponent(GOOGLE_ANALYTICS_ID);

    document.head.appendChild(script); // aqui se agrega en el head

    window.dataLayer = window.dataLayer || []; // configuracion estandar de google analytics

    function gtag() {
        window.dataLayer.push(arguments);
    }

    window.gtag = gtag;

    gtag("js", new Date());
    gtag("config", GOOGLE_ANALYTICS_ID);

    analyticsCargado = true; // si ya lohiciste que marque como true que ya lo ha cargado
}

function activarMarketing() { // no tiene nada dentro, dentro irian las cosas de google ads redes...
}

function aplicarPreferencias(preferencias) { // cargam ambas preferencias si estan activadas
    if (preferencias.analytics) {
        activarGoogleAnalytics();
    }

    if (preferencias.marketing) {
        activarMarketing();
    }
}

function abrirConfiguracion() { // para el panel 
    const preferencias = obtenerPreferencias(); // comprobar si ya existen preferencias guardadas

    if (preferencias) { // esto mira los checkboxes 
        checkAnalytics.checked = preferencias.analytics;
        checkMarketing.checked = preferencias.marketing;
    } else {
        checkAnalytics.checked = false; // si no las tienes se quedan desmarcadas
        checkMarketing.checked = false;
    }

    settingsPanel.hidden = false; // para msotrar el panel 
}

btnAceptar.addEventListener("click", function () {
    const preferencias = {
        analytics: true, // objeto preferencias con todas marcadas
        marketing: true
    };

    if (guardarPreferencias(preferencias)) { // se guardan se aplican y ocultamos el banner
        aplicarPreferencias(preferencias);
        banner.hidden = true;
    }
});

btnRechazar.addEventListener("click", function () { // igual epr oen rechazar
    const preferencias = {
        analytics: false,
        marketing: false
    };

    if (guardarPreferencias(preferencias)) {
        banner.hidden = true;
    }
});

btnConfigurar.addEventListener("click", function () { // ocultamos banner y mostramos panel 
    banner.hidden = true;
    abrirConfiguracion();
});

btnGuardar.addEventListener("click", function () {
    const preferencias = {
        analytics: checkAnalytics.checked,// devuelve true o false 
        marketing: checkMarketing.checked
    };

    if (guardarPreferencias(preferencias)) { // si las guarda, lo aplicas oscultas el panel
        aplicarPreferencias(preferencias);
        settingsPanel.hidden = true;
        banner.hidden = true;
    }
});

btnCancelar.addEventListener("click", function () {
    settingsPanel.hidden = true; // si no ha toado decision hay que mostrar el banner

    if (!obtenerPreferencias()) {
        banner.hidden = false;
    }
});

enlaceCambiar.addEventListener("click", function (event) { // abre el panel de configurar, es un enlace normal, pero no actua como un enlace comun
    event.preventDefault(); // previenes que lo haga
    abrirConfiguracion(); // y abres la config
});

enlaceReiniciar.addEventListener("click", function (event) {
    event.preventDefault();

    borrarPreferencias(); // borramos lo marcado

    checkAnalytics.checked = false; // pasamos a false
    checkMarketing.checked = false;

    settingsPanel.hidden = true; // ocultamos el panel
    banner.hidden = false; // mostramos el banner
});

const preferenciasIniciales = obtenerPreferencias(); // si ya tiene una decision guardada

if (preferenciasIniciales) {
    banner.hidden = true;
    aplicarPreferencias(preferenciasIniciales); // lo aplicamos
} else {
    banner.hidden = false; // lo seguimos mostrando
}
