import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import Dashboard from "./pages/Dashboard";
import AssessmentForm from "./pages/AssessmentForm";
import PatientDatabase from "./pages/PatientDatabase";
import AppointmentPage from "./pages/AppointmentPage";
import EducationPage from "./pages/EducationPage";
import BillingPage from "./pages/BillingPage";
import NotificationPage from "./pages/NotificationPage";
import UserManagement from "./pages/UserManagement";
import { useState, useEffect } from "react";
import { AnimatePresence } from "motion/react";
import { auth, db, doc, getDoc, onSnapshot } from "./lib/firebase";

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string; email?: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (firebaseUser) => {
      if (firebaseUser) {
        // Fetch role from Firestore
        const configDoc = await getDoc(doc(db, "config", "user_management"));
        let role = "pasien";
        
        if (configDoc.exists()) {
          const data = configDoc.data();
          const adminEmails = data.adminEmails || ["rainandanabilatu@gmail.com"];
          const examinerEmails = data.examinerEmails || [];
          
          if (adminEmails.includes(firebaseUser.email)) {
            role = "admin";
          } else if (examinerEmails.includes(firebaseUser.email)) {
            role = "pemeriksa";
          }
        } else if (firebaseUser.email === "rainandanabilatu@gmail.com") {
          role = "admin";
        }
        
        const userData = {
          uid: firebaseUser.uid,
          name: firebaseUser.displayName || firebaseUser.email?.split('@')[0] || "User",
          role,
          email: firebaseUser.email || ""
        };
        console.log("User Logged In:", userData);
        setUser(userData);
        localStorage.setItem("asident_user", JSON.stringify(userData));
      } else {
        setUser(null);
        localStorage.removeItem("asident_user");
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleLogin = (name: string, role: string, email?: string) => {
    const newUser = { name, role, email };
    setUser(newUser);
    localStorage.setItem("asident_user", JSON.stringify(newUser));
  };

  const handleLogout = async () => {
    await auth.signOut();
    setUser(null);
    localStorage.removeItem("asident_user");
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-slate-50 font-sans text-slate-900">
        <AnimatePresence mode="wait">
          <Routes>
            <Route 
              path="/login" 
              element={user ? <Navigate to="/" /> : <LoginPage onLogin={handleLogin} />} 
            />
            <Route 
              path="/" 
              element={user ? <Dashboard user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/assessment" 
              element={user && (user.role === "admin" || user.role === "pemeriksa") ? <AssessmentForm user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/database" 
              element={user && (user.role === "admin" || user.role === "pemeriksa") ? <PatientDatabase user={user} onLogout={handleLogout} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/appointments" 
              element={user ? <AppointmentPage user={user} onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/education" 
              element={user ? <EducationPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/billing" 
              element={user && (user.role === "admin" || user.role === "pemeriksa") ? <BillingPage onLogout={handleLogout} /> : <Navigate to="/" />} 
            />
            <Route 
              path="/notifications" 
              element={user ? <NotificationPage onLogout={handleLogout} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/users" 
              element={user && user.role === "admin" ? <UserManagement onLogout={handleLogout} /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}
