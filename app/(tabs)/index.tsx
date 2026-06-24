import { View, Text, ScrollView, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { useMemo } from 'react';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, Shadow, Radii, CatIcon, CatBg, StockAlerta } from '@/constants/theme';
import { cerrarSesion } from '@/services/firebase';
import MetricCard from '@/components/MetricCard';
import Badge from '@/components/Badge';

const DIAS  = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'];
const MESES = ['ene','feb','mar','abr','may','jun','jul','ago','sep','oct','nov','dic'];

function isToday(isoDate: string): boolean {
  const d   = new Date(isoDate);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth()    === now.getMonth()    &&
    d.getDate()     === now.getDate()
  );
}

function fmt(n: number): string {
  const v = Math.round(n * 100) / 100;
  const [int, dec] = v.toFixed(2).split('.');
  const intFmt = int.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return dec === '00' ? intFmt : `${intFmt}.${dec}`;
}

export default function InicioScreen() {
  const { productos, movimientos } = useStore();
  const insets = useSafeAreaInsets();
  const now    = new Date();

  const handleCerrarSesion = () => {
    Alert.alert('Cerrar sesión', '¿Seguro que quieres salir?', [
      { text: 'Cancelar', style: 'cancel' },
      { text: 'Salir', style: 'destructive', onPress: () => { cerrarSesion().catch(() => {}); } },
    ]);
  };

  const ventasHoy = useMemo(
    () => movimientos.filter(m => m.tipo === 'venta' && isToday(m.fecha)),
    [movimientos],
  );

  const totalVentas  = useMemo(() => ventasHoy.reduce((s, m) => s + m.total,    0), [ventasHoy]);
  const totalUnidades = useMemo(() => ventasHoy.reduce((s, m) => s + m.cantidad, 0), [ventasHoy]);
  const totalYape    = useMemo(
    () => ventasHoy.filter(m => m.metodo === 'yape').reduce((s, m) => s + m.total, 0),
    [ventasHoy],
  );
  const totalEfectivo = useMemo(
    () => ventasHoy.filter(m => m.metodo === 'efectivo').reduce((s, m) => s + m.total, 0),
    [ventasHoy],
  );
  // Los productos vienen del KARDEX (stock actual + costo promedio), así que sumar
  // stock × costo = el valor total del inventario del KARDEX, y se actualiza al instante.
  const valorInventario = useMemo(
    () => productos.reduce((s, p) => s + p.stock * p.costo, 0),
    [productos],
  );
  const alertas = useMemo(
    () => productos.filter(p => p.stock <= StockAlerta).sort((a, b) => a.stock - b.stock),
    [productos],
  );

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <View style={styles.headerRow}>
          <View style={styles.brand}>
            <View style={styles.leafmark}>
              <Text style={{ fontSize: 20 }}>🌿</Text>
            </View>
            <View>
              <Text style={styles.brandName}>
                D'<Text style={styles.brandBold}>Natural</Text>
              </Text>
              <Text style={styles.brandSub}>Vida Saludable</Text>
            </View>
          </View>
          <View style={styles.fecha}>
            <Text style={styles.fechaDia}>{DIAS[now.getDay()]}</Text>
            <Text style={styles.fechaMes}>
              {now.getDate()} {MESES[now.getMonth()]} {now.getFullYear()}
            </Text>
          </View>
        </View>
      </View>

      {/* ── Content ── */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Text style={styles.eyebrow}>Resumen de hoy</Text>
        <Text style={styles.vtitle}>Hola, Doris 🌿</Text>

        {/* Metrics grid */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="💰" iconBg="hoja"
              label="Ventas de hoy"
              value={`S/${fmt(totalVentas)}`}
              style={styles.metricHalf}
            />
            <MetricCard
              icon="📦" iconBg="bosque"
              label="Productos vendidos"
              value={String(totalUnidades)}
              style={styles.metricHalf}
            />
          </View>
          <View style={styles.metricsRow}>
            <MetricCard
              icon="📲" iconBg="miel"
              label="Yape / Transf."
              value={`S/${fmt(totalYape)}`}
              style={styles.metricHalf}
            />
            <MetricCard
              icon="💵" iconBg="hoja"
              label="Efectivo"
              value={`S/${fmt(totalEfectivo)}`}
              style={styles.metricHalf}
            />
          </View>
          <MetricCard
            icon="🏷️" iconBg="bosque"
            label="Valor del inventario (al costo)"
            value={`S/${fmt(valorInventario)}`}
            dark
          />
        </View>

        {/* Stock alerts */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Alertas de stock</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>{alertas.length}</Text>
          </View>
        </View>

        {alertas.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>✅</Text>
            <Text style={styles.emptyText}>Todo el inventario con stock suficiente</Text>
          </View>
        ) : (
          <View style={styles.alertList}>
            {alertas.map(p => (
              <View key={p.id} style={styles.alertRow}>
                <View style={[styles.ava, { backgroundColor: CatBg[p.categoria] ?? Colors.crema2 }]}>
                  <Text style={styles.avaIcon}>{CatIcon[p.categoria] ?? '📦'}</Text>
                </View>
                <View style={styles.rowMeta}>
                  <Text style={styles.rowNombre} numberOfLines={1}>{p.nombre}</Text>
                  <Text style={styles.rowSub}>Código {p.codigo}</Text>
                </View>
                <Badge variant={p.stock === 0 ? 'out' : 'low'}>
                  {p.stock === 0 ? 'AGOTADO' : `${p.stock} u`}
                </Badge>
              </View>
            ))}
          </View>
        )}

        {/* Tip */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            💡 <Text style={styles.noteBold}>Tip:</Text> toca el botón verde central{' '}
            <Text style={styles.noteBold}>(+)</Text> para registrar una venta o compra en segundos.
            Solo eliges el producto y la cantidad.
          </Text>
        </View>

        {/* Cerrar sesión */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleCerrarSesion} activeOpacity={0.8}>
          <Text style={styles.logoutText}>Cerrar sesión</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.crema,
  },

  /* Header */
  header: {
    backgroundColor: Colors.bosque,
    paddingHorizontal: 18,
    paddingBottom: 14,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    ...Shadow.md,
    zIndex: 10,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brand: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
  },
  leafmark: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: 'rgba(255,255,255,0.14)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandName: {
    fontSize: 21,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.1,
    lineHeight: 24,
  },
  brandBold: {
    fontWeight: '800',
    color: Colors.hoja,
  },
  brandSub: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.82)',
    letterSpacing: 2.2,
    textTransform: 'uppercase',
    marginTop: 2,
  },
  fecha: {
    alignItems: 'flex-end',
  },
  fechaDia: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  fechaMes: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 1,
  },

  /* Scroll */
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 120,
  },

  eyebrow: {
    fontSize: 11,
    letterSpacing: 2.5,
    textTransform: 'uppercase',
    color: Colors.verde,
    fontWeight: '700',
    marginBottom: 3,
  },
  vtitle: {
    fontSize: 26,
    fontWeight: '600',
    color: Colors.bosque,
    letterSpacing: -0.3,
    marginBottom: 16,
  },

  /* Metrics */
  metricsGrid: { gap: 11, marginBottom: 14 },
  metricsRow: {
    flexDirection: 'row',
    gap: 11,
  },
  metricHalf: { flex: 1 },

  /* Section header */
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 11,
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.bosque,
  },
  pill: {
    backgroundColor: Colors.crema2,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  pillText: {
    fontSize: 11,
    color: Colors.gris,
    fontWeight: '600',
  },

  /* Alert list */
  alertList: { gap: 8 },
  alertRow: {
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: 15,
    padding: 11,
    paddingHorizontal: 13,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    ...Shadow.sm,
  },
  ava: {
    width: 40,
    height: 40,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avaIcon: { fontSize: 20 },
  rowMeta: { flex: 1, minWidth: 0 },
  rowNombre: {
    fontWeight: '700',
    fontSize: 14,
  },
  rowSub: {
    fontSize: 12,
    color: Colors.gris,
    marginTop: 1,
  },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyIcon: { fontSize: 42, marginBottom: 10 },
  emptyText: { color: Colors.gris, fontSize: 14, textAlign: 'center' },

  /* Tip note */
  note: {
    backgroundColor: Colors.mielSoft,
    borderWidth: 1,
    borderColor: Colors.miel,
    borderRadius: Radii.md,
    padding: 14,
    marginTop: 14,
  },
  noteText: {
    fontSize: 13,
    color: '#7a560c',
    lineHeight: 19,
  },
  noteBold: {
    fontWeight: '700',
    color: '#5e4308',
  },
  logoutBtn: {
    marginTop: 18,
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Radii.full,
    borderWidth: 1,
    borderColor: Colors.linea,
    backgroundColor: Colors.papel,
  },
  logoutText: {
    color: Colors.rojo,
    fontWeight: '700',
    fontSize: 14,
  },
});
