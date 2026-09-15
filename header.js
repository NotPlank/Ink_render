document.getElementById('header-placeholder').innerHTML = `
            <div class="container-fluid"px-2 padding-bottom:"200px">
                <div class="row">
                    <nav class="navbar navbar-expand-lg bg-body-light">
                        <div class="container-fluid" padding-bottom:"100px">
                            <img class="logo" width="25px" src="imagenes/logo.svg"" width="50px" onclick="window.location.href='index.html'" style="cursor: pointer;">
                            <span class="navbar-text text-dark fs-4 d-block d-md-none mx-auto"><h1>Ink Render</h1></span>
                            <button class="navbar-toggler" type="button" data-bs-toggle="collapse"
                                data-bs-target="#navbarText" aria-controls="navbarText" aria-expanded="false"
                                aria-label="Toggle navigation">
                                <span class="navbar-toggler-icon"></span>
                            </button>

                            <div class="collapse navbar-collapse" id="navbarText">
                                <ul class="navbar-nav ms-auto mb-2 mb-lg-0">
                                    <li class="nav-item dropdown ms-auto">
                                        <a class="nav-link dropdown-toggle" href="#" role="button"
                                            data-bs-toggle="dropdown" aria-expanded="false">
                                            Apps
                                        </a>
                                        <ul class="dropdown-menu px-0 dropdown-menu-dark">
                                            <li><a class="dropdown-item bg-dark" href="3d.html">3D</a></li>
                                            <li><a class="dropdown-item bg-dark" href="stencil.html">Stencil</a></li>
                                        </ul>
                                    </li>
                                    <li class="nav-item ms-auto">
                                        <a class="nav-link active" aria-current="page" href="galery.html">Galería</a>
                                    </li>
                                    <li class="nav-item ms-auto">
                                        <a class="nav-link" href="faq.html">F.A.Q</a>
                                    </li>
                                    <li class="nav-item ms-auto">
                                        <a class="nav-link" href="contacto.html">Contacto</a>
                                    </li>
                                </ul>
                            </div>

                        </div>
                    </nav>
                </div>
            </div>
        `;