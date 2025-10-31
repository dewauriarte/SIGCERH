export var EstadoActa;
(function (EstadoActa) {
    EstadoActa["DISPONIBLE"] = "DISPONIBLE";
    EstadoActa["ASIGNADA_BUSQUEDA"] = "ASIGNADA_BUSQUEDA";
    EstadoActa["ENCONTRADA"] = "ENCONTRADA";
    EstadoActa["NO_ENCONTRADA"] = "NO_ENCONTRADA";
})(EstadoActa || (EstadoActa = {}));
export var TipoActa;
(function (TipoActa) {
    TipoActa["CONSOLIDADO"] = "CONSOLIDADO";
    TipoActa["TRASLADO"] = "TRASLADO";
    TipoActa["SUBSANACION"] = "SUBSANACION";
    TipoActa["RECUPERACION"] = "RECUPERACION";
})(TipoActa || (TipoActa = {}));
export var Turno;
(function (Turno) {
    Turno["MANANA"] = "MA\u00D1ANA";
    Turno["TARDE"] = "TARDE";
    Turno["NOCHE"] = "NOCHE";
})(Turno || (Turno = {}));
export const TRANSICIONES_VALIDAS = {
    [EstadoActa.DISPONIBLE]: [EstadoActa.ASIGNADA_BUSQUEDA],
    [EstadoActa.ASIGNADA_BUSQUEDA]: [
        EstadoActa.ENCONTRADA,
        EstadoActa.NO_ENCONTRADA,
    ],
    [EstadoActa.ENCONTRADA]: [],
    [EstadoActa.NO_ENCONTRADA]: [EstadoActa.ASIGNADA_BUSQUEDA],
};
//# sourceMappingURL=types.js.map