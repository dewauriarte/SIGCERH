export var EstadoPago;
(function (EstadoPago) {
    EstadoPago["PENDIENTE"] = "PENDIENTE";
    EstadoPago["PAGADO"] = "PAGADO";
    EstadoPago["VALIDADO"] = "VALIDADO";
    EstadoPago["RECHAZADO"] = "RECHAZADO";
    EstadoPago["EXPIRADO"] = "EXPIRADO";
})(EstadoPago || (EstadoPago = {}));
export var TipoMetodoPago;
(function (TipoMetodoPago) {
    TipoMetodoPago["DIGITAL"] = "DIGITAL";
    TipoMetodoPago["EFECTIVO"] = "EFECTIVO";
    TipoMetodoPago["TARJETA"] = "TARJETA";
    TipoMetodoPago["TRANSFERENCIA"] = "TRANSFERENCIA";
})(TipoMetodoPago || (TipoMetodoPago = {}));
export var MetodoPago;
(function (MetodoPago) {
    MetodoPago["YAPE"] = "YAPE";
    MetodoPago["PLIN"] = "PLIN";
    MetodoPago["EFECTIVO"] = "EFECTIVO";
    MetodoPago["TARJETA"] = "TARJETA";
})(MetodoPago || (MetodoPago = {}));
export var TipoComprobante;
(function (TipoComprobante) {
    TipoComprobante["CAPTURA_APP"] = "CAPTURA_APP";
    TipoComprobante["CONSTANCIA"] = "CONSTANCIA";
    TipoComprobante["RECIBO_EFECTIVO"] = "RECIBO_EFECTIVO";
    TipoComprobante["VOUCHER_TARJETA"] = "VOUCHER_TARJETA";
})(TipoComprobante || (TipoComprobante = {}));
export const MONTO_CERTIFICADO = 15.0;
//# sourceMappingURL=types.js.map