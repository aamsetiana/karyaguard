"use client";

import { useState, useEffect, useRef } from "react";
import Navbar from "@/components/Navbar";
import {
  Camera,
  MapPin,
  Clock,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  ShieldAlert,
  ArrowRight,
  LogOut,
} from "lucide-react";

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Check status
  const [checkedInToday, setCheckedInToday] = useState<boolean>(false);
  const [checkedOutToday, setCheckedOutToday] = useState<boolean>(false);

  useEffect(() => {
    fetchProfile();
    startGeolocation();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        checkTodayAttendance(data.user.id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const checkTodayAttendance = async (userId: string) => {
    try {
      const res = await fetch(`/api/attendance/history?userId=${userId}`);
      const data = await res.json();
      if (data.success && data.attendances.length > 0) {
        const todayStr = new Date().toDateString();
        const todayRecord = data.attendances.find(
          (a: any) => new Date(a.date).toDateString() === todayStr
        );
        if (todayRecord) {
          setCheckedInToday(true);
          if (todayRecord.checkOutTime) {
            setCheckedOutToday(true);
          }
        }
      }
    } catch (err) {
      console.error(err);
    }
  };

  const startGeolocation = () => {
    if (!navigator.geolocation) {
      setGeoError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
        });
        setGeoError(null);
      },
      (err) => {
        setGeoError(`Gagal membaca lokasi GPS: ${err.message}. Mohon izinkan akses lokasi.`);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const startCamera = async () => {
    setPhoto(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
        setCameraActive(true);
      }
    } catch (err: any) {
      setMessage({
        type: "error",
        text: "Kamera tidak dapat diakses. Pastikan izin kamera aktif pada peramban Anda.",
      });
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        setPhoto(dataUrl);

        // Hentikan stream kamera
        const stream = video.srcObject as MediaStream;
        if (stream) {
          stream.getTracks().forEach((track) => track.stop());
        }
        setCameraActive(false);
      }
    }
  };

  const handleCheckIn = async () => {
    if (!coords) {
      setMessage({ type: "error", text: "Koordinat GPS belum terdeteksi. Silakan muat ulang GPS." });
      return;
    }
    if (!photo) {
      setMessage({ type: "error", text: "Swafoto wajib diambil untuk verifikasi presensi." });
      return;
    }

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/attendance/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords.lat,
          longitude: coords.lng,
          accuracy: coords.accuracy,
          photo,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan presensi check-in");
      }

      setMessage({ type: "success", text: data.message });
      setCheckedInToday(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCheckOut = async () => {
    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/attendance/check-out", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          latitude: coords?.lat,
          longitude: coords?.lng,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal melakukan presensi check-out");
      }

      setMessage({ type: "success", text: data.message });
      setCheckedOutToday(true);
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <Navbar user={user} />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-emerald-400" />
            <span>Presensi Geofencing & Swafoto</span>
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Presensi divalidasi dengan kalkulasi jarak server-side dan swafoto anti-manipulasi lokasi.
          </p>
        </div>

        {message && (
          <div
            className={`mb-6 p-4 rounded-xl border flex items-start space-x-3 text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-5 h-5 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0 text-rose-400 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">
                {message.type === "success" ? "Berhasil" : "Presensi Ditolak"}
              </p>
              <p className="mt-0.5">{message.text}</p>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Section 1: Kamera Swafoto */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-4">
            <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-2">
              <Camera className="w-4 h-4 text-emerald-400" />
              <span>Verifikasi Swafoto (Selfie)</span>
            </h2>

            <div className="relative aspect-video bg-slate-950 rounded-xl overflow-hidden border border-slate-800 flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Swafoto" className="w-full h-full object-cover" />
              ) : cameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-500">
                  <Camera className="w-10 h-10 mx-auto mb-2 opacity-50" />
                  <p className="text-xs">Kamera belum diaktifkan</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="flex gap-2">
              {!cameraActive && !photo && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-200 font-medium text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-4 h-4 text-emerald-400" />
                  <span>Aktifkan Kamera</span>
                </button>
              )}

              {cameraActive && (
                <button
                  type="button"
                  onClick={capturePhoto}
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-900/40 flex items-center justify-center gap-2 transition"
                >
                  <Camera className="w-4 h-4" />
                  <span>Ambil Foto</span>
                </button>
              )}

              {photo && !checkedInToday && (
                <button
                  type="button"
                  onClick={startCamera}
                  className="w-full py-2.5 px-4 bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs rounded-xl border border-slate-700 flex items-center justify-center gap-2 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Foto Ulang</span>
                </button>
              )}
            </div>
          </div>

          {/* Section 2: Koordinat & Status Geofence */}
          <div className="bg-slate-900 rounded-2xl p-6 border border-slate-800 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-slate-300 flex items-center justify-between">
                <span className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Deteksi Lokasi GPS</span>
                </span>
                <button
                  onClick={startGeolocation}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                  title="Perbarui GPS"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Refresh</span>
                </button>
              </h2>

              <div className="bg-slate-950 rounded-xl p-4 border border-slate-800 space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-400">Kantor Ditugaskan:</span>
                  <span className="text-slate-200 font-semibold">{user?.office?.name || "Menara Karya Jakarta"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Radius Diizinkan:</span>
                  <span className="text-emerald-400 font-mono font-semibold">{user?.office?.radiusMeters || 100} Meter</span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/80">
                  <span className="text-slate-400">Latitude Karyawan:</span>
                  <span className="font-mono text-slate-300">{coords ? coords.lat.toFixed(6) : "Mendeteksi..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Longitude Karyawan:</span>
                  <span className="font-mono text-slate-300">{coords ? coords.lng.toFixed(6) : "Mendeteksi..."}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Akurasi GPS:</span>
                  <span className="font-mono text-slate-300">
                    {coords ? `±${Math.round(coords.accuracy)} meter` : "-"}
                  </span>
                </div>
              </div>

              {geoError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span>{geoError}</span>
                </div>
              )}
            </div>

            {/* Aksi Check-In / Check-Out */}
            <div className="pt-4 border-t border-slate-800 space-y-3">
              {!checkedInToday ? (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={submitting || !coords || !photo}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-lg shadow-emerald-950/50 flex items-center justify-center gap-2 transition"
                >
                  <Clock className="w-4 h-4" />
                  <span>{submitting ? "Memvalidasi Geofence..." : "Kirim Presensi Masuk (Check-In)"}</span>
                </button>
              ) : !checkedOutToday ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-sm rounded-xl shadow-lg shadow-amber-950/50 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{submitting ? "Memproses Check-Out..." : "Presensi Pulang (Check-Out)"}</span>
                </button>
              ) : (
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-semibold">
                  Presensi Hari Ini Selesai (Check-In & Check-Out Lengkap)
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

