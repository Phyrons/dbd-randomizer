import { state } from "./state.js";

const CATEGORIA_GRUPOS = {
    perksurv: "survivors",
    perkkiller: "killers"
};

function obtenerGruposActuales() {
    const tipo = CATEGORIA_GRUPOS[state.categoriaActual];
    return state.grupos?.[tipo]?.grupos || [];
}

function obtenerTodosLosPersonajes(grupo) {
    const directos = grupo.personajes || [];
    const subgrupos = (grupo.subgrupos || []).flatMap(subgrupo => subgrupo.personajes || []);
    return [...new Set([...directos, ...subgrupos])];
}

function estaExcluido(nombre) {
    return state.excluidosPorCategoria[state.categoriaActual].includes(nombre);
}

function crearCheckbox(labelText, checked, className = "") {
    const label = document.createElement("label");
    label.className = `filtro-checkbox ${className}`.trim();

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = checked;

    const text = document.createElement("span");
    text.textContent = labelText;

    label.append(input, text);
    return { label, input };
}

function establecerExclusion(nombre, excluir) {
    const excluidos = state.excluidosPorCategoria[state.categoriaActual];
    const index = excluidos.indexOf(nombre);

    if (excluir && index === -1) {
        excluidos.push(nombre);
    } else if (!excluir && index !== -1) {
        excluidos.splice(index, 1);
    }
}

function establecerExclusionGrupo(personajes, excluir) {
    personajes.forEach(nombre => establecerExclusion(nombre, excluir));
}

function actualizarEstadoGrupo(input, personajes) {
    if (!personajes.length) {
        input.checked = true;
        input.indeterminate = false;
        return;
    }

    const excluidos = personajes.filter(nombre => estaExcluido(nombre)).length;
    input.checked = excluidos === 0;
    input.indeterminate = excluidos > 0 && excluidos < personajes.length;
}

function renderizarPersonaje(nombre, contenedor, controlesGrupo) {
    const { label, input } = crearCheckbox(nombre, !estaExcluido(nombre), "filtro-personaje");

    input.addEventListener("change", () => {
        establecerExclusion(nombre, !input.checked);
        controlesGrupo.forEach(({ input: grupoInput, personajes }) => {
            actualizarEstadoGrupo(grupoInput, personajes);
        });
    });

    contenedor.appendChild(label);
}

function renderizarGrupo(grupo, nivel = 0, controlesGrupo = []) {
    const detalles = document.createElement("details");
    detalles.className = `filtro-grupo nivel-${nivel}`.trim();
    detalles.open = true;

    const resumen = document.createElement("summary");
    const personajes = obtenerTodosLosPersonajes(grupo);

    const { label, input } = crearCheckbox(
        grupo.nombre,
        personajes.length === 0 || personajes.every(nombre => !estaExcluido(nombre)),
        "filtro-grupo-checkbox"
    );

    label.addEventListener("click", event => event.stopPropagation());

    input.addEventListener("change", () => {
        establecerExclusionGrupo(personajes, !input.checked);
        renderizarEstadoCompleto();
    });

    resumen.appendChild(label);
    detalles.appendChild(resumen);

    const contenido = document.createElement("div");
    contenido.className = "filtro-grupo-contenido";

    controlesGrupo.push({ input, personajes });

    if (grupo.personajes?.length) {
        grupo.personajes.forEach(nombre => renderizarPersonaje(nombre, contenido, controlesGrupo));
    }

    if (grupo.subgrupos?.length) {
        grupo.subgrupos.forEach(subgrupo => {
            contenido.appendChild(renderizarGrupo(subgrupo, nivel + 1, controlesGrupo));
        });
    }

    detalles.appendChild(contenido);
    return detalles;
}

let ultimoContenedor = null;

function renderizarEstadoCompleto() {
    if (!ultimoContenedor) return;

    const modal = document.getElementById("modal-filtros");
    const contenedor = ultimoContenedor;
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
        state.sinPerkHabilitadoPorCategoria[categoria] =
            !state.sinPerkHabilitadoPorCategoria[categoria];
        actualizarEstadoSinPerk();
    });

    contenedor.appendChild(sinPerkButton);

    const separador = document.createElement("div");
    separador.className = "filtro-separador";
    separador.textContent = "CHARACTERS";
    contenedor.appendChild(separador);

    const grupos = obtenerGruposActuales();
    const controlesGrupo = [];

    grupos.forEach(grupo => contenedor.appendChild(renderizarGrupo(grupo, 0, controlesGrupo)));

    modal.style.display = "flex";
}

export function abrirPanelFiltros() {
    const contenedor = document.getElementById("contenedor-checkboxes");
    if (!contenedor) return;

    ultimoContenedor = contenedor;
    renderizarEstadoCompleto();
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
