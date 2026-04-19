import { GoogleGenAI } from "@google/genai";

const API_KEY = process.env.GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey: API_KEY || "" });

export async function generatePatientSummary(patientData: any) {
  if (!API_KEY) {
    return "Layanan ringkasan AI belum dikonfigurasi. Pastikan GEMINI_API_KEY telah diatur di Pengaturan.";
  }

  const prompt = `
    Anda adalah seorang Terapis Gigi dan Mulut profesional. Tugas Anda adalah membuat ringkasan kesehatan gigi dan mulut yang RAMAH PASIEN, MOTIVASIONAL, dan MUDAH DIPAHAMI berdasarkan data pemeriksaan berikut.

    DATA PASIEN:
    - Nama: ${patientData.demographics?.fullName || "Pasien"}
    - Usia: ${patientData.demographics?.age || "-"} tahun
    - Jenis Kelamin: ${patientData.demographics?.gender === "L" ? "Laki-laki" : "Perempuan"}

    TEMUAN KLINIS UTAMA:
    1. KONDISI GIGI (Odontogram):
       ${Object.entries(patientData.odontogram || {}).map(([num, data]: [string, any]) => 
         `Gigi ${num}: ${data.condition}${data.surfaces?.length ? " pada permukaan " + data.surfaces.join(",") : ""}${data.restoration ? " (Restorasi: " + data.restoration + ")" : ""}`
       ).join("\n       ") || "Tidak ada anomali signifikan tercatat."}

    2. KONDISI GUSI & JARINGAN PENDUKUNG (Periodontal):
       ${patientData.periodontal?.teeth?.map((t: any, i: number) => {
         const issues = [];
         const toothNum = i < 16 ? (i < 8 ? 18 - i : 21 + (i - 8)) : (i < 24 ? 48 - (i - 16) : 31 + (i - 24));
         if (t.bleeding) issues.push("Berdarah (BOP)");
         if (t.pocketDeep || t.pocketShallow) issues.push("Kantong gusi dalam");
         if (t.calculus > 0) issues.push("Karang gigi (skor " + t.calculus + ")");
         if (t.attachmentLoss) issues.push("Penyusutan gusi");
         if (t.extrinsicStains > 0) issues.push("Noda gigi (stain)");
         if (t.mobility) issues.push("Gigi goyang");
         if (t.furcation) issues.push("Masalah akar (furkasi)");
         return issues.length ? `Gigi ${toothNum}: ${issues.join(", ")}` : null;
       }).filter(Boolean).join("\n       ") || "Kondisi periodontal secara umum baik."}

    3. KEBERSIHAN MULUT (OHI-S):
       - Skor Debris: ${patientData.ohis?.debrisTotal || "-"}
       - Skor Kalkulus: ${patientData.ohis?.calculusTotal || "-"}
       - Kategori: ${patientData.ohis?.index || "-"}

    DIAGNOSIS & KEBUTUHAN MANUSIA:
    ${patientData.diagnosis?.map((d: any) => `- ${d.name || d.diagnosis}`).join("\n    ") || "Dalam batas normal."}

    TINDAKAN YANG DIREKOMENDASIKAN:
    - Rencana Perawatan: ${patientData.nextVisit?.recommendation || "Pembersihan rutin dan kontrol berkala."}
    - Tanggal Kunjungan Berikutnya: ${patientData.nextVisit?.date || "Akan dijadwalkan"}

    INSTRUKSI UNTUK GENERASI:
    1. Gunakan Bahasa Indonesia yang sopan, hangat, dan memotivasi.
    2. Hindari istilah medis yang terlalu rumit, jelaskan dampaknya bagi pasien.
    3. Fokus pada: (A) Apa masalahnya, (B) Apa dampaknya jika tidak dirawat, (C) Apa solusinya, (D) Pesan penyemangat.
    4. Format ringkasan dengan poin-poin agar mudah dibaca.
    5. Berikan saran kebersihan rumah (Home Care) yang spesifik berdasarkan temuan.

    HASIL OUTPUT (Langsung ke ringkasan):
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: prompt,
    });
    
    return response.text || "Maaf, ringkasan tidak dapat dihasilkan saat ini.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Maaf, terjadi kesalahan teknis saat membuat ringkasan. Harap periksa koneksi atau coba lagi nanti.";
  }
}
