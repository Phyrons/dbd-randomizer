import { CATEGORIAS } from "./config.js";

export const state = {
    listasGlobales: {},
    grupos: {},
    personajes: [],
    listaFinal: [],
    listaDisponible: [],
    ganadores: [],
    indiceSlotActual: 0,
    idiomaActual: "eng",
    categoriaActual: "perksurv",
    slotRerollSeleccionado: 1,
    excluidosPorCategoria: Object.fromEntries(CATEGORIAS.map(categoria => [categoria, []])),
    sinPerkHabilitadoPorCategoria: Object.fromEntries(CATEGORIAS.map(categoria => [categoria, true]))
};
