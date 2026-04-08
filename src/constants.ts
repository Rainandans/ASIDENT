export const HUMAN_NEEDS = [
  {
    id: 1,
    name: "Perlindungan dari Resiko Kesehatan",
    description: "Protection from Health Risks",
    diagnosis: "Tidak terpenuhinya kebutuhan akan perlindungan dari risiko kesehatan",
    indicators: [
      "Tanda-tanda vital di luar batas normal",
      "Adanya risiko luka/injury atau risiko terjadinya penyakit sistemik/penyakit gigi dan mulut",
      "Adanya kebutuhan pemberian pengobatan premedikasi antibiotik"
    ],
    causes: "Adanya riwayat penyakit sistemik, alergi, atau kondisi medis yang memerlukan tindakan pencegahan.",
    signs: "Riwayat medis positif, tanda vital di luar batas normal.",
    goals: "Pasien terlindungi dari resiko kesehatan selama perawatan.",
    interventions: [
      "Terapis Gigi dan Mulut (TGM) akan melakukan pengkajian ulang riwayat medis secara mendalam pada setiap kunjungan.",
      "Memastikan pasien memahami hubungan antara kesehatan sistemik dan kesehatan gigi mulut.",
      "Melakukan konsultasi dengan dokter spesialis terkait jika diperlukan sebelum tindakan.",
      "Melakukan modifikasi rencana perawatan sesuai dengan kondisi sistemik pasien.",
      "Melakukan pemantauan tanda-tanda vital secara ketat sebelum, selama, dan sesudah tindakan.",
      "Menyiapkan kit emergensi medis dan memastikan kesiapan prosedur kedaruratan."
    ],
    evaluations: "Tidak terjadi komplikasi medis selama perawatan."
  },
  {
    id: 2,
    name: "Bebas dari Ketakutan/Stress",
    description: "Freedom from Fear and Stress",
    diagnosis: "Tidak terpenuhinya kebutuhan akan bebas dari rasa takut dan stres",
    indicators: [
      "Menunjukkan ketakutan/kecemasan atas pelayanan yang akan diberikan",
      "Kebiasaan-kebiasaan buruk yang merusak kesehatan gigi dan mulut",
      "Penyalahgunaan zat berbahaya (merokok, narkoba dll)",
      "Ketidakpuasan terhadap petugas kesgilut",
      "Keringat berlebihan/menangis"
    ],
    causes: "Pengalaman buruk di masa lalu, ketakutan akan jarum suntik atau suara bor.",
    signs: "Pasien terlihat cemas, gelisah, atau menyatakan ketakutan.",
    goals: "Pasien merasa nyaman dan tenang selama perawatan.",
    interventions: [
      "TGM akan menerapkan teknik manajemen perilaku (Tell-Show-Do) untuk mengurangi kecemasan.",
      "Menjelaskan setiap prosedur yang akan dilakukan secara perlahan dan mudah dimengerti.",
      "Menciptakan lingkungan klinik yang menenangkan dan ramah pasien.",
      "Menggunakan teknik distraksi atau relaksasi selama prosedur perawatan.",
      "Memberikan kontrol kepada pasien (misal: tanda tangan jika ingin berhenti sejenak).",
      "Membangun hubungan saling percaya (rapport) dengan pasien sebelum memulai tindakan."
    ],
    evaluations: "Pasien kooperatif dan merasa tenang."
  },
  {
    id: 3,
    name: "Bebas dari Nyeri",
    description: "Freedom from Pain",
    diagnosis: "Tidak terpenuhinya kebutuhan akan bebas dari nyeri",
    indicators: [
      "Nyeri/sakit/linu/sensitif pada ekstra/intra oral",
      "Konsumsi obat penghilang rasa sakit",
      "Kesulitan pergerakan/ketegangan pada wajah, tangan atau kaki",
      "Ketidaknyamanan atau nyeri selama perawatan",
      "Cara berbicara ragu-ragu/pemenggalan kalimat",
      "Keringat berlebihan/menangis"
    ],
    causes: "Pulpitis, abses, atau gangguan TMJ.",
    signs: "Pasien mengeluh sakit gigi atau nyeri di area wajah.",
    goals: "Pasien bebas dari rasa nyeri.",
    interventions: [
      "TGM akan melakukan identifikasi sumber dan intensitas nyeri menggunakan skala nyeri.",
      "Melakukan tindakan darurat untuk meredakan nyeri (misal: trepanasi atau pembersihan kavitas).",
      "Memberikan resep obat analgetik atau antibiotik sesuai dengan wewenang dan instruksi dokter gigi.",
      "Memberikan edukasi mengenai penanganan nyeri sementara di rumah.",
      "Merujuk pasien ke dokter gigi spesialis untuk perawatan definitif sumber nyeri.",
      "Melakukan evaluasi penurunan tingkat nyeri pada kunjungan berikutnya."
    ],
    evaluations: "Pasien menyatakan rasa nyeri sudah hilang."
  },
  {
    id: 4,
    name: "Kesan Wajah yang Sehat",
    description: "Wholesome Facial Image",
    diagnosis: "Tidak terpenuhinya kebutuhan akan kesan wajah yang sehat",
    indicators: [
      "Penampilan gigi geligi, gingiva, profil wajah (gigi berjejal, tonggos, dll)",
      "Nafas (bau mulut dll)"
    ],
    causes: "Kehilangan gigi depan, diskolorasi gigi, atau maloklusi.",
    signs: "Pasien merasa kurang percaya diri dengan penampilan wajah/gigi.",
    goals: "Pasien merasa puas dengan penampilan wajah dan giginya.",
    interventions: [
      "TGM akan melakukan pengkajian terhadap persepsi pasien mengenai penampilan wajah dan giginya.",
      "Memberikan edukasi mengenai berbagai pilihan perawatan estetik yang tersedia.",
      "Melakukan pembersihan karang gigi dan noda (stain) untuk meningkatkan estetika.",
      "Merujuk ke dokter gigi spesialis untuk perawatan restoratif atau ortodontik jika diperlukan.",
      "Mendiskusikan harapan pasien dan memberikan gambaran hasil perawatan yang realistis.",
      "Memotivasi pasien untuk menjaga kebersihan mulut guna mempertahankan hasil perawatan estetik."
    ],
    evaluations: "Pasien menyatakan kepuasan terhadap estetikanya."
  },
  {
    id: 5,
    name: "Integritas Membran Mukosa pada Leher dan Kepala",
    description: "Skin and Mucous Membrane Integrity",
    diagnosis: "Tidak terpenuhinya integritas (keutuhan) jaringan kulit, mukosa dan membrane pada leher dan kepala",
    indicators: [
      "Adanya lesi/tanda-tanda pembengkakan di extra/intra oral",
      "Inflamasi gingiva",
      "Perdarahan pada waktu probing (BOP)",
      "Kedalaman saku gusi/kehilangan perlekatan klinis lebih dari 4mm",
      "Xerostomia yang dapat diikuti oleh perubahan warna abnormal pada membran mukosa",
      "Manifestasi extraoral/intraoral adanya kekurangan gizi",
      "Adanya tanda/gejala kelainan pola makan"
    ],
    causes: "Adanya lesi, sariawan, atau peradangan pada jaringan lunak.",
    signs: "Gusi berdarah, adanya ulkus, atau pembengkakan.",
    goals: "Jaringan lunak mulut kembali sehat dan utuh.",
    interventions: [
      "TGM akan melakukan pemeriksaan intraoral dan ekstraoral secara menyeluruh untuk mengidentifikasi lesi.",
      "Melakukan tindakan scaling dan root planing untuk menghilangkan faktor iritasi lokal.",
      "Memberikan instruksi pemakaian obat topikal atau obat kumur antiseptik sesuai indikasi.",
      "Memberikan edukasi mengenai teknik menyikat gigi yang benar agar tidak melukai jaringan lunak.",
      "Melakukan evaluasi penyembuhan lesi pada kunjungan berikutnya.",
      "Merujuk ke spesialis penyakit mulut jika ditemukan lesi yang mencurigakan atau tidak kunjung sembuh."
    ],
    evaluations: "Lesi sembuh, gusi tidak lagi berdarah."
  },
  {
    id: 6,
    name: "Kondisi Biologis dan Fungsi Gigi Geligi yang Baik",
    description: "Biologically Sound and Functional Dentition",
    diagnosis: "Tidak terpenuhinya kondisi dan fungsi gigi geligi yang baik",
    indicators: [
      "Kesulitan mengunyah",
      "Tambalan yang rusak",
      "Gigi dengan gejala adanya karies, abrasi, atrisi, atau erosi",
      "Gigi yang hilang",
      "Gigi tiruan yang tidak baik pemasangan/penggunaannya",
      "Penumpukan plak, kalkulus, dan atau extrinsic stain",
      "Karies aktif",
      "Asupan gula harian yang tinggi",
      "Adanya gejala gangguan pola makan/eating disorder",
      "Tidak pernah memeriksakan gigi dan mulutnya"
    ],
    causes: "Karies, gigi goyang, atau kehilangan gigi yang mengganggu fungsi kunyah.",
    signs: "Adanya lubang gigi, kalkulus, atau gigi hilang.",
    goals: "Fungsi kunyah dan kesehatan gigi kembali optimal.",
    interventions: [
      "TGM akan melakukan pemeriksaan odontogram secara detail untuk memetakan kondisi setiap gigi.",
      "Melakukan pembersihan karang gigi (scaling) secara menyeluruh.",
      "Melakukan penambalan gigi (restorasi) pada karies yang masih dalam lingkup kompetensi.",
      "Memberikan edukasi mengenai pentingnya restorasi gigi untuk mengembalikan fungsi kunyah.",
      "Merujuk pasien untuk perawatan endodontik, bedah mulut, atau pembuatan gigi tiruan.",
      "Melakukan aplikasi fluor topikal atau fissure sealant sebagai tindakan preventif."
    ],
    evaluations: "Gigi berfungsi dengan baik dan bebas karies."
  },
  {
    id: 7,
    name: "Konseptualisasi dan Pemecahan Masalah",
    description: "Conceptualization and Problem Solving",
    diagnosis: "Konseptualisasi dan pemecahan masalah",
    indicators: [
      "Adanya bukti bahwa klien masih mempunyai pertanyaan, kesalahan pemahaman atau kurangnya pengetahuan terkait dengan cara pemeliharaan, penyakit gigi, dan hubungannya dengan kesehatan umum"
    ],
    causes: "Kurangnya pengetahuan tentang penyebab penyakit gigi dan mulut.",
    signs: "Pasien bertanya-tanya atau memberikan jawaban yang salah tentang kesehatan gigi.",
    goals: "Pasien memahami kondisi dan cara menjaga kesehatan giginya.",
    interventions: [
      "TGM akan memberikan Dental Health Education (DHE) yang disesuaikan dengan tingkat pemahaman pasien.",
      "Menggunakan media visual (model gigi, gambar, video) untuk menjelaskan proses terjadinya penyakit.",
      "Melakukan demonstrasi cara menyikat gigi dan penggunaan benang gigi secara langsung.",
      "Meminta pasien untuk mendemonstrasikan ulang teknik yang telah diajarkan (re-demonstration).",
      "Memberikan kesempatan kepada pasien untuk bertanya mengenai kondisi kesehatan giginya.",
      "Memberikan leaflet atau materi edukasi tertulis untuk dipelajari pasien di rumah."
    ],
    evaluations: "Pasien dapat menjelaskan kembali dan mempraktikkan cara menjaga kebersihan mulut."
  },
  {
    id: 8,
    name: "Tanggung Jawab terhadap Kesehatan Gigi dan Mulutnya",
    description: "Responsibility for Oral Health",
    diagnosis: "Tidak terpenuhinya kebutuhan untuk bertanggung jawab terhadap kesgilut-nya sendiri",
    indicators: [
      "Ketidak mampuan dalam upaya pelihara diri kesgilut",
      "Pada kasus klien anak, adanya kelemahan dalam pemeliharaan/bantuan/pengawasan orang tua",
      "Tidak pernah melakukan pemeriksaan rutin"
    ],
    causes: "Kurangnya motivasi untuk melakukan pemeliharaan mandiri di rumah.",
    signs: "OHI-S buruk, tidak rutin kontrol ke dokter gigi.",
    goals: "Pasien berkomitmen menjaga kesehatan gigi secara mandiri.",
    interventions: [
      "TGM akan memotivasi pasien dengan menunjukkan kondisi kesehatan mulutnya saat ini (menggunakan disclosing agent).",
      "Membantu pasien menetapkan target pribadi untuk meningkatkan kebersihan mulut.",
      "Membuat jadwal kontrol rutin dan mengingatkan pasien melalui sistem notifikasi.",
      "Melibatkan keluarga atau orang terdekat untuk mendukung perubahan perilaku pasien.",
      "Memberikan apresiasi atau penguatan positif atas kemajuan yang dicapai pasien.",
      "Mendiskusikan hambatan yang dihadapi pasien dalam menjaga kebersihan mulut dan mencari solusinya bersama."
    ],
    evaluations: "Pasien menunjukkan perubahan perilaku dalam menjaga kebersihan mulut."
  }
];

export const TOOTH_CONDITIONS = [
  { code: "sou", name: "Sehat/Normal", color: "bg-green-100 border-green-500" },
  { code: "non", name: "Gigi tidak ada/tidak diketahui", color: "bg-gray-200 border-gray-400" },
  { code: "une", name: "Un-erupted", color: "bg-blue-50 border-blue-300" },
  { code: "pre", name: "Partial erupted", color: "bg-blue-100 border-blue-400" },
  { code: "imv", name: "Impacted visible", color: "bg-indigo-100 border-indigo-400" },
  { code: "ano", name: "Anomali", color: "bg-purple-100 border-purple-400" },
  { code: "dia", name: "Diastema", color: "bg-yellow-50 border-yellow-300" },
  { code: "att", name: "Atrisi", color: "bg-orange-100 border-orange-400" },
  { code: "abr", name: "Abrasi", color: "bg-orange-200 border-orange-500" },
  { code: "car", name: "Caries/Karies", color: "bg-red-100 border-red-500 text-red-700" },
  { code: "cfr", name: "Crown fracture", color: "bg-red-200 border-red-600" },
  { code: "nvt", name: "Non vital", color: "bg-black text-white border-black" },
  { code: "rrx", name: "Sisa akar", color: "bg-yellow-100 border-yellow-500" },
  { code: "mis", name: "Gigi hilang", color: "bg-gray-300 border-gray-500" },
];

export const RESTORATION_MATERIALS = [
  { code: "amf", name: "Amalgam filling" },
  { code: "gif", name: "GIC" },
  { code: "cof", name: "Composite filling" },
  { code: "fis", name: "Fissure sealant" },
  { code: "inl", name: "Inlay" },
  { code: "onl", name: "Onlay" },
];

export const RESTORATIONS = [
  { code: "fmc", name: "Full metal crown" },
  { code: "poc", name: "Porcelain crown" },
  { code: "mpc", name: "Metal porcelain crown" },
  { code: "gmc", name: "Gold metal porcelain" },
  { code: "ipx", name: "Implan" },
  { code: "rct", name: "Root canal treatment" },
  { code: "meb", name: "Metal bridge" },
  { code: "pob", name: "Porcelain bridge" },
  { code: "pon", name: "Pontic" },
  { code: "abu", name: "Gigi abutment" },
];

export const PROSTHETICS = [
  { code: "prd", name: "Partial denture" },
  { code: "fld", name: "Full denture" },
  { code: "acr", name: "Acrilic" },
];

export const DENTAL_SERVICES = [
  { id: "cons", name: "Konsultasi & Pemeriksaan", price: 50000 },
  { id: "scal", name: "Scaling (Pembersihan Karang)", price: 250000 },
  { id: "fill", name: "Penambalan Gigi (Composite)", price: 350000 },
  { id: "extr", name: "Pencabutan Gigi (Ekstraksi)", price: 300000 },
  { id: "root", name: "Perawatan Saluran Akar", price: 500000 },
  { id: "whit", name: "Pemutihan Gigi (Bleaching)", price: 1500000 },
  { id: "dent", name: "Gigi Tiruan (Denture)", price: 800000 },
  { id: "taf", name: "TAF (Topical Aplikasi Flour)", price: 100000 },
  { id: "exts", name: "Cabut Gigi Susu", price: 150000 },
];
