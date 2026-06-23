import React, { useState } from 'react';
import { 
  StyleSheet, 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  ActivityIndicator, 
  Alert, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  Image
} from 'react-native';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nama, setNama] = useState('');     // State Nama Lengkap untuk registrasi
  const [posisi, setPosisi] = useState(''); // State Posisi Jabatan untuk registrasi
  const [loading, setLoading] = useState(false);
  const [isRegisterMode, setIsRegisterMode] = useState(false);
  const [secureText, setSecureText] = useState(true);
  
  // State untuk efek border aktif (fokus) profesional
  const [isEmailFocused, setIsEmailFocused] = useState(false);
  const [isPasswordFocused, setIsPasswordFocused] = useState(false);
  const [isNamaFocused, setIsNamaFocused] = useState(false);
  const [isPosisiFocused, setIsPosisiFocused] = useState(false);

  const handleAuthAction = async () => {
    if (!email || !password) {
      alertMessage('Kesalahan', 'Email dan password tidak boleh kosong.');
      return;
    }
    if (password.length < 6) {
      alertMessage('Kesalahan', 'Password minimal harus 6 karakter.');
      return;
    }
    if (isRegisterMode && (!nama.trim() || !posisi.trim())) {
      alertMessage('Kesalahan', 'Nama Lengkap dan Posisi Jabatan wajib diisi saat mendaftar.');
      return;
    }

    setLoading(true);
    try {
      if (isRegisterMode) {
        // 1. Buat User baru di Firebase Auth
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // 2. Set Display Name di Firebase Auth Profile
        await updateProfile(user, { displayName: nama });

        // 3. Simpan data tambahan (Nama & Posisi) ke Firestore Koleksi 'users'
        await setDoc(doc(db, 'users', user.uid), {
          uid: user.uid,
          nama: nama,
          email: email,
          posisi: posisi, // Menyimpan string posisi jabatan
          createdAt: new Date()
        });

        alertMessage('Berhasil', 'Akun pendaftaran posisi ' + posisi + ' berhasil dibuat! Silakan masuk.');
        setIsRegisterMode(false);
        // Reset form pendaftaran
        setNama('');
        setPosisi('');
      } else {
        // Alur Masuk (Login) biasa
        await signInWithEmailAndPassword(auth, email, password);
      }
    } catch (error) {
      console.error(error);
      let errorMessage = 'Terjadi kesalahan. Silakan coba lagi.';
      if (error.code === 'auth/email-already-in-use') errorMessage = 'Email sudah terdaftar!';
      if (error.code === 'auth/invalid-email') errorMessage = 'Format email salah!';
      if (error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Email atau password salah!';
      }
      alertMessage('Gagal', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const alertMessage = (title, message) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${message}`);
    } else {
      Alert.alert(title, message);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'} 
      style={styles.container}
    >
      <ScrollView contentContainerStyle={styles.scrollContainer} showsVerticalScrollIndicator={false}>
        
        <View style={styles.cardContainer}>
          
          {/* Header Area dengan Logo Transparan */}
          <View style={styles.headerContainer}>
            <Image 
              source={require('../assets/logo.png')} 
              style={styles.logoImage}
              resizeMode="contain"
            />
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.formTitle}>
              {isRegisterMode ? 'Daftar Akun' : 'Selamat Datang'}
            </Text>

            {/* FIELD TAMBAHAN INPUT NAMA (Hanya Muncul saat Mode Daftar Baru) */}
            {isRegisterMode && (
              <>
                <Text style={styles.label}>NAMA LENGKAP</Text>
                <TextInput 
                  style={[styles.input, isNamaFocused && styles.inputFocused]}
                  placeholder="Masukkan nama lengkap Anda"
                  placeholderTextColor="#94a3b8"
                  value={nama}
                  onChangeText={setNama}
                  onFocus={() => setIsNamaFocused(true)}
                  onBlur={() => setIsNamaFocused(false)}
                />
              </>
            )}

            {/* FIELD TAMBAHAN INPUT POSISI JABATAN (Hanya Muncul saat Mode Daftar Baru) */}
            {isRegisterMode && (
              <>
                <Text style={styles.label}>POSISI JABATAN</Text>
                <TextInput 
                  style={[styles.input, isPosisiFocused && styles.inputFocused]}
                  placeholder="Contoh: Teknisi, Pekerja Lapangan, Admin"
                  placeholderTextColor="#94a3b8"
                  value={posisi}
                  onChangeText={setPosisi}
                  onFocus={() => setIsPosisiFocused(true)}
                  onBlur={() => setIsPosisiFocused(false)}
                />
              </>
            )}

            {/* Input Email */}
            <Text style={styles.label}>ALAMAT EMAIL</Text>
            <TextInput 
              style={[
                styles.input, 
                isEmailFocused && styles.inputFocused
              ]}
              placeholder="nama@perusahaan.com"
              placeholderTextColor="#94a3b8"
              value={email}
              onChangeText={setEmail}
              onFocus={() => setIsEmailFocused(true)}
              onBlur={() => setIsEmailFocused(false)}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            {/* Input Password */}
            <Text style={styles.label}>KATA SANDI</Text>
            <View style={[
              styles.passwordWrapper, 
              isPasswordFocused && styles.inputFocused
            ]}>
              <TextInput 
                style={styles.passwordInput}
                placeholder="Masukkan kata sandi"
                placeholderTextColor="#94a3b8"
                value={password}
                onChangeText={setPassword}
                onFocus={() => setIsPasswordFocused(true)}
                onBlur={() => setIsPasswordFocused(false)}
                secureTextEntry={secureText}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setSecureText(!secureText)} style={styles.eyeButton}>
                <Text style={styles.eyeIcon}>{secureText ? '👁️' : '🙈'}</Text>
              </TouchableOpacity>
            </View>

            {/* Tombol Aksi Utama */}
            <TouchableOpacity 
              style={styles.buttonSubmit} 
              onPress={handleAuthAction}
              disabled={loading}
              activeOpacity={0.8}
            >
              {loading ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={styles.buttonSubmitText}>
                  {isRegisterMode ? 'Buat Akun Pekerja' : 'Masuk ke Sistem'}
                </Text>
              )}
            </TouchableOpacity>

            {/* Tombol Alih Mode Login / Daftar */}
            <TouchableOpacity 
              style={styles.switchButton} 
              onPress={() => setIsRegisterMode(!isRegisterMode)}
              activeOpacity={0.6}
            >
              <Text style={styles.switchButtonText}>
                {isRegisterMode 
                  ? 'Sudah memiliki akun? Masuk di sini' 
                  : 'Belum Punya Akun ? Buat Akun'}
              </Text>
            </TouchableOpacity>

          </View>

          {/* Footer Minimalis */}
          <Text style={styles.footerText}>
            &copy; {new Date().getFullYear()} JOBTAG System by Cipung.
          </Text>

        </View>

      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc', 
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  cardContainer: {
    width: '100%',
    maxWidth: 420, 
    alignItems: 'center',
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    justifyContent: 'center',
  },
  logoImage: {
    width: Platform.OS === 'web' ? 320 : '95%', 
    height: 180, 
  },
  formCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    borderRadius: 12,
    padding: 32,
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.05, shadowRadius: 16 },
      android: { elevation: 3 },
      web: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 20 }
    }),
  },
  formTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0f172a',
    letterSpacing: -0.5,
    marginBottom: 32, 
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#475569',
    marginBottom: 8,
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#334155',
    marginBottom: 20,
  },
  passwordWrapper: {
    flexDirection: 'row',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 28,
  },
  passwordInput: {
    flex: 1,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#334155',
  },
  inputFocused: {
    borderColor: '#be2929', 
    borderWidth: 1.5,
  },
  eyeButton: {
    paddingHorizontal: 14,
  },
  eyeIcon: {
    fontSize: 16,
    opacity: 0.7,
  },
  buttonSubmit: {
    backgroundColor: '#be2929', 
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonSubmitText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.3,
  },
  switchButton: {
    marginTop: 20,
    alignItems: 'center',
  },
  switchButtonText: {
    color: '#64748b',
    fontSize: 13,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
  footerText: {
    color: '#94a3b8',
    fontSize: 12,
    marginTop: 40,
    textAlign: 'center',
  },
});