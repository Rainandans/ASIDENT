import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export async function generatePatientSummary(patientData: any) {
  const prompt = `
    Anda adalah seorang asisten terapis gigi profesional. 
    Berdasarkan data pemeriksaan berikut, buatlah ringkasan kondisi kesehatan gigi dan mulut pasien dalam bahasa Indonesia yang mudah dimengerti oleh pasien (awam).
    Sertakan:
    1. Ringkasan kondisi saat ini (OHIS, Karies, Jaringan Periodontal).
    2. Tindakan yang telah dilakukan.
    3. Rencana kunjungan berikutnya dan instruksi perawatan di rumah.
    
    Data Pasien:
    Nama: ${patientData.demographics.fullName}
    OHIS: ${patientData.ohis?.score || "N/A"}
    Masalah Utama: ${patientData.diagnosis?.map((d: any) => d.needId).join(", ") || "N/A"}
    Tindakan: ${patientData.billing?.services?.join(", ") || "N/A"}
    Kunjungan Berikutnya: ${patientData.nextVisit?.date || "N/A"}
    Rekomendasi: ${patientData.nextVisit?.recommendation || "N/A"}
    
    Format output harus ramah, profesional, dan memberikan motivasi. Gunakan poin-poin agar mudah dibaca.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
    });
    return response.text || "Maaf, ringkasan tidak dapat dihasilkan.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Maaf, ringkasan otomatis tidak dapat dibuat saat ini. Silakan hubungi terapis gigi Anda.";
  }
}
