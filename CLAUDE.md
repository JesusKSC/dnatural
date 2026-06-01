# CLAUDE.md — NatuStock (D'Natural)

> Lee este archivo PRIMERO antes de tocar cualquier código.
> Contiene el contexto completo del proyecto, reglas de negocio, decisiones técnicas
> y el estado actual del desarrollo.

---

## 1. Qué es el proyecto

**NatuStock** es una app móvil de gestión comercial para **Doris**, dueña del emprendimiento
**D'Natural "Vida Saludable"**. Ella importa y revende productos naturales (gelatinas, gomitas,
cápsulas, suplementos, miel) en ferias de Perú. Opera **solo desde celular o tablet**, no tiene
laptop y no maneja Excel ni contabilidad.

La app reemplaza su Excel actual con una interfaz de "tocar":
**elegir producto → cantidad → método de pago → guardar**.
Todo el cálculo (kárdex, caja, rentabilidad) lo hace el app, no la usuaria.

Contexto completo del negocio: `context/doris-excel-context.md`
Productos reales (31 items): `context/productos.json` y `data/productos.json`
Prototipo de diseño: `context/prototipo.html` ← **fuente de verdad visual**

---

## 2. Reglas de negocio — NO negociables

| Regla | Detalle |
|-------|---------|
| **Stock nunca negativo** | Validar antes de `registrarVenta`. El store ya lo hace. |
| **Métodos de pago** | Solo `'efectivo'` o `'yape'` (Yape/transferencia). Separarlos en flujo de caja. |
| **Kárdex PEPS** | Primeras entradas, primeras salidas. Se CALCULA desde `movimientos[]`, nunca se guarda aparte. |
| **Caja y rentabilidad** | Se CALCULAN desde `movimientos[]` y `gastos[]`. No se guardan. |
| **Márgenes de referencia** | ≥25% verde · 15–24% amarillo · <15% rojo (ver `constants/theme.ts → Margen`) |
| **Alerta de stock** | ≤5 unidades → badge "bajo". 0 → badge "agotado". (ver `constants/theme.ts → StockAlerta`) |

---

## 3. Diseño visual

**La fuente de verdad del diseño es `context/prototipo.html`.**
No inventar estilos nuevos. Respetar:
- Paleta de colores → `constants/theme.ts → Colors`
- Iconos de categoría → `constants/theme.ts → CatIcon`
- Fondos de tile/avatar → `constants/theme.ts → CatBg`
- Radios y sombras → `constants/theme.ts → Radii / Shadow`
- Tipografía: **Fraunces** (serif, números y títulos) + **Albert Sans** (texto general)
- Header verde con gradiente `bosque → verde`, bordes redondeados abajo
- Bottom nav con FAB central elevado (botón Registrar)
- Cards con fondo blanco, borde `linea`, sombra `sm`
- Toast de confirmación tras cada acción

---

## 4. Stack técnico

| Capa | Tecnología | Notas |
|------|-----------|-------|
| Framework | **Expo SDK 56** + **Expo Router** (tabs) | Rutas en `app/` raíz |
| UI | React Native (sin librerías de UI externas) | Estilos en StyleSheet inline |
| Estado | **Zustand v5** + `persist` con `AsyncStorage` | Store en `store/useStore.ts` |
| Persistencia | `@react-native-async-storage/async-storage 2.2.0` | Auto via Zustand persist |
| Sheets | Stub en `services/sheets.ts` | Conectar al final; firma ya definida |
| Bottom Sheet | **@gorhom/bottom-sheet** | Instalar al construir pantalla Registrar |
| Instalación pkgs | `npx expo install` (NUNCA `npm install` directo para RN) | Para SDK compatibility |

---

## 5. Estructura de carpetas

```
/                        ← raíz del proyecto (NO usar src/)
├── app/                 ← Expo Router: rutas y layouts (crear al construir pantallas)
│   ├── _layout.tsx      ← root layout (ThemeProvider, GestureHandlerRootView)
│   └── (tabs)/
│       ├── _layout.tsx  ← tab navigator (5 tabs + FAB central)
│       ├── index.tsx    ← Inicio (dashboard)
│       ├── inventario.tsx
│       ├── registrar.tsx
│       ├── caja.tsx
│       └── reportes.tsx
├── components/          ← componentes reutilizables
│   └── ui/              ← primitivos (Badge, Card, Stepper, Toast, etc.)
├── constants/
│   └── theme.ts         ← ✅ CREADO — colores, sombras, CatIcon, CatBg, umbrales
├── data/
│   └── productos.json   ← ✅ CREADO — seed de 31 productos reales
├── models/              ← placeholder (no usar; tipos van en types/)
├── navigation/          ← placeholder (no usar; Expo Router maneja navegación)
├── screens/             ← placeholder (no usar; pantallas van en app/)
├── services/
│   └── sheets.ts        ← ✅ CREADO — stub Google Sheets API
├── store/
│   └── useStore.ts      ← ✅ CREADO — Zustand store completo
├── types/
│   └── index.ts         ← ✅ CREADO — Producto, Movimiento, Gasto, tipos union
├── utils/               ← funciones auxiliares (crear al necesitarlas)
├── context/             ← SOLO DOCUMENTACIÓN (no tocar, no importar desde aquí en la app)
│   ├── doris-excel-context.md
│   ├── productos.json
│   └── prototipo.html
└── CLAUDE.md            ← este archivo
```

> ⚠️ La carpeta `src/` contiene el boilerplate original de Expo. Se puede ignorar o eliminar
> cuando se construya `app/` en raíz.

---

## 6. Estado actual del desarrollo

### ✅ Completado
- [x] `data/productos.json` — seed con los 31 productos reales de Doris
- [x] `constants/theme.ts` — paleta completa del prototipo
- [x] `types/index.ts` — `Producto`, `Movimiento`, `Gasto`, `Categoria`, `MetodoPago`, `TipoMovimiento`
- [x] `store/useStore.ts` — Zustand v5 + persist + `registrarVenta` / `registrarCompra` / `agregarGasto`
- [x] `services/sheets.ts` — stub `syncMovimiento`
- [x] `utils/format.ts` — función `fmt` de formato numérico
- [x] `utils/kardex.ts` — lógica de cálculo PEPS
- [x] `utils/metrics.ts` — `calcMetricasGlobales` y `calcMargenesProductos`
- [x] `app/_layout.tsx` + `app/(tabs)/_layout.tsx` — root layout y tab navigator con FAB
- [x] `app/(tabs)/index.tsx` — dashboard con métricas del día y alertas de stock
- [x] `app/(tabs)/registrar.tsx` — grilla de productos + bottom sheet de movimiento
- [x] `app/(tabs)/inventario.tsx` + `app/kardex/[id].tsx` — inventario + kárdex PEPS
- [x] `app/(tabs)/caja.tsx` — flujo efectivo/Yape + gastos operativos
- [x] `app/(tabs)/reportes.tsx` — utilidad bruta/neta, margen neto y semáforo por producto
- [x] TypeScript sin errores (`tsc --noEmit` limpio)

### ✅ Todas las pantallas terminadas
La app está completa en su versión MVP. Pasos siguientes opcionales:
- Conectar `services/sheets.ts` con la API real de Google Sheets
- Añadir filtros de fecha en Reportes (hoy / semana / mes)
- Pantalla de ajuste de precio/costo desde Inventario

---

## 7. Imports entre los archivos base

```typescript
// Desde cualquier pantalla en app/ (con @/ apuntando a raíz):
import { Colors, CatIcon, CatBg, Shadow, Radii, Margen, StockAlerta } from '@/constants/theme';
import type { Producto, Movimiento, Gasto, MetodoPago } from '@/types';
import { useStore } from '@/store/useStore';
import { syncMovimiento } from '@/services/sheets';

// Si @/ aún no está configurado, usar rutas relativas:
import { Colors } from '../../constants/theme';
```

> Nota: `expo/tsconfig.base` no define `@/` por defecto. Configurar en `tsconfig.json`
> cuando se construya la primera pantalla:
> ```json
> { "compilerOptions": { "baseUrl": ".", "paths": { "@/*": ["./*"] } } }
> ```

---

## 8. Selección de producto en el store

```typescript
const { productos, movimientos, gastos, registrarVenta, registrarCompra, agregarGasto } = useStore();

// Venta con validación de stock:
const result = registrarVenta(productoId, cantidad, precioUnit, metodo);
if (!result.ok) Alert.alert('Error', result.error);

// Compra (entrada de mercadería):
registrarCompra(productoId, cantidad, precioUnit);

// Gasto operativo:
agregarGasto('Stand feria', 60);
```

---

## 9. Cálculos derivados (NO guardar, siempre recalcular)

```typescript
// Ventas de hoy
const hoy = movimientos.filter(m =>
  m.tipo === 'venta' && new Date(m.fecha).toDateString() === new Date().toDateString()
);

// Valor del inventario al costo
const valorInv = productos.reduce((s, p) => s + p.stock * p.costo, 0);

// Flujo de caja
const totalEfectivo = movimientos.filter(m => m.metodo === 'efectivo').reduce((s, m) => s + m.total, 0);
const totalYape     = movimientos.filter(m => m.metodo === 'yape').reduce((s, m) => s + m.total, 0);

// Rentabilidad
const ingresos    = movimientos.filter(m => m.tipo === 'venta').reduce((s, m) => s + m.total, 0);
const costoVentas = movimientos.filter(m => m.tipo === 'venta')
  .reduce((s, m) => { const p = productos.find(x => x.id === m.productoId)!; return s + m.cantidad * p.costo; }, 0);
const utilidadBruta = ingresos - costoVentas;
const utilidadNeta  = utilidadBruta - gastos.reduce((s, g) => s + g.monto, 0);
const margen        = ingresos ? (utilidadNeta / ingresos) * 100 : 0;

// Margen por producto (para Reportes)
const margenProd = (p: Producto) => p.precio ? ((p.precio - p.costo) / p.precio) * 100 : 0;
```

---

## 10. Reglas de desarrollo

- **Diseño**: copiar el prototipo (`context/prototipo.html`), no inventar.
- **Pkgs**: siempre `npx expo install`, nunca `npm install` para packages RN.
- **Pantallas**: una por una, confirmar con el usuario antes de pasar a la siguiente.
- **Sin `src/`**: todo el código nuevo va en carpetas raíz.
- **Sheets**: no integrar todavía; el stub ya está listo en `services/sheets.ts`.
- **TypeScript**: correr `tsc --noEmit` antes de reportar una pantalla como terminada.
