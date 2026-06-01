import { View, Text, StyleSheet } from 'react-native';
import { Colors, Radii, Shadow } from '@/constants/theme';
import { fmt } from '@/utils/format';
import type { KardexRow } from '@/utils/kardex';

interface Props {
  rows: KardexRow[];
}

export default function KardexTable({ rows }: Props) {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.thead}>
        <Text style={[styles.th, styles.thLeft]}>Detalle</Text>
        <Text style={styles.th}>Entra</Text>
        <Text style={styles.th}>Sale</Text>
        <Text style={styles.th}>Saldo</Text>
      </View>

      {/* Rows */}
      {rows.map((row) => (
        <View key={row.id} style={styles.tr}>
          {/* Detalle */}
          <View style={styles.tdDetalle}>
            <Text style={styles.tipo}>{row.detalle}</Text>
            {row.tipo !== 'inicial' && (
              <Text style={styles.precio}>S/{fmt(row.precioUnit)} c/u</Text>
            )}
          </View>

          {/* Entrada */}
          <Text
            style={[
              styles.td,
              { color: row.entrada != null ? Colors.verde : Colors.gris },
            ]}
          >
            {row.entrada != null ? `+${row.entrada}` : '—'}
          </Text>

          {/* Salida */}
          <Text
            style={[
              styles.td,
              { color: row.salida != null ? Colors.rojo : Colors.gris },
            ]}
          >
            {row.salida != null ? `−${row.salida}` : '—'}
          </Text>

          {/* Saldo */}
          <Text style={[styles.td, styles.saldo]}>{row.saldo}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.lg,
    overflow: 'hidden',
    ...Shadow.sm,
  },

  /* Header row */
  thead: {
    flexDirection: 'row',
    backgroundColor: Colors.crema2,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'center',
  },
  th: {
    flex: 1,
    fontSize: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: Colors.gris,
    fontWeight: '600',
    textAlign: 'right',
  },
  thLeft: {
    flex: 2,
    textAlign: 'left',
  },

  /* Data rows */
  tr: {
    flexDirection: 'row',
    paddingVertical: 9,
    paddingHorizontal: 10,
    borderTopWidth: 1,
    borderTopColor: Colors.linea,
    alignItems: 'center',
  },
  tdDetalle: {
    flex: 2,
  },
  tipo: {
    fontWeight: '700',
    fontSize: 12,
    color: Colors.carbon,
  },
  precio: {
    fontSize: 10,
    color: Colors.gris,
    marginTop: 1,
  },
  td: {
    flex: 1,
    fontSize: 12,
    textAlign: 'right',
    fontWeight: '600',
  },
  saldo: {
    fontWeight: '700',
    color: Colors.bosque,
  },
});
