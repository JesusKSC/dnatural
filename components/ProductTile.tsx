import { TouchableOpacity, View, Text, StyleSheet } from 'react-native';
import { Colors, Shadow, Radii, CatIcon, CatBg, StockAlerta } from '@/constants/theme';
import Badge from '@/components/Badge';
import { fmt } from '@/utils/format';
import type { Producto } from '@/types';

interface Props {
  producto: Producto;
  onPress: () => void;
}

export default function ProductTile({ producto, onPress }: Props) {
  const { nombre, costo, precio, categoria, stock } = producto;
  const bg   = CatBg[categoria]   ?? Colors.crema2;
  const icon = CatIcon[categoria] ?? '📦';

  const badgeVariant = stock === 0 ? 'out' : stock <= StockAlerta ? 'low' : 'ok';

  return (
    <TouchableOpacity style={styles.tile} onPress={onPress} activeOpacity={0.85}>
      {/* Stock badge — absolute top-right */}
      <View style={styles.badgeWrap} pointerEvents="none">
        <Badge variant={badgeVariant}>{`${stock} u`}</Badge>
      </View>

      {/* Category image */}
      <View style={[styles.ph, { backgroundColor: bg }]}>
        <Text style={styles.phIcon}>{icon}</Text>
      </View>

      {/* Name — at least 2 lines height */}
      <Text style={styles.nombre} numberOfLines={2}>{nombre}</Text>

      {/* Price row */}
      <View style={styles.priceRow}>
        <Text style={styles.precio}>S/{fmt(precio)}</Text>
        <Text style={styles.costo}>costo S/{fmt(costo)}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.xl,
    padding: 13,
    ...Shadow.sm,
  },
  badgeWrap: {
    position: 'absolute',
    top: 9,
    right: 9,
    zIndex: 1,
  },
  ph: {
    width: '100%',
    aspectRatio: 1.4,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 9,
  },
  phIcon: { fontSize: 32 },
  nombre: {
    fontWeight: '700',
    fontSize: 13,
    lineHeight: 17,
    color: Colors.carbon,
    minHeight: 34,
  },
  priceRow: {
    marginTop: 6,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
  },
  precio: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.bosque,
  },
  costo: {
    fontSize: 10,
    color: Colors.gris,
  },
});
