import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import SignatureCanvas from "react-signature-canvas";
import { generatePatientSummary } from "../services/gemini";
import { db, collection, addDoc, getDocs, query, where, doc, updateDoc, onSnapshot } from "../lib/firebase";
import { 
  ChevronLeft, 
  ChevronRight, 
  Save, 
  User, 
  HeartPulse, 
  Stethoscope, 
  ClipboardList, 
  FileCheck,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Info,
  PenTool,
  CreditCard,
  ShieldCheck,
  Calendar,
  Activity,
  Search,
  Camera,
  X,
  LogOut,
  Sparkles,
  Printer,
  RefreshCw
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { cn } from "../lib/utils";
import { HUMAN_NEEDS, TOOTH_CONDITIONS, DENTAL_SERVICES, RESTORATION_MATERIALS, RESTORATIONS, PROSTHETICS } from "../constants";
import confetti from "canvas-confetti";

interface AssessmentFormProps {
  user: { name: string; role: string; uid?: string; email?: string };
  onLogout?: () => void;
}

const INITIAL_FORM_STATE = {
  header: {
    studentName: "",
    nim: "",
    clientId: "",
    visitDate: new Date().toISOString().split('T')[0],
  },
  demographics: {
    fullName: "",
    gender: "L",
    age: "",
    birthDate: "",
    birthPlace: "",
    religion: "",
    nationality: "Indonesia",
    occupation: "",
    address: "",
    bloodType: "",
    status: "",
    phone: "",
    dependents: { children: "", others: "" },
    tribe: "",
    weight: "",
    height: "",
    dentistName: "",
    dentistPhone: "",
    dentistAddress: "",
    doctorName: "",
    doctorPhone: "",
    doctorAddress: "",
    insurance: "",
    referral: "",
  },
  healthHistory: {
    medical: { 
      healthy: true, 
      seriousDisease: "", 
      bloodClotting: "", 
      allergies: { food: "", injection: "", meds: "", weather: "", others: "" } 
    },
    social: "",
    pharmacological: { 
      consuming: false, 
      meds: "", 
      sideEffects: "", 
      positiveEffect: "",
      doseProblem: false,
      doseExplanation: "",
      regular: false 
    },
    dental: {
      reason: "",
      concerns: { toothDamage: false, gumDisease: false, mouthSores: false, mouthCancer: false },
      xrayLast2Years: false,
      xrayType: "",
      prevExperience: false,
      prevExperienceExplanation: "",
      prevClinicOpinion: "",
      healthAffectsGeneral: "",
      symptoms: { 
        sensitive: false, jawPain: false, toothache: false, gumPain: false, 
        bleeding: false, chewingDifficulty: false, looseFilling: false,
        dryMouth: false, badBreath: false, burning: false, swelling: false, recedingGums: false
      },
      grinding: false,
      biteGuard: false,
      appearanceConcern: false,
      appearanceDetails: { yellow: false, gaps: false, stains: false, gumIssues: false, crowded: false, profile: false },
      injury: false,
      injuryExplanation: "",
      prevProcedures: { 
        calculus: false, extraction: false, rootCanal: false, gumSurgery: false, braces: false, 
        radiation: false, jawSurgery: false, headNeckPain: false, bleedingPostOp: false, others: ""
      },
      maintenance: { 
        brushFreq: "",
        brushTime: { morning: false, bath: false, beforeSleep: false, afterMeal: false },
        brushType: "Medium",
        fluoridePaste: "Ya",
        flossFreq: "Tidak Pernah",
        mouthwashFreq: "Tidak Pernah",
        tongueCleaner: false,
        brushTechnique: "",
        brushReplacement: "",
        bleedingWhenBrushing: false,
        habits: { smoking: false, coffee: false, tea: false, alcohol: false, biting: false, others: "" }
      },
      snacks: [
        { name: "Permen mint", freq: "" },
        { name: "Minuman manis", freq: "" },
        { name: "Buah kering", freq: "" },
        { name: "Minuman kaleng/botol", freq: "" },
        { name: "Permen karet", freq: "" },
        { name: "Kerupuk", freq: "" },
        { name: "Obat syrup", freq: "" },
        { name: "Keripik", freq: "" },
        { name: "Kue kering", freq: "" },
        { name: "Lain-lain", freq: "" },
      ],
      beliefs: {
        cavityRisk: "Sama seperti umumnya",
        preventionImportance: "Sangat Penting",
        canMaintain: "Ya",
        healthStatus: "Baik",
        generalHealthLink: "Ya",
        routineCheckImportance: "Sangat Penting",
        fearLevel: "Tidak Takut"
      }
    }
  },
  vitals: { bp: "", pulse: "", resp: "" },
  extraIntraOral: { 
    extra: { face: "Normal", neck: "Normal", vermilion: "Normal", parotid: "Normal", lymph: "Normal", cervical: "Normal", submental: "Normal", submandibular: "Normal", supraclavicular: "Normal" },
    intra: { labialMucosa: "Normal", labialVestibule: "Normal", anteriorGingiva: "Normal", buccalVestibule: "Normal", buccalGingiva: "Normal", tongueDorsal: "Normal", tongueVentral: "Normal", tongueLateral: "Normal", tonsils: "Normal", floorMouth: "Normal", lingualGingiva: "Normal", tonsillarPillars: "Normal", pharyngealWall: "Normal", softPalate: "Normal", uvula: "Normal", hardPalate: "Normal", palatalGingiva: "Normal", submandibularGlands: "Normal" },
    notes: ""
  },
  ohis: { 
    debris: { 16: 0, 11: 0, 26: 0, 36: 0, 31: 0, 46: 0 },
    calculus: { 16: 0, 11: 0, 26: 0, 36: 0, 31: 0, 46: 0 },
    indexTeeth: { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" }
  },
  plaqueControl: {
    surfaces: Array(128).fill(false), // 32 teeth * 4 surfaces
  },
  odontogram: {} as Record<number, { condition: string; surfaces: string[]; restoration: string; material: string }>,
  periodontal: {
    teeth: Array(32).fill(null).map(() => ({
      bleeding: false,
      calculus: 0,
      pocketShallow: false,
      pocketDeep: false,
      attachmentLoss: false,
      extrinsicStains: 0,
      mobility: false,
      furcation: false,
    })),
  },
  documentation: {
    photos: [] as string[],
  },
  diagnosis: [] as any[],
  billing: {
    services: [] as string[],
    total: 0,
    status: "PENDING"
  },
  informedConsent: { 
    patient: { name: "", age: "", address: "" },
    guardian: { name: "", age: "", address: "" },
    agreed: false, 
    witness: "",
    patientSignature: "",
    examinerSignature: ""
  },
  nextVisit: {
    date: "",
    notes: "",
    recommendation: ""
  }
};

export default function AssessmentForm({ user, onLogout }: AssessmentFormProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const [step, setStep] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isExistingPatient, setIsExistingPatient] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isAutoSaving, setIsAutoSaving] = useState(false);
  const [activePeriodontalTooth, setActivePeriodontalTooth] = useState<number | null>(null);
  const [activeOdontogramTooth, setActiveOdontogramTooth] = useState<number | null>(null);
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const totalSteps = 10;

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm({
    defaultValues: INITIAL_FORM_STATE
  });

  const patientSigRef = useRef<SignatureCanvas>(null);
  const examinerSigRef = useRef<SignatureCanvas>(null);

  const { fields: diagnosisFields, append, remove } = useFieldArray({
    control,
    name: "diagnosis"
  });

  const currentDiagnosis = watch("diagnosis");

  const formData = watch();

  const isResetting = useRef(false);

  // Handle incoming patient data from Database page
  useEffect(() => {
    if (location.state?.patientData) {
      isResetting.current = false;
      if (location.state.isEditing) {
        setEditingId(location.state.patientData.id);
        reset(location.state.patientData);
      } else {
        selectPatient(location.state.patientData);
      }
    } else if (location.state?.resetForm) {
      console.log("Resetting form for new patient...");
      isResetting.current = true;
      localStorage.removeItem("asident_assessment_draft");
      setEditingId(null);
      reset(INITIAL_FORM_STATE);
      setStep(1);
      setIsExistingPatient(false);
      setSearchTerm("");
      setSearchResults([]);
      setAiSummary("");
      setActivePeriodontalTooth(null);
      // Clear state and mark as resetting to skip draft load on next cycle
      navigate(location.pathname, { replace: true, state: {} });
      setTimeout(() => { isResetting.current = false; }, 1000);
    } else if (!isResetting.current) {
      // Load draft if exists and not in middle of a reset
      const draft = localStorage.getItem("asident_assessment_draft");
      if (draft && !editingId) {
        try {
          const parsed = JSON.parse(draft);
          // Only reset if draft actually has content
          if (parsed.demographics?.fullName || parsed.healthHistory?.dental?.reason) {
            reset(parsed);
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, [location.state]);

  // Auto-save draft
  useEffect(() => {
    // Don't save if resetting or form is effectively empty
    if (isResetting.current) return;
    if (!formData.demographics?.fullName && !formData.demographics?.phone && !formData.healthHistory?.dental?.reason) {
      return;
    }

    const timer = setTimeout(() => {
      setIsAutoSaving(true);
      localStorage.setItem("asident_assessment_draft", JSON.stringify(formData));
      setTimeout(() => setIsAutoSaving(false), 1000);
    }, 2000);

    return () => clearTimeout(timer);
  }, [formData]);

  const handleNeedChange = (index: number, needId: string) => {
    const need = HUMAN_NEEDS.find(n => n.id.toString() === needId);
    if (need) {
      setValue(`diagnosis.${index}.causes`, need.causes);
      setValue(`diagnosis.${index}.signs`, need.signs);
      setValue(`diagnosis.${index}.goals`, need.goals);
      setValue(`diagnosis.${index}.interventions`, need.interventions);
      setValue(`diagnosis.${index}.evaluations`, need.evaluations);
    }
  };

  const [isSubmitting, setIsSubmitting] = useState(false);

  const sanitizeData = (obj: any): any => {
    if (obj === null || typeof obj !== "object") return obj;
    if (Array.isArray(obj)) return obj.map(sanitizeData);
    
    return Object.fromEntries(
      Object.entries(obj)
        .filter(([_, v]) => v !== undefined && typeof v !== 'function')
        .map(([k, v]) => [k, sanitizeData(v)])
    );
  };

  const onSubmit = async (data: any) => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    
    console.log("Saving assessment started...", { user: user.name, role: user.role, isEditing: !!editingId });
    
    // Calculate final scores before saving
    const indexTeeth = data.ohis?.indexTeeth || { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" };
    const teeth = Object.values(indexTeeth);
    const dValues = teeth.map(t => Number(data.ohis?.debris?.[t as string] || 0));
    const cValues = teeth.map(t => Number(data.ohis?.calculus?.[t as string] || 0));
    const di = dValues.reduce((a, b) => a + b, 0) / 6;
    const ci = cValues.reduce((a, b) => a + b, 0) / 6;
    const ohisScore = Number((di + ci).toFixed(2));

    const surfaces = data.plaqueControl?.surfaces || [];
    const totalPlak = surfaces.filter(Boolean).length;
    const totalSurfaces = 32 * 4;
    const plaqueScore = Number(((totalPlak / totalSurfaces) * 100).toFixed(1));

    const finalData = sanitizeData({
      ...data,
      ohis: { ...data.ohis, score: ohisScore },
      plaqueControl: { ...data.plaqueControl, score: plaqueScore },
      examinerName: user.name,
      examinerUid: user.uid,
      examinerRole: user.role
    });

    try {
      if (editingId) {
        // Update existing
        console.log("Updating assessment:", editingId);
        await updateDoc(doc(db, "assessments", editingId.toString()), {
          ...finalData,
          updatedAt: new Date().toISOString()
        });
      } else {
        // Save New Assessment
        console.log("Creating new assessment document...");
        const docRef = await addDoc(collection(db, "assessments"), {
          ...finalData,
          examiner: user.name,
          createdAt: new Date().toISOString()
        });
        console.log("Assessment saved successfully with ID:", docRef.id);
      }

      // Clear draft after successful save
      localStorage.removeItem("asident_assessment_draft");

      // Generate Billing
      const selectedServices = data.billing?.services || [];
      if (selectedServices.length > 0) {
        console.log("Creating billing record...");
        const total = selectedServices.reduce((acc: number, id: string) => {
          const s = DENTAL_SERVICES.find(x => x.id === id);
          return acc + (s?.price || 0);
        }, 0);

        const newBill = sanitizeData({
          patient: data.demographics.fullName || "Pasien Umum",
          date: new Date().toISOString().split("T")[0],
          services: selectedServices.map((id: string) => DENTAL_SERVICES.find(x => x.id === id)?.name),
          total,
          status: "UNPAID",
          patientPhone: data.demographics.phone || "",
          createdAt: new Date().toISOString(),
          createdBy: user.uid,
          createdByRole: user.role
        });

        await addDoc(collection(db, "bills"), newBill);
        console.log("Billing saved.");
      }

      // Sync with Appointments if next visit is scheduled
      if (data.nextVisit?.date) {
        console.log("Scheduling follow-up appointment...");
        const nextVisitApp = sanitizeData({
          patient: data.demographics.fullName || "Pasien Umum",
          date: data.nextVisit.date,
          time: data.nextVisit.time || "09:00",
          type: "Kontrol Pasca Perawatan",
          status: "CONFIRMED",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          createdBy: user.uid,
          createdByRole: user.role,
          notes: data.nextVisit.notes || ""
        });
        
        // Check if already exists for this date/patient to avoid duplicates
        const q = query(
          collection(db, "appointments"), 
          where("patient", "==", nextVisitApp.patient),
          where("date", "==", nextVisitApp.date)
        );
        const existingApps = await getDocs(q);
        
        if (existingApps.empty) {
          await addDoc(collection(db, "appointments"), nextVisitApp);
          console.log("Appointment saved.");
        } else {
          console.log("Appointment already exists for this date, skipping.");
        }
      }

      confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ["#2563eb", "#10b981", "#6366f1"]
      });
      
      alert("Data berhasil disimpan ke database!");
      
      setTimeout(() => {
        navigate("/");
      }, 1000);
    } catch (error: any) {
      console.error("CRITICAL ERROR saving assessment:", error);
      alert(`Gagal menyimpan data: ${error.message || "Unknown error"}. Mohon hubungi admin.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    
    try {
      const assessmentsSnapshot = await getDocs(collection(db, "assessments"));
      const uniquePatients: any[] = [];
      
      assessmentsSnapshot.forEach((doc) => {
        const p = { id: doc.id, ...doc.data() } as any;
        if (!p.demographics) return;
        
        const exists = uniquePatients.find(up => up.demographics?.fullName === p.demographics?.fullName);
        if (!exists) {
          if (p.demographics.fullName.toLowerCase().includes(term.toLowerCase()) || p.demographics.phone.includes(term)) {
            uniquePatients.push(p);
          }
        }
      });
      
      setSearchResults(uniquePatients);
    } catch (error) {
      console.error("Search error:", error);
    }
  };

  const selectPatient = (patient: any) => {
    // Fill demographics and history
    setValue("demographics", patient.demographics);
    if (patient.healthHistory) {
      setValue("healthHistory", patient.healthHistory);
    }
    
    // Reset clinical fields for new visit (Pemeriksaan Objektif)
    setEditingId(null);
    setValue("header.visitDate", new Date().toISOString().split('T')[0]);
    setValue("vitals", { bp: "", pulse: "", resp: "" });
    setValue("extraIntraOral", { 
      extra: { face: "Normal", neck: "Normal", vermilion: "Normal", parotid: "Normal", lymph: "Normal", cervical: "Normal", submental: "Normal", submandibular: "Normal", supraclavicular: "Normal" },
      intra: { labialMucosa: "Normal", labialVestibule: "Normal", anteriorGingiva: "Normal", buccalVestibule: "Normal", buccalGingiva: "Normal", tongueDorsal: "Normal", tongueVentral: "Normal", tongueLateral: "Normal", tonsils: "Normal", floorMouth: "Normal", lingualGingiva: "Normal", tonsillarPillars: "Normal", pharyngealWall: "Normal", softPalate: "Normal", uvula: "Normal", hardPalate: "Normal", palatalGingiva: "Normal", submandibularGlands: "Normal" },
      notes: ""
    });
    setValue("ohis", { 
      debris: { 16: 0, 11: 0, 26: 0, 36: 0, 31: 0, 46: 0 },
      calculus: { 16: 0, 11: 0, 26: 0, 36: 0, 31: 0, 46: 0 },
      indexTeeth: { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" }
    });
    setValue("plaqueControl.surfaces", Array(128).fill(false));
    setValue("odontogram", {});
    setValue("periodontal", {
      teeth: Array(32).fill(null).map(() => ({
        bleeding: false,
        calculus: 0,
        pocketShallow: false,
        pocketDeep: false,
        attachmentLoss: false,
        extrinsicStains: 0,
        mobility: false,
        furcation: false,
      })),
    });
    setValue("diagnosis", []);
    setValue("billing", { services: [], total: 0, status: "PENDING" });
    setValue("informedConsent", { 
      patient: { name: patient.demographics?.fullName || "", age: patient.demographics?.age || "", address: patient.demographics?.address || "" },
      guardian: { name: "", age: "", address: "" },
      agreed: false, 
      witness: "",
      patientSignature: "",
      examinerSignature: ""
    });
    setValue("nextVisit", { date: "", notes: "", recommendation: "" });
    
    setIsExistingPatient(true);
    setSearchResults([]);
    setSearchTerm("");
  };

  const steps = [
    { id: 1, title: "Demografi", icon: User },
    { id: 2, title: "Riw. Kesehatan", icon: HeartPulse },
    { id: 3, title: "Riw. Dental", icon: Stethoscope },
    { id: 4, title: "Extra/Intra Oral", icon: Stethoscope },
    { id: 5, title: "OHIS & Plaque", icon: ClipboardList },
    { id: 6, title: "Odontogram", icon: HeartPulse },
    { id: 7, title: "Periodontal", icon: Activity },
    { id: 8, title: "Diagnosis", icon: ClipboardList },
    { id: 9, title: "Next Visit & Consent", icon: FileCheck },
    { id: 10, title: "Billing", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-50/50 via-slate-50 to-indigo-50/50 pb-20">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4 no-print shadow-sm">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="rounded-2xl p-2 hover:bg-slate-100 text-slate-500 transition-all active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-black text-slate-900 tracking-tight">
                  {editingId ? "Edit Rekam Medis" : "Pemeriksaan Baru"}
                </h1>
                {!editingId && step === 1 && (
                  <button 
                    onClick={() => {
                      if (confirm("Apakah Anda yakin ingin menghapus data yang sedang diisi dan mulai dari awal secara kosong?")) {
                        isResetting.current = true;
                        localStorage.removeItem("asident_assessment_draft");
                        reset(INITIAL_FORM_STATE);
                        setStep(1);
                        setIsExistingPatient(false);
                        setSearchTerm("");
                        setSearchResults([]);
                        setAiSummary("");
                        setActivePeriodontalTooth(null);
                        setTimeout(() => { isResetting.current = false; }, 1000);
                      }
                    }}
                    className="flex items-center gap-1 rounded-lg bg-white px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-red-50 hover:text-red-500 transition-all border border-slate-200 shadow-sm"
                  >
                    <Plus className="h-3 w-3" />
                    MULAI BARU (KOSONGKAN)
                  </button>
                )}
              </div>
              <div className="flex items-center gap-2">
                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest">ASIDENT • {user.name}</p>
                {isAutoSaving && !editingId && (
                  <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 animate-pulse">
                    <Save className="h-3 w-3" />
                    Auto-saving...
                  </span>
                )}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {steps.map((s) => (
              <div 
                key={s.id}
                title={s.title}
                className={cn(
                  "h-1.5 w-6 rounded-full transition-all duration-500",
                  step >= s.id ? "bg-blue-600 shadow-[0_0_10px_rgba(37,99,235,0.3)]" : "bg-slate-200"
                )}
              />
            ))}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={onLogout}
              className="flex items-center gap-2 rounded-xl bg-red-50 px-4 py-2 text-xs font-black text-red-500 hover:bg-red-100 transition-all uppercase tracking-widest"
            >
              <LogOut className="h-4 w-4" />
              Keluar
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl p-6">
        <form 
          onSubmit={(e) => e.preventDefault()} 
          onKeyDown={(e) => e.key === 'Enter' && e.preventDefault()}
        >
          <AnimatePresence mode="wait">
            {/* Step 1: Demografi */}
            {step === 1 && (
              <motion.div 
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
                  <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
                  <div className="relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Pasien Saat Ini</p>
                    <h3 className="text-3xl font-black tracking-tight">{watch("demographics.fullName") || "Belum Diisi"}</h3>
                  </div>
                  <div className="text-right relative z-10">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Tanggal Pengisian</p>
                    <h3 className="text-xl font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
                  </div>
                </div>

                <SectionHeader title="Data Demografi" icon={User} />
                
                {/* Patient Search Section */}
                <div className="rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                  <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
                    <div className="flex-1">
                      <label className="mb-2 block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Cari Pasien Lama (Database)</label>
                      <div className="relative group">
                        <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
                        <input 
                          type="text" 
                          value={searchTerm}
                          onChange={(e) => handleSearch(e.target.value)}
                          placeholder="Masukkan nama atau nomor HP pasien..."
                          className="w-full rounded-2xl border-2 border-slate-100 bg-slate-50 py-4 pl-12 pr-4 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                        />
                      </div>
                      
                      {searchResults.length > 0 && (
                        <div className="absolute z-30 mt-2 w-full max-w-md overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-2xl">
                          {searchResults.map((p, i) => (
                            <button
                              key={i}
                              type="button"
                              onClick={() => selectPatient(p)}
                              className="flex w-full items-center justify-between border-b border-slate-50 p-4 text-left hover:bg-blue-50 transition-colors"
                            >
                              <div>
                                <p className="font-bold text-slate-900">{p.demographics?.fullName || "Tanpa Nama"}</p>
                                <p className="text-xs text-slate-500">{p.demographics?.phone} • {p.demographics?.age} Thn</p>
                              </div>
                              <Plus className="h-4 w-4 text-blue-500" />
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "flex items-center gap-2 rounded-2xl border-2 px-6 py-4 transition-all",
                        isExistingPatient ? "border-blue-600 bg-blue-50 text-blue-600" : "border-slate-100 bg-slate-50 text-slate-400"
                      )}>
                        <CheckCircle2 className={cn("h-5 w-5", isExistingPatient ? "text-blue-600" : "text-slate-300")} />
                        <span className="text-[10px] font-black uppercase tracking-widest">Pasien Lama</span>
                      </div>
                      {isExistingPatient && (
                        <button
                          type="button"
                          onClick={() => setStep(4)}
                          className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-[10px] font-black uppercase tracking-[0.2em] text-white shadow-xl hover:bg-slate-800 transition-all active:scale-95"
                        >
                          Lanjut Pemeriksaan
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  <InputGroup label="Nama Lengkap" register={register("demographics.fullName")} placeholder="Masukkan nama pasien..." />
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">Jenis Kelamin</label>
                    <select {...register("demographics.gender")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                      <option value="L">Laki-laki</option>
                      <option value="P">Perempuan</option>
                    </select>
                  </div>
                  <InputGroup label="Umur (Tahun)" register={register("demographics.age")} type="number" />
                  <InputGroup label="Tanggal Lahir" register={register("demographics.birthDate")} type="date" />
                  <InputGroup label="Tempat Lahir" register={register("demographics.birthPlace")} />
                  <InputGroup label="Agama" register={register("demographics.religion")} />
                  <InputGroup label="Bangsa" register={register("demographics.nationality")} />
                  <InputGroup label="Suku/Adat" register={register("demographics.tribe")} />
                  <InputGroup label="Pekerjaan" register={register("demographics.occupation")} />
                  <InputGroup label="Gol. Darah" register={register("demographics.bloodType")} />
                  <InputGroup label="Status" register={register("demographics.status")} />
                  <InputGroup label="No Telpon" register={register("demographics.phone")} />
                  <InputGroup label="Tanggungan Anak" register={register("demographics.dependents.children")} />
                  <InputGroup label="Tanggungan Lain" register={register("demographics.dependents.others")} />
                  <InputGroup label="Berat Badan (Kg)" register={register("demographics.weight")} type="number" />
                  <InputGroup label="Tinggi Badan (cm)" register={register("demographics.height")} type="number" />
                  <InputGroup label="Nama Drg" register={register("demographics.dentistName")} />
                  <InputGroup label="No Tlp Drg" register={register("demographics.dentistPhone")} />
                  <InputGroup label="Nama Dokter" register={register("demographics.doctorName")} />
                  <InputGroup label="No Tlp Dokter" register={register("demographics.doctorPhone")} />
                  <InputGroup label="Asuransi Kesehatan" register={register("demographics.insurance")} />
                  <InputGroup label="Sumber Rujukan" register={register("demographics.referral")} />
                  <div className="md:col-span-3">
                    <InputGroup label="Alamat Lengkap" register={register("demographics.address")} isTextArea />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 2: Riwayat Kesehatan Medis */}
            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Riwayat Medis (Medical History)" icon={HeartPulse} />
                  <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <CheckboxGroup label="Pasien merasa dalam keadaan sehat" register={register("healthHistory.medical.healthy")} />
                    <InputGroup label="Penyakit serius, operasi, atau rawat inap (5 tahun terakhir)" register={register("healthHistory.medical.seriousDisease")} isTextArea />
                    <InputGroup label="Kelainan pembekuan darah" register={register("healthHistory.medical.bloodClotting")} />
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputGroup label="Alergi Makanan" register={register("healthHistory.medical.allergies.food")} />
                      <InputGroup label="Alergi Obat Suntik" register={register("healthHistory.medical.allergies.injection")} />
                      <InputGroup label="Alergi Obat-obatan" register={register("healthHistory.medical.allergies.meds")} />
                      <InputGroup label="Alergi Cuaca" register={register("healthHistory.medical.allergies.weather")} />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Riwayat Sosial & Farmakologi" icon={ClipboardList} />
                  <div className="mt-6 space-y-4 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <InputGroup label="Riwayat Sosial (Social History)" register={register("healthHistory.social")} isTextArea />
                    <div className="border-t border-slate-100 pt-4">
                      <CheckboxGroup label="Sedang/pernah mengkonsumsi obat-obatan?" register={register("healthHistory.pharmacological.consuming")} />
                      <InputGroup label="Jenis/Nama Obat & Untuk Apa" register={register("healthHistory.pharmacological.meds")} />
                      <InputGroup label="Efek Samping" register={register("healthHistory.pharmacological.sideEffects")} />
                      <InputGroup label="Pengaruh Positif" register={register("healthHistory.pharmacological.positiveEffect")} />
                      <CheckboxGroup label="Ada masalah dengan dosis?" register={register("healthHistory.pharmacological.doseProblem")} />
                      <InputGroup label="Jelaskan Masalah Dosis" register={register("healthHistory.pharmacological.doseExplanation")} />
                      <CheckboxGroup label="Mengkonsumsi obat secara teratur?" register={register("healthHistory.pharmacological.regular")} />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 3: Riwayat Dental (Dental History) */}
            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="I. Riwayat Dental (Dental History)" icon={Stethoscope} />
                  <div className="mt-6 space-y-6 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <InputGroup label="1. Alasan utama kunjungan" register={register("healthHistory.dental.reason")} isTextArea />
                    
                    <div className="space-y-3">
                      <label className="text-sm font-bold text-slate-700">2. Hal yang ingin diketahui saat ini:</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
                        <CheckboxGroup label="Kerusakan gigi" register={register("healthHistory.dental.concerns.toothDamage")} />
                        <CheckboxGroup label="Penyakit gusi" register={register("healthHistory.dental.concerns.gumDisease")} />
                        <CheckboxGroup label="Luka jaringan" register={register("healthHistory.dental.concerns.mouthSores")} />
                        <CheckboxGroup label="Kanker mulut" register={register("healthHistory.dental.concerns.mouthCancer")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <CheckboxGroup label="3. Pernah rontgen gigi 2 tahun terakhir?" register={register("healthHistory.dental.xrayLast2Years")} />
                      <InputGroup label="Tipe Rontgen" register={register("healthHistory.dental.xrayType")} />
                    </div>

                    <div className="space-y-4 border-t border-slate-100 pt-4">
                      <CheckboxGroup label="4. Pernah punya pengalaman tidak menyenangkan saat perawatan gigi?" register={register("healthHistory.dental.prevExperience")} />
                      {watch("healthHistory.dental.prevExperience") && (
                        <InputGroup label="Jelaskan Pengalaman" register={register("healthHistory.dental.prevExperienceExplanation")} isTextArea />
                      )}
                      
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">5. Pendapat Anda tentang kunjungan klinik gigi sebelumnya</label>
                        <select {...register("healthHistory.dental.prevClinicOpinion")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="">Pilih...</option>
                          <option value="sangat cemas/takut">Sangat cemas/takut</option>
                          <option value="agak cemas/takut">Agak cemas/takut</option>
                          <option value="tidak penting sama sekali">Tidak penting sama sekali</option>
                          <option value="antusias menantikan kunjungan berikutnya">Antusias menantikan kunjungan berikutnya</option>
                        </select>
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">6. Apakah kesehatan mulut mempengaruhi kesehatan umum Anda?</label>
                        <select {...register("healthHistory.dental.healthAffectsGeneral")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="">Pilih...</option>
                          <option value="sangat setuju">Sangat setuju</option>
                          <option value="setuju">Setuju</option>
                          <option value="tidak setuju">Tidak setuju</option>
                          <option value="sangat tidak setuju">Sangat tidak setuju</option>
                        </select>
                      </div>
                    </div>

                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="text-sm font-bold text-slate-700">7. Apakah Anda merasakan gejala berikut?</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <CheckboxGroup label="Gigi Sensitif" register={register("healthHistory.dental.symptoms.sensitive")} />
                        <CheckboxGroup label="Nyeri Rahang" register={register("healthHistory.dental.symptoms.jawPain")} />
                        <CheckboxGroup label="Sakit Gigi" register={register("healthHistory.dental.symptoms.toothache")} />
                        <CheckboxGroup label="Gusi Sakit" register={register("healthHistory.dental.symptoms.gumPain")} />
                        <CheckboxGroup label="Gusi Berdarah" register={register("healthHistory.dental.symptoms.bleeding")} />
                        <CheckboxGroup label="Sulit Mengunyah" register={register("healthHistory.dental.symptoms.chewingDifficulty")} />
                        <CheckboxGroup label="Tambalan Lepas" register={register("healthHistory.dental.symptoms.looseFilling")} />
                        <CheckboxGroup label="Mulut Kering" register={register("healthHistory.dental.symptoms.dryMouth")} />
                        <CheckboxGroup label="Bau Mulut" register={register("healthHistory.dental.symptoms.badBreath")} />
                        <CheckboxGroup label="Rasa Terbakar" register={register("healthHistory.dental.symptoms.burning")} />
                        <CheckboxGroup label="Bengkak" register={register("healthHistory.dental.symptoms.swelling")} />
                        <CheckboxGroup label="Gusi Menyusut" register={register("healthHistory.dental.symptoms.recedingGums")} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4 border-t border-slate-100 pt-4 md:grid-cols-2">
                      <CheckboxGroup label="8. Kebiasaan menggeretakkan gigi (grinding)?" register={register("healthHistory.dental.grinding")} />
                      {watch("healthHistory.dental.grinding") && (
                        <CheckboxGroup label="9. Menggunakan pelindung rahang (bite guard)?" register={register("healthHistory.dental.biteGuard")} />
                      )}
                      <CheckboxGroup label="10. Khawatir dengan penampilan gigi?" register={register("healthHistory.dental.appearanceConcern")} />
                      {watch("healthHistory.dental.appearanceConcern") && (
                        <div className="col-span-2 grid grid-cols-2 gap-2 md:grid-cols-3">
                          <CheckboxGroup label="Gigi Kuning" register={register("healthHistory.dental.appearanceDetails.yellow")} />
                          <CheckboxGroup label="Ada Celah" register={register("healthHistory.dental.appearanceDetails.gaps")} />
                          <CheckboxGroup label="Noda/Stain" register={register("healthHistory.dental.appearanceDetails.stains")} />
                          <CheckboxGroup label="Masalah Gusi" register={register("healthHistory.dental.appearanceDetails.gumIssues")} />
                          <CheckboxGroup label="Gigi Berjejal" register={register("healthHistory.dental.appearanceDetails.crowded")} />
                          <CheckboxGroup label="Profil Wajah" register={register("healthHistory.dental.appearanceDetails.profile")} />
                        </div>
                      )}
                      <CheckboxGroup label="11. Pernah cedera pada wajah/rahang/gigi?" register={register("healthHistory.dental.injury")} />
                      {watch("healthHistory.dental.injury") && (
                        <InputGroup label="Jelaskan Cedera" register={register("healthHistory.dental.injuryExplanation")} isTextArea />
                      )}
                    </div>

                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="text-sm font-bold text-slate-700">12. Apakah anda pernah mengalami/menggunakan hal hal berikut?</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <CheckboxGroup label="Karang gigi" register={register("healthHistory.dental.prevProcedures.calculus")} />
                        <CheckboxGroup label="Pencabutan gigi" register={register("healthHistory.dental.prevProcedures.extraction")} />
                        <CheckboxGroup label="Perawatan saluran akar" register={register("healthHistory.dental.prevProcedures.rootCanal")} />
                        <CheckboxGroup label="Operasi gusi" register={register("healthHistory.dental.prevProcedures.gumSurgery")} />
                        <CheckboxGroup label="Kawat gigi (Behel)" register={register("healthHistory.dental.prevProcedures.braces")} />
                        <CheckboxGroup label="Terapi radiasi kepala/leher" register={register("healthHistory.dental.prevProcedures.radiation")} />
                        <CheckboxGroup label="Operasi rahang" register={register("healthHistory.dental.prevProcedures.jawSurgery")} />
                        <CheckboxGroup label="Rasa sakit kepala/leher" register={register("healthHistory.dental.prevProcedures.headNeckPain")} />
                        <CheckboxGroup label="Pendarahan lama pasca cabut" register={register("healthHistory.dental.prevProcedures.bleedingPostOp")} />
                        <CheckboxGroup label="Lain-lain" register={register("healthHistory.dental.prevProcedures.others")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="II. Pemeliharaan Kesehatan Gigi dan Mulut" icon={ClipboardList} />
                  <div className="mt-6 space-y-6 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InputGroup label="1. Berapa kali menyikat gigi sehari?" register={register("healthHistory.dental.maintenance.brushFreq")} />
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">2. Kapan waktu menyikat gigi?</label>
                        <div className="grid grid-cols-2 gap-2">
                          <CheckboxGroup label="Pagi hari" register={register("healthHistory.dental.maintenance.brushTime.morning")} />
                          <CheckboxGroup label="Saat mandi" register={register("healthHistory.dental.maintenance.brushTime.bath")} />
                          <CheckboxGroup label="Sebelum tidur" register={register("healthHistory.dental.maintenance.brushTime.beforeSleep")} />
                          <CheckboxGroup label="Setelah makan" register={register("healthHistory.dental.maintenance.brushTime.afterMeal")} />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">3. Jenis sikat gigi yang digunakan?</label>
                        <select {...register("healthHistory.dental.maintenance.brushType")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Soft">Soft (Lunak)</option>
                          <option value="Medium">Medium (Sedang)</option>
                          <option value="Hard">Hard (Keras)</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">4. Menggunakan pasta gigi mengandung fluor?</label>
                        <select {...register("healthHistory.dental.maintenance.fluoridePaste")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Ya">Ya</option>
                          <option value="Tidak">Tidak</option>
                          <option value="Tidak Tahu">Tidak Tahu</option>
                        </select>
                      </div>
                      <InputGroup label="5. Seberapa sering menggunakan benang gigi (floss)?" register={register("healthHistory.dental.maintenance.flossFreq")} />
                      <InputGroup label="6. Seberapa sering menggunakan obat kumur?" register={register("healthHistory.dental.maintenance.mouthwashFreq")} />
                      <CheckboxGroup label="7. Apakah Anda menggunakan pembersih lidah?" register={register("healthHistory.dental.maintenance.tongueCleaner")} />
                      <InputGroup label="8. Bagaimana teknik menyikat gigi Anda?" register={register("healthHistory.dental.maintenance.brushTechnique")} />
                      <InputGroup label="9. Berapa lama sekali Anda mengganti sikat gigi?" register={register("healthHistory.dental.maintenance.brushReplacement")} />
                      <CheckboxGroup label="10. Apakah gusi berdarah saat menyikat gigi?" register={register("healthHistory.dental.maintenance.bleedingWhenBrushing")} />
                    </div>
                    <div className="space-y-3 border-t border-slate-100 pt-4">
                      <label className="text-sm font-bold text-slate-700">11. Kebiasaan lain yang dilakukan:</label>
                      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                        <CheckboxGroup label="Merokok" register={register("healthHistory.dental.maintenance.habits.smoking")} />
                        <CheckboxGroup label="Minum Kopi" register={register("healthHistory.dental.maintenance.habits.coffee")} />
                        <CheckboxGroup label="Minum Teh" register={register("healthHistory.dental.maintenance.habits.tea")} />
                        <CheckboxGroup label="Alkohol" register={register("healthHistory.dental.maintenance.habits.alcohol")} />
                        <CheckboxGroup label="Menggigit Benda" register={register("healthHistory.dental.maintenance.habits.biting")} />
                        <InputGroup label="Lainnya" register={register("healthHistory.dental.maintenance.habits.others")} />
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="III. Cemilan diantara waktu makan" icon={Activity} />
                  <div className="mt-6 space-y-4 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-2">Daftar Cemilan & Frekuensi</p>
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                      {(watch("healthHistory.dental.snacks") || []).map((snack: any, index: number) => (
                        <div key={index} className="flex items-center gap-4 rounded-2xl bg-slate-50 p-4 border border-slate-100 hover:border-blue-200 hover:bg-white transition-all group">
                          <span className="flex-1 text-sm font-bold text-slate-700 group-hover:text-blue-600 transition-colors">{snack.name}</span>
                          <select 
                            {...register(`healthHistory.dental.snacks.${index}.freq` as any)}
                            className="rounded-xl border-2 border-slate-100 bg-white px-4 py-2 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                          >
                            <option value="">Pilih Frekuensi...</option>
                            <option value="Jarang">Jarang</option>
                            <option value="Kadang-kadang">Kadang-kadang</option>
                            <option value="Sering">Sering</option>
                            <option value="Sangat Sering">Sangat Sering</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="IV. Keyakinan tentang Kesehatan Gigi dan Mulut" icon={ShieldCheck} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">1. Bagaimana risiko Anda terkena lubang gigi?</label>
                        <select {...register("healthHistory.dental.beliefs.cavityRisk")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Rendah">Rendah</option>
                          <option value="Sama seperti umumnya">Sama seperti umumnya</option>
                          <option value="Tinggi">Tinggi</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">2. Seberapa penting pencegahan bagi Anda?</label>
                        <select {...register("healthHistory.dental.beliefs.preventionImportance")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Sangat Penting">Sangat Penting</option>
                          <option value="Penting">Penting</option>
                          <option value="Kurang Penting">Kurang Penting</option>
                          <option value="Tidak Penting">Tidak Penting</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">3. Apakah Anda yakin bisa menjaga kesehatan gigi sendiri?</label>
                        <select {...register("healthHistory.dental.beliefs.canMaintain")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Ya">Ya</option>
                          <option value="Mungkin">Mungkin</option>
                          <option value="Tidak">Tidak</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">4. Bagaimana status kesehatan gigi Anda saat ini?</label>
                        <select {...register("healthHistory.dental.beliefs.healthStatus")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Sangat Baik">Sangat Baik</option>
                          <option value="Baik">Baik</option>
                          <option value="Cukup">Cukup</option>
                          <option value="Buruk">Buruk</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">5. Apakah kesehatan gigi berhubungan dengan kesehatan umum?</label>
                        <select {...register("healthHistory.dental.beliefs.generalHealthLink")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Ya">Ya</option>
                          <option value="Tidak">Tidak</option>
                          <option value="Tidak Tahu">Tidak Tahu</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">6. Seberapa penting pemeriksaan rutin?</label>
                        <select {...register("healthHistory.dental.beliefs.routineCheckImportance")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Sangat Penting">Sangat Penting</option>
                          <option value="Penting">Penting</option>
                          <option value="Tidak Penting">Tidak Penting</option>
                        </select>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-slate-700">7. Tingkat ketakutan terhadap perawatan gigi?</label>
                        <select {...register("healthHistory.dental.beliefs.fearLevel")} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all">
                          <option value="Tidak Takut">Tidak Takut</option>
                          <option value="Sedikit Takut">Sedikit Takut</option>
                          <option value="Takut">Takut</option>
                          <option value="Sangat Takut">Sangat Takut</option>
                        </select>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 4: Pemeriksaan Fisik (Extra & Intra Oral) */}
            {step === 4 && (
              <motion.div 
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Tanda-tanda Vital" icon={Activity} />
                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-3 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <InputGroup label="Tekanan Darah (mmHg)" register={register("vitals.bp")} placeholder="120/80" />
                    <InputGroup label="Denyut Nadi (BPM)" register={register("vitals.pulse")} placeholder="80" />
                    <InputGroup label="Pernafasan (RPM)" register={register("vitals.resp")} placeholder="20" />
                  </div>
                </div>

                <div>
                  <SectionHeader title="Pemeriksaan Ekstra Oral" icon={Stethoscope} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {[
                        { id: "face", label: "Wajah" },
                        { id: "neck", label: "Leher" },
                        { id: "vermilion", label: "Batas Vermilion" },
                        { id: "parotid", label: "Kelenjar Parotis" },
                        { id: "lymph", label: "Kelenjar Limfe" },
                        { id: "cervical", label: "Servikal" },
                        { id: "submental", label: "Submental" },
                        { id: "submandibular", label: "Submandibular" },
                        { id: "supraclavicular", label: "Supraclavicular" }
                      ].map(field => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">{field.label}</label>
                          <select {...register(`extraIntraOral.extra.${field.id}` as any)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all">
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                            <option value="Tidak Diperiksa">Tidak Diperiksa</option>
                          </select>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Pemeriksaan Intra Oral" icon={Stethoscope} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
                      {[
                        { id: "labialMucosa", label: "Mukosa Labial" },
                        { id: "labialVestibule", label: "Vestibulum Labial" },
                        { id: "anteriorGingiva", label: "Gingiva Anterior" },
                        { id: "buccalVestibule", label: "Vestibulum Bukal" },
                        { id: "buccalGingiva", label: "Gingiva Bukal" },
                        { id: "tongueDorsal", label: "Dorsum Lidah" },
                        { id: "tongueVentral", label: "Ventral Lidah" },
                        { id: "tongueLateral", label: "Lateral Lidah" },
                        { id: "tonsils", label: "Tonsil" },
                        { id: "floorMouth", label: "Dasar Mulut" },
                        { id: "lingualGingiva", label: "Gingiva Lingual" },
                        { id: "tonsillarPillars", label: "Pilar Tonsil" },
                        { id: "pharyngealWall", label: "Dinding Faring" },
                        { id: "softPalate", label: "Palatum Lunak" },
                        { id: "uvula", label: "Uvula" },
                        { id: "hardPalate", label: "Palatum Keras" },
                        { id: "palatalGingiva", label: "Gingiva Palatal" },
                        { id: "submandibularGlands", label: "Kelenjar Submandibular" }
                      ].map(field => (
                        <div key={field.id} className="space-y-1">
                          <label className="text-xs font-bold text-slate-700">{field.label}</label>
                          <select {...register(`extraIntraOral.intra.${field.id}` as any)} className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-2 text-sm outline-none focus:border-blue-500 focus:bg-white transition-all">
                            <option value="Normal">Normal</option>
                            <option value="Abnormal">Abnormal</option>
                            <option value="Tidak Diperiksa">Tidak Diperiksa</option>
                          </select>
                        </div>
                      ))}
                    </div>
                    <div className="border-t border-slate-100 pt-4">
                      <InputGroup label="Catatan Tambahan Pemeriksaan" register={register("extraIntraOral.notes")} isTextArea />
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 5: OHIS & Plaque Control */}
            {step === 5 && (
              <motion.div 
                key="step5"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Oral Hygiene Index (OHI-S)" icon={ClipboardList} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5">
                    <div className="mb-6 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-3">Pilih Gigi Indeks (Jika gigi utama tidak ada)</p>
                      <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                        {[
                          { pos: "16/17", key: "tooth1" },
                          { pos: "11/21", key: "tooth2" },
                          { pos: "26/27", key: "tooth3" },
                          { pos: "36/37", key: "tooth4" },
                          { pos: "31/41", key: "tooth5" },
                          { pos: "46/47", key: "tooth6" },
                        ].map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <label className="text-[8px] font-black text-slate-400 uppercase">{item.pos}</label>
                            <select 
                              {...register(`ohis.indexTeeth.${item.key}` as any)}
                              className="w-full rounded-lg border border-slate-200 bg-white px-2 py-1 text-[10px] font-bold outline-none focus:border-blue-500"
                            >
                              {item.pos.split('/').map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">Debris Index (DI)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {["tooth1", "tooth2", "tooth3", "tooth4", "tooth5", "tooth6"].map((key) => {
                            const tooth = watch(`ohis.indexTeeth.${key}` as any) || (key === "tooth1" ? "16" : key === "tooth2" ? "11" : key === "tooth3" ? "26" : key === "tooth4" ? "36" : key === "tooth5" ? "31" : "46");
                            return <InputGroup key={key} label={`Gigi ${tooth}`} register={register(`ohis.debris.${tooth}` as any)} type="number" step="0.1" />;
                          })}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">Calculus Index (CI)</h4>
                        <div className="grid grid-cols-3 gap-4">
                          {["tooth1", "tooth2", "tooth3", "tooth4", "tooth5", "tooth6"].map((key) => {
                            const tooth = watch(`ohis.indexTeeth.${key}` as any) || (key === "tooth1" ? "16" : key === "tooth2" ? "11" : key === "tooth3" ? "26" : key === "tooth4" ? "36" : key === "tooth5" ? "31" : "46");
                            return <InputGroup key={key} label={`Gigi ${tooth}`} register={register(`ohis.calculus.${tooth}` as any)} type="number" step="0.1" />;
                          })}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between p-8 rounded-2xl bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-100 shadow-inner">
                      <div>
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Hasil Akhir OHI-S</p>
                        <p className="text-4xl font-black text-blue-700 tracking-tighter">
                          {(() => {
                            const indexTeeth = watch("ohis.indexTeeth" as any) || { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" };
                            const teeth = Object.values(indexTeeth);
                            const dValues = teeth.map(t => Number(watch(`ohis.debris.${t}` as any) || 0));
                            const cValues = teeth.map(t => Number(watch(`ohis.calculus.${t}` as any) || 0));
                            const di = dValues.reduce((a, b) => a + b, 0) / 6;
                            const ci = cValues.reduce((a, b) => a + b, 0) / 6;
                            return (di + ci).toFixed(1);
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">Kriteria</p>
                        <p className="text-2xl font-black text-blue-800">
                          {(() => {
                            const indexTeeth = watch("ohis.indexTeeth" as any) || { tooth1: "16", tooth2: "11", tooth3: "26", tooth4: "36", tooth5: "31", tooth6: "46" };
                            const teeth = Object.values(indexTeeth);
                            const dValues = teeth.map(t => Number(watch(`ohis.debris.${t}` as any) || 0));
                            const cValues = teeth.map(t => Number(watch(`ohis.calculus.${t}` as any) || 0));
                            const di = dValues.reduce((a, b) => a + b, 0) / 6;
                            const ci = cValues.reduce((a, b) => a + b, 0) / 6;
                            const total = di + ci;
                            if (total <= 1.2) return "BAIK";
                            if (total <= 3.0) return "SEDANG";
                            return "BURUK";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Plaque Control (Plaque Index)" icon={ClipboardList} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5 overflow-x-auto">
                    <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-2 min-w-[800px]">
                       {Array.from({ length: 32 }).map((_, i) => {
                         const toothNum = i < 16 ? (i < 8 ? 18 - i : 21 + (i - 8)) : (i < 24 ? 48 - (i - 16) : 31 + (i - 24));
                         return (
                           <div key={toothNum} className="flex flex-col items-center gap-1">
                             <span className="text-[10px] font-bold text-slate-400">{toothNum}</span>
                             <div className="relative h-10 w-10 border border-slate-200 rounded-sm overflow-hidden bg-slate-50">
                               {[
                                 { id: 0, label: "B", clip: "polygon(0 0, 100% 0, 50% 50%)", pos: "top-0 left-0 w-full h-1/2" }, // Buccal
                                 { id: 1, label: "L", clip: "polygon(0 100%, 100% 100%, 50% 50%)", pos: "bottom-0 left-0 w-full h-1/2" }, // Lingual
                                 { id: 2, label: "M", clip: "polygon(0 0, 0 100%, 50% 50%)", pos: "top-0 left-0 w-1/2 h-full" }, // Mesial
                                 { id: 3, label: "D", clip: "polygon(100% 0, 100% 100%, 50% 50%)", pos: "top-0 right-0 w-1/2 h-full" } // Distal
                               ].map(surface => (
                                 <button
                                   key={surface.id}
                                   type="button"
                                   onClick={() => {
                                     const current = (watch("plaqueControl.surfaces") || [])[i * 4 + surface.id];
                                     const newSurfaces = [...(watch("plaqueControl.surfaces") || Array(128).fill(false))];
                                     newSurfaces[i * 4 + surface.id] = !current;
                                     setValue("plaqueControl.surfaces", newSurfaces);
                                   }}
                                   style={{ clipPath: surface.clip }}
                                   className={cn(
                                     "absolute transition-all border-none outline-none",
                                     surface.pos,
                                     (watch("plaqueControl.surfaces") || [])[i * 4 + surface.id] ? "bg-red-500" : "bg-transparent hover:bg-slate-200"
                                   )}
                                 />
                               ))}
                               {/* Lines for X shape */}
                               <div className="absolute inset-0 pointer-events-none">
                                 <svg className="h-full w-full" viewBox="0 0 100 100">
                                   <line x1="0" y1="0" x2="100" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
                                   <line x1="100" y1="0" x2="0" y2="100" stroke="currentColor" strokeWidth="0.5" className="text-slate-300" />
                                 </svg>
                               </div>
                             </div>
                           </div>
                         );
                       })}
                    </div>
                    
                    <div className="flex items-center justify-between p-8 rounded-2xl bg-gradient-to-br from-red-50 to-orange-50 border border-red-100 shadow-inner">
                      <div>
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Skor Plak</p>
                        <p className="text-4xl font-black text-red-700 tracking-tighter">
                          {(() => {
                            const surfaces = watch("plaqueControl.surfaces") || [];
                            const totalPlak = surfaces.filter(Boolean).length;
                            const totalSurfaces = 32 * 4;
                            return ((totalPlak / totalSurfaces) * 100).toFixed(1) + "%";
                          })()}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-black text-red-600 uppercase tracking-[0.2em]">Kategori</p>
                        <p className="text-2xl font-black text-red-800">
                          {(() => {
                            const surfaces = watch("plaqueControl.surfaces") || [];
                            const totalPlak = surfaces.filter(Boolean).length;
                            const totalSurfaces = 32 * 4;
                            const score = (totalPlak / totalSurfaces) * 100;
                            return score < 15 ? "BAIK" : "BURUK";
                          })()}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 6: Odontogram */}
            {step === 6 && (
              <motion.div 
                key="step6"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                <SectionHeader title="Odontogram Terpadu" icon={HeartPulse} />
                
                <div className="rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5 overflow-x-auto">
                  <div className="mb-8 flex flex-wrap gap-2 justify-center max-w-4xl mx-auto">
                    {TOOTH_CONDITIONS.map(cond => (
                      <div key={cond.code} className="flex items-center gap-2 rounded-full border border-slate-100 bg-white px-3 py-1 text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm transition-all hover:bg-slate-50 cursor-default">
                        <div className={cn("h-2.5 w-2.5 rounded-full border shadow-sm", cond.color)} />
                        {cond.name}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-12 min-w-[850px] py-10">
                    {/* Upper Jaw */}
                    <div className="space-y-6">
                      <h4 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rahang Atas (Upper Jaw)</h4>
                      <div className="flex justify-center gap-1.5">
                        {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((num) => (
                          <ToothButton 
                            key={num} 
                            num={num} 
                            data={formData.odontogram?.[num]} 
                            isActive={activeOdontogramTooth === num}
                            onToggle={() => setActiveOdontogramTooth(activeOdontogramTooth === num ? null : num)}
                          />
                        ))}
                      </div>
                      <div className="flex justify-center gap-1.5">
                        {[55, 54, 53, 52, 51, 61, 62, 63, 64, 65].map((num) => (
                          <ToothButton 
                            key={num} 
                            num={num} 
                            data={formData.odontogram?.[num]} 
                            isPrimary 
                            isActive={activeOdontogramTooth === num}
                            onToggle={() => setActiveOdontogramTooth(activeOdontogramTooth === num ? null : num)}
                          />
                        ))}
                      </div>
                    </div>

                    {/* Lower Jaw */}
                    <div className="space-y-6">
                      <div className="flex justify-center gap-1.5">
                        {[85, 84, 83, 82, 81, 71, 72, 73, 74, 75].map((num) => (
                          <ToothButton 
                            key={num} 
                            num={num} 
                            data={formData.odontogram?.[num]} 
                            isPrimary 
                            isActive={activeOdontogramTooth === num}
                            onToggle={() => setActiveOdontogramTooth(activeOdontogramTooth === num ? null : num)}
                          />
                        ))}
                      </div>
                      <div className="flex justify-center gap-1.5">
                        {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((num) => (
                          <ToothButton 
                            key={num} 
                            num={num} 
                            data={formData.odontogram?.[num]} 
                            isActive={activeOdontogramTooth === num}
                            onToggle={() => setActiveOdontogramTooth(activeOdontogramTooth === num ? null : num)}
                          />
                        ))}
                      </div>
                      <h4 className="text-center text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Rahang Bawah (Lower Jaw)</h4>
                    </div>
                  </div>

                  {/* Singular Odontogram Modal */}
                  <AnimatePresence>
                    {activeOdontogramTooth !== null && (() => {
                      const num = activeOdontogramTooth;
                      const currentData = formData.odontogram?.[num] || { condition: "sou", surfaces: [], restoration: "", material: "" };
                      const conditionCode = currentData.condition || "sou";

                      const handleSurfaceToggle = (surface: string) => {
                        const surfaces = Array.isArray(currentData.surfaces) ? [...currentData.surfaces] : [];
                        const idx = surfaces.indexOf(surface);
                        if (idx > -1) surfaces.splice(idx, 1);
                        else surfaces.push(surface);
                        setValue(`odontogram.${num}` as any, { ...currentData, surfaces });
                      };

                      const setField = (field: string, value: any) => {
                        setValue(`odontogram.${num}` as any, { ...currentData, [field]: value });
                      };

                      return (
                        <>
                          <motion.div 
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
                            onClick={() => setActiveOdontogramTooth(null)}
                          />
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
                            animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                            exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
                            style={{ top: "50%", left: "50%" }}
                            className="fixed -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)] border border-white/20 z-[110] max-h-[90vh] overflow-y-auto scrollbar-hide"
                          >
                            <div className="flex items-center justify-between mb-8 border-b border-slate-50 pb-4">
                              <div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Odontogram</p>
                                <h5 className="text-2xl font-black text-slate-900 leading-none">Gigi {num}</h5>
                              </div>
                              <button 
                                onClick={() => setActiveOdontogramTooth(null)}
                                className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-slate-100 text-slate-400 transition-all active:scale-95"
                              >
                                <X className="h-5 w-5" />
                              </button>
                            </div>

                            <div className="space-y-8">
                              {/* Condition Select */}
                              <section>
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                                  Kondisi Gigi
                                </h6>
                                <div className="grid grid-cols-2 gap-2">
                                  {TOOTH_CONDITIONS.map(c => (
                                    <button
                                      key={c.code}
                                      onClick={() => setField("condition", c.code)}
                                      className={cn(
                                        "p-3 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all",
                                        conditionCode === c.code 
                                          ? "border-blue-600 bg-blue-50 text-blue-700 shadow-md" 
                                          : "border-slate-50 bg-slate-50 text-slate-400 hover:border-slate-200"
                                      )}
                                    >
                                      {c.name}
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* Surface Select */}
                              <section>
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                                  Permukaan (Surfaces)
                                </h6>
                                <div className="flex flex-wrap gap-2">
                                  {["M", "O", "D", "V", "L"].map(s => (
                                    <button
                                      key={s}
                                      onClick={() => handleSurfaceToggle(s)}
                                      className={cn(
                                        "h-12 w-12 rounded-2xl text-xs font-black transition-all border-2",
                                        currentData.surfaces?.includes(s)
                                          ? "bg-emerald-600 text-white border-emerald-600 shadow-lg scale-110" 
                                          : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                      )}
                                    >
                                      {s}
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* Material Select */}
                              <section>
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500" />
                                  Bahan Restorasi (Filling)
                                </h6>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setField("material", "")}
                                    className={cn(
                                      "p-3 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all",
                                      !currentData.material 
                                        ? "border-slate-900 bg-slate-900 text-white" 
                                        : "border-slate-50 bg-slate-50 text-slate-400"
                                    )}
                                  >
                                    None
                                  </button>
                                  {RESTORATION_MATERIALS.map(m => (
                                    <button
                                      key={m.code}
                                      onClick={() => setField("material", m.code)}
                                      className={cn(
                                        "p-3 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all",
                                        currentData.material === m.code 
                                          ? "border-amber-600 bg-amber-50 text-amber-700 shadow-md" 
                                          : "border-slate-50 bg-slate-50 text-slate-400"
                                      )}
                                    >
                                      {m.name}
                                    </button>
                                  ))}
                                </div>
                              </section>

                              {/* Restoration/Prosthetic Select */}
                              <section>
                                <h6 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                                  <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                                  Restorasi / Protesa
                                </h6>
                                <div className="grid grid-cols-2 gap-2">
                                  <button
                                    onClick={() => setField("restoration", "")}
                                    className={cn(
                                      "p-3 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all",
                                      !currentData.restoration 
                                        ? "border-slate-900 bg-slate-900 text-white" 
                                        : "border-slate-50 bg-slate-50 text-slate-400"
                                    )}
                                  >
                                    None
                                  </button>
                                  {[...RESTORATIONS, ...PROSTHETICS].map(r => (
                                    <button
                                      key={r.code}
                                      onClick={() => setField("restoration", r.code)}
                                      className={cn(
                                        "p-3 rounded-2xl text-[10px] font-black uppercase text-left border-2 transition-all",
                                        currentData.restoration === r.code 
                                          ? "border-purple-600 bg-purple-50 text-purple-700 shadow-md" 
                                          : "border-slate-50 bg-slate-50 text-slate-400"
                                      )}
                                    >
                                      {r.name}
                                    </button>
                                  ))}
                                </div>
                              </section>
                              
                              <button 
                                type="button"
                                onClick={() => setActiveOdontogramTooth(null)}
                                className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                              >
                                Selesai
                              </button>
                            </div>
                          </motion.div>
                        </>
                      );
                    })()}
                  </AnimatePresence>
                </div>
              </motion.div>
            )}

            {/* Step 7: Periodontal Examination */}
            {step === 7 && (
              <motion.div 
                key="step7"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Pemeriksaan Periodontal" icon={Activity} />
                  <div className="mt-6 space-y-8 rounded-[2rem] bg-white p-8 border border-slate-100 shadow-xl shadow-blue-900/5 overflow-x-auto">
                    <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 min-w-[1000px]">
                      <div className="lg:col-span-9 space-y-8">
                        <div className="flex items-center justify-between bg-slate-50 p-4 rounded-2xl border border-slate-100">
                          <div className="flex gap-6">
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-red-500 animate-pulse" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">BOP</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-purple-500" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Pocket &gt; 4mm</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-orange-500" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Att. Loss &gt; 1mm</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-yellow-600" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Stains</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="h-3 w-3 rounded-full bg-slate-700" />
                              <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider">Calculus Score</span>
                            </div>
                          </div>
                          <p className="text-[10px] font-bold text-blue-600 bg-blue-50 px-3 py-1 rounded-full border border-blue-100">Hover gigi untuk mengisi data</p>
                        </div>

                        <div className="grid grid-cols-[repeat(16,minmax(0,1fr))] gap-4">
                          {Array.from({ length: 32 }).map((_, i) => {
                            const toothNum = i < 16 ? (i < 8 ? 18 - i : 21 + (i - 8)) : (i < 24 ? 48 - (i - 16) : 31 + (i - 24));
                            const toothData = formData.periodontal?.teeth?.[i] || {
                              bleeding: false, calculus: 0, pocketShallow: false, pocketDeep: false, attachmentLoss: false, extrinsicStains: 0, mobility: false, furcation: false
                            };

                            return (
                              <div key={i} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400">{toothNum}</span>
                                <div className="relative">
                                  <div 
                                    onClick={() => setActivePeriodontalTooth(activePeriodontalTooth === i ? null : i)}
                                    className={cn(
                                      "h-16 w-12 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                                      (toothData.bleeding || (toothData.calculus as number) > 0 || toothData.pocketShallow || toothData.pocketDeep || (toothData.extrinsicStains as number) > 0 || toothData.attachmentLoss || toothData.mobility || toothData.furcation) 
                                        ? "border-blue-500 bg-blue-50/50 shadow-md scale-105" 
                                        : "border-slate-100 bg-slate-50 hover:border-blue-200"
                                    )}
                                  >
                                    <div className="relative h-full w-full flex items-center justify-center">
                                      {((toothData.calculus as number) > 0 || (toothData.extrinsicStains as number) > 0) && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-white z-10 shadow-md border-2 border-white">
                                          {Number(toothData.calculus || 0) + Number(toothData.extrinsicStains || 0)}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-3 p-1">
                                        <div className="flex items-start justify-start">
                                          {toothData.bleeding && <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />}
                                        </div>
                                        <div className="flex items-start justify-end">
                                          {(toothData.pocketShallow || toothData.pocketDeep) && <div className="h-2 w-2 rounded-full bg-purple-500" />}
                                        </div>
                                        <div className="flex items-center justify-start">
                                          {toothData.mobility && <div className="h-2 w-2 rounded-full bg-red-800" />}
                                        </div>
                                        <div className="flex items-center justify-end">
                                          {toothData.furcation && <div className="h-2 w-2 rounded-full bg-blue-800" />}
                                        </div>
                                        <div className="flex items-end justify-start">
                                          {toothData.attachmentLoss && <div className="h-2 w-2 rounded-full bg-orange-500" />}
                                        </div>
                                        <div className="flex items-end justify-end">
                                          {Number(toothData.extrinsicStains || 0) > 0 && <div className="h-2 w-2 rounded-full bg-yellow-600" />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Centered Modal for Periodontal Data - Singular outside loop */}
                        <AnimatePresence>
                          {activePeriodontalTooth !== null && (() => {
                            const i = activePeriodontalTooth;
                            const toothNum = i < 16 ? (i < 8 ? 18 - i : 21 + (i - 8)) : (i < 24 ? 48 - (i - 16) : 31 + (i - 24));
                            const toothData = formData.periodontal?.teeth?.[i] || {
                              bleeding: false, calculus: 0, pocketShallow: false, pocketDeep: false, attachmentLoss: false, extrinsicStains: 0, mobility: false, furcation: false
                            };

                            return (
                              <>
                                <motion.div 
                                  initial={{ opacity: 0 }}
                                  animate={{ opacity: 1 }}
                                  exit={{ opacity: 0 }}
                                  className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[100]" 
                                  onClick={() => setActivePeriodontalTooth(null)}
                                />
                                <motion.div 
                                  initial={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
                                  animate={{ opacity: 1, scale: 1, y: 0, x: "-50%" }}
                                  exit={{ opacity: 0, scale: 0.9, y: 20, x: "-50%" }}
                                  style={{ top: "50%", left: "50%" }}
                                  className="fixed -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-[2.5rem] bg-white p-8 shadow-[0_30px_100px_rgba(0,0,0,0.4)] border border-white/20 z-[110] max-h-[90vh] overflow-y-auto scrollbar-hide"
                                >
                                  <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-50">
                                    <div>
                                      <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-1">DATA PERIODONTAL</p>
                                      <h5 className="text-2xl font-black text-slate-900 leading-none">Gigi {toothNum}</h5>
                                    </div>
                                    <button 
                                      onClick={() => setActivePeriodontalTooth(null)}
                                      className="h-10 w-10 flex items-center justify-center rounded-2xl bg-slate-50 hover:bg-red-50 hover:text-red-500 text-slate-400 transition-all active:scale-95"
                                    >
                                      <X className="h-5 w-5" />
                                    </button>
                                  </div>
                                  
                                  <div className="space-y-6">
                                    <div className="space-y-2">
                                      <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Kondisi Klinis</p>
                                      {[
                                        { id: "bleeding", label: "BOP (Bleeding)", color: "text-red-500", bg: "bg-red-50", icon: "🔴" },
                                        { id: "pocketShallow", label: "Pocket > 4mm", color: "text-purple-500", bg: "bg-purple-50", icon: "🟣" },
                                        { id: "attachmentLoss", label: "Att. Loss > 1mm", color: "text-orange-500", bg: "bg-orange-50", icon: "🟠" },
                                        { id: "mobility", label: "Kegoyangan (Mobility)", color: "text-red-800", bg: "bg-red-50", icon: "⏬" },
                                        { id: "furcation", label: "Keterlibatan Furkasi", color: "text-blue-800", bg: "bg-blue-50", icon: "🔱" },
                                      ].map(cond => (
                                        <label key={cond.id} className={cn(
                                          "flex items-center justify-between gap-4 cursor-pointer p-4 rounded-2xl transition-all border-2",
                                          !!toothData[cond.id as keyof typeof toothData] 
                                            ? `border-blue-500 ${cond.bg} shadow-md` 
                                            : "border-slate-50 hover:border-slate-200 bg-white"
                                        )}>
                                          <div className="flex items-center gap-3">
                                            <span className="text-lg">{cond.icon}</span>
                                            <span className={cn("text-xs font-black uppercase tracking-tight", cond.color)}>{cond.label}</span>
                                          </div>
                                          <div className={cn(
                                            "h-7 w-7 rounded-xl border-2 flex items-center justify-center transition-all",
                                            !!toothData[cond.id as keyof typeof toothData] ? "bg-blue-500 border-blue-500 text-white" : "bg-white border-slate-200"
                                          )}>
                                            {!!toothData[cond.id as keyof typeof toothData] && <CheckCircle2 className="h-4 w-4" />}
                                          </div>
                                          <input 
                                            type="checkbox" 
                                            className="hidden"
                                            checked={!!toothData[cond.id as keyof typeof toothData]}
                                            onChange={(e) => {
                                              const newData = { ...toothData, [cond.id]: e.target.checked };
                                              setValue(`periodontal.teeth.${i}` as any, newData as any);
                                            }}
                                          />
                                        </label>
                                      ))}
                                    </div>

                                    <div className="pt-6 border-t border-slate-100 space-y-8">
                                      <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <Activity className="h-3 w-3" />
                                          Skor Kalkulus
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                          {[0, 1, 2, 3].map(score => (
                                            <button
                                              key={score}
                                              type="button"
                                              onClick={() => {
                                                const newData = { ...toothData, calculus: score };
                                                setValue(`periodontal.teeth.${i}` as any, newData as any);
                                              }}
                                              className={cn(
                                                "h-14 rounded-2xl text-lg font-black transition-all border-2 shadow-sm",
                                                toothData.calculus === score 
                                                  ? "bg-slate-900 text-white border-slate-900 shadow-xl scale-105" 
                                                  : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                              )}
                                            >
                                              {score}
                                            </button>
                                          ))}
                                        </div>
                                      </div>

                                      <div>
                                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4 flex items-center gap-2">
                                          <Activity className="h-3 w-3" />
                                          Skor Stain (Ekstrinsik)
                                        </div>
                                        <div className="grid grid-cols-4 gap-2">
                                          {[0, 1, 2, 3].map(score => (
                                            <button
                                              key={score}
                                              type="button"
                                              onClick={() => {
                                                const newData = { ...toothData, extrinsicStains: score };
                                                setValue(`periodontal.teeth.${i}` as any, newData as any);
                                              }}
                                              className={cn(
                                                "h-14 rounded-2xl text-lg font-black transition-all border-2 shadow-sm",
                                                toothData.extrinsicStains === score 
                                                  ? "bg-yellow-600 text-white border-yellow-600 shadow-xl scale-105" 
                                                  : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                              )}
                                            >
                                              {score}
                                            </button>
                                          ))}
                                        </div>
                                      </div>
                                    </div>

                                    <button 
                                      type="button"
                                      onClick={() => setActivePeriodontalTooth(null)}
                                      className="w-full py-5 rounded-3xl bg-blue-600 text-white font-black uppercase tracking-widest shadow-xl shadow-blue-200 hover:bg-blue-700 transition-all active:scale-95"
                                    >
                                      Selesai
                                    </button>
                                  </div>
                                </motion.div>
                              </>
                            );
                          })()}
                        </AnimatePresence>
                      </div>

                      <div className="lg:col-span-3 space-y-6 border-l border-slate-100 pl-10">
                        <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 border-b border-slate-100 pb-2">Hasil Pemeriksaan</h4>
                        
                        <div className="space-y-6">
                          <div className="rounded-3xl bg-gradient-to-br from-slate-800 to-slate-900 p-6 text-white shadow-xl shadow-slate-200">
                            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-1">Total Skor Kalkulus</p>
                            <p className="text-4xl font-black tracking-tighter">
                              {(() => {
                                const teeth = watch("periodontal.teeth") || [];
                                return teeth.reduce((acc: number, t: any) => acc + (t?.calculus || 0) + (t?.extrinsicStains || 0), 0);
                              })()}
                            </p>
                          </div>

                          <div className="rounded-2xl bg-blue-50 p-5 border border-blue-100">
                            <h5 className="text-[10px] font-black text-blue-900 uppercase tracking-widest mb-3">Keterangan Skor:</h5>
                            <ul className="text-[9px] text-blue-700 space-y-2 font-bold leading-relaxed">
                              <li className="flex gap-2">
                                <span className="text-blue-900">1:</span>
                                <span>Kalkulus &lt; 1/3 permukaan serviks gigi.</span>
                              </li>
                              <li className="flex gap-2">
                                <span className="text-blue-900">2:</span>
                                <span>Kalkulus &gt; 1/3 tapi &lt; 2/3 permukaan serviks atau ada subgingival kalkulus sebagian.</span>
                              </li>
                              <li className="flex gap-2">
                                <span className="text-blue-900">3:</span>
                                <span>Kalkulus &gt; 2/3 permukaan serviks atau ada subgingival kalkulus melingkar leher gigi.</span>
                              </li>
                            </ul>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 8: Diagnosis & Planning (8 Human Needs) */}
            {step === 8 && (
              <motion.div 
                key="step8"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-8"
              >
                <div className="flex items-center justify-between">
                  <SectionHeader title="Diagnosis & Perencanaan (8 Kebutuhan Manusia)" icon={ClipboardList} />
                  <button 
                    type="button"
                    onClick={() => append({ needId: "", causes: "", signs: "", goals: "", interventions: "", evaluations: "" })}
                    className="flex items-center gap-2 rounded-xl bg-blue-600 px-4 py-2 text-sm font-bold text-white hover:bg-blue-700"
                  >
                    <Plus className="h-4 w-4" />
                    Tambah Diagnosis
                  </button>
                </div>

                <div className="space-y-8">
                  {diagnosisFields.map((field, index) => (
                    <motion.div 
                      key={field.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="relative rounded-[2.5rem] bg-white p-10 border border-slate-100 shadow-xl shadow-blue-900/5 group"
                    >
                      <button 
                        type="button"
                        onClick={() => remove(index)}
                        className="absolute right-8 top-8 rounded-full p-2.5 text-slate-300 hover:bg-red-50 hover:text-red-500 transition-all opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="h-6 w-6" />
                      </button>

                      <div className="grid grid-cols-1 gap-6">
                        <div className="space-y-2">
                          <label className="text-sm font-bold text-slate-700">Kebutuhan yang Tidak Terpenuhi</label>
                          <select 
                            {...register(`diagnosis.${index}.needId`)}
                            onChange={(e) => handleNeedChange(index, e.target.value)}
                            className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all"
                          >
                            <option value="">-- Pilih Kebutuhan --</option>
                            {HUMAN_NEEDS.map(need => (
                              <option key={need.id} value={need.id}>{need.name}</option>
                            ))}
                          </select>
                        </div>

                        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                          <InputGroup label="Penyebab (Etiologi)" register={register(`diagnosis.${index}.causes`)} isTextArea />
                          <InputGroup label="Tanda & Gejala" register={register(`diagnosis.${index}.signs`)} isTextArea />
                          <InputGroup label="Tujuan (Client-Centered Goals)" register={register(`diagnosis.${index}.goals`)} isTextArea />
                          <InputGroup label="Intervensi" register={register(`diagnosis.${index}.interventions`)} isTextArea />
                          <div className="md:col-span-2">
                            <InputGroup label="Evaluasi" register={register(`diagnosis.${index}.evaluations`)} isTextArea />
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  ))}

                  {diagnosisFields.length === 0 && (
                    <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-slate-200 p-12 text-center">
                      <div className="mb-4 rounded-full bg-slate-100 p-4 text-slate-400">
                        <Info className="h-8 w-8" />
                      </div>
                      <h4 className="text-lg font-bold text-slate-900">Belum ada diagnosis</h4>
                      <p className="text-slate-500">Klik tombol "Tambah Diagnosis" untuk memulai penilaian berdasarkan 8 kebutuhan manusia.</p>
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {/* Step 9: Next Visit & Consent */}
            {step === 9 && (
              <motion.div 
                key="step9"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Rencana Kunjungan Berikutnya" icon={Calendar} />
                  <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2 rounded-3xl bg-white p-6 border border-slate-100 shadow-sm">
                    <InputGroup label="Tanggal Kunjungan" register={register("nextVisit.date")} type="date" />
                    <InputGroup label="Rekomendasi Perawatan" register={register("nextVisit.recommendation")} isTextArea />
                    <div className="md:col-span-2">
                      <InputGroup label="Catatan Khusus" register={register("nextVisit.notes")} isTextArea />
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Dokumentasi Foto (Opsional)" icon={Camera} />
                  <div className="mt-6 rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
                    <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                      {[0, 1].map((idx) => (
                        <div key={idx} className="space-y-4">
                          <p className="text-sm font-bold text-slate-700">Foto Dokumentasi {idx + 1}</p>
                          <div className="relative h-64 w-full rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center overflow-hidden transition-all hover:border-blue-300 group">
                            {watch(`documentation.photos.${idx}`) ? (
                              <div className="relative h-full w-full">
                                <img 
                                  src={watch(`documentation.photos.${idx}`)} 
                                  alt={`Dokumentasi ${idx + 1}`} 
                                  className="h-full w-full object-cover"
                                  referrerPolicy="no-referrer"
                                />
                                <button 
                                  type="button" 
                                  onClick={() => {
                                    const currentPhotos = [...(watch("documentation.photos") || [])];
                                    currentPhotos[idx] = "";
                                    setValue("documentation.photos", currentPhotos);
                                  }}
                                  className="absolute top-4 right-4 rounded-full bg-red-500 p-2 text-white shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              </div>
                            ) : (
                              <label className="flex h-full w-full cursor-pointer flex-col items-center justify-center gap-3">
                                <div className="rounded-full bg-blue-100 p-4 text-blue-600 transition-transform group-hover:scale-110">
                                  <Camera className="h-8 w-8" />
                                </div>
                                <div className="text-center">
                                  <p className="text-sm font-bold text-slate-600">Klik untuk Unggah Foto</p>
                                  <p className="text-xs text-slate-400">Format JPG (Maks. 2MB)</p>
                                </div>
                                <input 
                                  type="file" 
                                  accept="image/jpeg,image/jpg"
                                  className="hidden" 
                                  onChange={(e) => {
                                    const file = e.target.files?.[0];
                                    if (file) {
                                      const reader = new FileReader();
                                      reader.onloadend = () => {
                                        const currentPhotos = [...(watch("documentation.photos") || [])];
                                        currentPhotos[idx] = reader.result as string;
                                        setValue("documentation.photos", currentPhotos);
                                      };
                                      reader.readAsDataURL(file);
                                    }
                                  }}
                                />
                              </label>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div>
                  <SectionHeader title="Informed Consent" icon={FileCheck} />
                  <div className="mt-6 space-y-6 rounded-3xl bg-white p-8 border border-slate-100 shadow-sm">
                    <div className="prose prose-slate max-w-none text-sm text-slate-600 leading-relaxed bg-slate-50 p-6 rounded-2xl border border-slate-100">
                      <p>Menyatakan telah mendapat penerangan mengenai pemeriksaan dan perawatan yang akan dilaksanakan terhadap saya / anak saya, dengan akibat sampingan yang mungkin terjadi, jumlah kunjungan yang harus dilaksanakan serta biaya yang harus dibayar untuk pemeriksaan dan perawatan dimaksud.</p>
                    </div>

                    <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">Tanda Tangan Pasien / Wali</p>
                        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden relative">
                          {watch("informedConsent.patientSignature") ? (
                            <div className="relative h-40 w-full bg-white flex items-center justify-center">
                              <img src={watch("informedConsent.patientSignature")} alt="Tanda Tangan Pasien" className="max-h-full max-w-full" referrerPolicy="no-referrer" />
                              <button type="button" onClick={() => setValue("informedConsent.patientSignature", "")} className="absolute top-2 right-2 rounded-full bg-red-100 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <SignatureCanvas ref={patientSigRef} penColor="navy" canvasProps={{ className: "w-full h-40 cursor-crosshair" }} onEnd={() => setValue("informedConsent.patientSignature", patientSigRef.current?.toDataURL() || "")} />
                          )}
                        </div>
                      </div>
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-slate-700">Tanda Tangan Pemeriksa</p>
                        <div className="rounded-2xl border-2 border-slate-100 bg-slate-50 overflow-hidden relative">
                          {watch("informedConsent.examinerSignature") ? (
                            <div className="relative h-40 w-full bg-white flex items-center justify-center">
                              <img src={watch("informedConsent.examinerSignature")} alt="Tanda Tangan Pemeriksa" className="max-h-full max-w-full" referrerPolicy="no-referrer" />
                              <button type="button" onClick={() => setValue("informedConsent.examinerSignature", "")} className="absolute top-2 right-2 rounded-full bg-red-100 p-2 text-red-600"><Trash2 className="h-4 w-4" /></button>
                            </div>
                          ) : (
                            <SignatureCanvas ref={examinerSigRef} penColor="black" canvasProps={{ className: "w-full h-40 cursor-crosshair" }} onEnd={() => setValue("informedConsent.examinerSignature", examinerSigRef.current?.toDataURL() || "")} />
                          )}
                        </div>
                      </div>
                    </div>
                    <CheckboxGroup label="Saya menyetujui seluruh tindakan medis" register={register("informedConsent.agreed")} />
                  </div>
                </div>
              </motion.div>
            )}

            {/* Step 10: Billing */}
            {step === 10 && (
              <motion.div 
                key="step10"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-10"
              >
                <div className="no-print">
                  <PatientHeader name={watch("demographics.fullName")} />
                </div>
                
                <div>
                  <div className="no-print">
                    <SectionHeader title="Ringkasan AI & Rekomendasi" icon={Sparkles} />
                  </div>
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-10 border border-slate-100 shadow-xl shadow-blue-900/5">
                    {!aiSummary ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Penilaian Kondisi Selesai</h4>
                        <p className="max-w-md text-sm text-slate-500 mb-6">Generasikan ringkasan kesehatan untuk pasien. AI akan merangkum semua data pemeriksaan menjadi bahasa yang mudah dipahami.</p>
                        <button 
                          type="button"
                          onClick={async () => {
                            try {
                              setIsGeneratingAi(true);
                              const currentValues = watch(); 
                              const summary = await generatePatientSummary(currentValues);
                              setAiSummary(summary);
                            } catch (err) {
                              console.error("AI Generation Error:", err);
                              setAiSummary("Maaf, gagal membuat ringkasan. Pastikan kunci API Gemini sudah terpasang.");
                            } finally {
                              setIsGeneratingAi(false);
                            }
                          }}
                          disabled={isGeneratingAi}
                          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50 active:scale-95"
                        >
                          {isGeneratingAi ? (
                            <RefreshCw className="h-5 w-5 animate-spin" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                          {isGeneratingAi ? "SEDANG MENGANALISIS..." : "GENERASIKAN RINGKASAN RAMAH PASIEN"}
                        </button>
                      </div>
                    ) : (
                        <div id="printable-summary" className="space-y-6 text-left break-inside-avoid">
                          {/* Print Only Header */}
                          <div className="print-only mb-10 pb-6 border-b-2 border-slate-200 hidden print:block text-left">
                            <div className="flex items-center justify-between mb-8">
                              <div className="text-left">
                                <h1 className="text-3xl font-black text-slate-900 leading-none mb-2 text-left">LAPORAN KESEHATAN GIGI</h1>
                                <p className="text-sm font-bold text-blue-600 tracking-widest uppercase text-left">Klinik ASIDENT - Aplikasi Dental Asuhan Terpadu</p>
                              </div>
                              <div className="text-right">
                                <p className="text-xl font-bold text-slate-900">{watch("demographics.fullName")}</p>
                                <p className="text-xs text-slate-500">Tanggal: {new Date().toLocaleDateString("id-ID", { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                              </div>
                            </div>
                          </div>

                          <div className="prose prose-slate max-w-none rounded-[2.5rem] bg-slate-50 p-10 border border-slate-100 text-slate-700 leading-relaxed shadow-inner">
                            <div className="mb-4 flex items-center gap-2 no-print">
                               <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
                               <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Laporan Pasien (AI Generated)</span>
                            </div>
                            <div className="whitespace-pre-wrap font-medium text-left">
                              {aiSummary}
                            </div>
                          </div>
                          <div className="flex items-center justify-between no-print">
                            <div className="flex items-center gap-3">
                              <button 
                                type="button"
                                onClick={() => {
                                  window.focus();
                                  setTimeout(() => window.print(), 50);
                                }}
                                className="flex items-center gap-2 rounded-2xl bg-slate-900 px-8 py-4 text-sm font-black text-white hover:bg-slate-800 transition-all shadow-lg active:scale-95"
                              >
                                <Printer className="h-5 w-5" />
                                CETAK RINGKASAN
                              </button>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setAiSummary("")}
                              className="flex items-center gap-1.5 px-6 py-4 rounded-xl text-xs font-black text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all"
                            >
                              <Plus className="h-4 w-4 rotate-45" />
                              Hapus & Buat Ulang
                            </button>
                          </div>
                        </div>
                    )}
                  </div>
                </div>

                <div className="no-print">
                  <SectionHeader title="Rincian Biaya & Tindakan" icon={CreditCard} />
                </div>
                <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-10 border border-slate-100 shadow-xl shadow-blue-900/5 no-print">
                    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {DENTAL_SERVICES.map(service => (
                        <label 
                          key={service.id} 
                          className={cn(
                            "flex cursor-pointer items-center justify-between rounded-2xl border-2 p-5 transition-all active:scale-95", 
                            (watch("billing.services") || []).includes(service.id) 
                              ? "border-blue-600 bg-blue-50 shadow-lg shadow-blue-500/10" 
                              : "border-slate-100 bg-slate-50 hover:border-slate-200"
                          )}
                        >
                          <div className="flex items-center gap-4">
                            <input 
                              type="checkbox" 
                              value={service.id} 
                              {...register("billing.services")} 
                              className="h-6 w-6 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all" 
                            />
                            <div>
                              <p className="text-sm font-black text-slate-900">{service.name}</p>
                              <p className="text-xs font-bold text-slate-400">Rp {service.price.toLocaleString()}</p>
                            </div>
                          </div>
                        </label>
                      ))}
                    </div>

                    <div className="mt-10 flex items-center justify-between rounded-3xl bg-gradient-to-br from-slate-900 to-slate-800 p-10 text-white shadow-2xl">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Total Pembayaran</p>
                        <h3 className="text-5xl font-black tracking-tighter mt-1">
                          Rp {(() => {
                            const selected = formData.billing?.services || [];
                            const total = selected.reduce((acc: number, id: string) => {
                              const s = DENTAL_SERVICES.find(x => x.id === id);
                              return acc + (s?.price || 0);
                            }, 0);
                            return total.toLocaleString();
                          })()}
                        </h3>
                      </div>
                      <div className="text-right">
                        <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 px-4 py-2 border border-emerald-500/20">
                          <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                          <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">Siap Disimpan</p>
                        </div>
                      </div>
                    </div>
                  </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 lg:left-0 no-print">
            <div className="mx-auto max-w-5xl flex items-center justify-between">
              <button 
                type="button"
                onClick={prevStep}
                disabled={step === 1}
                className="flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-slate-500 hover:bg-slate-100 disabled:opacity-30 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
                KEMBALI
              </button>

              {step < totalSteps ? (
                <button 
                  type="button"
                  onClick={nextStep}
                  className="flex items-center gap-2 rounded-xl bg-blue-600 px-8 py-3 font-bold text-white shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all"
                >
                  LANJUT
                  <ChevronRight className="h-5 w-5" />
                </button>
              ) : (
                <button 
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => {
                    if (watch("informedConsent.agreed")) {
                      handleSubmit(onSubmit)();
                    } else {
                      alert("Harap setujui Informed Consent terlebih dahulu.");
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 rounded-xl px-8 py-3 font-bold text-white shadow-lg transition-all",
                    isSubmitting 
                      ? "bg-slate-400 cursor-not-allowed" 
                      : "bg-emerald-500 shadow-emerald-200 hover:bg-emerald-600 active:scale-95"
                  )}
                >
                  {isSubmitting ? (
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Save className="h-5 w-5" />
                  )}
                  {isSubmitting ? "MENYIMPAN..." : "SIMPAN DATA"}
                </button>
              )}
            </div>
          </div>
        </form>
      </main>
    </div>
  );
}

function PatientHeader({ name }: { name: string }) {
  return (
    <div className="flex items-center justify-between rounded-[2.5rem] bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 p-8 text-white shadow-2xl shadow-blue-500/20 relative overflow-hidden group">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-3xl group-hover:bg-white/20 transition-all duration-700"></div>
      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Pasien Saat Ini</p>
        <h3 className="text-3xl font-black tracking-tight">{name || "Belum Diisi"}</h3>
      </div>
      <div className="text-right relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] opacity-70">Tanggal Pengisian</p>
        <h3 className="text-xl font-bold">{new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</h3>
      </div>
    </div>
  );
}

function ToothButton({ num, data, isPrimary = false, isActive, onToggle }: any) {
  const currentData = data || { condition: "sou", surfaces: [], restoration: "", material: "" };
  const conditionCode = typeof currentData === 'string' ? currentData : (currentData.condition || "sou");
  const condDetails = TOOTH_CONDITIONS.find(c => c.code === conditionCode);
  
  return (
    <div className="flex flex-col items-center gap-1.5 relative">
      {!isPrimary && <span className="text-[9px] font-black text-slate-400">{num}</span>}
      <button
        type="button"
        onClick={onToggle}
        className={cn(
          "h-12 w-9 rounded-lg border-2 transition-all flex flex-col items-center justify-center text-[9px] font-black uppercase shadow-sm relative overflow-hidden group",
          condDetails?.color || "border-slate-200 bg-white text-slate-400 hover:border-blue-400",
          isPrimary ? "h-10 w-8 border-dashed" : "",
          isActive && "ring-4 ring-blue-500/20 border-blue-600 z-10"
        )}
      >
        <div className="relative z-10 w-full h-full flex items-center justify-center p-0.5">
          {/* Surface Cross Diagram */}
          <div className="relative w-full h-full grid grid-cols-3 grid-rows-3 gap-0 bg-white/50 rounded-sm">
            {/* V - Top */}
            <div className={cn("col-start-2 row-start-1 border", currentData.surfaces?.includes("V") ? "bg-red-500 border-red-600" : "border-slate-100")} />
            {/* L - Bottom */}
            <div className={cn("col-start-2 row-start-3 border", currentData.surfaces?.includes("L") ? "bg-red-500 border-red-600" : "border-slate-100")} />
            {/* M - Left (approximate) */}
            <div className={cn("col-start-1 row-start-2 border", currentData.surfaces?.includes("M") ? "bg-red-500 border-red-600" : "border-slate-100")} />
            {/* D - Right (approximate) */}
            <div className={cn("col-start-3 row-start-2 border", currentData.surfaces?.includes("D") ? "bg-red-500 border-red-600" : "border-slate-100")} />
            {/* O - Center */}
            <div className={cn("col-start-2 row-start-2 border", currentData.surfaces?.includes("O") ? "bg-red-500 border-red-600" : "border-slate-100")} />
          </div>

          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <span className={cn("text-[8px] font-black drop-shadow-sm", (conditionCode === "nvt" || conditionCode === "mis") ? "text-white" : "text-slate-900")}>
              {condDetails?.symbol || ""}
            </span>
          </div>
        </div>
        
        {/* Visual indicators for filling/restoration */}
        {currentData.material && (
          <div className={cn("absolute inset-0 opacity-20", RESTORATION_MATERIALS.find(m => m.code === currentData.material)?.color)} />
        )}
        {currentData.restoration && (
          <div className="absolute top-0 right-0 h-2 w-2 bg-blue-500 rounded-bl-sm" />
        )}
      </button>
      {isPrimary && <span className="text-[9px] font-black text-blue-400">{num}</span>}
    </div>
  );
}

function SectionHeader({ title, icon: Icon }: { title: string; icon: any }) {
  return (
    <div className="flex items-center gap-4">
      <div className="rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 p-4 text-white shadow-lg shadow-blue-500/20">
        <Icon className="h-6 w-6" />
      </div>
      <h2 className="text-2xl font-black text-slate-900 tracking-tight">{title}</h2>
    </div>
  );
}

function InputGroup({ label, register, type = "text", placeholder = "", isTextArea = false, step }: any) {
  return (
    <div className="space-y-2">
      <label className="text-sm font-bold text-slate-700">{label}</label>
      {isTextArea ? (
        <textarea 
          {...register}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all resize-none"
        />
      ) : (
        <input 
          type={type}
          step={step}
          {...register}
          placeholder={placeholder}
          className="w-full rounded-xl border-2 border-slate-100 bg-slate-50 px-4 py-3 outline-none focus:border-blue-500 focus:bg-white transition-all"
        />
      )}
    </div>
  );
}

function CheckboxGroup({ label, register }: any) {
  return (
    <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-slate-100 bg-slate-50 p-4 transition-all hover:border-blue-200 has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50">
      <input type="checkbox" {...register} className="h-5 w-5 rounded border-slate-300 text-blue-600 focus:ring-blue-500" />
      <span className="font-bold text-slate-700">{label}</span>
    </label>
  );
}

function ActivityIcon({ className }: { className?: string }) {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      className={className}
    >
      <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
    </svg>
  );
}
