import type { Producto, Movimiento, Gasto } from '@/types';
import { Colors, Margen } from '@/constants/theme';

export interface MetricasGlobales {
  ingresos:      number;
  costoVentas:   number;
  utilidadBruta: number;
  totalGastos:   number;
  utilidadNeta:  number;
  margenNeto:    number; // %
}

export interface MargenProducto {
  producto:  Producto;
  margenPct: number;
  color:     string;
}

export function calcMetricasGlobales(
  movimientos: Movimiento[],
  gastos:      Gasto[],
  productos:   Producto[],
): MetricasGlobales {
  const ventas = movimientos.filter(m => m.tipo === 'venta');

  const ingresos = ventas.reduce((s, m) => s + m.total, 0);
  const costoVentas = ventas.reduce((s, m) => {
    const p = productos.find(x => x.id === m.productoId);
    return s + m.cantidad * (p?.costo ?? 0);
  }, 0);
  const utilidadBruta = ingresos - costoVentas;
  const totalGastos   = gastos.reduce((s, g) => s + g.monto, 0);
  const utilidadNeta  = utilidadBruta - totalGastos;
  const margenNeto    = ingresos > 0 ? (utilidadNeta / ingresos) * 100 : 0;

  return { ingresos, costoVentas, utilidadBruta, totalGastos, utilidadNeta, margenNeto };
}

export function calcMargenesProductos(productos: Producto[]): MargenProducto[] {
  return productos
    .map(p => {
      const margenPct = p.precio > 0 ? ((p.precio - p.costo) / p.precio) * 100 : 0;
      const color =
        margenPct >= Margen.bueno ? Colors.verde :
        margenPct >= Margen.ok    ? Colors.miel  :
                                    Colors.rojo;
      return { producto: p, margenPct, color };
    })
    .sort((a, b) => b.margenPct - a.margenPct);
}
