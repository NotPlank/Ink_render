<?php

if ($_SERVER["REQUEST_METHOD"] !== "POST") {
    exit("Acceso no permitido.");
}

$nombre  = trim($_POST["nombre"] ?? "");
$email   = trim($_POST["email"] ?? "");
$mensaje = trim($_POST["mensaje"] ?? "");

// RECEPCIÓN Y SEGURIDAD DE ARCHIVOS

$carpetaSubidas = __DIR__ . '/uploads/';
if (!is_dir($carpetaSubidas)) {
    mkdir($carpetaSubidas, 0755, true);
}

$extensionesPermitidas = ['jpg', 'jpeg', 'png'];
$mimesPermitidos       = ['image/jpeg', 'image/png'];
$tamanoMaximoPorArchivo = 5 * 1024 * 1024; // 5 MB por archivo
$nombresGuardados = [];

if (isset($_FILES['user-artwork']) && is_array($_FILES['user-artwork']['name'])) {
    $totalArchivos = count($_FILES['user-artwork']['name']);

    for ($i = 0; $i < $totalArchivos; $i++) {

        if ($_FILES['user-artwork']['error'][$i] === UPLOAD_ERR_NO_FILE) {
            continue;
        }
        if ($_FILES['user-artwork']['error'][$i] !== UPLOAD_ERR_OK) {
            exit("Hubo un problema al recibir uno de los archivos.");
        }

        $nombreOriginal = $_FILES['user-artwork']['name'][$i];
        $rutaTemporal   = $_FILES['user-artwork']['tmp_name'][$i];
        $tamano         = $_FILES['user-artwork']['size'][$i];

        // Seguridad archivos adjuntos
        if ($tamano > $tamanoMaximoPorArchivo) {
            exit("Uno de los archivos supera el tamaño máximo permitido (5 MB).");
        }

        $extension = strtolower(pathinfo($nombreOriginal, PATHINFO_EXTENSION));
        if (!in_array($extension, $extensionesPermitidas, true)) {
            exit("Tipo de archivo no permitido. Solo se aceptan imágenes JPG, JPEG o PNG.");
        }

        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mimeReal = finfo_file($finfo, $rutaTemporal);
        finfo_close($finfo);
        if (!in_array($mimeReal, $mimesPermitidos, true)) {
            exit("El archivo no es una imagen válida.");
        }

        $infoImagen = @getimagesize($rutaTemporal);
        if ($infoImagen === false) {
            exit("El archivo no es una imagen válida.");
        }
        $nombreSeguro = bin2hex(random_bytes(8)) . '.' . $extension;
        $rutaDestino  = $carpetaSubidas . $nombreSeguro;

        if (move_uploaded_file($rutaTemporal, $rutaDestino)) {
            $nombresGuardados[] = $nombreSeguro;
        }
    }
}

$archivos = count($nombresGuardados) > 0
    ? implode(", ", $nombresGuardados)
    : "No se subió ninguna imagen.";

// Validación de los campos de texto
if ($nombre === "" || $email === "" || $mensaje === "") {
    exit("Todos los campos son obligatorios.");
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    exit("El email no es válido.");
}

// Configuración, donde llega y como te llega el asunto
$destinatario = "davidpereiraceb@gmail.com";
$asunto = "Nuevo mensaje de tu web";

// Evitar inyección de cabeceras, r es el retorno de carro (tabulador)y n es el salto de linea, sirve para evitar  que la gente meta codigo en tu form, en ese caso, lo sustituye por vacio, esto pone todo el texto en una sola linea por lo que romperia tu codigo o utilizwn tu web para el spam masivo. Esto es una medida de seguridad 
$nombre = str_replace(["\r", "\n"], "", $nombre);
$email  = str_replace(["\r", "\n"], "", $email);
$mensaje  = str_replace(["\r", "\n"], "", $mensaje);

// Construir mensaje, esto es el contenido que te llega, el .= concatena estos datos 
$contenido = "Has recibido un nuevo mensaje:\n\n";
$contenido .= "Nombre: " . $nombre . "\n";
$contenido .= "Email: " . $email . "\n\n";
$contenido .= "Mensaje:\n" . $mensaje . "\n";
$contenido .= "Archivos guardados en /uploads/:\n" . $archivos . "\n";

// Cabeceras, no tocar nada solo cambiar el dominio
$headers = "From: davidpereiraceb@gmail.com\r\n";
$headers .= "Reply-To: " . $email . "\r\n";
$headers .= "Content-Type: text/plain; charset=UTF-8\r\n";

// Enviar, la funcion mail manda ese correo, pero esto no funciona en local. Es decir si cumple todas las condiciones se manda, a nosotros nos dara error por que no tenemos servidor
if (mail($destinatario, $asunto, $contenido, $headers)) {
    echo "Mensaje enviado correctamente.";
} else {
    echo "No se pudo enviar el mensaje.";
}
?>