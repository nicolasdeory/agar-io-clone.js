//@ts-check
/* CONFIGURACIÓN INICIAL */
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);

app.use(express.static(__dirname + '/public'));

app.get('/', function(req, res){
    res.sendFile(__dirname + '/index.html');
});

http.listen(80, function() {
    console.log("Escuchando on *:80");
});

/* CONSTANTES */
const Tamano_Mapa = 2040;
const Tamano_Inicial = 50;
const Tamano_Maximo = 1000;
const Velocidad_Maxima = 100;
const Tick_Rate = 5;

/* VARIABLES DE ESTADO */
var jugadores = [];


/* EVENTOS DEL SERVIDOR */
io.on('connection', function(socket) {
    // Para cada nueva conexión...

    // Creamos un nuevo objeto jugador y lo añadimos a la lista de jugadores.

    // NO USAR MAYUSCULAS EN LOS NOMBRES DE MIEMBROS
    var jugadorNuevo = 
    {
        id: socket.id,
        color: Math.random(), // Tono de color entre 0 y 1 (hue)
        tamano: 50,
        puntuacion: 0,
        posicion: { x: Math.floor(Math.random() * 2040), y: Math.floor(Math.random() * 2040) }, // Asignamos una posicion aleatoria en el mapa
        velocidad: {x: 0, y:0}
    };
    
    jugadores.push(jugadorNuevo);
    console.log(jugadores);

    // Cuando el jugador se desconecta...
    socket.on('disconnect', function() {
        jugadores.splice(jugadores.find((x) => x.id == socket.id), 1);
        console.log(jugadores);
    });

    socket.on('entrada', function(entrada) {
        const jugador = jugadores.find((x) => x.id == socket.id);

        // Procesamos la entrada y transformamos la direccion a velocidad.
        // Cuanto mas grande es la celula, mas lenta va.
        var velocidad_Celula = Math.floor(Velocidad_Maxima / (jugador.Tamano / Tamano_Inicial)); // TODO: Funcionará sin Math.floor ??

        jugador.velocidad = {
            x: entrada.direccion.x * velocidad_Celula,
            y: entrada.direccion.y * velocidad_Celula,
        };
    });

});


/** Funcion que se ejecuta continuamente mientras el servidor esté encendido. */
function Tick() {

    // Para cada jugador conectado...
    jugadores.forEach((jugador) => {
        // Actualizamos la posición del jugador según su velocidad actual (multiplicada por el deltaTime)
        jugador.posicion = 
        {
            x: jugador.posicion.x + jugador.velocidad.x * (Tick_Rate/1000),
            y: jugador.posicion.y + jugador.velocidad.y * (Tick_Rate/1000)
        }
    });
    
    //if(jugadores[0] !== undefined)
    //console.log(jugadores[0].Posicion);

    // Enviamos la informacion de todos los jugadores a todos los clientes
    io.sockets.emit('informacion_jugadores', jugadores);
}

// Aquí fijamos cada cuánto tiempo queremos que se ejecute Tick().
setInterval(Tick, Tick_Rate);
