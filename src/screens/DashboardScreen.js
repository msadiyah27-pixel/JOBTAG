import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TextInput,
  Alert,
  RefreshControl,
  Image,
  Platform,
  ActivityIndicator
} from 'react-native';
import { signOut } from 'firebase/auth';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import * as Location from 'expo-location';
import * as ImagePicker from 'expo-image-picker';

import { auth, db } from '../services/firebaseConfig';
import { formatJam, getDateKey } from '../utils/helpers';

export default function DashboardScreen({ navigation }) {
  const user = auth.currentUser;
  
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [sudahSumbitHariIni, setSudahSubmitHariIni] = useState(false);

  // ── State Data Absensi ───────────────────────────────
  const [fotoAbsensi, setFotoAbsensi] = useState(null); 
  const [lokasiReady, setLokasiReady] = useState(null); 
  
  // ── State Data Laporan Lapangan ──────────────────────
  const [hasilKerja, setHasilKerja] = useState('');
  const [progresPersen, setProgresPersen] = useState('');
  const [fotoPekerjaan, setFotoPekerjaan] = useState(null); 
  const [namaAlat, setNamaAlat] = useState('');
  const [pengaduan, setPengaduan] = useState('');

  const todayKey = getDateKey();

  // Memeriksa status pengiriman harian dengan proteksi Try-Catch ketat
  const checkStatusHariIni = useCallback(async () => {
    if (!auth.currentUser?.uid) return;
    
    try {
      const uId = auth.currentUser.uid;
      const attendanceDocRef = doc(db, 'attendance', `${uId}_${todayKey}`);
      const reportDocRef = doc(db, 'reports', `${uId}_${todayKey}`);

      // Ambil data absensi secara aman
      const snapAbsen = await getDoc(attendanceDocRef);
      if (snapAbsen.exists()) {
        setSudahSubmitHariIni(true);
        const data = snapAbsen.data();
        setFotoAbsensi(data.fotoBase64 || null);
        setLokasiReady(data.latitude ? { latitude: data.latitude, longitude: data.longitude } : null);
      }

      // Ambil data laporan secara aman
      const snapReport = await getDoc(reportDocRef);
      if (snapReport.exists()) {
        const rData = snapReport.data();
        setHasilKerja(rData.deskripsiKerja || '');
        setProgresPersen(rData.progres ? String(rData.progres) : '');
        setFotoPekerjaan(rData.fotoPekerjaan || null);
        setNamaAlat(rData.namaAlat === 'Tidak ada peminjaman' ? '' : (rData.namaAlat || ''));
        setPengaduan(rData.pengaduan === 'Tidak ada pengaduan' ? '' : (rData.pengaduan || ''));
      }
    } catch (error) {
      console.log('[Dashboard Load Safety Handle]:', error.message);
    }
  }, [todayKey]);

  useEffect(() => {
    if (user) {
      checkStatusHariIni();
    }
  }, [user, checkStatusHariIni]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await checkStatusHariIni();
    setRefreshing(false);
  }, [checkStatusHariIni]);

  const alertMessage = (title, msg) => {
    if (Platform.OS === 'web') {
      alert(`${title}: ${msg}`);
    } else {
      Alert.alert(title, msg);
    }
  };

  const pemicuKameraAsli = async (target) => {
    try {
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      if (status !== 'granted') {
        alertMessage('Izin Ditolak', 'Aplikasi membutuhkan izin akses kamera!');
        return;
      }

      const hasil = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.15, 
        base64: true,
      });

      if (!hasil.canceled && hasil.assets && hasil.assets[0]) {
        const base64Str = `data:image/jpeg;base64,${hasil.assets[0].base64}`;
        if (target === 'absensi') {
          setFotoAbsensi(base64Str);
        } else if (target === 'pekerjaan') {
          setFotoPekerjaan(base64Str);
        }
      }
    } catch (error) {
      console.error(error);
      alertMessage('Error', 'Gagal membuka kamera perangkat.');
    }
  };

  const handleDapatkanLokasi = async () => {
    setLoading(true);
    if (Platform.OS === 'web') {
      if (!navigator.geolocation) {
        alertMessage('Error', 'Geolocation tidak didukung oleh browser ini.');
        setLoading(false);
        return;
      }
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLokasiReady({ latitude: position.coords.latitude, longitude: position.coords.longitude });
          setLoading(false);
          alertMessage('Sukses', 'Lokasi GPS berhasil dikunci!');
        },
        () => {
          alertMessage('Error', 'Gagal mengambil lokasi. Pastikan izin lokasi aktif.');
          setLoading(false);
        }
      );
    } else {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alertMessage('Izin Ditolak', 'Aplikasi memerlukan izin lokasi.');
        setLoading(false);
        return;
      }
      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLokasiReady(loc.coords);
      setLoading(false);
      alertMessage('Sukses', 'Lokasi GPS berhasil dikunci!');
    }
  };

  // ── TOMBOL EKSEKUSI UTAMA: Kirim Absensi + Laporan Sekaligus ──
  const handleKirimSemuaDataFirestore = async () => {
    const pCurrentUser = auth.currentUser;
    if (!pCurrentUser?.uid) {
      alertMessage('Peringatan', 'Sesi login Anda tidak valid. Silakan keluar dan masuk kembali.');
      return;
    }

    if (!fotoAbsensi || !lokasiReady) {
      alertMessage('Peringatan', 'Wajib melengkapi Foto Absensi Wajah dan mengunci Lokasi GPS!');
      return;
    }

    if (!hasilKerja.trim() || !progresPersen.trim() || !fotoPekerjaan) {
      alertMessage('Peringatan', 'Wajib mengisi Deskripsi Kerja, Persentase Progres, dan Foto Bukti Pekerjaan!');
      return;
    }

    setLoading(true);
    try {
      const uId = pCurrentUser.uid;
      const attRef = doc(db, 'attendance', `${uId}_${todayKey}`);
      const repRef = doc(db, 'reports', `${uId}_${todayKey}`);

      // 🚀 A. Simpan Dokumen Kehadiran ke Koleksi 'attendance'
      await setDoc(attRef, {
        userId: uId,
        nama: pCurrentUser.displayName || pCurrentUser.email,
        email: pCurrentUser.email,
        tanggal: todayKey,
        checkIn: serverTimestamp(),
        checkOut: null,
        latitude: Number(lokasiReady.latitude),
        longitude: Number(lokasiReady.longitude),
        fotoBase64: fotoAbsensi,
        status: 'Check In',
      }, { merge: true });

      // 🚀 B. Simpan Dokumen Laporan Hasil ke Koleksi 'reports'
      await setDoc(repRef, {
        userId: uId,
        tanggal: todayKey,
        deskripsiKerja: hasilKerja.trim(),
        progres: Math.min(Math.max(parseInt(progresPersen) || 0, 0), 100),
        fotoPekerjaan: fotoPekerjaan,
        namaAlat: namaAlat.trim() ? namaAlat.trim() : 'Tidak ada peminjaman',
        pengaduan: pengaduan.trim() ? pengaduan.trim() : 'Tidak ada pengaduan',
        updatedAt: serverTimestamp()
      }, { merge: true });

      setSudahSubmitHariIni(true);
      alertMessage('Sukses', 'Seluruh Absensi dan Laporan Kerja hari ini berhasil disimpan!');
    } catch (error) {
      console.error('[handleKirimSemuaDataFirestore] Error:', error);
      alertMessage('Gagal Menyimpan', error.message || 'Terjadi kesalahan pada server Firebase.');
    } finally {
      setLoading(false);
    }
  };

  const validProgress = Math.min(Math.max(parseInt(progresPersen) || 0, 0), 100);

  return (
    <SafeAreaView style={styles.safeContainer}>
      {loading && (
        <View style={styles.globalLoader}>
          <ActivityIndicator size="large" color="#be2929" />
        </View>
      )}
      
      <View style={styles.topNavigation}>
        <View style={styles.logoWrapper}>
          <Image source={require('../assets/logo.png')} style={styles.brandLogo} resizeMode="contain" />
        </View>
        <TouchableOpacity onPress={() => signOut(auth)} style={styles.logoutBadge}>
          <Text style={styles.logoutBadgeText}>Keluar</Text>
        </TouchableOpacity>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollWrapper} 
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#be2929" />}
      >

        {/* CARD 1: ABSENSI */}
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Absensi Pekerja</Text>
          {fotoAbsensi ? (
            <Image source={{ uri: fotoAbsensi }} style={styles.previewImageFrame} />
          ) : (
            <View style={styles.profileIndicator}>
              <Text style={styles.profileTextIcon}>{user?.email?.[0]?.toUpperCase() ?? 'U'}</Text>
            </View>
          )}
          
          <View style={styles.buttonActionGrid}>
            <TouchableOpacity 
              style={[styles.secondarySplitBtn, fotoAbsensi && styles.successSplitBtn]} 
              onPress={() => pemicuKameraAsli('absensi')} 
            >
              <Text style={styles.secondarySplitBtnText}>{fotoAbsensi ? '📸 Foto Absen Siap' : '📸 Foto Kamera'}</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.secondarySplitBtn, lokasiReady && styles.successSplitBtn]} 
              onPress={handleDapatkanLokasi} 
            >
              <Text style={styles.secondarySplitBtnText}>{lokasiReady ? '📍 GPS Terkunci' : '🗺️ Ambil GPS'}</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* CARD 2: HASIL PEKERJAAN */}
        <View style={styles.contentCard}>
          <View style={styles.targetRowHeader}>
            <Text style={styles.cardHeaderTitle}>Hasil Pekerjaan Hari Ini</Text>
            <Text style={styles.percentageMetric}>{validProgress}%</Text>
          </View>
          {fotoPekerjaan && <Image source={{ uri: fotoPekerjaan }} style={styles.previewImageFrame} />}
          
          <TextInput style={styles.formInputField} placeholder="Deskripsi pekerjaan hari ini..." placeholderTextColor="#94a3b8" value={hasilKerja} onChangeText={setHasilKerja} editable={true} />
          <TextInput style={styles.formInputField} placeholder="Persentase Capaian (0 - 100)" placeholderTextColor="#94a3b8" keyboardType="numeric" value={progresPersen} onChangeText={setProgresPersen} editable={true} />
          
          <View style={styles.progressTrackBar}>
            <View style={[styles.progressActiveFill, { width: `${validProgress}%` }]} />
          </View>

          <TouchableOpacity 
            style={[styles.secondarySplitBtn, { marginTop: 10, width: '100%' }, fotoPekerjaan && styles.successSplitBtn]} 
            onPress={() => pemicuKameraAsli('pekerjaan')}
          >
            <Text style={styles.secondarySplitBtnText}>{fotoPekerjaan ? '📸 Foto Kerja Siap' : '📸 Ambil Bukti Foto Kerja'}</Text>
          </TouchableOpacity>
        </View>

        {/* CARD 3: PEMINJAMAN ALAT */}
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Peminjaman Alat</Text>
          <TextInput 
            style={styles.formInputField} 
            placeholder="Nama alat teknis operasional..." 
            placeholderTextColor="#94a3b8" 
            value={namaAlat} 
            onChangeText={setNamaAlat} 
            editable={true}
          />
        </View>

        {/* CARD 4: PENGADUAN LAPANGAN */}
        <View style={styles.contentCard}>
          <Text style={styles.cardHeaderTitle}>Pengaduan Lapangan</Text>
          <TextInput 
            style={[styles.formInputField, styles.textAreaInputField]} 
            placeholder="Kendala material atau kritik operasional..." 
            placeholderTextColor="#94a3b8" 
            multiline={true} 
            numberOfLines={3} 
            value={pengaduan} 
            onChangeText={setPengaduan} 
            editable={true}
          />
        </View>

        {/* TOMBOL EKSEKUSI PENGIRIMAN DATA */}
        <TouchableOpacity 
          style={styles.saveAllReportBtn} 
          onPress={handleKirimSemuaDataFirestore} 
          activeOpacity={0.85}
        >
          <Text style={styles.saveAllReportBtnText}>
            {sudahSumbitHariIni ? '🔄 PERBARUI LAPORAN KERJA' : '💾 SIMPAN LAPORAN KERJA'}
          </Text>
        </TouchableOpacity>

        {/* TOMBOL NAVIGASI SELESAI */}
        <TouchableOpacity style={styles.finishSummaryBtn} onPress={() => navigation.navigate('Report')} activeOpacity={0.85}>
          <Text style={styles.finishSummaryBtnText}>SELESAI & LIHAT RINGKASAN DATA</Text>
        </TouchableOpacity>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeContainer: { flex: 1, backgroundColor: '#f8fafc' },
  globalLoader: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(255,255,255,0.7)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  topNavigation: { backgroundColor: '#ffffff', paddingHorizontal: 20, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', borderBottomWidth: 1, borderColor: '#e2e8f0', height: 65 },
  logoWrapper: { flex: 1, alignItems: 'flex-start', justifyContent: 'center', height: '100%' },
  brandLogo: { width: 140, height: '100%', maxHeight: 40 },
  logoutBadge: { backgroundColor: 'rgba(190, 41, 41, 0.1)', paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  logoutBadgeText: { color: '#be2929', fontSize: 12, fontWeight: '700' },
  scrollWrapper: { padding: 20, alignItems: 'center', width: '100%' },
  contentCard: { backgroundColor: '#ffffff', width: '100%', maxWidth: 430, borderRadius: 12, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: '#e2e8f0' },
  cardHeaderTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 16 },
  profileIndicator: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#f1f5f9', justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 12, borderWidth: 2, borderColor: '#be2929' },
  profileTextIcon: { color: '#be2929', fontSize: 24, fontWeight: '800' },
  previewImageFrame: { width: '100%', height: 160, borderRadius: 8, marginBottom: 12, backgroundColor: '#e2e8f0' },
  buttonActionGrid: { flexDirection: 'row', justifyContent: 'space-between', gap: 10 },
  secondarySplitBtn: { flex: 1, borderWidth: 1, borderColor: '#be2929', borderRadius: 8, paddingVertical: 12, alignItems: 'center', backgroundColor: '#ffffff' },
  successSplitBtn: { backgroundColor: 'rgba(34, 197, 94, 0.1)', borderColor: '#22c55e' },
  secondarySplitBtnText: { color: '#be2929', fontWeight: '600', fontSize: 13 },
  targetRowHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  percentageMetric: { color: '#be2929', fontWeight: '700', fontSize: 18 },
  progressTrackBar: { height: 8, backgroundColor: '#f1f5f9', borderRadius: 4, overflow: 'hidden', marginTop: 8, marginBottom: 4 },
  progressActiveFill: { height: '100%', backgroundColor: '#be2929' },
  formInputField: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#cbd5e1', borderRadius: 8, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, color: '#334155', marginBottom: 20 },
  textAreaInputField: { height: 80, textAlignVertical: 'top' },
  saveAllReportBtn: { backgroundColor: '#be2929', width: '100%', maxWidth: 430, borderRadius: 8, paddingVertical: 15, alignItems: 'center', justifyContent: 'center', marginTop: 12, marginBottom: 10 },
  saveAllReportBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14, letterSpacing: 0.5 },
  finishSummaryBtn: { backgroundColor: '#0f172a', width: '100%', maxWidth: 430, borderRadius: 8, paddingVertical: 16, alignItems: 'center', justifyContent: 'center', marginBottom: 30 },
  finishSummaryBtnText: { color: '#ffffff', fontWeight: '700', fontSize: 14, letterSpacing: 1 },
});