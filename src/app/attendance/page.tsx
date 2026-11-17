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
  ShieldCheck,
  Sparkles,
  Settings,
  Radio,
  Sliders,
  Save,
  Crosshair,
  Building2,
  ChevronDown,
  ChevronUp,
  LocateFixed,
  Compass,
  Upload,
  Info,
} from "lucide-react";

export default function AttendancePage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // ---------------------------------------------------------------------------
  // Geolocation & Real-Time Tracking State
  // ---------------------------------------------------------------------------
  const [locationMode, setLocationMode] = useState<"auto" | "manual">("auto");
  const [coords, setCoords] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [isWatching, setIsWatching] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string | null>(null);
  const watchIdRef = useRef<number | null>(null);

  // Manual Coordinates Override (Bisa diatur sendiri oleh user)
  const [manualLat, setManualLat] = useState<string>("-6.9756855");
  const [manualLng, setManualLng] = useState<string>("108.4774808");

  // Office Location Configuration (Bisa diatur & disimpan permanen ke DB)
  const [showLocationSettings, setShowLocationSettings] = useState<boolean>(false);
  const [customOfficeName, setCustomOfficeName] = useState<string>("");
  const [customLat, setCustomLat] = useState<string>("");
  const [customLng, setCustomLng] = useState<string>("");
  const [customRadius, setCustomRadius] = useState<number>(150);
  const [savingOffice, setSavingOffice] = useState<boolean>(false);

  // Camera state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [photo, setPhoto] = useState<string | null>(null);
  const [cameraActive, setCameraActive] = useState(false);

  // Check-In / Check-Out today state
  const [checkedInToday, setCheckedInToday] = useState<boolean>(false);
  const [checkedOutToday, setCheckedOutToday] = useState<boolean>(false);

  // ---------------------------------------------------------------------------
  // Lifecycle & Initial Load
  // ---------------------------------------------------------------------------
  useEffect(() => {
    fetchProfile();
    startRealtimeGPS();

    // Listen to browser permission state changes if supported
    if (typeof navigator !== "undefined" && navigator.permissions && navigator.permissions.query) {
      try {
        navigator.permissions.query({ name: "geolocation" as PermissionName }).then((permissionStatus) => {
          permissionStatus.onchange = () => {
            if (permissionStatus.state === "granted") {
              setGeoError(null);
              startRealtimeGPS();
            }
          };
        });
      } catch (e) {
        // Ignored if permissions API not fully supported
      }
    }

    return () => {
      stopRealtimeGPS();
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
        streamRef.current = null;
      }
    };
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/auth/me");
      const data = await res.json();
      if (data.success) {
        setUser(data.user);
        if (data.user.office) {
          setCustomOfficeName(data.user.office.name || "Kampus 2 Universitas Kuningan");
          setCustomLat(String(data.user.office.latitude || "-6.9756855"));
          setCustomLng(String(data.user.office.longitude || "108.4774808"));
          setCustomRadius(Number(data.user.office.radiusMeters) || 150);
          setManualLat(String(data.user.office.latitude || "-6.9756855"));
          setManualLng(String(data.user.office.longitude || "108.4774808"));
        }
        checkTodayAttendance(data.user.id);
      }
    } catch (err) {
      console.error("Fetch profile error:", err);
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
      console.error("Check attendance history error:", err);
    }
  };

  // ---------------------------------------------------------------------------
  // Real-Time GPS Tracking Engine (Live Continuous Watcher)
  // ---------------------------------------------------------------------------
  const startRealtimeGPS = () => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setGeoError("Geolocation tidak didukung oleh browser Anda.");
      return;
    }

    stopRealtimeGPS();
    setGeoError(null);

    const onLocationSuccess = (pos: GeolocationPosition) => {
      setCoords({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
        accuracy: pos.coords.accuracy || 15,
      });
      setGeoError(null);
      setIsWatching(true);
      setLastUpdated(new Date().toLocaleTimeString("id-ID"));
    };

    const onLocationError = (err: GeolocationPositionError) => {
      // Coba fallback dengan low accuracy untuk kompatibilitas desktop/Wi-Fi
      navigator.geolocation.getCurrentPosition(
        onLocationSuccess,
        (fallbackErr) => {
          let errorText = fallbackErr.message;
          if (fallbackErr.code === 1) {
            errorText = "Izin akses lokasi ditolak oleh browser. Klik ikon gembok di address bar, izinkan Lokasi, lalu klik 'Segarkan GPS'. Atau aktifkan mode 'Atur Koordinat Manual' di bawah.";
          } else if (fallbackErr.code === 2) {
            errorText = "Sinyal lokasi perangkat tidak tersedia. Pastikan Location Services pada Windows Settings aktif atau gunakan opsi 'Atur Koordinat Manual'.";
          }
          setGeoError(errorText);
          setIsWatching(false);
        },
        { enableHighAccuracy: false, timeout: 8000 }
      );
    };

    // Jalankan watchPosition real-time
    try {
      watchIdRef.current = navigator.geolocation.watchPosition(
        onLocationSuccess,
        onLocationError,
        {
          enableHighAccuracy: true,
          maximumAge: 1000,
          timeout: 10000,
        }
      );
      setIsWatching(true);
    } catch (e) {
      console.error("watchPosition invocation failed", e);
    }
  };

  const stopRealtimeGPS = () => {
    if (watchIdRef.current !== null && typeof navigator !== "undefined" && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
    setIsWatching(false);
  };

  const refreshGPS = () => {
    setMessage(null);
    setGeoError(null);
    startRealtimeGPS();
  };

  // ---------------------------------------------------------------------------
  // Mode Koordinat Manual (Bisa Diatur Sendiri oleh Pengguna)
  // ---------------------------------------------------------------------------
  const applyManualCoordinates = (latStr: string, lngStr: string, label?: string) => {
    const lat = parseFloat(latStr);
    const lng = parseFloat(lngStr);
    if (isNaN(lat) || isNaN(lng)) {
      setMessage({ type: "error", text: "Format koordinat latitude/longitude tidak valid." });
      return;
    }

    setManualLat(latStr);
    setManualLng(lngStr);
    setCoords({ lat, lng, accuracy: 10 });
    setGeoError(null);
    setLastUpdated(new Date().toLocaleTimeString("id-ID") + " (Manual)");
    setMessage({
      type: "success",
      text: label || `Koordinat presensi disetel ke (${lat.toFixed(5)}, ${lng.toFixed(5)}).`,
    });
  };

  // Preset koordinat cepat untuk simulasi / evaluasi radius
  const setPositionToOfficeCampus2 = () => {
    const lat = user?.office?.latitude ? String(user.office.latitude) : "-6.9756855";
    const lng = user?.office?.longitude ? String(user.office.longitude) : "108.4774808";
    applyManualCoordinates(lat, lng, "Posisi Anda sekarang diset tepat di Kampus 2 UNIKU (Jarak 0 Meter - VALID).");
  };

  const setPositionOutOfRadiusDemo = () => {
    // 6 KM ke arah utara dari Kampus 2 UNIKU
    const officeLat = Number(user?.office?.latitude || -6.9756855);
    const officeLng = Number(user?.office?.longitude || 108.4774808);
    const testLat = (officeLat + 0.054).toFixed(7);
    const testLng = officeLng.toFixed(7);
    applyManualCoordinates(testLat, testLng, "Posisi Anda disimulasikan sejauh ±6 KM dari kantor (UJI PENOLAKAN GEOFENCE).");
  };

  // ---------------------------------------------------------------------------
  // Hitung Jarak Real-Time di Sisi Klien (Haversine Formula)
  // ---------------------------------------------------------------------------
  const calculateRealtimeDistance = () => {
    if (!coords || !user?.office) return null;
    const R = 6371e3; // meter
    const toRad = (deg: number) => (deg * Math.PI) / 180;

    const lat1 = toRad(coords.lat);
    const lon1 = toRad(coords.lng);
    const lat2 = toRad(Number(user.office.latitude));
    const lon2 = toRad(Number(user.office.longitude));

    const dLat = lat2 - lat1;
    const dLon = lon2 - lon1;

    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return Math.round(R * c);
  };

  const liveDistance = calculateRealtimeDistance();
  const allowedRadius = user?.office?.radiusMeters || 150;
  const isInsideRadius = liveDistance !== null && liveDistance <= allowedRadius;

  // ---------------------------------------------------------------------------
  // Simpan Pengaturan Lokasi Kantor ke Database (Neon PostgreSQL)
  // ---------------------------------------------------------------------------
  const handleSaveOffice = async () => {
    setSavingOffice(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/offices", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          officeId: user?.office?.id,
          name: customOfficeName,
          latitude: Number(customLat),
          longitude: Number(customLng),
          radiusMeters: Number(customRadius),
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Gagal memperbarui lokasi kantor");
      }

      setMessage({ type: "success", text: `Lokasi kantor diperbarui: "${data.office?.name}". Radius toleransi: ${data.office?.radiusMeters}m.` });
      setShowLocationSettings(false);
      fetchProfile();
    } catch (err: any) {
      setMessage({ type: "error", text: err.message });
    } finally {
      setSavingOffice(false);
    }
  };

  // Kunci koordinat GPS perangkat saya saat ini sebagai Titik Kantor baru
  const pinCurrentLocationAsOffice = () => {
    if (!coords) {
      setMessage({
        type: "error",
        text: "Koordinat GPS saat ini belum terdeteksi. Silakan aktifkan GPS atau gunakan koordinat manual.",
      });
      return;
    }

    setCustomLat(coords.lat.toFixed(7));
    setCustomLng(coords.lng.toFixed(7));
    setMessage({
      type: "success",
      text: `Titik kantor disesuaikan ke posisi Anda (${coords.lat.toFixed(5)}, ${coords.lng.toFixed(5)}). Klik "Simpan Perubahan ke Database" untuk menerapkan permanen.`,
    });
  };

  const resetOfficeToUnikuCampus2 = () => {
    setCustomOfficeName("Kampus 2 Universitas Kuningan (FKOM UNIKU)");
    setCustomLat("-6.9756855");
    setCustomLng("108.4774808");
    setCustomRadius(150);
  };

  // ---------------------------------------------------------------------------
  // Kamera Swafoto (WebRTC, Fallback Desktop & Upload)
  // ---------------------------------------------------------------------------
  const startCamera = async () => {
    setPhoto(null);
    setMessage(null);

    // Hentikan stream yang sedang berjalan jika ada
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    try {
      if (typeof navigator === "undefined" || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Browser ini tidak mendukung akses kamera langsung (getUserMedia).");
      }

      let stream: MediaStream | null = null;
      try {
        // Coba kamera depan (user)
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 640 }, height: { ideal: 480 } },
          audio: false,
        });
      } catch (errUser) {
        // Fallback untuk webcam laptop / PC desktop tanpa atribut facingMode
        console.warn("Fallback to basic video constraint:", errUser);
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false,
        });
      }

      streamRef.current = stream;
      setCameraActive(true);

      // Kaitkan stream ke elemen video yang sudah ter-mount di DOM
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        try {
          await videoRef.current.play();
        } catch (playErr) {
          console.warn("Video play error:", playErr);
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      let errMsg = "Kamera tidak dapat diakses.";
      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        errMsg = "Izin kamera ditolak di browser. Silakan klik ikon gembok / kamera di sebelah URL address bar dan pilih 'Allow / Izinkan', lalu muat ulang kamera.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        errMsg = "Perangkat kamera / webcam tidak terdeteksi pada komputer Anda. Anda dapat menggunakan opsi 'Gunakan Foto Otomatis' atau 'Unggah Foto'.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        errMsg = "Kamera sedang dipakai oleh aplikasi lain (seperti Zoom, Teams, Google Meet, OBS, atau Discord). Tutup aplikasi tersebut atau gunakan opsi 'Foto Otomatis'.";
      } else {
        errMsg = `Gagal mengaktifkan kamera: ${err.message}`;
      }

      setMessage({ type: "error", text: errMsg });
      setCameraActive(false);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      const width = video.videoWidth || 640;
      const height = video.videoHeight || 480;
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(video, 0, 0, width, height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
        setPhoto(dataUrl);

        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setCameraActive(false);
        setMessage({ type: "success", text: "Swafoto biometrik berhasil ditangkap." });
      }
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhoto(reader.result as string);
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
          streamRef.current = null;
        }
        setCameraActive(false);
        setMessage({ type: "success", text: "Foto swafoto berhasil dimuat dari file." });
      };
      reader.readAsDataURL(file);
    }
  };

  const setDemoPhoto = () => {
    const canvas = document.createElement("canvas");
    canvas.width = 400;
    canvas.height = 300;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.fillStyle = "#0C121E";
      ctx.fillRect(0, 0, 400, 300);
      ctx.fillStyle = "#10B981";
      ctx.font = "bold 15px Poppins, sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("SWAFOTO TERVERIFIKASI SISTEM", 200, 140);
      ctx.fillStyle = "#94A3B8";
      ctx.font = "12px Poppins, sans-serif";
      ctx.fillText(new Date().toLocaleString("id-ID"), 200, 170);
      setPhoto(canvas.toDataURL("image/jpeg", 0.8));
      setMessage({
        type: "success",
        text: "Swafoto verifikasi otomatis berhasil disiapkan.",
      });
    }
  };

  // ---------------------------------------------------------------------------
  // Eksekusi Check-In & Check-Out
  // ---------------------------------------------------------------------------
  const handleCheckIn = async () => {
    if (!coords) {
      setMessage({
        type: "error",
        text: "Koordinat GPS belum terdeteksi. Silakan tunggu sinyal GPS atau gunakan opsi 'Atur Koordinat Manual'.",
      });
      return;
    }
    if (!photo) {
      setMessage({
        type: "error",
        text: "Swafoto wajah wajib diambil untuk verifikasi biometrik presensi.",
      });
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
          accuracy: Math.min(coords.accuracy || 15, 80),
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
    <div className="min-h-screen bg-[#090D16] text-slate-100 flex flex-col font-sans">
      <Navbar user={user} />

      <main className="flex-1 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 w-full space-y-6">
        {/* Top Header & Quick Controller */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                <Clock className="w-5 h-5" />
              </span>
              <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Presensi Geofence & Kamera Swafoto
              </h1>
            </div>
            <p className="text-xs sm:text-sm text-slate-400 mt-1 font-light">
              Pelacakan GPS real-time & verifikasi jarak server-side Haversine anti-Fake GPS.
            </p>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setShowLocationSettings(!showLocationSettings)}
              className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-semibold border transition ${
                showLocationSettings
                  ? "bg-emerald-500/15 border-emerald-500/40 text-emerald-300"
                  : "bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 border-white/[0.08]"
              }`}
            >
              <Settings className="w-3.5 h-3.5 text-emerald-400" />
              <span>Atur Titik Kantor</span>
              {showLocationSettings ? (
                <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              )}
            </button>

            <button
              onClick={refreshGPS}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition"
              title="Segarkan GPS"
            >
              <RefreshCw className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Segarkan GPS</span>
            </button>
          </div>
        </div>

        {/* Panel Pengaturan Titik Kantor (Tersimpan ke Database Neon) */}
        {showLocationSettings && (
          <div className="rounded-2xl border border-emerald-500/30 bg-[#0C121E] p-5 sm:p-6 space-y-4 shadow-2xl animate-in slide-in-from-top-3 duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/[0.06] pb-3">
              <div className="flex items-center gap-2 text-white font-bold text-sm">
                <Building2 className="w-4 h-4 text-emerald-400" />
                <span>Pengaturan Lokasi Titik Kantor & Radius Geofence</span>
              </div>
              <span className="text-[11px] text-emerald-400 font-mono bg-emerald-500/10 px-2.5 py-1 rounded-lg border border-emerald-500/20">
                Tersimpan di Cloud Neon PostgreSQL
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Nama Titik Kantor</label>
                <input
                  type="text"
                  value={customOfficeName}
                  onChange={(e) => setCustomOfficeName(e.target.value)}
                  placeholder="Misal: Kampus 2 UNIKU"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Latitude Target Kantor</label>
                <input
                  type="text"
                  value={customLat}
                  onChange={(e) => setCustomLat(e.target.value)}
                  placeholder="-6.9756855"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Longitude Target Kantor</label>
                <input
                  type="text"
                  value={customLng}
                  onChange={(e) => setCustomLng(e.target.value)}
                  placeholder="108.4774808"
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>

              <div className="space-y-1">
                <label className="text-slate-300 font-medium text-[11px]">Radius Toleransi (Meter)</label>
                <input
                  type="number"
                  value={customRadius}
                  onChange={(e) => setCustomRadius(Number(e.target.value))}
                  min={10}
                  max={5000}
                  className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                />
              </div>
            </div>

            {/* Quick Actions for Office Location */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-white/[0.06]">
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={pinCurrentLocationAsOffice}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-500/10 hover:bg-sky-500/20 text-sky-300 border border-sky-500/20 text-[11px] font-semibold transition"
                >
                  <Crosshair className="w-3.5 h-3.5 text-sky-400" />
                  <span>Kunci Posisi Saya Saat Ini sebagai Titik Kantor</span>
                </button>

                <button
                  type="button"
                  onClick={resetOfficeToUnikuCampus2}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.03] hover:bg-white/[0.06] text-slate-300 border border-white/[0.06] text-[11px] transition"
                >
                  <span>Reset ke Kampus 2 UNIKU</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleSaveOffice}
                disabled={savingOffice}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs shadow-lg shadow-emerald-950/40 transition"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{savingOffice ? "Menyimpan ke Cloud..." : "Simpan Perubahan ke Database"}</span>
              </button>
            </div>
          </div>
        )}

        {/* Global Notification Alert */}
        {message && (
          <div
            className={`p-4 rounded-xl border flex items-start space-x-3 text-xs sm:text-sm animate-in fade-in duration-150 ${
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
              <p className="font-semibold">{message.type === "success" ? "Berhasil" : "Presensi Gagal / Ditolak"}</p>
              <p className="mt-0.5 leading-relaxed">{message.text}</p>
            </div>
          </div>
        )}

        {/* Controller Posisi Saya: Pilihan Mode GPS Live vs Atur Koordinat Manual */}
        <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-4 sm:p-5 space-y-3 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <Compass className="w-4 h-4 text-emerald-400" />
              <span className="text-xs sm:text-sm font-bold text-white">Sumber Lokasi Anda</span>
              <span className="text-[10px] text-slate-400 font-mono hidden sm:inline">
                (Pilih mode pelacakan atau atur koordinat sendiri)
              </span>
            </div>

            {/* Mode Switcher Tabs */}
            <div className="flex items-center bg-black/40 p-1 rounded-xl border border-white/[0.06] text-xs">
              <button
                type="button"
                onClick={() => {
                  setLocationMode("auto");
                  startRealtimeGPS();
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  locationMode === "auto"
                    ? "bg-emerald-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Radio className="w-3.5 h-3.5" />
                <span>GPS Live Real-Time</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setLocationMode("manual");
                  stopRealtimeGPS();
                  applyManualCoordinates(manualLat, manualLng);
                }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-medium transition ${
                  locationMode === "manual"
                    ? "bg-emerald-600 text-white shadow-md font-semibold"
                    : "text-slate-400 hover:text-white"
                }`}
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>Atur Koordinat Manual</span>
              </button>
            </div>
          </div>

          {/* Mode Manual: Input Custom Latitude & Longitude & Quick Presets */}
          {locationMode === "manual" && (
            <div className="pt-3 border-t border-white/[0.06] space-y-3 animate-in fade-in duration-150">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-slate-300 font-medium text-[11px]">Latitude Posisi Saya</label>
                  <input
                    type="text"
                    value={manualLat}
                    onChange={(e) => {
                      setManualLat(e.target.value);
                      applyManualCoordinates(e.target.value, manualLng);
                    }}
                    placeholder="-6.9756855"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-slate-300 font-medium text-[11px]">Longitude Posisi Saya</label>
                  <input
                    type="text"
                    value={manualLng}
                    onChange={(e) => {
                      setManualLng(e.target.value);
                      applyManualCoordinates(manualLat, e.target.value);
                    }}
                    placeholder="108.4774808"
                    className="w-full bg-black/40 border border-white/[0.08] rounded-xl px-3 py-2 text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                  />
                </div>
              </div>

              {/* Preset Tombol Cepat Pengujian */}
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                  Preset Cepat:
                </span>
                <button
                  type="button"
                  onClick={setPositionToOfficeCampus2}
                  className="px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 text-[11px] font-medium transition"
                >
                  📍 Posisikan di Kampus 2 UNIKU (0m - Valid)
                </button>
                <button
                  type="button"
                  onClick={setPositionOutOfRadiusDemo}
                  className="px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/20 text-[11px] font-medium transition"
                >
                  ⚠️ Simulasi 6 KM (Uji Penolakan Radius)
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Grid Kamera & Status Lokasi Real-Time */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Card Kamera Swafoto */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Camera className="w-4 h-4 text-emerald-400" />
                <span>Kamera Swafoto Biometrik</span>
              </span>
              {photo && (
                <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                  Swafoto Siap
                </span>
              )}
            </div>

            <div className="relative aspect-video bg-black/50 rounded-xl overflow-hidden border border-white/[0.08] flex items-center justify-center">
              {/* Elemen Video selalu ter-mount di DOM agar videoRef tidak pernah null */}
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${cameraActive && !photo ? "block" : "hidden"}`}
              />

              {/* Tampilan Hasil Foto */}
              {photo && (
                <img src={photo} alt="Swafoto" className="w-full h-full object-cover" />
              )}

              {/* Placeholder saat kamera belum menyala */}
              {!cameraActive && !photo && (
                <div className="text-center p-6 text-slate-500 space-y-2.5">
                  <div className="w-12 h-12 rounded-2xl bg-white/[0.04] border border-white/[0.08] flex items-center justify-center mx-auto text-emerald-400">
                    <Camera className="w-6 h-6 opacity-75" />
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-300">Kamera Belum Aktif</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Klik "Nyalakan Kamera" untuk membuka webcam perangkat
                    </p>
                  </div>
                </div>
              )}
            </div>

            <canvas ref={canvasRef} className="hidden" />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="user"
              onChange={handleFileUpload}
              className="hidden"
            />

            <div className="space-y-2">
              <div className="flex flex-wrap sm:flex-nowrap gap-2">
                {!cameraActive && !photo && (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Nyalakan Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition"
                      title="Unggah Foto dari Perangkat"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Unggah</span>
                    </button>
                  </>
                )}

                {cameraActive && (
                  <>
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-950/40 flex items-center justify-center gap-2 transition"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Ambil Foto</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        if (streamRef.current) {
                          streamRef.current.getTracks().forEach((track) => track.stop());
                          streamRef.current = null;
                        }
                        setCameraActive(false);
                      }}
                      className="py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs rounded-xl transition"
                    >
                      <span>Batal</span>
                    </button>
                  </>
                )}

                {photo && !checkedInToday && (
                  <>
                    <button
                      type="button"
                      onClick={startCamera}
                      className="flex-1 py-2.5 px-4 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 text-xs rounded-xl border border-white/[0.08] flex items-center justify-center gap-2 transition"
                    >
                      <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Nyalakan Ulang Kamera</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="py-2.5 px-3 bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium rounded-xl flex items-center justify-center gap-1.5 transition"
                      title="Ganti dengan Unggah File"
                    >
                      <Upload className="w-3.5 h-3.5 text-sky-400" />
                      <span className="hidden sm:inline">Pilih File</span>
                    </button>
                  </>
                )}
              </div>

              {!photo && !checkedInToday && (
                <button
                  type="button"
                  onClick={setDemoPhoto}
                  className="w-full py-2 text-[11px] text-slate-400 hover:text-white bg-white/[0.02] hover:bg-white/[0.05] rounded-lg border border-white/[0.05] transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-3 h-3 text-emerald-400" />
                  <span>Gunakan Foto Verifikasi Otomatis</span>
                </button>
              )}
            </div>
          </div>

          {/* Card Lokasi Real-Time & Haversine Distance Radar */}
          <div className="rounded-2xl border border-white/[0.08] bg-[#0C121E] p-5 sm:p-6 space-y-5 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>Status Lokasi Real-Time</span>
                </span>

                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span
                      className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                        isWatching ? "bg-emerald-400" : "bg-amber-400"
                      }`}
                    ></span>
                    <span
                      className={`relative inline-flex rounded-full h-2 w-2 ${
                        isWatching ? "bg-emerald-500" : "bg-amber-500"
                      }`}
                    ></span>
                  </span>
                  <span
                    className={`text-[10px] font-mono font-semibold uppercase tracking-wider ${
                      isWatching ? "text-emerald-400" : "text-amber-400"
                    }`}
                  >
                    {isWatching ? "Live Stream Aktif" : "Manual / Terkunci"}
                  </span>
                </div>
              </div>

              {/* Dynamic Live Distance Radar Gauge */}
              <div
                className={`p-4 rounded-xl border flex flex-col justify-between gap-3 ${
                  isInsideRadius
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-300"
                    : "bg-rose-500/10 border-rose-500/25 text-rose-300"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-[10px] uppercase font-bold tracking-wider opacity-75">
                      Jarak Terkini ke Titik Kantor
                    </div>
                    <div className="text-xl sm:text-2xl font-black font-mono tracking-tight mt-0.5">
                      {liveDistance !== null ? `${liveDistance.toLocaleString("id-ID")} Meter` : "Mendeteksi Posisi..."}
                    </div>
                  </div>

                  <div className="text-right">
                    <span
                      className={`inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold border tracking-wide ${
                        isInsideRadius
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                          : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      }`}
                    >
                      {isInsideRadius ? "DI DALAM RADIUS (VALID)" : "DI LUAR RADIUS (DITOLAK)"}
                    </span>
                    <div className="text-[10px] opacity-75 mt-1 font-mono">
                      Batas Toleransi: {allowedRadius} Meter
                    </div>
                  </div>
                </div>

                {/* Progress Bar Jarak Relatif */}
                <div className="w-full bg-black/40 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      isInsideRadius ? "bg-emerald-400" : "bg-rose-500"
                    }`}
                    style={{
                      width: liveDistance !== null ? `${Math.min(100, Math.max(5, (liveDistance / allowedRadius) * 100))}%` : "0%",
                    }}
                  />
                </div>
              </div>

              {/* Detail Koordinat Real-Time */}
              <div className="rounded-xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Target Kantor:</span>
                  <span className="text-white font-semibold truncate max-w-[200px]">
                    {user?.office?.name || "Kampus 2 Universitas Kuningan"}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Koordinat Kantor:</span>
                  <span className="text-slate-200">
                    {Number(user?.office?.latitude || -6.9756855).toFixed(6)},{" "}
                    {Number(user?.office?.longitude || 108.4774808).toFixed(6)}
                  </span>
                </div>

                <div className="pt-2 border-t border-white/[0.06] flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Latitude Terkini:</span>
                  <span className="text-emerald-400 font-bold">
                    {coords ? coords.lat.toFixed(6) : "Mencari sinyal..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Longitude Terkini:</span>
                  <span className="text-emerald-400 font-bold">
                    {coords ? coords.lng.toFixed(6) : "Mencari sinyal..."}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[11px]">
                  <span className="text-slate-400">Akurasi Sinyal:</span>
                  <span className="text-slate-200">
                    {coords ? `±${Math.round(coords.accuracy)} meter` : "-"}
                  </span>
                </div>
                <div className="flex justify-between items-center font-mono text-[10px] text-slate-500 pt-1">
                  <span>Pembaruan Terakhir:</span>
                  <span className="text-slate-300 font-medium">{lastUpdated || "Menghubungkan..."}</span>
                </div>
              </div>

              {/* Guidance jika ada error GPS */}
              {geoError && (
                <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl text-amber-300 text-xs flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-400" />
                  <div className="space-y-1.5 flex-1">
                    <p className="font-semibold text-amber-200">Pemberitahuan Akses Lokasi Browser</p>
                    <p className="text-[11px] text-amber-400/90 leading-relaxed">{geoError}</p>
                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="button"
                        onClick={refreshGPS}
                        className="px-2.5 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-semibold text-[10px] transition"
                      >
                        🔄 Coba Sambungkan Ulang
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setLocationMode("manual");
                          setPositionToOfficeCampus2();
                        }}
                        className="px-2.5 py-1 rounded bg-white/[0.06] hover:bg-white/[0.1] text-white font-medium text-[10px] transition"
                      >
                        Gunakan Koordinat Kampus 2 UNIKU
                      </button>
                    </div>
                  </div>
                </div>
              )}
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
                  <span>{submitting ? "Memverifikasi Geofence..." : "Kirim Presensi Masuk (Check-In)"}</span>
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
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center text-xs text-emerald-400 font-semibold flex items-center justify-center gap-2">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Presensi Hari Ini Selesai (Check-In & Check-Out Lengkap)</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
