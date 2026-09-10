import { state } from "./state.js";
import { TOTAL_SLOTS } from "./config.js";

export function cambiarCategoria(nuevaCategoria) {
    if (!state.listasGlobales[nuevaCategoria]) return;

    state.categoriaActual = nuevaCategoria;

    document.getElementById("btn-surv")?.classList.toggle("active", nuevaCategoria === "perksurv");
    document.getElementById("btn-killer")?.classList.toggle("active", nuevaCategoria === "perkkiller");
}

export function limpiarSlots() {
    for (let i = 0; i < TOTAL_SLOTS; i++) {
        const slot = document.getElementById(`slot-${i}`);
        if (!slot) continue;

        slot.classList.remove("activo");
        slot.querySelector("img").src = "img/logodbd.webp";
        slot.querySelector(".nombre-ganador").textContent = "?";
        slot.querySelector(".personaje-ganador").textContent = "";
    }
}

export function actualizarIdiomaSlots() {
    state.ganadores.forEach((personaje, index) => {
        if (!personaje || personaje.sinPerk) return;

        const slot = document.getElementById(`slot-${index}`);
        const nombre = slot?.querySelector(".nombre-ganador");

        if (nombre) {
            nombre.textContent = state.idiomaActual === "esp" && personaje.nombre_es
                ? personaje.nombre_es
                : personaje.nombre;
        }
    });
}

export function seleccionarSlotReroll(numero) {
    if (numero < 1 || numero > TOTAL_SLOTS) return;

    state.slotRerollSeleccionado = numero;

    for (let i = 1; i <= TOTAL_SLOTS; i++) {
        document.getElementById(`num-${i}`)?.classList.toggle("active", i === numero);
    }
}

export function prepararControlesUI({ onRollSurvivor, onRollKiller, onReroll, onFilters, onIdioma }) {
    document.getElementById("btn-surv")?.addEventListener("click", () => cambiarCategoria("perksurv"));
    document.getElementById("btn-killer")?.addEventListener("click", () => cambiarCategoria("perkkiller"));
    document.querySelector(".comando-box.azul")?.addEventListener("click", onFilters);
    document.querySelector(".comando-box.dorado")?.addEventListener("click", onIdioma);
    document.querySelectorAll("#num-1, #num-2, #num-3, #num-4").forEach((button, index) => {
        button.addEventListener("click", () => seleccionarSlotReroll(index + 1));
    });

    const cajasBig = document.querySelectorAll(".fila:last-child .comando-box.big.blanco");
    if (cajasBig[0]) cajasBig[0].addEventListener("click", onRollSurvivor);
    if (cajasBig[1]) cajasBig[1].addEventListener("click", onReroll);
    if (cajasBig[2]) cajasBig[2].addEventListener("click", onRollKiller);
}
