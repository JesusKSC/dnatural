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
import Ionicons from '@expo/vector-icons/Ionicons';
import { FirebaseError } from 'firebase/app';
import { Colors, Shadow, Radii } from '@/constants/theme';
import { iniciarSesion, mensajeError } from '@/services/firebase';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleLogin = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y contraseña.');
      return;
    }
    setCargando(true);
    try {
      await iniciarSesion(email, password);
      // El "portero" del layout raíz redirige a la app automáticamente.
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : '';
      Alert.alert('No se pudo ingresar', mensajeError(code));
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
        {/* Marca */}
        <View style={styles.brand}>
          <View style={styles.leaf}><Text style={{ fontSize: 30 }}>🌿</Text></View>
          <Text style={styles.brandName}>D'<Text style={styles.brandBold}>Natural</Text></Text>
          <Text style={styles.brandSub}>Vida Saludable</Text>
        </View>

        {/* Tarjeta */}
        <View style={styles.card}>
          <Text style={styles.title}>Iniciar sesión</Text>
          <Text style={styles.subtitle}>Bienvenida de nuevo 🌿</Text>

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

          <Text style={styles.label}>Contraseña</Text>
          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.gris}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!verPass}
            />
            <TouchableOpacity
              style={styles.eyeBtn}
              onPress={() => setVerPass(v => !v)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons
                name={verPass ? 'eye-off-outline' : 'eye-outline'}
                size={20}
                color={Colors.gris}
              />
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => router.push('/(auth)/recuperar')} style={styles.linkRight}>
            <Text style={styles.linkSmall}>¿Olvidaste tu contraseña?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, cargando && styles.btnDisabled]}
            onPress={handleLogin}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Ingresar</Text>}
          </TouchableOpacity>
        </View>

        {/* Crear cuenta */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>¿No tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.push('/(auth)/registro')}>
            <Text style={styles.link}>Crear cuenta</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: Colors.crema },
  content: { flexGrow: 1, justifyContent: 'center', paddingHorizontal: 22, paddingVertical: 40 },

  brand: { alignItems: 'center', marginBottom: 26 },
  leaf: {
    width: 64, height: 64, borderRadius: Radii.full,
    backgroundColor: Colors.bosque, alignItems: 'center', justifyContent: 'center',
    marginBottom: 10, ...Shadow.md,
  },
  brandName: { fontSize: 26, fontWeight: '600', color: Colors.bosque, letterSpacing: -0.3 },
  brandBold: { fontWeight: '800', color: Colors.verde },
  brandSub:  { fontSize: 13, color: Colors.gris, letterSpacing: 1, textTransform: 'uppercase' },

  card: {
    backgroundColor: Colors.papel,
    borderWidth: 1, borderColor: Colors.linea, borderRadius: Radii.xl,
    padding: 20, ...Shadow.sm,
  },
  title:    { fontSize: 22, fontWeight: '700', color: Colors.carbon },
  subtitle: { fontSize: 14, color: Colors.gris, marginTop: 2, marginBottom: 14 },

  label: { fontSize: 13, fontWeight: '700', color: Colors.carbon, marginTop: 12, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: Colors.linea, borderRadius: 12,
    paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: Colors.carbon,
    backgroundColor: Colors.papel,
  },
  passRow: {
    flexDirection: 'row', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.linea, borderRadius: 12,
    backgroundColor: Colors.papel,
  },
  passInput: {
    flex: 1, paddingHorizontal: 13, paddingVertical: 12, fontSize: 15, color: Colors.carbon,
  },
  eyeBtn: { paddingHorizontal: 12, paddingVertical: 10 },

  linkRight: { alignSelf: 'flex-end', marginTop: 10 },
  linkSmall: { color: Colors.verde, fontSize: 13, fontWeight: '600' },

  btn: {
    backgroundColor: Colors.verde, borderRadius: Radii.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: 18, ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: Colors.gris, fontSize: 14 },
  link: { color: Colors.verde, fontSize: 14, fontWeight: '700' },
});
