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
    const subgrupos = (grupo.subgrupos || []).flatMap(subgrupo => obtenerTodosLosPersonajes(subgrupo));
    return [...new Set([...directos, ...subgrupos])];
}

function obtenerPersonajesActuales() {
    return [...new Set(obtenerGruposActuales().flatMap(obtenerTodosLosPersonajes))];
}

function obtenerPerksDePersonaje(nombre) {
    const lista = state.listasGlobales?.[state.categoriaActual] || [];
    return lista.filter(perk => perk.personaje === nombre);
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

function crearTarjetaPerk(perk) {
    const item = document.createElement("div");
    item.className = "filtro-perk";

    const imagen = document.createElement("img");
    imagen.src = `img/${perk.archivo}`;
    imagen.alt = "";
    imagen.loading = "lazy";

    const nombre = document.createElement("span");
    nombre.textContent = state.idiomaActual === "esp" && perk.nombre_es
        ? perk.nombre_es
        : perk.nombre;

    item.append(imagen, nombre);
    return item;
}

function renderizarPersonaje(nombre, contenedor) {
    const tarjeta = document.createElement("article");
    tarjeta.className = "filtro-personaje-card";

    const cabecera = document.createElement("label");
    cabecera.className = "filtro-personaje-cabecera";

    const input = document.createElement("input");
    input.type = "checkbox";
    input.checked = !estaExcluido(nombre);
    input.setAttribute("aria-label", `Include ${nombre}`);

    const titulo = document.createElement("span");
    titulo.className = "filtro-personaje-nombre";
    titulo.textContent = nombre;

    cabecera.append(input, titulo);
    tarjeta.appendChild(cabecera);

    const perks = document.createElement("div");
    perks.className = "filtro-perks";

    obtenerPerksDePersonaje(nombre).forEach(perk => {
        perks.appendChild(crearTarjetaPerk(perk));
    });

    if (!perks.children.length) {
        const vacio = document.createElement("span");
        vacio.className = "filtro-perks-vacio";
        vacio.textContent = "No character perks";
        perks.appendChild(vacio);
    }

    tarjeta.appendChild(perks);

    input.addEventListener("change", () => {
        establecerExclusion(nombre, !input.checked);
        tarjeta.classList.toggle("excluido", !input.checked);
    });

    tarjeta.classList.toggle("excluido", !input.checked);
    contenedor.appendChild(tarjeta);
}

function renderizarGrupoDePersonajes(grupo, contenedor, personajesRenderizados) {
    obtenerTodosLosPersonajes(grupo).forEach(nombre => {
        if (personajesRenderizados.has(nombre)) return;
        personajesRenderizados.add(nombre);
        renderizarPersonaje(nombre, contenedor);
    });

    (grupo.subgrupos || []).forEach(subgrupo => {
        renderizarGrupoDePersonajes(subgrupo, contenedor, personajesRenderizados);
    });
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

    const separador = document.createElement("div");
    separador.className = "filtro-separador";
    separador.textContent = "CHARACTERS";
    contenedor.appendChild(separador);

    const personajes = document.createElement("div");
    personajes.className = "filtro-personajes-grid";

    const personajesRenderizados = new Set();
    obtenerGruposActuales().forEach(grupo => {
        renderizarGrupoDePersonajes(grupo, personajes, personajesRenderizados);
    });

    contenedor.appendChild(personajes);
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
