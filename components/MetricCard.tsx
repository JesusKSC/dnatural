import { View, Text, StyleSheet, ViewStyle } from 'react-native';
import { Colors, Shadow, Radii } from '@/constants/theme';

type IconBg = 'hoja' | 'miel' | 'bosque';

interface Props {
  icon: string;
  iconBg: IconBg;
  label: string;
  value: string;
  dark?: boolean;
  style?: ViewStyle;
}

const ICON_PALETTE: Record<IconBg, { bg: string }> = {
  hoja:   { bg: 'rgba(127,194,65,0.16)' },
  miel:   { bg: 'rgba(228,161,46,0.18)' },
  bosque: { bg: 'rgba(35,116,76,0.12)'  },
};

export default function MetricCard({ icon, iconBg, label, value, dark = false, style }: Props) {
  if (dark) {
    return (
      <View style={[styles.card, styles.cardDark, style]}>
        <View>
          <Text style={styles.darkLabel}>{label}</Text>
          <Text style={styles.darkValue}>{value}</Text>
        </View>
        <View style={styles.darkIconWrap}>
          <Text style={{ fontSize: 22 }}>{icon}</Text>
        </View>
      </View>
    );
  }

  const { bg } = ICON_PALETTE[iconBg];
  return (
    <View style={[styles.card, style]}>
      <View style={[styles.iconWrap, { backgroundColor: bg }]}>
        <Text style={{ fontSize: 15 }}>{icon}</Text>
      </View>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.papel,
    borderRadius: Radii.xl,
    padding: 14,
    borderWidth: 1,
    borderColor: Colors.linea,
    ...Shadow.sm,
  },
  cardDark: {
    backgroundColor: Colors.bosque,
    borderWidth: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconWrap: {
    width: 30,
    height: 30,
    borderRadius: Radii.xs,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 7,
  },
  label: {
    fontSize: 11,
    color: Colors.gris,
    fontWeight: '600',
    letterSpacing: 0.1,
  },
  value: {
    fontSize: 22,
    fontWeight: '600',
    color: Colors.bosque,
    marginTop: 2,
    letterSpacing: -0.3,
  },
  darkLabel: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '600',
  },
  darkValue: {
    fontSize: 22,
    fontWeight: '600',
    color: '#fff',
    marginTop: 2,
    letterSpacing: -0.3,
  },
  darkIconWrap: {
    width: 46,
    height: 46,
    borderRadius: Radii.xs,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
  },
});
