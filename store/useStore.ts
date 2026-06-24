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
  /** Valor total del inventario leído del KARDEX del Sheets (null = aún no se ha leído). */
  valorInventarioSheets: number | null;
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

  /**
   * Reemplaza el inventario local con la lista de productos del KARDEX (el inventario real),
   * preservando id y categoría por código, y guarda el valor total del inventario.
   * Si el Sheets no devuelve productos (sin internet/error), conserva el inventario local.
   */
  sincronizarInventario: (data: {
    productos: {
      codigo: string; nombre: string; costo: number;
      precio: number; stockInicial: number; stock: number;
    }[];
    movimientos: {
      tipo: 'venta' | 'compra'; codigo: string; fecha: string;
      cantidad: number; precio: number; metodo: string;
    }[];
    valorInventario: number;
  }) => void;
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
      valorInventarioSheets: null,

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

      sincronizarInventario({ productos: datos, movimientos: movs, valorInventario }) {
        const { productos } = get();

        // Sin productos del Sheets (offline/error) → no tocar el inventario local.
        if (datos.length === 0) {
          if (valorInventario > 0) set({ valorInventarioSheets: valorInventario });
          return;
        }

        // Preserva id y categoría por código (para no romper iconos ni referencias).
        const previos = new Map(
          productos.map((p) => [p.codigo.trim().toUpperCase(), p]),
        );
        let nextId = productos.reduce((m, p) => Math.max(m, p.id), 0) + 1;

        const nuevos: Producto[] = datos.map((d) => {
          const prev = previos.get(d.codigo.trim().toUpperCase());
          return {
            id:           prev ? prev.id : nextId++,
            codigo:       d.codigo,
            nombre:       d.nombre || prev?.nombre || d.codigo,
            categoria:    prev?.categoria ?? 'Otros',
            costo:        d.costo > 0 ? d.costo : (prev?.costo ?? 0),
            precio:       d.precio > 0 ? d.precio : (prev?.precio ?? 0),
            stockInicial: d.stockInicial,
            stock:        d.stock,
          };
        });

        // Mapea los movimientos del Sheets a Movimiento (resuelve productoId por código).
        const idPorCodigo = new Map(
          nuevos.map((p) => [p.codigo.trim().toUpperCase(), p.id]),
        );
        const movimientos: Movimiento[] = [];
        movs.forEach((m, i) => {
          const productoId = idPorCodigo.get(m.codigo.trim().toUpperCase());
          if (productoId === undefined) return;
          const metodo: MetodoPago | null =
            m.tipo === 'venta'
              ? (String(m.metodo).toLowerCase().includes('yape') ? 'yape' : 'efectivo')
              : null;
          movimientos.push({
            id:         i + 1,
            tipo:       m.tipo,
            productoId,
            cantidad:   m.cantidad,
            precioUnit: m.precio,
            metodo,
            total:      m.cantidad * m.precio,
            fecha:      m.fecha,
          });
        });

        set({
          productos:             nuevos,
          movimientos,
          _nextMovId:            movimientos.length + 1,
          valorInventarioSheets: valorInventario > 0 ? valorInventario : null,
        });
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
