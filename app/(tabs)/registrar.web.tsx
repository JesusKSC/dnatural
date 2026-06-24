import { useState, useMemo } from 'react';
import {
  View, Text, TextInput, FlatList, TouchableOpacity,
  ScrollView, Modal, StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { syncMovimiento, refrescarInventario } from '@/services/sheets';
import { Colors, Shadow, Radii, CatIcon, CatBg } from '@/constants/theme';
import { fmt } from '@/utils/format';
import ProductTile from '@/components/ProductTile';
import Toast from '@/components/Toast';
import type { Producto, MetodoPago } from '@/types';

type Tipo = 'venta' | 'compra';

export default function RegistrarScreen() {
  const insets = useSafeAreaInsets();
  const { productos, registrarVenta, registrarCompra } = useStore();

  const [tipo,   setTipo]   = useState<Tipo>('venta');
  const [query,  setQuery]  = useState('');
  const [catSel, setCatSel] = useState('Todos');

  const [selected,      setSelected]      = useState<Producto | null>(null);
  const [modalVisible,  setModalVisible]  = useState(false);
  const [qty,           setQty]           = useState(1);
  const [precioText,    setPrecioText]    = useState('0');
  const [metodo,        setMetodo]        = useState<MetodoPago>('yape');
  const [toastMsg,      setToastMsg]      = useState('');
  const [toastVisible,  setToastVisible]  = useState(false);

  const precioUnit = parseFloat(precioText) || 0;
  const total      = qty * precioUnit;
  const esVenta    = tipo === 'venta';

  const categorias = useMemo(
    () => ['Todos', ...Array.from(new Set(productos.map(p => p.categoria)))],
    [productos],
  );
  const lista = useMemo(() => {
    const q = query.toLowerCase().trim();
    return productos.filter(
      p => (catSel === 'Todos' || p.categoria === catSel) &&
           (q === '' || p.nombre.toLowerCase().includes(q)),
    );
  }, [productos, query, catSel]);

  const abrirSheet = (producto: Producto) => {
    setSelected(producto);
    setQty(1);
    setPrecioText(String(esVenta ? producto.precio : producto.costo));
    setMetodo('yape');
    setModalVisible(true);
  };

  const cerrar = () => setModalVisible(false);

  const showToast = (msg: string) => {
    setToastMsg(msg); setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const guardar = () => {
    if (!selected) return;
    if (esVenta) {
      const result = registrarVenta(selected.id, qty, precioUnit, metodo);
      if (!result.ok) { Alert.alert('Sin stock', result.error ?? 'Stock insuficiente'); return; }
    } else {
      registrarCompra(selected.id, qty, precioUnit);
    }
    const { movimientos } = useStore.getState();
    syncMovimiento(movimientos[movimientos.length - 1], `${selected.codigo} - ${selected.nombre}`).catch(() => {});
    setTimeout(() => { refrescarInventario().catch(() => {}); }, 1800);
    cerrar();
    showToast(esVenta ? `✅ Venta registrada · ${selected.nombre}` : `📥 Compra registrada · ${selected.nombre}`);
  };

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.eyebrow}>Movimiento rápido</Text>
        <Text style={styles.title}>Registrar</Text>
      </View>

      <FlatList
        data={lista} numColumns={2} keyExtractor={p => String(p.id)}
        renderItem={({ item }) => <ProductTile producto={item} onPress={() => abrirSheet(item)} />}
        columnWrapperStyle={styles.gridRow}
        contentContainerStyle={styles.gridContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        ListHeaderComponent={
          <View>
            <View style={styles.toggle}>
              <TouchableOpacity style={[styles.toggleBtn, esVenta && styles.toggleBtnVenta]} onPress={() => setTipo('venta')} activeOpacity={0.8}>
                <Text style={[styles.toggleText, esVenta && styles.toggleTextOn]}>🛒 Venta</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.toggleBtn, !esVenta && styles.toggleBtnCompra]} onPress={() => setTipo('compra')} activeOpacity={0.8}>
                <Text style={[styles.toggleText, !esVenta && styles.toggleTextOn]}>📥 Compra</Text>
              </TouchableOpacity>
            </View>
            <TextInput style={styles.search} placeholder="🔍 Buscar producto..." placeholderTextColor={Colors.gris} value={query} onChangeText={setQuery} autoCorrect={false} autoCapitalize="none" />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.catsContent} style={styles.catsScroll}>
              {categorias.map(cat => (
                <TouchableOpacity key={cat} style={[styles.chip, catSel === cat && styles.chipOn]} onPress={() => setCatSel(cat)} activeOpacity={0.7}>
                  <Text style={[styles.chipText, catSel === cat && styles.chipTextOn]}>{cat}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={<View style={styles.empty}><Text style={styles.emptyIcon}>🔍</Text><Text style={styles.emptyText}>Sin resultados</Text></View>}
      />

      <Toast visible={toastVisible} message={toastMsg} />

      <Modal visible={modalVisible} transparent animationType="slide" onRequestClose={cerrar}>
        <TouchableOpacity style={styles.scrim} activeOpacity={1} onPress={cerrar} />
        <View style={styles.webSheet}>
          <View style={styles.grab} />
          <ScrollView contentContainerStyle={styles.sheetContent} keyboardShouldPersistTaps="handled">
            {selected && (
              <>
                <View style={styles.sheetTop}>
                  <View style={[styles.sheetPh, { backgroundColor: CatBg[selected.categoria] ?? Colors.crema2 }]}>
                    <Text style={styles.sheetPhIcon}>{CatIcon[selected.categoria] ?? '📦'}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.sheetNombre} numberOfLines={2}>{selected.nombre}</Text>
                    <Text style={styles.sheetSub}>{esVenta ? 'Registrar venta' : 'Registrar compra'} · Stock: {selected.stock} u</Text>
                  </View>
                </View>

                <Text style={styles.fldLabel}>Cantidad</Text>
                <View style={styles.stepper}>
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQty(q => Math.max(1, q - 1))} activeOpacity={0.75}><Text style={styles.stepBtnText}>−</Text></TouchableOpacity>
                  <TextInput style={styles.stepInput} value={String(qty)} onChangeText={t => { const n = parseInt(t, 10); setQty(isNaN(n) || n < 1 ? 1 : n); }} keyboardType="numeric" textAlign="center" selectTextOnFocus />
                  <TouchableOpacity style={styles.stepBtn} onPress={() => setQty(q => q + 1)} activeOpacity={0.75}><Text style={styles.stepBtnText}>+</Text></TouchableOpacity>
                </View>

                {esVenta && (
                  <>
                    <Text style={[styles.fldLabel, styles.fldLabelMt]}>Método de pago</Text>
                    <View style={styles.opts}>
                      {([{ value: 'yape', emoji: '📲', label: 'Yape / Transf.' }, { value: 'efectivo', emoji: '💵', label: 'Efectivo' }] as const).map(opt => (
                        <TouchableOpacity key={opt.value} style={[styles.optBtn, metodo === opt.value && styles.optBtnOn]} onPress={() => setMetodo(opt.value)} activeOpacity={0.75}>
                          <Text style={styles.optEmoji}>{opt.emoji}</Text>
                          <Text style={[styles.optText, metodo === opt.value && styles.optTextOn]}>{opt.label}</Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  </>
                )}

                <Text style={[styles.fldLabel, styles.fldLabelMt]}>{esVenta ? 'Precio de venta unitario' : 'Costo de compra unitario'}</Text>
                <View style={styles.priceln}>
                  <Text style={styles.pricePrefix}>S/</Text>
                  <TextInput style={styles.priceInput} value={precioText} onChangeText={setPrecioText} keyboardType="numeric" selectTextOnFocus />
                </View>

                <View style={styles.totalBox}>
                  <Text style={styles.totalLabel}>Total</Text>
                  <Text style={styles.totalValue}>S/{fmt(total)}</Text>
                </View>

                <TouchableOpacity style={[styles.saveBtn, !esVenta && styles.saveBtnCompra]} onPress={guardar} activeOpacity={0.85}>
                  <Text style={styles.saveBtnText}>{esVenta ? '✓ Guardar venta' : '✓ Guardar compra'}</Text>
                </TouchableOpacity>
              </>
            )}
          </ScrollView>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.crema },
  header: { backgroundColor: Colors.bosque, paddingHorizontal: 18, paddingBottom: 16, borderBottomLeftRadius: Radii.xxl, borderBottomRightRadius: Radii.xxl, ...Shadow.md, zIndex: 10 },
  eyebrow: { fontSize: 11, letterSpacing: 2.5, textTransform: 'uppercase', color: Colors.hojaSoft, fontWeight: '700', marginBottom: 2 },
  title:   { fontSize: 26, fontWeight: '600', color: '#fff', letterSpacing: -0.3 },
  toggle:  { flexDirection: 'row', backgroundColor: Colors.papel, borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.lg, padding: 5, gap: 5, marginBottom: 16, ...Shadow.sm },
  toggleBtn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: 'center' },
  toggleBtnVenta:  { backgroundColor: Colors.verde, ...Shadow.sm },
  toggleBtnCompra: { backgroundColor: Colors.miel,  ...Shadow.sm },
  toggleText:  { fontWeight: '700', fontSize: 15, color: Colors.gris },
  toggleTextOn:{ color: '#fff' },
  search:      { backgroundColor: Colors.papel, borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.md, paddingHorizontal: 15, paddingVertical: 12, fontSize: 15, color: Colors.carbon, marginBottom: 14, ...Shadow.sm },
  catsScroll:  { marginBottom: 6 },
  catsContent: { gap: 7, paddingBottom: 10 },
  chip:        { borderWidth: 1, borderColor: Colors.linea, backgroundColor: Colors.papel, paddingHorizontal: 14, paddingVertical: 7, borderRadius: Radii.full },
  chipOn:      { backgroundColor: Colors.bosque, borderColor: Colors.bosque },
  chipText:    { fontWeight: '600', fontSize: 12, color: Colors.gris },
  chipTextOn:  { color: '#fff' },
  gridRow:     { gap: 11 },
  gridContent: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 120, gap: 11 },
  empty:       { alignItems: 'center', paddingVertical: 40 },
  emptyIcon:   { fontSize: 36, marginBottom: 10 },
  emptyText:   { color: Colors.gris, fontSize: 14 },
  scrim:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(20,40,28,0.55)' },
  webSheet:    { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: Colors.crema, borderTopLeftRadius: Radii.xxl, borderTopRightRadius: Radii.xxl, maxHeight: '80%', paddingBottom: 24 },
  grab:        { width: 40, height: 4, backgroundColor: Colors.linea, borderRadius: 9, alignSelf: 'center', marginVertical: 10 },
  sheetContent:{ paddingHorizontal: 20, paddingBottom: 28 },
  sheetTop:    { flexDirection: 'row', gap: 13, alignItems: 'center', marginBottom: 18 },
  sheetPh:     { width: 62, height: 62, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  sheetPhIcon: { fontSize: 30 },
  sheetNombre: { fontWeight: '600', fontSize: 19, color: Colors.bosque, lineHeight: 22 },
  sheetSub:    { fontSize: 12, color: Colors.gris, marginTop: 3 },
  fldLabel:    { fontSize: 11, fontWeight: '700', color: Colors.gris, textTransform: 'uppercase', letterSpacing: 0.9, marginBottom: 8 },
  fldLabelMt:  { marginTop: 15 },
  stepper:     { flexDirection: 'row', alignItems: 'center', gap: 14, backgroundColor: Colors.papel, borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.lg, padding: 8 },
  stepBtn:     { width: 52, height: 52, borderRadius: 13, backgroundColor: Colors.bosque, alignItems: 'center', justifyContent: 'center' },
  stepBtnText: { fontSize: 28, fontWeight: '300', color: '#fff', lineHeight: 32 },
  stepInput:   { flex: 1, fontSize: 32, fontWeight: '600', color: Colors.bosque, textAlign: 'center', paddingVertical: 0 },
  opts:        { flexDirection: 'row', gap: 9 },
  optBtn:      { flex: 1, borderWidth: 1, borderColor: Colors.linea, backgroundColor: Colors.papel, padding: 13, borderRadius: Radii.md, alignItems: 'center', gap: 3 },
  optBtnOn:    { borderColor: Colors.verde, backgroundColor: 'rgba(127,194,65,0.12)' },
  optEmoji:    { fontSize: 20 },
  optText:     { fontWeight: '700', fontSize: 14, color: Colors.gris },
  optTextOn:   { color: Colors.verde },
  priceln:     { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.papel, borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.md, paddingHorizontal: 14 },
  pricePrefix: { fontWeight: '700', color: Colors.gris, fontSize: 16 },
  priceInput:  { flex: 1, paddingVertical: 14, paddingLeft: 8, fontSize: 22, fontWeight: '600', color: Colors.bosque },
  totalBox:    { backgroundColor: Colors.bosque, borderRadius: Radii.lg, paddingHorizontal: 18, paddingVertical: 14, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4, marginBottom: 16 },
  totalLabel:  { color: 'rgba(255,255,255,0.85)', fontWeight: '600', fontSize: 15 },
  totalValue:  { color: '#fff', fontWeight: '700', fontSize: 26 },
  saveBtn:      { backgroundColor: Colors.verde, borderRadius: Radii.lg, paddingVertical: 17, alignItems: 'center', ...Shadow.md },
  saveBtnCompra:{ backgroundColor: Colors.miel },
  saveBtnText:  { color: '#fff', fontWeight: '800', fontSize: 16, letterSpacing: 0.2 },
});
