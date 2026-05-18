import { GoogleGenerativeAI } from "@google/generative-ai";
import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

// Standard Gemini SDK
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));

  // API Routes
  app.get("/api/ai/status", (req, res) => {
    res.json({ 
      configured: !!process.env.GEMINI_API_KEY,
      sdk: "standard",
      model: "gemini-1.5-flash"
    });
  });

  app.post("/api/ai/summary", async (req, res) => {
    const { patientData } = req.body;
    
    if (!process.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY === "") {
      return res.status(500).json({ error: "Gemini API Key missing" });
    }

    try {
      if (!patientData) {
        return res.status(400).json({ error: "Missing data" });
      }

      console.log("Generating AI summary...");

      const prompt = `
        Anda adalah seorang Terapis Gigi. Buatlah ringkasan singkat untuk pasien ${patientData.demographics?.fullName}.
        Data: ${JSON.stringify(patientData).slice(0, 5000)}
        Gunakan bahasa Indonesia yang memotivasi.
      `;

      const result = await model.generateContent(prompt);
      const text = result.response.text();

      res.json({ text });
    } catch (error: any) {
      console.error("Gemini Error:", error);
      let msg = "Gagal memproses AI.";
      if (error.message?.includes("429") || error.toString().includes("quota")) {
        msg = "Kuota harian AI habis (Daily Limit Exceeded). Hubungi pengembang atau coba lagi besok.";
      }
      res.status(500).json({ error: msg });
    }
  });

  // Vite middleware
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
