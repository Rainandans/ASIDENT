import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Search, 
  ChevronLeft, 
  User, 
  Calendar, 
  FileText, 
  Trash2, 
  ExternalLink,
  Filter,
  Download,
  Database,
  TrendingUp,
  X,
  LogOut,
  Plus,
  Apple,
  Bell,
  Printer,
  MessageSquare,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { db, collection, onSnapshot, doc, deleteDoc } from "../lib/firebase";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Legend
} from "recharts";

export default function PatientDatabase({ user, onLogout }: { user: any, onLogout: () => void }) {
  const navigate = useNavigate();
  const [assessments, setAssessments] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterRole, setFilterRole] = useState("all");
  const [selectedPatient, setSelectedPatient] = useState<{ fullName: string; phone: string } | null>(null);
  const [selectedReminderPatient, setSelectedReminderPatient] = useState<any | null>(null);

  useEffect(() => {
    console.log("PatientDatabase: Fetching assessments...");
    const unsubscribe = onSnapshot(collection(db, "assessments"), (snapshot) => {
      console.log(`PatientDatabase: Received snapshot with ${snapshot.size} documents.`);
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ ...doc.data(), id: doc.id });
      });
      // Sort by createdAt descending, use ID as secondary sort to ensure stability
      data.sort((a, b) => {
        const getTimestamp = (doc: any) => {
          const sources = [doc.createdAt, doc.header?.visitDate];
          for (const src of sources) {
            if (src) {
              const t = new Date(src).getTime();
              if (!isNaN(t)) return t;
            }
          }
          return 0; // Fallback to epoch if no valid date found
        };

        const timeA = getTimestamp(a);
        const timeB = getTimestamp(b);
        
        if (timeB !== timeA) {
          return timeB - timeA;
        }
        // Force stable sort for items with identical timestamps
        return (b.id || "").localeCompare(a.id || "");
      });
      setAssessments(data);
    }, (error) => {
      console.error("PatientDatabase: Snapshot error:", error);
    });
    return () => unsubscribe();
  }, []);

  const selectedPatientHistory = React.useMemo(() => {
    if (!selectedPatient) return null;
    return assessments
      .filter(a => {
        const matchesName = a.demographics?.fullName === selectedPatient.fullName;
        // If phone is present in both, it must match. If missing in one, we trust the name.
        const matchesPhone = !selectedPatient.phone || !a.demographics?.phone || a.demographics?.phone === selectedPatient.phone;
        return matchesName && matchesPhone;
      })
      .sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
      .map(a => {
        // Fallback calculation if score is missing
        let ohisScore = a.ohis?.score;
        if (ohisScore === undefined && a.ohis?.debris && a.ohis?.calculus) {
          const indexTeeth = a.ohis.indexTeeth || { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" };
          const teeth = Object.values(indexTeeth).filter((t: any) => t && t !== "-");
          const dValues = teeth.map(t => Number(a.ohis.debris[t as string] || 0));
          const cValues = teeth.map(t => Number(a.ohis.calculus[t as string] || 0));
          const count = teeth.length > 0 ? teeth.length : 1;
          const di = teeth.length > 0 ? (dValues.reduce((a, b) => a + b, 0) / count) : 0;
          const ci = teeth.length > 0 ? (cValues.reduce((a, b) => a + b, 0) / count) : 0;
          ohisScore = Number((di + ci).toFixed(2));
        }

        let plaqueScore = a.plaqueControl?.score;
        if (plaqueScore === undefined && a.plaqueControl?.surfaces) {
          const surfaces = a.plaqueControl.surfaces || [];
          const totalPlak = surfaces.filter(Boolean).length;
          const totalSurfaces = 32 * 4;
          plaqueScore = Number(((totalPlak / totalSurfaces) * 100).toFixed(1));
        }

        const createdAtDate = a.createdAt ? new Date(a.createdAt) : null;
        const formattedDate = createdAtDate && !isNaN(createdAtDate.getTime()) 
          ? createdAtDate.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
          : 'Unknown';

        return {
          date: formattedDate,
          ohis: ohisScore || 0,
          plaque: plaqueScore || 0,
        };
      });
  }, [assessments, selectedPatient]);

  const showProgress = (fullName: string, phone: string) => {
    setSelectedPatient({ fullName, phone });
  };

  const handleDelete = async (id: string, fullName: string, date: string, examiner: string, updatedAt?: string) => {
    const formattedDate = date && !isNaN(new Date(date).getTime()) 
      ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : 'Tanggal Tidak Diketahui';
    
    const formattedUpdate = updatedAt && !isNaN(new Date(updatedAt).getTime())
      ? new Date(updatedAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }) 
      : (date ? new Date(date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }) : 'Tidak ada');
    
    console.log("Delete Request:", { id, fullName, date, updatedAt });

    if (window.confirm(`KONFIRMASI PENGHAPUSAN\n\nPasien: ${fullName}\nID Data: ${id}\nTanggal Input: ${formattedDate}\nUpdate Terakhir: ${formattedUpdate}\nPemeriksa: ${examiner}\n\nApakah Anda YAKIN akan menghapus REKAM MEDIS ini secara permanen?`)) {
      try {
        console.log("EXECUTE DELETE on ID:", id);
        await deleteDoc(doc(db, "assessments", id));
        alert("Data berhasil dihapus.");
      } catch (error: any) {
        console.error("Error deleting assessment:", error);
        alert("Gagal menghapus data: " + (error.message || "Unknown error"));
      }
    }
  };

  const handlePrintPatientReminder = (patient: any) => {
    const fullName = patient.demographics?.fullName || "Pasien ASIDENT";
    const visitDate = patient.createdAt ? new Date(patient.createdAt) : new Date();
    const nextDate = new Date(visitDate);
    nextDate.setMonth(nextDate.getMonth() + 6);
    const formattedDate = nextDate.toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Pengingat Kontrol & Edukasi Pasien - ASIDENT</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;600;700;800;900&display=swap');
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 30px; color: #0f172a; line-height: 1.5; }
            .card { max-width: 580px; margin: 0 auto; border: 2px solid #2563eb; border-radius: 24px; padding: 36px; background: #fff; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px dashed #cbd5e1; padding-bottom: 16px; margin-bottom: 20px; }
            .logo { font-size: 24px; font-weight: 900; color: #2563eb; margin: 0; }
            .tagline { font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
            .badge { background: #dbeafe; color: #1e40af; font-size: 11px; font-weight: 800; padding: 6px 12px; border-radius: 10px; }
            .patient-box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 16px; padding: 14px 18px; margin-bottom: 20px; }
            .recall-box { background: #eff6ff; border: 2px solid #3b82f6; border-radius: 18px; padding: 18px; text-align: center; margin-bottom: 20px; }
            .recall-title { font-size: 11px; font-weight: 800; color: #2563eb; text-transform: uppercase; letter-spacing: 1.5px; }
            .recall-date { font-size: 20px; font-weight: 900; color: #1e3a8a; margin: 6px 0; }
            .item { display: flex; align-items: flex-start; gap: 10px; padding: 10px 14px; border-radius: 12px; margin-bottom: 8px; background: #f8fafc; border-left: 4px solid #10b981; }
            .item-title { font-size: 12px; font-weight: 800; color: #0f172a; margin: 0; }
            .item-desc { font-size: 11px; color: #475569; margin-top: 2px; }
            .footer { margin-top: 24px; padding-top: 14px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <div>
                <p class="logo">ASIDENT</p>
                <p class="tagline">Layanan Asuhan Kesehatan Gigi & Mulut</p>
              </div>
              <span class="badge">LEMBAR PENGINGAT PASIEN</span>
            </div>
            <div class="patient-box">
              <span style="font-size: 10px; font-weight: 800; color: #64748b; text-transform: uppercase;">Nama Pasien</span>
              <div style="font-size: 16px; font-weight: 800; color: #0f172a;">${fullName}</div>
            </div>
            <div class="recall-box">
              <div class="recall-title">🗓️ JADWAL KONTROL 6 BULAN BERIKUTNYA</div>
              <div class="recall-date">${formattedDate}</div>
              <div style="font-size: 11px; color: #475569;">Pembersihan karang gigi & pemeriksaan rutin sebelum timbul rasa sakit.</div>
            </div>
            <div style="font-size: 12px; font-weight: 800; color: #0f172a; margin-bottom: 8px;">🥦 ANJURAN POLA HIDUP SEHAT GIGI</div>
            <div class="item">
              <div>🥗</div>
              <div>
                <div class="item-title">Perbanyak Buah & Sayur Berserat Tinggi</div>
                <div class="item-desc">Mengunyah apel, bengkuang, wortel secara alami membersihkan plak (self-cleansing) dan memicu air liur.</div>
              </div>
            </div>
            <div class="item">
              <div>🪥</div>
              <div>
                <div class="item-title">Sikat Gigi 2 Kali Sehari (Pagi & Malam)</div>
                <div class="item-desc">Pagi setelah sarapan & malam sebelum tidur dengan pasta gigi berfluoride.</div>
              </div>
            </div>
            <div class="item">
              <div>🔄</div>
              <div>
                <div class="item-title">Ganti Sikat Gigi Tiap 3 Bulan Sekali</div>
                <div class="item-desc">Bulu sikat mekar kehilangan efektivitas dan dapat melukai gusi.</div>
              </div>
            </div>
            <div class="footer">
              Terima kasih telah mempercayakan kesehatan gigi Anda kepada kami • Hubungi klinik untuk reservasi jadwal.
            </div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const handleSendWhatsAppReminder = (patient: any) => {
    const fullName = patient.demographics?.fullName || "Pasien";
    const phone = patient.demographics?.phone || "";
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    let phoneParam = cleanPhone;
    if (phoneParam.startsWith("0")) {
      phoneParam = "62" + phoneParam.slice(1);
    }
    const visitDate = patient.createdAt ? new Date(patient.createdAt) : new Date();
    const nextDate = new Date(visitDate);
    nextDate.setMonth(nextDate.getMonth() + 6);
    const formattedDate = nextDate.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });

    const text = `Halo Bapak/Ibu ${fullName},\n\nSalam dari Tim Kesehatan Gigi ASIDENT! 🦷✨\n\nIni adalah pengingat jadwal kontrol gigi rutin 6 bulan Anda yang jatuh tempo pada: *${formattedDate}*.\n\n*Anjuran Penting untuk Kesehatan Gigi Anda:*\n1. 🥦 *Perbanyak Konsumsi Buah & Sayur Berserat*: Mengunyah buah renyah seperti apel, pir, bengkuang, dan sayuran hijau membantu membersihkan sisa makanan dan plak secara alami (self-cleansing action).\n2. 🪥 *Sikat Gigi 2x Sehari*: Pagi setelah sarapan & malam sebelum tidur dengan pasta gigi fluoride.\n3. 🗓️ *Pembersihan Karang Gigi (Scaling)*: Karang gigi hanya dapat dibersihkan di klinik untuk menjaga gusi tetap sehat dan tidak goyang.\n\nSilakan hubungi kami untuk konfirmasi jadwal kunjungan Anda. Terima kasih! 🙏`;

    window.open(`https://wa.me/${phoneParam}?text=${encodeURIComponent(text)}`, '_blank');
  };

  const filteredAssessments = assessments.filter(a => {
    const fullNameStr = a.demographics?.fullName ? String(a.demographics.fullName).toLowerCase() : "";
    const phoneStr = a.demographics?.phone ? String(a.demographics.phone) : "";
    const matchesSearch = 
      fullNameStr.includes(searchTerm.toLowerCase()) ||
      phoneStr.includes(searchTerm);
    return matchesSearch;
  }).slice(0, filterRole === "recent" ? 10 : undefined);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-md border-b border-slate-200 px-6 py-4">
        <div className="mx-auto max-w-7xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="rounded-full p-2 hover:bg-slate-100 text-slate-500"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-bold text-slate-900">Database Pasien</h1>
              <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">ASIDENT • Arsip Rekam Medis</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="hidden md:block text-right">
              <p className="text-sm font-bold text-slate-900">{user.name}</p>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">{user.role}</p>
            </div>
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-500 hover:bg-red-100 transition-all uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
            <button className="flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-2 text-sm font-bold text-slate-600 hover:bg-slate-200 transition-all">
              <Download className="h-4 w-4" />
              Ekspor CSV
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl p-8">
        {/* Search & Filter Bar */}
        <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari nama pasien atau nomor HP..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full rounded-2xl border-2 border-slate-100 bg-white py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500 transition-all shadow-sm"
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 rounded-2xl bg-white border-2 border-slate-100 p-1 shadow-sm">
              <button 
                onClick={() => setFilterRole("all")}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  filterRole === "all" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Semua
              </button>
              <button 
                onClick={() => setFilterRole("recent")}
                className={cn(
                  "px-4 py-2 text-xs font-black uppercase tracking-widest rounded-xl transition-all",
                  filterRole === "recent" ? "bg-blue-600 text-white shadow-md" : "text-slate-400 hover:text-slate-600"
                )}
              >
                Terbaru
              </button>
            </div>
          </div>
        </div>

        {/* Database Table/Grid */}
        <div className="grid grid-cols-1 gap-6">
          <AnimatePresence mode="popLayout">
            {filteredAssessments.length > 0 ? (
              filteredAssessments.map((a, i) => (
                <motion.div 
                  key={a.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ delay: i * 0.05 }}
                  className="group relative overflow-hidden rounded-[2rem] bg-white p-6 shadow-sm border border-slate-100 hover:shadow-xl hover:shadow-slate-200/50 transition-all"
                >
                  <div className="flex flex-col gap-6 md:flex-row md:items-center">
                    <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-50 text-blue-600">
                      <User className="h-8 w-8" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-lg font-black text-slate-900">{a.demographics?.fullName || "Tanpa Nama"}</h3>
                        <span className="rounded-full bg-slate-100 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-slate-500">
                          {a.demographics?.gender === "L" ? "Laki-laki" : "Perempuan"}
                        </span>
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm font-medium text-slate-500">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          {(() => {
                            const date = a.createdAt || a.header?.visitDate;
                            if (date && !isNaN(new Date(date).getTime())) {
                              return new Date(date).toLocaleDateString("id-ID", {
                                day: "numeric",
                                month: "short",
                                year: "numeric",
                              });
                            }
                            return <span className="text-amber-500 font-bold italic">Tanpa Tanggal</span>;
                          })()}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {a.demographics?.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          Pemeriksa: {a.examiner}
                        </div>
                        {a.nextVisit?.date && !isNaN(new Date(a.nextVisit.date).getTime()) && (
                          <div className="flex items-center gap-1 text-emerald-600 font-black">
                            <Calendar className="h-4 w-4" />
                            Kunjungan Berikutnya: {new Date(a.nextVisit.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 mt-3">
                        <span className="px-2 py-1 bg-slate-100 text-slate-500 rounded text-[10px] font-bold">
                          ID: {a.id ? String(a.id).slice(-6).toUpperCase() : 'UNKNOWN'}
                        </span>
                        {a.updatedAt && !isNaN(new Date(a.updatedAt).getTime()) && (
                          <span className="px-2 py-1 bg-amber-50 text-amber-600 rounded text-[10px] font-bold">
                            UPDATE: {new Date(a.updatedAt).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5">
                      <button 
                        onClick={() => setSelectedReminderPatient(a)}
                        className="flex items-center gap-1.5 rounded-xl bg-emerald-50 px-3.5 py-3 text-xs font-black text-emerald-700 hover:bg-emerald-100 transition-all border border-emerald-200 active:scale-95"
                        title="Lihat & Kirim Pengingat Pasien"
                      >
                        <Apple className="h-4 w-4 text-emerald-600" />
                        REMINDER
                      </button>
                      <button 
                        onClick={() => showProgress(a.demographics?.fullName, a.demographics?.phone)}
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-50 px-3.5 py-3 text-xs font-black text-indigo-600 hover:bg-indigo-100 transition-all active:scale-95"
                      >
                        <TrendingUp className="h-4 w-4" />
                        PROGRES
                      </button>
                      <button 
                        onClick={() => navigate("/assessment", { state: { patientData: a, isEditing: true } })}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-blue-600 px-4 py-3 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                      >
                        <ExternalLink className="h-4 w-4" />
                        EDIT DATA
                      </button>
                      <button 
                        onClick={() => navigate("/assessment", { state: { patientData: a, isNewVisit: true } })}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-100 px-4 py-3 text-xs font-black text-slate-700 hover:bg-slate-200 border border-slate-200 transition-all active:scale-95"
                      >
                        <Plus className="h-4 w-4" />
                        KUNJUNGAN BARU
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id, a.demographics?.fullName || 'Tanpa Nama', a.createdAt, a.examiner || 'Tidak Diketahui', a.updatedAt)}
                        className="rounded-xl bg-red-50 p-2.5 text-red-500 hover:bg-red-100 transition-all"
                        title="Hapus Rekam Medis"
                      >
                        <Trash2 className="h-4.5 w-4.5" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center rounded-[3rem] border-2 border-dashed border-slate-200 p-20 text-center">
                <div className="mb-6 rounded-full bg-slate-100 p-6 text-slate-300">
                  <Database className="h-12 w-12" />
                </div>
                <h3 className="text-xl font-bold text-slate-900">Database Kosong</h3>
                <p className="max-w-xs text-slate-500">Belum ada data pasien yang tersimpan. Silakan lakukan pemeriksaan baru untuk mengisi database.</p>
                <button 
                  onClick={() => navigate("/assessment", { state: { resetForm: true } })}
                  className="mt-8 rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all uppercase tracking-widest text-xs"
                >
                  Mulai Pemeriksaan Baru
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>
      </main>

      {/* Progress Modal */}
      <AnimatePresence>
        {selectedPatientHistory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPatient(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-3xl overflow-hidden rounded-[3rem] bg-white p-10 shadow-2xl"
            >
              <div className="mb-8 flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 tracking-tight">Grafik Perkembangan Pasien</h3>
                  <p className="text-sm font-bold text-slate-400 uppercase tracking-widest mt-1">Tren Kesehatan Gigi & Mulut</p>
                </div>
                <button 
                  onClick={() => setSelectedPatient(null)}
                  className="rounded-full bg-slate-100 p-3 text-slate-500 hover:bg-slate-200 transition-all"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={selectedPatientHistory}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fontWeight: 700, fill: '#64748b' }} />
                    <Tooltip 
                      contentStyle={{ borderRadius: '1.5rem', border: 'none', boxShadow: '0 20px 50px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="top" height={36}/>
                    <Line 
                      type="monotone" 
                      dataKey="ohis" 
                      name="Skor OHI-S" 
                      stroke="#2563eb" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#2563eb', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="plaque" 
                      name="Plaque Control (%)" 
                      stroke="#10b981" 
                      strokeWidth={4} 
                      dot={{ r: 6, fill: '#10b981', strokeWidth: 3, stroke: '#fff' }}
                      activeDot={{ r: 8, strokeWidth: 0 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div className="mt-8 grid grid-cols-2 gap-4">
                <div className="rounded-3xl bg-blue-50 p-6">
                  <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Status Terakhir OHI-S</p>
                  <p className="text-2xl font-black text-slate-900">
                    {selectedPatientHistory.length > 0 ? Number(selectedPatientHistory[selectedPatientHistory.length - 1].ohis || 0).toFixed(2) : "0.00"}
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-6">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status Terakhir Plak</p>
                  <p className="text-2xl font-black text-slate-900">
                    {selectedPatientHistory.length > 0 ? Number(selectedPatientHistory[selectedPatientHistory.length - 1].plaque || 0).toFixed(1) : "0.0"}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}

        {/* Patient Reminder & Recall Modal */}
        {selectedReminderPatient && (() => {
          const p = selectedReminderPatient;
          const fullName = p.demographics?.fullName || "Pasien";
          const phone = p.demographics?.phone || "";
          const visitDate = p.createdAt ? new Date(p.createdAt) : new Date();
          const nextRecall = new Date(visitDate);
          nextRecall.setMonth(nextRecall.getMonth() + 6);
          const now = new Date();
          const diffDays = Math.round((nextRecall.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
          const isDue = diffDays <= 0;
          const isUpcoming = diffDays > 0 && diffDays <= 30;

          return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setSelectedReminderPatient(null)}
                className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative w-full max-w-2xl overflow-hidden rounded-[2.5rem] bg-white p-8 md:p-10 shadow-2xl z-10"
              >
                <div className="mb-6 flex items-center justify-between border-b border-slate-100 pb-4">
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                      <Apple className="h-5 w-5" />
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-slate-900 tracking-tight">Pengingat Pasien & Recall 6 Bulan</h3>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">ASIDENT Care & Lifestyle Follow-Up</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedReminderPatient(null)}
                    className="rounded-full bg-slate-100 p-2.5 text-slate-500 hover:bg-slate-200 transition-all"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {/* Patient Info Card */}
                <div className="mb-6 rounded-2xl bg-slate-50 p-4 border border-slate-100 flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-black uppercase text-slate-400">Data Pasien</span>
                    <h4 className="text-base font-black text-slate-900">{fullName}</h4>
                    <p className="text-xs text-slate-500 font-semibold">{phone || "Nomor telepon belum tercatat"}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-black uppercase text-slate-400">Kunjungan Terakhir</span>
                    <p className="text-xs font-black text-slate-700">
                      {visitDate.toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                </div>

                {/* 6-Month Recall Status Banner */}
                <div className={cn(
                  "mb-6 rounded-2xl p-5 border-2 flex items-center justify-between",
                  isDue 
                    ? "bg-red-50 border-red-200 text-red-950" 
                    : isUpcoming 
                    ? "bg-amber-50 border-amber-200 text-amber-950"
                    : "bg-blue-50 border-blue-200 text-blue-950"
                )}>
                  <div>
                    <div className="text-[11px] font-black uppercase tracking-wider mb-1 opacity-80">
                      Jadwal Kontrol 6 Bulan Rutin
                    </div>
                    <div className="text-lg font-black">
                      {nextRecall.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
                    </div>
                    <p className="text-xs font-semibold mt-0.5 opacity-90">
                      {isDue 
                        ? "Waktunya kontrol rutin! Sudah melewati 6 bulan sejak pemeriksaan terakhir."
                        : isUpcoming 
                        ? `Mendekati jadwal kontrol (${diffDays} hari lagi). Disarankan segera follow-up pasien.`
                        : `Jadwal terkontrol (${diffDays} hari lagi).`}
                    </p>
                  </div>
                  <div className="h-10 w-10 rounded-xl bg-white/80 flex items-center justify-center shrink-0 shadow-sm">
                    {isDue ? <Clock className="h-5 w-5 text-red-600" /> : <Clock className="h-5 w-5 text-blue-600" />}
                  </div>
                </div>

                {/* Anjuran Edukasi Pasien */}
                <div className="mb-6 space-y-2.5">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                    Anjuran Penting untuk Pasien:
                  </span>
                  <div className="rounded-xl bg-emerald-50/80 p-3.5 border border-emerald-100 flex items-start gap-2.5 text-xs text-emerald-950">
                    <Apple className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
                    <span><strong>Perbanyak Buah & Sayur Berserat:</strong> Mengunyah apel, bengkuang, dan pir memicu air liur (saliva) dan membersihkan sisa plak secara alami (self-cleansing).</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
                    <span><strong>Sikat Gigi 2x Sehari:</strong> Pagi setelah sarapan & malam sebelum tidur dengan pasta fluoride.</span>
                  </div>
                  <div className="rounded-xl bg-slate-50 p-3 border border-slate-100 flex items-start gap-2.5 text-xs text-slate-700">
                    <CheckCircle2 className="h-4 w-4 text-purple-600 shrink-0 mt-0.5" />
                    <span><strong>Scaling 6 Bulan Sekali:</strong> Pembersihan karang gigi klinis untuk mencegah radang gusi dan gigi goyang.</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center gap-3 pt-4 border-t border-slate-100">
                  {phone ? (
                    <button
                      onClick={() => handleSendWhatsAppReminder(p)}
                      className="w-full sm:flex-1 flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-xs font-black text-white hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
                    >
                      <MessageSquare className="h-4 w-4" />
                      Kirim Reminder WhatsApp
                    </button>
                  ) : (
                    <div className="text-xs text-amber-600 font-bold bg-amber-50 p-2.5 rounded-xl border border-amber-200 w-full text-center">
                      Nomor HP pasien belum terdaftar untuk WhatsApp
                    </div>
                  )}
                  <button
                    onClick={() => handlePrintPatientReminder(p)}
                    className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-slate-900 px-6 py-3.5 text-xs font-black text-white hover:bg-slate-800 transition-all active:scale-95"
                  >
                    <Printer className="h-4 w-4" />
                    Cetak Lembar Pengingat
                  </button>
                </div>
              </motion.div>
            </div>
          );
        })()}
      </AnimatePresence>
    </div>
  );
}
