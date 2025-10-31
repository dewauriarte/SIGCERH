export var EstadoSolicitud;
(function (EstadoSolicitud) {
    EstadoSolicitud["REGISTRADA"] = "REGISTRADA";
    EstadoSolicitud["DERIVADO_A_EDITOR"] = "DERIVADO_A_EDITOR";
    EstadoSolicitud["EN_BUSQUEDA"] = "EN_BUSQUEDA";
    EstadoSolicitud["ACTA_ENCONTRADA_PENDIENTE_PAGO"] = "ACTA_ENCONTRADA_PENDIENTE_PAGO";
    EstadoSolicitud["ACTA_NO_ENCONTRADA"] = "ACTA_NO_ENCONTRADA";
    EstadoSolicitud["PAGO_VALIDADO"] = "PAGO_VALIDADO";
    EstadoSolicitud["EN_PROCESAMIENTO_OCR"] = "EN_PROCESAMIENTO_OCR";
    EstadoSolicitud["EN_VALIDACION_UGEL"] = "EN_VALIDACION_UGEL";
    EstadoSolicitud["OBSERVADO_POR_UGEL"] = "OBSERVADO_POR_UGEL";
    EstadoSolicitud["EN_REGISTRO_SIAGEC"] = "EN_REGISTRO_SIAGEC";
    EstadoSolicitud["EN_FIRMA_DIRECCION"] = "EN_FIRMA_DIRECCION";
    EstadoSolicitud["CERTIFICADO_EMITIDO"] = "CERTIFICADO_EMITIDO";
    EstadoSolicitud["ENTREGADO"] = "ENTREGADO";
})(EstadoSolicitud || (EstadoSolicitud = {}));
export var ModalidadEntrega;
(function (ModalidadEntrega) {
    ModalidadEntrega["DIGITAL"] = "DIGITAL";
    ModalidadEntrega["FISICA"] = "FISICA";
})(ModalidadEntrega || (ModalidadEntrega = {}));
export var Prioridad;
(function (Prioridad) {
    Prioridad["NORMAL"] = "NORMAL";
    Prioridad["ALTA"] = "ALTA";
    Prioridad["URGENTE"] = "URGENTE";
})(Prioridad || (Prioridad = {}));
export var RolSolicitud;
(function (RolSolicitud) {
    RolSolicitud["SISTEMA"] = "SISTEMA";
    RolSolicitud["PUBLICO"] = "PUBLICO";
    RolSolicitud["MESA_DE_PARTES"] = "MESA_DE_PARTES";
    RolSolicitud["EDITOR"] = "EDITOR";
    RolSolicitud["UGEL"] = "UGEL";
    RolSolicitud["SIAGEC"] = "SIAGEC";
    RolSolicitud["DIRECCION"] = "DIRECCION";
    RolSolicitud["ADMIN"] = "ADMIN";
})(RolSolicitud || (RolSolicitud = {}));
export const TRANSICIONES_VALIDAS = {
    [EstadoSolicitud.REGISTRADA]: {
        nextStates: [EstadoSolicitud.DERIVADO_A_EDITOR],
        roles: [RolSolicitud.MESA_DE_PARTES, RolSolicitud.SISTEMA],
        description: 'Mesa de Partes deriva solicitud a Editor',
    },
    [EstadoSolicitud.DERIVADO_A_EDITOR]: {
        nextStates: [EstadoSolicitud.EN_BUSQUEDA],
        roles: [RolSolicitud.EDITOR],
        description: 'Editor inicia búsqueda de acta física',
    },
    [EstadoSolicitud.EN_BUSQUEDA]: {
        nextStates: [
            EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO,
            EstadoSolicitud.ACTA_NO_ENCONTRADA,
        ],
        roles: [RolSolicitud.EDITOR],
        description: 'Editor marca acta como encontrada o no encontrada',
    },
    [EstadoSolicitud.ACTA_ENCONTRADA_PENDIENTE_PAGO]: {
        nextStates: [EstadoSolicitud.PAGO_VALIDADO],
        roles: [RolSolicitud.SISTEMA, RolSolicitud.MESA_DE_PARTES],
        requiresData: ['pago_id'],
        description: 'Sistema valida pago automático o Mesa de Partes valida pago en efectivo',
    },
    [EstadoSolicitud.ACTA_NO_ENCONTRADA]: {
        nextStates: [],
        roles: [],
        description: 'Estado final - Acta no encontrada, sin cobro',
    },
    [EstadoSolicitud.PAGO_VALIDADO]: {
        nextStates: [EstadoSolicitud.EN_PROCESAMIENTO_OCR],
        roles: [RolSolicitud.EDITOR],
        description: 'Editor inicia procesamiento con OCR',
    },
    [EstadoSolicitud.EN_PROCESAMIENTO_OCR]: {
        nextStates: [EstadoSolicitud.EN_VALIDACION_UGEL],
        roles: [RolSolicitud.EDITOR],
        description: 'Editor envía a validación de UGEL',
    },
    [EstadoSolicitud.EN_VALIDACION_UGEL]: {
        nextStates: [
            EstadoSolicitud.EN_REGISTRO_SIAGEC,
            EstadoSolicitud.OBSERVADO_POR_UGEL,
        ],
        roles: [RolSolicitud.UGEL],
        description: 'UGEL aprueba o observa el certificado',
    },
    [EstadoSolicitud.OBSERVADO_POR_UGEL]: {
        nextStates: [EstadoSolicitud.EN_VALIDACION_UGEL],
        roles: [RolSolicitud.EDITOR],
        description: 'Editor corrige observaciones y reenvía a UGEL',
    },
    [EstadoSolicitud.EN_REGISTRO_SIAGEC]: {
        nextStates: [EstadoSolicitud.EN_FIRMA_DIRECCION],
        roles: [RolSolicitud.SIAGEC],
        requiresData: ['codigoQR', 'codigoVirtual'],
        description: 'SIAGEC registra y genera códigos de verificación',
    },
    [EstadoSolicitud.EN_FIRMA_DIRECCION]: {
        nextStates: [EstadoSolicitud.CERTIFICADO_EMITIDO],
        roles: [RolSolicitud.DIRECCION],
        description: 'Dirección firma el certificado (digital o física)',
    },
    [EstadoSolicitud.CERTIFICADO_EMITIDO]: {
        nextStates: [EstadoSolicitud.ENTREGADO],
        roles: [RolSolicitud.SISTEMA, RolSolicitud.MESA_DE_PARTES],
        description: 'Usuario descarga (automático) o retira en UGEL (Mesa de Partes)',
    },
    [EstadoSolicitud.ENTREGADO]: {
        nextStates: [],
        roles: [],
        description: 'Estado final - Certificado entregado',
    },
};
export function esTransicionValida(estadoActual, estadoDestino, rol) {
    const config = TRANSICIONES_VALIDAS[estadoActual];
    if (!config) {
        return false;
    }
    if (!config.nextStates.includes(estadoDestino)) {
        return false;
    }
    if (!config.roles.includes(rol) && !config.roles.includes(RolSolicitud.SISTEMA)) {
        return false;
    }
    return true;
}
export function getEstadosSiguientes(estadoActual) {
    const config = TRANSICIONES_VALIDAS[estadoActual];
    return config ? config.nextStates : [];
}
export function getRolesPermitidos(estadoActual) {
    const config = TRANSICIONES_VALIDAS[estadoActual];
    return config ? config.roles : [];
}
export function esEstadoFinal(estado) {
    const siguientes = getEstadosSiguientes(estado);
    return siguientes.length === 0;
}
//# sourceMappingURL=types.js.map