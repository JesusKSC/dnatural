import { useEffect, useRef } from 'react';
import { Animated, Text, StyleSheet } from 'react-native';
import { Colors, Shadow, Radii } from '@/constants/theme';

interface Props {
  visible: boolean;
  message: string;
}

export default function Toast({ visible, message }: Props) {
  const opacity    = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue:         visible ? 1 : 0,
        duration:        280,
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue:         visible ? 0 : 20,
        duration:        280,
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible]);

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.toast, { opacity, transform: [{ translateY }] }]}
    >
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  toast: {
    position:          'absolute',
    bottom:            96,
    alignSelf:         'center',
    backgroundColor:   Colors.bosque,
    paddingHorizontal: 22,
    paddingVertical:   13,
    borderRadius:      Radii.md,
    ...Shadow.md,
    zIndex:            60,
    maxWidth:          '90%',
  },
  text: {
    color:      '#fff',
    fontWeight: '700',
    fontSize:   14,
  },
});
