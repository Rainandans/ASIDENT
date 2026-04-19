import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(API_KEY);

export async function generatePatientSummary(patientData: any) {
  if (!API_KEY) {
    return "Layanan ringkasan AI belum dikonfigurasi. Hubungi administrator untuk mengatur kunci API.";
  }

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

  const prompt = `
    Anda adalah seorang asisten terapis gigi profesional. 
    Berdasarkan data pemeriksaan berikut, buatlah ringkasan kondisi kesehatan gigi dan mulut pasien dalam bahasa Indonesia yang mudah dimengerti oleh pasien (awam).
    Sertakan:
    1. Ringkasan kondisi saat ini (OHIS, Karies, Jaringan Periodontal).
    2. Tindakan yang telah dilakukan.
    3. Rencana kunjungan berikutnya dan instruksi perawatan di rumah.
    
    Data Pasien:
    Nama: ${patientData.demographics?.fullName || "Pasien"}
    OHIS: ${patientData.ohis?.score || "N/A"}
    Masalah Utama: ${patientData.diagnosis?.map((d: any) => d.needId).join(", ") || "N/A"}
    Tindakan: ${patientData.billing?.services?.join(", ") || "N/A"}
    Kunjungan Berikutnya: ${patientData.nextVisit?.date || "N/A"}
    Rekomendasi: ${patientData.nextVisit?.recommendation || "N/A"}
    
    Format output harus ramah, profesional, dan memberikan motivasi. Gunakan poin-poin agar mudah dibaca.
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text() || "Maaf, ringkasan tidak dapat dihasilkan.";
  } catch (error) {
    console.error("Error generating summary:", error);
    return "Maaf, ringkasan otomatis tidak dapat dibuat saat ini. Harap periksa koneksi atau coba lagi nanti.";
  }
}
