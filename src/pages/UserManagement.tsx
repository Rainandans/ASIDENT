import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  UserPlus, 
  Trash2, 
  ShieldCheck, 
  Mail, 
  Search, 
  ChevronLeft, 
  LogOut, 
  Stethoscope, 
  KeyRound, 
  Copy, 
  Check, 
  Share2, 
  Users, 
  CheckCircle2, 
  Sparkles, 
  RefreshCw,
  FileText,
  AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";
import { db, doc, onSnapshot, setDoc, collection, getDocs, deleteDoc } from "../lib/firebase";

interface RegisteredUser {
  id: string;
  name?: string;
  email?: string;
  role?: string;
  nim?: string;
  phone?: string;
  registeredAt?: string;
}

export default function UserManagement({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [examinerEmails, setExaminerEmails] = useState<string[]>([]);
  const [tgmCode, setTgmCode] = useState("TGM2026");
  const [openExaminerAccess, setOpenExaminerAccess] = useState(false);
  
  // Registration and bulk states
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<"admin" | "pemeriksa">("pemeriksa");
  const [bulkEmailsText, setBulkEmailsText] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "pemeriksa" | "admin">("all");
  
  // TGM self-registered accounts from Firestore
  const [registeredUsers, setRegisteredUsers] = useState<RegisteredUser[]>([]);
  const [isCopied, setIsCopied] = useState(false);
  const [isSavingCode, setIsSavingCode] = useState(false);
  const [feedbackMsg, setFeedbackMsg] = useState("");

  // Listen to config/user_management
  useEffect(() => {
    const unsubscribe = onSnapshot(doc(db, "config", "user_management"), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setAdminEmails(data.adminEmails || ["rainandanabilatu@gmail.com"]);
        setExaminerEmails(data.examinerEmails || []);
        if (data.tgmCode) setTgmCode(data.tgmCode);
        if (data.openExaminerAccess !== undefined) setOpenExaminerAccess(data.openExaminerAccess);
      } else {
        const initial = { 
          adminEmails: ["rainandanabilatu@gmail.com"], 
          examinerEmails: [],
          tgmCode: "TGM2026",
          openExaminerAccess: false
        };
        setDoc(doc(db, "config", "user_management"), initial);
        setAdminEmails(initial.adminEmails);
        setExaminerEmails(initial.examinerEmails);
      }
    });

    // Also fetch self-registered users from /users collection
    const fetchUsers = async () => {
      try {
        const querySnapshot = await getDocs(collection(db, "users"));
        const list: RegisteredUser[] = [];
        querySnapshot.forEach((d) => {
          list.push({ id: d.id, ...d.data() });
        });
        setRegisteredUsers(list);
      } catch (err) {
        console.error("Error fetching registered users list:", err);
      }
    };

    fetchUsers();

    return () => unsubscribe();
  }, []);

  const saveConfig = async (
    admins: string[], 
    examiners: string[], 
    customCode?: string, 
    customOpenAccess?: boolean
  ) => {
    try {
      await setDoc(doc(db, "config", "user_management"), {
        adminEmails: admins,
        examinerEmails: examiners,
        tgmCode: customCode !== undefined ? customCode : tgmCode,
        openExaminerAccess: customOpenAccess !== undefined ? customOpenAccess : openExaminerAccess
      });
      showNotification("Pengaturan berhasil disimpan!");
    } catch (error) {
      console.error("Error saving config:", error);
      alert("Gagal menyimpan konfigurasi.");
    }
  };

  const showNotification = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(""), 4000);
  };

  const handleSaveTgmCode = async () => {
    if (!tgmCode.trim()) {
      alert("Kode Registrasi TGM tidak boleh kosong.");
      return;
    }
    setIsSavingCode(true);
    await saveConfig(adminEmails, examinerEmails, tgmCode.trim().toUpperCase(), openExaminerAccess);
    setIsSavingCode(false);
  };

  const handleToggleOpenAccess = async (newVal: boolean) => {
    setOpenExaminerAccess(newVal);
    await saveConfig(adminEmails, examinerEmails, tgmCode, newVal);
  };

  const addUser = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = newEmail.trim().toLowerCase();
    if (!clean) return;

    if (newRole === "admin") {
      if (!adminEmails.includes(clean)) {
        saveConfig([...adminEmails, clean], examinerEmails);
      }
    } else {
      if (!examinerEmails.includes(clean)) {
        saveConfig(adminEmails, [...examinerEmails, clean]);
      }
    }
    setNewEmail("");
    showNotification(`Akses ${newRole} untuk ${clean} berhasil ditambahkan!`);
  };

  const handleBulkAdd = () => {
    if (!bulkEmailsText.trim()) return;
    
    // Split by comma, newline, or space
    const emails = bulkEmailsText
      .split(/[\n,; ]+/)
      .map(e => e.trim().toLowerCase())
      .filter(e => e.includes("@") && e.includes("."));

    if (emails.length === 0) {
      alert("Tidak ada alamat email valid yang terdeteksi.");
      return;
    }

    const uniqueNew = emails.filter(e => !examinerEmails.includes(e) && !adminEmails.includes(e));
    const updatedExaminers = Array.from(new Set([...examinerEmails, ...uniqueNew]));

    saveConfig(adminEmails, updatedExaminers);
    setBulkEmailsText("");
    showNotification(`${uniqueNew.length} email rekan TGM berhasil ditambahkan sebagai Pemeriksa!`);
  };

  const removeUser = (email: string, role: "admin" | "pemeriksa") => {
    if (email === "rainandanabilatu@gmail.com") {
      alert("Email admin utama tidak dapat dihapus.");
      return;
    }

    if (confirm(`Yakin ingin mencabut akses ${role} untuk ${email}?`)) {
      if (role === "admin") {
        saveConfig(adminEmails.filter(e => e !== email), examinerEmails);
      } else {
        saveConfig(adminEmails, examinerEmails.filter(e => e !== email));
      }
      showNotification(`Akses untuk ${email} telah dicabut.`);
    }
  };

  const handleCopyWhatsappInvite = () => {
    const appUrl = window.location.origin + window.location.pathname;
    const inviteMessage = `📢 *AKSES APLIKASI ASIDENT UNTUK PRAKTIK TGM* 🦷\n\nHalo rekan-rekan Terapis Gigi dan Mulut (TGM),\nBerikut adalah link aplikasi ASIDENT untuk pengisian pengkajian dan asuhan kesehatan gigi & mulut:\n\n🔗 *Link Aplikasi:* ${appUrl}\n\n🔑 *KODE REGISTRASI TGM:* *${tgmCode || "TGM2026"}*\n\n📌 *Langkah Mudah Login/Daftar:*\n1. Buka tautan di atas melalui browser Chrome di HP / Laptop Anda.\n2. Klik *"Daftar"* (atau *"Masuk dengan Google"*).\n3. Centang opsi *"Daftar sebagai Pemeriksa / TGM"*.\n4. Masukkan Nama Lengkap, NIM, dan Kode Registrasi: *${tgmCode || "TGM2026"}*.\n5. Selesai! Akun langsung aktif sebagai *Pemeriksa* untuk mengisi Form Pengkajian Asuhan dan Rekam Medis Pasien.\n\n_Catatan: Sistem berbasis cloud dan aman dibuka oleh 50 rekan secara bersamaan tanpa bentrok data._`;

    navigator.clipboard.writeText(inviteMessage);
    setIsCopied(true);
    showNotification("Format undangan WhatsApp berhasil disalin!");
    setTimeout(() => setIsCopied(false), 3000);
  };

  // Merge config emails and Firestore registered users
  const allUserMap = new Map<string, { email: string; role: "admin" | "pemeriksa"; name?: string; nim?: string; isSelfRegistered?: boolean }>();

  // From config
  adminEmails.forEach(email => {
    allUserMap.set(email.toLowerCase(), { email, role: "admin" });
  });

  examinerEmails.forEach(email => {
    allUserMap.set(email.toLowerCase(), { email, role: "pemeriksa" });
  });

  // From Firestore registered users
  registeredUsers.forEach(u => {
    if (u.email) {
      const emailLower = u.email.toLowerCase();
      const existing = allUserMap.get(emailLower);
      allUserMap.set(emailLower, {
        email: u.email,
        role: existing?.role || (u.role === "admin" ? "admin" : "pemeriksa"),
        name: u.name,
        nim: u.nim,
        isSelfRegistered: true
      });
    }
  });

  const mergedUserList = Array.from(allUserMap.values());

  const filteredUsers = mergedUserList.filter(u => {
    const matchesSearch = u.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (u.name && u.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
                          (u.nim && u.nim.toLowerCase().includes(searchTerm.toLowerCase()));
    if (!matchesSearch) return false;
    if (activeTab === "all") return true;
    return u.role === activeTab;
  });

  const totalExaminers = mergedUserList.filter(u => u.role === "pemeriksa").length;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-100 p-4 md:p-8">
      <div className="mx-auto max-w-6xl">
        {/* Top Header */}
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="rounded-full bg-white p-3 text-slate-500 shadow-sm hover:bg-slate-50 transition-all active:scale-95"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Manajemen Akses & 50 TGM</h1>
                <span className="rounded-full bg-emerald-100 px-3 py-0.5 text-xs font-black text-emerald-700">
                  {totalExaminers} Pemeriksa Aktif
                </span>
              </div>
              <p className="text-slate-500 text-sm font-medium">
                Atur kode registrasi massal & kelola izin rekan TGM untuk mengisi asuhan
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            <button 
              onClick={handleCopyWhatsappInvite}
              className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 px-5 py-3 text-xs md:text-sm font-black text-white shadow-lg shadow-emerald-600/20 hover:from-emerald-700 hover:to-teal-700 transition-all active:scale-95"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Share2 className="h-4 w-4" />}
              {isCopied ? "Tersalin ke Clipboard!" : "Salin Pesan WhatsApp 50 TGM"}
            </button>
            <button 
              onClick={onLogout}
              className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500 shadow-md border border-white transition-all hover:bg-red-50 active:scale-90"
              title="Keluar"
            >
              <LogOut className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Feedback Alert */}
        <AnimatePresence>
          {feedbackMsg && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-6 flex items-center gap-3 rounded-2xl bg-emerald-500 p-4 text-white shadow-lg font-bold text-sm"
            >
              <CheckCircle2 className="h-5 w-5 shrink-0" />
              <span>{feedbackMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Quick Answer Banner: 50 TGM Safety & Independence */}
        <div className="mb-8 rounded-[2rem] bg-gradient-to-r from-blue-900 via-indigo-900 to-slate-900 p-6 md:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 top-0 -mt-6 -mr-6 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-wider text-blue-300 mb-3 border border-blue-400/30">
                <ShieldCheck className="h-3.5 w-3.5" />
                Jawaban Pertanyaan Anda Seputar 50 TGM
              </div>
              <h2 className="text-xl md:text-2xl font-black tracking-tight leading-snug">
                Sistem Aman & Tidak Akan Error / Tabrakan Data Saat Dibuka 50 Orang Bersamaan
              </h2>
              <p className="mt-2 text-xs md:text-sm text-slate-300 leading-relaxed font-normal">
                1. <strong>Database Serverless Google Cloud</strong>: Setiap pengisian rekam medis disimpan sebagai dokumen independen dengan ID unik. 50 TGM bisa memeriksa 50 pasien sekaligus tanpa saling menimpa.<br />
                2. <strong>Akun Mandiri vs 1 Akun Bersama</strong>: Sangat dianjurkan setiap TGM mendaftar akun masing-masing dengan <strong>Kode Registrasi</strong> di bawah agar nama dan NIM mereka tercatat resmi di lembar pemeriksaan.
              </p>
            </div>
            <button 
              onClick={handleCopyWhatsappInvite}
              className="shrink-0 rounded-2xl bg-white text-slate-900 px-6 py-4 font-black text-xs uppercase tracking-wider shadow-lg hover:bg-blue-50 active:scale-95 transition-all flex items-center gap-2"
            >
              <Copy className="h-4 w-4 text-blue-600" />
              Bagi Link & Kode Sekarang
            </button>
          </div>
        </div>

        {/* Top Control Grid: TGM Registration Code + Bulk Email Add */}
        <div className="mb-8 grid grid-cols-1 gap-6 lg:grid-cols-2">
          
          {/* Card 1: Setup Kode Registrasi TGM */}
          <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-white">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2.5">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <KeyRound className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Kode Registrasi TGM</h3>
                  <p className="text-[11px] text-slate-400 font-bold">Kode aktivasi otomatis role Pemeriksa</p>
                </div>
              </div>
              <span className="rounded-full bg-blue-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-blue-600">
                Otomatisasi
              </span>
            </div>

            <p className="text-xs text-slate-600 mb-5 leading-relaxed">
              Sebarkan kode ini ke 50 rekan TGM. Saat mereka mendaftar mandiri di aplikasi dan memasukkan kode ini, akun mereka <strong>langsung aktif sebagai Pemeriksa</strong> tanpa Anda perlu mengurus satu per satu.
            </p>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">
                  Kode Akses Saat Ini
                </label>
                <div className="flex gap-2">
                  <input 
                    type="text" 
                    value={tgmCode}
                    onChange={(e) => setTgmCode(e.target.value.toUpperCase())}
                    placeholder="Contoh: TGM2026"
                    className="flex-1 rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-base font-black text-indigo-900 outline-none focus:border-indigo-500 uppercase tracking-wider"
                  />
                  <button 
                    onClick={handleSaveTgmCode}
                    disabled={isSavingCode}
                    className="rounded-2xl bg-indigo-600 px-6 py-3.5 text-xs font-black text-white shadow-lg shadow-indigo-200 hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-50"
                  >
                    {isSavingCode ? "Menyimpan..." : "Simpan Kode"}
                  </button>
                </div>
              </div>

              {/* Direct Open Access Switch */}
              <div className="rounded-2xl border border-slate-100 bg-slate-50 p-4">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-slate-900 block">Buka Akses Pemeriksa Otomatis</span>
                    <span className="text-[11px] text-slate-500">
                      Jika aktif, siapa pun yang mendaftar atau login langsung menjadi Pemeriksa tanpa perlu input kode.
                    </span>
                  </div>
                  <input 
                    type="checkbox"
                    checked={openExaminerAccess}
                    onChange={(e) => handleToggleOpenAccess(e.target.checked)}
                    className="h-5 w-5 rounded text-indigo-600 focus:ring-indigo-500 border-slate-300 ml-4 shrink-0"
                  />
                </label>
              </div>
            </div>
          </div>

          {/* Card 2: Bulk Add Emails */}
          <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-white flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="h-10 w-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                    <Users className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="text-base font-black text-slate-900">Tambah Massal Email 50 TGM</h3>
                    <p className="text-[11px] text-slate-400 font-bold">Salin & tempel daftar email sekaligus</p>
                  </div>
                </div>
                <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-wider text-emerald-600">
                  Bulk Add
                </span>
              </div>

              <p className="text-xs text-slate-600 mb-4 leading-relaxed">
                Punya daftar 50 email di Excel / WhatsApp? Tempel di bawah ini (pisahkan dengan koma atau baris baru) untuk mendaftarkan semuanya sekaligus sebagai Pemeriksa.
              </p>

              <textarea 
                rows={3}
                placeholder="Contoh:&#10;tgm1@gmail.com, tgm2@gmail.com, tgm3@gmail.com"
                value={bulkEmailsText}
                onChange={(e) => setBulkEmailsText(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-3.5 text-xs font-mono font-bold text-slate-800 outline-none focus:border-blue-500 transition-all resize-none"
              ></textarea>
            </div>

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className="text-[11px] font-bold text-slate-400">
                Akan ditambahkan sebagai: <strong>Pemeriksa (TGM)</strong>
              </span>
              <button 
                onClick={handleBulkAdd}
                className="rounded-2xl bg-blue-600 px-6 py-3 text-xs font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 active:scale-95 transition-all"
              >
                Tambahkan Email Sekaligus
              </button>
            </div>
          </div>
        </div>

        {/* Main Section: Single Add Form & List */}
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Single User */}
          <div className="lg:col-span-1">
            <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-white">
              <h3 className="mb-6 text-base font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Tambah Akses Satuan
              </h3>
              <form onSubmit={addUser} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="contoh@email.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-11 pr-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Peran / Role</label>
                  <select 
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value as any)}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-4 py-3.5 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                  >
                    <option value="pemeriksa">Pemeriksa (TGM / Mahasiswa)</option>
                    <option value="admin">Administrator (Akses Penuh)</option>
                  </select>
                </div>
                <button 
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Berikan Akses
                </button>
              </form>
            </div>
          </div>

          {/* User List */}
          <div className="lg:col-span-2">
            <div className="rounded-[2rem] bg-white p-6 md:p-8 shadow-xl shadow-blue-900/5 border border-white min-h-[500px]">
              <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-base font-bold text-slate-900">Daftar Pengguna & TGM Terdaftar</h3>
                  <p className="text-xs text-slate-400">Total {mergedUserList.length} akun dengan akses di sistem</p>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari email / nama / NIM..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-full bg-slate-100 py-2 pl-9 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all w-52 md:w-64"
                  />
                </div>
              </div>

              {/* Filter Tabs */}
              <div className="mb-4 flex items-center gap-2 border-b border-slate-100 pb-3">
                <button 
                  onClick={() => setActiveTab("all")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-black transition-all",
                    activeTab === "all" ? "bg-slate-900 text-white" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  Semua ({mergedUserList.length})
                </button>
                <button 
                  onClick={() => setActiveTab("pemeriksa")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-black transition-all",
                    activeTab === "pemeriksa" ? "bg-indigo-600 text-white" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  Pemeriksa / TGM ({totalExaminers})
                </button>
                <button 
                  onClick={() => setActiveTab("admin")}
                  className={cn(
                    "rounded-xl px-3 py-1.5 text-xs font-black transition-all",
                    activeTab === "admin" ? "bg-blue-600 text-white" : "text-slate-500 hover:bg-slate-100"
                  )}
                >
                  Admin ({adminEmails.length})
                </button>
              </div>

              {/* List */}
              <div className="space-y-3">
                {filteredUsers.map((u) => (
                  <div 
                    key={u.email}
                    className="group flex items-center justify-between rounded-2xl border border-slate-100 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-blue-100"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={cn(
                        "h-10 w-10 rounded-xl flex items-center justify-center font-bold shrink-0",
                        u.role === "admin" ? "bg-blue-100 text-blue-600" : "bg-indigo-100 text-indigo-600"
                      )}>
                        {u.role === "admin" ? <ShieldCheck className="h-5 w-5" /> : <Stethoscope className="h-5 w-5" />}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="text-sm font-black text-slate-900">{u.name || u.email}</p>
                          {u.nim && (
                            <span className="rounded-md bg-slate-200/80 px-2 py-0.5 text-[10px] font-mono font-bold text-slate-700">
                              NIM: {u.nim}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5">
                          <p className="text-xs text-slate-500">{u.email}</p>
                          <span className={cn(
                            "text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full",
                            u.role === "admin" ? "bg-blue-50 text-blue-600" : "bg-indigo-50 text-indigo-600"
                          )}>
                            {u.role === "admin" ? "Administrator" : "Pemeriksa (TGM)"}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {u.email !== "rainandanabilatu@gmail.com" && (
                        <button 
                          onClick={() => removeUser(u.email, u.role)}
                          className="rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                          title="Cabut Akses"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {filteredUsers.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <Mail className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Tidak ada pengguna yang sesuai.</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
