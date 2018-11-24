// Configuramos nuestro juego
var config = {
    width: 800,
    height: 600,
    scene: {
        preload: precarga,
        create: creacion,
        update: update
    }
};

// Creamos el juego con la configuracion establecida
var game = new Phaser.Game(config);

// Declaramos las variables que vamos a necesitar
var graficos;
var cursor;
var posicionJugador;
var jugadores = [];
var distancia_celula;
var vector_distancia;

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
    this.add.image(0,0,'fondo');
    graficos = this.add.graphics();

    posicionJugador = { x: 0, y: 0 };

}

/** Se ejecuta cada frame. */
function update() {

    /* INICIO DEL FRAME */

    // Establecemos la posicion de la camara al centro de nuestra pelota
    this.cameras.main.setScroll(posicionJugador.x - 400, posicionJugador.y - 300);

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

    /* DIBUJADO */

    // Limpiamos el lienzo
    graficos.clear();

    // Dibujamos todos los jugadores conectados.

    jugadores.forEach((jugador) => {

        // Configuramos los colores
        const colorJugador = Phaser.Display.Color.HSLToColor(jugador.color, 0.8, 1); // Hue, Saturation, Lightness (HSL)
        const colorOscurecido = Phaser.Display.Color.HSLToColor(jugador.color, 0.8, 0.7);
        
        graficos.fillStyle(colorJugador, 1); // color, alfa
        graficos.lineStyle(10, colorOscurecido, 1); // ancho, color, alfa

        // Dibujamos el circulo
        graficos.fillCircle(jugador.posicion.x, jugador.posicion.y, jugador.tamano); // x, y, radio
        graficos.strokeCircle(jugador.posicion.x, jugador.posicion.y, jugador.tamano + 5);

    });
    
}



/* -- SECCION SOCKET.IO -- */

// Inicializacion
var socket = io();

// Eventos

socket.on('informacion_jugadores', function(jugadoresRecibidos) {

    jugadores = jugadoresRecibidos;
    console.log(jugadores);
    var yo = jugadores.find((x) => x.id == socket.id)
    // Antes de guardar nuestra posicion, hay que asegurarnos de que existimos.
    if(yo !== undefined && yo != null) {
        posicionJugador = yo.posicion;
    }

});

socket.on('te_han_comido', function() {
    alert("¡Te han devorado! Actualiza la página para reintentarlo.");
});