import { View, Text, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/theme';

export default function ReportesScreen() {
  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.eyebrow}>Rentabilidad</Text>
        <Text style={styles.title}>Reportes</Text>
      </View>
      <View style={styles.body}>
        <Text style={styles.placeholder}>Próximamente…</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.crema },
  header: {
    backgroundColor: Colors.bosque,
    paddingHorizontal: 18,
    paddingBottom: 16,
    paddingTop: 14,
    borderBottomLeftRadius: 26,
    borderBottomRightRadius: 26,
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
  body: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  placeholder: { color: Colors.gris, fontSize: 16 },
});
