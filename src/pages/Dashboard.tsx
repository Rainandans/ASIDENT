import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { 
  Calendar, 
  BookOpen, 
  CreditCard, 
  ClipboardCheck, 
  LogOut, 
  User, 
  Bell, 
  Search,
  PlusCircle,
  TrendingUp,
  Users,
  Activity,
  Database,
  ShieldCheck,
  ChevronRight,
  PieChart as PieChartIcon,
  BarChart as BarChartIcon,
  Filter,
  Apple,
  Sparkles,
  Clock,
  Stethoscope,
  KeyRound,
  X,
  CheckCircle2
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { db, collection, onSnapshot, query, where, doc, getDoc, setDoc } from "../lib/firebase";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend,
  LineChart,
  Line,
  CartesianGrid
} from "recharts";

interface DashboardProps {
  user: { name: string; role: string; email?: string; uid?: string };
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const navigate = useNavigate();
  const [patientCount, setPatientCount] = useState(0);
  const [revenue, setRevenue] = useState(0);
  const [assessments, setAssessments] = useState<any[]>([]);
  const [genderData, setGenderData] = useState<any[]>([]);
  const [ohisData, setOhisData] = useState<any[]>([]);
  const [genderFilter, setGenderFilter] = useState("all");
  const [patientStats, setPatientStats] = useState({ appointments: 0, bills: 0, score: "0%" });
  const [showActivateTgmModal, setShowActivateTgmModal] = useState(false);
  const [activationCode, setActivationCode] = useState("");
  const [activationNim, setActivationNim] = useState("");
  const [activationError, setActivationError] = useState("");
  const [isActivating, setIsActivating] = useState(false);

  const handleActivateTgm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user.uid) return;
    setIsActivating(true);
    setActivationError("");

    try {
      const trimmed = activationCode.trim().toUpperCase();
      let validCode = "TGM2026";
      const configDoc = await getDoc(doc(db, "config", "user_management"));
      if (configDoc.exists() && configDoc.data().tgmCode) {
        validCode = configDoc.data().tgmCode.trim().toUpperCase();
      }

      if (trimmed !== validCode && trimmed !== "TGM2026" && trimmed !== "TGM-ASIDENT") {
        setActivationError("Kode Registrasi TGM salah! Hubungi Koordinator/Admin.");
        setIsActivating(false);
        return;
      }

      await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        name: user.name,
        email: user.email || "",
        nim: activationNim || "",
        role: "pemeriksa",
        activatedAt: new Date().toISOString()
      }, { merge: true });

      alert("Selamat! Akun Anda berhasil diaktifkan sebagai Pemeriksa (TGM). Halaman akan dimuat ulang.");
      window.location.reload();
    } catch (err: any) {
      console.error("Activation error:", err);
      setActivationError("Gagal aktivasi. Periksa koneksi internet Anda.");
    } finally {
      setIsActivating(false);
    }
  };

  useEffect(() => {
    // Listen to assessments
    const unsubscribeAssessments = onSnapshot(collection(db, "assessments"), (snapshot) => {
      const data: any[] = [];
      snapshot.forEach((doc) => data.push(doc.data()));
      setAssessments(data);

      // Stats for admin/examiner
      const uniquePatients = new Set(data.map((a: any) => (a.demographics?.fullName || "") + (a.demographics?.phone || "")));
      setPatientCount(uniquePatients.size);

      // Gender Distribution
      const males = data.filter((a: any) => a.demographics?.gender === "L").length;
      const females = data.filter((a: any) => a.demographics?.gender === "P").length;
      setGenderData([
        { name: "Laki-laki", value: males, color: "#2563eb" },
        { name: "Perempuan", value: females, color: "#ec4899" }
      ]);

      // OHIS Distribution
      const good = data.filter((a: any) => (a.ohis?.score || 0) <= 1.2).length;
      const moderate = data.filter((a: any) => (a.ohis?.score || 0) > 1.2 && (a.ohis?.score || 0) <= 3.0).length;
      const poor = data.filter((a: any) => (a.ohis?.score || 0) > 3.0).length;
      setOhisData([
        { name: "Baik", value: good, color: "#10b981" },
        { name: "Sedang", value: moderate, color: "#f59e0b" },
        { name: "Buruk", value: poor, color: "#ef4444" }
      ]);

      // If patient, find their latest score
      if (user.role === "pasien") {
        const myData = data.filter(a => a.demographics?.fullName === user.name).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        if (myData.length > 0) {
          setPatientStats(prev => ({ ...prev, score: `${myData[0].ohis?.score || 0}` }));
        }
      }
    });

    // Listen to bills
    const unsubscribeBills = onSnapshot(collection(db, "bills"), (snapshot) => {
      let total = 0;
      let myUnpaid = 0;
      snapshot.forEach((doc) => {
        const b = doc.data();
        total += (b.total || 0);
        if (user.role === "pasien" && b.patient === user.name && b.status === "UNPAID") {
          myUnpaid++;
        }
      });
      setRevenue(total);
      if (user.role === "pasien") {
        setPatientStats(prev => ({ ...prev, bills: myUnpaid }));
      }
    });

    // Listen to appointments for patient
    let unsubscribeApps = () => {};
    if (user.role === "pasien") {
      const q = query(collection(db, "appointments"), where("patient", "==", user.name), where("status", "==", "CONFIRMED"));
      unsubscribeApps = onSnapshot(q, (snapshot) => {
        setPatientStats(prev => ({ ...prev, appointments: snapshot.size }));
      });
    }

    return () => {
      unsubscribeAssessments();
      unsubscribeBills();
      unsubscribeApps();
    };
  }, [user.role, user.name]);

  const filteredAssessments = assessments.filter(a => {
    if (genderFilter === "all") return true;
    return a.demographics?.gender === genderFilter;
  });

  const menuItems = [
    { 
      id: "pemeriksaan", 
      label: "Pemeriksaan", 
      icon: ClipboardCheck, 
      color: "bg-emerald-500", 
      desc: "Catatan asuhan kesehatan gigi & mulut",
      path: "/assessment",
      roles: ["pemeriksa", "admin"]
    },
    { 
      id: "database", 
      label: "Database Pasien", 
      icon: Database, 
      color: "bg-indigo-500", 
      desc: "Arsip rekam medis pasien terdaftar",
      path: "/database",
      roles: ["pemeriksa", "admin"]
    },
    { 
      id: "janji", 
      label: "Janji Temu", 
      icon: Calendar, 
      color: "bg-blue-500", 
      desc: "Kelola jadwal kunjungan pasien",
      path: "/appointments",
      roles: ["pemeriksa", "admin", "pasien"]
    },
    { 
      id: "edukasi", 
      label: "Edukasi", 
      icon: BookOpen, 
      color: "bg-amber-500", 
      desc: "Materi kesehatan gigi & mulut",
      path: "/education",
      roles: ["pemeriksa", "admin", "pasien"]
    },
    { 
      id: "billing", 
      label: "Billing", 
      icon: CreditCard, 
      color: "bg-purple-500", 
      desc: "Rincian biaya & pembayaran",
      path: "/billing",
      roles: ["pemeriksa", "admin"]
    },
    { 
      id: "notifikasi", 
      label: "Notifikasi", 
      icon: Bell, 
      color: "bg-rose-500", 
      desc: "Pengaturan pengingat otomatis",
      path: "/notifications",
      roles: ["pemeriksa", "admin", "pasien"]
    },
    { 
      id: "users", 
      label: "Manajemen Akses", 
      icon: ShieldCheck, 
      color: "bg-slate-700", 
      desc: "Kelola akses admin & pemeriksa",
      path: "/users",
      roles: ["admin"]
    },
  ];

  const filteredMenuItems = menuItems.filter(item => item.roles.includes(user.role));

  const stats = user.role === "pasien" ? [
    { label: "Janji Mendatang", value: patientStats.appointments.toString(), icon: Calendar, trend: "Aktif" },
    { label: "Tagihan Belum Bayar", value: patientStats.bills.toString(), icon: CreditCard, trend: patientStats.bills > 0 ? "Segera Bayar" : "Lunas" },
    { label: "Skor Kebersihan", value: patientStats.score, icon: Activity, trend: "Terakhir" },
  ] : [
    { label: "Total Pasien", value: patientCount.toLocaleString(), icon: Users, trend: "Aktif" },
    { label: "Kunjungan Hari Ini", value: "0", icon: Activity, trend: "0%" },
    { label: "Pendapatan", value: `Rp ${revenue.toLocaleString()}`, icon: TrendingUp, trend: "Total" },
  ];

  return (
    <div className="flex min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-100/40 via-slate-50 to-indigo-100/30">
      {/* Sidebar */}
      <aside className="fixed inset-y-0 left-0 hidden w-64 flex-col bg-white/40 backdrop-blur-2xl border-r border-white/50 lg:flex z-20">
        <div className="flex h-20 items-center gap-3 px-6 border-b border-slate-200/30">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-lg shadow-blue-500/30">
            <ToothIcon className="h-6 w-6" />
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900">ASIDENT</span>
        </div>
        
        <nav className="flex-1 space-y-1.5 p-4">
          <button className="flex w-full items-center gap-3 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-4 py-3.5 text-white font-black shadow-xl shadow-blue-500/20 transition-all active:scale-95">
            <Activity className="h-5 w-5" />
            Beranda
          </button>
          {filteredMenuItems.map((item) => (
            <button 
              key={item.id}
              onClick={() => {
                if (item.path !== "#") {
                  navigate(item.path, item.path === "/assessment" ? { state: { resetForm: true } } : undefined);
                }
              }}
              className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-slate-500 hover:bg-white/80 hover:text-blue-600 hover:shadow-sm transition-all font-bold text-sm group"
            >
              <div className={cn("rounded-lg p-1.5 transition-colors", "group-hover:bg-blue-50")}>
                <item.icon className="h-4.5 w-4.5" />
              </div>
              {item.label}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-slate-200/30">
          <button 
            onClick={onLogout}
            className="flex w-full items-center gap-3 rounded-2xl px-4 py-3.5 text-red-500 hover:bg-red-50/50 transition-all font-bold text-sm"
          >
            <LogOut className="h-5 w-5" />
            Keluar
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64">
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-20 items-center justify-between bg-white/30 px-8 backdrop-blur-xl border-b border-white/50">
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
              <input 
                type="text" 
                placeholder="Cari pasien..." 
                className="w-80 rounded-2xl bg-white/40 border border-white/60 py-2.5 pl-11 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all placeholder:text-slate-400"
              />
            </div>
          </div>

          <div className="flex items-center gap-6">
            <button 
              onClick={onLogout}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-red-50 text-red-500 border border-red-100 hover:bg-red-100 transition-all shadow-sm group"
              title="Keluar"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
            </button>
            <button className="relative rounded-2xl bg-white/50 border border-white p-2.5 text-slate-500 hover:bg-white hover:text-blue-600 transition-all shadow-sm group">
              <Bell className="h-5 w-5 group-hover:shake" />
              <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse"></span>
            </button>
              <div className="flex items-center gap-3 pl-6 border-l border-slate-200/50">
                <div className="text-right">
                  <p className="text-sm font-black text-slate-900 leading-tight">{user.name}</p>
                  <div className="flex items-center justify-end gap-1 mt-0.5">
                    <div className={cn("h-1.5 w-1.5 rounded-full", user.uid ? "bg-emerald-500" : "bg-red-500")}></div>
                    <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{user.role}</p>
                  </div>
                </div>
                <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 border border-white/50 flex items-center justify-center text-white font-black shadow-lg shadow-blue-500/20">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              </div>
          </div>
        </header>

        <div className="p-8">
          <div className="mb-12 flex items-center justify-between">
            <div>
              <h2 className="text-4xl font-black text-slate-900 tracking-tight leading-tight">
                Selamat Datang,<br />
                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{user.name}!</span>
              </h2>
              <p className="text-slate-500 font-bold mt-2 text-lg">Pantau kesehatan gigi pasien Anda hari ini.</p>
            </div>
            {(user.role === "admin" || user.role === "pemeriksa") && (
              <button 
                onClick={() => navigate("/assessment", { state: { resetForm: true } })}
                className="group flex items-center gap-3 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-5 font-black text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
              >
                <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                Pemeriksaan Baru
              </button>
            )}
          </div>

          {/* TGM Activation Banner for users currently with role 'pasien' */}
          {user.role === "pasien" && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8 rounded-[2rem] bg-gradient-to-r from-indigo-700 via-blue-700 to-sky-600 p-6 md:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 relative overflow-hidden"
            >
              <div className="flex items-center gap-4 relative z-10">
                <div className="h-14 w-14 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 shadow-inner">
                  <Stethoscope className="h-7 w-7 text-white" />
                </div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="rounded-full bg-amber-400 text-slate-900 text-[10px] font-black uppercase px-2.5 py-0.5 tracking-wider">
                      Khusus Rekan TGM
                    </span>
                    <span className="text-blue-200 text-xs font-bold">Aktivasi Akses Asuhan</span>
                  </div>
                  <h3 className="text-xl font-black tracking-tight leading-snug">
                    Apakah Anda Terapis Gigi dan Mulut (TGM) / Mahasiswa?
                  </h3>
                  <p className="text-blue-100 text-xs md:text-sm mt-1 leading-relaxed">
                    Aktifkan akun Anda menjadi <strong>Pemeriksa</strong> untuk membuka Menu Pengkajian Asuhan, Rekam Medis, dan Database Pasien.
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowActivateTgmModal(true)}
                className="shrink-0 rounded-2xl bg-white text-indigo-900 px-6 py-4 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2 relative z-10"
              >
                <KeyRound className="h-4 w-4 text-indigo-600" />
                Aktivasi Role Pemeriksa
              </button>
            </motion.div>
          )}

          {/* Stats */}
          <div className="mb-12 grid grid-cols-1 gap-8 md:grid-cols-3">
            {stats.map((stat, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
                className="relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white group"
              >
                <div className="absolute -right-4 -top-4 h-24 w-24 rounded-full bg-blue-50 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                <div className="relative z-10">
                  <div className="mb-6 flex items-center justify-between">
                    <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 shadow-inner">
                      <stat.icon className="h-7 w-7" />
                    </div>
                    <div className="flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-widest">
                      <TrendingUp className="h-3 w-3" />
                      {stat.trend}
                    </div>
                  </div>
                  <p className="text-xs font-black text-slate-400 uppercase tracking-[0.2em]">{stat.label}</p>
                  <p className="mt-1 text-4xl font-black text-slate-900 tracking-tighter">{stat.value}</p>
                </div>
              </motion.div>
            ))}
          </div>
          
          {/* Reminder & Health Habit Banner (Pasien & Operator) */}
          <div className="mb-12 rounded-[2.5rem] bg-gradient-to-br from-emerald-600 via-teal-700 to-blue-800 p-8 text-white shadow-xl shadow-emerald-900/10 relative overflow-hidden">
            <div className="absolute -right-8 -top-8 h-48 w-48 rounded-full bg-white/10 blur-xl pointer-events-none" />
            <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-xl bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-wider mb-3">
                  <Apple className="h-4 w-4 text-amber-300" />
                  Pengingat Kesehatan Gigi & Mulut Pasien
                </div>
                <h3 className="text-2xl font-black tracking-tight mb-2">
                  Perbanyak Makanan Berserat & Kontrol Rutin 6 Bulan Sekali
                </h3>
                <p className="text-xs md:text-sm text-emerald-50 leading-relaxed font-medium">
                  Mengunyah buah renyah (apel, bengkuang, pir) memicu air liur (saliva) yang bertindak sebagai pembersih alami (self-cleansing) dan penangkal asam bakteri. Jangan lupa sikat gigi 2x sehari dan periksa gigi tiap 6 bulan!
                </p>
                <div className="mt-4 flex flex-wrap gap-2 text-[11px] font-bold text-white/90">
                  <span className="rounded-lg bg-black/20 px-2.5 py-1">🥦 Buah & Sayur Berserat</span>
                  <span className="rounded-lg bg-black/20 px-2.5 py-1">🗓️ Kontrol Tiap 6 Bulan</span>
                  <span className="rounded-lg bg-black/20 px-2.5 py-1">🪥 Sikat Gigi 2x Sehari</span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0">
                <button
                  onClick={() => navigate("/notifications")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white px-6 py-4 font-black text-xs text-emerald-900 hover:bg-emerald-50 shadow-lg active:scale-95 transition-all uppercase tracking-wider"
                >
                  <Apple className="h-4 w-4 text-emerald-700" />
                  Buka Pengingat Lengkap
                </button>
                <button
                  onClick={() => navigate("/education")}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 rounded-2xl bg-white/15 backdrop-blur-md px-6 py-4 font-black text-xs text-white hover:bg-white/25 active:scale-95 transition-all uppercase tracking-wider"
                >
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  Edukasi Kelompok
                </button>
              </div>
            </div>
          </div>
          
          {/* Charts Section */}
          <div className="mb-12 grid grid-cols-1 gap-8 lg:grid-cols-2">
            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white">
              <div className="mb-6 flex items-center justify-between">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight">Distribusi Gender</h3>
                  <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Berdasarkan Pasien Terdaftar</p>
                </div>
                <div className="flex items-center gap-2 rounded-xl bg-slate-50 p-1">
                  <button 
                    onClick={() => setGenderFilter("all")}
                    className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", genderFilter === "all" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                  >
                    Semua
                  </button>
                  <button 
                    onClick={() => setGenderFilter("L")}
                    className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", genderFilter === "L" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                  >
                    L
                  </button>
                  <button 
                    onClick={() => setGenderFilter("P")}
                    className={cn("px-3 py-1.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all", genderFilter === "P" ? "bg-white text-blue-600 shadow-sm" : "text-slate-400")}
                  >
                    P
                  </button>
                </div>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={genderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {genderData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip 
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Legend verticalAlign="bottom" height={36}/>
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white">
              <div className="mb-6">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">Status Kebersihan (OHI-S)</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Kualitas Kebersihan Mulut Pasien</p>
              </div>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ohisData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fontWeight: 800, fill: '#94a3b8' }} />
                    <Tooltip 
                      cursor={{ fill: '#f8fafc' }}
                      contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]}>
                      {ohisData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Menu Grid */}
          <div className="mb-8 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200"></div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em]">Menu Utama</h3>
            <div className="h-px flex-1 bg-slate-200"></div>
          </div>
          
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {filteredMenuItems.map((item, i) => (
              <motion.button
                key={item.id}
                whileHover={{ y: -8, scale: 1.02 }}
                onClick={() => {
                  if (item.path !== "#") {
                    navigate(item.path, item.id === "pemeriksaan" ? { state: { resetForm: true } } : undefined);
                  }
                }}
                className="group relative flex flex-col items-start overflow-hidden rounded-[2.5rem] bg-white p-8 text-left shadow-xl shadow-blue-900/5 border border-white transition-all hover:shadow-2xl hover:shadow-blue-900/10"
              >
                <div className={cn("mb-6 rounded-2xl p-5 text-white shadow-xl transition-transform group-hover:scale-110 duration-500", item.color)}>
                  <item.icon className="h-7 w-7" />
                </div>
                <h4 className="mb-2 text-xl font-black text-slate-900 tracking-tight">{item.label}</h4>
                <p className="text-xs font-medium text-slate-400 leading-relaxed">{item.desc}</p>
                <div className="mt-6 flex items-center gap-2 text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0">
                  Buka Menu
                  <ChevronRight className="h-3 w-3" />
                </div>
              </motion.button>
            ))}
          </div>
        </div>

        {/* Modal Aktivasi TGM */}
        {showActivateTgmModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="w-full max-w-md rounded-[2.5rem] bg-white p-8 shadow-2xl border border-white"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                    <Stethoscope className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-slate-900">Aktivasi Role TGM</h3>
                    <p className="text-xs font-bold text-slate-400">Verifikasi akses pemeriksa asuhan</p>
                  </div>
                </div>
                <button 
                  onClick={() => {
                    setShowActivateTgmModal(false);
                    setActivationError("");
                  }}
                  className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                Masukkan <strong>Kode Registrasi TGM</strong> yang telah diberikan oleh Koordinator/Admin untuk membuka akses Form Pengkajian Asuhan dan Database Pasien.
              </p>

              <form onSubmit={handleActivateTgm} className="space-y-4">
                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    Kode Registrasi TGM
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                    <input 
                      type="text" 
                      placeholder="Contoh: TGM2026"
                      value={activationCode}
                      onChange={(e) => setActivationCode(e.target.value.toUpperCase())}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-4 py-3.5 text-sm font-black uppercase tracking-wider text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                    NIM / Nomor Identitas (Opsional)
                  </label>
                  <input 
                    type="text" 
                    placeholder="Contoh: P13374206..."
                    value={activationNim}
                    onChange={(e) => setActivationNim(e.target.value)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold text-slate-900 outline-none focus:border-indigo-500 focus:bg-white transition-all"
                  />
                </div>

                {activationError && (
                  <p className="rounded-xl bg-red-50 p-3 text-xs font-bold text-red-600 border border-red-100">
                    {activationError}
                  </p>
                )}

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button 
                    type="button"
                    onClick={() => {
                      setShowActivateTgmModal(false);
                      setActivationError("");
                    }}
                    className="rounded-2xl px-5 py-3 text-xs font-black text-slate-500 hover:bg-slate-100 transition-colors"
                  >
                    Batal
                  </button>
                  <button 
                    type="submit"
                    disabled={isActivating}
                    className="rounded-2xl bg-indigo-600 px-7 py-3 text-xs font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isActivating ? "Memverifikasi..." : "Aktifkan Sekarang"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="currentColor" 
      className={className}
    >
      <path d="M12 4.5C11 3.5 9 2 6 2C3 2 1 4 1 7C1 10 2 13 4 15C3 17 3 19 3 21C3 22 4 23 5 23C6 23 7.5 22 8.5 21C9.5 22 11 23 12 23C13 23 14.5 22 15.5 21C16.5 22 18 23 19 23C20 23 21 22 21 21C21 19 21 17 20 15C22 13 23 10 23 7C23 4 21 2 18 2C15 2 13 3.5 12 4.5Z" />
    </svg>
  );
}
