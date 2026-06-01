import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

type BadgeVariant = 'ok' | 'low' | 'out';

interface Props {
  variant: BadgeVariant;
  children: string;
}

const STYLE_MAP: Record<BadgeVariant, { bg: string; fg: string }> = {
  ok:  { bg: 'rgba(127,194,65,0.20)', fg: Colors.verde },
  low: { bg: Colors.rojoSoft,          fg: Colors.rojo  },
  out: { bg: '#444444',                fg: '#ffffff'    },
};

export default function Badge({ variant, children }: Props) {
  const { bg, fg } = STYLE_MAP[variant];
  return (
    <View style={[styles.badge, { backgroundColor: bg }]}>
      <Text style={[styles.text, { color: fg }]}>{children}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 20,
  },
  text: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.3,
  },
});
