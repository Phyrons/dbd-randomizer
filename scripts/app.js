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

const WS_URL = "ws://127.0.0.1:8090/";
const WS_RECONNECT_MS = 3000;

let ws = null;
let wsReconnectTimer = null;

function remoteLog(message) {
    if (!ws || ws.readyState !== WebSocket.OPEN) return;

    const payload = {
        evento: "chat",
        mensaje: typeof message === "object" ? JSON.stringify(message) : message
    };

    ws.send(JSON.stringify(payload));
}

function normalizarIdioma(idioma) {
    const valor = String(idioma ?? "").trim().toLowerCase();

    // Streamer.bot puede recibir/enviar "ing", mientras que la aplicación
    // utiliza "eng" internamente.
    if (valor === "eng" || valor === "ing" || valor === "en" || valor === "english") return "eng";
    if (valor === "esp" || valor === "es" || valor === "spanish") return "esp";

    return null;
}

function normalizarCategoria(categoria) {
    const valor = String(categoria ?? "").trim().toLowerCase();

    if (valor === "perksurv") return "perksurv";
    if (valor === "perkkiller") return "perkkiller";

    return null;
}

function cambiarIdiomaSistema(nuevoIdioma) {
    const idioma = normalizarIdioma(nuevoIdioma);
    if (!idioma) {
        console.warn("Idioma WS no reconocido:", nuevoIdioma);
        return;
    }

    state.idiomaActual = idioma;
    remoteLog(mensajesChat.idioma[state.idiomaActual]);
    actualizarIdiomaSlots();
}

function toggleIdioma() {
 const nuevoIdioma = state.idiomaActual === "eng" ? "esp" : "eng";
 cambiarIdiomaSistema(nuevoIdioma);
 
 // DETALLE 2: Actualizar el texto del botón en la UI para mantener sincronía
 const btn = document.getElementById("btn-idioma");
 if (btn) {
 btn.textContent = nuevoIdioma === "esp" ? "!lan esp" : "!lan eng";
 }
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

function procesarMensajeWS(eventData) {
    const data = typeof eventData === "string" ? JSON.parse(eventData) : eventData;

    if (!data || typeof data !== "object") {
        console.warn("Mensaje WS inválido:", eventData);
        return;
    }

    const evento = String(data.evento ?? "").trim().toUpperCase();

    console.log("📨 WS recibido:", data);

    switch (evento) {
        case "GIRAR_RULETA": {
            const categoria = normalizarCategoria(data.categoria);

            if (!categoria) {
                console.warn("GIRAR_RULETA sin categoría válida:", data.categoria);
                return;
            }

            // Los comandos actuales de Streamer.bot envían únicamente:
            // { evento: "GIRAR_RULETA", categoria: "perksurv/perkkiller" }
            procesarGiroRuleta(categoria, 0, remoteLog);
            break;
        }

        case "REROLL": {
            // Streamer.bot envía slot como número: 1, 2, 3 o 4.
            procesarReroll(data.slot, remoteLog, mensajesChat);
            break;
        }

        case "CAMBIAR_IDIOMA":
            // Acepta eng/esp y también ing/esp por compatibilidad con Streamer.bot.
            cambiarIdiomaSistema(data.idioma);
            break;

        default:
            console.log("Evento WS desconocido:", data.evento, data);
            break;
    }
}

function programarReconexiónWS() {
    if (wsReconnectTimer !== null) return;

    wsReconnectTimer = setTimeout(() => {
        wsReconnectTimer = null;
        iniciarWebSocket();
    }, WS_RECONNECT_MS);
}

function iniciarWebSocket() {
    if (ws && (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING)) {
        return;
    }

    console.log(`🔌 Conectando al WebSocket ${WS_URL}...`);
    ws = new WebSocket(WS_URL);

    ws.onopen = () => {
        console.log(`✅ Conectado al Servidor WebSocket: ${WS_URL}`);
    };

    ws.onmessage = event => {
        try {
            procesarMensajeWS(event.data);
        } catch (error) {
            console.error("❌ Error procesando mensaje WS:", error, event.data);
        }
    };

    ws.onerror = error => {
        console.error("❌ Error en WebSocket:", error);
    };

    ws.onclose = () => {
        console.warn("⚠️ WebSocket desconectado. Reintentando...");
        programarReconexiónWS();
    };
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
        cambiarCategoria("perksurv");
        iniciarWebSocket();
        console.log("DBD Randomizer iniciado correctamente.");
    } catch (error) {
        console.error("No se pudo iniciar DBD Randomizer:", error);
    }
}

iniciarAplicacion();
