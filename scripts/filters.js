import { state } from "./state.js";

const CATEGORIA_GRUPOS = {
    perksurv: "survivors",
    perkkiller: "killers"
};

function obtenerGruposActuales() {
    const tipo = CATEGORIA_GRUPOS[state.categoriaActual];
    return state.grupos?.[tipo]?.grupos || [];
}

function obtenerPersonajesDeGrupo(grupo) {
    return [...new Set(grupo.personajes || [])];
}

function estaExcluido(nombre) {
    return state.excluidosPorCategoria[state.categoriaActual].includes(nombre);
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

function crearControlPersonaje(nombre) {
    const label = document.createElement("label");
    label.className = "filtro-personaje-item";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !estaExcluido(nombre);
    input.setAttribute("aria-label", `Include ${nombre}`);

    const texto = document.createElement("span");
    texto.textContent = nombre;

    label.append(input, texto);

    input.addEventListener("change", () => {
        establecerExclusion(nombre, !input.checked);
        label.classList.toggle("excluido", !input.checked);
    });

    label.classList.toggle("excluido", !input.checked);
    return label;
}

function crearGrupoPersonajes(grupo) {
    const seccion = document.createElement("section");
    seccion.className = "filtro-grupo-card";

    const titulo = document.createElement("div");
    titulo.className = "filtro-grupo-titulo";
    titulo.textContent = grupo.nombre;
    seccion.appendChild(titulo);

    const personajes = document.createElement("div");
    personajes.className = "filtro-grupo-personajes";

    obtenerPersonajesDeGrupo(grupo).forEach(nombre => {
        personajes.appendChild(crearControlPersonaje(nombre));
    });

    if (!personajes.children.length) {
        const vacio = document.createElement("span");
        vacio.className = "filtro-grupo-vacio";
        vacio.textContent = "No characters";
        personajes.appendChild(vacio);
    }

    seccion.appendChild(personajes);
    return seccion;
}

function crearBloqueAnual(grupo) {
    const bloque = document.createElement("section");
    bloque.className = "filtro-bloque-anual";

    const titulo = document.createElement("div");
    titulo.className = "filtro-ano-titulo";
    titulo.textContent = grupo.nombre;
    bloque.appendChild(titulo);

    const grupos = document.createElement("div");
    grupos.className = "filtro-grupos-grid";

    (grupo.subgrupos || []).forEach(subgrupo => {
        grupos.appendChild(crearGrupoPersonajes(subgrupo));
    });

    bloque.appendChild(grupos);
    return bloque;
}

let ultimoContenedor = null;

function renderizarEstadoCompleto() {
    if (!ultimoContenedor) return;

    const modal = document.getElementById("modal-filtros");
    const contenedor = ultimoContenedor;
    contenedor.innerHTML = "";

    const tipo = CATEGORIA_GRUPOS[state.categoriaActual] || state.categoriaActual;
    const titulo = modal?.querySelector(".neon-text");
    const descripcion = modal?.querySelector(".filtro-descripcion");

    if (titulo) {
        titulo.textContent = `CHARACTER FILTER: ${tipo.toUpperCase()}`;
    }

    if (descripcion) {
        descripcion.textContent = "Pick the characters you want to exclude:";
    }

    // NO PERK ocupa toda la fila, por encima de todas las celdas.
    const sinPerkButton = document.createElement("button");
    sinPerkButton.type = "button";
    sinPerkButton.className = "btn-personaje filtro-sin-perk";

    const actualizarEstadoSinPerk = () => {
        const activo = state.sinPerkHabilitadoPorCategoria[state.categoriaActual];
        sinPerkButton.textContent = `NO PERK: ${activo ? "ON" : "OFF"}`;
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

    const contenido = document.createElement("div");
    contenido.className = "filtro-contenido";

    const gruposActuales = obtenerGruposActuales();

    // Los grupos que no tienen subgrupos (por ejemplo General Perks)
    // también forman parte de la cuadrícula de máximo tres columnas.
    const gruposDirectos = gruposActuales.filter(grupo => !grupo.subgrupos?.length);

    if (gruposDirectos.length) {
        const gruposDirectosGrid = document.createElement("div");
        gruposDirectosGrid.className = "filtro-grupos-grid";

        gruposDirectos.forEach(grupo => {
            gruposDirectosGrid.appendChild(crearGrupoPersonajes(grupo));
        });

        contenido.appendChild(gruposDirectosGrid);
    }

    gruposActuales
        .filter(grupo => grupo.subgrupos?.length)
        .forEach(grupo => {
            contenido.appendChild(crearBloqueAnual(grupo));
        });

    contenedor.appendChild(contenido);
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
