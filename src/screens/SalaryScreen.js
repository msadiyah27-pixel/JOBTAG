import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  SafeAreaView, 
  TouchableOpacity, 
  ActivityIndicator,
  ScrollView,
  Platform
} from 'react-native';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../services/firebaseConfig';

export default function SalaryScreen({ navigation }) {
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [userPosisi, setUserPosisi] = useState('Pekerja Lapangan');

  useEffect(() => {
    async function fetchUserPosition() {
      if (!user) return;
      try {
        // Mengambil data posisi jabatan pekerja dari koleksi users
        const userSnap = await getDoc(doc(db, 'users', user.uid));
        if (userSnap.exists() && userSnap.data().posisi) {
          setUserPosisi(userSnap.data().posisi);
        }
      } catch (error) {
        console.error('[Fetch User Position Error]:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchUserPosition();
  }, [user]);

  // Manajemen kalkulasi nominal gaji standar operasional
  const gajiPokok = 3800000;
  const tunjanganTransportGps = 700000;
  const tunjanganMakanOpr = 500000;
  const potonganBpjs = 120000;
  
  const totalPendapatan = gajiPokok + tunjanganTransportGps + tunjanganMakanOpr;
  const totalBersih = totalPendapatan - potonganBpjs;

  // Fungsi formatter mata uang Rupiah (IDR) otomatis
  const formatRupiah = (angka) => {
    return 'Rp ' + angka.toLocaleString('id-ID');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#be2929" />
        <Text style={styles.loadingText}>Mengenkripsi Slip Gaji...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header Custom */}
      <View style={styles.headerBar}>
        <TouchableOpacity onPress={() => navigation.navigate('Report')}>
          <Text style={styles.backText}>Laporan</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Slip Gaji Elektronik</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollWrapper} showsVerticalScrollIndicator={false}>
        
        {/* Kontainer Utama Slip Gaji */}
        <View style={styles.salaryCard}>
          
          {/* Header Internal Perusahaan */}
          <View style={styles.metaHeader}>
            <Text style={styles.companyName}>JOBTAG OPERATIONAL SYSTEM</Text>
            <Text style={styles.metaLabel}>PERIODE: JUNI {new Date().getFullYear()}</Text>
          </View>
          
          <View style={styles.divider} />

          {/* Profil Penerima Gaji */}
          <View style={styles.profileSection}>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Nama Karyawan</Text>
              <Text style={styles.profileValue}>{user?.displayName || 'Pekerja Lapangan'}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Posisi / Jabatan</Text>
              <Text style={styles.positionBadge}>{userPosisi}</Text>
            </View>
            <View style={styles.profileRow}>
              <Text style={styles.profileLabel}>Email Sistem</Text>
              <Text style={styles.profileValue}>{user?.email}</Text>
            </View>
          </View>

          <View style={styles.divider} />

          {/* Rincian Pendapatan (Earnings) */}
          <Text style={styles.sectionBlockTitle}>RINCIAN PENDAPATAN</Text>
          
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Gaji Pokok Utama</Text>
            <Text style={styles.itemValue}>{formatRupiah(gajiPokok)}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Tunjangan Transportasi & GPS</Text>
            <Text style={styles.itemValue}>{formatRupiah(tunjanganTransportGps)}</Text>
          </View>
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Uang Makan Operasional</Text>
            <Text style={styles.itemValue}>{formatRupiah(tunjanganMakanOpr)}</Text>
          </View>

          <View style={[styles.itemRow, styles.subTotalRow]}>
            <Text style={styles.subTotalLabel}>Total Pendapatan Kotor</Text>
            <Text style={styles.subTotalValue}>{formatRupiah(totalPendapatan)}</Text>
          </View>

          {/* Rincian Potongan (Deductions) */}
          <Text style={[styles.sectionBlockTitle, { marginTop: 16 }]}>RINCIAN POTONGAN</Text>
          
          <View style={styles.itemRow}>
            <Text style={styles.itemLabel}>Iuran BPJS Ketenagakerjaan</Text>
            <Text style={[styles.itemValue, { color: '#ef4444' }]}>-{formatRupiah(potonganBpjs)}</Text>
          </View>

          <View style={styles.divider} />

          {/* Take Home Pay (Gaji Bersih Akhir) */}
          <View style={styles.thpBlock}>
            <Text style={styles.thpLabel}>TAKE HOME PAY (GAJI BERSIH)</Text>
            <Text style={styles.thpValue}>{formatRupiah(totalBersih)}</Text>
          </View>

          {/* Catatan Kaki Keamanan */}
          <Text style={styles.secureNotice}>
            🔒 Slip Gaji ini sah dikeluarkan secara digital oleh sistem otomatis JOBTAG dan bersifat rahasia.
          </Text>

        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8fafc' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#f8fafc' },
  loadingText: { marginTop: 12, fontSize: 13, color: '#64748b', fontWeight: '500' },
  headerBar: { backgroundColor: '#ffffff', height: 65, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, borderBottomWidth: 1, borderColor: '#e2e8f0' },
  backText: { color: '#be2929', fontWeight: '600', fontSize: 14 },
  headerTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a' },
  scrollWrapper: { padding: 20, alignItems: 'center', width: '100%' },
  
  salaryCard: {
    backgroundColor: '#ffffff',
    width: '100%',
    maxWidth: 440,
    borderRadius: 12,
    padding: 24,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    ...Platform.select({
      ios: { shadowColor: '#0f172a', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.03, shadowRadius: 8 },
      android: { elevation: 2 },
      web: { boxShadow: '0 4px 12px rgba(15,23,42,0.04)' }
    })
  },
  metaHeader: { alignItems: 'center', marginBottom: 4 },
  companyName: { fontSize: 13, fontWeight: '800', color: '#475569', letterSpacing: 0.5 },
  metaLabel: { color: '#be2929', fontSize: 12, fontWeight: '700', marginTop: 2 },
  divider: { height: 1, backgroundColor: '#e2e8f0', marginVertical: 14 },
  
  // Profil Penerima
  profileSection: { paddingVertical: 2 },
  profileRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 4 },
  profileLabel: { fontSize: 12, color: '#64748b', fontWeight: '500' },
  profileValue: { fontSize: 13, color: '#0f172a', fontWeight: '600' },
  positionBadge: { backgroundColor: '#0f172a', color: '#ffffff', fontSize: 11, fontWeight: '700', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 4, overflow: 'hidden' },
  
  // Item Akuntansi Gaji
  sectionBlockTitle: { fontSize: 11, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5, marginBottom: 8 },
  itemRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6 },
  itemLabel: { color: '#475569', fontSize: 13 },
  itemValue: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  
  subTotalRow: { borderTopWidth: 1, borderTopColor: '#f1f5f9', marginTop: 4, paddingTop: 8 },
  subTotalLabel: { color: '#0f172a', fontSize: 13, fontWeight: '600' },
  subTotalValue: { color: '#0f172a', fontSize: 13, fontWeight: '700' },
  
  // Take Home Pay Section
  thpBlock: { backgroundColor: '#f8fafc', padding: 16, borderRadius: 8, alignItems: 'center', marginVertical: 6, borderWidth: 1, borderColor: '#e2e8f0' },
  thpLabel: { color: '#475569', fontSize: 11, fontWeight: '700', letterSpacing: 0.5, marginBottom: 4 },
  thpValue: { fontSize: 26, fontWeight: '800', color: '#be2929' },
  secureNotice: { textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 16, lineHeight: 16, fontStyle: 'italic' }
});