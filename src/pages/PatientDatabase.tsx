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
  LogOut
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

  useEffect(() => {
    console.log("PatientDatabase: Fetching assessments...");
    const unsubscribe = onSnapshot(collection(db, "assessments"), (snapshot) => {
      console.log(`PatientDatabase: Received snapshot with ${snapshot.size} documents.`);
      const data: any[] = [];
      snapshot.forEach((doc) => {
        data.push({ id: doc.id, ...doc.data() });
      });
      // Sort by createdAt descending
      data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
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
          const teeth = Object.values(indexTeeth);
          const dValues = teeth.map(t => Number(a.ohis.debris[t as string] || 0));
          const cValues = teeth.map(t => Number(a.ohis.calculus[t as string] || 0));
          const di = dValues.reduce((a, b) => a + b, 0) / 6;
          const ci = cValues.reduce((a, b) => a + b, 0) / 6;
          ohisScore = Number((di + ci).toFixed(2));
        }

        let plaqueScore = a.plaqueControl?.score;
        if (plaqueScore === undefined && a.plaqueControl?.surfaces) {
          const surfaces = a.plaqueControl.surfaces || [];
          const totalPlak = surfaces.filter(Boolean).length;
          const totalSurfaces = 32 * 4;
          plaqueScore = Number(((totalPlak / totalSurfaces) * 100).toFixed(1));
        }

        return {
          date: new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          ohis: ohisScore || 0,
          plaque: plaqueScore || 0,
        };
      });
  }, [assessments, selectedPatient]);

  const showProgress = (fullName: string, phone: string) => {
    setSelectedPatient({ fullName, phone });
  };

  const handleDelete = async (id: string) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus data ini?")) {
      try {
        await deleteDoc(doc(db, "assessments", id));
      } catch (error) {
        console.error("Error deleting assessment:", error);
      }
    }
  };

  const filteredAssessments = assessments.filter(a => {
    const matchesSearch = 
      (a.demographics?.fullName || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (a.demographics?.phone || "").includes(searchTerm);
    return matchesSearch;
  });

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
                          {new Date(a.createdAt).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                        </div>
                        <div className="flex items-center gap-1">
                          <FileText className="h-4 w-4" />
                          {a.demographics?.phone}
                        </div>
                        <div className="flex items-center gap-1">
                          <Database className="h-4 w-4" />
                          Pemeriksa: {a.examiner}
                        </div>
                        {a.nextVisit?.date && (
                          <div className="flex items-center gap-1 text-emerald-600 font-black">
                            <Calendar className="h-4 w-4" />
                            Kunjungan Berikutnya: {new Date(a.nextVisit.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button 
                        onClick={() => showProgress(a.demographics?.fullName, a.demographics?.phone)}
                        className="flex items-center gap-2 rounded-xl bg-indigo-50 px-4 py-3 text-sm font-black text-indigo-600 hover:bg-indigo-100 transition-all"
                      >
                        <TrendingUp className="h-4 w-4" />
                        PROGRES
                      </button>
                      <button 
                        onClick={() => navigate("/assessment", { state: { patientData: a, isEditing: true } })}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-black text-white hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all active:scale-95"
                      >
                        <ExternalLink className="h-4 w-4" />
                        EDIT / LIHAT DATA
                      </button>
                      <button 
                        onClick={() => handleDelete(a.id)}
                        className="rounded-xl bg-red-50 p-2 text-red-500 hover:bg-red-100 transition-all"
                      >
                        <Trash2 className="h-5 w-5" />
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
                  onClick={() => navigate("/assessment")}
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
                    {selectedPatientHistory[selectedPatientHistory.length - 1]?.ohis.toFixed(2)}
                  </p>
                </div>
                <div className="rounded-3xl bg-emerald-50 p-6">
                  <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Status Terakhir Plak</p>
                  <p className="text-2xl font-black text-slate-900">
                    {selectedPatientHistory[selectedPatientHistory.length - 1]?.plaque}%
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
