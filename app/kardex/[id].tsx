import { useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useStore } from '@/store/useStore';
import { Colors, Shadow, Radii } from '@/constants/theme';
import KardexTable from '@/components/KardexTable';
import { calcularKardex } from '@/utils/kardex';

export default function KardexScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { productos, movimientos } = useStore();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const productoId = parseInt(String(id), 10);
  const producto   = useMemo(
    () => productos.find(p => p.id === productoId),
    [productos, productoId],
  );

  const rows = useMemo(
    () => (producto ? calcularKardex(producto, movimientos) : []),
    [producto, movimientos],
  );

  if (!producto) {
    return (
      <View style={[styles.screen, { paddingTop: insets.top + 14 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Inventario</Text>
        </TouchableOpacity>
        <Text style={styles.notFound}>Producto no encontrado.</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 10 }]}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>‹ Inventario</Text>
        </TouchableOpacity>
        <Text style={styles.eyebrow}>Movimientos (PEPS)</Text>
        <Text style={styles.title} numberOfLines={2}>{producto.nombre}</Text>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <KardexTable rows={rows} />

        <View style={styles.note}>
          <Text style={styles.noteText}>
            El <Text style={styles.noteBold}>Kárdex</Text> muestra cada compra y
            venta y recalcula el saldo automáticamente. Así no necesita armarlo a
            mano.
          </Text>
        </View>
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
    paddingBottom: 16,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    ...Shadow.md,
    zIndex: 10,
  },
  backBtn: {
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  backText: {
    color: Colors.hoja,
    fontWeight: '700',
    fontSize: 14,
  },
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
  content: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 40,
  },

  /* Note */
  note: {
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.md,
    padding: 14,
    marginTop: 14,
    ...Shadow.sm,
  },
  noteText: {
    fontSize: 13,
    color: Colors.gris,
    lineHeight: 19,
  },
  noteBold: {
    fontWeight: '700',
    color: Colors.carbon,
  },

  /* Error */
  notFound: {
    color: Colors.gris,
    fontSize: 14,
    textAlign: 'center',
    marginTop: 40,
    paddingHorizontal: 18,
  },
});
