export type Categoria =
  | 'Gelatinas'
  | 'Cápsulas'
  | 'Polvos'
  | 'Gomitas'
  | 'Líquidos'
  | 'Otros';

export type MetodoPago = 'efectivo' | 'yape';

export type TipoMovimiento = 'venta' | 'compra';

export interface Producto {
  id: number;
  codigo: string;
  nombre: string;
  categoria: Categoria;
  /** Costo unitario de la última compra (actualiza al registrar compra) */
  costo: number;
  precio: number;
  /** Stock del primer día (para reconstruir el kárdex desde cero) */
  stockInicial: number;
  stock: number;
}

export interface Movimiento {
  id: number;
  tipo: TipoMovimiento;
  productoId: number;
  cantidad: number;
  precioUnit: number;
  /** null para compras (no aplica método de pago) */
  metodo: MetodoPago | null;
  total: number;
  /** Fecha en formato ISO 8601 para serialización con AsyncStorage */
  fecha: string;
}

export interface Gasto {
  id: number;
  concepto: string;
  monto: number;
  fecha: string;
}
