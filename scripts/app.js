import { state } from "./state.js";
import { mensajesChat } from "./config.js";
import { cargarListas } from "./data.js";
import { abrirPanelFiltros, guardarFiltros, cerrarPanelFiltros } from "./filters.js";
import { procesarGiroRuleta, procesarReroll } from "./roulette.js";
import {
    actualizarIdiomaSlots,
    prepararControlesUI,
    cambiarCategoria
} from "./ui.js";

let ws = null;

function remoteLog(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
        evento: "chat",
        mensaje: typeof message === "object" ? JSON.stringify(message) : message
    };

    ws.send(JSON.stringify(payload));
}

function cambiarIdiomaSistema(nuevoIdioma) {
    if (nuevoIdioma !== "esp" && nuevoIdioma !== "eng") return;

    state.idiomaActual = nuevoIdioma;
    remoteLog(mensajesChat.idioma[state.idiomaActual]);
    actualizarIdiomaSlots();
}

function toggleIdioma() {
    const nuevoIdioma = state.idiomaActual === "eng" ? "esp" : "eng";
    cambiarIdiomaSistema(nuevoIdioma);
}

function ejecutarRerollSeleccionado() {
    if (state.indiceSlotActual < 4) {
        remoteLog(mensajesChat.rerollDenegado[state.idiomaActual]);
        return;
    }

    procesarReroll(
        String(state.slotRerollSeleccionado),
        remoteLog,
        mensajesChat
    );
}

function iniciarWebSocket() {
    ws = new WebSocket("ws://127.0.0.1:8090/");

    ws.onopen = () => console.log("Conectado al Servidor 8090");

    ws.onmessage = event => {
        try {
            const data = JSON.parse(event.data);

            switch (data.evento) {
                case "GIRAR_RULETA":
                    procesarGiroRuleta(data.categoria, data.baneos, remoteLog);
                    break;

                case "REROLL":
                    procesarReroll(data.slot, remoteLog, mensajesChat);
                    break;

                case "CAMBIAR_IDIOMA":
                    cambiarIdiomaSistema(data.idioma);
                    break;

                default:
                    console.log("Evento desconocido:", data.evento);
            }
        } catch (error) {
            console.error("Error procesando mensaje WS:", error);
        }
    };

    ws.onerror = error => console.error("Error en WS:", error);
    ws.onclose = () => console.log("WS Desconectado");
}

function iniciarInterfaz() {
    prepararControlesUI({
        onRollSurvivor: () => procesarGiroRuleta("perksurv", 0, remoteLog),
        onRollKiller: () => procesarGiroRuleta("perkkiller", 0, remoteLog),
        onReroll: ejecutarRerollSeleccionado,
        onFilters: abrirPanelFiltros,
        onIdioma: toggleIdioma
    });

    document.getElementById("btn-guardar-filtros")?.addEventListener("click", guardarFiltros);
    document.getElementById("btn-cerrar-filtros")?.addEventListener("click", cerrarPanelFiltros);
}

async function iniciarAplicacion() {
    try {
        await cargarListas();
        iniciarInterfaz();
        iniciarWebSocket();
        cambiarCategoria("perksurv");
        console.log("DBD Randomizer iniciado correctamente.");
    } catch (error) {
        console.error("No se pudo iniciar DBD Randomizer:", error);
    }
}

iniciarAplicacion();
