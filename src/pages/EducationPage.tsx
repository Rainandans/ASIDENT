import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  ChevronLeft, 
  PlayCircle, 
  Filter, 
  X, 
  LogOut, 
  GraduationCap, 
  ShieldCheck, 
  ExternalLink,
  Sparkles,
  ArrowRight,
  Stethoscope,
  CheckCircle2,
  Clock,
  Baby,
  Backpack,
  HeartHandshake,
  UserCheck,
  Search,
  AlertTriangle,
  Lightbulb,
  Apple
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { cn } from "../lib/utils";

interface EducationalMaterial {
  id: number;
  stageId?: number;
  stageName?: string;
  targetGroup: "balita" | "sekolah" | "ibu-hamil" | "lansia" | "umum";
  targetGroupName: string;
  title: string;
  source: string;
  sourceCategory: string; // "FKG UI" | "FKG UGM" | "FKG UNAIR" | "Kemenkes RI" | "PDGI"
  type: string;
  category: string;
  duration: string;
  color: string;
  embedId: string;
  summary: string;
  keyPoints: string[];
  actionTips?: string;
}

interface TargetGroupInfo {
  id: "all" | "balita" | "sekolah" | "ibu-hamil" | "lansia" | "alur-klinis";
  label: string;
  icon: any;
  desc: string;
  badgeColor: string;
  activeColor: string;
  guideTitle: string;
  guidePoints: string[];
  fiberFruitRecommendation: string;
}

export default function EducationPage({ user, onLogout }: { user?: any; onLogout: () => void }) {
  const navigate = useNavigate();
  const [selectedGroup, setSelectedGroup] = useState<string>("all");
  const [clinicalStageFilter, setClinicalStageFilter] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedVideo, setSelectedVideo] = useState<EducationalMaterial | null>(null);

  const targetGroups: TargetGroupInfo[] = [
    {
      id: "all",
      label: "Semua Materi",
      icon: Sparkles,
      desc: "Koleksi lengkap seluruh materi edukasi kedokteran gigi & kelompok usia",
      badgeColor: "bg-slate-100 text-slate-700",
      activeColor: "bg-slate-900 text-white shadow-slate-300",
      guideTitle: "Panduan Umum Kesehatan Gigi",
      guidePoints: [
        "Sikat gigi minimal 2 kali sehari: pagi 30 menit setelah sarapan & malam sebelum tidur.",
        "Kontrol rutin ke dokter gigi setiap 6 bulan sekali untuk pemeriksaan dan pembersihan karang gigi.",
        "Perbanyak konsumsi sayur dan buah berserat tinggi sebagai pembersih alami permukaan gigi."
      ],
      fiberFruitRecommendation: "Kombinasikan buah segar renyah (apel, bengkuang, pir) setiap hari untuk meningkatkan aliran saliva."
    },
    {
      id: "balita",
      label: "Anak Balita (0-5 th)",
      icon: Baby,
      desc: "Pencegahan karies botol susu (ECC), perawatan gusi bayi & pengenalan sikat gigi",
      badgeColor: "bg-pink-100 text-pink-700",
      activeColor: "bg-pink-600 text-white shadow-pink-200",
      guideTitle: "Pedoman Khusus Gigi Bayi & Balita (0-5 Tahun)",
      guidePoints: [
        "Hindari membiarkan anak tertidur dengan botol susu, formula, atau cairan manis di mulut (mencegah Rampant Caries / ECC).",
        "Sebelum gigi tumbuh, bersihkan gusi bayi dengan kassa steril yang dibasahi air hangat matang.",
        "Gunakan pasta gigi berfluoride seukuran sebutir beras (rice grain) untuk usia di bawah 3 tahun, dan sebutir kacang polong (pea-sized) untuk usia 3-5 tahun.",
        "Kunjungan pertama ke dokter gigi direkomendasikan saat gigi pertama muncul atau maksimal usia 1 tahun."
      ],
      fiberFruitRecommendation: "Berikan potongan buah segar bertekstur lembut-renyah (pepaya matang, apel kukus parut) sebagai pengganti biskuit manis."
    },
    {
      id: "sekolah",
      label: "Anak Sekolah (6-12 th)",
      icon: Backpack,
      desc: "Periode gigi bercampur, perlindungan gigi geraham tetap & edukasi jajan sehat",
      badgeColor: "bg-amber-100 text-amber-700",
      activeColor: "bg-amber-600 text-white shadow-amber-200",
      guideTitle: "Pedoman Gigi Anak Usia Sekolah (6-12 Tahun)",
      guidePoints: [
        "Perhatikan gigi geraham tetap pertama (Gigi 6) yang tumbuh di belakang gigi susu sekitar usia 6 tahun tanpa menggantikan gigi mana pun.",
        "Pertimbangkan aplikasi Pit & Fissure Sealant pada gigi geraham baru untuk menutup celah dalam dari kuman.",
        "Edukasi anak untuk membatasi jajan permen, minuman bersoda, atau makanan manis lengket di sekolah.",
        "Biasakan membawa botol air putih dan kumur-kumur dengan air bersih setelah mengonsumsi camilan di sekolah."
      ],
      fiberFruitRecommendation: "Jadikan buah potong (apel, jambu air, pir) sebagai bekal sekolah bergizi yang membersihkan sisa makanan pada gigi."
    },
    {
      id: "ibu-hamil",
      label: "Ibu Hamil (Maternal)",
      icon: HeartHandshake,
      desc: "Gingivitis kehamilan, penanganan erosi morning sickness & kesehatan janin",
      badgeColor: "bg-purple-100 text-purple-700",
      activeColor: "bg-purple-600 text-white shadow-purple-200",
      guideTitle: "Pedoman Kesehatan Gigi & Mulut Ibu Hamil",
      guidePoints: [
        "Perubahan hormon progesteron & estrogen meningkatkan risiko radang gusi (Pregnancy Gingivitis) dan benjolan gusi (Epulis Gravidarum).",
        "Jika mengalami mual/muntah (morning sickness), JANGAN langsung menyikat gigi karena asam lambung melunakkan enamel. Kumur air putih atau air larutan baking soda, lalu tunggu 30 menit sebelum menyikat gigi.",
        "Infeksi periodontitis berat pada ibu hamil terbukti meningkatkan risiko bayi lahir prematur & berat badan lahir rendah (BBLR).",
        "Waktu paling ideal dan aman untuk prosedur perawatan gigi adalah Trimester ke-2 kehamilan (minggu ke-14 hingga 28)."
      ],
      fiberFruitRecommendation: "Konsumsi sayuran berdaun hijau, brokoli, dan buah kaya vitamin C untuk menguatkan gusi dan jaringan penyangga gigi janin."
    },
    {
      id: "lansia",
      label: "Lansia (Geriatri)",
      icon: UserCheck,
      desc: "Mulut kering (xerostomia), karies akar, dan perawatan gigi tiruan lepasan",
      badgeColor: "bg-teal-100 text-teal-700",
      activeColor: "bg-teal-600 text-white shadow-teal-200",
      guideTitle: "Pedoman Kesehatan Gigi & Mulut Lanjut Usia (Geriatri)",
      guidePoints: [
        "Penurunan produksi saliva dan obat-obatan rutin memicu Mulut Kering (Xerostomia), meningkatkan risiko karies akar gigi (root caries).",
        "Perawatan Gigi Tiruan: Lepas gigi tiruan saat tidur malam dan rendam dalam air bersih agar mukosa gusi dapat beristirahat.",
        "Bersihkan gigi tiruan dengan sikat berbulu lembut dan sabun cair lembut; jangan gunakan pasta gigi abrasif atau air mendidih.",
        "Segera periksakan jika gigi tiruan terasa longgar atau menimbulkan luka tertusuk / sariawan (ulkus dekubitus)."
      ],
      fiberFruitRecommendation: "Sediakan sayuran kukus berserat halus dan buah berair (pepaya, semangka, melon) yang mudah dikunyah untuk merangsang produksi saliva."
    },
    {
      id: "alur-klinis",
      label: "Alur Klinis (4 Tahap)",
      icon: GraduationCap,
      desc: "Runtutan terstruktur FKG: Penyakit ➔ Pencegahan ➔ Perawatan Medis ➔ Perawatan Mandiri",
      badgeColor: "bg-blue-100 text-blue-700",
      activeColor: "bg-blue-600 text-white shadow-blue-200",
      guideTitle: "Kurikulum Klinis Terstruktur 4 Tahap",
      guidePoints: [
        "Tahap 1: Kenali penyebab dan patofisiologi penyakit karies, periodontitis, dan ulkus mukosa.",
        "Tahap 2: Terapkan prinsip Sugar Clock, perlindungan ion fluoride, dan diet ramah gigi.",
        "Tahap 3: Pahami prosedur medis restoratif: penambalan, pembersihan karang gigi (scaling), dan perawatan saluran akar.",
        "Tahap 4: Kuasai teknik modifikasi Bass untuk menyikat gigi harian serta benang gigi (flossing)."
      ],
      fiberFruitRecommendation: "Konsumsi buah dan sayur berserat tinggi di setiap akhir sesi makan untuk memicu self-cleansing alami."
    }
  ];

  const learningStages = [
    { id: 1, title: "Tahap 1: Macam Penyakit Gilut", desc: "Karies, Radang Gusi, Periodontitis, Ulkus", color: "text-rose-600 border-rose-200 bg-rose-50" },
    { id: 2, title: "Tahap 2: Pencegahan Dini", desc: "Diet Serat, Sugar Clock, Fluoridasi", color: "text-amber-600 border-amber-200 bg-amber-50" },
    { id: 3, title: "Tahap 3: Solusi Medis", desc: "Scaling, Tambal Komposit, Saluran Akar", color: "text-blue-600 border-blue-200 bg-blue-50" },
    { id: 4, title: "Tahap 4: Rawat Mandiri", desc: "Sikat Gigi Modifikasi Bass & Flossing", color: "text-emerald-600 border-emerald-200 bg-emerald-50" }
  ];

  const materials: EducationalMaterial[] = [
    // KELOMPOK: ANAK BALITA
    {
      id: 101,
      targetGroup: "balita",
      targetGroupName: "Anak Balita (0-5 Tahun)",
      title: "Mencegah Karies Gigi Botol Susu (Early Childhood Caries / ECC)",
      source: "FKG UI - Departemen Ilmu Kedokteran Gigi Anak",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran",
      category: "Kesehatan Balita",
      duration: "07:15",
      color: "bg-gradient-to-br from-pink-500 to-rose-600",
      embedId: "ZpSh0sTku6o",
      summary: "Mengulas penyebab utama lubang gigi cepat dan luas pada balita akibat tertidur sambil mengisap botol susu/formula, pola bakteri Streptococcus mutans dari orang tua, dan pencegahannya.",
      keyPoints: [
        "Jangan biarkan balita tidur malam dengan botol susu yang menempel di mulut",
        "Ganti isi botol dengan air putih matang saat anak hendak tidur",
        "Bilas mulut dengan air putih atau usap gigi setelah anak minum ASI/susu"
      ],
      actionTips: "Mulai biasakan minum susu menggunakan cangkir/gelas (sippy cup) sejak usia 1 tahun untuk mencegah genangan gula di gigi depan."
    },
    {
      id: 102,
      targetGroup: "balita",
      targetGroupName: "Anak Balita (0-5 Tahun)",
      title: "Panduan Sikat Gigi Balita & Takaran Pasta Gigi Berfluoride",
      source: "FKG UGM - Kanal Kedokteran Gigi Pediatrik",
      sourceCategory: "FKG UGM",
      type: "Video Pembelajaran",
      category: "Kesehatan Balita",
      duration: "05:50",
      color: "bg-gradient-to-br from-pink-600 to-purple-600",
      embedId: "DdVTN0bU7gI",
      summary: "Teknik menyikat gigi yang menyenangkan bagi balita, posisi kepala anak (knee-to-knee position), dan dosis pasta gigi fluoride yang aman dari risiko fluorosis.",
      keyPoints: [
        "Usia < 3 tahun: Gunakan pasta gigi sebutir beras (smear / rice-grain size)",
        "Usia 3 - 5 tahun: Gunakan pasta gigi sebutir kacang polong (pea-sized)",
        "Dampingi dan bantu anak menyikat gigi hingga usia minimal 7-8 tahun"
      ],
      actionTips: "Bernyanyilah atau gunakan lagu sikat gigi berdurasi 2 menit agar balita merasa sesi sikat gigi adalah aktivitas yang menyenangkan."
    },
    {
      id: 103,
      targetGroup: "balita",
      targetGroupName: "Anak Balita (0-5 Tahun)",
      title: "Menghentikan Kebiasaan Mengisap Jempol & Dot Berkepanjangan",
      source: "Kemenkes RI & Ikatan Dokter Gigi Anak Indonesia (IDGAI)",
      sourceCategory: "Kemenkes RI",
      type: "Video Pembelajaran",
      category: "Kesehatan Balita",
      duration: "06:10",
      color: "bg-gradient-to-br from-rose-500 to-orange-500",
      embedId: "ufM9uAPOGqM",
      summary: "Dampak buruk menghisap jempol (thumb sucking) dan dot lebih dari usia 2 tahun terhadap bentuk rahang atas yang maju (tonggos) serta gigitan terbuka (open bite).",
      keyPoints: [
        "Tekanan jempol/dot terus-menerus mengubah bentuk lengkung rahang dan langit-langit",
        "Hentikan dot secara bertahap sebelum anak berusia 2-3 tahun",
        "Beri pujian positif saat anak berhasil tidak mengisap jempol"
      ],
      actionTips: "Kunjungi dokter gigi jika kebiasaan menghisap jempol masih berlangsung di atas usia 4 tahun untuk evaluasi alat pencegah khusus."
    },

    // KELOMPOK: ANAK SEKOLAH
    {
      id: 201,
      targetGroup: "sekolah",
      targetGroupName: "Anak Usia Sekolah (6-12 Tahun)",
      title: "Mengenal Gigi Molar 1 Tetap (Gigi 6) & Periode Gigi Bercampur",
      source: "FKG UI - Departemen Kedokteran Gigi Anak",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran",
      category: "Anak Usia Sekolah",
      duration: "08:30",
      color: "bg-gradient-to-br from-amber-500 to-orange-600",
      embedId: "0kZvcu8L8Dw",
      summary: "Banyak orang tua tidak menyadari gigi geraham tetap pertama (Gigi 6) tumbuh pada usia 6 tahun tanpa tanggalnya gigi susu, sehingga sering terlambat ditambal saat berlubang.",
      keyPoints: [
        "Gigi geraham 6 tumbuh di belakang gigi susu tanpa mencabut gigi depan",
        "Gigi tetap ini menjadi kunci oklusi dan fungsi kunyah seumur hidup",
        "Segera periksa ke dokter gigi begitu gigi geraham ini erupsi sempurna"
      ],
      actionTips: "Lakukan pemeriksaan berkala di klinik gigi saat anak mulai masuk sekolah dasar untuk memetakan pertumbuhan gigi tetap."
    },
    {
      id: 202,
      targetGroup: "sekolah",
      targetGroupName: "Anak Usia Sekolah (6-12 Tahun)",
      title: "Perlindungan Pit & Fissure Sealant & Bahaya Jajan Manis di Sekolah",
      source: "FKG UNAIR - Pencegahan Karies Gigi",
      sourceCategory: "FKG UNAIR",
      type: "Video Pembelajaran",
      category: "Anak Usia Sekolah",
      duration: "06:45",
      color: "bg-gradient-to-br from-yellow-500 to-amber-600",
      embedId: "d56wKFrtRgU",
      summary: "Prosedur penutupan ceruk dalam gigi geraham dengan bahan pelapis resin (sealant) untuk mencegah kuman bersarang, serta panduan memilih jajanan ramah gigi di kantin sekolah.",
      keyPoints: [
        "Sealant melindungi 80% risiko karies pada permukaan kunyah gigi geraham anak",
        "Ganti jajan permen lengket dengan buah berserat dan air mineral",
        "Bilas mulut dengan air putih segera setelah makan camilan di sekolah"
      ],
      actionTips: "Bawakan bekal buah potong renyah seperti apel atau pir yang berfungsi sebagai pembersih alami sisa makanan di sela gigi."
    },
    {
      id: 203,
      targetGroup: "sekolah",
      targetGroupName: "Anak Usia Sekolah (6-12 Tahun)",
      title: "Teknik Sikat Gigi Berputar untuk Anak & Program Sikat Gigi Bersama",
      source: "Kemenkes RI - Usaha Kesehatan Gigi Sekolah (UKGS)",
      sourceCategory: "Kemenkes RI",
      type: "Video Pembelajaran",
      category: "Anak Usia Sekolah",
      duration: "05:15",
      color: "bg-gradient-to-br from-orange-500 to-red-600",
      embedId: "DdVTN0bU7gI",
      summary: "Demonstrasi gerakan menyikat gigi melingkar/memutar (Roll / Fones method) yang mudah ditiru anak sekolah dasar, membersihkan semua sisi gigi luar, dalam, dan permukaan kunyah.",
      keyPoints: [
        "Sikat bagian luar, dalam, dan dataran kunyah minimal 2 menit",
        "Waktu utama: pagi setelah sarapan dan malam sebelum tidur",
        "Ganti sikat gigi anak jika bulunya sudah mulai mekar atau tiap 3 bulan"
      ],
      actionTips: "Letakkan sikat gigi di tempat yang mudah dijangkau anak dan buat tabel stiker reward sikat gigi malam di rumah."
    },

    // KELOMPOK: IBU HAMIL
    {
      id: 301,
      targetGroup: "ibu-hamil",
      targetGroupName: "Ibu Hamil (Maternal)",
      title: "Pregnancy Gingivitis & Pengaruh Hormon terhadap Gusi Berdarah",
      source: "FKG UI - Departemen Periodonsia",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran",
      category: "Kesehatan Ibu Hamil",
      duration: "07:40",
      color: "bg-gradient-to-br from-purple-500 to-indigo-600",
      embedId: "ufM9uAPOGqM",
      summary: "Penjelasan ilmiah bagaimana lonjakan hormon progesteron dan estrogen meningkatkan respons peradangan gusi terhadap plak gigi, memicu gusi mudah bengkak dan berdarah.",
      keyPoints: [
        "Gusi berdarah saat hamil bukan karena kekurangan vitamin biasa, melainkan respon vaskular terhadap plak",
        "Pembersihan karang gigi (scaling) sangat aman dan dianjurkan selama kehamilan",
        "Epulis gravidarum (benjolan gusi hamil) biasanya mengecil setelah persalinan"
      ],
      actionTips: "Lakukan scaling di awal trimester ke-2 untuk menurunkan beban bakteri pada rongga mulut."
    },
    {
      id: 302,
      targetGroup: "ibu-hamil",
      targetGroupName: "Ibu Hamil (Maternal)",
      title: "Mengatasi Morning Sickness Tanpa Merusak Enamel Gigi",
      source: "FKG UNAIR - Kesehatan Gigi Ibu & Anak",
      sourceCategory: "FKG UNAIR",
      type: "Video Pembelajaran",
      category: "Kesehatan Ibu Hamil",
      duration: "06:20",
      color: "bg-gradient-to-br from-indigo-500 to-purple-700",
      embedId: "ZpSh0sTku6o",
      summary: "Asam lambung saat muntah (morning sickness) dapat mengikis enamel gigi (erosi gigi). Video ini mengajarkan trik menetralisir asam tanpa merusak gigi.",
      keyPoints: [
        "JANGAN langsung menyikat gigi setelah muntah; enamel sedang melunak akibat asam lambung",
        "Kumur dengan air putih hangat atau larutan 1 sdt baking soda dalam segelas air",
        "Tunggu minimal 30 menit sebelum menyikat gigi dengan pasta fluoride lembut"
      ],
      actionTips: "Simpan botol air putih di samping tempat tidur untuk langsung berkumur saat mengalami morning sickness."
    },
    {
      id: 303,
      targetGroup: "ibu-hamil",
      targetGroupName: "Ibu Hamil (Maternal)",
      title: "Hubungan Infeksi Gusi dengan Risiko Kelahiran Prematur & BBLR",
      source: "Kemenkes RI & POGI / PDGI",
      sourceCategory: "Kemenkes RI",
      type: "Video Pembelajaran",
      category: "Kesehatan Ibu Hamil",
      duration: "08:00",
      color: "bg-gradient-to-br from-violet-600 to-pink-600",
      embedId: "0kZvcu8L8Dw",
      summary: "Bakteri periodontitis dapat masuk ke aliran darah dan memicu pelepasan prostaglandin serta sitokin pro-inflamasi yang berpotensi memicu kontraksi dini dan bayi lahir prematur.",
      keyPoints: [
        "Menjaga kebersihan gigi selama hamil melindungi kesehatan janin dalam kandungan",
        "Trimester 2 (minggu 14-28) adalah waktu paling aman untuk perawatan gigi dokter",
        "Beri tahu dokter gigi mengenai usia kandungan dan suplemen yang sedang dikonsumsi"
      ],
      actionTips: "Jadikan pemeriksaan gigi sebagai salah satu pemeriksaan wajib antenatal care (ANC) terpadu."
    },

    // KELOMPOK: LANSIA
    {
      id: 401,
      targetGroup: "lansia",
      targetGroupName: "Lansia (Geriatri)",
      title: "Perawatan Gigi Tiruan Lepasan & Pencegahan Ulkus Dekubitus",
      source: "FKG UGM - Departemen Prostodonsia",
      sourceCategory: "FKG UGM",
      type: "Video Pembelajaran",
      category: "Kesehatan Lansia",
      duration: "07:30",
      color: "bg-gradient-to-br from-teal-500 to-emerald-700",
      embedId: "d56wKFrtRgU",
      summary: "Protokol higienitas gigi tiruan lepasan: cara membersihkan, bahaya memakai gigi tiruan saat tidur malam, dan cara mencegah luka sariawan gesekan (ulkus dekubitus).",
      keyPoints: [
        "Lepas gigi tiruan di malam hari dan rendam dalam wadah air bersih bersuhu ruang",
        "Jangan gunakan pasta gigi pemutih kasar atau air panas mendidih karena dapat merusak akrilik",
        "Jika gigi tiruan longgar atau menusuk gusi, segera konsultasi untuk relining dokter gigi"
      ],
      actionTips: "Gunakan sikat berbulu lembut khusus gigi tiruan dan bersihkan di atas baskom berisi air agar tidak pecah bila terjatuh."
    },
    {
      id: 402,
      targetGroup: "lansia",
      targetGroupName: "Lansia (Geriatri)",
      title: "Mulut Kering (Xerostomia) pada Lansia & Karies Akar Gigi",
      source: "FKG UI - Departemen Ilmu Penyakit Mulut",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran",
      category: "Kesehatan Lansia",
      duration: "08:10",
      color: "bg-gradient-to-br from-emerald-600 to-teal-700",
      embedId: "ufM9uAPOGqM",
      summary: "Dampak penuaan dan obat-obatan hipertensi/diabetes terhadap penurunan air liur, menyebabkan mulut kering, rasa terbakar, dan pembusukan pada akar gigi yang tersingkap.",
      keyPoints: [
        "Xerostomia mempermudah bakteri merusak permukaan akar gigi (akar tidak terlindung email tebal)",
        "Perbanyak minum air putih hangat dan hindari minuman berkafein berlebih",
        "Kunyah permen karet bebas gula xylitol atau gunakan pasta gigi khusus mulut kering"
      ],
      actionTips: "Konsumsi buah berserat lunak seperti semangka, pepaya, dan melon untuk membantu hidrasi alami rongga mulut."
    },
    {
      id: 403,
      targetGroup: "lansia",
      targetGroupName: "Lansia (Geriatri)",
      title: "Menjaga Fungsi Kunyah, Nutrisi Berserat & Kualitas Hidup Lansia",
      source: "PDGI - Persatuan Dokter Gigi Indonesia Cabang Geriatri",
      sourceCategory: "PDGI",
      type: "Video Pembelajaran",
      category: "Kesehatan Lansia",
      duration: "06:50",
      color: "bg-gradient-to-br from-teal-600 to-cyan-700",
      embedId: "0kZvcu8L8Dw",
      summary: "Kehilangan gigi yang tidak direhabilitasi menyebabkan gangguan pencernaan dan penurunan gizi. Pelajari cara mempertahankan gigi asli dan pilihan penggantian gigi pada lansia.",
      keyPoints: [
        "Kemampuan mengunyah yang baik berhubungan langsung dengan pencegahan demensia dan malnutrisi",
        "Konsumsi sayur kukus dan lauk bergizi yang dipotong kecil-kecil",
        "Pemeriksaan berkala tetap wajib meski memakai gigi tiruan penuh"
      ],
      actionTips: "Periksa ke dokter gigi minimal tiap 6 bulan untuk memeriksa kondisi mukosa mulut di bawah gigi tiruan."
    },

    // KELOMPOK: UMUM & ALUR KLINIS (4 TAHAP)
    { 
      id: 1, 
      stageId: 1,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 1: Penyakit Gigi & Mulut",
      title: "Mengenal Karies Gigi & Proses Terjadinya Gigi Berlubang", 
      source: "FKG UI (Fakultas Kedokteran Gigi Universitas Indonesia)",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran", 
      category: "Penyakit Gigi & Mulut", 
      duration: "08:15", 
      color: "bg-gradient-to-br from-rose-500 to-red-600",
      embedId: "ufM9uAPOGqM",
      summary: "Memahami etiologi karies, demineralisasi email akibat metabolisme karbohidrat oleh bakteri Streptococcus mutans, serta tahapan kerusakan dari email, dentin hingga nekrosis pulpa.",
      keyPoints: [
        "Proses hilangnya mineral gigi (demineralisasi) oleh asam bakteri",
        "Gejala awal: bercak putih (white spot) hingga terbentuk kavitas lubang",
        "Dampak jika karies mencapai saraf gigi: nyeri berdenyut dan abses"
      ],
      actionTips: "Segera tambal saat lubang masih kecil untuk menghindari biaya dan prosedur perawatan saluran akar yang kompleks."
    },
    { 
      id: 2, 
      stageId: 1,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 1: Penyakit Gigi & Mulut",
      title: "Gingivitis & Periodontitis: Bahaya Radang Gusi dan Gigi Goyang", 
      source: "FKG UGM (Kanal Pengetahuan Kedokteran Gigi)",
      sourceCategory: "FKG UGM",
      type: "Video Pembelajaran", 
      category: "Penyakit Gigi & Mulut", 
      duration: "06:40", 
      color: "bg-gradient-to-br from-rose-600 to-red-700",
      embedId: "0kZvcu8L8Dw",
      summary: "Menjelaskan evolusi infeksi periodontal mulai dari penumpukan kalkulus (karang gigi), radang gusi berdarah (gingivitis), hingga rusaknya tulang alveolar penyangga yang menyebabkan gigi goyang.",
      keyPoints: [
        "Karakteristik gusi sehat vs gusi bengkak dan mudah berdarah",
        "Penumpukan plak & karang gigi subgingiva merusak jaringan penyangga",
        "Pencegahan kehilangan gigi dini akibat periodontitis"
      ],
      actionTips: "Gusi yang berdarah saat menyikat gigi adalah tanda awal infeksi yang memerlukan pembersihan karang gigi profesional."
    },
    { 
      id: 3, 
      stageId: 1,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 1: Penyakit Gigi & Mulut",
      title: "Sariawan, Ulkus Dekubitus & Kelainan Mukosa Rongga Mulut", 
      source: "FKG UNAIR (Fakultas Kedokteran Gigi Universitas Airlangga)",
      sourceCategory: "FKG UNAIR",
      type: "Video Pembelajaran", 
      category: "Penyakit Gigi & Mulut", 
      duration: "07:20", 
      color: "bg-gradient-to-br from-red-500 to-rose-600",
      embedId: "d56wKFrtRgU",
      summary: "Mengidentifikasi trauma mukosa mulut yang tertusuk gigi tajam atau kawat gigi (ulkus dekubitus), sariawan rekuren, dan deteksi dini lesi mencurigakan pada rongga mulut.",
      keyPoints: [
        "Ulkus dekubitus: penyebab gesekan tepi gigi tajam atau protesa",
        "Perbedaan sariawan biasa dengan luka traumatik kronis",
        "Kapan kelainan mukosa rongga mulut harus segera diperiksa ke dokter gigi"
      ],
      actionTips: "Haluskan tepi gigi yang tajam ke dokter gigi untuk mencegah luka mukosa kronis berkepanjangan."
    },
    { 
      id: 4, 
      stageId: 2,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 2: Pencegahan Dini",
      title: "Pencegahan Karies Sejak Dini & Pola Makan Ramah Gigi (Sugar Clock)", 
      source: "FKG UI - Departemen Ilmu Kedokteran Gigi Anak",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran", 
      category: "Pencegahan", 
      duration: "06:30", 
      color: "bg-gradient-to-br from-amber-500 to-yellow-600",
      embedId: "ZpSh0sTku6o",
      summary: "Edukasi pola diet rendah kariogenik, konsep 'Sugar Clock' untuk membatasi frekuensi camilan manis, dan memberikan waktu saliva menetralisir derajat keasaman (pH) mulut.",
      keyPoints: [
        "Mengapa frekuensi makan manis lebih berbahaya dibanding jumlahnya",
        "Peran saliva dalam remineralisasi alami lapisan email gigi",
        "Pemilihan camilan ramah gigi: buah berserat, keju, dan air putih"
      ],
      actionTips: "Kumpulkan konsumsi makanan manis pada saat jam makan utama, lalu segera berkumur atau sikat gigi."
    },
    { 
      id: 5, 
      stageId: 2,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 2: Pencegahan Dini",
      title: "Peran Fluorida & Deteksi Dini Kesehatan Gigi Mulut", 
      source: "Kemenkes RI (Kementerian Kesehatan Republik Indonesia)",
      sourceCategory: "Kemenkes RI",
      type: "Video Pembelajaran", 
      category: "Pencegahan", 
      duration: "05:45", 
      color: "bg-gradient-to-br from-amber-600 to-orange-600",
      embedId: "DdVTN0bU7gI",
      summary: "Memahami bagaimana ion fluorida menguatkan email gigi menjadi fluorapatit yang tahan asam bakteri, serta anjuran skrining gigi berkala tiap 6 bulan sekali.",
      keyPoints: [
        "Fluorida topikal memperkuat pertahanan email terhadap asam",
        "Aplikasi pit & fissure sealant untuk menutup ceruk dalam gigi geraham",
        "Pemeriksaan berkala sebelum timbul keluhan sakit atau berlubang parah"
      ],
      actionTips: "Gunakan pasta gigi berfluoride setiap hari dan pertimbangkan aplikasi fluoride profesional (varnish) tiap 6 bulan."
    },
    { 
      id: 6, 
      stageId: 3,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 3: Solusi & Perawatan Medis",
      title: "Scaling Gigi: Pembersihan Karang Gigi Medis & Manfaat Periodontal", 
      source: "FKG UGM / Rumah Sakit Khusus Gigi & Mulut (RSGM)",
      sourceCategory: "FKG UGM",
      type: "Video Pembelajaran", 
      category: "Solusi & Perawatan Medis", 
      duration: "05:10", 
      color: "bg-gradient-to-br from-blue-600 to-indigo-600",
      embedId: "0kZvcu8L8Dw",
      summary: "Prosedur klinis pembersihan karang gigi (supragingiva dan subgingiva) menggunakan instrumen ultrasonic scaler profesional untuk menghentikan peradangan periodontal.",
      keyPoints: [
        "Karang gigi mengeras tidak dapat hilang hanya dengan sikat gigi",
        "Ultrasonic scaling aman dan tidak merusak lapisan enamel gigi",
        "Menghilangkan bau mulut kronis dan mencegah gusi menyusut"
      ],
      actionTips: "Lakukan scaling setiap 6 bulan sekali agar jaringan penyangga gigi tetap kokoh dan nafas segar."
    },
    { 
      id: 7, 
      stageId: 3,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 3: Solusi & Perawatan Medis",
      title: "Penambalan Komposit Estetik vs Perawatan Saluran Akar (PSA)", 
      source: "FKG UI - Departemen Konservasi Gigi",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran", 
      category: "Solusi & Perawatan Medis", 
      duration: "09:20", 
      color: "bg-gradient-to-br from-indigo-600 to-blue-700",
      embedId: "d56wKFrtRgU",
      summary: "Kapan gigi cukup dilakukan restorasi tambal sinar komposit dan kapan infeksi pulpa memerlukan perawatan saluran akar (endodontik) untuk menyelamatkan gigi asli dari pencabutan.",
      keyPoints: [
        "Penambalan estetik: mengembalikan bentuk anatomi dan fungsi kunyah",
        "Perawatan Saluran Akar: prosedur mematikan kuman dan mengisi saluran pulpa",
        "Mempertahankan gigi asli adalah prioritas sebelum opsi pencabutan"
      ],
      actionTips: "Jangan tunda menambal gigi yang mulai ngilu saat minum dingin sebelum infeksinya menembus saraf pulpa."
    },
    { 
      id: 8, 
      stageId: 3,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 3: Solusi & Perawatan Medis",
      title: "Pencabutan Gigi & Rehabilitasi Penggantian Gigi Tiruan", 
      source: "FKG UNAIR - Bedah Mulut & Maksilofasial",
      sourceCategory: "FKG UNAIR",
      type: "Video Pembelajaran", 
      category: "Solusi & Perawatan Medis", 
      duration: "07:50", 
      color: "bg-gradient-to-br from-blue-700 to-slate-800",
      embedId: "ufM9uAPOGqM",
      summary: "Indikasi pencabutan gigi berlubang parah atau sisa akar yang tidak dapat dipertahankan, penanganan luka pasca cabut, serta pentingnya gigi tiruan agar susunan gigi tidak miring/bergeser.",
      keyPoints: [
        "Instruksi pasca pencabutan gigi untuk menghindari komplikasi pendarahan",
        "Dampak ompong yang dibiarkan: gigi tetangga miring dan fungsi kunyah terganggu",
        "Pilihan rehabilitasi gigi tiruan lepasan, jembatan, atau implan gigi"
      ],
      actionTips: "Gantikan gigi yang sudah dicabut dengan gigi tiruan dalam 1-3 bulan untuk menjaga kesimetrisan wajah."
    },
    { 
      id: 9, 
      stageId: 4,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 4: Kebersihan & Perawatan Mandiri",
      title: "Teknik Menyikat Gigi yang Tepat (Metode Modifikasi Bass)", 
      source: "FKG UI & Kemenkes RI",
      sourceCategory: "FKG UI",
      type: "Video Pembelajaran", 
      category: "Kebersihan & Perawatan Mandiri", 
      duration: "05:00", 
      color: "bg-gradient-to-br from-emerald-600 to-teal-700",
      embedId: "DdVTN0bU7gI",
      summary: "Panduan praktis menyikat gigi dengan teknik Bass yang diakui secara medis: sudut bulu sikat 45 derajat di batas gusi, gerakan getar memutar lembut, durasi 2 menit, 2 kali sehari.",
      keyPoints: [
        "Posisi sikat miring 45 derajat menghadap sulkus gusi",
        "Waktu ideal: 30 menit setelah sarapan pagi dan malam sebelum tidur",
        "Gunakan sikat berbulu lembut (soft) dan ganti setiap 3 bulan sekali"
      ],
      actionTips: "Sikat gigi malam sebelum tidur adalah perlindungan terpenting karena air liur berkurang drastis saat tidur."
    },
    { 
      id: 10, 
      stageId: 4,
      targetGroup: "umum",
      targetGroupName: "Umum & Alur Klinis",
      stageName: "Tahap 4: Kebersihan & Perawatan Mandiri",
      title: "Panduan Benang Gigi (Flossing), Pembersih Lidah & Obat Kumur", 
      source: "PDGI (Persatuan Dokter Gigi Indonesia)",
      sourceCategory: "PDGI",
      type: "Video Pembelajaran", 
      category: "Kebersihan & Perawatan Mandiri", 
      duration: "04:30", 
      color: "bg-gradient-to-br from-teal-600 to-emerald-700",
      embedId: "ZpSh0sTku6o",
      summary: "Melengkapi kebersihan mulut dengan pembersihan sela gigi (flossing) untuk membersihkan plak tersembunyi, pembersihan permukaan lidah, serta pemilihan obat kumur non-alkohol.",
      keyPoints: [
        "Sikat gigi hanya membersihkan 60% permukaan gigi; benang gigi menjangkau sela gigi",
        "Membersihkan dorsum lidah dengan tongue scraper membasmi bakteri penyebab bau mulut",
        "Obat kumur sebagai pelengkap, bukan pengganti sikat gigi utama"
      ],
      actionTips: "Gunakan benang gigi setidaknya 1 kali sehari di malam hari sebelum menyikat gigi."
    }
  ];

  // Filtering logic
  const filteredMaterials = materials.filter(m => {
    // Target group filter
    if (selectedGroup === "balita" && m.targetGroup !== "balita") return false;
    if (selectedGroup === "sekolah" && m.targetGroup !== "sekolah") return false;
    if (selectedGroup === "ibu-hamil" && m.targetGroup !== "ibu-hamil") return false;
    if (selectedGroup === "lansia" && m.targetGroup !== "lansia") return false;
    if (selectedGroup === "alur-klinis" && m.targetGroup !== "umum") return false;

    // Clinical stage filter
    if (clinicalStageFilter !== null && m.stageId !== clinicalStageFilter) {
      return false;
    }

    // Search query filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = m.title.toLowerCase().includes(q);
      const matchSummary = m.summary.toLowerCase().includes(q);
      const matchSource = m.source.toLowerCase().includes(q);
      const matchGroup = m.targetGroupName.toLowerCase().includes(q);
      if (!matchTitle && !matchSummary && !matchSource && !matchGroup) {
        return false;
      }
    }

    return true;
  });

  const activeGroupInfo = targetGroups.find(g => g.id === selectedGroup) || targetGroups[0];

  return (
    <div className="min-h-screen bg-slate-50/70 p-6 md:p-10">
      {/* Header */}
      <header className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate("/")} 
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white shadow-sm border border-slate-200 text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition-all active:scale-95"
            title="Kembali ke Dashboard"
          >
            <ChevronLeft className="h-6 w-6" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <span className="rounded-lg bg-blue-100 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                Pusat Edukasi Medis
              </span>
              <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Sumber Resmi: FKG UI, FKG UGM, FKG UNAIR, Kemenkes, PDGI
              </span>
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">Edukasi Kesehatan Gigi & Mulut</h1>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate("/notifications")}
            className="hidden sm:flex items-center gap-2 rounded-2xl bg-white px-4 py-2.5 text-xs font-black text-blue-600 shadow-sm border border-slate-200 hover:bg-blue-50 transition-all"
          >
            <Apple className="h-4 w-4 text-emerald-500" />
            Pengingat Pasien
          </button>
          <button 
            onClick={onLogout}
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white text-red-500 shadow-sm border border-slate-200 transition-all hover:bg-red-50 hover:border-red-200 active:scale-95"
            title="Keluar"
          >
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      {/* Target Group Category Selector Tabs */}
      <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-4 flex flex-col md:flex-row md:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-blue-600" />
              Pilih Kelompok Sasaran Edukasi
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Materi disesuaikan dengan kebutuhan fisiologis dan tahapan usia pasien.
            </p>
          </div>
          {/* Quick Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
            <input 
              type="text" 
              placeholder="Cari materi..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full md:w-60 rounded-xl bg-slate-50 border border-slate-200 pl-9 pr-3 py-1.5 text-xs font-bold outline-none focus:border-blue-500 focus:bg-white transition-all placeholder:text-slate-400"
            />
            {searchQuery && (
              <button onClick={() => setSearchQuery("")} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Group Selector Pills */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {targetGroups.map((grp) => {
            const Icon = grp.icon;
            const isSelected = selectedGroup === grp.id;
            return (
              <button
                key={grp.id}
                onClick={() => {
                  setSelectedGroup(grp.id);
                  if (grp.id !== "alur-klinis") {
                    setClinicalStageFilter(null);
                  }
                }}
                className={cn(
                  "flex flex-col items-center justify-center p-3.5 rounded-2xl border-2 transition-all group text-center",
                  isSelected
                    ? `${grp.activeColor} ring-2 ring-blue-600/20 shadow-md`
                    : "border-slate-100 bg-slate-50/70 hover:border-blue-200 hover:bg-white text-slate-700"
                )}
              >
                <div className={cn(
                  "h-9 w-9 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110",
                  isSelected ? "bg-white/20 text-white" : "bg-white text-slate-700 border border-slate-200 shadow-sm"
                )}>
                  <Icon className="h-5 w-5" />
                </div>
                <span className="text-xs font-black tracking-tight line-clamp-1">{grp.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Group Specific Guidance Banner (Pedoman Klinis Khusus) */}
      <div className="mb-8 rounded-3xl border border-blue-100 bg-gradient-to-br from-blue-50/70 via-indigo-50/40 to-white p-6 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <span className={cn("px-2.5 py-0.5 rounded-lg text-[10px] font-black uppercase tracking-wider", activeGroupInfo.badgeColor)}>
                Pedoman Terfokus
              </span>
              <h3 className="text-base font-black text-slate-900">{activeGroupInfo.guideTitle}</h3>
            </div>
            <p className="text-xs text-slate-600 mb-4">{activeGroupInfo.desc}</p>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
              {activeGroupInfo.guidePoints.map((pt, pIdx) => (
                <div key={pIdx} className="flex items-start gap-2 rounded-xl bg-white/90 p-3 border border-blue-100 shadow-2xl shadow-blue-900/5 text-xs text-slate-700 font-semibold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                  <span className="leading-snug">{pt}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Anjuran Buah & Makanan Berserat Khusus */}
          <div className="w-full lg:w-80 rounded-2xl bg-emerald-50/90 border border-emerald-200 p-4.5 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 text-emerald-800 font-black text-xs mb-1.5">
                <Apple className="h-4 w-4 text-emerald-600" />
                Anjuran Serat Pembersih Alami:
              </div>
              <p className="text-xs text-emerald-950 font-medium leading-relaxed">
                {activeGroupInfo.fiberFruitRecommendation}
              </p>
            </div>
            <div className="mt-3 pt-2.5 border-t border-emerald-200/60 flex items-center justify-between text-[11px] font-bold text-emerald-700">
              <span>Mengunyah serat = Self-cleansing</span>
              <span className="text-emerald-900 font-black">2x sehari</span>
            </div>
          </div>
        </div>
      </div>

      {/* If Alur Klinis is selected, show the 4 stages interactive sub-filter */}
      {selectedGroup === "alur-klinis" && (
        <div className="mb-8 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-blue-600" />
              <h3 className="text-sm font-black text-slate-900">Filter Runtutan 4 Tahap Klinis:</h3>
            </div>
            {clinicalStageFilter !== null && (
              <button 
                onClick={() => setClinicalStageFilter(null)}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Lihat Semua 4 Tahap
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {learningStages.map((stg) => {
              const isSelected = clinicalStageFilter === stg.id;
              return (
                <button
                  key={stg.id}
                  onClick={() => setClinicalStageFilter(isSelected ? null : stg.id)}
                  className={cn(
                    "flex flex-col text-left p-3.5 rounded-2xl border-2 transition-all",
                    isSelected 
                      ? "border-blue-600 bg-blue-50 shadow-sm ring-2 ring-blue-600/20" 
                      : "border-slate-100 bg-slate-50 hover:bg-white hover:border-blue-200"
                  )}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn("text-[10px] font-black uppercase px-2 py-0.5 rounded-lg", stg.color)}>
                      Tahap {stg.id}
                    </span>
                    <span className="text-[10px] font-black text-slate-400">
                      {isSelected ? "Dipilih ✓" : "Pilih"}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 line-clamp-1">{stg.title}</h4>
                  <p className="text-[11px] text-slate-500 line-clamp-1">{stg.desc}</p>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Materials Results Count & Reset Filter */}
      <div className="mb-6 flex items-center justify-between">
        <p className="text-xs font-bold text-slate-500">
          Menampilkan <span className="font-black text-slate-900">{filteredMaterials.length}</span> materi edukasi terverifikasi
          {selectedGroup !== "all" && ` untuk kelompok ${activeGroupInfo.label}`}
          {searchQuery && ` dengan kata kunci "${searchQuery}"`}
        </p>
        {(selectedGroup !== "all" || clinicalStageFilter !== null || searchQuery) && (
          <button
            onClick={() => {
              setSelectedGroup("all");
              setClinicalStageFilter(null);
              setSearchQuery("");
            }}
            className="text-xs font-black text-blue-600 hover:underline flex items-center gap-1"
          >
            <X className="h-3.5 w-3.5" />
            Reset Filter
          </button>
        )}
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence mode="popLayout">
          {filteredMaterials.map((mat) => (
            <motion.div 
              key={mat.id}
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              whileHover={{ y: -4 }}
              className="flex flex-col justify-between rounded-3xl bg-white p-6 shadow-sm border border-slate-200 hover:shadow-xl hover:shadow-blue-900/5 hover:border-blue-200 transition-all"
            >
              <div>
                {/* Header Card Badges */}
                <div className="mb-3.5 flex items-center justify-between gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-xl bg-blue-50 border border-blue-100 px-2.5 py-1 text-[10px] font-black text-blue-700">
                    <ShieldCheck className="h-3.5 w-3.5 text-blue-600 shrink-0" />
                    {mat.sourceCategory}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="rounded-lg bg-slate-100 px-2 py-0.5 text-[10px] font-black text-slate-600 uppercase">
                      {mat.targetGroupName}
                    </span>
                    <span className="flex items-center gap-1 text-[11px] font-bold text-slate-400">
                      <Clock className="h-3 w-3" />
                      {mat.duration}
                    </span>
                  </div>
                </div>

                {/* Banner Thumbnail Area */}
                <div 
                  onClick={() => setSelectedVideo(mat)}
                  className={`mb-4 relative h-36 rounded-2xl p-4 text-white shadow-md cursor-pointer flex flex-col justify-between overflow-hidden group ${mat.color}`}
                >
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/25 transition-colors" />
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="rounded-lg bg-black/30 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-white">
                      {mat.category}
                    </span>
                    <PlayCircle className="h-8 w-8 text-white/90 drop-shadow group-hover:scale-110 transition-transform" />
                  </div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-semibold text-white/80 line-clamp-1">{mat.source}</p>
                    <p className="text-xs font-bold text-white drop-shadow-sm line-clamp-1">{mat.title}</p>
                  </div>
                </div>

                {/* Title & Description */}
                <h3 className="mb-2 text-base font-black text-slate-900 leading-snug">
                  {mat.title}
                </h3>
                <p className="mb-4 text-xs text-slate-500 leading-relaxed">
                  {mat.summary}
                </p>

                {/* Key Points */}
                <div className="mb-3.5 rounded-xl bg-slate-50 p-3 border border-slate-100 space-y-1.5">
                  <p className="text-[10px] font-black uppercase tracking-wider text-slate-400">Poin Kunci Edukasi:</p>
                  {mat.keyPoints.slice(0, 2).map((pt, pIdx) => (
                    <div key={pIdx} className="flex items-start gap-1.5 text-[11px] text-slate-600 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500 shrink-0 mt-0.5" />
                      <span className="line-clamp-1">{pt}</span>
                    </div>
                  ))}
                </div>

                {/* Action Tip */}
                {mat.actionTips && (
                  <div className="mb-4 rounded-xl bg-amber-50/70 p-2.5 border border-amber-200/70 flex items-start gap-2 text-[11px] text-amber-900">
                    <Lightbulb className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
                    <span className="line-clamp-2">{mat.actionTips}</span>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                <button 
                  onClick={() => setSelectedVideo(mat)}
                  className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-blue-600 py-2.5 text-xs font-black text-white hover:bg-blue-700 shadow-md shadow-blue-200 transition-all active:scale-95"
                >
                  <PlayCircle className="h-4 w-4" />
                  Tonton di Aplikasi
                </button>
                <a 
                  href={`https://www.youtube.com/watch?v=${mat.embedId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-1 rounded-xl bg-slate-100 px-3 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-200 hover:text-slate-900 transition-all"
                  title="Buka di YouTube Resmi"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {filteredMaterials.length === 0 && (
        <div className="mt-12 flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center bg-white">
          <GraduationCap className="h-12 w-12 text-slate-300 mb-3" />
          <h3 className="text-base font-black text-slate-800">Tidak ada materi yang sesuai</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">
            Coba ganti kata kunci pencarian atau pilih kelompok sasaran lain.
          </p>
          <button
            onClick={() => {
              setSelectedGroup("all");
              setClinicalStageFilter(null);
              setSearchQuery("");
            }}
            className="mt-4 rounded-xl bg-blue-600 px-5 py-2 text-xs font-black text-white hover:bg-blue-700 transition-all"
          >
            Lihat Semua Materi
          </button>
        </div>
      )}

      {/* Video Modal Player */}
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
              className="relative w-full max-w-4xl rounded-3xl bg-white overflow-hidden shadow-2xl z-10 border border-slate-200 flex flex-col max-h-[90vh]"
            >
              {/* Modal Top Bar */}
              <div className="flex items-center justify-between p-5 border-b border-slate-100 bg-slate-50">
                <div className="flex items-center gap-3">
                  <span className="rounded-xl bg-blue-100 px-3 py-1 text-xs font-black text-blue-700">
                    {selectedVideo.sourceCategory}
                  </span>
                  <div>
                    <h3 className="text-sm font-black text-slate-900 line-clamp-1">{selectedVideo.title}</h3>
                    <p className="text-[11px] text-slate-500">{selectedVideo.source} • {selectedVideo.duration} • {selectedVideo.targetGroupName}</p>
                  </div>
                </div>
                <button 
                  onClick={() => setSelectedVideo(null)}
                  className="rounded-full bg-slate-200 p-2 text-slate-600 hover:bg-red-50 hover:text-red-500 transition-all"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Responsive Video Container */}
              <div className="relative w-full aspect-video bg-black shrink-0">
                <iframe 
                  width="100%" 
                  height="100%" 
                  src={`https://www.youtube.com/embed/${selectedVideo.embedId}?autoplay=1`} 
                  title={selectedVideo.title}
                  frameBorder="0" 
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                  referrerPolicy="strict-origin-when-cross-origin" 
                  allowFullScreen
                ></iframe>
              </div>

              {/* Modal Bottom Detail */}
              <div className="p-6 bg-white space-y-4 overflow-y-auto">
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-1">Rangkuman Pembelajaran Medis:</h4>
                  <p className="text-sm text-slate-700 leading-relaxed">{selectedVideo.summary}</p>
                </div>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">Poin Penting Klinis:</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {selectedVideo.keyPoints.map((pt, idx) => (
                      <div key={idx} className="flex items-start gap-2 rounded-xl bg-slate-50 p-2.5 text-xs text-slate-700 border border-slate-100">
                        <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0 mt-0.5" />
                        <span>{pt}</span>
                      </div>
                    ))}
                  </div>
                </div>
                {selectedVideo.actionTips && (
                  <div className="rounded-2xl bg-amber-50 p-3.5 border border-amber-200 flex items-start gap-2.5 text-xs text-amber-900 font-medium">
                    <Lightbulb className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-black">Tips Praktis Pasien: </strong>
                      {selectedVideo.actionTips}
                    </div>
                  </div>
                )}
                <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                  <span className="text-xs text-slate-400 font-semibold">
                    {selectedVideo.targetGroupName} • Modul Edukasi Kedokteran Gigi Terpadu
                  </span>
                  <a 
                    href={`https://www.youtube.com/watch?v=${selectedVideo.embedId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-black text-blue-600 hover:underline"
                  >
                    Buka di YouTube Resmi
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
