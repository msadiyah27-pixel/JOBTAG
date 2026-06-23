// =============================================================
// JOBTAG - Root App Entry Point
// Cukup render AppNavigator. Semua logika ada di dalam.
// =============================================================

import { registerRootComponent } from 'expo';
import AppNavigator from './src/navigation/AppNavigator'; // sesuaikan dengan cara Anda import navigation

function App() {
  return <AppNavigator />;
}

// PASTIKAN BARIS INI ADA DI PALING BAWAH
registerRootComponent(App);
