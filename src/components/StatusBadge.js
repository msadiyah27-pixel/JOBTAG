// =============================================================
// JOBTAG - Status Badge Component
// Menampilkan status kehadiran dengan warna yang sesuai.
// =============================================================

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../utils/theme';

const STATUS_CONFIG = {
  'Belum Hadir': { bg: COLORS.inputBg, text: COLORS.textMuted },
  'Check In': { bg: COLORS.warningLight, text: COLORS.warning },
  'Check Out': { bg: COLORS.successLight, text: COLORS.success },
};

export default function StatusBadge({ status = 'Belum Hadir' }) {
  const config = STATUS_CONFIG[status] ?? STATUS_CONFIG['Belum Hadir'];
  return (
    <View style={[styles.badge, { backgroundColor: config.bg }]}>
      <View style={[styles.dot, { backgroundColor: config.text }]} />
      <Text style={[styles.text, { color: config.text }]}>{status}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    gap: 6,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: RADIUS.full,
  },
  text: {
    fontSize: 13,
    fontWeight: '600',
  },
});
