import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import { UserPlus, Trash2, ShieldCheck, Mail, Search, ChevronLeft, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function UserManagement({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [adminEmails, setAdminEmails] = useState<string[]>([]);
  const [newEmail, setNewEmail] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("asident_admin_emails") || '["rainandanabilatu@gmail.com"]');
    setAdminEmails(saved);
  }, []);

  const saveAdmins = (emails: string[]) => {
    setAdminEmails(emails);
    localStorage.setItem("asident_admin_emails", JSON.stringify(emails));
  };

  const addAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (newEmail && !adminEmails.includes(newEmail)) {
      const updated = [...adminEmails, newEmail];
      saveAdmins(updated);
      setNewEmail("");
    }
  };

  const removeAdmin = (email: string) => {
    if (email === "rainandanabilatu@gmail.com") {
      alert("Email admin utama tidak dapat dihapus.");
      return;
    }
    const updated = adminEmails.filter(e => e !== email);
    saveAdmins(updated);
  };

  const filteredEmails = adminEmails.filter(e => e.toLowerCase().includes(searchTerm.toLowerCase()));

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-slate-50 via-blue-50 to-indigo-100 p-8">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="rounded-full bg-white p-3 text-slate-500 shadow-sm hover:bg-slate-50 transition-all"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">Manajemen Akses</h1>
              <p className="text-slate-500 font-medium">Kelola email yang memiliki akses Admin/Pemeriksa</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-lg shadow-red-900/5 border border-white transition-all hover:bg-red-50 active:scale-90"
              title="Keluar"
            >
              <LogOut className="h-6 w-6" />
            </button>
            <div className="h-12 w-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-200">
              <ShieldCheck className="h-6 w-6" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Add Admin Form */}
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-1"
          >
            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white">
              <h3 className="mb-6 text-lg font-bold text-slate-900 flex items-center gap-2">
                <UserPlus className="h-5 w-5 text-blue-600" />
                Tambah Akses
              </h3>
              <form onSubmit={addAdmin} className="space-y-4">
                <div>
                  <label className="mb-2 block text-xs font-black uppercase tracking-widest text-slate-400">Alamat Email</label>
                  <div className="relative">
                    <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <input 
                      type="email" 
                      placeholder="contoh@email.com"
                      value={newEmail}
                      onChange={(e) => setNewEmail(e.target.value)}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-11 pr-4 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      required
                    />
                  </div>
                </div>
                <button 
                  type="submit"
                  className="w-full rounded-2xl bg-blue-600 py-4 text-sm font-black text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                >
                  Berikan Akses
                </button>
              </form>
            </div>
          </motion.div>

          {/* Admin List */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-2"
          >
            <div className="rounded-[2rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white min-h-[500px]">
              <div className="mb-8 flex items-center justify-between">
                <h3 className="text-lg font-bold text-slate-900">Daftar Admin Terdaftar</h3>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input 
                    type="text" 
                    placeholder="Cari email..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="rounded-full bg-slate-100 py-2 pl-10 pr-4 text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20 transition-all"
                  />
                </div>
              </div>

              <div className="space-y-3">
                {filteredEmails.map((email) => (
                  <div 
                    key={email}
                    className="group flex items-center justify-between rounded-2xl border border-slate-50 bg-slate-50/50 p-4 transition-all hover:bg-white hover:shadow-md hover:border-blue-100"
                  >
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-xl bg-blue-100 flex items-center justify-center text-blue-600 font-bold">
                        {email.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-900">{email}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-500">Administrator</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => removeAdmin(email)}
                      className="rounded-xl p-2 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </div>
                ))}
                {filteredEmails.length === 0 && (
                  <div className="py-20 text-center">
                    <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-slate-50 text-slate-300">
                      <Mail className="h-8 w-8" />
                    </div>
                    <p className="text-sm font-bold text-slate-400">Tidak ada email yang ditemukan.</p>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
