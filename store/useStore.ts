import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { Producto, Movimiento, Gasto, MetodoPago } from '../types';
import rawSeed from '../data/productos.json';

// Forma del JSON en data/productos.json
interface SeedItem {
  id: number;
  codigo: string;
  nombre: string;
  categoria: string;
  costo_unit: number;
  precio_venta: number;
  stock_inicial: number;
}

const SEED: Producto[] = (rawSeed as SeedItem[]).map((p) => ({
  id:           p.id,
  codigo:       p.codigo,
  nombre:       p.nombre,
  categoria:    p.categoria as Producto['categoria'],
  costo:        p.costo_unit,
  precio:       p.precio_venta,
  stockInicial: p.stock_inicial,
  stock:        p.stock_inicial,
}));

// ─── Tipos del store ────────────────────────────────────────────────────────

interface AppState {
  productos:    Producto[];
  movimientos:  Movimiento[];
  gastos:       Gasto[];
  _nextMovId:   number;
  _nextGastoId: number;
}

interface AppActions {
  /**
   * Registra una venta. Valida que haya stock suficiente antes de mutar.
   * Retorna { ok: false, error } si el stock es insuficiente.
   */
  registrarVenta: (
    productoId: number,
    cantidad:   number,
    precioUnit: number,
    metodo:     MetodoPago,
  ) => { ok: boolean; error?: string };

  /**
   * Registra una compra (entrada de mercadería).
   * Actualiza el costo unitario del producto con el nuevo precio de compra.
   */
  registrarCompra: (
    productoId: number,
    cantidad:   number,
    precioUnit: number,
  ) => void;

  /** Agrega un gasto operativo (stand, taxi, almuerzo, etc.). */
  agregarGasto: (concepto: string, monto: number) => void;

  /** Crea un producto nuevo. Valida que el código no exista. */
  agregarProducto: (
    datos: Omit<Producto, 'id' | 'stock'>,
  ) => { ok: boolean; error?: string };

  /**
   * Edita campos de un producto existente.
   * Si cambia stockInicial, ajusta el stock actual por el mismo delta
   * (para mantener la coherencia con el KARDEX del Sheets).
   */
  actualizarProducto: (
    id: number,
    cambios: Partial<Omit<Producto, 'id' | 'stock'>>,
  ) => void;

  /** Elimina un producto del catálogo. */
  eliminarProducto: (id: number) => void;
}

// ─── Store ──────────────────────────────────────────────────────────────────

export const useStore = create<AppState & AppActions>()(
  persist(
    (set, get) => ({
      productos:    SEED,
      movimientos:  [],
      gastos:       [],
      _nextMovId:   1,
      _nextGastoId: 1,

      registrarVenta(productoId, cantidad, precioUnit, metodo) {
        const { productos, movimientos, _nextMovId } = get();
        const prod = productos.find((p) => p.id === productoId);

        if (!prod) {
          return { ok: false, error: 'Producto no encontrado' };
        }
        if (cantidad > prod.stock) {
          return {
            ok:    false,
            error: `Stock insuficiente — disponible: ${prod.stock} u`,
          };
        }

        const mov: Movimiento = {
          id:         _nextMovId,
          tipo:       'venta',
          productoId,
          cantidad,
          precioUnit,
          metodo,
          total:      cantidad * precioUnit,
          fecha:      new Date().toISOString(),
        };

        set({
          productos:   productos.map((p) =>
            p.id === productoId ? { ...p, stock: p.stock - cantidad } : p,
          ),
          movimientos: [...movimientos, mov],
          _nextMovId:  _nextMovId + 1,
        });

        return { ok: true };
      },

      registrarCompra(productoId, cantidad, precioUnit) {
        const { productos, movimientos, _nextMovId } = get();

        const mov: Movimiento = {
          id:         _nextMovId,
          tipo:       'compra',
          productoId,
          cantidad,
          precioUnit,
          metodo:     null,
          total:      cantidad * precioUnit,
          fecha:      new Date().toISOString(),
        };

        set({
          // Suma stock y actualiza costo unitario (nuevo lote PEPS)
          productos:   productos.map((p) =>
            p.id === productoId
              ? { ...p, stock: p.stock + cantidad, costo: precioUnit }
              : p,
          ),
          movimientos: [...movimientos, mov],
          _nextMovId:  _nextMovId + 1,
        });
      },

      agregarGasto(concepto, monto) {
        const { gastos, _nextGastoId } = get();
        const gasto: Gasto = {
          id:       _nextGastoId,
          concepto,
          monto,
          fecha:    new Date().toISOString(),
        };
        set({
          gastos:       [...gastos, gasto],
          _nextGastoId: _nextGastoId + 1,
        });
      },

      agregarProducto(datos) {
        const { productos } = get();
        const codigo = datos.codigo.trim();
        if (!codigo) return { ok: false, error: 'El código es obligatorio' };
        if (productos.some((p) => p.codigo.toLowerCase() === codigo.toLowerCase())) {
          return { ok: false, error: `Ya existe un producto con código ${codigo}` };
        }
        const nextId = productos.reduce((max, p) => Math.max(max, p.id), 0) + 1;
        const prod: Producto = {
          ...datos,
          codigo,
          id:    nextId,
          stock: datos.stockInicial,
        };
        set({ productos: [...productos, prod] });
        return { ok: true };
      },

      actualizarProducto(id, cambios) {
        const { productos } = get();
        set({
          productos: productos.map((p) => {
            if (p.id !== id) return p;
            const deltaIni =
              cambios.stockInicial !== undefined
                ? cambios.stockInicial - p.stockInicial
                : 0;
            return { ...p, ...cambios, stock: p.stock + deltaIni };
          }),
        });
      },

      eliminarProducto(id) {
        const { productos } = get();
        set({ productos: productos.filter((p) => p.id !== id) });
      },
    }),
    {
      name:    'dnatural-store',
      storage: createJSONStorage(() => AsyncStorage),
      version: 2,
      // Reemplaza los productos persistidos (códigos viejos GEL1/GEL5/…) por el
      // nuevo seed con códigos GEL01/MAG01/… que cuadran con la BASE DE DATOS.
      migrate: (state: unknown) => ({
        ...(state as object),
        productos: SEED,
      }),
    },
  ),
);
