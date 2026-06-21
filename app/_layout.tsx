import { useEffect } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { Colors } from '@/constants/theme';

function Gate() {
  const { user, cargando } = useAuth();
  const segments = useSegments();
  const router   = useRouter();

  useEffect(() => {
    if (cargando) return;
    const enAuth = segments[0] === '(auth)';
    if (!user && !enAuth) {
      router.replace('/(auth)/login');   // sin sesión → a login
    } else if (user && enAuth) {
      router.replace('/');               // con sesión → a la app
    }
  }, [user, cargando, segments]);

  if (cargando) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.crema }}>
        <ActivityIndicator size="large" color={Colors.verde} />
      </View>
    );
  }

  return <Stack screenOptions={{ headerShown: false }} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
