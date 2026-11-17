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
  LogOut,
  Navigation,
  ShieldAlert,
  Sparkles,
} from "lucide-react";

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Geolocation state
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [locating, setLocating] = useState<boolean>(false);

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

    setLocating(true);
    setGeoError(null);

    // Coba dengan akurasi standar terlebih dahulu untuk kecepatan & kompatibilitas desktop
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setCoords({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          accuracy: pos.coords.accuracy || 20,
        });
        setGeoError(null);
        setLocating(false);
      },
      (err) => {
        // Fallback coba high accuracy jika standar gagal
        navigator.geolocation.getCurrentPosition(
          (highPos) => {
            setCoords({
              lat: highPos.coords.latitude,
              lng: highPos.coords.longitude,
              accuracy: highPos.coords.accuracy || 15,
            });
            setGeoError(null);
            setLocating(false);
          },
          (highErr) => {
            setLocating(false);
            setGeoError(
              `Izin lokasi belum aktif (${highErr.message}). Tekan F5 setelah mengizinkan lokasi di browser, atau gunakan tombol "Mode Demo Kantor" di bawah.`
            );
          },
          { enableHighAccuracy: true, timeout: 8000 }
        );
      },
      { enableHighAccuracy: false, timeout: 5000 }
    );
  };

  // Helper untuk pengujian dosen/mahasiswa jika perangkat desktop tidak memiliki sensor GPS
  const setDemoOfficeLocation = () => {
    // Koordinat Kantor Pusat Menara Karya (-6.20000000, 106.81666667) dengan offset 5 meter
    setCoords({
      lat: -6.200015,
      lng: 106.816655,
      accuracy: 10,
    });
    setGeoError(null);
    setMessage({
      type: "success",
      text: "Koordinat simulasi kantor (Menara Karya, Jakarta) aktif untuk keperluan demo presensi.",
    });
  };

  const setDemoOutOfRadiusLocation = () => {
    // Koordinat 5 KM di luar radius kantor untuk menguji penolakan keamanan (Skenario SEC-03)
    setCoords({
      lat: -6.250000,
      lng: 106.850000,
      accuracy: 15,
    });
    setGeoError(null);
    setMessage({
      type: "error",
      text: "Koordinat 5 KM di luar radius kantor diset (Uji Coba Skenario SEC-03: Geofence Rejection).",
    });
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
        text: `Kamera tidak dapat diakses (${err.message}). Pastikan izin kamera aktif pada browser.`,
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

  // Helper jika perangkat tanpa webcam untuk pengujian
  const setDemoPhoto = () => {
    // Buat placeholder canvas foto terverifikasi
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = "#10b981";
      ctx.font = "bold 16px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SWAFOTO DEMO TERVERIFIKASI", 200, 140);
      ctx.fillStyle = "#94a3b8";
      ctx.font = "12px Poppins, sans-serif";
      ctx.fillText(new Date().toLocaleString("id-ID"), 200, 170);
      setPhoto(canvas.toDataURL("image/jpeg", 0.8));
      setMessage({
        type: "success",
        text: "Swafoto pengujian terverifikasi berhasil disiapkan.",
      });
    }
  };

  const handleCheckIn = async () => {
    if (!coords) {
      setMessage({ type: "error", text: "Koordinat GPS belum terdeteksi. Silakan muat ulang GPS atau gunakan Mode Demo." });
      return;
    }
    if (!photo) {
      setMessage({ type: "error", text: "Swafoto wajib diambil untuk verifikasi presensi kehadiran." });
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col">
      <Navbar user={user} />

      <main className="flex-1 max-w-4xl mx-auto px-4 sm:px-6 py-8 w-full space-y-6">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-400" />
            <span>Presensi Geofence & Kamera Swafoto</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
            Kalkulasi jarak dilakukan murni di server menggunakan Haversine Formula untuk menangkal lokasi palsu (Fake GPS).
          </p>
        </div>

        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm ${
              message.type === "success"
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-300"
                : "bg-rose-500/10 border-rose-500/20 text-rose-300"
            }`}
          >
            {message.type === "success" ? (
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-400 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-400 mt-0.5" />
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
          {/* Kamera View Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Kamera Swafoto</span>
              </span>
              {photo && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Foto Siap
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center">
              {photo ? (
                <img src={photo} alt="Swafoto" className="w-full h-full object-cover" />
              ) : cameraActive ? (
                <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-6 text-slate-500 space-y-2">
                  <Camera className="w-8 h-8 mx-auto opacity-40 text-slate-400" />
                  <p className="text-xs">Kamera belum diaktifkan</p>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />

            <div className="space-y-2">
              <div className="flex gap-2">
                {!cameraActive && !photo && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Nyalakan Kamera</span>
                  </button>
                )}

                {cameraActive && (
                  <button
                    type="button"
                    onClick={capturePhoto}
                    className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
                  >
                    <Camera className="w-4 h-4" />
                    <span>Ambil Foto</span>
                  </button>
                )}

                {photo && !checkedInToday && (
                  <button
                    type="button"
                    onClick={startCamera}
                    className="w-full py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl border border-white/[0.08] flex items-center justify-center gap-2 transition"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    <span>Ambil Ulang</span>
                  </button>
                )}
              </div>

              {!photo && !checkedInToday && (
                <button
                  type="button"
                  onClick={setDemoPhoto}
                  className="w-full py-2 text-[11px] text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] rounded-lg border border-white/[0.05] transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Gunakan Foto Verifikasi Demo</span>
                </button>
              )}
            </div>
          </div>

          {/* Lokasi & Status Geofence Card */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Status Lokasi GPS</span>
                </span>
                <button
                  onClick={startGeolocation}
                  disabled={locating}
                  className="text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3 h-3 ${locating ? "animate-spin" : ""}`} />
                  <span>{locating ? "Mencari GPS..." : "Perbarui GPS"}</span>
                </button>
              </div>

              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-2.5 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Kantor Terdaftar:</span>
                  <span className="text-white font-semibold">{user?.office?.name || "Menara Karya Jakarta"}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Batas Toleransi:</span>
                  <span className="text-emerald-400 font-mono font-bold">
                    {user?.office?.radiusMeters || 100} Meter
                  </span>
                </div>
                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Latitude:</span>
                  <span className="text-slate-200">{coords ? coords.lat.toFixed(6) : "Mendeteksi..."}</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Longitude:</span>
                  <span className="text-slate-200">{coords ? coords.lng.toFixed(6) : "Mendeteksi..."}</span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Akurasi Sinyal:</span>
                  <span className="text-slate-200">
                    {coords ? `±${Math.round(coords.accuracy)} meter` : "-"}
                  </span>
                </div>
              </div>

              {geoError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">Izin GPS Belum Terbaca</p>
                    <p className="text-[11px] text-amber-400/90 leading-relaxed">{geoError}</p>
                  </div>
                </div>
              )}

              {/* Mode Demo Preset Buttons */}
              <div className="pt-2 border-t border-white/[0.06] space-y-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
                  Simulasi Pengujian Dosen (Cyber Security)
                </span>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={setDemoOfficeLocation}
                    className="p-2 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-semibold text-center transition"
                  >
                    📍 Set Titik Kantor (Valid)
                  </button>
                  <button
                    type="button"
                    onClick={setDemoOutOfRadiusLocation}
                    className="p-2 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-semibold text-center transition"
                  >
                    ⚠️ Uji 5 KM (Tolak)
                  </button>
                </div>
              </div>
            </div>

            {/* Tombol Action Check-In / Check-Out */}
            <div className="pt-4 border-t border-white/[0.06]">
              {!checkedInToday ? (
                <button
                  type="button"
                  onClick={handleCheckIn}
                  disabled={submitting || !coords || !photo}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
                >
                  <Clock className="w-4 h-4" />
                  <span>{submitting ? "Memvalidasi Jarak..." : "Kirim Presensi Masuk (Check-In)"}</span>
                </button>
              ) : !checkedOutToday ? (
                <button
                  type="button"
                  onClick={handleCheckOut}
                  disabled={submitting}
                  className="w-full py-3 px-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 text-white font-bold text-xs sm:text-sm rounded-xl shadow-lg shadow-amber-950/40 flex items-center justify-center gap-2 transition"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{submitting ? "Memproses..." : "Presensi Pulang (Check-Out)"}</span>
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
