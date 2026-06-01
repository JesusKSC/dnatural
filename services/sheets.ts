import type { Movimiento } from '../types';

/**
 * Envía un movimiento registrado a Google Sheets.
 *
 * STUB — por ahora solo loguea. Conectar al final del proyecto
 * usando la Google Sheets API (gspread / service account).
 * La firma no cambia al integrar la API real.
 */
export async function syncMovimiento(_mov: Movimiento): Promise<void> {
  // TODO: reemplazar con llamada real a la Google Sheets API
  console.log('[Sheets] syncMovimiento →', _mov);
}
