import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Shadow, CatIcon, CatBg, StockAlerta } from '@/constants/theme';
import Badge from '@/components/Badge';
import { fmt } from '@/utils/format';
import type { Producto } from '@/types';

interface Props {
  producto: Producto;
  onPress: () => void;
}

export default function ProductRow({ producto, onPress }: Props) {
  const { nombre, codigo, categoria, stock, costo } = producto;
  const bg   = CatBg[categoria]   ?? Colors.crema2;
  const icon = CatIcon[categoria] ?? '📦';

  const badgeVariant = stock === 0 ? 'out' : stock <= StockAlerta ? 'low' : 'ok';
  const badgeLabel   = stock === 0 ? 'agotado' : stock <= StockAlerta ? 'bajo' : 'ok';

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      <View style={[styles.ava, { backgroundColor: bg }]}>
        <Text style={styles.avaIcon}>{icon}</Text>
      </View>
      <View style={styles.meta}>
        <Text style={styles.nombre} numberOfLines={1}>{nombre}</Text>
        <Text style={styles.sub} numberOfLines={1}>
          {codigo} · valor S/{fmt(stock * costo)}
        </Text>
      </View>
      <View style={styles.right}>
        <Text style={styles.stockNum}>{stock} u</Text>
        <Badge variant={badgeVariant}>{badgeLabel}</Badge>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  row: {
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
  meta: { flex: 1, minWidth: 0 },
  nombre: { fontWeight: '700', fontSize: 14, color: Colors.carbon },
  sub: { fontSize: 12, color: Colors.gris, marginTop: 1 },
  right: { alignItems: 'flex-end', gap: 4 },
  stockNum: { fontWeight: '700', fontSize: 14, color: Colors.carbon },
});
