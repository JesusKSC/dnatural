# CLAUDE.md — NatuStock (D'Natural)

> Lee este archivo PRIMERO antes de tocar cualquier código.
> Contexto completo del proyecto, reglas de negocio, decisiones técnicas y estado actual.

---

## 1. Qué es el proyecto

**NatuStock** es una app móvil (Expo / React Native) de gestión comercial para **Doris**,
dueña de **D'Natural "Vida Saludable"**. Vende productos naturales en ferias de Perú, **solo
desde celular**. La app es su "control remoto": **elegir producto → cantidad → método de pago → guardar**.

La app cumple **dos roles**:
1. **Registrar** ventas/compras y **gestionar el inventario** (CRUD de productos) de forma simple.
2. **Sincronizar** cada acción a un **Google Sheets** que hace toda la contabilidad (KARDEX,
   RENTABILIDAD, Cash Flow) con fórmulas. **El Sheets es el "cerebro"; la app es el control remoto.**

Contexto del negocio: `context/doris-excel-context.md` · Prototipo visual: `context/prototipo.html`

---

## 2. Reglas de negocio — NO negociables

| Regla | Detalle |
|-------|---------|
| **Stock nunca negativo** | Validar antes de `registrarVenta` (el store ya lo hace). |
| **Métodos de pago** | Solo `'efectivo'` o `'yape'`. Mapeo a Sheets: efectivo→"Efectivo", yape→"Yape / Plin". |
| **Códigos EXACTOS** | Los códigos de producto (`GEL01`, `MAG01`…) deben coincidir EXACTO con la columna A de la BASE DE DATOS del Sheets, o el KARDEX no hace match. |
| **Alerta de stock** | ≤5 → badge "bajo". 0 → "agotado". (`constants/theme.ts → StockAlerta`) |
| **La contabilidad vive en el Sheets** | KARDEX, RENTABILIDAD y Cash Flow se calculan con fórmulas en Google Sheets. La app NO escribe en esas hojas. |

---

## 3. Diseño visual

Fuente de verdad: `context/prototipo.html`. Respetar `constants/theme.ts`:
- Colores (`Colors`: bosque/verde/hoja/crema…), `CatIcon`, `CatBg`, `Radii`, `Shadow`.
- Header verde bosque con bordes redondeados abajo.
- Bottom nav con FAB central elevado (botón Registrar).
- Cards blancas, borde `linea`, sombra `sm`.

---

## 4. Stack técnico

| Capa | Tecnología |
|------|-----------|
| Framework | **Expo** + **Expo Router** (file-based, `experiments.typedRoutes` ON) |
| Estado | **Zustand** + `persist` con `AsyncStorage` (`store/useStore.ts`) |
| Auth | **Firebase Authentication** (correo/contraseña) — proyecto `dnatural-b73cc` |
| Sheets | **Google Apps Script Web App** (no API key) — `services/sheets.ts` |
| Instalación pkgs | `npx expo install` (no `npm install` directo) |

> ⚠️ `npx expo install firebase` instaló firebase v12. `getReactNativePersistence` existe en el
> bundle RN pero no en los tipos por defecto → se toma con un cast en `services/firebase.ts`.
> Correr `npx tsc --noEmit` siempre antes de dar por terminado.

> ⚠️ **Typed routes**: al crear/borrar rutas, `tsc` falla hasta que se regenere
> `.expo/types/router.d.ts`. Se regenera solo al correr `expo start`; si hace falta antes,
> se edita a mano replicando el patrón de las rutas existentes.

---

## 5. Estructura de carpetas (actual)

```
app/
├── _layout.tsx              ← root: AuthProvider + "portero" (redirige login/app)
├── (auth)/                  ← grupo de autenticación
│   ├── _layout.tsx
│   ├── login.tsx            ← ingresar (correo + contraseña)
│   ├── registro.tsx         ← crear cuenta  ⚠️ ver §8 seguridad
│   └── recuperar.tsx        ← recuperar contraseña por correo
├── (tabs)/
│   ├── _layout.tsx          ← bottom nav: Inicio · Registrar(FAB) · Inventario
│   ├── index.tsx            ← Inicio (dashboard + botón Cerrar sesión)
│   ├── registrar.tsx        ← grilla de productos + bottom sheet de movimiento
│   └── inventario.tsx       ← lista + buscar + "＋ Nuevo" + ✏️ editar
├── producto/[id].tsx        ← CRUD producto (crear / editar / eliminar); id="nuevo" = crear
└── kardex/[id].tsx          ← kárdex PEPS local de un producto
components/                  ← ProductRow, Badge, MetricCard, KardexTable…
constants/theme.ts           ← colores, sombras, CatIcon, CatBg, umbrales
context/AuthContext.tsx      ← estado de sesión (onAuthStateChanged)
data/productos.json          ← seed 31 productos (códigos GEL01…MAG04)
services/
├── firebase.ts              ← init Firebase + helpers de auth (config dnatural-b73cc)
└── sheets.ts                ← sincronización con Google Sheets vía Apps Script
store/useStore.ts            ← Zustand + persist (version 2)
types/index.ts               ← Producto, Movimiento, Gasto, uniones
```

> ❌ **NO existen** `caja.tsx` ni `reportes.tsx` — se eliminaron (esa contabilidad vive en el Sheets).
> El bottom nav tiene 3 items con Registrar (FAB) al centro.

---

## 6. Store (`store/useStore.ts`)

```typescript
const {
  productos, movimientos, gastos,
  registrarVenta, registrarCompra, agregarGasto,
  agregarProducto, actualizarProducto, eliminarProducto,
} = useStore();

registrarVenta(productoId, cantidad, precioUnit, metodo); // valida stock → { ok, error? }
registrarCompra(productoId, cantidad, precioUnit);
agregarProducto({ codigo, nombre, categoria, costo, precio, stockInicial }); // { ok, error? } (código único)
actualizarProducto(id, cambios);   // si cambia stockInicial, ajusta stock por el delta
eliminarProducto(id);
```

- `persist` con `version: 2` + `migrate`. El seed `productos.json` es solo estado inicial/offline.
- **Inventario SHEET-DRIVEN (lectura):** `sincronizarInventario(data)` REEMPLAZA la lista de
  productos local por la del KARDEX (preservando id/categoría por código) y mapea los movimientos
  (Ventas/Compras formulario) a `movimientos`. También guarda `valorInventarioSheets`. Así el
  inventario = lo que está en el Sheets, igual en **cualquier celular/cuenta** (datos permanentes).
- "Valor del inventario" (Inicio) = suma de `stock × costo` de los productos = total del KARDEX
  (porque los productos traen Stock Actual × Costo promedio del KARDEX); se actualiza al instante.

---

## 7. Integración Google Sheets (`services/sheets.ts` + Apps Script)

**Mecanismo:** la app hace `POST` a un **Web App de Apps Script** (`SCRIPT_URL`) pegado a la hoja.
La hoja es la fuente de verdad contable. La app **solo escribe datos de entrada**; las columnas de
fórmula (Totales, Stock Actual, Estado…) las calcula la hoja.

**Hojas (pestañas):** `BASE DE DATOS` · `Compras formulario` · `Ventas formulario` · `KARDEX` ·
`RENTABILIDAD` · `Cash Flow`.

**Funciones de la app:**
- `syncMovimiento(mov, "CÓDIGO - Nombre")` → VENTA agrega fila a "Ventas formulario" (A–F:
  timestamp, fecha DD/MM/YYYY, "CÓDIGO - Nombre", cantidad, precio, método). COMPRA → "Compras
  formulario" (A–E). El script las **inserta encima de la fila TOTAL**.
- `syncProductoUpsert(p, codigoBusqueda?)` → crea/edita el producto en **BASE DE DATOS y KARDEX**
  (payload `{ accion:"upsertProducto", codigo, destinos:[{hoja, anclaCodigo?, campos}] }`). Solo
  manda columnas de entrada; el script **hereda las fórmulas** de la fila de arriba al insertar.
  Nuevos productos: BASE DE DATOS arriba de `OTR01`, KARDEX arriba de `TOTALES`.
- `syncProductoEliminar(codigo)` → borra de BASE DE DATOS y KARDEX.
- `syncGasto` → **no-op** (la hoja no tiene pestaña de gastos).
- `fetchInventarioSheets()` / `refrescarInventario()` → la app **LEE** del KARDEX vía **`doGet`**
  (`SCRIPT_URL?accion=inventario`): por producto `{ codigo, nombre, costo(=Costo nueva compra=promedio),
  precio, stockInicial, stock(=Stock Actual) }` + `movimientos` (Ventas/Compras formulario) + `valorInventario`.
  Se llama al abrir la app y tras cada venta/compra.

**Costo promedio (KARDEX col "Costo nueva compra"):** fórmula auto-contenida por producto:
`=SI.ERROR(SUMAR.SI.CONJUNTO('Compras formulario'!$F:$F;'Compras formulario'!$C:$C;$A6&" - *")/SUMAR.SI.CONJUNTO('Compras formulario'!$D:$D;'Compras formulario'!$C:$C;$A6&" - *");C6)`
→ se hereda al insertar productos nuevos. **Valor Inventario = Stock Actual × Costo nueva compra.**
Las filas TOTALES del KARDEX usan suma elástica `=SUMA(K6:INDIRECTO("K"&(FILA()-1)))` (se expanden con nuevos productos).

> Helpers del Apps Script (en la hoja, NO en el repo): `doPost`, `doGet`, `upsertProducto`,
> `leerMovimientos`, `fechaISO`, `buscarFilaTotal`, `buscarFilaPorCodigo`, `buscarFilaEncabezado`,
> `encontrarCampo`, `indiceHeader`, `num`, `ok`. **Tras editarlo: re-desplegar nueva versión.**

**Reglas de matching (clave):** la columna "Producto" de los formularios guarda `"CÓDIGO - Nombre"`.
Las fórmulas de KARDEX/BASE DE DATOS que cuentan ventas/compras usan **comodín**:
`SUMAR.SI('Ventas formulario'!$C:$C; $A6&" - *"; 'Ventas formulario'!$D:$D)`.
Las filas TOTALES usan suma elástica: `=SUMA(E6:INDIRECTO("E"&(FILA()-1)))`.

> El código del Apps Script (doPost + helpers `upsertProducto`, `buscarFilaTotal`,
> `buscarFilaPorCodigo`, `buscarFilaEncabezado`, `encontrarCampo`) se mantiene en la hoja, NO en el
> repo. Tras editarlo hay que **re-desplegar** (Implementar → Gestionar implementaciones → Nueva
> versión). La URL del `/exec` no cambia salvo despliegue nuevo; si cambia, actualizar `SCRIPT_URL`.

---

## 8. Autenticación (Firebase)

- `services/firebase.ts`: `initializeApp` + `initializeAuth` con persistencia AsyncStorage
  (sesión sobrevive al cerrar la app). Helpers: `iniciarSesion`, `registrarUsuario`,
  `cerrarSesion`, `recuperarPassword`, `mensajeError`. Config del proyecto `dnatural-b73cc`
  ya pegada (la `apiKey` web no es secreta).
- `context/AuthContext.tsx`: expone `{ user, cargando }` vía `onAuthStateChanged`.
- `app/_layout.tsx`: "portero" — sin sesión → `/(auth)/login`; con sesión → `/`.
- Logout: botón al final de Inicio.
- En consola: Authentication → Email/Password **habilitado**; usuarios en pestaña "Usuarios".

> ⚠️ **SEGURIDAD pendiente antes del APK final:** la pantalla `registro.tsx` es pública →
> cualquiera con el APK podría auto-registrarse. Recomendado: **quitar el registro** y crear la
> cuenta de Doris manualmente en la consola (Authentication → Agregar usuario), dejando solo
> login + recuperar.

---

## 9. Reglas de desarrollo

- **Diseño**: copiar el prototipo, no inventar estilos.
- **Pkgs**: siempre `npx expo install`.
- **Sin `src/`**: el código vive en carpetas raíz (`app/`, `services/`, etc.).
- **TypeScript**: correr `npx tsc --noEmit` antes de reportar algo como terminado.
- **Sheets**: la app nunca escribe en KARDEX/RENTABILIDAD/Cash Flow; solo en los formularios y en
  las columnas de entrada de BASE DE DATOS/KARDEX. Respetar el formato `"CÓDIGO - Nombre"`.
- **Cambios en el Apps Script**: recordar re-desplegar nueva versión.

---

## 10. Estado actual

### ✅ Completado
- Seed 31 productos con códigos reales (GEL01…); theme; tipos; store con CRUD completo.
- Pantallas: Inicio, Registrar, Inventario, editor de producto (CRUD), kárdex.
- Bottom nav reducido a Inicio · Registrar · Inventario (caja/reportes eliminados).
- Integración Google Sheets real (ventas, compras, alta/edición/baja de productos en BASE DE
  DATOS + KARDEX, con herencia de fórmulas e inserción ordenada).
- Login Firebase (login, registro, recuperar) + persistencia + portero + logout.
- `tsc --noEmit` limpio.

- Inventario sheet-driven: la app lee productos/movimientos/valor del KARDEX (doGet) → datos
  permanentes y compartidos en cualquier celular/cuenta.
- Costo promedio ponderado en KARDEX + valor de inventario según promedio.
- APK Android generado (perfil `preview`); ícono y splash con logo de hoja; ojo en contraseñas;
  teclado con `softwareKeyboardLayoutMode: "pan"`.

### ⏳ Pendiente
- **Seguridad**: quitar registro público / crear usuario único (ver §8).
- **iPhone (la dueña usa iPhone):** ver §11. Pendiente decidir TestFlight.

---

## 11. Distribución / Build

- **APK Android (hecho):** `eas build --platform android --profile preview` → `.apk` directo
  (Yes al keystore la 1ª vez). El archivo descarga con nombre = build id (renombrar a mano).
- **QR Expo Go (EAS Update):** `eas update --branch preview --message "..."`. Requiere
  `runtimeVersion: "exposdk:54.0.0"` en `app.json` para que Expo Go (SDK 54) cargue el update.
  ⚠️ Inestable: a veces da *"Failed to download remote update"*. Si pasa, usar el túnel.
- **Túnel (demo confiable):** `npm run tunnel` (ngrok ya configurado con NGROK_AUTHTOKEN en el
  script). Funciona en Expo Go (Android/iPhone) **pero necesita la PC encendida**.
- **iPhone / iOS:** NO hay `.apk`/`.aab` para iPhone. Expo Go solo sirve para demo (con túnel o
  EAS Update). Para uso real **permanente sin PC** → **TestFlight** (cuenta Apple Developer
  **$99/año**, EAS construye el `.ipa` desde Windows, sin Mac). Firebase Auth funciona en iOS.
