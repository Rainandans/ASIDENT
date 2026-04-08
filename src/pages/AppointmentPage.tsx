import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Calendar, ChevronLeft, Plus, X, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function AppointmentPage() {
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  // Mock existing patients
  const existingPatients = [
    { id: "P001", name: "Ali Hamzah", phone: "08123456789" },
    { id: "P002", name: "Siti Aminah", phone: "08987654321" },
    { id: "P003", name: "Budi Santoso", phone: "08112233445" },
    { id: "P004", name: "Dewi Lestari", phone: "08556677889" },
  ];

  const filteredPatients = existingPatients.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
    p.phone.includes(searchQuery)
  );

  const [appointments, setAppointments] = useState([
    { id: 1, patient: "Ali Hamzah", date: "2026-04-10", time: "09:00", type: "Scaling" },
    { id: 2, patient: "Siti Aminah", date: "2026-04-10", time: "10:30", type: "Konsultasi" },
  ]);

  const [newApp, setNewApp] = useState({
    patient: "",
    date: "",
    time: "",
    type: "Konsultasi"
  });

  const handleAddAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    const id = appointments.length + 1;
    setAppointments([...appointments, { id, ...newApp }]);
    setShowModal(false);
    setNewApp({ patient: "", date: "", time: "", type: "Konsultasi" });
    setSearchQuery("");
  };

  const selectPatient = (patient: typeof existingPatients[0]) => {
    setNewApp({ ...newApp, patient: patient.name });
    setSearchQuery(patient.name);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Janji Temu</h1>
        </div>
        <button 
          onClick={() => setShowModal(true)}
          className="flex items-center gap-3 rounded-2xl bg-blue-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95 uppercase tracking-widest text-xs"
        >
          <Plus className="h-5 w-5" />
          Buat Janji Baru
        </button>
      </header>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        {appointments.map((app) => (
          <motion.div 
            key={app.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="group relative overflow-hidden rounded-[2rem] bg-white p-8 shadow-sm border border-slate-100 transition-all hover:shadow-xl hover:border-blue-100"
          >
            <div className="mb-6 flex items-center justify-between">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                <Calendar className="h-6 w-6" />
              </div>
              <div className="text-right">
                <p className="text-xs font-black uppercase tracking-widest text-slate-400">Status</p>
                <p className="text-xs font-black text-emerald-500 uppercase tracking-widest">Confirmed</p>
              </div>
            </div>
            
            <div className="space-y-1">
              <h3 className="text-xl font-black text-slate-900">{app.patient}</h3>
              <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">{app.type}</p>
            </div>

            <div className="mt-8 flex items-center justify-between rounded-2xl bg-slate-50 p-4">
              <div>
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Tanggal</p>
                <p className="text-sm font-bold text-slate-900">{app.date}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Waktu</p>
                <p className="text-sm font-bold text-slate-900">{app.time} WIB</p>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Modal Buat Janji */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowModal(false)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-lg overflow-hidden rounded-[3rem] bg-white shadow-2xl"
            >
              <div className="bg-slate-900 p-8 text-white">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black tracking-tight">Buat Janji Temu</h2>
                  <button onClick={() => setShowModal(false)} className="rounded-full bg-white/10 p-2 hover:bg-white/20 transition-colors">
                    <X className="h-6 w-6" />
                  </button>
                </div>
                <p className="mt-2 text-sm text-slate-400">Lengkapi data untuk pendaftaran kunjungan.</p>
              </div>

              <form onSubmit={handleAddAppointment} className="p-8 space-y-6">
                {/* Patient Type Toggle */}
                <div className="flex rounded-2xl bg-slate-100 p-1">
                  <button
                    type="button"
                    onClick={() => setIsExistingPatient(false)}
                    className={cn(
                      "flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all",
                      !isExistingPatient ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Pasien Baru
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsExistingPatient(true)}
                    className={cn(
                      "flex-1 rounded-xl py-3 text-xs font-black uppercase tracking-widest transition-all",
                      isExistingPatient ? "bg-white text-blue-600 shadow-sm" : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    Pasien Lama
                  </button>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Nama Pasien</label>
                  {isExistingPatient ? (
                    <div className="relative">
                      <input 
                        type="text" 
                        required
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                        placeholder="Cari nama atau nomor HP..."
                      />
                      {searchQuery && !newApp.patient && (
                        <div className="absolute left-0 right-0 top-full z-10 mt-2 max-h-48 overflow-y-auto rounded-2xl border border-slate-100 bg-white p-2 shadow-xl">
                          {filteredPatients.length > 0 ? filteredPatients.map(p => (
                            <button
                              key={p.id}
                              type="button"
                              onClick={() => selectPatient(p)}
                              className="flex w-full items-center justify-between rounded-xl px-4 py-3 text-left hover:bg-slate-50 transition-colors"
                            >
                              <div>
                                <p className="text-sm font-bold text-slate-900">{p.name}</p>
                                <p className="text-[10px] text-slate-400">{p.phone}</p>
                              </div>
                              <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Pilih</span>
                            </button>
                          )) : (
                            <p className="p-4 text-center text-xs text-slate-400">Pasien tidak ditemukan</p>
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
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                      placeholder="Nama lengkap pasien baru"
                    />
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Tanggal</label>
                    <input 
                      type="date" 
                      required
                      value={newApp.date}
                      onChange={(e) => setNewApp({...newApp, date: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-black uppercase tracking-widest text-slate-400">Waktu</label>
                    <input 
                      type="time" 
                      required
                      value={newApp.time}
                      onChange={(e) => setNewApp({...newApp, time: e.target.value})}
                      className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-black uppercase tracking-widest text-slate-400">Jenis Layanan</label>
                  <select 
                    value={newApp.type}
                    onChange={(e) => setNewApp({...newApp, type: e.target.value})}
                    className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 px-5 py-4 text-sm font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                  >
                    <option value="Konsultasi">Konsultasi Umum</option>
                    <option value="Scaling">Scaling (Pembersihan Karang)</option>
                    <option value="Penambalan">Penambalan Gigi</option>
                    <option value="Pencabutan">Pencabutan Gigi</option>
                    <option value="Pemasangan Behel">Pemasangan Behel</option>
                  </select>
                </div>

                <button 
                  type="submit"
                  disabled={!newApp.patient}
                  className="mt-4 flex w-full items-center justify-center gap-3 rounded-2xl bg-blue-600 py-5 text-sm font-black text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 active:scale-95 uppercase tracking-widest disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  Konfirmasi Janji Temu
                </button>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
