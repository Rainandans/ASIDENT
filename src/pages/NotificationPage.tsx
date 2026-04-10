import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, ChevronLeft, Mail, MessageSquare, Smartphone, Save, CheckCircle2, Printer, Calendar, Clock, User, Info, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function NotificationPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  
  const [settings, setSettings] = useState({
    appointmentReminder: true,
    billingAlert: true,
    educationUpdate: false,
    channels: {
      email: true,
      whatsapp: true,
      push: false
    },
    reminderTime: "24" // hours before
  });

  useEffect(() => {
    const savedApps = JSON.parse(localStorage.getItem("asident_appointments") || "[]");
    // Sort by date
    const sorted = savedApps.sort((a: any, b: any) => new Date(a.date).getTime() - new Date(b.date).getTime());
    setAppointments(sorted);
  }, []);

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const handlePrintReminder = (app: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <html>
        <head>
          <title>Kartu Pengingat - ASIDENT</title>
          <style>
            body { font-family: 'Plus Jakarta Sans', sans-serif; padding: 40px; color: #1e293b; line-height: 1.6; }
            .card { max-width: 500px; margin: 0 auto; border: 2px solid #2563eb; border-radius: 24px; padding: 40px; background: #fff; }
            .header { text-align: center; margin-bottom: 30px; }
            .logo { font-size: 28px; font-weight: 900; color: #2563eb; margin: 0; }
            .tagline { font-size: 10px; font-weight: 800; color: #94a3b8; text-transform: uppercase; letter-spacing: 3px; margin-top: 5px; }
            .title { font-size: 18px; font-weight: 800; color: #0f172a; margin: 20px 0; text-align: center; }
            .info-group { margin-bottom: 20px; }
            .label { font-size: 11px; font-weight: 800; color: #64748b; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 5px; }
            .value { font-size: 16px; font-weight: 700; color: #1e293b; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e2e8f0; text-align: center; font-size: 11px; color: #94a3b8; }
            .highlight { color: #2563eb; font-weight: 800; }
          </style>
        </head>
        <body>
          <div class="card">
            <div class="header">
              <p class="logo">ASIDENT</p>
              <p class="tagline">Dental Care Assistant</p>
            </div>
            <div class="title">PENGINGAT KUNJUNGAN</div>
            <div class="info-group">
              <span class="label">Nama Pasien</span>
              <span class="value">${app.patient}</span>
            </div>
            <div class="info-group">
              <span class="label">Jadwal Kunjungan</span>
              <span class="value highlight">${new Date(app.date).toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</span>
            </div>
            <div class="info-group">
              <span class="label">Waktu</span>
              <span class="value">${app.time} WIB</span>
            </div>
            <div class="info-group">
              <span class="label">Rencana Perawatan</span>
              <span class="value">${app.type}</span>
            </div>
            <div style="margin-top: 20px; font-size: 12px; color: #475569; background: #f8fafc; padding: 15px; border-radius: 12px;">
              <strong>Catatan:</strong> Mohon hadir tepat waktu. Jika berhalangan hadir, harap konfirmasi minimal 1 hari sebelumnya.
            </div>
            <div class="footer">
              Terima kasih telah mempercayakan kesehatan gigi Anda kepada kami.
            </div>
          </div>
          <script>window.print(); window.close();</script>
        </body>
      </html>
    `);
    printWindow.document.close();
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
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Notifikasi & Pengingat</h1>
            <p className="text-xs font-black text-blue-600 uppercase tracking-[0.3em] mt-1">Sistem Pengingat Otomatis</p>
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
        </div>
      </header>

      <div className="mx-auto max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {/* Notification Types */}
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-blue-900/5 border border-white">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl bg-blue-50 p-4 text-blue-600 shadow-inner">
                <Bell className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Jenis Notifikasi</h2>
                <p className="text-sm font-bold text-slate-400">Pilih informasi apa yang ingin Anda terima.</p>
              </div>
            </div>

            <div className="space-y-4">
              {[
                { id: "appointmentReminder", label: "Pengingat Janji Temu", desc: "Dapatkan pengingat otomatis sebelum jadwal kunjungan Anda." },
                { id: "billingAlert", label: "Tagihan & Pembayaran", desc: "Notifikasi saat tagihan baru tersedia atau pembayaran berhasil." },
                { id: "educationUpdate", label: "Materi Edukasi Baru", desc: "Info saat ada tips kesehatan gigi terbaru untuk Anda." },
              ].map((item) => (
                <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-3xl border-2 border-slate-50 bg-slate-50/50 p-6 transition-all hover:border-blue-200 hover:bg-white hover:shadow-lg hover:shadow-blue-900/5">
                  <div className="max-w-[80%]">
                    <p className="font-black text-slate-900">{item.label}</p>
                    <p className="text-xs font-bold text-slate-400 mt-1">{item.desc}</p>
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
          <section className="rounded-[2.5rem] bg-white p-10 shadow-xl shadow-blue-900/5 border border-white">
            <div className="mb-8 flex items-center gap-4">
              <div className="rounded-2xl bg-emerald-50 p-4 text-emerald-600 shadow-inner">
                <Smartphone className="h-7 w-7" />
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 tracking-tight">Saluran Pengiriman</h2>
                <p className="text-sm font-bold text-slate-400">Pilih media pengiriman notifikasi.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {[
                { id: "email", label: "Email", icon: Mail, color: "text-blue-500", bg: "bg-blue-50" },
                { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-500", bg: "bg-emerald-50" },
                { id: "push", label: "Push Notif", icon: Bell, color: "text-purple-500", bg: "bg-purple-50" },
              ].map((item) => (
                <button
                  key={item.id}
                  onClick={() => setSettings({
                    ...settings, 
                    channels: { ...settings.channels, [item.id]: !settings.channels[item.id as keyof typeof settings.channels] }
                  })}
                  className={cn(
                    "flex flex-col items-center justify-center rounded-[2rem] border-2 p-8 transition-all group",
                    settings.channels[item.id as keyof typeof settings.channels]
                      ? "border-blue-600 bg-blue-50/50 shadow-xl shadow-blue-900/5"
                      : "border-slate-50 bg-slate-50 text-slate-400 opacity-60"
                  )}
                >
                  <div className={cn(
                    "mb-4 rounded-2xl p-4 transition-all group-hover:scale-110",
                    settings.channels[item.id as keyof typeof settings.channels] ? item.bg : "bg-white"
                  )}>
                    <item.icon className={cn("h-8 w-8", settings.channels[item.id as keyof typeof settings.channels] ? item.color : "text-slate-300")} />
                  </div>
                  <span className="text-xs font-black uppercase tracking-widest">{item.label}</span>
                </button>
              ))}
            </div>
          </section>

          <div className="flex justify-end">
            <button 
              onClick={handleSave}
              className="flex items-center gap-3 rounded-[2rem] bg-slate-900 px-12 py-6 font-black text-white shadow-2xl transition-all hover:bg-blue-600 active:scale-95 uppercase tracking-[0.2em] text-sm"
            >
              {saved ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                  BERHASIL DISIMPAN
                </>
              ) : (
                <>
                  <Save className="h-5 w-5" />
                  SIMPAN PENGATURAN
                </>
              )}
            </button>
          </div>
        </div>

        <div className="space-y-8">
          {/* Print Reminders Section */}
          <section className="rounded-[2.5rem] bg-white p-8 shadow-xl shadow-blue-900/5 border border-white">
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-amber-50 p-3 text-amber-600 shadow-inner">
                <Printer className="h-5 w-5" />
              </div>
              <h2 className="text-lg font-black text-slate-900 tracking-tight">Cetak Pengingat</h2>
            </div>
            
            <p className="text-xs font-bold text-slate-400 mb-6 leading-relaxed">Cetak kartu pengingat fisik untuk diberikan kepada pasien saat kunjungan selesai.</p>

            <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2">
              {appointments.length > 0 ? appointments.map((app) => (
                <div key={app.id} className="group rounded-3xl bg-slate-50 p-5 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-black text-[10px]">
                        {app.patient.charAt(0)}
                      </div>
                      <p className="text-sm font-black text-slate-900 truncate max-w-[120px]">{app.patient}</p>
                    </div>
                    <button 
                      onClick={() => handlePrintReminder(app)}
                      className="rounded-xl bg-white p-2 text-slate-400 hover:text-blue-600 hover:shadow-md transition-all border border-slate-100"
                    >
                      <Printer className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-[10px] font-bold text-slate-400">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {new Date(app.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {app.time}
                    </div>
                  </div>
                </div>
              )) : (
                <div className="py-10 text-center">
                  <p className="text-xs font-bold text-slate-400">Tidak ada jadwal mendatang</p>
                </div>
              )}
            </div>
          </section>

          {/* Info Card */}
          <section className="rounded-[2.5rem] bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white shadow-xl shadow-blue-500/20">
            <div className="mb-4 rounded-xl bg-white/10 p-3 w-fit">
              <Info className="h-6 w-6" />
            </div>
            <h3 className="text-lg font-black tracking-tight mb-2">Tips Pengingat</h3>
            <p className="text-xs font-medium text-blue-100 leading-relaxed">
              Mengirimkan pengingat 24 jam sebelum jadwal terbukti mengurangi tingkat ketidakhadiran pasien hingga 40%. Pastikan nomor WhatsApp pasien sudah benar.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
