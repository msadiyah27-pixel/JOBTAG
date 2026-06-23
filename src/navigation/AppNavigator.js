// =============================================================
// JOBTAG - App Navigator (Updated Final)
// Stack Navigator dengan auth state listener Firebase.
// User belum login → LoginScreen
// User sudah login → DashboardScreen (+ akses Report & Salary)
// =============================================================

import React, { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { onAuthStateChanged } from 'firebase/auth';

import { auth } from '../services/firebaseConfig';

import LoginScreen from '../screens/LoginScreen';
import DashboardScreen from '../screens/DashboardScreen';
import ReportScreen from '../screens/ReportScreen';
import SalaryScreen from '../screens/SalaryScreen';

const Stack = createNativeStackNavigator();

// ── Splash / loading saat cek auth state ──────────────────────
function SplashScreen() {
  return (
    <View style={styles.splash}>
      <ActivityIndicator size="large" color="#be2929" />
    </View>
  );
}

// ── Root Navigator Utama ───────────────────────────────────────
export default function AppNavigator() {
  const [user, setUser] = useState(undefined); // undefined = loading cek sesi

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null); // null = terkonfirmasi belum login
    });
    return unsubscribe;
  }, []);

  // Tampilkan splash selama auth state belum diketahui
  if (user === undefined) return <SplashScreen />;

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Jika USER SUDAH LOGIN, daftarkan grup rute operasional
          <>
            <Stack.Screen name="Dashboard" component={DashboardScreen} />
            <Stack.Screen name="Report" component={ReportScreen} />
            <Stack.Screen name="Salary" component={SalaryScreen} />
          </>
        ) : (
          // Jika USER BELUM LOGIN, lempar ke screen autentikasi
          <Stack.Screen name="Login" component={LoginScreen} />
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8fafc',
  },
});