// =============================================================
// JOBTAG - Utility Helpers
// =============================================================

/**
 * Format Date object ke string "Senin, 22 Juni 2026"
 */
export function formatTanggal(date = new Date()) {
  return date.toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Format Date object ke string jam "HH:MM:SS"
 */
export function formatJam(date) {
  if (!date) return '--:--';
  const d = date instanceof Date ? date : date.toDate?.() ?? new Date(date);
  return d.toLocaleTimeString('id-ID', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });
}

/**
 * Ambil tanggal hari ini dalam format "YYYY-MM-DD" (digunakan sebagai document ID)
 */
export function getDateKey(date = new Date()) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Ambil nama depan dari full name / email
 */
export function getFirstName(displayName, email) {
  if (displayName) return displayName.split(' ')[0];
  if (email) return email.split('@')[0];
  return 'Pengguna';
}
