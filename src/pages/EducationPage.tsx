import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { BookOpen, ChevronLeft, PlayCircle, FileText, Filter, X, LogOut } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

export default function EducationPage({ onLogout }: { onLogout: () => void }) {
  const navigate = useNavigate();
  const [filter, setFilter] = useState("Semua");
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  
  const materials = [
    { 
      id: 1, 
      title: "Cara Menyikat Gigi yang Benar", 
      type: "Video", 
      category: "Pencegahan", 
      duration: "5:00", 
      icon: PlayCircle, 
      color: "bg-red-500",
      embedId: "DdVTN0bU7gI"
    },
    { 
      id: 2, 
      title: "Pengenalan & Pencegahan Karies pada Anak", 
      type: "Video", 
      category: "Anak", 
      duration: "10:00", 
      icon: PlayCircle, 
      color: "bg-blue-500",
      embedId: "ufM9uAPOGqM"
    },
    { 
      id: 3, 
      title: "Pentingnya Scaling Rutin", 
      type: "Video", 
      category: "Perawatan", 
      duration: "3:30", 
      icon: PlayCircle, 
      color: "bg-emerald-500",
      embedId: "0kZvcu8L8Dw"
    },
    { 
      id: 4, 
      title: "Gigi Sensitif & Solusinya", 
      type: "Video", 
      category: "Dewasa", 
      duration: "5:00", 
      icon: PlayCircle, 
      color: "bg-purple-500",
      embedId: "d56wKFrtRgU"
    },
    { 
      id: 5, 
      title: "Nutrisi untuk Gigi Kuat", 
      type: "Video", 
      category: "Pencegahan", 
      duration: "4:20", 
      icon: PlayCircle, 
      color: "bg-amber-500",
      embedId: "ZpSh0sTku6o"
    },
  ];

  const categories = ["Semua", "Pencegahan", "Anak", "Dewasa", "Perawatan"];

  const filteredMaterials = filter === "Semua" 
    ? materials 
    : materials.filter(m => m.category === filter);

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button onClick={() => navigate("/")} className="rounded-full p-2 hover:bg-slate-200">
            <ChevronLeft className="h-6 w-6" />
          </button>
          <h1 className="text-2xl font-bold text-slate-900">Edukasi Kesehatan Gigi</h1>
        </div>
        <button 
          onClick={onLogout}
          className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-red-500 shadow-lg shadow-red-900/5 border border-white transition-all hover:bg-red-50 active:scale-90"
          title="Keluar"
        >
          <LogOut className="h-6 w-6" />
        </button>
      </header>

      <div className="mb-8 flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2 rounded-2xl bg-white px-4 py-2 shadow-sm border border-slate-100">
          <Filter className="h-4 w-4 text-slate-400" />
          <span className="text-sm font-bold text-slate-700">Filter:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter(cat)}
              className={cn(
                "rounded-full px-5 py-2 text-sm font-bold transition-all",
                filter === cat 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-200" 
                  : "bg-white text-slate-500 hover:bg-slate-50 border border-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((mat) => (
            <motion.div 
              key={mat.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              whileHover={{ y: -5 }}
              className="rounded-3xl bg-white p-6 shadow-sm border border-slate-100"
            >
              <div className={`mb-4 rounded-2xl p-4 text-white shadow-lg ${mat.color}`}>
                <mat.icon className="h-6 w-6" />
              </div>
              <div className="mb-2 flex items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase text-slate-500">
                  {mat.category}
                </span>
              </div>
              <h3 className="mb-2 text-lg font-bold text-slate-900">{mat.title}</h3>
              <p className="text-sm text-slate-500">{mat.type} • {mat.duration}</p>
              <button 
                onClick={() => setSelectedVideo(mat.embedId)}
                className="mt-4 flex items-center gap-2 text-sm font-bold text-blue-600"
              >
                Tonton Sekarang
                <ChevronLeft className="h-4 w-4 rotate-180" />
              </button>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Video Modal */}
      <AnimatePresence>
        {selectedVideo && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedVideo(null)}
              className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-4xl aspect-video rounded-3xl bg-black overflow-hidden shadow-2xl"
            >
              <button 
                onClick={() => setSelectedVideo(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/40 transition-all"
              >
                <X className="h-6 w-6" />
              </button>
              <iframe 
                width="100%" 
                height="100%" 
                src={`https://www.youtube.com/embed/${selectedVideo}?autoplay=1`} 
                title="YouTube video player" 
                frameBorder="0" 
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                referrerPolicy="strict-origin-when-cross-origin" 
                allowFullScreen
              ></iframe>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
