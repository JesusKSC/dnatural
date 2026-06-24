import type { Gasto, Movimiento, Producto } from "../types";
import { useStore } from "../store/useStore";

// Web App de Apps Script desplegado sobre la hoja de Google (la usuaria es dueña).
const SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbwoe8l79j1-4iu-03ZhOjqL4m3EUUBxGkk1XqCR27QURj1HbiAirEYdYa1fIniOsjn6fw/exec";

/*
  El Apps Script desplegado espera un payload { hoja, fila } y hace appendRow:

  function doPost(e) {
    var data = JSON.parse(e.postData.contents);
    var ss   = SpreadsheetApp.getActiveSpreadsheet();
    var hoja = ss.getSheetByName(data.hoja);
    hoja.appendRow(data.fila);
    return ContentService.createTextOutput(JSON.stringify({ ok: true }))
                         .setMimeType(ContentService.MimeType.JSON);
  }

  La app SOLO escribe en "Ventas formulario" y "Compras formulario".
  KARDEX, RENTABILIDAD y Cash Flow se calculan solos con fórmulas: nunca se tocan.
*/

// Mapeo de método de pago (app → hoja)
const METODO: Record<string, string> = {
  efectivo: "Efectivo",
  yape: "Yape / Plin",
};

/** Fecha en formato DD/MM/YYYY que espera la columna B de ambas pestañas. */
function fechaDDMMYYYY(iso: string): string {
  const d = new Date(iso);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${dd}/${mm}/${d.getFullYear()}`;
}

/**
 * Envía un movimiento a la hoja de Google.
 * @param codigoNombre  string EXACTO "CÓDIGO - Nombre" (ej. "GEL01 - Gelatina 1kg")
 *
 * Venta  → pestaña "Ventas formulario"  (columnas A–G)
 * Compra → pestaña "Compras formulario" (columnas A–E)
 */
export async function syncMovimiento(
  mov: Movimiento,
  codigoNombre: string,
): Promise<void> {
  try {
    const timestamp = new Date(mov.fecha).toLocaleString("es-PE");
    const fecha = fechaDDMMYYYY(mov.fecha);

    let payload: { hoja: string; fila: (string | number)[] };

    if (mov.tipo === "venta") {
      const metodo =
        mov.metodo !== null ? (METODO[mov.metodo] ?? "Efectivo") : "Efectivo";
      payload = {
        hoja: "Ventas formulario",
        // A timestamp | B fecha | C "CÓDIGO - Nombre" | D cantidad | E precio | F método
        // (NO escribir la columna G "TOTAL VENTAS": es una fórmula de la hoja)
        fila: [
          timestamp,
          fecha,
          codigoNombre,
          mov.cantidad,
          mov.precioUnit,
          metodo,
        ],
      };
    } else {
      payload = {
        hoja: "Compras formulario",
        // A timestamp | B fecha | C "CÓDIGO - Nombre" | D cantidad | E precio
        fila: [timestamp, fecha, codigoNombre, mov.cantidad, mov.precioUnit],
      };
    }

    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload),
    });
  } catch (err) {
    console.warn("[Sheets] syncMovimiento falló:", err);
  }
}

/**
 * Crea o actualiza un producto en BASE DE DATOS y KARDEX.
 * Solo se escriben las columnas "de entrada" (por nombre de encabezado);
 * las columnas de fórmula (Compras, Ventas, Total*, Stock Actual, Estado…)
 * NO se envían: el script las hereda de la fila de arriba al insertar.
 *
 * @param codigoBusqueda  Código con el que BUSCAR la fila (código ORIGINAL al editar,
 *   por si el usuario lo cambió; al crear se omite y se busca por el código nuevo).
 */
export async function syncProductoUpsert(
  p: Producto,
  codigoBusqueda?: string,
): Promise<void> {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        accion: "upsertProducto",
        codigo: codigoBusqueda ?? p.codigo,
        destinos: [
          {
            hoja: "BASE DE DATOS",
            anclaCodigo: "OTR01", // los productos nuevos se insertan ARRIBA de OTROS
            campos: {
              Código: p.codigo,
              Producto: p.nombre,
              "Costo Unitario": p.costo,
              "Valor de Venta Unitaria": p.precio,
            },
          },
          {
            hoja: "KARDEX", // sin ancla → se inserta arriba de TOTALES
            campos: {
              Código: p.codigo,
              Producto: p.nombre,
              "Costo Unit.": p.costo,
              "Precio Venta": p.precio,
              "Stock Inicial": p.stockInicial,
            },
          },
        ],
      }),
    });
  } catch (err) {
    console.warn("[Sheets] syncProductoUpsert falló:", err);
  }
}

export interface ProductoSheets {
  codigo: string;
  nombre: string;
  costo: number;        // "Costo nueva compra" (promedio) del KARDEX
  precio: number;       // "Precio Venta"
  stockInicial: number; // "Stock Inicial"
  stock: number;        // "Stock Actual"
}

export interface MovimientoSheets {
  tipo: "venta" | "compra";
  codigo: string;
  fecha: string;     // "YYYY-MM-DDT00:00:00"
  cantidad: number;
  precio: number;
  metodo: string;    // solo ventas ("Efectivo" / "Yape / Plin")
}

export interface InventarioSheets {
  /** Lista completa de productos leída del KARDEX (es el inventario real). */
  productos: ProductoSheets[];
  /** Movimientos (ventas + compras) leídos de los formularios (historial compartido). */
  movimientos: MovimientoSheets[];
  /** Valor total del inventario al costo (suma de "Valor Inventario" del KARDEX). */
  valorInventario: number;
}

/**
 * Lee del KARDEX (vía doGet) el stock actual y el costo promedio de cada producto, y el valor
 * total del inventario, para que la app refleje los números reales tras todos los movimientos.
 */
export async function fetchInventarioSheets(): Promise<InventarioSheets> {
  try {
    const res  = await fetch(`${SCRIPT_URL}?accion=inventario`);
    const data = await res.json();
    return {
      productos:       Array.isArray(data?.productos) ? data.productos : [],
      movimientos:     Array.isArray(data?.movimientos) ? data.movimientos : [],
      valorInventario: typeof data?.valorInventario === "number" ? data.valorInventario : 0,
    };
  } catch (err) {
    console.warn("[Sheets] fetchInventarioSheets falló:", err);
    return { productos: [], movimientos: [], valorInventario: 0 };
  }
}

/** Vuelve a leer el inventario del Sheets y lo aplica al store (productos, stock, costo, movimientos). */
export async function refrescarInventario(): Promise<void> {
  const data = await fetchInventarioSheets();
  useStore.getState().sincronizarInventario(data);
}

/** Elimina un producto de BASE DE DATOS y KARDEX buscándolo por su código. */
export async function syncProductoEliminar(codigo: string): Promise<void> {
  try {
    await fetch(SCRIPT_URL, {
      method: "POST",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify({
        accion: "eliminarProducto",
        codigo,
        hojas: ["BASE DE DATOS", "KARDEX"],
      }),
    });
  } catch (err) {
    console.warn("[Sheets] syncProductoEliminar falló:", err);
  }
}

/**
 * La hoja de Google no tiene pestaña de entrada para gastos
 * (el Cash Flow se calcula con fórmulas). No-op intencionado:
 * los gastos siguen guardándose en el store local para la pantalla Caja.
 */
export async function syncGasto(_gasto: Gasto): Promise<void> {}
