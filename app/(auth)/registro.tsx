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
import { registrarUsuario, mensajeError } from '@/services/firebase';

export default function RegistroScreen() {
  const router = useRouter();
  const [email, setEmail]       = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm]   = useState('');
  const [verPass, setVerPass]   = useState(false);
  const [cargando, setCargando] = useState(false);

  const handleRegistro = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Faltan datos', 'Ingresa tu correo y una contraseña.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Contraseña corta', 'Debe tener al menos 6 caracteres.');
      return;
    }
    if (password !== confirm) {
      Alert.alert('No coinciden', 'Las contraseñas no coinciden.');
      return;
    }
    setCargando(true);
    try {
      await registrarUsuario(email, password);
      // El "portero" del layout raíz redirige a la app automáticamente.
    } catch (e) {
      const code = e instanceof FirebaseError ? e.code : '';
      Alert.alert('No se pudo crear la cuenta', mensajeError(code));
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
          <View style={styles.leaf}><Text style={{ fontSize: 30 }}>🌿</Text></View>
          <Text style={styles.brandName}>D'<Text style={styles.brandBold}>Natural</Text></Text>
        </View>

        <View style={styles.card}>
          <Text style={styles.title}>Crear cuenta</Text>
          <Text style={styles.subtitle}>Regístrate para empezar</Text>

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
              placeholder="Mínimo 6 caracteres"
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

          <Text style={styles.label}>Repetir contraseña</Text>
          <View style={styles.passRow}>
            <TextInput
              style={styles.passInput}
              placeholder="••••••••"
              placeholderTextColor={Colors.gris}
              value={confirm}
              onChangeText={setConfirm}
              secureTextEntry={!verPass}
            />
          </View>

          <TouchableOpacity
            style={[styles.btn, cargando && styles.btnDisabled]}
            onPress={handleRegistro}
            disabled={cargando}
            activeOpacity={0.85}
          >
            {cargando
              ? <ActivityIndicator color="#fff" />
              : <Text style={styles.btnText}>Crear cuenta</Text>}
          </TouchableOpacity>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>¿Ya tienes cuenta? </Text>
          <TouchableOpacity onPress={() => router.replace('/(auth)/login')}>
            <Text style={styles.link}>Inicia sesión</Text>
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
  brandName: { fontSize: 26, fontWeight: '600', color: Colors.bosque, letterSpacing: -0.3 },
  brandBold: { fontWeight: '800', color: Colors.verde },

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

  btn: {
    backgroundColor: Colors.verde, borderRadius: Radii.lg,
    paddingVertical: 15, alignItems: 'center', marginTop: 20, ...Shadow.sm,
  },
  btnDisabled: { opacity: 0.7 },
  btnText: { color: '#fff', fontWeight: '700', fontSize: 16 },

  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 22 },
  footerText: { color: Colors.gris, fontSize: 14 },
  link: { color: Colors.verde, fontSize: 14, fontWeight: '700' },
});
