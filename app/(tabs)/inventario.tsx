import { useState, useMemo } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors, Shadow, Radii } from '@/constants/theme';
import ProductRow from '@/components/ProductRow';
import type { Producto } from '@/types';

export default function InventarioScreen() {
  const { productos } = useStore();
  const router = useRouter();
  const [query, setQuery] = useState('');

  const lista = useMemo(() => {
    const q = query.toLowerCase().trim();
    if (!q) return productos;
    return productos.filter(
      p =>
        p.nombre.toLowerCase().includes(q) ||
        p.codigo.toLowerCase().includes(q),
    );
  }, [productos, query]);

  const irKardex = (producto: Producto) => {
    router.push({
      pathname: '/kardex/[id]',
      params: { id: String(producto.id) },
    });
  };

  const irEditar = (producto: Producto) => {
    router.push({
      pathname: '/producto/[id]',
      params: { id: String(producto.id) },
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.eyebrow}>Kárdex</Text>
            <Text style={styles.title}>Inventario</Text>
          </View>
          <TouchableOpacity
            style={styles.newBtn}
            onPress={() => router.push('/producto/nuevo')}
            activeOpacity={0.8}
          >
            <Text style={styles.newBtnText}>＋ Nuevo</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Search */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.search}
          placeholder="🔍 Buscar producto..."
          placeholderTextColor={Colors.gris}
          value={query}
          onChangeText={setQuery}
          clearButtonMode="while-editing"
          autoCorrect={false}
          autoCapitalize="none"
        />
      </View>

      {/* Product list */}
      <FlatList
        data={lista}
        keyExtractor={p => String(p.id)}
        renderItem={({ item }) => (
          <ProductRow
            producto={item}
            onPress={() => irKardex(item)}
            onEdit={() => irEditar(item)}
          />
        )}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>
              Sin resultados para "{query}"
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.crema,
  },

  /* Header */
  header: {
    backgroundColor: Colors.bosque,
    paddingHorizontal: 18,
    paddingTop: 14,
    paddingBottom: 16,
    borderBottomLeftRadius: Radii.xxl,
    borderBottomRightRadius: Radii.xxl,
    ...Shadow.md,
    zIndex: 10,
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
    fontSize: 26,
    fontWeight: '600',
    color: '#fff',
    letterSpacing: -0.3,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  newBtn: {
    backgroundColor: Colors.hoja,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: Radii.full,
    ...Shadow.sm,
  },
  newBtnText: {
    color: Colors.bosque,
    fontWeight: '700',
    fontSize: 14,
  },

  /* Search */
  searchWrap: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 6,
  },
  search: {
    backgroundColor: Colors.papel,
    borderWidth: 1,
    borderColor: Colors.linea,
    borderRadius: Radii.md,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.carbon,
    ...Shadow.sm,
  },

  /* List */
  listContent: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 120,
  },
  separator: { height: 8 },

  /* Empty state */
  empty: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: { fontSize: 36, marginBottom: 10 },
  emptyText: { color: Colors.gris, fontSize: 14 },
});
