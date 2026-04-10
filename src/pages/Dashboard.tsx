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
  Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
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
  user: { name: string; role: string };
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

  useEffect(() => {
    const savedAssessments = JSON.parse(localStorage.getItem("asident_assessments") || "[]");
    const bills = JSON.parse(localStorage.getItem("asident_bills") || "[]");
    setAssessments(savedAssessments);
    
    // Unique patients count
    const uniquePatients = new Set(savedAssessments.map((a: any) => (a.demographics?.fullName || "") + (a.demographics?.phone || "")));
    setPatientCount(uniquePatients.size);

    // Total revenue
    const totalRevenue = bills.reduce((acc: number, b: any) => acc + (b.total || 0), 0);
    setRevenue(totalRevenue);

    // Gender Distribution
    const males = savedAssessments.filter((a: any) => a.demographics?.gender === "L").length;
    const females = savedAssessments.filter((a: any) => a.demographics?.gender === "P").length;
    setGenderData([
      { name: "Laki-laki", value: males, color: "#2563eb" },
      { name: "Perempuan", value: females, color: "#ec4899" }
    ]);

    // OHIS Distribution
    const good = savedAssessments.filter((a: any) => (a.ohis?.score || 0) <= 1.2).length;
    const moderate = savedAssessments.filter((a: any) => (a.ohis?.score || 0) > 1.2 && (a.ohis?.score || 0) <= 3.0).length;
    const poor = savedAssessments.filter((a: any) => (a.ohis?.score || 0) > 3.0).length;
    setOhisData([
      { name: "Baik", value: good, color: "#10b981" },
      { name: "Sedang", value: moderate, color: "#f59e0b" },
      { name: "Buruk", value: poor, color: "#ef4444" }
    ]);
  }, []);

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
    { label: "Janji Mendatang", value: "0", icon: Calendar, trend: "0" },
    { label: "Tagihan Aktif", value: "0", icon: CreditCard, trend: "Lunas" },
    { label: "Skor Kebersihan", value: "0%", icon: Activity, trend: "-" },
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
              onClick={() => item.path !== "#" && navigate(item.path)}
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
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">{user.role}</p>
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
                onClick={() => navigate("/assessment")}
                className="group flex items-center gap-3 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-5 font-black text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
              >
                <PlusCircle className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
                Pemeriksaan Baru
              </button>
            )}
          </div>

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
                onClick={() => item.path !== "#" && navigate(item.path)}
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
