import { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, Shadow, Radii } from '@/constants/theme';
import { fmt } from '@/utils/format';
import { syncGasto } from '@/services/sheets';
import MetricCard from '@/components/MetricCard';
import Toast from '@/components/Toast';

// ─── Componente interno: línea de flujo ──────────────────────────────────────

interface FlowLineProps {
  label:     string;
  value:     string;
  colorKey:  'in' | 'out';
  separator?: boolean;
  isTotal?:  boolean;
}

function FlowLine({ label, value, colorKey, separator, isTotal }: FlowLineProps) {
  const valueColor = colorKey === 'in' ? Colors.verde : Colors.rojo;
  return (
    <View
      style={[
        styles.flowLine,
        separator && styles.flowLineSep,
        isTotal   && styles.flowLineTotal,
      ]}
    >
      <Text style={isTotal ? styles.flowLabelTot : styles.flowLabel}>{label}</Text>
      <Text style={[isTotal ? styles.flowValueTot : styles.flowValue, { color: valueColor }]}>
        {value}
      </Text>
    </View>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function CajaScreen() {
  const { movimientos, gastos, agregarGasto } = useStore();
  const insets = useSafeAreaInsets();

  const [concepto,    setConcepto]    = useState('');
  const [montoText,   setMontoText]   = useState('');
  const [toastMsg,    setToastMsg]    = useState('');
  const [toastVisible,setToastVisible]= useState(false);

  // ── Cálculos derivados (nunca guardados) ─────────────────────────────────
  const ventas        = movimientos.filter(m => m.tipo === 'venta');
  const efectivo      = ventas.filter(m => m.metodo === 'efectivo').reduce((s, m) => s + m.total, 0);
  const yape          = ventas.filter(m => m.metodo === 'yape').reduce((s, m) => s + m.total, 0);
  const totalEntradas = efectivo + yape;

  const compras       = movimientos.filter(m => m.tipo === 'compra').reduce((s, m) => s + m.total, 0);
  const totalGastos   = gastos.reduce((s, g) => s + g.monto, 0);
  const totalSalidas  = compras + totalGastos;

  const saldo  = totalEntradas - totalSalidas;
  const efPct  = totalEntradas > 0 ? (efectivo / totalEntradas) * 100 : 0;
  const yaPct  = totalEntradas > 0 ? (yape    / totalEntradas) * 100 : 0;

  // ── Handlers ─────────────────────────────────────────────────────────────
  const showToast = (msg: string) => {
    setToastMsg(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2200);
  };

  const handleAgregarGasto = () => {
    const c = concepto.trim();
    const m = parseFloat(montoText);
    if (!c || isNaN(m) || m <= 0) {
      Alert.alert('Datos incompletos', 'Escribe concepto y monto válido.');
      return;
    }
    agregarGasto(c, m);
    // Sync a Google Sheets (fire & forget)
    const { gastos } = useStore.getState();
    syncGasto(gastos[gastos.length - 1]).catch(() => {});
    setConcepto('');
    setMontoText('');
    showToast('🧾 Gasto registrado');
  };

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.eyebrow}>Entradas y salidas</Text>
        <Text style={styles.title}>Flujo de caja</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* ── Card Entradas ── */}
        <View style={styles.flowCard}>
          <FlowLine
            label="💵 Ventas en efectivo"
            value={`S/${fmt(efectivo)}`}
            colorKey="in"
            separator
          />
          <FlowLine
            label="📲 Ventas Yape / transf."
            value={`S/${fmt(yape)}`}
            colorKey="in"
            separator
          />
          <FlowLine
            label="Total entradas"
            value={`S/${fmt(totalEntradas)}`}
            colorKey="in"
            isTotal
          />

          {/* Barra efectivo vs Yape */}
          <View style={styles.barWrap}>
            <View style={styles.bar}>
              <View style={[styles.barEf, { width: `${efPct}%` }]} />
              <View style={[styles.barYa, { width: `${yaPct}%` }]} />
            </View>
            <View style={styles.legend}>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.verde }]} />
                <Text style={styles.legendText}>Efectivo</Text>
              </View>
              <View style={styles.legendItem}>
                <View style={[styles.legendDot, { backgroundColor: Colors.hoja }]} />
                <Text style={styles.legendText}>Yape/Transf.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* ── Card Salidas ── */}
        <View style={styles.flowCard}>
          <FlowLine
            label="📥 Compras de mercadería"
            value={`S/${fmt(compras)}`}
            colorKey="out"
            separator
          />
          <FlowLine
            label="🧾 Gastos operativos"
            value={`S/${fmt(totalGastos)}`}
            colorKey="out"
            separator
          />
          <FlowLine
            label="Total salidas"
            value={`S/${fmt(totalSalidas)}`}
            colorKey="out"
            isTotal
          />
        </View>

        {/* ── Saldo (MetricCard dark) ── */}
        <MetricCard
          icon="⚖️"
          iconBg="bosque"
          label="Saldo de caja (entradas − salidas)"
          value={`S/${fmt(saldo)}`}
          dark
          style={styles.saldoCard}
        />

        {/* ── Registrar gasto ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Registrar gasto</Text>
        </View>

        <View style={styles.addGasto}>
          <TextInput
            style={styles.inputConcepto}
            placeholder="Concepto (ej: stand, taxi)"
            placeholderTextColor={Colors.gris}
            value={concepto}
            onChangeText={setConcepto}
            returnKeyType="next"
            autoCapitalize="sentences"
          />
          <TextInput
            style={styles.inputMonto}
            placeholder="S/"
            placeholderTextColor={Colors.gris}
            value={montoText}
            onChangeText={setMontoText}
            keyboardType="numeric"
            returnKeyType="done"
            onSubmitEditing={handleAgregarGasto}
          />
          <TouchableOpacity
            style={styles.addBtn}
            onPress={handleAgregarGasto}
            activeOpacity={0.8}
          >
            <Text style={styles.addBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        {/* ── Lista de gastos ── */}
        {gastos.length > 0 && (
          <View style={styles.gastosList}>
            {gastos.map(g => (
              <View key={g.id} style={styles.gastoRow}>
                <View style={[styles.gastoAva, { backgroundColor: Colors.rojoSoft }]}>
                  <Text style={styles.gastoAvaIcon}>🧾</Text>
                </View>
                <View style={styles.gastoMeta}>
                  <Text style={styles.gastoNombre} numberOfLines={1}>{g.concepto}</Text>
                  <Text style={styles.gastoSub}>Gasto operativo</Text>
                </View>
                <Text style={styles.gastoMonto}>−S/{fmt(g.monto)}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>

      <Toast visible={toastVisible} message={toastMsg} />
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.crema },

  /* Header */
  header: {
    backgroundColor:         Colors.bosque,
    paddingHorizontal:       18,
    paddingBottom:           16,
    borderBottomLeftRadius:  Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    ...Shadow.md,
    zIndex: 10,
  },
  eyebrow: {
    fontSize:      11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color:         Colors.hojaSoft,
    fontWeight:    '700',
    marginBottom:  2,
  },
  title: {
    fontSize:      26,
    fontWeight:    '600',
    color:         '#fff',
    letterSpacing: -0.3,
  },

  /* Scroll */
  scroll:  { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop:        18,
    paddingBottom:     120,
  },

  /* Flow card */
  flowCard: {
    backgroundColor: Colors.papel,
    borderWidth:     1,
    borderColor:     Colors.linea,
    borderRadius:    Radii.xl,
    padding:         16,
    ...Shadow.sm,
    marginBottom:    14,
  },

  /* Flow lines */
  flowLine: {
    flexDirection:     'row',
    justifyContent:    'space-between',
    alignItems:        'center',
    paddingVertical:   9,
  },
  flowLineSep: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.linea,
  },
  flowLineTotal: {
    marginTop:      6,
    paddingTop:     13,
    borderTopWidth: 2,
    borderTopColor: Colors.linea,
  },
  flowLabel: {
    fontSize: 14,
    color:    Colors.gris,
  },
  flowLabelTot: {
    fontSize:   15,
    color:      Colors.carbon,
    fontWeight: '600',
  },
  flowValue: {
    fontWeight: '700',
    fontSize:   14,
  },
  flowValueTot: {
    fontWeight: '700',
    fontSize:   19,
  },

  /* Bar */
  barWrap: { marginTop: 14, marginBottom: 4 },
  bar: {
    height:          34,
    borderRadius:    10,
    flexDirection:   'row',
    overflow:        'hidden',
    backgroundColor: Colors.crema2,
  },
  barEf: { height: '100%', backgroundColor: Colors.verde },
  barYa: { height: '100%', backgroundColor: Colors.hoja  },

  /* Legend */
  legend: {
    flexDirection: 'row',
    gap:           16,
    marginTop:     9,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           5,
  },
  legendDot: {
    width:        11,
    height:       11,
    borderRadius: 3,
  },
  legendText: { fontSize: 12, color: Colors.gris },

  /* Saldo card */
  saldoCard: { marginBottom: 14 },

  /* Section header */
  sectionHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginTop:       6,
    marginBottom:    6,
  },
  sectionTitle: {
    fontSize:   18,
    fontWeight: '600',
    color:      Colors.bosque,
  },

  /* Add gasto form */
  addGasto: {
    flexDirection: 'row',
    gap:           8,
    marginTop:     6,
  },
  inputConcepto: {
    flex:              1,
    borderWidth:       1,
    borderColor:       Colors.linea,
    borderRadius:      12,
    paddingHorizontal: 13,
    paddingVertical:   11,
    fontSize:          14,
    color:             Colors.carbon,
    backgroundColor:   Colors.papel,
  },
  inputMonto: {
    width:             90,
    borderWidth:       1,
    borderColor:       Colors.linea,
    borderRadius:      12,
    paddingHorizontal: 13,
    paddingVertical:   11,
    fontSize:          14,
    color:             Colors.carbon,
    backgroundColor:   Colors.papel,
    textAlign:         'right',
  },
  addBtn: {
    backgroundColor: Colors.rojo,
    borderRadius:    12,
    paddingHorizontal: 18,
    alignItems:      'center',
    justifyContent:  'center',
  },
  addBtnText: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   22,
    lineHeight: 26,
  },

  /* Gastos list */
  gastosList: {
    gap:       8,
    marginTop: 12,
  },
  gastoRow: {
    backgroundColor:  Colors.papel,
    borderWidth:      1,
    borderColor:      Colors.linea,
    borderRadius:     15,
    padding:          11,
    paddingHorizontal: 13,
    flexDirection:    'row',
    alignItems:       'center',
    gap:              11,
    ...Shadow.sm,
  },
  gastoAva: {
    width:          40,
    height:         40,
    borderRadius:   11,
    alignItems:     'center',
    justifyContent: 'center',
  },
  gastoAvaIcon: { fontSize: 20 },
  gastoMeta:    { flex: 1, minWidth: 0 },
  gastoNombre:  { fontWeight: '700', fontSize: 14, color: Colors.carbon },
  gastoSub:     { fontSize: 12, color: Colors.gris, marginTop: 1 },
  gastoMonto:   { fontWeight: '700', fontSize: 14, color: Colors.rojo },
});
