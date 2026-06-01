import type { Producto, Movimiento } from '@/types';

export interface KardexRow {
  id: string;
  tipo: 'inicial' | 'compra' | 'venta';
  detalle: string;
  precioUnit: number;
  entrada: number | null;
  salida: number | null;
  saldo: number;
}

/**
 * Reconstruye el kárdex PEPS de un producto a partir de sus movimientos.
 * El saldo arranca en stockInicial y se acumula cronológicamente.
 */
export function calcularKardex(
  producto: Producto,
  movimientos: Movimiento[],
): KardexRow[] {
  let saldo = producto.stockInicial;

  const rows: KardexRow[] = [
    {
      id:        'inicial',
      tipo:      'inicial',
      detalle:   'Stock inicial',
      precioUnit: 0,
      entrada:   null,
      salida:    null,
      saldo,
    },
  ];

  const movsProd = movimientos
    .filter(m => m.productoId === producto.id)
    .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());

  for (const m of movsProd) {
    if (m.tipo === 'compra') {
      saldo += m.cantidad;
      rows.push({
        id:         String(m.id),
        tipo:       'compra',
        detalle:    'Compra',
        precioUnit: m.precioUnit,
        entrada:    m.cantidad,
        salida:     null,
        saldo,
      });
    } else {
      saldo -= m.cantidad;
      rows.push({
        id:         String(m.id),
        tipo:       'venta',
        detalle:    'Venta',
        precioUnit: m.precioUnit,
        entrada:    null,
        salida:     m.cantidad,
        saldo,
      });
    }
  }

  return rows;
}
