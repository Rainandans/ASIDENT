import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const ai = new GoogleGenAI({ 
  apiKey: process.env.GEMINI_API_KEY || "",
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.post("/api/ai/summary", async (req, res) => {
    const { patientData } = req.body;
    
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ error: "Gemini API Key not configured" });
    }

    try {
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

      // Correct usage for @google/genai
      const response = await ai.models.generateContent({
        model: "gemini-2.0-flash", 
        contents: prompt,
      });

      res.json({ text: response.text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
