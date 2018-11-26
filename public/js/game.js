const ANCHO = 800;
const ALTO = 600;

// Configuramos nuestro juego
var config = {
    width: ANCHO,
    height: ALTO,
    backgroundColor: "#ffffff",
    scene: {
        preload: precarga,
        create: creacion,
        update: update
    }
};

// Creamos el juego con la configuracion establecida
var game = new Phaser.Game(config);

// Declaramos las variables que vamos a necesitar

var jugadores = [];
var bolas = [];

var graficos;
var cursor;

var posicionJugador;
var tamanoJugador;
var distancia_celula;
var vector_distancia;

var muerto = false;

/* -- FUNCIONES UTILES -- */

/** Calcula la distancia entre dos puntos. */
function Distancia(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}

/** -- FUNCIONES DE PHASER -- */

/** Precarga las assets del juego para utilizarlas durante la partida */
function precarga ()
{
    this.load.image('fondo','assets/grid.png');
}

/** Se ejecuta al inicio del juego. */
function creacion ()
{
    this.add.image(0, 0, 'fondo').setOrigin(0, 0).setScale(1.5);
    graficos = this.add.graphics();


    posicionJugador = { x: 0, y: 0 };

}

/** Se ejecuta cada frame. */
function update() {

    /* INICIO DEL FRAME */

    // Comprobamos que no estamos muertos
    if (!muerto) {
        // Establecemos la posicion de la camara al centro de nuestra pelota
        this.cameras.main.setScroll(posicionJugador.x - (ANCHO/2), posicionJugador.y - (ALTO/2));

        // Establecemos el zoom de la camara segun nuestro tamaño
        this.cameras.main.setZoom(50/tamanoJugador);

        /* ENTRADA */
        // Leemos la posición del cursor en el mundo
        var cursor_posicion =
        {
            x: this.input.x + this.cameras.main.scrollX,
            y: this.input.y + this.cameras.main.scrollY
        }

        // Calcula la distancia del cursor a la celula
        distancia_celula = Distancia(posicionJugador.x, posicionJugador.y, cursor_posicion.x, cursor_posicion.y);
        vector_distancia =
            {
                x: (cursor_posicion.x - posicionJugador.x) / distancia_celula,
                y: (cursor_posicion.y - posicionJugador.y) / distancia_celula
            }

        socket.emit("entrada", { direccion: vector_distancia });
    }


    /* DIBUJADO */

    // Limpiamos el lienzo
    graficos.clear();

    // Dibujamos las bolitas de energia (¡primero las bolitas, luego los jugadores!)

    bolas.forEach((bolita) => {

        // Configuramos los colores
        graficos.fillStyle(bolita.color, 1); // color, alfa

        // Dibujamos el circulo
        graficos.fillCircle(bolita.x, bolita.y, 20); // x, y, radio

    });

    // Dibujamos todos los jugadores conectados.

    jugadores.forEach((jugador) => {

        // Configuramos los colores
        
        graficos.fillStyle(jugador.color, 0.8); // color, alfa
        graficos.lineStyle(10, jugador.color, 1); // ancho, color, alfa

        // Dibujamos el circulo
        graficos.fillCircle(jugador.posicion.x, jugador.posicion.y, jugador.tamano); // x, y, radio
        graficos.strokeCircle(jugador.posicion.x, jugador.posicion.y, jugador.tamano + 5);

    });
    
    
}



/* -- SECCION SOCKET.IO -- */

// Inicializacion
var socket = io();

// Eventos

socket.on('informacion_juego', function(datos) {

    // Guardamos los datos que hemos recibido
    jugadores = datos.jugadores;
    bolas = datos.bolas;

    var yo = jugadores.find((x) => x.id == socket.id)
    // Antes de guardar nuestra posicion, hay que asegurarnos de que existimos.
    if(!muerto && yo !== undefined && yo != null) {
        posicionJugador = yo.posicion;
        tamanoJugador = yo.tamano;
        document.getElementById("puntuacion").innerHTML = "Tamaño: " + tamanoJugador;
    }

});

socket.on('has_muerto', function() {
    alert("¡Te han devorado! Actualiza la página para volver a jugar.");
    muerto = true; // Estamos muertos.
});