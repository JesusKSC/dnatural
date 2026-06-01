import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, CatIcon, Shadow, Radii } from '@/constants/theme';
import { fmt } from '@/utils/format';
import { calcMetricasGlobales, calcMargenesProductos } from '@/utils/metrics';
import MetricCard from '@/components/MetricCard';

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function ReportesScreen() {
  const { movimientos, gastos, productos } = useStore();
  const insets = useSafeAreaInsets();

  const { utilidadBruta, utilidadNeta, margenNeto } =
    calcMetricasGlobales(movimientos, gastos, productos);

  const margenesOrdenados = calcMargenesProductos(productos);

  const margenColor =
    margenNeto >= 25 ? Colors.verde :
    margenNeto >= 15 ? Colors.miel  :
                       Colors.rojo;

  return (
    <View style={styles.screen}>
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + 14 }]}>
        <Text style={styles.eyebrow}>Rentabilidad</Text>
        <Text style={styles.title}>Reportes</Text>
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Métricas globales ── */}
        <View style={styles.metricsGrid}>
          <MetricCard
            icon="📈"
            iconBg="hoja"
            label="Utilidad bruta"
            value={`S/${fmt(utilidadBruta)}`}
            style={styles.metricHalf}
          />
          <MetricCard
            icon="🧾"
            iconBg="miel"
            label="Utilidad neta"
            value={`S/${fmt(utilidadNeta)}`}
            style={styles.metricHalf}
          />
        </View>

        {/* Margen neto — card oscura span2 */}
        <View style={styles.margenCard}>
          <View>
            <Text style={styles.margenCardLabel}>Margen neto sobre ventas</Text>
            <View style={styles.margenValueRow}>
              <Text style={styles.margenValue}>{fmt(margenNeto)}</Text>
              <Text style={styles.margenPct}>%</Text>
            </View>
          </View>
          <View style={styles.margenIconWrap}>
            <Text style={{ fontSize: 24 }}>🎯</Text>
          </View>
        </View>

        {/* ── Margen por producto ── */}
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Margen por producto</Text>
          <View style={styles.pill}>
            <Text style={styles.pillText}>precio vs costo</Text>
          </View>
        </View>

        {margenesOrdenados.map(({ producto: p, margenPct, color }) => (
          <View key={p.id} style={styles.repCard}>
            {/* Nombre + % */}
            <View style={styles.repTop}>
              <Text style={styles.repNombre} numberOfLines={1}>
                {CatIcon[p.categoria] ?? '🌿'} {p.nombre}
              </Text>
              <Text style={[styles.repMargen, { color }]}>{fmt(margenPct)}%</Text>
            </View>

            {/* Barra de margen */}
            <View style={styles.repBar}>
              <View
                style={[
                  styles.repBarFill,
                  {
                    width:           `${Math.max(3, Math.min(100, margenPct))}%`,
                    backgroundColor: color,
                  },
                ]}
              />
            </View>

            {/* Detalle numérico */}
            <View style={styles.repDet}>
              <Text style={styles.repDetText}>Costo S/{fmt(p.costo)}</Text>
              <Text style={styles.repDetText}>Precio S/{fmt(p.precio)}</Text>
              <Text style={styles.repDetText}>Gana S/{fmt(p.precio - p.costo)}</Text>
            </View>
          </View>
        ))}

        {/* Nota */}
        <View style={styles.note}>
          <Text style={styles.noteText}>
            📊 Un margen sano para este rubro va de <Text style={styles.noteBold}>20% a 30%</Text>.
            Por debajo de 15% conviene revisar precios o costos de importación.
          </Text>
        </View>
      </ScrollView>
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
    gap:               0,
  },

  /* Metrics 2-col grid */
  metricsGrid: {
    flexDirection: 'row',
    gap:           11,
    marginBottom:  11,
  },
  metricHalf: { flex: 1 },

  /* Margen neto dark card */
  margenCard: {
    backgroundColor: Colors.bosque,
    borderRadius:    Radii.xl,
    padding:         14,
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    20,
    ...Shadow.md,
  },
  margenCardLabel: {
    fontSize:   11,
    color:      'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  margenValueRow: {
    flexDirection: 'row',
    alignItems:    'baseline',
    gap:           2,
    marginTop:     2,
  },
  margenValue: {
    fontSize:      26,
    fontWeight:    '600',
    color:         '#fff',
    letterSpacing: -0.5,
  },
  margenPct: {
    fontSize:   14,
    color:      'rgba(255,255,255,0.75)',
    fontWeight: '600',
  },
  margenIconWrap: {
    width:           46,
    height:          46,
    borderRadius:    Radii.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems:      'center',
    justifyContent:  'center',
  },

  /* Section header */
  sectionHeader: {
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-between',
    marginBottom:   11,
  },
  sectionTitle: {
    fontSize:   18,
    fontWeight: '600',
    color:      Colors.bosque,
  },
  pill: {
    backgroundColor: Colors.crema2,
    borderRadius:    20,
    paddingHorizontal: 10,
    paddingVertical:   4,
  },
  pillText: {
    fontSize:   11,
    color:      Colors.gris,
    fontWeight: '600',
  },

  /* Rep card */
  repCard: {
    backgroundColor: Colors.papel,
    borderWidth:     1,
    borderColor:     Colors.linea,
    borderRadius:    Radii.lg,
    padding:         12,
    paddingHorizontal: 14,
    ...Shadow.sm,
    marginBottom:    9,
  },
  repTop: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  repNombre: {
    flex:       1,
    fontWeight: '700',
    fontSize:   14,
    color:      Colors.carbon,
    marginRight: 8,
  },
  repMargen: {
    fontWeight: '600',
    fontSize:   16,
  },

  /* Margin bar */
  repBar: {
    height:          7,
    backgroundColor: Colors.crema2,
    borderRadius:    6,
    marginTop:       9,
    overflow:        'hidden',
  },
  repBarFill: {
    height:       '100%',
    borderRadius: 6,
  },

  /* Detail row */
  repDet: {
    flexDirection:  'row',
    justifyContent: 'space-between',
    marginTop:      6,
  },
  repDetText: {
    fontSize: 11,
    color:    Colors.gris,
  },

  /* Note */
  note: {
    backgroundColor: Colors.mielSoft,
    borderWidth:     1,
    borderColor:     Colors.miel,
    borderRadius:    Radii.md,
    padding:         12,
    paddingHorizontal: 14,
    marginTop:       14,
  },
  noteText: {
    fontSize:   12,
    color:      '#7a560c',
    lineHeight: 18,
  },
  noteBold: {
    fontWeight: '700',
    color:      '#5e4308',
  },
});
