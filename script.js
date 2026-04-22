let listasGlobales = {};
let personajes = [];
let listaFinal = [];
let listaDisponible = [];

let ganadores = [];
let indiceSlotActual = 0;
let idiomaActual = "eng"; // "eng" por defecto, puede cambiar a "esp"

let categoriaActual = 'perksurv'; // Por defecto
let excluidosPorCategoria = {
    perksurv: [],
    perkkiller: []
};

const mensajesChat = {
    inicioGiro: {
        eng: "¡Starting roll for category: ",
        esp: "¡Comenzando giro para categoría: "
    },
	rerollDenegadoPorRuleta: {
		eng: "Reroll blocked: Wheel is spinning.",
		esp: "Reroll denegado: Ruleta en curso."
	},
    rerollDenegado: {
        eng: "Reroll denied: You must finish the initial roll first.",
        esp: "Reroll denegado: Debes terminar el giro inicial primero."
    },
    rerollIniciado: {
        eng: "Reroll started for slot: ",
        esp: "Reroll iniciado para el slot: "
    },
    idioma: {
        eng: "Spinner Language set to English",
        esp: "Idioma del Spinner actualizado a Espanol"
    }
};

// Función para cambiar de categoría desde los botones
function cambiarCategoria(nuevaCategoria) {
    categoriaActual = nuevaCategoria;
    console.log("Categoría cambiada a:", categoriaActual);
    
    // Actualizar los botones visualmente
    document.getElementById('btn-surv').classList.toggle('active', nuevaCategoria === 'perksurv');
    document.getElementById('btn-killer').classList.toggle('active', nuevaCategoria === 'perkkiller');
}

// Modifica tu función abrirPanelFiltros para usar la categoría actual
function abrirPanelFiltros() {
    const modal = document.getElementById('modal-filtros');
    const contenedor = document.getElementById('contenedor-checkboxes');
    contenedor.innerHTML = ""; // Limpiar

    // Obtener personajes únicos de la lista actual
    const personajes = [...new Set(listasGlobales[categoriaActual].map(p => p.personaje))];

    personajes.forEach(nombre => {
        const btn = document.createElement('button');
        btn.innerText = nombre;
        btn.className = 'btn-personaje';
        
        // Si ya estaba excluido, marcarlo
        if (excluidosPorCategoria[categoriaActual].includes(nombre)) {
            btn.classList.add('baneado');
        }

        btn.onclick = () => togglerBaneo(nombre, btn);
        contenedor.appendChild(btn);
    });

    modal.style.display = "flex";
}

function togglerBaneo(nombre, elemento) {
    const index = excluidosPorCategoria[categoriaActual].indexOf(nombre);
    if (index > -1) {
        excluidosPorCategoria[categoriaActual].splice(index, 1);
        elemento.classList.remove('baneado');
    } else {
        excluidosPorCategoria[categoriaActual].push(nombre);
        elemento.classList.add('baneado');
    }
}

// Al guardar, enviamos la info al sistema de la ruleta
function guardarFiltros() {
    console.log("Filtros guardados para", categoriaActual, ":", excluidosPorCategoria[categoriaActual]);
    document.getElementById('modal-filtros').style.display = "none";
    
    // Aquí podrías enviar un mensaje por websocket si fuera necesario avisar al OBS
}

const itemWidth = 280;

const pista = document.getElementById("pista-personajes");

const soundInicio = new Audio("sounds/inicio.mp3");
const soundClick = new Audio("sounds/click.mp3");

soundInicio.volume = 0.2;

// Cargar JSON
fetch('listas.json')
    .then(response => response.json())
    .then(data => {
        listasGlobales = data;
        console.log("Listas cargadas:", Object.keys(listasGlobales));
    });

// Función para enviar mensajes al chat vía WebSocket y C#
function remoteLog(message) {
    if (typeof ws !== 'undefined' && ws.readyState === WebSocket.OPEN) {
        const payload = {
            evento: "chat",
            mensaje: typeof message === 'object' ? JSON.stringify(message) : message
        };
        ws.send(JSON.stringify(payload));
    }
}

// WebSocket
const ws = new WebSocket("ws://127.0.0.1:8090/");

ws.onopen = () => console.log("Conectado al Servidor 8090")

// EJEMPLO DE COMO MANDAR MENSAJE POR WS AL STREAMERBOT
// Y CONSEGUIR EL sessionID
/*
ws.onopen = () => { console.log("Conectado al Servidor 8090")
 ws.send(JSON.stringify({
        evento: "REGISTER"
    }));
};
*/

ws.onmessage = (event) => {
    try {
        const data = JSON.parse(event.data);

        switch(data.evento) {
            case "GIRAR_RULETA":
                procesarGiroRuleta(data.categoria, data.baneos);
                break;
            
            case "REROLL":
                procesarReroll(data.slot);
                break;
            
            case "CAMBIAR_IDIOMA":
                cambiarIdiomaSistema(data.idioma);
                break;
                
            default:
                console.log("Evento desconocido:", data.evento);
        }
    } catch (e) {
        console.error("Error procesando mensaje WS:", e);
    }
};

// --- FUNCIONES MODULARES DEL SISTEMA ---

// Función 1: Prepara la lista, aplica baneos y arranca la ruleta
function procesarGiroRuleta(categoria, baneosSolicitadosWs) {
    remoteLog(mensajesChat.inicioGiro[idiomaActual] + categoria + "!");
    
    if (!listasGlobales[categoria] || Object.keys(listasGlobales).length === 0) return;

    // Parsear baneos: Si no mandan nada o es texto, por defecto es 0
    let baneosSolicitados = parseInt(baneosSolicitadosWs);
    if (isNaN(baneosSolicitados)) baneosSolicitados = 0;

    let listaCompleta = [...listasGlobales[categoria]];

    // 1. APLICAR BANEOS VISUALES (Seleccionados en la UI)
    const baneados = excluidosPorCategoria[categoria] || [];
    if (baneados.length > 0) {
        listaCompleta = listaCompleta.filter(p => !baneados.includes(p.personaje));
        console.log("Baneos visuales aplicados:", baneados.length);
    }

    // 2. CÁLCULO INTELIGENTE DE BANEOS MÁXIMOS
    // Regla de seguridad: Siempre deben quedar al menos 4 perks
    const maxBaneosPosibles = listaCompleta.length - 4;
    
    const baneosReales = Math.min(
        baneosSolicitados,
        maxBaneosPosibles > 0 ? maxBaneosPosibles : 0
    );

    // 3. MEZCLAR Y APLICAR BANEOS ALEATORIOS
    listaCompleta = mezclar(listaCompleta);
    if (baneosReales > 0) {
        listaCompleta.splice(0, baneosReales);
        console.log(`Se banearon ${baneosReales} perks aleatoriamente. Quedan ${listaCompleta.length} disponibles.`);
    }

    // 4. LÍMITE DE OPTIMIZACIÓN (Máximo 50 perks en la animación)
    const MAX_RULETA = 50;
    if (listaCompleta.length > MAX_RULETA) {
        listaCompleta = mezclar(listaCompleta).slice(0, MAX_RULETA);
        console.log(`Lista limitada a ${MAX_RULETA} perks para optimizar rendimiento.`);
    }

    // 5. ASIGNAR Y COMENZAR
    personajes = listaCompleta;
    prepararYSimular();
}

// Función 2: Ejecuta un reroll sobre un slot específico
function procesarReroll(slotStr) {
    // Solo permitir si ya se completó la ruleta inicial (4 slots)
    if (indiceSlotActual < 4) {
        remoteLog(mensajesChat.rerollDenegadoPorRuleta[idiomaActual]);
        return;
    }

    const slotTarget = parseInt(slotStr) - 1; // Convertir 1-4 a 0-3
    if (slotTarget >= 0 && slotTarget <= 3) {
        remoteLog(mensajesChat.rerollIniciado[idiomaActual] + slotStr);
        
        // Quitamos la clase para que vuelva a crecer al ganar
        const nombreEl = document.querySelector(`#slot-${slotTarget} .nombre-ganador`);
        if(nombreEl) nombreEl.classList.remove('revelado');
        
        girarRuleta(slotTarget);
    }
}

// Función 3: Actualiza el idioma en caliente
function cambiarIdiomaSistema(nuevoIdioma) {
    if (nuevoIdioma === "esp" || nuevoIdioma === "eng") {
        idiomaActual = nuevoIdioma;
        remoteLog(mensajesChat.idioma[idiomaActual]);
        actualizarIdiomaSlots(); 
    }
}

ws.onerror = (err) => console.error("Error en WS:", err);
ws.onclose = () => console.log("WS Desconectado");

// Mezclar (Fisher-Yates)
function mezclar(array) {
    let m = array.length, t, i;
    while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
    }
    return array;
}

// INICIO GLOBAL
function prepararYSimular() {
    ganadores = [];
    indiceSlotActual = 0;

    listaDisponible = [...personajes];

    limpiarSlots();

    soundInicio.play().catch(() => {});

    iniciarSiguienteGiro();
}

// LIMPIAR UI
function limpiarSlots() {
    for (let i = 0; i < 4; i++) {
        const slot = document.getElementById(`slot-${i}`);
        slot.classList.remove("activo");
        slot.querySelector("img").src = "img/logodbd.webp";
        slot.querySelector(".nombre-ganador").textContent = "?";
        slot.querySelector(".personaje-ganador").textContent = "";
    }
}

// ACTUALIZAR TEXTOS EN PANTALLA
function actualizarIdiomaSlots() {
    ganadores.forEach((personaje, index) => {
        if (personaje) {
            const slot = document.getElementById(`slot-${index}`);
            const nombre = slot.querySelector(".nombre-ganador");
            if (nombre) {
                nombre.textContent = (idiomaActual === "esp" && personaje.nombre_es) ? personaje.nombre_es : personaje.nombre;
            }
        }
    });
}

// CONTROL DE GIROS
function iniciarSiguienteGiro() {
    if (indiceSlotActual >= 4) {
        console.log("Todos los ganadores listos");
        return;
    }

    listaDisponible = mezclar([...listaDisponible]);

    construirPista(listaDisponible);

    setTimeout(() => {
        girar();
    }, 100);
}

// CONSTRUIR RULETA
function construirPista(listaBase) {
    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.innerHTML = "";

    let listaExtendida = [];

    for (let i = 0; i < 10; i++) {
        listaExtendida = listaExtendida.concat(listaBase);
    }

    listaFinal = listaExtendida;

    listaFinal.forEach(p => {
        const div = document.createElement("div");
        div.className = "item-personaje";
        div.innerHTML = `<img src="img/${p.archivo}" alt="${p.nombre}">`;
        pista.appendChild(div);
    });
}

function girarRuleta(forcedIndex) {
    if (!listaDisponible.length) return;

    listaDisponible = mezclar([...listaDisponible]);
    construirPista(listaDisponible);

    setTimeout(() => {
        girar(forcedIndex);
    }, 100);
}

// GIRO
function girar(forcedIndex = null) {
    const totalItems = listaFinal.length;
    const wrapperWidth = document.querySelector('.selector-wrapper').offsetWidth;
    const tiempoGiroMs = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;

    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.offsetHeight;

    pista.style.transition = `transform ${tiempoGiroMs}ms cubic-bezier(0.1, 0, 0.1, 1)`;

    const indiceGanadorReal =
        Math.floor(Math.random() * listaDisponible.length) +
        (totalItems - listaDisponible.length * 2);

    const desplazamientoFinal =
        (indiceGanadorReal * itemWidth) +
        (itemWidth / 2) -
        (wrapperWidth / 2);

    pista.style.transform = `translateX(-${desplazamientoFinal}px)`;

    let ultimoItemMarcado = -1;

    const intervalClick = setInterval(() => {
        const style = window.getComputedStyle(pista);
        const matrix = new WebKitCSSMatrix(style.transform);
        const currentX = Math.abs(matrix.m41);

        const itemActual = Math.floor((currentX + (wrapperWidth / 2)) / itemWidth);

        if (itemActual !== ultimoItemMarcado && itemActual < totalItems) {
            const clonClick = soundClick.cloneNode();
            clonClick.volume = 0.4;
            clonClick.play().catch(() => {});
            ultimoItemMarcado = itemActual;
        }
    }, 45);

    setTimeout(() => {
        clearInterval(intervalClick);

        const probabilidad = Math.random();

        if (probabilidad <= 0.5) {
            setTimeout(() => {
                const espaciosRetroceso = Math.floor(Math.random() * 2) + 1;
                const nuevoIndice = indiceGanadorReal - espaciosRetroceso;

                const nuevoDesplazamiento =
                    (nuevoIndice * itemWidth) +
                    (itemWidth / 2) -
                    (wrapperWidth / 2);

                pista.style.transition = `transform 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95)`;
                pista.style.transform = `translateX(-${nuevoDesplazamiento}px)`;

                setTimeout(() => {
                    const clonClick = soundClick.cloneNode();
                    clonClick.volume = 0.6;
                    clonClick.play().catch(() => {});
                }, 400);

                setTimeout(() => {
                    mostrarGanador(listaFinal[nuevoIndice], forcedIndex);
                }, 1300);

            }, 500);
        } else {
            mostrarGanador(listaFinal[indiceGanadorReal], forcedIndex);
        }

    }, tiempoGiroMs + 200);
}

// MOSTRAR GANADOR
function mostrarGanador(personaje, forcedIndex = null) {
    const audioVictoria = new Audio("sounds/skillcheck.mp3");
    audioVictoria.volume = 0.3;
    audioVictoria.play().catch(() => {});

    // ?? Determinar qué slot usar
    const indexParaUsar = (forcedIndex !== null) ? forcedIndex : indiceSlotActual;

    const slot = document.getElementById(`slot-${indexParaUsar}`);
    const img = slot.querySelector("img");
    const nombre = slot.querySelector(".nombre-ganador");
    const personajeTxt = slot.querySelector(".personaje-ganador");

    // ?? Si es reroll, devolver el anterior a la lista
    if (forcedIndex !== null) {
        const anterior = ganadores[forcedIndex];
        if (anterior) {
            listaDisponible.push(anterior);
        }
        ganadores[forcedIndex] = personaje;
    } else {
        ganadores.push(personaje);
    }

    img.src = `img/${personaje.archivo}`;
    // Si el idioma es español y existe el campo, úsalo. Si no, usa el original (inglés).
    nombre.textContent = (idiomaActual === "esp" && personaje.nombre_es) ? personaje.nombre_es : personaje.nombre;
    personajeTxt.textContent = personaje.personaje;

    slot.classList.add("activo");

    // eliminar de lista
    listaDisponible = listaDisponible.filter(p => p.nombre !== personaje.nombre);

    // avanzar solo si NO es reroll
    if (forcedIndex === null) {
        indiceSlotActual++;

        setTimeout(() => {
            iniciarSiguienteGiro();
        }, 1500);
    }
}

// Función auxiliar para el botón de la web que alterna el idioma
function toggleIdioma() {
    const nuevoIdioma = idiomaActual === "eng" ? "esp" : "eng";
    cambiarIdiomaSistema(nuevoIdioma);
}

// Variable global para rastrear qué slot de reroll está seleccionado (por defecto el 1)
let slotRerollSeleccionado = 1;

// Función para cambiar visualmente el número seleccionado
function seleccionarSlotReroll(numero) {
    slotRerollSeleccionado = numero;
    
    // Actualizar botones visualmente (reutilizando tus clases de categoría)
    for (let i = 1; i <= 4; i++) {
        const btn = document.getElementById(`num-${i}`);
        if (btn) {
            btn.classList.toggle('active', i === numero);
        }
    }
    console.log("Slot preparado para reroll:", slotRerollSeleccionado);
}

// Función que ejecuta el reroll basado en la selección actual
function ejecutarRerollSeleccionado() {
    if (indiceSlotActual < 4) {
        remoteLog(mensajesChat.rerollDenegado[idiomaActual]);
        return;
    }
    
    // Llamamos a la función que ya tenías creada
    procesarReroll(slotRerollSeleccionado.toString());
}
