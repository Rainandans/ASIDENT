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

export default function App() {
  const [user, setUser] = useState<{ name: string; role: string; email?: string } | null>(null);

  // Simple auth check simulation
  useEffect(() => {
    const savedUser = localStorage.getItem("asident_user");
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (name: string, role: string, email?: string) => {
    const newUser = { name, role, email };
    setUser(newUser);
    localStorage.setItem("asident_user", JSON.stringify(newUser));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("asident_user");
  };

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
              element={user ? <AppointmentPage user={user} /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/education" 
              element={user ? <EducationPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/billing" 
              element={user && (user.role === "admin" || user.role === "pemeriksa") ? <BillingPage /> : <Navigate to="/" />} 
            />
            <Route 
              path="/notifications" 
              element={user ? <NotificationPage /> : <Navigate to="/login" />} 
            />
            <Route 
              path="/users" 
              element={user && user.role === "admin" ? <UserManagement /> : <Navigate to="/" />} 
            />
            <Route path="*" element={<Navigate to="/" />} />
          </Routes>
        </AnimatePresence>
      </div>
    </Router>
  );
}
