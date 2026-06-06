import type { Gasto, Movimiento } from "../types";

// URL del web app de Apps Script (ver instrucciones abajo para obtenerla).
// Mientras no tengas la URL nueva, los sync fallan silenciosamente (no afectan la app).
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbxCfGb9p_0GRasoUWuTv8rDu-tKxtAORY-fzZxBcpELEpu-xD9SYA7W5bxvdIQdCVE0ag/exec";

// ID de la hoja de los compañeros (nunca escribir en la pestaña KARDEX).
const SPREADSHEET_ID = "1CwL7tiH9Qbf5rEoqxAPJoFUnkm1ob1EoFgLHmxIgr3I";

/*
  ── Apps Script que los compañeros deben desplegar en su hoja ──────────────
  En la hoja: Extensiones → Apps Script → pegar este código → Implementar →
  Nueva implementación → Ejecutar como: Yo · Acceso: Cualquier persona →
  Copiar la URL del despliegue y reemplazar SCRIPT_URL arriba.

  function doPost(e) {
    const data = JSON.parse(e.postData.contents);
    const ss   = SpreadsheetApp.openById(data.spreadsheetId);
    const hoja = ss.getSheetByName(data.hoja);
    hoja.appendRow(data.fila);
    return ContentService.createTextOutput("ok");
  }
  ───────────────────────────────────────────────────────────────────────────
*/

const METODO: Record<string, string> = {
  efectivo: "Efectivo",
  yape:     "Yape / Plin",
};

function formatFecha(iso: string): string {
  const d  = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Envía un movimiento a la hoja de los compañeros.
 * @param codigoNombre  formato exacto "GEL01 - Gelatina 1kg"
 *
 * Venta  → pestaña "Ventas formulario"  (columnas A–G)
 * Compra → pestaña "Compras formulario" (columnas A–E)
 * KARDEX nunca se toca (lo calculan las fórmulas de la hoja).
 */
export async function syncMovimiento(
  mov:          Movimiento,
  codigoNombre: string,
): Promise<void> {
  try {
    const timestamp = new Date(mov.fecha).toLocaleString("es-PE");
    const fecha     = formatFecha(mov.fecha);

    let payload: object;

    if (mov.tipo === "venta") {
      payload = {
        spreadsheetId: SPREADSHEET_ID,
        hoja: "Ventas formulario",
        fila: [
          timestamp,
          fecha,
          codigoNombre,
          mov.cantidad,
          mov.precioUnit,
          mov.metodo !== null ? (METODO[mov.metodo] ?? mov.metodo) : "Efectivo",
          "",  // col G "Otro producto" — vacío; se llena solo con OTR01 (flujo futuro)
        ],
      };
    } else {
      payload = {
        spreadsheetId: SPREADSHEET_ID,
        hoja: "Compras formulario",
        fila: [
          timestamp,
          fecha,
          codigoNombre,
          mov.cantidad,
          mov.precioUnit,
        ],
      };
    }

    await fetch(SCRIPT_URL, {
      method:  "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body:    JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[Sheets] syncMovimiento falló:", err);
  }
}

/** La hoja de los compañeros no tiene pestaña de Gastos; no-op intencionado. */
export async function syncGasto(_gasto: Gasto): Promise<void> {}
