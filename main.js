// Inicializacion de  la App
const app = new PIXI.Application({
    background: '#2E8B57', 
    resizeTo: window
});
document.body.appendChild(app.view);

// CONFIGURACIÓN 
const velocidad = 5;
const velocidadGiro = 0.07;
const radioSerpiente = 20; 
const espacioEntreCuerpo = 5; 

// VARIABLES DE JUEGO
let longitudSerpiente = 40; 
let manzanasComidas = 0;    
let colorSerpiente = 0x00FF00;
let juegoActivo = false; 
let inmunidad = false; // Variable para proteger al nacer

// URLs
const grassUrl = 'https://pixijs.com/assets/p2.jpeg'; 
const appleUrl = './assets/manzana.png';

// SONIDOS
const sonidoComer = new Audio('./assets/comer.mp3');
const sonidoChoque = new Audio('./assets/choque.mp3');
const musicaFondo = new Audio('./assets/fondo.mp3');

musicaFondo.loop = true;
musicaFondo.volume = 0.4;

(async () => {
    let appleTexture, grassTexture;
    try {
        grassTexture = await PIXI.Assets.load(grassUrl);
        appleTexture = await PIXI.Assets.load(appleUrl);
    } catch (e) { console.error(e); }

    const contenedorJuego = new PIXI.Container();
    contenedorJuego.sortableChildren = true;
    app.stage.addChild(contenedorJuego);

    //FONDO es una imagen de las de pixi una de sus bibliotecas 
    if (grassTexture) {
        const fondo = new PIXI.TilingSprite(grassTexture, app.screen.width, app.screen.height);
        fondo.tint = 0x888888;
        fondo.zIndex = -10;
        contenedorJuego.addChild(fondo);
    }

    // CUERPO
    const serpienteDibujo = new PIXI.Graphics();
    serpienteDibujo.zIndex = 1;
    contenedorJuego.addChild(serpienteDibujo);

    //OJOS
    const ojos = new PIXI.Container();
    const ojoIzq = new PIXI.Graphics().beginFill(0xFFFFFF).drawCircle(-8, -8, 6).endFill();
    const pupilaIzq = new PIXI.Graphics().beginFill(0x000000).drawCircle(-8, -8, 2).endFill();
    const ojoDer = new PIXI.Graphics().beginFill(0xFFFFFF).drawCircle(-8, 8, 6).endFill();
    const pupilaDer = new PIXI.Graphics().beginFill(0x000000).drawCircle(-8, 8, 2).endFill();
    ojos.addChild(ojoIzq, pupilaIzq, ojoDer, pupilaDer);
    ojos.zIndex = 2;
    contenedorJuego.addChild(ojos);

    // MANZANA
    let manzana;
    if (appleTexture) {
        manzana = new PIXI.Sprite(appleTexture);
    } else {
        manzana = new PIXI.Graphics().beginFill(0xFF0000).drawCircle(0,0,15).endFill();
    }
    manzana.anchor.set(0.5);
    manzana.scale.set(0.60);
    moverManzana();
    manzana.zIndex = 0;
    contenedorJuego.addChild(manzana);

    // la logica de posicion
    let cabezaVirtual = {
        x: app.screen.width / 2,
        y: app.screen.height / 2,
        rotation: -Math.PI / 2 // Apuntando hacia arriba al nacer
    };

    // Llenar historial INICIAL ESTIRADO
    let historia = [];
    for (let i = 0; i < 2000; i++) {
        // En lugar de ponerlos todos en el mismo punto, los ponemos en fila hacia abajo
        historia.push({ x: cabezaVirtual.x, y: cabezaVirtual.y + i });
    }

    const teclas = { izq: false, der: false, arriba: false };
    window.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') teclas.izq = true;
        if (e.key === 'ArrowRight') teclas.der = true;
        if (e.key === 'ArrowUp') teclas.arriba = true;
    });
    window.addEventListener('keyup', (e) => {
        if (e.key === 'ArrowLeft') teclas.izq = false;
        if (e.key === 'ArrowRight') teclas.der = false;
        if (e.key === 'ArrowUp') teclas.arriba = false;
    });

    // MENÚ Y REINICIO
    const btnJugar = document.getElementById('btn-jugar');
    const menuDiv = document.getElementById('menu-inicio');
    const marcadorDiv = document.getElementById('marcador');
    const tituloMenu = document.getElementById('titulo-menu');
    const textoMenu = document.getElementById('texto-menu');

    if (btnJugar) {
        btnJugar.addEventListener('click', () => {
            reiniciarJuego();
            
            menuDiv.style.display = 'none'; 
            marcadorDiv.style.display = 'block'; 
            juegoActivo = true; 

            // Audio
            musicaFondo.currentTime = 0;
            musicaFondo.play().catch(e => console.log(e));
            sonidoComer.volume = 0; sonidoComer.play().then(()=>{sonidoComer.pause(); sonidoComer.volume=1;});
            sonidoChoque.volume = 0; sonidoChoque.play().then(()=>{sonidoChoque.pause(); sonidoChoque.volume=1;});
        });
    }

    // FUNCIÓN PARA RESETEAR TODO AL PERDER
    function reiniciarJuego() {
        longitudSerpiente = 40;
        manzanasComidas = 0;
        colorSerpiente = 0x00FF00;
        
        // Centrar serpiente
        cabezaVirtual.x = app.screen.width / 2;
        cabezaVirtual.y = app.screen.height / 2;
        cabezaVirtual.rotation = -Math.PI / 2; // Mirando arriba

        // ESTIRAR LA SERPIENTE sino se muere jaja
        historia.length = 0;
        for (let i = 0; i < 2000; i++) {
            // Creamos la cola estirada hacia abajo (y + i)
            // Así la cabeza no toca la cola al nacer
            historia.push({ x: cabezaVirtual.x, y: cabezaVirtual.y + (i * 2) });
        }
        
        // Resetear texto marcador
        if (document.getElementById('marcador')) {
            document.getElementById('marcador').innerText = `Manzanas: 0  |  Tamaño: 40`;
        }

        // Dar inmunidad por 1 segundo
        inmunidad = true;
        setTimeout(() => { inmunidad = false; }, 1000);
    }

    function gameOver() {// mensaje cuando se pierde :(
        juegoActivo = false;
        musicaFondo.pause();
        sonidoChoque.currentTime = 0;
        sonidoChoque.play().catch(e => console.log(e));

        menuDiv.style.display = 'block';
        marcadorDiv.style.display = 'none';
        
        tituloMenu.innerText = "¡PERDISTE!";
        tituloMenu.style.color = "red";
        textoMenu.innerHTML = `Puntaje Final: ${manzanasComidas}<br>Inténtalo de nuevo`;
        btnJugar.innerText = "REINTENTAR";
    }

    // BUCLE PRINCIPAL
    app.ticker.add(() => {
        
        if (!juegoActivo) return; 

        // MOVER con las flechas y la velocidad aumentada para el movimiento rapido
        if (teclas.izq) cabezaVirtual.rotation -= velocidadGiro;
        if (teclas.der) cabezaVirtual.rotation += velocidadGiro;

        const vel = teclas.arriba ? velocidad * 1.5 : velocidad;
        cabezaVirtual.x += Math.cos(cabezaVirtual.rotation) * vel;
        cabezaVirtual.y += Math.sin(cabezaVirtual.rotation) * vel;

        // COLISIÓN CON PAREDES
        if (cabezaVirtual.x < 0 || cabezaVirtual.x > app.screen.width ||
            cabezaVirtual.y < 0 || cabezaVirtual.y > app.screen.height) {
            
            if (!inmunidad) { // Solo mata si no es inmune
                gameOver();
                return;
            } else {
                // Si es inmune y choca pared, rebota suave para no trabarse
                cabezaVirtual.rotation += Math.PI;
            }
        }

        // para actualizar el historial de la serpiente en cada movimiento
        historia.unshift({ x: cabezaVirtual.x, y: cabezaVirtual.y });
        const limiteDinamico = (longitudSerpiente * espacioEntreCuerpo) + 50;
        while (historia.length > limiteDinamico) {
            historia.pop();
        }

        // para crear o dibujar la serpiente y guardar su cresimiento
        serpienteDibujo.clear();
        serpienteDibujo.beginFill(colorSerpiente);
        
        for (let i = 0; i < longitudSerpiente; i++) {
            const index = i * espacioEntreCuerpo;
            const punto = historia[index];
            
            if (punto) {
                serpienteDibujo.drawCircle(punto.x, punto.y, radioSerpiente);

                // COLISIÓN CON EL CUERPO
                // para Verificar la colisión solo si no estamos en inmunidad y el segmento es lejano
                if (!inmunidad && i > 20) {
                    const dx = cabezaVirtual.x - punto.x;
                    const dy = cabezaVirtual.y - punto.y;
                    const distancia = Math.sqrt(dx*dx + dy*dy);

                    //  radioSerpiente - 5 para ser un poco permisivo
                    if (distancia < (radioSerpiente - 5)) {
                        gameOver();
                        return;
                    }
                }
            }
        }
        serpienteDibujo.endFill();

        // para mover los ojos como animacion
        const puntoCabeza = historia[0];
        if (puntoCabeza) {
            ojos.x = puntoCabeza.x;
            ojos.y = puntoCabeza.y;
            ojos.rotation = cabezaVirtual.rotation;
        }

        // para colision con la comida para cambiar el contador cada ves que come 
        if (colision(cabezaVirtual, manzana)) {
            moverManzana();
            sonidoComer.currentTime = 0;
            sonidoComer.play().catch(e => console.log(e));

            colorSerpiente = Math.random() * 0xFFFFFF;
            longitudSerpiente += 5; // para el cresimiento de la serpiente
            manzanasComidas += 1;   
            
            const marcador = document.getElementById('marcador');
            if (marcador) {
                marcador.innerText = `Manzanas: ${manzanasComidas}  |  Tamaño: ${longitudSerpiente}`;
            }
        }
    });

    function moverManzana() {// para cuando la manzana sea comida aperece de forma random
        manzana.x = Math.random() * (app.screen.width - 100) + 50;
        manzana.y = Math.random() * (app.screen.height - 100) + 50;
    }

    function colision(cabeza, item) {// colision con su propio cuerpo
        const dx = cabeza.x - item.x;
        const dy = cabeza.y - item.y;
        return Math.sqrt(dx*dx + dy*dy) < (radioSerpiente + 15);
    }
})();