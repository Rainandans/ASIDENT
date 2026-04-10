import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { LogIn, User, ShieldCheck, Stethoscope, RefreshCw, UserPlus, Mail, Phone, Lock, ChevronRight } from "lucide-react";
import { cn } from "../lib/utils";
import { auth, googleProvider, signInWithPopup, db, doc, getDoc, createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "../lib/firebase";

interface LoginPageProps {
  onLogin: (name: string, role: string, email?: string, uid?: string) => void;
}

export default function LoginPage({ onLogin }: LoginPageProps) {
  const [isRegister, setIsRegister] = useState(false);
  const [captcha, setCaptcha] = useState("");
  const [captchaInput, setCaptchaInput] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateCaptcha = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let result = "";
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setCaptcha(result);
  };

  useEffect(() => {
    generateCaptcha();
  }, []);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      
      // Determine role from Firestore config
      const configDoc = await getDoc(doc(db, "config", "user_management"));
      let role = "pasien";
      
      if (configDoc.exists()) {
        const data = configDoc.data();
        const adminEmails = data.adminEmails || ["rainandanabilatu@gmail.com"];
        const examinerEmails = data.examinerEmails || [];
        
        if (adminEmails.includes(user.email)) {
          role = "admin";
        } else if (examinerEmails.includes(user.email)) {
          role = "pemeriksa";
        }
      } else if (user.email === "rainandanabilatu@gmail.com") {
        role = "admin";
      }
      
      onLogin(user.displayName || user.email?.split('@')[0] || "User", role, user.email || "", user.uid);
    } catch (err: any) {
      console.error("Login error:", err);
      const domain = window.location.hostname;
      if (err.code === 'auth/popup-blocked') {
        setError("Popup diblokir. Izinkan popup untuk login.");
      } else if (err.code === 'auth/cancelled-popup-request') {
        setError("Login dibatalkan.");
      } else if (err.code === 'auth/unauthorized-domain') {
        setError(`Domain ${domain} belum diizinkan di Firebase Console.`);
      } else {
        setError(`Gagal: ${err.message || "Coba lagi"}. Pastikan domain ${domain} sudah diizinkan.`);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (captchaInput.toUpperCase() !== captcha) {
      setError("Captcha salah!");
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      if (isRegister) {
        // Create new user in Firebase Auth
        const result = await createUserWithEmailAndPassword(auth, email, password);
        await updateProfile(result.user, { displayName: fullName });
        
        // Default role for new registration is always "pasien"
        onLogin(fullName, "pasien", email, result.user.uid);
      } else {
        // Sign in existing user
        const result = await signInWithEmailAndPassword(auth, email, password);
        const user = result.user;

        // Determine role from Firestore config
        const configDoc = await getDoc(doc(db, "config", "user_management"));
        let role = "pasien";
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          const adminEmails = data.adminEmails || ["rainandanabilatu@gmail.com"];
          const examinerEmails = data.examinerEmails || [];
          
          if (adminEmails.includes(user.email)) {
            role = "admin";
          } else if (examinerEmails.includes(user.email)) {
            role = "pemeriksa";
          }
        } else if (user.email === "rainandanabilatu@gmail.com") {
          role = "admin";
        }

        onLogin(user.displayName || user.email?.split('@')[0] || "User", role, user.email || "", user.uid);
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      if (err.code === 'auth/email-already-in-use') {
        setError("Email sudah terdaftar.");
      } else if (err.code === 'auth/invalid-credential') {
        setError("Email atau password salah.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password terlalu lemah (min. 6 karakter).");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Login email/password belum diaktifkan di Firebase Console.");
      } else {
        setError("Terjadi kesalahan. Silakan coba lagi.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-[radial-gradient(ellipse_at_top_left,_var(--tw-gradient-stops))] from-blue-600 via-indigo-700 to-slate-900 p-4">
      {/* Background Decorative Elements */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-400/20 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-indigo-400/20 rounded-full blur-[120px] animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-xl overflow-hidden rounded-[3rem] bg-white/90 backdrop-blur-2xl shadow-[0_32px_64px_-15px_rgba(0,0,0,0.3)] border border-white/20"
      >
        <div className="grid grid-cols-1 md:grid-cols-5">
          {/* Left Side - Branding */}
          <div className="md:col-span-2 bg-slate-900 p-8 text-white flex flex-col justify-between relative overflow-hidden">
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
            </div>
            
            <div className="relative z-10">
              <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-400 to-indigo-600 shadow-lg shadow-blue-500/20">
                <ToothIcon className="h-10 w-10 text-white" />
              </div>
              <h1 className="text-4xl font-black tracking-tighter leading-none">ASIDENT</h1>
              <p className="mt-3 text-[10px] font-black text-blue-400 uppercase tracking-[0.2em]">Aplikasi Dental Asuhan Terpadu</p>
            </div>

            <div className="relative z-10 mt-12">
              <h2 className="text-xl font-bold leading-tight">Solusi Digital untuk Kesehatan Gigi Anda.</h2>
              <p className="mt-4 text-xs text-slate-400 leading-relaxed">Daftar, buat janji temu, dan akses edukasi kesehatan gigi dalam satu genggaman.</p>
            </div>

            <div className="relative z-10 mt-8 flex gap-2">
              <div className="h-1 w-8 rounded-full bg-blue-500"></div>
              <div className="h-1 w-2 rounded-full bg-slate-700"></div>
              <div className="h-1 w-2 rounded-full bg-slate-700"></div>
            </div>
          </div>

          {/* Right Side - Form */}
          <div className="md:col-span-3 p-8 md:p-10">
            <div className="mb-8 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-black text-slate-900">{isRegister ? "Daftar Akun" : "Selamat Datang"}</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mt-1">
                  {isRegister ? "Mulai perjalanan sehatmu" : "Masuk ke akun Anda"}
                </p>
              </div>
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs font-black text-blue-600 hover:text-blue-700 transition-colors uppercase tracking-widest"
              >
                {isRegister ? "Login" : "Daftar"}
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <AnimatePresence mode="wait">
                {isRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-4 overflow-hidden"
                  >
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="text" 
                        placeholder="Nama Lengkap"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-12 pr-5 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        required
                      />
                    </div>
                    <div className="relative">
                      <Phone className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                      <input 
                        type="tel" 
                        placeholder="Nomor WhatsApp"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-12 pr-5 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                        required
                      />
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="email" 
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-12 pr-5 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  required
                />
              </div>

              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
                <input 
                  type="password" 
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 pl-12 pr-5 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  required
                />
              </div>

              <div className="flex items-center gap-3 pt-2">
                <div className="flex h-12 flex-1 items-center justify-center rounded-2xl bg-slate-100 font-mono text-xl font-black tracking-[0.5em] text-slate-800 select-none shadow-inner border border-slate-200">
                  {captcha}
                </div>
                <button 
                  type="button" 
                  onClick={generateCaptcha}
                  className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors border border-slate-200"
                >
                  <RefreshCw className="h-5 w-5" />
                </button>
              </div>

              <input 
                type="text" 
                placeholder="Konfirmasi Captcha"
                value={captchaInput}
                onChange={(e) => setCaptchaInput(e.target.value)}
                className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50/50 px-5 py-4 text-sm font-bold outline-none transition-all focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                required
              />

              {error && (
                <motion.p 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="text-center text-[10px] font-black text-red-500 uppercase tracking-widest"
                >
                  {error}
                </motion.p>
              )}

              <button 
                type="submit"
                className="group relative flex w-full items-center justify-center gap-3 overflow-hidden rounded-2xl bg-blue-600 py-5 text-sm font-black text-white shadow-xl shadow-blue-200 transition-all hover:bg-blue-700 hover:shadow-blue-300 active:scale-[0.98] uppercase tracking-[0.2em]"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
                {isRegister ? <UserPlus className="h-5 w-5" /> : <LogIn className="h-5 w-5" />}
                {isRegister ? "Buat Akun" : "Masuk Sekarang"}
                <ChevronRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </button>

              <div className="relative my-6">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-100"></div>
                </div>
                <div className="relative flex justify-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-300">
                  <span className="bg-white px-4">Atau</span>
                </div>
              </div>

              <button 
                type="button"
                onClick={handleGoogleLogin}
                disabled={isLoading}
                className="flex w-full items-center justify-center gap-3 rounded-2xl border-2 border-slate-100 bg-white py-4 text-sm font-bold text-slate-700 transition-all hover:bg-slate-50 active:scale-[0.98] shadow-sm disabled:opacity-50"
              >
                {isLoading ? (
                  <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
                ) : (
                  <svg className="h-5 w-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                  </svg>
                )}
                {isLoading ? "Menghubungkan..." : "Masuk dengan Google"}
              </button>
            </form>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

function ToothIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M12 4.5C11 3.5 9 2 6 2C3 2 1 4 1 7C1 10 2 13 4 15C3 17 3 19 3 21C3 22 4 23 5 23C6 23 7.5 22 8.5 21C9.5 22 11 23 12 23C13 23 14.5 22 15.5 21C16.5 22 18 23 19 23C20 23 21 22 21 21C21 19 21 17 20 15C22 13 23 10 23 7C23 4 21 2 18 2C15 2 13 3.5 12 4.5Z" />
    </svg>
  );
}
