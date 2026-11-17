/**
 * Utilitas Kalkulasi Geofencing & Proteksi Anti-Fake GPS
 * Menggunakan Haversine Formula untuk menghitung jarak bola bumi dalam meter
 */

export interface Coordinates {
  latitude: number;
  longitude: number;
  accuracy?: number; // Akurasi GPS dalam meter
}

/**
 * Menghitung jarak antara 2 titik koordinat (dalam satuan METER)
 * Menggunakan Formula Haversine
 */
export function calculateDistanceMeters(
  coord1: Coordinates,
  coord2: Coordinates
): number {
  const R = 6371e3; // Radius bumi rata-rata = 6,371 km = 6,371,000 meter
  const toRadians = (degrees: number) => (degrees * Math.PI) / 180;

  const lat1Rad = toRadians(coord1.latitude);
  const lat2Rad = toRadians(coord2.latitude);
  const deltaLat = toRadians(coord2.latitude - coord1.latitude);
  const deltaLon = toRadians(coord2.longitude - coord1.longitude);

  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.cos(lat1Rad) *
      Math.cos(lat2Rad) *
      Math.sin(deltaLon / 2) *
      Math.sin(deltaLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return Math.round(R * c * 100) / 100; // Pembulatan 2 desimal
}

/**
 * Validasi apakah posisi karyawan berada di dalam batas radius geofence kantor
 */
export function validateGeofence(
  userPos: Coordinates,
  officePos: Coordinates,
  allowedRadiusMeters: number
): {
  isWithinBounds: boolean;
  distanceMeters: number;
  error?: string;
} {
  // 1. Verifikasi akurasi GPS: jika accuracy > 2000 meter, sinyal terlalu bias
  if (userPos.accuracy && userPos.accuracy > 2000) {
    return {
      isWithinBounds: false,
      distanceMeters: 0,
      error: `Akurasi sinyal GPS terlalu rendah (${Math.round(userPos.accuracy)}m). Pastikan GPS perangkat aktif atau pilih lokasi manual.`,
    };
  }

  // 2. Hitung jarak sebenarnya ke titik koordinat kantor
  const distance = calculateDistanceMeters(userPos, officePos);

  if (distance > allowedRadiusMeters) {
    return {
      isWithinBounds: false,
      distanceMeters: distance,
      error: `Lokasi Anda berada di luar radius kantor yang diizinkan. Jarak terdeteksi: ${distance.toLocaleString("id-ID")} meter (Maksimal: ${allowedRadiusMeters} meter).`,
    };
  }

  return {
    isWithinBounds: true,
    distanceMeters: distance,
  };
}

