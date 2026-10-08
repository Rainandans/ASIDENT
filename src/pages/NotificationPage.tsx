import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Bell, 
  ChevronLeft, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  Save, 
  CheckCircle2, 
  Printer, 
  Calendar, 
  Clock, 
  User, 
  Info, 
  LogOut,
  Apple,
  Sparkles,
  CalendarCheck,
  RotateCcw,
  AlertCircle,
  Share2,
  ExternalLink,
  ShieldCheck,
  Check,
  Flame,
  Heart,
  Baby,
  Backpack,
  HeartHandshake,
  UserCheck
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { db, collection, onSnapshot } from "../lib/firebase";

export default function NotificationPage({ user, onLogout }: { user?: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<"reminder-hub" | "recall-list" | "settings">("reminder-hub");
  const [saved, setSaved] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [selectedPatientForPrint, setSelectedPatientForPrint] = useState<any | null>(null);

  // Daily habit tracker state (stored in localStorage)
  const todayKey = new Date().toISOString().split("T")[0];
  const [habits, setHabits] = useState<{ [key: string]: boolean }>(() => {
    const savedHabits = localStorage.getItem(`asident_habits_${todayKey}`);
    return savedHabits ? JSON.parse(savedHabits) : {
      fiberFruit: false,
      morningBrush: false,
      nightBrush: false,
      flossing: false,
      waterHydration: false
    };
  });

  const [settings, setSettings] = useState({
    appointmentReminder: true,
    sixMonthRecallReminder: true,
    dietFiberReminder: true,
    billingAlert: true,
    educationUpdate: true,
    channels: {
      email: true,
      whatsapp: true,
      push: false
    },
    reminderTime: "24" // hours before
  });

  useEffect(() => {
    localStorage.setItem(`asident_habits_${todayKey}`, JSON.stringify(habits));
  }, [habits, todayKey]);

  useEffect(() => {
    // Load appointments
    const savedApps = JSON.parse(localStorage.getItem("asident_appointments") || "[]");
    const sorted = savedApps.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setAppointments(sorted);

    // Load assessments from Firestore for 6-month recall
    const unsubscribe = onSnapshot(collection(db, "assessments"), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      // Sort by createdAt descending
      data.sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
      setAssessments(data);
    }, (err) => {
      console.error("Error loading assessments for recall:", err);
    });

    return () => unsubscribe();
  }, []);

  const handleSaveSettings = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleHabit = (key: string) => {
    setHabits(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const completedHabitsCount = Object.values(habits).filter(Boolean).length;
  const habitPercentage = Math.round((completedHabitsCount / 5) * 100);

  // Calculate 6-month recall patients
  const uniquePatientsRecall = React.useMemo(() => {
    const patientMap = new Map<string, any>();
    
    assessments.forEach(item => {
      const name = item.demographics?.fullName || "Tanpa Nama";
      const phone = item.demographics?.phone || "";
      const key = `${name}_${phone}`;
      
      // Since assessments are sorted newest first, first time we see the patient is their latest visit
      if (!patientMap.has(key)) {
        const lastVisitDate = new Date(item.createdAt || item.header?.visitDate || Date.now());
        // 6 months = roughly 182.5 days
        const nextRecallDate = new Date(lastVisitDate);
        nextRecallDate.setMonth(nextRecallDate.getMonth() + 6);
        
        const now = new Date();
        const diffDays = Math.round((nextRecallDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        let status: "due" | "upcoming" | "safe" = "safe";
        if (diffDays <= 0) {
          status = "due"; // Waktunya kontrol / lewat
        } else if (diffDays <= 30) {
          status = "upcoming"; // Kurang dari 1 bulan
        }

        patientMap.set(key, {
          id: item.id,
          name,
          phone,
          age: item.demographics?.age || "-",
          lastVisitDate,
          nextRecallDate,
          diffDays,
          status,
          ohisScore: item.ohis?.score ?? "-",
          category: item.demographics?.age && Number(item.demographics.age) <= 5 ? "Balita" :
                    item.demographics?.age && Number(item.demographics.age) <= 12 ? "Anak Sekolah" :
                    item.demographics?.age && Number(item.demographics.age) >= 60 ? "Lansia" : "Dewasa"
        });
      }
    });

    return Array.from(patientMap.values()).sort((a, b) => a.diffDays - b.diffDays);
  }, [assessments]);

  // Send WhatsApp Reminder
  const sendWhatsAppReminder = (patient: any) => {
    const cleanPhone = (patient.phone || "").replace(/[^0-9]/g, "");
    let phoneParam = cleanPhone;
    if (phoneParam.startsWith("0")) {
      phoneParam = "62" + phoneParam.slice(1);
    }

    const formattedNextDate = patient.nextRecallDate.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const message = `Halo Bapak/Ibu ${patient.name},\n\nSalam sehat dari Klinik Gigi ASIDENT! 🦷✨\n\nKami ingin mengingatkan bahwa jadwal *Pemeriksaan Gigi Rutin 6 Bulan Sekali* Anda jatuh tempo pada: *${formattedNextDate}*.\n\n*Anjuran Penting untuk Kesehatan Gigi Anda:*\n1. 🥦 *Konsumsi Buah & Sayur Berserat*: Mengunyah buah seperti apel, pir, bengkuang, atau sayuran hijau membantu membersihkan sisa makanan dan plak secara alami (self-cleansing action).\n2. 🪥 *Sikat Gigi 2x Sehari*: Pagi 30 menit setelah sarapan dan malam sebelum tidur dengan pasta gigi berfluoride.\n3. 🗓️ *Pembersihan Karang Gigi (Scaling)*: Karang gigi yang mengeras hanya dapat dibersihkan di klinik untuk menjaga gusi tetap sehat dan tidak goyang.\n\nSilakan hubungi kami untuk reservasi jadwal kunjungan Anda. Terima kasih! 🙏`;

    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${phoneParam}?text=${encoded}`, "_blank");
  };

  // Print Comprehensive Patient Reminder Card
  const handlePrintComprehensiveReminder = (patientName?: string, nextDate?: Date) => {
    const targetName = patientName || (user?.name || "Pasien ASIDENT");
    const targetNextDate = nextDate || new Date(Date.now() + 180 * 24 * 60 * 60 * 1000);
    const formattedDate = targetNextDate.toLocaleDateString("id-ID", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric"
    });

    const printWindow = window.open("", "_blank");
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Pengingat Kesehatan Gigi - ASIDENT</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
            body { 
              font-family: 'Plus Jakarta Sans', sans-serif; 
              padding: 30px; 
              color: #0f172a; 
              background: #fff;
              line-height: 1.5; 
            }
            .card { 
              max-width: 600px; 
              margin: 0 auto; 
              border: 2px solid #2563eb; 
              border-radius: 28px; 
              padding: 36px; 
              background: #ffffff;
              box-shadow: 0 10px 25px rgba(37,99,235,0.08);
            }
            .header { 
              display: flex; 
              justify-content: space-between; 
              align-items: center; 
              border-bottom: 2px dashed #e2e8f0; 
              padding-bottom: 20px; 
              margin-bottom: 24px; 
            }
            .logo { font-size: 26px; font-weight: 900; color: #2563eb; margin: 0; }
            .tagline { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
            .badge { background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; padding: 6px 14px; border-radius: 12px; }
            .patient-box { 
              background: #f8fafc; 
              border: 1px solid #e2e8f0; 
              border-radius: 18px; 
              padding: 16px 20px; 
              margin-bottom: 24px; 
              display: flex;
              justify-content: space-between;
              align-items: center;
            }
            .patient-name { font-size: 18px; font-weight: 800; color: #0f172a; }
            .recall-box { 
              background: #eff6ff; 
              border: 2px solid #3b82f6; 
              border-radius: 20px; 
              padding: 20px; 
              text-align: center; 
              margin-bottom: 24px; 
            }
            .recall-title { font-size: 12px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; }
            .recall-date { font-size: 20px; font-weight: 900; color: #1e3a8a; margin: 6px 0; }
            .recall-sub { font-size: 12px; color: #475569; font-weight: 600; }
            .section-title { 
              font-size: 13px; 
              font-weight: 900; 
              color: #0f172a; 
              text-transform: uppercase; 
              letter-spacing: 1px; 
              margin: 20px 0 12px; 
              display: flex;
              align-items: center;
              gap: 8px;
            }
            .habit-item { 
              display: flex; 
              align-items: flex-start; 
              gap: 12px; 
              padding: 12px 16px; 
              border-radius: 14px; 
              margin-bottom: 8px; 
              background: #f8fafc; 
              border-left: 4px solid #10b981; 
            }
            .habit-title { font-size: 13px; font-weight: 800; color: #0f172a; margin: 0; }
            .habit-desc { font-size: 11px; color: #475569; margin-top: 3px; font-weight: 500; }
            .quote-box {
              background: #ecfdf5;
              border: 1px solid #a7f3d0;
              border-radius: 16px;
              padding: 14px 18px;
              margin-top: 20px;
              font-size: 12px;
              color: #065f46;
              font-weight: 600;
            }
            .footer { 
              margin-top: 28px; 
              padding-top: 16px; 
              border-top: 1px solid #e2e8f0; 
              text-align: center; 
              font-size: 11px; 
              color: #94a3b8; 
              font-weight: 600;
            }
            @media print {
              body { padding: 0; }
              .card { border: 1px solid #94a3b8; box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <p class="logo">ASIDENT</p>
                <p class="tagline">Pusat Layanan Asuhan Kesehatan Gigi & Mulut</p>
              </div>
              <span class="badge">KARTU PENGINGAT PASIEN</span>
            </div>

            <div class="patient-box">
              <div>
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Nama Pasien</span>
                <div class="patient-name">${targetName}</div>
              </div>
              <div style="text-align: right;">
                <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Status Program</span>
                <div style="font-size: 12px; font-weight: 800; color: #16a34a;">● Aktif Terjadwal</div>
              </div>
            </div>

            <div class="recall-box">
              <div class="recall-title">🗓️ JADWAL KONTROL 6 BULAN BERIKUTNYA</div>
              <div class="recall-date">${formattedDate}</div>
              <div class="recall-sub">Periksa gigi & pembersihan karang gigi (scaling) rutin sebelum timbul rasa sakit.</div>
            </div>

            <div class="section-title">🥦 PANDUAN POLA HIDUP & KEBIASAAN SEHAT GIGI</div>

            <div class="habit-item">
              <div style="font-size: 18px;">🥗</div>
              <div>
                <div class="habit-title">Perbanyak Makanan Berserat (Buah & Sayur Segar)</div>
                <div class="habit-desc">Mengunyah buah renyah (apel, pir, bengkuang) memicu air liur (saliva) yang bertindak sebagai pembersih alami (self-cleansing) dan penawar asam bakteri.</div>
              </div>
            </div>

            <div class="habit-item">
              <div style="font-size: 18px;">🪥</div>
              <div>
                <div class="habit-title">Sikat Gigi 2 Kali Sehari (Pagi & Malam)</div>
                <div class="habit-desc">Pagi setelah sarapan & malam sebelum tidur dengan pasta gigi berfluoride. Sikat gigi malam adalah yang paling krusial mencegah karies.</div>
              </div>
            </div>

            <div class="habit-item">
              <div style="font-size: 18px;">🔄</div>
              <div>
                <div class="habit-title">Ganti Sikat Gigi Setiap 3 Bulan Sekali</div>
                <div class="habit-desc">Bulu sikat yang mekar kehilangan daya bersih dan dapat melukai gusi Anda.</div>
              </div>
            </div>

            <div class="habit-item">
              <div style="font-size: 18px;">🧵</div>
              <div>
                <div class="habit-title">Gunakan Benang Gigi (Flossing) Minimal 1x Sehari</div>
                <div class="habit-desc">Membersihkan 40% area plak tersembunyi di sela-sela gigi yang tidak dapat dijangkau oleh sikat gigi biasa.</div>
              </div>
            </div>

            <div class="quote-box">
              💡 <strong>Tips Sehat:</strong> Tempelkan kartu ini pada cermin kamar mandi atau kulkas sebagai pengingat kebiasaan sehat keluarga setiap hari.
            </div>

            <div class="footer">
              Dicetak melalui Sistem ASIDENT • Hubungi klinik untuk konfirmasi jadwal temu kontrol.
            </div>
          </div>
          <script>
            window.print();
            window.close();
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const isOperator = user?.role === "admin" || user?.role === "pemeriksa";

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-indigo-50/50 p-6 md:p-10">
      {/* Header */}
      <header className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")} 
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
            title="Kembali ke Dashboard"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-emerald-700 flex items-center gap-1">
                <Apple className="h-3 w-3" /> Fitur Pengingat & Kontrol
              </span>
              <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                {isOperator ? "Akses Operator & Pasien" : "Akses Pasien"}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight mt-0.5">
              Pengingat & Kebiasaan Sehat Gigi
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => handlePrintComprehensiveReminder()}
            className="flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-xs font-black text-slate-700 shadow-sm border border-slate-200 hover:border-blue-300 hover:bg-blue-50 transition-all active:scale-95"
          >
            <Printer className="h-4 w-4 text-blue-600" />
            Cetak Kartu Pengingat
          </button>
          <button 
            onClick={onLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm border border-slate-200 transition-all hover:bg-red-50 active:scale-95"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Main Tab Navigation */}
      <div className="mb-8 flex flex-wrap gap-2 rounded-2xl bg-slate-200/60 p-1.5 max-w-xl">
        <button
          onClick={() => setActiveTab("reminder-hub")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black transition-all",
            activeTab === "reminder-hub"
              ? "bg-white text-blue-600 shadow-md shadow-slate-300"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Apple className="h-4 w-4 text-emerald-500" />
          Kartu Pengingat & Kebiasaan Sehat
        </button>
        <button
          onClick={() => setActiveTab("recall-list")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black transition-all",
            activeTab === "recall-list"
              ? "bg-white text-blue-600 shadow-md shadow-slate-300"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <CalendarCheck className="h-4 w-4 text-blue-500" />
          Jadwal Kontrol 6 Bulan {isOperator && `(${uniquePatientsRecall.length})`}
        </button>
        <button
          onClick={() => setActiveTab("settings")}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 px-4 text-xs font-black transition-all",
            activeTab === "settings"
              ? "bg-white text-blue-600 shadow-md shadow-slate-300"
              : "text-slate-600 hover:text-slate-900"
          )}
        >
          <Bell className="h-4 w-4 text-purple-500" />
          Saluran Notifikasi
        </button>
      </div>

      {/* TAB 1: KARTU PENGINGAT & KEBIASAAN SEHAT (BISA DILIHAT OLEH PASIEN & OPERATOR) */}
      {activeTab === "reminder-hub" && (
        <div className="space-y-8">
          {/* Top Hero Banner: Anjuran Makanan Berserat & Kontrol 6 Bulan */}
          <div className="rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800 p-8 md:p-10 text-white shadow-2xl shadow-emerald-900/15 relative overflow-hidden">
            <div className="absolute right-0 top-0 translate-x-12 -translate-y-12 h-64 w-64 rounded-full bg-white/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-3.5 py-1 text-xs font-black uppercase tracking-wider mb-4">
                <Apple className="h-4 w-4 text-amber-300" />
                Pemberitahuan Khusus Pasien & Operator
              </div>
              <h2 className="text-2xl md:text-4xl font-black tracking-tight leading-tight mb-4">
                Pembersihan Alami dengan Serat & Kontrol Rutin 6 Bulan
              </h2>
              <p className="text-sm md:text-base text-emerald-50 leading-relaxed font-medium mb-6">
                Kesehatan gigi tidak hanya bergantung pada sikat gigi, tetapi juga nutrisi harian. 
                Mengunyah sayur dan buah berserat tinggi memicu air liur (saliva) yang membersihkan sisa makanan dan menetralisir keasaman bakteri secara alami (self-cleansing action).
              </p>
              
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => handlePrintComprehensiveReminder()}
                  className="flex items-center gap-2 rounded-2xl bg-white px-6 py-3.5 text-xs font-black text-emerald-900 hover:bg-emerald-50 shadow-lg active:scale-95 transition-all"
                >
                  <Printer className="h-4 w-4 text-emerald-700" />
                  Cetak Lembar Pengingat Pasien
                </button>
                <button
                  onClick={() => navigate("/education")}
                  className="flex items-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md hover:bg-white/25 px-6 py-3.5 text-xs font-black text-white transition-all"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Pelajari Edukasi Kelompok Pasien
                </button>
              </div>
            </div>
          </div>

          {/* 6 Key Pillars of Reminders Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* PILLAR 1: KONSUMSI BUAH & SAYUR BERSERAT */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-emerald-900/5 hover:border-emerald-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-black">
                    <Apple className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-700 uppercase tracking-wider">
                    Pembersih Alami
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Perbanyak Konsumsi Buah & Sayur Berserat
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Makanan berserat tinggi seperti apel, bengkuang, pir, mentimun, dan wortel memiliki sifat mekanis yang menyeka plak gigi saat dikunyah.
                </p>
                <div className="rounded-2xl bg-emerald-50/80 p-3.5 border border-emerald-100 space-y-2 mb-4 text-xs text-emerald-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Memicu Air Liur:</strong> Air liur mengandung kalsium dan fosfat yang memperbaiki email gigi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Ganti Snack Manis:</strong> Jadikan buah potong sebagai camilan sehat pengganti permen dan biskuit lengket.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Rekomendasi:</span>
                <span className="text-emerald-700 font-black">Minimal 2 porsi/hari</span>
              </div>
            </div>

            {/* PILLAR 2: KONTROL 6 BULAN SEKALI */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center font-black">
                    <CalendarCheck className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[10px] font-black text-blue-700 uppercase tracking-wider">
                    Kontrol Rutin
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Kunjungan Dokter Gigi Tiap 6 Bulan Sekali
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Banyak masalah gigi (karies dini & radang gusi) tidak menimbulkan rasa sakit di awal. Pemeriksaan berkala mencegah perawatan besar dan mahal.
                </p>
                <div className="rounded-2xl bg-blue-50/80 p-3.5 border border-blue-100 space-y-2 mb-4 text-xs text-blue-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Scaling Karang Gigi:</strong> Karang gigi tidak bisa lepas hanya dengan sikat gigi, harus dibersihkan secara profesional.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Deteksi Karies Dini:</strong> Menambal lubang selagi kecil agar saraf gigi tidak mati.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Frekuensi:</span>
                <span className="text-blue-700 font-black">Setiap 6 Bulan Sekali</span>
              </div>
            </div>

            {/* PILLAR 3: SIKAT GIGI 2X SEHARI */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-purple-900/5 hover:border-purple-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-700 flex items-center justify-center font-black">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-purple-50 px-2.5 py-1 text-[10px] font-black text-purple-700 uppercase tracking-wider">
                    Higiene Utama
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Menyikat Gigi 2x Sehari (Pagi & Malam)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Waktu menyikat gigi sangat menentukan. Sikat gigi pagi setelah sarapan membersihkan sisa makanan, sedangkan sikat gigi malam melindungi gigi saat tidur.
                </p>
                <div className="rounded-2xl bg-purple-50/80 p-3.5 border border-purple-100 space-y-2 mb-4 text-xs text-purple-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Malam Sebelum Tidur:</strong> Saat tidur produksi saliva menurun drastis sehingga bakteri berkembang biak cepat bila tidak disikat.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Durasi 2 Menit:</strong> Gunakan teknik getar memutar (Bass) dengan bulu sikat miring 45°.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Waktu Utama:</span>
                <span className="text-purple-700 font-black">Pagi Sarapan & Sebelum Tidur</span>
              </div>
            </div>

            {/* PILLAR 4: GANTI SIKAT GIGI 3 BULAN */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-amber-900/5 hover:border-amber-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center font-black">
                    <RotateCcw className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-amber-50 px-2.5 py-1 text-[10px] font-black text-amber-700 uppercase tracking-wider">
                    Peralatan
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Ganti Sikat Gigi Setiap 3 Bulan Sekali
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Bulu sikat yang sudah mekar atau aus kehilangan fleksibilitas untuk membersihkan plak dan justru dapat melukai gusi Anda.
                </p>
                <div className="rounded-2xl bg-amber-50/80 p-3.5 border border-amber-100 space-y-2 mb-4 text-xs text-amber-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Ganti Lebih Cepat:</strong> Bila bulu sikat mekar sebelum 3 bulan atau setelah sembuh dari sakit flu/batuk.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <span><strong>Pilih Bulu Lembut (Soft):</strong> Efektif membersihkan plak tanpa mengikis lapisan email gigi.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Siklus:</span>
                <span className="text-amber-700 font-black">Maksimal 3 Bulan Sekali</span>
              </div>
            </div>

            {/* PILLAR 5: FLOSSING BENANG GIGI */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-teal-900/5 hover:border-teal-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center font-black">
                    <ShieldCheck className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-teal-50 px-2.5 py-1 text-[10px] font-black text-teal-700 uppercase tracking-wider">
                    Sela Gigi
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Gunakan Benang Gigi (Dental Floss)
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Sikat gigi hanya membersihkan sekitar 60% permukaan gigi. 40% area lainnya berada di celah sempit kontak antar gigi.
                </p>
                <div className="rounded-2xl bg-teal-50/80 p-3.5 border border-teal-100 space-y-2 mb-4 text-xs text-teal-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Cegah Karies Proksimal:</strong> Sela gigi yang tidak dibersihkan menjadi sarang lubang gigi tersembunyi.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                    <span><strong>Gunakan 1x Sehari:</strong> Idealnya di malam hari sebelum menyikat gigi.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Frekuensi:</span>
                <span className="text-teal-700 font-black">Minimal 1x Sehari</span>
              </div>
            </div>

            {/* PILLAR 6: PASTA GIGI FLUORIDE & HIDRASI */}
            <div className="rounded-3xl bg-white p-7 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-rose-900/5 hover:border-rose-300 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-4">
                  <div className="h-12 w-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center font-black">
                    <Heart className="h-6 w-6" />
                  </div>
                  <span className="rounded-lg bg-rose-50 px-2.5 py-1 text-[10px] font-black text-rose-700 uppercase tracking-wider">
                    Remineralisasi
                  </span>
                </div>
                <h3 className="text-lg font-black text-slate-900 mb-2">
                  Pasta Gigi Berfluoride & Hidrasi Air Putih
                </h3>
                <p className="text-xs text-slate-600 leading-relaxed mb-4">
                  Fluoride memperkuat email gigi menjadi lebih tahan terhadap asam kuman, sementara air putih membilas sisa asam setelah makan.
                </p>
                <div className="rounded-2xl bg-rose-50/80 p-3.5 border border-rose-100 space-y-2 mb-4 text-xs text-rose-950">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Jangan Langsung Kumur Banyak:</strong> Ludahkan busa pasta gigi berlebih agar lapisan fluoride tetap menempel di email.</span>
                  </div>
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                    <span><strong>Minum Air Putih 2 Liter:</strong> Mencegah mulut kering yang mempercepat perkembangbiakan bakteri karies.</span>
                  </div>
                </div>
              </div>
              <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-bold text-slate-500">
                <span>Anjuran:</span>
                <span className="text-rose-700 font-black">Fluoride Aktif + 8 Gelas Air</span>
              </div>
            </div>
          </div>

          {/* Interactive Daily Habit Tracker (Checklist Sehat Pasien Hari Ini) */}
          <div className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="rounded-lg bg-emerald-100 text-emerald-700 font-black text-xs px-2.5 py-0.5 uppercase tracking-wider">
                    Checklist Mandiri
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    {new Date().toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                  </span>
                </div>
                <h3 className="text-xl font-black text-slate-900 tracking-tight">
                  Disiplin Kebiasaan Gigi Pasien Hari Ini
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Centang kebiasaan sehat yang telah Anda lakukan hari ini untuk menjaga senyum sehat alami.
                </p>
              </div>

              {/* Progress Ring / Bar */}
              <div className="flex items-center gap-4 bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <div className="text-right">
                  <div className="text-xs font-bold text-slate-400">Skor Hari Ini</div>
                  <div className="text-2xl font-black text-slate-900">{completedHabitsCount}/5 Selesai</div>
                </div>
                <div className="h-14 w-14 rounded-2xl bg-emerald-500 text-white font-black text-sm flex items-center justify-center shadow-lg shadow-emerald-500/20">
                  {habitPercentage}%
                </div>
              </div>
            </div>

            {/* Habit Items */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[
                { 
                  key: "fiberFruit", 
                  title: "Makan Sayur / Buah Berserat", 
                  desc: "Konsumsi buah segar renyah (apel, pir, bengkuang) sebagai pembersih alami", 
                  icon: Apple, 
                  color: "emerald" 
                },
                { 
                  key: "morningBrush", 
                  title: "Sikat Gigi Pagi", 
                  desc: "Menyikat gigi dengan pasta fluoride 30 menit setelah sarapan", 
                  icon: Sparkles, 
                  color: "blue" 
                },
                { 
                  key: "nightBrush", 
                  title: "Sikat Gigi Malam", 
                  desc: "Menyikat gigi sebelum tidur malam untuk perlindungan 8 jam tidur", 
                  icon: Heart, 
                  color: "purple" 
                },
                { 
                  key: "waterHydration", 
                  title: "Cukupi Air Putih (8 Gelas)", 
                  desc: "Membilas asam mulut dan menjaga produksi air liur melimpah", 
                  icon: ShieldCheck, 
                  color: "teal" 
                },
                { 
                  key: "flossing", 
                  title: "Flossing / Bersihkan Sela Gigi", 
                  desc: "Menggunakan benang gigi membersihkan plak tersembunyi di sela gigi", 
                  icon: RotateCcw, 
                  color: "amber" 
                },
              ].map((h) => {
                const Icon = h.icon;
                const isChecked = habits[h.key];
                return (
                  <button
                    key={h.key}
                    onClick={() => toggleHabit(h.key)}
                    className={cn(
                      "flex items-start gap-3.5 p-4 rounded-2xl border-2 text-left transition-all group",
                      isChecked 
                        ? "border-emerald-500 bg-emerald-50/60 shadow-sm"
                        : "border-slate-100 bg-slate-50/80 hover:border-slate-200 hover:bg-white"
                    )}
                  >
                    <div className={cn(
                      "h-6 w-6 rounded-lg flex items-center justify-center shrink-0 mt-0.5 transition-colors",
                      isChecked ? "bg-emerald-600 text-white" : "border-2 border-slate-300 bg-white"
                    )}>
                      {isChecked && <Check className="h-4 w-4 stroke-[3]" />}
                    </div>
                    <div>
                      <h4 className={cn("text-xs font-black mb-0.5", isChecked ? "text-emerald-950 line-through" : "text-slate-900")}>
                        {h.title}
                      </h4>
                      <p className="text-[11px] text-slate-500 leading-snug">
                        {h.desc}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: JADWAL KONTROL & RECALL 6 BULAN PASIEN (PASIEN & OPERATOR) */}
      {activeTab === "recall-list" && (
        <div className="space-y-8">
          <div className="rounded-3xl bg-white p-8 shadow-sm border border-slate-200">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-100 pb-6 mb-6">
              <div>
                <div className="flex items-center gap-2">
                  <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                    Sistem Recall Pasien
                  </span>
                  <span className="text-xs font-bold text-slate-400">
                    Standar Klinis 6 Bulan
                  </span>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight mt-1">
                  Daftar Kontrol 6 Bulan Pasien
                </h3>
                <p className="text-xs text-slate-500 mt-1 max-w-xl">
                  {isOperator 
                    ? "Pantau dan kirimkan pengingat kepada pasien yang mendekati atau telah melewati masa 6 bulan sejak kunjungan terakhir mereka." 
                    : "Jadwal estimasi pemeriksaan rutin Anda untuk memastikan kesehatan gigi dan gusi tetap optimal."}
                </p>
              </div>

              {isOperator && (
                <div className="flex items-center gap-3">
                  <div className="rounded-2xl bg-amber-50 px-4 py-2.5 border border-amber-200 text-amber-900 text-xs font-black">
                    Perlu Diingatkan: {uniquePatientsRecall.filter(p => p.status === "due" || p.status === "upcoming").length} Pasien
                  </div>
                </div>
              )}
            </div>

            {/* Recall Table / Cards */}
            {uniquePatientsRecall.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 bg-slate-50/80 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                      <th className="py-3 px-4">Nama Pasien</th>
                      <th className="py-3 px-4">Kelompok / Usia</th>
                      <th className="py-3 px-4">Kunjungan Terakhir</th>
                      <th className="py-3 px-4">Jadwal Kontrol 6 Bulan</th>
                      <th className="py-3 px-4">Status Recall</th>
                      <th className="py-3 px-4 text-right">Aksi Tindak Lanjut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {uniquePatientsRecall.map((patient, idx) => {
                      const isDue = patient.status === "due";
                      const isUpcoming = patient.status === "upcoming";
                      return (
                        <tr key={idx} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-4 px-4">
                            <div className="font-black text-slate-900 text-sm">{patient.name}</div>
                            <div className="text-[11px] text-slate-400">{patient.phone || "No telp belum diisi"}</div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600">
                              {patient.category} ({patient.age} th)
                            </span>
                          </td>
                          <td className="py-4 px-4 text-slate-600">
                            {patient.lastVisitDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-4 px-4 font-black text-slate-900">
                            {patient.nextRecallDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                          </td>
                          <td className="py-4 px-4">
                            {isDue ? (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-red-100 px-2.5 py-1 text-[10px] font-black text-red-700">
                                <AlertCircle className="h-3 w-3" /> Waktunya Kontrol
                              </span>
                            ) : isUpcoming ? (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-amber-100 px-2.5 py-1 text-[10px] font-black text-amber-700">
                                <Clock className="h-3 w-3" /> Mendekati ({patient.diffDays} hari lagi)
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-xl bg-emerald-100 px-2.5 py-1 text-[10px] font-black text-emerald-700">
                                <CheckCircle2 className="h-3 w-3" /> Terjadwal Aman
                              </span>
                            )}
                          </td>
                          <td className="py-4 px-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {/* WhatsApp Reminder Button */}
                              {patient.phone && (
                                <button
                                  onClick={() => sendWhatsAppReminder(patient)}
                                  className="flex items-center gap-1.5 rounded-xl bg-emerald-600 px-3.5 py-2 text-[11px] font-black text-white hover:bg-emerald-700 shadow-sm transition-all active:scale-95"
                                  title="Kirim Pesan WhatsApp Pengingat"
                                >
                                  <MessageSquare className="h-3.5 w-3.5" />
                                  Kirim WA
                                </button>
                              )}
                              {/* Print Individual Reminder Card */}
                              <button
                                onClick={() => handlePrintComprehensiveReminder(patient.name, patient.nextRecallDate)}
                                className="flex items-center gap-1 rounded-xl bg-slate-100 px-3 py-2 text-[11px] font-bold text-slate-700 hover:bg-slate-200 transition-all"
                                title="Cetak Lembar Pengingat Pasien"
                              >
                                <Printer className="h-3.5 w-3.5" />
                                Cetak
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="py-16 text-center">
                <CalendarCheck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                <h4 className="text-base font-black text-slate-800">Belum Ada Rekam Medis untuk Dihitung</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Data rekam medis yang tercatat akan otomatis menghasilkan jadwal recall 6 bulan di halaman ini.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 3: SALURAN NOTIFIKASI & PENGATURAN */}
      {activeTab === "settings" && (
        <div className="mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-sm border border-slate-200">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-2xl bg-blue-50 p-4 text-blue-600">
                  <Bell className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Preferensi Notifikasi</h3>
                  <p className="text-xs font-bold text-slate-400">Pilih jenis pengingat yang diaktifkan dalam sistem.</p>
                </div>
              </div>

              <div className="space-y-3.5">
                {[
                  { id: "sixMonthRecallReminder", label: "Pengingat Kontrol 6 Bulan", desc: "Pemberitahuan otomatis saat mendekati jadwal 6 bulan setelah pemeriksaan terakhir." },
                  { id: "dietFiberReminder", label: "Pengingat Makanan Berserat & Buah", desc: "Edukasi berkala mengenai konsumsi sayur & buah sebagai pembersih alami gigi." },
                  { id: "appointmentReminder", label: "Pengingat Janji Temu Klinis", desc: "Dapatkan pengingat H-1 sebelum jadwal kunjungan dokter gigi." },
                  { id: "educationUpdate", label: "Update Materi Edukasi Kelompok", desc: "Pemberitahuan saat materi edukasi balita, anak, ibu hamil, atau lansia diperbarui." },
                ].map((item) => (
                  <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/70 p-5 transition-all hover:border-blue-200 hover:bg-white">
                    <div className="max-w-[80%]">
                      <p className="font-black text-slate-900 text-xs md:text-sm">{item.label}</p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{item.desc}</p>
                    </div>
                    <div className="relative inline-flex items-center cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={settings[item.id as keyof typeof settings] as boolean}
                        onChange={(e) => setSettings({...settings, [item.id]: e.target.checked})}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </div>
                  </label>
                ))}
              </div>
            </section>

            {/* Channels */}
            <section className="rounded-[2.5rem] bg-white p-8 md:p-10 shadow-sm border border-slate-200">
              <div className="mb-6 flex items-center gap-4">
                <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Saluran Pengiriman Notifikasi</h3>
                  <p className="text-xs font-bold text-slate-400">Pilih media yang digunakan untuk mengirim pengingat ke pasien.</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {[
                  { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
                  { id: "email", label: "Email", icon: Mail, color: "text-blue-500", bg: "bg-blue-50" },
                  { id: "push", label: "Push Notif Web", icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
                ].map((item) => (
                  <button
                    key={item.id}
                    onClick={() => setSettings({
                      ...settings, 
                      channels: { ...settings.channels, [item.id]: !settings.channels[item.id as keyof typeof settings.channels] }
                    })}
                    className={cn(
                      "flex flex-col items-center justify-center rounded-2xl border-2 p-6 transition-all group",
                      settings.channels[item.id as keyof typeof settings.channels]
                        ? "border-blue-600 bg-blue-50/50 shadow-sm"
                        : "border-slate-100 bg-slate-50 text-slate-400 opacity-60"
                    )}
                  >
                    <div className={cn(
                      "mb-3 rounded-xl p-3.5 transition-all group-hover:scale-110",
                      settings.channels[item.id as keyof typeof settings.channels] ? item.bg : "bg-white"
                    )}>
                      <item.icon className={cn("h-7 w-7", settings.channels[item.id as keyof typeof settings.channels] ? item.color : "text-slate-300")} />
                    </div>
                    <span className="text-xs font-black uppercase tracking-wider">{item.label}</span>
                  </button>
                ))}
              </div>

              <div className="mt-8 flex justify-end">
                <button 
                  onClick={handleSaveSettings}
                  className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 font-black text-white hover:bg-blue-600 transition-all text-xs uppercase tracking-wider"
                >
                  {saved ? (
                    <>
                      <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                      BERHASIL DISIMPAN
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      SIMPAN PREFERENSI
                    </>
                  )}
                </button>
              </div>
            </section>
          </div>

          <div className="space-y-6">
            <div className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-500/15">
              <div className="mb-4 rounded-xl bg-white/10 p-3 w-fit">
                <Info className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-black tracking-tight mb-2">Manfaat Pengingat Rutin</h3>
              <p className="text-xs font-medium text-blue-100 leading-relaxed mb-4">
                Pasien yang mendapatkan pengingat rutin mengenai konsumsi serat buah dan jadwal 6 bulan sekali terbukti memiliki skor OHI-S 45% lebih baik dan risiko kehilangan gigi jauh lebih rendah.
              </p>
              <div className="pt-3 border-t border-white/20 text-[11px] text-blue-200">
                Gunakan template WhatsApp untuk follow-up ramah langsung dari aplikasi.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
