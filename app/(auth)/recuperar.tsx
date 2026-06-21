import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { FirebaseError } from 'firebase/app';
import { Colors, Shadow, Radii } from '@/constants/theme';
import { recuperarPassword, mensajeError } from '@/services/firebase';

export default function RecuperarScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [cargando, setCargando] = useState(false);

  const handleRecuperar = async () => {
    if (!email.trim()) {
      Alert.alert('Falta el correo', 'Ingresa tu correo para enviarte el enlace.');
      return;
    }
    setCargando(true);
    try {
      await recuperarPassword(email);
      Alert.alert(
        'Revisa tu correo',
        `Te enviamos un enlace a ${email.trim()} para restablecer tu contraseña.`,
        [{ text: 'Entendido', onPress: () => router.replace('/(auth)/login') }],
      );
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : '';
      Alert.alert('No se pudo enviar', mensajeError(code));
    } finally {
      setCargando(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <View style={styles.leaf}><Text style={{ fontSize: 30 }}>🔑</Text></View>
          <Text style={styles.brandName}>Recuperar acceso</Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>¿Olvidaste tu contraseña?</Text>
          <Text style={styles.subtitle}>
            Escribe tu correo y te enviaremos un enlace para crear una nueva.
          </Text>

          <Text style={styles.label}>Correo</Text>
          <TextInput
            style={styles.input}
            placeholder="correo@ejemplo.com"
            placeholderTextColor={Colors.gris}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
          />

          <TouchableOpacity
            style={[styles.btn, cargando && styles.btnDisabled]}
            onPress={handleRecuperar}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Enviar enlace</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>‹ Volver a iniciar sesión</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.crema },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 40 },

  brand: { alignItems: 'center', marginBottom: 22 },
  leaf: {
    width: 64, height: 64, borderRadius: Radii.full,
    backgroundColor: Colors.bosque, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, ...Shadow.md,
  },
  brandName: { fontSize: 22, fontWeight: '700', color: Colors.bosque, letterSpacing: -0.3 },

  card: {
    backgroundColor: Colors.papel,
    borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.xl,
    padding: 20, ...Shadow.sm,
  },
  title:    { fontSize: 20, fontWeight: '700', color: Colors.carbon },
  subtitle: { fontSize: 14, color: Colors.gris, marginTop: 4, marginBottom: 10, lineHeight: 20 },

  label: { fontSize: 13, fontWeight: '700', color: Colors.carbon, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.linea, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: Colors.carbon,
    backgroundColor: Colors.papel,
  },

  btn: {
    backgroundColor: Colors.verde, borderRadius: Radii.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: 20, ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footer: { alignItems: 'center', marginTop: 22 },
  link: { color: Colors.verde, fontSize: 14, fontWeight: '700' },
});
