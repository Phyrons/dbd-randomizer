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

function obtenerPersonajesDeTodosLosGrupos(grupos = obtenerGruposActuales()) {
    const personajes = [];

    grupos.forEach(grupo => {
        personajes.push(...obtenerPersonajesDeGrupo(grupo));

        if (grupo.subgrupos?.length) {
            personajes.push(...obtenerPersonajesDeTodosLosGrupos(grupo.subgrupos));
        }
    });

    return [...new Set(personajes)];
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

function establecerExclusionParaLista(nombres, excluir) {
    nombres.forEach(nombre => establecerExclusion(nombre, excluir));
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

    const actualizar = () => {
        input.checked = !estaExcluido(nombre);
        label.classList.toggle("excluido", !input.checked);
    };

    input.addEventListener("change", () => {
        establecerExclusion(nombre, !input.checked);
        actualizarTodosLosControles();
    });

    actualizar();
    registrarActualizacion(actualizar);
    return label;
}

function actualizarEstadoCheckboxMasivo(input, nombres) {
    if (!nombres.length) {
        input.checked = false;
        input.indeterminate = false;
        input.disabled = true;
        return;
    }

    const incluidos = nombres.filter(nombre => !estaExcluido(nombre)).length;

    input.disabled = false;
    input.checked = incluidos === nombres.length;
    input.indeterminate = incluidos > 0 && incluidos < nombres.length;
}

function crearControlMasivo(tituloTexto, etiquetaTexto, obtenerNombres) {
    const seccion = document.createElement("section");
    seccion.className = "filtro-grupo-card filtro-control-masivo";

    const titulo = document.createElement("div");
    titulo.className = "filtro-grupo-titulo";
    titulo.textContent = tituloTexto;
    seccion.appendChild(titulo);

    const item = document.createElement("label");
    item.className = "filtro-personaje-item filtro-masivo-item";

    const input = document.createElement("input");
    input.type = "checkbox";

    const texto = document.createElement("span");
    texto.textContent = etiquetaTexto;

    item.append(input, texto);
    seccion.appendChild(item);

    const actualizar = () => {
        actualizarEstadoCheckboxMasivo(input, obtenerNombres());
    };

    input.addEventListener("change", () => {
        const nombres = obtenerNombres();
        establecerExclusionParaLista(nombres, !input.checked);
        actualizarTodosLosControles();
    });

    actualizar();
    return { seccion, actualizar };
}

function crearGrupoPersonajes(grupo) {
    const seccion = document.createElement("section");
    seccion.className = "filtro-grupo-card";

    const personajes = obtenerPersonajesDeGrupo(grupo);

    const titulo = document.createElement("label");
    titulo.className = "filtro-grupo-titulo filtro-grupo-titulo-check";

    const tituloInput = document.createElement("input");
    tituloInput.type = "checkbox";
    tituloInput.setAttribute("aria-label", `Include all ${grupo.nombre}`);

    const tituloTexto = document.createElement("span");
    tituloTexto.textContent = grupo.nombre;

    titulo.append(tituloInput, tituloTexto);
    seccion.appendChild(titulo);

    const personajesContenedor = document.createElement("div");
    personajesContenedor.className = "filtro-grupo-personajes";

    personajes.forEach(nombre => {
        personajesContenedor.appendChild(crearControlPersonaje(nombre));
    });

    if (!personajesContenedor.children.length) {
        const vacio = document.createElement("span");
        vacio.className = "filtro-grupo-vacio";
        vacio.textContent = "No characters";
        personajesContenedor.appendChild(vacio);
    }

    seccion.appendChild(personajesContenedor);

    const actualizar = () => {
        actualizarEstadoCheckboxMasivo(tituloInput, personajes);
    };

    tituloInput.addEventListener("change", () => {
        establecerExclusionParaLista(personajes, !tituloInput.checked);
        actualizarTodosLosControles();
    });

    registrarActualizacion(actualizar);
    return seccion;
}

function obtenerPersonajesDeBloque(grupo) {
    return obtenerPersonajesDeTodosLosGrupos(grupo.subgrupos || []);
}

function crearBloqueAnual(grupo) {
    const bloque = document.createElement("section");
    bloque.className = "filtro-bloque-anual";

    const titulo = document.createElement("label");
    titulo.className = "filtro-ano-titulo filtro-grupo-titulo-check filtro-ano-titulo-check";

    const tituloInput = document.createElement("input");
    tituloInput.type = "checkbox";
    tituloInput.setAttribute("aria-label", `Include all ${grupo.nombre}`);

    const tituloTexto = document.createElement("span");
    tituloTexto.textContent = grupo.nombre;

    titulo.append(tituloInput, tituloTexto);
    bloque.appendChild(titulo);

    const grupos = document.createElement("div");
    grupos.className = "filtro-grupos-grid";

    (grupo.subgrupos || []).forEach(subgrupo => {
        grupos.appendChild(crearGrupoPersonajes(subgrupo));
    });

    bloque.appendChild(grupos);

    const personajes = obtenerPersonajesDeBloque(grupo);

    const actualizar = () => {
        actualizarEstadoCheckboxMasivo(tituloInput, personajes);
    };

    tituloInput.addEventListener("change", () => {
        establecerExclusionParaLista(personajes, !tituloInput.checked);
        actualizarTodosLosControles();
    });

    registrarActualizacion(actualizar);
    return bloque;
}

let ultimoContenedor = null;
let actualizadoresControles = [];

function registrarActualizacion(actualizar) {
    actualizadoresControles.push(actualizar);
}

function actualizarTodosLosControles() {
    actualizadoresControles.forEach(actualizar => actualizar());
}

function renderizarEstadoCompleto() {
    if (!ultimoContenedor) return;

    const modal = document.getElementById("modal-filtros");
    const contenedor = ultimoContenedor;
    contenedor.innerHTML = "";
    actualizadoresControles = [];

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
    const todosLosPersonajes = obtenerPersonajesDeTodosLosGrupos(gruposActuales);

    // La primera fila contiene el control global y los grupos directos,
    // como General Perks.
    const gruposDirectos = gruposActuales.filter(grupo => !grupo.subgrupos?.length);

    if (gruposDirectos.length || todosLosPersonajes.length) {
        const gruposDirectosGrid = document.createElement("div");
        gruposDirectosGrid.className = "filtro-grupos-grid";

        if (todosLosPersonajes.length) {
            const controlTodos = crearControlMasivo(
                "Select All Perks",
                "All Perks",
                () => todosLosPersonajes
            );
            registrarActualizacion(controlTodos.actualizar);
            gruposDirectosGrid.appendChild(controlTodos.seccion);
        }

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
    actualizarTodosLosControles();
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
