import React, { useState } from "react";
import { motion } from "motion/react";
import { Bell, ChevronLeft, Mail, MessageSquare, Smartphone, Save, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function NotificationPage() {
  const navigate = useNavigate();
  const [saved, setSaved] = useState(false);
  
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

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-slate-200 transition-colors">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Pengaturan Notifikasi</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl space-y-8">
        {/* Notification Types */}
        <section className="rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl bg-blue-50 p-3 text-blue-600">
              <Bell className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Jenis Notifikasi</h2>
              <p className="text-sm text-slate-500">Pilih informasi apa yang ingin Anda terima.</p>
            </div>
          </div>

          <div className="space-y-4">
            {[
              { id: "appointmentReminder", label: "Pengingat Janji Temu", desc: "Dapatkan pengingat otomatis sebelum jadwal kunjungan Anda." },
              { id: "billingAlert", label: "Tagihan & Pembayaran", desc: "Notifikasi saat tagihan baru tersedia atau pembayaran berhasil." },
              { id: "educationUpdate", label: "Materi Edukasi Baru", desc: "Info saat ada tips kesehatan gigi terbaru untuk Anda." },
            ].map((item) => (
              <label key={item.id} className="flex cursor-pointer items-center justify-between rounded-2xl border-2 border-slate-50 bg-slate-50 p-6 transition-all hover:border-blue-100">
                <div className="max-w-[80%]">
                  <p className="font-bold text-slate-900">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.desc}</p>
                </div>
                <input 
                  type="checkbox" 
                  checked={settings[item.id as keyof typeof settings] as boolean}
                  onChange={(e) => setSettings({...settings, [item.id]: e.target.checked})}
                  className="h-6 w-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500"
                />
              </label>
            ))}
          </div>
        </section>

        {/* Channels */}
        <section className="rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100">
          <div className="mb-8 flex items-center gap-4">
            <div className="rounded-2xl bg-emerald-50 p-3 text-emerald-600">
              <Smartphone className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Saluran Pengiriman</h2>
              <p className="text-sm text-slate-500">Pilih media pengiriman notifikasi.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            {[
              { id: "email", label: "Email", icon: Mail, color: "text-blue-500" },
              { id: "whatsapp", label: "WhatsApp", icon: MessageSquare, color: "text-emerald-500" },
              { id: "push", label: "Push Notif", icon: Bell, color: "text-purple-500" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setSettings({
                  ...settings, 
                  channels: { ...settings.channels, [item.id]: !settings.channels[item.id as keyof typeof settings.channels] }
                })}
                className={cn(
                  "flex flex-col items-center justify-center rounded-3xl border-2 p-8 transition-all",
                  settings.channels[item.id as keyof typeof settings.channels]
                    ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-100"
                    : "border-slate-50 bg-slate-50 text-slate-400 opacity-60"
                )}
              >
                <item.icon className={cn("mb-3 h-8 w-8", settings.channels[item.id as keyof typeof settings.channels] ? item.color : "text-slate-300")} />
                <span className="text-sm font-black uppercase tracking-widest">{item.label}</span>
              </button>
            ))}
          </div>
        </section>

        {/* Timing */}
        <section className="rounded-[2.5rem] bg-white p-10 shadow-sm border border-slate-100">
          <div className="mb-6 flex items-center gap-4">
            <div className="rounded-2xl bg-amber-50 p-3 text-amber-600">
              <ClockIcon className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-900">Waktu Pengingat</h2>
              <p className="text-sm text-slate-500">Berapa lama sebelum janji temu notifikasi dikirim?</p>
            </div>
          </div>

          <select 
            value={settings.reminderTime}
            onChange={(e) => setSettings({...settings, reminderTime: e.target.value})}
            className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 p-5 font-bold text-slate-700 outline-none focus:border-blue-500"
          >
            <option value="1">1 Jam Sebelumnya</option>
            <option value="3">3 Jam Sebelumnya</option>
            <option value="12">12 Jam Sebelumnya</option>
            <option value="24">24 Jam Sebelumnya (1 Hari)</option>
            <option value="48">48 Jam Sebelumnya (2 Hari)</option>
          </select>
        </section>

        <div className="flex justify-end pt-4">
          <button 
            onClick={handleSave}
            className="flex items-center gap-3 rounded-2xl bg-slate-900 px-10 py-5 font-black text-white shadow-xl transition-all hover:bg-blue-600 active:scale-95 uppercase tracking-widest"
          >
            {saved ? (
              <>
                <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                Berhasil Disimpan
              </>
            ) : (
              <>
                <Save className="h-5 w-5" />
                Simpan Pengaturan
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function ClockIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}
