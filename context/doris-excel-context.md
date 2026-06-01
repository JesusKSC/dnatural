# Contexto del negocio — NatuStock (D'Natural)

> Documento de contexto para el desarrollo del aplicativo móvil. Resume el contenido
> y la lógica del Excel original de la emprendedora ("Check list Doris.xlsx").
> Úsalo como fuente de verdad para el modelo de datos y las reglas de negocio.

## 1. Qué es el negocio

D'Natural ("Vida Saludable") es un emprendimiento que **importa productos naturales**
(gelatinas, gomitas, cápsulas, polvos, líquidos, miel) y los **revende en Perú** a un
precio mayor. La dueña opera **solo desde celular o tablet** (no tiene laptop) y no maneja
bien Excel. El objetivo del app es reemplazar el Excel por una interfaz simple de "tocar":
elegir producto → cantidad → método de pago → guardar.

## 2. Hojas del Excel original y su función

| Hoja | Función | Uso en el app |
|------|---------|---------------|
| **BASE** | Registro diario (DÍA 1–4) por producto: saldo inicial, costo, otros costos prorrateados, cantidad vendida (efectivo/electrónico), ventas, saldo final, margen y % participación. | Origen del modelo de movimientos. |
| **KARDEX PILOTO** | Control de inventario (COMPRAS / SALIDAS / SALDOS) con método **PEPS**. Es lo que se le complica a la dueña. | Módulo Kárdex (se calcula, no se guarda). |
| **FLUJO DE CAJA FINAL** | Separa ventas en **efectivo** vs **Yape/transferencia** por día. | Módulo Flujo de caja. |
| **PRODUCTOS / PROD** | Maestro de productos: costo unitario, precio venta, stock inicial. | Tabla `productos`. |
| **VENTAS** | Bitácora simple de ventas. | Tabla `movimientos` (tipo=venta). |
| **RENTABILIDAD** | Utilidad y margen por producto (costo variable + fijo). | Módulo Reportes. |
| Costos adicionales (dentro de BASE) | Almuerzo, movilidad, alquiler, stand → se **prorratean** entre productos. | Tabla `gastos`. |

## 3. Reglas de negocio importantes

- **Método de valorización: PEPS** (primeras entradas, primeras salidas). Como la dueña
  importa y revende, la SUNAT puede exigir PEPS o promedio; por eso conviene guardar el
  costo de cada compra (lote), no un costo fijo único.
- **Medios de pago:** toda venta es `efectivo` o `yape` (Yape/transferencia). Hay que
  poder separarlos en el flujo de caja.
- **Costos adicionales prorrateados:** gastos como stand, movilidad y alquiler se
  reparten entre los productos. En el app se registran como gastos operativos aparte.
- **Márgenes de referencia (de la reunión):** sano 20–30%; bueno 25–30%; bajo 10–15%.
  Por debajo de 15% conviene revisar precios o costos de importación.
- **Stock no puede quedar negativo:** validar que haya stock suficiente antes de una venta.
- El inventario se renueva cada cierto tiempo (nuevas importaciones = compras).

## 4. Modelo de datos sugerido

```
productos(id, codigo, nombre, categoria, foto_url, costo_unit, precio_venta, stock)
movimientos(id, fecha, tipo['compra'|'venta'], producto_id -> productos,
            cantidad, precio_unit, metodo_pago['efectivo'|'yape'], total)
gastos(id, fecha, concepto, monto)
```

- **Kárdex, flujo de caja y rentabilidad NO se guardan**: se calculan a partir de
  `movimientos` para evitar datos contradictorios.
- Categorías observadas: Gelatinas, Cápsulas, Polvos, Gomitas, Líquidos, Otros.

## 5. Módulos del app

1. Maestro de Productos (imprescindible)
2. Registrar Movimiento – Compra/Venta (imprescindible)
3. Inventario / Kárdex (imprescindible — el módulo central)
4. Flujo de Caja (recomendado)
5. Reportes / Rentabilidad (recomendado)
6. Gastos (opcional)

## 6. Integración con Google Sheets (requisito del curso)

Cada movimiento registrado en el celular debe reflejarse como una fila nueva en una
Google Sheet en vivo, vía la Google Sheets API (librería `gspread` con una cuenta de
servicio). Arquitectura elegida: el app tiene su propia base de datos Y **además**
escribe en la Google Sheet (lo mejor de los dos mundos).

## 7. Stack

- Frontend: Expo + React Native (corre en Android, iOS y web).
- Backend: FastAPI + SQLite/PostgreSQL, con Swagger UI en `/docs`.
- Sincronización: Google Sheets API.
