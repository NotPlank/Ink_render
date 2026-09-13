document.getElementById('footer-placeholder').innerHTML = `
<footer class="fixed-bottom">
            <div class="container-fluid h-100 d-flex justify-content-center justify-content-md-end align-items-start">
                <div class="row h-100">
                    
                    <div class="col-xl-6 col-md-6 col-3">
                    
                    </div>

                    <div class="col-xl-6 col-md-6 col-9 pet-container">
                        <iframe src="pet.html" id="pet-frame" scrolling="no"></iframe>
                    </div>

                </div>
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
	overflow: visible;
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
    /* Primeras 5 capas de tus estrellas */
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
    /* Las otras 5 capas de tus estrellas */
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
        </style>
       `;