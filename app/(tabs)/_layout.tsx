import { Tabs } from 'expo-router';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Shadow, Radii } from '@/constants/theme';

interface TabBarProps {
  state: {
    routes: Array<{ key: string; name: string }>;
    index: number;
  };
  navigation: { navigate: (name: string) => void };
}

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

interface TabConfig {
  label: string;
  icon: IoniconName;
  iconActive: IoniconName;
  fab?: true;
}

const TAB_CONFIG: Record<string, TabConfig> = {
  index:      { label: 'Inicio',     icon: 'home-outline',      iconActive: 'home'        },
  inventario: { label: 'Inventario', icon: 'cube-outline',      iconActive: 'cube'        },
  registrar:  { label: 'Registrar',  icon: 'add',               iconActive: 'add', fab: true },
  caja:       { label: 'Caja',       icon: 'card-outline',      iconActive: 'card'        },
  reportes:   { label: 'Reportes',   icon: 'bar-chart-outline', iconActive: 'bar-chart'   },
};

function CustomTabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 8) }]}>
      {state.routes.map((route, idx) => {
        const config = TAB_CONFIG[route.name];
        const focused = state.index === idx;

        if (!config) return null;

        if (config.fab) {
          return (
            <TouchableOpacity
              key={route.key}
              style={styles.fabBtn}
              onPress={() => navigation.navigate(route.name)}
              activeOpacity={0.8}
            >
              <View style={styles.fabRing}>
                <Ionicons name="add" size={26} color="#fff" />
              </View>
              <Text style={[styles.label, focused && styles.labelActive]}>
                {config.label}
              </Text>
            </TouchableOpacity>
          );
        }

        return (
          <TouchableOpacity
            key={route.key}
            style={styles.tabBtn}
            onPress={() => navigation.navigate(route.name)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={focused ? config.iconActive : config.icon}
              size={23}
              color={focused ? Colors.verde : Colors.gris}
            />
            <Text style={[styles.label, focused && styles.labelActive]}>
              {config.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      tabBar={(props) => <CustomTabBar {...props} />}
      screenOptions={{ headerShown: false }}
    >
      <Tabs.Screen name="index"      options={{ title: 'Inicio'     }} />
      <Tabs.Screen name="inventario" options={{ title: 'Inventario' }} />
      <Tabs.Screen name="registrar"  options={{ title: 'Registrar'  }} />
      <Tabs.Screen name="caja"       options={{ title: 'Caja'       }} />
      <Tabs.Screen name="reportes"   options={{ title: 'Reportes'   }} />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  nav: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255,255,255,0.97)',
    borderTopWidth: 1,
    borderTopColor: Colors.linea,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 8,
    paddingTop: 8,
    shadowColor: '#16432F',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  tabBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    gap: 3,
  },
  fabBtn: {
    flex: 1,
    alignItems: 'center',
    marginTop: -26,
    gap: 3,
  },
  fabRing: {
    width: 56,
    height: 56,
    borderRadius: Radii.full,
    backgroundColor: Colors.verde,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: Colors.crema,
    ...Shadow.md,
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.gris,
  },
  labelActive: {
    color: Colors.verde,
  },
});
