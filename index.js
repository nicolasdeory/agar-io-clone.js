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
const Tamano_Mapa = 3000;
const Bolas_simultaneas = 200;
const Tamano_Inicial = 30;
const Tamano_Maximo = 800;
const Velocidad_Maxima = 500;
const Tick_Rate = 5;

/* VARIABLES DE ESTADO */
var jugadores = [];
var bolas = [];

/* EVENTOS DEL SERVIDOR */
io.on('connection', function(socket) {
    // Para cada nueva conexión...

    // Creamos un nuevo objeto jugador y lo añadimos a la lista de jugadores.

    // NO USAR MAYUSCULAS EN LOS NOMBRES DE MIEMBROS
    var jugadorNuevo = 
    {
        id: socket.id,
        color: Math.random() * 0xffffff, // Tono de color entre 0 y 1 (hue)
        tamano: Tamano_Inicial,
        puntuacion: 0,
        posicion: 
        { 
            x: Math.floor(Math.random() * Tamano_Mapa), // Asignamos una posicion aleatoria en el mapa
            y: Math.floor(Math.random() * Tamano_Mapa) 
        }, 
        velocidad: { x: 0, y: 0 }
    };
    
    jugadores.push(jugadorNuevo);
    

    // Cuando el jugador se desconecta...
    socket.on('disconnect', function() {
        MatarJugador(socket.id);
        console.log(jugadores);
    });

    socket.on('entrada', function(entrada) {
        var jugador = jugadores.find((x) => x.id == socket.id);
        if (jugador === undefined) return;
        // Procesamos la entrada y transformamos la direccion a velocidad.
        // Cuanto mas grande es la celula, mas lenta va.
        var velocidad_Celula = Math.floor(1500 * Math.pow(jugador.tamano,-0.439)); // Formula para determinar la velocidad sacada de agar.io
        jugador.velocidad = {
            x: entrada.direccion.x * velocidad_Celula,
            y: entrada.direccion.y * velocidad_Celula,
        };
    });

});

/** Elimina a un jugador de la partida. */
function MatarJugador(id) 
{
    var indiceJugador = jugadores.findIndex((x) => x.id == id);
    jugadores.splice(indiceJugador, 1);
    io.to(id).emit("has_muerto"); // Si el jugador existe, le avisamos de que ha muerto.
}

/** Calcula la distancia entre dos puntos. */
function Distancia(x1,y1,x2,y2) {
    return Math.sqrt(Math.pow(x2-x1,2) + Math.pow(y2-y1,2));
}

/** Genera n bolitas de energía. */
function GenerarBolas(n) 
{
    for(let i = 0; i < n; i++) {
        var bola =
        {
            x: Math.floor(Math.random() * Tamano_Mapa),
            y: Math.floor(Math.random() * Tamano_Mapa),
            color: Math.random() * 0xffffff
        }
        bolas.push(bola);
    }
}

/** Funcion que se ejecuta continuamente mientras el servidor esté encendido. */
function Tick() {

    // Para cada jugador conectado...
    jugadores.forEach((jugador) => {

        // Actualizamos la posición del jugador según su velocidad actual (multiplicada por el deltaTime)

        var posicionX = jugador.posicion.x + jugador.velocidad.x * (Tick_Rate / 1000);
        var posicionY = jugador.posicion.y + jugador.velocidad.y * (Tick_Rate / 1000);

        if (posicionX > Tamano_Mapa) posicionX = Tamano_Mapa; // Evitamos que se salga del mapa
        if (posicionX < 0) posicionX = 0;
        if (posicionY > Tamano_Mapa) posicionY = Tamano_Mapa;
        if (posicionY < 0) posicionY = 0;

        jugador.posicion =
            {
                x: posicionX,
                y: posicionY
            }

        // Comprobamos si nos comemos a algún jugador...
        for (let i = 0; i < jugadores.length; i++) {
            const otro = jugadores[i];
            if (jugador == otro || otro === undefined) continue; // Si somos nosotros mismos o 'otro' no existe, nos saltamos.
            var distancia = Distancia(jugador.posicion.x, jugador.posicion.y, otro.posicion.x, otro.posicion.y);
            if (distancia < (jugador.tamano - otro.tamano) && jugador.tamano > otro.tamano) { // SI LA DISTANCIA ENTRE ELLOS ES MENOR QUE SU DIFERENCIA DE TAMAÑO
                MatarJugador(otro.id);
                jugador.tamano += otro.tamano;
                if (jugador.tamano > Tamano_Maximo) jugador.tamano = Tamano_Maximo; // Comprobamos que el jugador no se pase del tamaño máximo.
            }
        }

        // Comprobamos si nos comemos a alguna bolita...
        for (let i = 0; i < bolas.length; i++) {
            const bolita = bolas[i];

            var distancia = Distancia(jugador.posicion.x, jugador.posicion.y, bolita.x, bolita.y);
            if (distancia < jugador.tamano) {
                bolas[i] = // Reemplazamos la bolita numero 'i' de la lista de bolas, por otra nueva, para que siempre haya X bolitas en el mapa.
                { 
                    x: Math.floor(Math.random() * Tamano_Mapa),
                    y: Math.floor(Math.random() * Tamano_Mapa),
                    color: Math.random() * 0xffffff
                } // Pista: En JavaScript, en vez de bolas[i], puedes escribir 'bolita' y funcionaría exactamente igual, porque apuntan al mismo objeto.

                jugador.tamano += 2; // Aumentamos en 2 el tamaño del jugador.
                if (jugador.tamano > Tamano_Maximo) jugador.tamano = Tamano_Maximo; // Comprobamos que el jugador no se pase del tamaño máximo.
            }
        }
    });

    // Enviamos la informacion de todos los jugadores a todos los clientes
    var informacion = 
    {
        jugadores: jugadores,
        bolas: bolas
    }
    io.sockets.emit('informacion_juego', informacion);
}


// Generamos las bolitas de energia
GenerarBolas(Bolas_simultaneas);

// Aquí fijamos cada cuánto tiempo queremos que se ejecute Tick().
setInterval(Tick, Tick_Rate);
