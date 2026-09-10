import { state } from "./state.js";
import { ITEM_WIDTH, MAX_RULETA, SIN_PERK, TOTAL_SLOTS } from "./config.js";
import { mezclar } from "./utils.js";
import { reproducirClick, reproducirInicio, reproducirVictoria } from "./audio.js";
import { limpiarSlots } from "./ui.js";

const pista = document.getElementById("pista-personajes");

export function procesarGiroRuleta(categoria, baneosSolicitadosWs = 0, remoteLog = () => {}) {
    if (!state.listasGlobales[categoria]) return;

    state.categoriaActual = categoria;
    remoteLog(`¡${state.idiomaActual === "esp" ? "Comenzando giro para categoría: " : "Starting roll for category: "}${categoria}!`);

    let baneosSolicitados = parseInt(baneosSolicitadosWs, 10);
    if (Number.isNaN(baneosSolicitados)) baneosSolicitados = 0;

    let listaCompleta = [...state.listasGlobales[categoria]];

    const baneados = state.excluidosPorCategoria[categoria] || [];
    if (baneados.length > 0) {
        listaCompleta = listaCompleta.filter(p => !baneados.includes(p.personaje));
    }

    const maxBaneosPosibles = listaCompleta.length - TOTAL_SLOTS;
    const baneosReales = Math.min(
        baneosSolicitados,
        maxBaneosPosibles > 0 ? maxBaneosPosibles : 0
    );

    listaCompleta = mezclar(listaCompleta);

    if (baneosReales > 0) {
        listaCompleta.splice(0, baneosReales);
    }

    if (listaCompleta.length > MAX_RULETA) {
        listaCompleta = mezclar(listaCompleta).slice(0, MAX_RULETA);
    }

    state.personajes = listaCompleta;
    prepararYSimular();
}

export function procesarReroll(slotStr, remoteLog = () => {}, mensajesChat = null) {
    if (state.indiceSlotActual < TOTAL_SLOTS) {
        const mensaje = mensajesChat?.rerollDenegadoPorRuleta?.[state.idiomaActual]
            || "Reroll blocked: Wheel is spinning.";
        remoteLog(mensaje);
        return;
    }

    const slotTarget = parseInt(slotStr, 10) - 1;
    if (slotTarget < 0 || slotTarget >= TOTAL_SLOTS) return;

    const mensaje = mensajesChat?.rerollIniciado?.[state.idiomaActual] || "Reroll started for slot: ";
    remoteLog(mensaje + slotStr);

    document.querySelector(`#slot-${slotTarget} .nombre-ganador`)?.classList.remove("revelado");
    girarRuleta(slotTarget);
}

function prepararYSimular() {
    state.ganadores = [];
    state.indiceSlotActual = 0;
    state.listaDisponible = [...state.personajes];

    limpiarSlots();
    reproducirInicio();
    iniciarSiguienteGiro();
}

function iniciarSiguienteGiro() {
    if (state.indiceSlotActual >= TOTAL_SLOTS) return;

    state.listaDisponible = mezclar([...state.listaDisponible]);
    construirPista(state.listaDisponible);

    setTimeout(() => girar(), 100);
}

function construirPista(listaBase) {
    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.innerHTML = "";

    const sinPerkActivo = state.sinPerkHabilitadoPorCategoria[state.categoriaActual];
    const base = sinPerkActivo ? [...listaBase, SIN_PERK] : [...listaBase];
    const listaExtendida = [];

    for (let i = 0; i < 10; i++) {
        listaExtendida.push(...base);
    }

    state.listaFinal = listaExtendida;

    state.listaFinal.forEach(perk => {
        const div = document.createElement("div");
        div.className = "item-personaje";

        if (perk.sinPerk) {
            div.classList.add("item-sin-perk");
            div.innerHTML = "<span>Sin Perk</span>";
        } else {
            div.innerHTML = `<img src="img/${perk.archivo}" alt="${perk.nombre}">`;
        }

        pista.appendChild(div);
    });
}

function girarRuleta(forcedIndex) {
    if (!state.listaDisponible.length) return;

    state.listaDisponible = mezclar([...state.listaDisponible]);
    construirPista(state.listaDisponible);

    setTimeout(() => girar(forcedIndex), 100);
}

function girar(forcedIndex = null) {
    const totalItems = state.listaFinal.length;
    const wrapperWidth = document.querySelector(".selector-wrapper").offsetWidth;
    const tiempoGiroMs = Math.floor(Math.random() * (8000 - 5000 + 1)) + 5000;

    const sinPerkActivo = state.sinPerkHabilitadoPorCategoria[state.categoriaActual];
    const saleSinPerk = sinPerkActivo && Math.random() < 0.25;
    const cantidadNormales = state.listaDisponible.length;
    const cantidadBase = cantidadNormales + (sinPerkActivo ? 1 : 0);

    if (cantidadBase <= 0) return;

    const inicioObjetivo = totalItems - cantidadBase * 2;
    const indiceBase = saleSinPerk
        ? cantidadNormales
        : Math.floor(Math.random() * cantidadNormales);
    const indiceGanadorReal = inicioObjetivo + indiceBase;

    const desplazamientoFinal =
        indiceGanadorReal * ITEM_WIDTH +
        ITEM_WIDTH / 2 -
        wrapperWidth / 2;

    pista.style.transition = "none";
    pista.style.transform = "translateX(0px)";
    pista.offsetHeight;

    pista.style.transition = `transform ${tiempoGiroMs}ms cubic-bezier(0.1, 0, 0.1, 1)`;
    pista.style.transform = `translateX(-${desplazamientoFinal}px)`;

    let ultimoItemMarcado = -1;

    const intervalClick = setInterval(() => {
        const matrix = new WebKitCSSMatrix(window.getComputedStyle(pista).transform);
        const currentX = Math.abs(matrix.m41);
        const itemActual = Math.floor((currentX + wrapperWidth / 2) / ITEM_WIDTH);

        if (itemActual !== ultimoItemMarcado && itemActual < totalItems) {
            reproducirClick(0.4);
            ultimoItemMarcado = itemActual;
        }
    }, 45);

    setTimeout(() => {
        clearInterval(intervalClick);

        const maxRetroceso = Math.min(2, indiceBase);
        const debeRetroceder = Math.random() <= 0.5 && !saleSinPerk && maxRetroceso > 0;

        if (debeRetroceder) {
            setTimeout(() => {
                const espaciosRetroceso = Math.floor(Math.random() * maxRetroceso) + 1;
                const nuevoIndice = indiceGanadorReal - espaciosRetroceso;
                const nuevoDesplazamiento =
                    nuevoIndice * ITEM_WIDTH +
                    ITEM_WIDTH / 2 -
                    wrapperWidth / 2;

                pista.style.transition = "transform 1.2s cubic-bezier(0.45, 0.05, 0.55, 0.95)";
                pista.style.transform = `translateX(-${nuevoDesplazamiento}px)`;

                setTimeout(() => reproducirClick(0.6), 400);
                setTimeout(() => mostrarGanador(state.listaFinal[nuevoIndice], forcedIndex), 1300);
            }, 500);
        } else {
            mostrarGanador(state.listaFinal[indiceGanadorReal], forcedIndex);
        }
    }, tiempoGiroMs + 200);
}

function mostrarGanador(perk, forcedIndex = null) {
    reproducirVictoria();

    const indexParaUsar = forcedIndex !== null ? forcedIndex : state.indiceSlotActual;
    const slot = document.getElementById(`slot-${indexParaUsar}`);
    if (!slot) return;

    const img = slot.querySelector("img");
    const nombre = slot.querySelector(".nombre-ganador");
    const personajeTxt = slot.querySelector(".personaje-ganador");

    if (forcedIndex !== null) {
        const anterior = state.ganadores[forcedIndex];
        if (anterior && !anterior.sinPerk) {
            state.listaDisponible.push(anterior);
        }
        state.ganadores[forcedIndex] = perk;
    } else {
        state.ganadores.push(perk);
    }

    if (perk.sinPerk) {
        img.src = "img/logodbd.webp";
        nombre.textContent = "Sin Perk";
        personajeTxt.textContent = "";
    } else {
        img.src = `img/${perk.archivo}`;
        nombre.textContent = state.idiomaActual === "esp" && perk.nombre_es
            ? perk.nombre_es
            : perk.nombre;
        personajeTxt.textContent = perk.personaje;
        state.listaDisponible = state.listaDisponible.filter(p => p.nombre !== perk.nombre);
    }

    slot.classList.add("activo");

    if (forcedIndex === null) {
        state.indiceSlotActual++;
        setTimeout(() => iniciarSiguienteGiro(), 1500);
    }
}
