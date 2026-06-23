// =============================================================
// JOBTAG - Loading Overlay Component
// Digunakan saat proses async (login, upload, dll.)
// =============================================================

import React from 'react';
import { View, ActivityIndicator, Text, StyleSheet, Modal } from 'react-native';
import { COLORS } from '../utils/theme';

export default function LoadingOverlay({ visible = false, message = 'Memproses...' }) {
  return (
    <Modal transparent animationType="fade" visible={visible}>
      <View style={styles.overlay}>
        <View style={styles.box}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(15,23,42,0.45)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  box: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: 28,
    alignItems: 'center',
    minWidth: 160,
    gap: 14,
  },
  message: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: '500',
    textAlign: 'center',
  },
});
