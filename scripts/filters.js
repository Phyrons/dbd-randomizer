import { state } from "./state.js";

function obtenerPersonajesDisponibles() {
    return [...new Set((state.listasGlobales[state.categoriaActual] || []).map(p => p.personaje))];
}

export function abrirPanelFiltros() {
    const modal = document.getElementById("modal-filtros");
    const contenedor = document.getElementById("contenedor-checkboxes");

    if (!modal || !contenedor) return;

    contenedor.innerHTML = "";

    const sinPerkButton = document.createElement("button");
    sinPerkButton.type = "button";
    sinPerkButton.className = "btn-personaje filtro-sin-perk";

    const actualizarEstadoSinPerk = () => {
        const activo = state.sinPerkHabilitadoPorCategoria[state.categoriaActual];
        sinPerkButton.textContent = `SIN PERK: ${activo ? "ON" : "OFF"}`;
        sinPerkButton.classList.toggle("sin-perk-activo", activo);
    };

    actualizarEstadoSinPerk();

    sinPerkButton.addEventListener("click", () => {
        const categoria = state.categoriaActual;
        state.sinPerkHabilitadoPorCategoria[categoria] = !state.sinPerkHabilitadoPorCategoria[categoria];
        actualizarEstadoSinPerk();
    });

    contenedor.appendChild(sinPerkButton);

    const separador = document.createElement("div");
    separador.className = "filtro-separador";
    separador.textContent = "CHARACTERS";
    contenedor.appendChild(separador);

    obtenerPersonajesDisponibles().forEach(nombre => {
        const button = document.createElement("button");
        button.type = "button";
        button.textContent = nombre;
        button.className = "btn-personaje";

        if (state.excluidosPorCategoria[state.categoriaActual].includes(nombre)) {
            button.classList.add("baneado");
        }

        button.addEventListener("click", () => togglerBaneo(nombre, button));
        contenedor.appendChild(button);
    });

    modal.style.display = "flex";
}

function togglerBaneo(nombre, elemento) {
    const baneados = state.excluidosPorCategoria[state.categoriaActual];
    const index = baneados.indexOf(nombre);

    if (index > -1) {
        baneados.splice(index, 1);
        elemento.classList.remove("baneado");
    } else {
        baneados.push(nombre);
        elemento.classList.add("baneado");
    }
}

export function guardarFiltros() {
    const categoria = state.categoriaActual;

    console.log(
        "Filtros guardados para",
        categoria,
        ":",
        state.excluidosPorCategoria[categoria],
        "| Sin Perk:",
        state.sinPerkHabilitadoPorCategoria[categoria]
    );

    document.getElementById("modal-filtros").style.display = "none";
}

export function cerrarPanelFiltros() {
    document.getElementById("modal-filtros").style.display = "none";
}
