import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronLeft, Plus, X, CheckCircle2, Edit3, Trash2, Printer, Search, Clock, User, Stethoscope, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

interface Appointment {
  id: number;
  patient: string;
  date: string;
  time: string;
  type: string;
  status: "PENDING" | "CONFIRMED" | "CANCELLED";
}

export default function AppointmentPage({ user }: { user: { name: string; role: string } }) {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(user.role !== "pasien");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  
  // Load appointments from localStorage
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("asident_appointments") || "[]");
    // Deduplicate by ID
    const unique = saved.filter((v: any, i: number, a: any[]) => a.findIndex(t => t.id === v.id) === i);
    
    if (unique.length === 0 && user.role !== "pasien") {
      // Default mock data if empty and not a patient
      const initial = [
        { id: 1, patient: "Ali Hamzah", date: "2026-04-10", time: "09:00", type: "Scaling", status: "CONFIRMED" },
        { id: 2, patient: "Siti Aminah", date: "2026-04-10", time: "10:30", type: "Konsultasi", status: "CONFIRMED" },
      ];
      setAppointments(initial as Appointment[]);
      localStorage.setItem("asident_appointments", JSON.stringify(initial));
    } else {
      setAppointments(unique);
    }
  }, [user.role]);

  // Filter appointments based on role
  const displayAppointments = user.role === "pasien" 
    ? appointments.filter(app => app.patient === user.name)
    : appointments;

  // Save appointments to localStorage
  const saveToStorage = (updated: Appointment[]) => {
    setAppointments(updated);
    localStorage.setItem("asident_appointments", JSON.stringify(updated));
  };

  // Mock existing patients (in real app, fetch from database)
  const [existingPatients, setExistingPatients] = useState<any[]>([]);
  useEffect(() => {
    const assessments = JSON.parse(localStorage.getItem("asident_assessments") || "[]");
    const uniquePatients = assessments.reduce((acc: any[], curr: any) => {
      if (!curr.demographics) return acc;
      const exists = acc.find(p => p.demographics?.fullName === curr.demographics?.fullName);
      if (!exists) acc.push({ id: curr.id, name: curr.demographics.fullName, phone: curr.demographics.phone });
      return acc;
    }, []);
    setExistingPatients(uniquePatients);
  }, []);

  const filteredPatients = existingPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone.includes(searchQuery)
  );

  const [newApp, setNewApp] = useState<{
    patient: string;
    date: string;
    time: string;
    type: string;
    status: "PENDING" | "CONFIRMED" | "CANCELLED";
  }>({
    patient: user.role === "pasien" ? user.name : "",
    date: "",
    time: "",
    type: "Konsultasi",
    status: user.role === "pasien" ? "PENDING" : "CONFIRMED"
  });

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Ensure patient name is set for logged in patients
    const finalApp = {
      ...newApp,
      patient: user.role === "pasien" ? user.name : newApp.patient
    };

    if (editingId) {
      const updated = appointments.map(app => 
        app.id === editingId ? { ...app, ...finalApp } : app
      );
      saveToStorage(updated);
    } else {
      const id = Date.now() + Math.floor(Math.random() * 1000);
      const updated = [...appointments, { id, ...finalApp }];
      saveToStorage(updated);
    }
    closeModal();
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingId(null);
    setNewApp({ 
      patient: user.role === "pasien" ? user.name : "", 
      date: "", 
      time: "", 
      type: "Konsultasi", 
      status: user.role === "pasien" ? "PENDING" : "CONFIRMED" 
    });
    setSearchQuery("");
  };

  const openEditModal = (app: Appointment) => {
    setEditingId(app.id);
    setNewApp({
      patient: app.patient,
      date: app.date,
      time: app.time,
      type: app.type,
      status: app.status
    });
    setSearchQuery(app.patient);
    setIsExistingPatient(true);
    setShowModal(true);
  };

  const handleDelete = (id: number) => {
    if (window.confirm("Apakah Anda yakin ingin menghapus janji temu ini?")) {
      const updated = appointments.filter(app => app.id !== id);
      saveToStorage(updated);
    }
  };

  const handlePrint = (app: Appointment) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Pengingat Janji Temu - ASIDENT</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1e293b; }
            .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 20px; margin-bottom: 30px; }
            .title { font-size: 24px; font-weight: 900; color: #2563eb; margin: 0; }
            .subtitle { font-size: 12px; font-weight: 700; color: #64748b; text-transform: uppercase; letter-spacing: 2px; }
            .content { background: #f8fafc; padding: 30px; border-radius: 20px; border: 1px solid #e2e8f0; }
            .row { display: flex; justify-content: space-between; margin-bottom: 15px; border-bottom: 1px dashed #cbd5e1; padding-bottom: 10px; }
            .label { font-weight: 800; color: #64748b; font-size: 12px; text-transform: uppercase; }
            .value { font-weight: 700; color: #0f172a; }
            .footer { margin-top: 40px; text-align: center; font-size: 11px; color: #94a3b8; }
            .note { margin-top: 20px; font-size: 13px; font-style: italic; color: #475569; }
          </style>
        </head>
        <body>
          <div class="header">
            <p class="title">ASIDENT</p>
            <p class="subtitle">Kartu Pengingat Janji Temu</p>
          </div>
          <div class="content">
            <div class="row">
              <span class="label">Nama Pasien</span>
              <span class="value">${app.patient}</span>
            </div>
            <div class="row">
              <span class="label">Tanggal Kunjungan</span>
              <span class="value">${new Date(app.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="row">
              <span class="label">Waktu</span>
              <span class="value">${app.time} WIB</span>
            </div>
            <div class="row">
              <span class="label">Jenis Perawatan</span>
              <span class="value">${app.type}</span>
            </div>
            <div class="note">
              <strong>Keterangan:</strong> Harap datang 15 menit sebelum jadwal yang ditentukan. Jika ingin melakukan pembatalan atau perubahan jadwal, harap hubungi kami minimal 24 jam sebelumnya.
            </div>
          </div>
          <div class="footer">
            Dicetak otomatis oleh Sistem Informasi Asuhan Kesehatan Gigi & Mulut (ASIDENT)
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  const selectPatient = (patient: any) => {
    setNewApp({ ...newApp, patient: patient.name });
    setSearchQuery(patient.name);
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-indigo-50/50 p-8">
      <header className="mb-12 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button 
            onClick={() => navigate("/")} 
            className="group flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-lg shadow-blue-900/5 border border-white transition-all hover:bg-blue-600 hover:text-white active:scale-90"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Jadwal Janji Temu</h1>
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Manajemen Kunjungan Pasien</p>
          </div>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="group flex items-center gap-3 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 px-10 py-5 font-black text-white shadow-2xl shadow-blue-500/30 hover:shadow-blue-500/50 transition-all active:scale-95"
        >
          <Plus className="h-6 w-6 group-hover:rotate-90 transition-transform duration-500" />
          BUAT JANJI BARU
        </button>
      </header>

      <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        {displayAppointments.length > 0 ? displayAppointments.map((app, i) => (
          <motion.div 
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="group relative overflow-hidden rounded-[2.5rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white transition-all hover:shadow-2xl hover:border-blue-100"
          >
            <div className="mb-8 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-5 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                <Calendar className="h-7 w-7" />
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Status</span>
                <span className={cn(
                  "rounded-full px-3 py-1 text-[10px] font-black uppercase tracking-widest",
                  app.status === "CONFIRMED" ? "bg-emerald-50 text-emerald-600" : 
                  app.status === "PENDING" ? "bg-amber-50 text-amber-600" : "bg-red-50 text-red-600"
                )}>
                  {app.status}
                </span>
              </div>
            </div>
            
            <div className="space-y-2">
              <h3 className="text-2xl font-black text-slate-900 tracking-tight">{app.patient}</h3>
              <div className="flex items-center gap-2 text-blue-600">
                <Stethoscope className="h-4 w-4" />
                <p className="text-sm font-black uppercase tracking-widest">{app.type}</p>
              </div>
            </div>

            <div className="mt-8 grid grid-cols-2 gap-4 rounded-3xl bg-slate-50 p-6 border border-slate-100">
              <div className="space-y-1">
                <div className="flex items-center gap-1.5 text-slate-400">
                  <Calendar className="h-3 w-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Tanggal</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{new Date(app.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
              </div>
              <div className="space-y-1 text-right">
                <div className="flex items-center justify-end gap-1.5 text-slate-400">
                  <Clock className="h-3 w-3" />
                  <p className="text-[10px] font-black uppercase tracking-widest">Waktu</p>
                </div>
                <p className="text-sm font-bold text-slate-900">{app.time} WIB</p>
              </div>
            </div>

            <div className="mt-8 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-4 group-hover:translate-y-0">
              <button 
                onClick={() => handlePrint(app)}
                className="flex-1 flex items-center justify-center gap-2 rounded-2xl bg-slate-900 py-4 text-xs font-black text-white hover:bg-blue-600 transition-all uppercase tracking-widest"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
              {(user.role === "admin" || user.role === "pemeriksa" || (user.role === "pasien" && app.status === "PENDING")) && (
                <>
                  <button 
                    onClick={() => openEditModal(app)}
                    className="rounded-2xl bg-blue-50 p-4 text-blue-600 hover:bg-blue-100 transition-all"
                  >
                    <Edit3 className="h-5 w-5" />
                  </button>
                  <button 
                    onClick={() => handleDelete(app.id)}
                    className="rounded-2xl bg-red-50 p-4 text-red-500 hover:bg-red-100 transition-all"
                  >
                    <Trash2 className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </motion.div>
        )) : (
          <div className="col-span-full flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-6 rounded-full bg-slate-100 p-8 text-slate-300">
              <Calendar className="h-16 w-16" />
            </div>
            <h3 className="text-2xl font-black text-slate-900">Belum Ada Janji Temu</h3>
            <p className="max-w-xs text-slate-500 font-medium mt-2">Silakan buat janji temu baru untuk melihat jadwal kunjungan pasien.</p>
          </div>
        )}
      </div>

      {/* Modal Buat/Edit Janji */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[3rem] bg-white shadow-2xl"
            >
              <div className="bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-3xl font-black tracking-tight">{editingId ? "Edit Janji Temu" : "Buat Janji Baru"}</h2>
                    <p className="mt-2 text-sm text-slate-400 font-medium">Lengkapi data untuk pendaftaran kunjungan.</p>
                  </div>
                  <button onClick={closeModal} className="rounded-full bg-white/10 p-3 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
              </div>

              <form onSubmit={handleAddAppointment} className="p-10 space-y-8">
                {/* Patient Type Toggle - Only for Admin */}
                {user.role !== "pasien" && (
                  <div className="flex rounded-2xl bg-slate-100 p-1.5">
                    <button
                      type="button"
                      onClick={() => setIsExistingPatient(false)}
                      className={cn(
                        "flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all",
                        !isExistingPatient ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Pasien Baru
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsExistingPatient(true)}
                      className={cn(
                        "flex-1 rounded-xl py-3.5 text-xs font-black uppercase tracking-widest transition-all",
                        isExistingPatient ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                      )}
                    >
                      Pasien Lama
                    </button>
                  </div>
                )}

                <div className="space-y-3">
                  <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                    <User className="h-3 w-3" />
                    Nama Pasien
                  </label>
                  {user.role === "pasien" ? (
                    <input 
                      type="text" 
                      readOnly
                      value={user.name}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-100 px-6 py-5 text-sm font-bold text-slate-500 outline-none cursor-not-allowed"
                    />
                  ) : isExistingPatient ? (
                    <div className="relative">
                      <div className="relative group">
                        <Search className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text" 
                          required
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 pl-12 pr-5 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                          placeholder="Cari nama atau nomor HP..."
                        />
                      </div>
                      {searchQuery && !newApp.patient && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-3 max-h-60 overflow-y-auto rounded-3xl border border-slate-100 bg-white p-3 shadow-2xl">
                          {filteredPatients.length > 0 ? filteredPatients.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectPatient(p)}
                              className="flex w-full items-center justify-between rounded-2xl px-5 py-4 text-left hover:bg-blue-50 transition-all group"
                            >
                              <div>
                                <p className="text-sm font-black text-slate-900 group-hover:text-blue-600 transition-colors">{p.name}</p>
                                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">{p.phone}</p>
                              </div>
                              <div className="rounded-full bg-blue-100 p-2 text-blue-600 opacity-0 group-hover:opacity-100 transition-all">
                                <Plus className="h-4 w-4" />
                              </div>
                            </button>
                          )) : (
                            <div className="py-8 text-center">
                              <p className="text-xs font-bold text-slate-400">Pasien tidak ditemukan</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <input 
                      type="text" 
                      required
                      value={newApp.patient}
                      onChange={(e) => setNewApp({...newApp, patient: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                      placeholder="Nama lengkap pasien baru"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <Calendar className="h-3 w-3" />
                      Tanggal
                    </label>
                    <input 
                      type="date" 
                      required
                      value={newApp.date}
                      onChange={(e) => setNewApp({...newApp, date: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <Clock className="h-3 w-3" />
                      Waktu
                    </label>
                    <input 
                      type="time" 
                      required
                      value={newApp.time}
                      onChange={(e) => setNewApp({...newApp, time: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                      <Stethoscope className="h-3 w-3" />
                      Layanan
                    </label>
                    <select 
                      value={newApp.type}
                      onChange={(e) => setNewApp({...newApp, type: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                    >
                      <option value="Konsultasi">Konsultasi</option>
                      <option value="Scaling">Scaling</option>
                      <option value="Penambalan">Penambalan</option>
                      <option value="Pencabutan">Pencabutan</option>
                      <option value="Pemasangan Behel">Behel</option>
                      <option value="TAF">TAF</option>
                      <option value="Cabut Gigi Susu">Cabut Gigi Susu</option>
                    </select>
                  </div>
                  {(user.role === "admin" || user.role === "pemeriksa") && (
                    <div className="space-y-3">
                      <label className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-slate-400">
                        <ShieldCheck className="h-3 w-3" />
                        Status
                      </label>
                      <select 
                        value={newApp.status}
                        onChange={(e) => setNewApp({...newApp, status: e.target.value as any})}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-6 py-5 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all appearance-none"
                      >
                        <option value="PENDING">PENDING</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>
                  )}
                </div>

                <button 
                  type="submit"
                  disabled={(user.role !== "pasien" && !newApp.patient) || !newApp.date || !newApp.time}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-[2rem] bg-gradient-to-r from-blue-600 to-indigo-700 py-6 text-sm font-black text-white shadow-2xl shadow-blue-500/30 transition-all hover:shadow-blue-500/50 active:scale-95 uppercase tracking-[0.2em] disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-6 w-6" />
                  {editingId ? "SIMPAN PERUBAHAN" : "KONFIRMASI JANJI TEMU"}
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
