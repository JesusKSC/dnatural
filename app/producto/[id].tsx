import { useMemo, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, Shadow, Radii, CatIcon } from '@/constants/theme';
import {
  syncProductoUpsert,
  syncProductoEliminar,
} from '@/services/sheets';
import type { Categoria } from '@/types';

const CATEGORIAS: Categoria[] = [
  'Gelatinas',
  'Cápsulas',
  'Polvos',
  'Gomitas',
  'Líquidos',
  'Otros',
];

export default function ProductoEditorScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const { productos, agregarProducto, actualizarProducto, eliminarProducto } =
    useStore();

  const esNuevo = id === 'nuevo';
  const productoId = esNuevo ? -1 : parseInt(String(id), 10);
  const producto = useMemo(
    () => productos.find((p) => p.id === productoId),
    [productos, productoId],
  );

  // ── Estado del formulario ────────────────────────────────────────────────
  const [codigo, setCodigo]         = useState(producto?.codigo ?? '');
  const [nombre, setNombre]         = useState(producto?.nombre ?? '');
  const [categoria, setCategoria]   = useState<Categoria>(producto?.categoria ?? 'Otros');
  const [costoText, setCostoText]   = useState(producto ? String(producto.costo) : '');
  const [precioText, setPrecioText] = useState(producto ? String(producto.precio) : '');
  const [stockText, setStockText]   = useState(producto ? String(producto.stockInicial) : '');

  // Editar un producto que ya no existe (raro): mostrar error
  if (!esNuevo && !producto) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Inventario</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>Producto no encontrado.</Text>
      </View>
    );
  }

  // ── Guardar ──────────────────────────────────────────────────────────────
  const handleGuardar = () => {
    const cod = codigo.trim();
    const nom = nombre.trim();
    const costo  = parseFloat(costoText);
    const precio = parseFloat(precioText);
    const stockInicial = parseInt(stockText, 10);

    if (!cod || !nom) {
      Alert.alert('Faltan datos', 'El código y el nombre son obligatorios.');
      return;
    }
    if (isNaN(costo) || costo < 0 || isNaN(precio) || precio < 0) {
      Alert.alert('Datos inválidos', 'Costo y precio deben ser números válidos.');
      return;
    }
    if (isNaN(stockInicial) || stockInicial < 0) {
      Alert.alert('Datos inválidos', 'El stock inicial debe ser un número válido.');
      return;
    }

    if (esNuevo) {
      const res = agregarProducto({ codigo: cod, nombre: nom, categoria, costo, precio, stockInicial });
      if (!res.ok) {
        Alert.alert('No se pudo crear', res.error ?? 'Error desconocido');
        return;
      }
      const creado = useStore.getState().productos.find(
        (p) => p.codigo.toLowerCase() === cod.toLowerCase(),
      );
      if (creado) syncProductoUpsert(creado).catch(() => {});
    } else {
      const codigoOriginal = producto?.codigo;
      actualizarProducto(productoId, { codigo: cod, nombre: nom, categoria, costo, precio, stockInicial });
      const actualizado = useStore.getState().productos.find((p) => p.id === productoId);
      // Se busca la fila por el código ORIGINAL → reescribe en su sitio aunque cambie el código.
      if (actualizado) syncProductoUpsert(actualizado, codigoOriginal).catch(() => {});
    }

    router.back();
  };

  // ── Eliminar ─────────────────────────────────────────────────────────────
  const handleEliminar = () => {
    if (!producto) return;
    Alert.alert(
      'Eliminar producto',
      `¿Seguro que quieres eliminar "${producto.nombre}"? Esta acción no se puede deshacer.`,
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Eliminar',
          style: 'destructive',
          onPress: () => {
            const cod = producto.codigo;
            eliminarProducto(producto.id);
            syncProductoEliminar(cod).catch(() => {});
            router.back();
          },
        },
      ],
    );
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Inventario</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>{esNuevo ? 'Nuevo producto' : 'Editar producto'}</Text>
        <Text style={styles.title} numberOfLines={2}>
          {esNuevo ? 'Agregar al catálogo' : producto?.nombre}
        </Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.card}>
          {/* Código (bloqueado al editar para no romper el historial) */}
          <Text style={styles.label}>Código</Text>
          <TextInput
            style={[styles.input, !esNuevo && styles.inputLocked]}
            placeholder="Ej: GEL01"
            placeholderTextColor={Colors.gris}
            value={codigo}
            onChangeText={setCodigo}
            editable={esNuevo}
            autoCapitalize="characters"
            autoCorrect={false}
          />
          {!esNuevo && (
            <Text style={styles.hint}>
              🔒 El código no se puede cambiar: es la llave que conecta el producto con sus ventas y compras ya registradas.
            </Text>
          )}

          {/* Nombre */}
          <Text style={styles.label}>Nombre</Text>
          <TextInput
            style={styles.input}
            placeholder="Ej: Gelatina 1kg"
            placeholderTextColor={Colors.gris}
            value={nombre}
            onChangeText={setNombre}
            autoCapitalize="sentences"
          />

          {/* Categoría */}
          <Text style={styles.label}>Categoría</Text>
          <View style={styles.chips}>
            {CATEGORIAS.map((cat) => {
              const activa = cat === categoria;
              return (
                <TouchableOpacity
                  key={cat}
                  style={[styles.chip, activa && styles.chipActiva]}
                  onPress={() => setCategoria(cat)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.chipText, activa && styles.chipTextActiva]}>
                    {CatIcon[cat] ?? '📦'} {cat}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Costo + Precio */}
          <View style={styles.rowDouble}>
            <View style={styles.col}>
              <Text style={styles.label}>Costo de compra</Text>
              <TextInput
                style={styles.input}
                placeholder="S/"
                placeholderTextColor={Colors.gris}
                value={costoText}
                onChangeText={setCostoText}
                keyboardType="numeric"
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Precio de venta</Text>
              <TextInput
                style={styles.input}
                placeholder="S/"
                placeholderTextColor={Colors.gris}
                value={precioText}
                onChangeText={setPrecioText}
                keyboardType="numeric"
              />
            </View>
          </View>

          {/* Stock inicial */}
          <Text style={styles.label}>Stock inicial</Text>
          <TextInput
            style={styles.input}
            placeholder="Cantidad"
            placeholderTextColor={Colors.gris}
            value={stockText}
            onChangeText={setStockText}
            keyboardType="numeric"
          />
          {!esNuevo && (
            <Text style={styles.hint}>
              Al cambiar el stock inicial, el stock actual se ajusta por la misma diferencia.
            </Text>
          )}
        </View>

        {/* Guardar */}
        <TouchableOpacity style={styles.saveBtn} onPress={handleGuardar} activeOpacity={0.85}>
          <Text style={styles.saveBtnText}>
            {esNuevo ? '✓ Crear producto' : '✓ Guardar cambios'}
          </Text>
        </TouchableOpacity>

        {/* Eliminar (solo edición) */}
        {!esNuevo && (
          <TouchableOpacity style={styles.deleteBtn} onPress={handleEliminar} activeOpacity={0.85}>
            <Text style={styles.deleteBtnText}>🗑️ Eliminar producto</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.crema },

  /* Header */
  header: {
    backgroundColor: Colors.bosque,
    paddingHorizontal: 18,
    paddingBottom: 16,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    ...Shadow.md,
    zIndex: 10,
  },
  backBtn: { marginBottom: 10, alignSelf: 'flex-start' },
  backText: { color: Colors.hoja, fontWeight: '700', fontSize: 14 },
  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Colors.hojaSoft,
    fontWeight: '700',
    marginBottom: 2,
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.3,
    lineHeight: 30,
  },

  /* Content */
  scroll: { flex: 1 },
  content: { paddingHorizontal: 16, paddingTop: 18, paddingBottom: 60 },

  /* Card */
  card: {
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.xl,
    padding: 16,
    ...Shadow.sm,
  },

  label: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.carbon,
    marginTop: 12,
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: 12,
    paddingHorizontal: 13,
    paddingVertical: 11,
    fontSize: 15,
    color: Colors.carbon,
    backgroundColor: Colors.papel,
  },
  inputLocked: {
    backgroundColor: Colors.crema2,
    color: Colors.gris,
  },
  hint: {
    fontSize: 12,
    color: Colors.gris,
    marginTop: 6,
    lineHeight: 17,
  },

  /* Chips de categoría */
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.full,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.crema,
  },
  chipActiva: { backgroundColor: Colors.verde, borderColor: Colors.verde },
  chipText: { fontSize: 13, color: Colors.gris, fontWeight: '600' },
  chipTextActiva: { color: '#fff' },

  /* Costo + precio en fila */
  rowDouble: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },

  /* Botones */
  saveBtn: {
    backgroundColor: Colors.verde,
    borderRadius: Radii.lg,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: 18,
    ...Shadow.sm,
  },
  saveBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  deleteBtn: {
    borderRadius: Radii.lg,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
    borderWidth: 1,
    borderColor: Colors.rojo,
    backgroundColor: Colors.rojoSoft,
  },
  deleteBtnText: { color: Colors.rojo, fontWeight: '700', fontSize: 15 },

  /* Error */
  notFound: {
    color: Colors.gris,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 18,
  },
});
