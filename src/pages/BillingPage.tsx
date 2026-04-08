import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { CreditCard, ChevronLeft, Download, CheckCircle2, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

interface Bill {
  id: number;
  patient: string;
  date: string;
  services: string[];
  total: number;
  status: "PAID" | "UNPAID";
}

export default function BillingPage() {
  const navigate = useNavigate();
  const [bills, setBills] = useState<Bill[]>([]);
  const [filter, setFilter] = useState("ALL");

  useEffect(() => {
    const savedBills = JSON.parse(localStorage.getItem("asident_bills") || "[]");
    // If no bills, add some mock ones for initial view
    if (savedBills.length === 0) {
      const mockBills: Bill[] = [
        { id: 1, patient: "Ali Hamzah", date: "2026-04-06", services: ["Scaling", "Konsultasi"], total: 350000, status: "PAID" },
        { id: 2, patient: "Siti Aminah", date: "2026-04-05", services: ["Konsultasi"], total: 150000, status: "UNPAID" },
      ];
      setBills(mockBills);
      localStorage.setItem("asident_bills", JSON.stringify(mockBills));
    } else {
      setBills(savedBills);
    }
  }, []);

  const handlePay = (id: number) => {
    const updatedBills = bills.map(bill => 
      bill.id === id ? { ...bill, status: "PAID" as const } : bill
    );
    setBills(updatedBills);
    localStorage.setItem("asident_bills", JSON.stringify(updatedBills));
  };

  const filteredBills = filter === "ALL" 
    ? bills 
    : bills.filter(b => b.status === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-slate-200">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Billing & Tagihan</h1>
        </div>
      </header>

      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex gap-2">
          {["ALL", "UNPAID", "PAID"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition-all",
                filter === f 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {f === "ALL" ? "Semua" : f === "UNPAID" ? "Belum Bayar" : "Lunas"}
            </button>
          ))}
        </div>
      </div>

      {filteredBills.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-3xl bg-white p-20 border border-slate-100 shadow-sm">
          <div className="mb-4 rounded-full bg-slate-100 p-6 text-slate-300">
            <CreditCard className="h-12 w-12" />
          </div>
          <h3 className="text-xl font-bold text-slate-900">Belum ada tagihan</h3>
          <p className="text-slate-500">Tagihan akan muncul otomatis setelah tindakan medis selesai.</p>
        </div>
      ) : (
        <div className="grid gap-6">
          <AnimatePresence mode="popLayout">
            {filteredBills.map((bill) => (
              <motion.div 
                key={bill.id}
                layout
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="rounded-3xl bg-white p-8 shadow-sm border border-slate-100"
              >
                <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
                  <div className="flex items-center gap-6">
                    <div className={cn(
                      "rounded-2xl p-5",
                      bill.status === "PAID" ? "bg-emerald-50 text-emerald-600" : "bg-amber-50 text-amber-600"
                    )}>
                      <CreditCard className="h-8 w-8" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-xl font-black text-slate-900">{bill.patient}</h3>
                        <span className={cn(
                          "rounded-full px-3 py-0.5 text-[10px] font-black uppercase tracking-widest",
                          bill.status === "PAID" ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"
                        )}>
                          {bill.status === "PAID" ? "LUNAS" : "BELUM BAYAR"}
                        </span>
                      </div>
                      <p className="text-sm font-bold text-slate-400 flex items-center gap-2">
                        <Clock className="h-4 w-4" />
                        {bill.date}
                      </p>
                    </div>
                  </div>

                  <div className="flex flex-col items-end gap-2">
                    <p className="text-xs font-bold uppercase tracking-widest text-slate-400">Total Tagihan</p>
                    <p className="text-2xl font-black text-slate-900">Rp {bill.total.toLocaleString()}</p>
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6">
                  <p className="mb-4 text-xs font-bold uppercase tracking-widest text-slate-400">Layanan:</p>
                  <div className="flex flex-wrap gap-2 mb-8">
                    {bill.services.map((s, i) => (
                      <span key={i} className="rounded-lg bg-slate-50 border border-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                        {s}
                      </span>
                    ))}
                  </div>

                  <div className="flex justify-end gap-4">
                    <button className="flex items-center gap-2 rounded-xl border-2 border-slate-100 px-6 py-3 text-sm font-bold text-slate-600 hover:bg-slate-50 transition-all">
                      <Download className="h-4 w-4" />
                      CETAK INVOICE
                    </button>
                    {bill.status === "UNPAID" && (
                      <button 
                        onClick={() => handlePay(bill.id)}
                        className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 text-sm font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        PROSES PEMBAYARAN
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
