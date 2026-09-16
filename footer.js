document.getElementById('footer-placeholder').innerHTML = `
<footer class="fixed-bottom">
            <div class="container-fluid h-100 d-flex justify-content-center justify-content-md-end align-items-start">
                <div class="row h-100">
                    
                    <div class="col-xl-6 col-md-6 col-3">
                    
                    </div>

                    <div class="col-xl-6 col-md-6 col-9 pet-container">
                        <iframe src="pet.html" id="pet-frame" scrolling="no"></iframe>
                    </div>
        </footer>
<style>
footer.fixed-bottom {
    height: 10vh;
    
}
.pet-container {
    height: 100%;
    display: flex;
    justify-content: center;
    align-items: center;
	overflow: visible !important;
}
#pet-frame {
    width: 35rem;
    height: 12rem;
	z-index: 10;

}
footer::before {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
    background-image:
        radial-gradient(circle, #ffffffa2 0.5px, transparent 0.5px),
        radial-gradient(circle, #ffffff6e 0.5px, transparent 0.5px),
        radial-gradient(circle, #ffffffdc 0.5px, transparent 0.5px),
        radial-gradient(circle, #cccccc 0.5px, transparent 0.5px),
        radial-gradient(circle, #cccccc 0.5px, transparent 0.5px);
    background-size:
        41px 37px,
        73px 61px,
        101px 47px,
        53px 43px,
        89px 67px;
    background-position:
        11px 23px,
        47px 53px,
        89px 13px,
        29px 37px,
        163px 2px;  

    animation: twinkleA 3s ease-in-out infinite;
}
footer::after {
    content: "";
    position: absolute;
    top: 0; left: 0; width: 100%; height: 100%;
    z-index: 0;
    background-image:
        radial-gradient(circle, #888888 0.5px, transparent 0.5px),
        radial-gradient(circle, #a5a5a55b 0.5px, transparent 0.5px),
        radial-gradient(circle, #555555a8 0.5px, transparent 0.5px),
        radial-gradient(circle, #555555 0.5px, transparent 0.5px),
        radial-gradient(circle, #ffffff9d 0.5px, transparent 0.5px);
    background-size:
        131px 59px,
        157px 71px,
        67px 51px,
        113px 79px,
        199px 31px;
    background-position:
        11px 23px,
        47px 53px,
        89px 13px,
        29px 37px,
        163px 2px;  
    animation: twinkleB 2.5s ease-in-out infinite;
    animation-delay: 1.2s;
}
@keyframes twinkleA {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
}

@keyframes twinkleB {
    0%, 100% { opacity: 1; }
    60% { opacity: 0.2; }
}
    .bocadillo {
    position: fixed;
    z-index: 999999 !important;

    width: 220px;

    background-color: #f4f7f8;
    border: 2px solid #869099;
    border-radius: 8px;
    box-shadow: 4px 4px 10px rgba(0, 0, 0, 0.35);

    padding: 10px 12px;

    font-family: sans-serif;
    font-size: 13px;
    line-height: 1.4;
    color: #222;
    text-align: center;

    overflow: visible;

    /* Posición inicial y animación */
    transform: translate(-50%, -100%) scale(0.9);
    opacity: 0;

    pointer-events: none;

    transition: opacity 0.2s ease, transform 0.2s ease;
}

.bocadillo.visible {
    opacity: 1;
    transform: translate(-50%, -100%) scale(1);
}

.bocadillo::after {
    content: "";

    position: absolute;
    bottom: -9px;
    left: 20%;

    transform: translateX(-50%);

    width: 0;
    height: 0;

    border-left: 9px solid transparent;
    border-right: 9px solid transparent;
    border-top: 9px solid #869099;
}

.bocadillo::before {
    content: "";

    position: absolute;
    bottom: -6px;
    left: 20%;

    transform: translateX(-50%);

    width: 0;
    height: 0;

    border-left: 7px solid transparent;
    border-right: 7px solid transparent;
    border-top: 7px solid #f4f7f8;

    z-index: 1;
}
        </style>
       `;


// Fondo

(function () {
    const fondoGlobalA = document.createElement('div');
    fondoGlobalA.className = 'cielo-estrellado-fijo capa-a';

    const fondoGlobalB = document.createElement('div');
    fondoGlobalB.className = 'cielo-estrellado-fijo capa-b';

    document.body.prepend(fondoGlobalB);
    document.body.prepend(fondoGlobalA);

    const estilosInyeccion = document.createElement('style');
    estilosInyeccion.innerHTML = `
    html, body {
        min-height: 100vh !important;
        height: 100% !important;
        margin: 0;
        padding: 0;
        position: relative;
    }
    html {
        background: linear-gradient(179deg, rgba(255, 255, 255, 1) 11%, rgba(0, 0, 0, 1) 83%) !important;
        background-attachment: fixed !important;
    }

    body, main, .main-content, #wrapper, .container, .container-fluid:not(footer .container-fluid), .row, .col {
        background-color: transparent !important;
        background: transparent !important;
    }

    .cielo-estrellado-fijo {
        position: fixed !important;
        top: 40vh; left: 0; 
        width: 100vw !important; 
        height: 100vh !important;
        pointer-events: none;
    }
    .cielo-estrellado-fijo.capa-a {
        z-index: -2; 
        background-image:
            radial-gradient(circle, rgba(165, 164, 164, 0.8) 1.2px, transparent 1.2px),
            radial-gradient(circle, rgba(119, 119, 119, 0.66) 1px, transparent 1px),
            radial-gradient(circle, rgba(255, 255, 255, 0.6) 1px, transparent 1px);
        background-size: 140px 140px, 95px 95px, 180px 180px;
        background-position: 30px 40px, 70px 20px, 120px 100px;
        animation: destelloLento 2.5s ease-in-out infinite; 
    }
    .cielo-estrellado-fijo.capa-b {
        z-index: -1; 
        background-image:
            radial-gradient(circle, rgba(133, 133, 134, 0.8) 1.5px, transparent 1.5px),
            radial-gradient(circle, rgba(104, 104, 104, 0.7) 1.1px, transparent 1.1px),
            radial-gradient(circle, rgba(131, 131, 131, 0.5) 0.9px, transparent 0.9px);
        background-size: 110px 110px, 150px 150px, 80px 80px;
        background-position: 50px 60px, 25px 90px, 95px 35px;
        animation: destelloLento 4.5s ease-in-out infinite;
        animation-delay: 1.5s;
    }

    @keyframes destelloLento {
        0%, 100% { opacity: 0.95; }
        50% { opacity: 0.15; }
    }

    @keyframes destelloRapido {
        0%, 100% { opacity: 0.15; }
        50% { opacity: 0.85; }
    }
    `;
    document.head.appendChild(estilosInyeccion);
})();
document.addEventListener('mousemove', (e) => {
  const iframePet = document.getElementById('pet-iframe') || document.querySelector('footer iframe');
  
  if (iframePet && iframePet.contentWindow) {
    const porcentajeX = e.clientX / window.innerWidth;
    const porcentajeY = e.clientY / window.innerHeight;
    iframePet.contentWindow.postMessage({
      tipo: 'mirar_porcentaje',
      x: porcentajeX,
      y: porcentajeY
    }, '*');
  }
});
