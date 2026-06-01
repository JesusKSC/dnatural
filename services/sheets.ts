import type { Gasto, Movimiento } from "../types";

const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxCfGb9p_0GRasoUWuTv8rDu-tKxtAORY-fzZxBcpELEpu-xD9SYA7W5bxvdIQdCVE0ag/exec";

/** Envía un movimiento (venta o compra) a la hoja "Movimientos" */
export async function syncMovimiento(
  mov: Movimiento,
  nombreProducto?: string,
): Promise<void> {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        hoja: "Movimientos",
        fecha: new Date(mov.fecha).toLocaleString("es-PE"),
        tipo: mov.tipo,
        producto: nombreProducto ?? `ID-${mov.productoId}`,
        cantidad: mov.cantidad,
        precioUnit: mov.precioUnit,
        total: mov.total,
        metodo: mov.metodo ?? "-",
      }),
    });
  } catch (err) {
    console.warn("[Sheets] syncMovimiento falló:", err);
  }
}

/** Envía un gasto operativo a la hoja "Gastos" */
export async function syncGasto(gasto: Gasto): Promise<void> {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        hoja: "Gastos",
        fecha: new Date(gasto.fecha).toLocaleString("es-PE"),
        concepto: gasto.concepto,
        monto: gasto.monto,
      }),
    });
  } catch (err) {
    console.warn("[Sheets] syncGasto falló:", err);
  }
}
