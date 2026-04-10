import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import SignatureCanvas from "react-signature-canvas";
import { generatePatientSummary } from "../services/gemini";
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
  Printer
} from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useForm, useFieldArray } from "react-hook-form";
import { cn } from "../lib/utils";
import { HUMAN_NEEDS, TOOTH_CONDITIONS, DENTAL_SERVICES } from "../constants";
import confetti from "canvas-confetti";

interface AssessmentFormProps {
  user: { name: string; role: string };
  onLogout?: () => void;
}

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
  const [aiSummary, setAiSummary] = useState("");
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const totalSteps = 10;

  const { register, handleSubmit, watch, setValue, control, reset, formState: { errors } } = useForm({
    defaultValues: {
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
    }
  });

  const patientSigRef = useRef<SignatureCanvas>(null);
  const examinerSigRef = useRef<SignatureCanvas>(null);

  const { fields: diagnosisFields, append, remove } = useFieldArray({
    control,
    name: "diagnosis"
  });

  const currentDiagnosis = watch("diagnosis");

  const formData = watch();

  // Handle incoming patient data from Database page
  useEffect(() => {
    if (location.state?.patientData) {
      if (location.state.isEditing) {
        setEditingId(location.state.patientData.id);
        reset(location.state.patientData);
      } else {
        selectPatient(location.state.patientData);
      }
    } else {
      // Load draft if exists
      const draft = localStorage.getItem("asident_assessment_draft");
      if (draft && !editingId) {
        reset(JSON.parse(draft));
      }
    }
  }, [location.state]);

  // Auto-save draft
  useEffect(() => {
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

  const onSubmit = (data: any) => {
    console.log("Form Data:", data);
    
    const assessments = JSON.parse(localStorage.getItem("asident_assessments") || "[]");
    
    if (editingId) {
      // Update existing
      const updatedAssessments = assessments.map((a: any) => 
        a.id === editingId ? { ...a, ...data, updatedAt: new Date().toISOString() } : a
      );
      localStorage.setItem("asident_assessments", JSON.stringify(updatedAssessments));
    } else {
      // Save New Assessment
      const newAssessment = {
        id: Date.now() + Math.floor(Math.random() * 1000),
        ...data,
        examiner: user.name,
        createdAt: new Date().toISOString()
      };
      localStorage.setItem("asident_assessments", JSON.stringify([newAssessment, ...assessments]));
    }

    // Clear draft after successful save
    localStorage.removeItem("asident_assessment_draft");

    // Generate Billing
    const selectedServices = data.billing?.services || [];
    if (selectedServices.length > 0) {
      const total = selectedServices.reduce((acc: number, id: string) => {
        const s = DENTAL_SERVICES.find(x => x.id === id);
        return acc + (s?.price || 0);
      }, 0);

      const newBill = {
        id: Date.now() + Math.floor(Math.random() * 1000) + 1,
        patient: data.demographics.fullName || "Pasien Umum",
        date: new Date().toISOString().split('T')[0],
        services: selectedServices.map((id: string) => DENTAL_SERVICES.find(x => x.id === id)?.name),
        total,
        status: "UNPAID"
      };

      const existingBills = JSON.parse(localStorage.getItem("asident_bills") || "[]");
      localStorage.setItem("asident_bills", JSON.stringify([newBill, ...existingBills]));
    }

    confetti({
      particleCount: 150,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#2563eb", "#10b981", "#6366f1"]
    });
    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const nextStep = () => setStep(prev => Math.min(prev + 1, totalSteps));
  const prevStep = () => setStep(prev => Math.max(prev - 1, 1));

  const handleSearch = (term: string) => {
    setSearchTerm(term);
    if (term.length < 2) {
      setSearchResults([]);
      return;
    }
    const assessments = JSON.parse(localStorage.getItem("asident_assessments") || "[]");
    // Get unique patients by name or phone
    const uniquePatients = assessments.reduce((acc: any[], curr: any) => {
      if (!curr.demographics) return acc;
      const exists = acc.find(p => p.demographics?.fullName === curr.demographics?.fullName || p.demographics?.phone === curr.demographics?.phone);
      if (!exists) acc.push(curr);
      return acc;
    }, []);

    const filtered = uniquePatients.filter((p: any) => 
      (p.demographics?.fullName || "").toLowerCase().includes(term.toLowerCase()) || 
      (p.demographics?.phone || "").includes(term)
    );
    setSearchResults(filtered);
  };

  const selectPatient = (patient: any) => {
    // Fill demographics
    setValue("demographics", patient.demographics);
    
    // Reset clinical fields for new visit
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
      })),
    });
    setValue("diagnosis", []);
    setValue("billing", { services: [], total: 0, status: "PENDING" });
    setValue("informedConsent", { 
      patient: { name: patient.demographics.fullName, age: patient.demographics.age, address: patient.demographics.address },
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
      <header className="sticky top-0 z-20 bg-white/70 backdrop-blur-xl border-b border-slate-200/50 px-6 py-4">
        <div className="mx-auto max-w-5xl flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => navigate("/")}
              className="rounded-2xl p-2 hover:bg-slate-100 text-slate-500 transition-all active:scale-90"
            >
              <ChevronLeft className="h-6 w-6" />
            </button>
            <div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">
                {editingId ? "Edit Rekam Medis" : "Pemeriksaan Baru"}
              </h1>
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
                  <div className="mb-8 flex flex-wrap gap-3 justify-center">
                    {TOOTH_CONDITIONS.map(cond => (
                      <div key={cond.code} className="flex items-center gap-2 rounded-full border border-slate-100 bg-slate-50 px-4 py-1.5 text-[10px] font-black uppercase tracking-widest text-slate-500 shadow-sm">
                        <div className={cn("h-3 w-3 rounded-full border shadow-sm", cond.color)} />
                        {cond.name}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-12 min-w-[800px]">
                    {/* Upper Jaw */}
                    <div className="space-y-4">
                      <h4 className="text-center text-xs font-black uppercase tracking-widest text-slate-400">Rahang Atas (Upper Jaw)</h4>
                      <div className="flex justify-center gap-2">
                        {[18, 17, 16, 15, 14, 13, 12, 11, 21, 22, 23, 24, 25, 26, 27, 28].map((num) => (
                          <ToothButton key={num} num={num} register={register} watch={watch} setValue={setValue} />
                        ))}
                      </div>
                      <div className="flex justify-center gap-2">
                        {[55, 54, 53, 52, 51, 61, 62, 63, 64, 65].map((num) => (
                          <ToothButton key={num} num={num} register={register} watch={watch} setValue={setValue} isPrimary />
                        ))}
                      </div>
                    </div>

                    {/* Lower Jaw */}
                    <div className="space-y-4">
                      <div className="flex justify-center gap-2">
                        {[85, 84, 83, 82, 81, 71, 72, 73, 74, 75].map((num) => (
                          <ToothButton key={num} num={num} register={register} watch={watch} setValue={setValue} isPrimary />
                        ))}
                      </div>
                      <div className="flex justify-center gap-2">
                        {[48, 47, 46, 45, 44, 43, 42, 41, 31, 32, 33, 34, 35, 36, 37, 38].map((num) => (
                          <ToothButton key={num} num={num} register={register} watch={watch} setValue={setValue} />
                        ))}
                      </div>
                      <h4 className="text-center text-xs font-black uppercase tracking-widest text-slate-400">Rahang Bawah (Lower Jaw)</h4>
                    </div>
                  </div>
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
                            const toothData = watch(`periodontal.teeth.${i}`) || {
                              bleeding: false, calculus: 0, pocketShallow: false, pocketDeep: false, attachmentLoss: false, extrinsicStains: false
                            };

                            return (
                              <div key={i} className="flex flex-col items-center gap-2">
                                <span className="text-[10px] font-black text-slate-400">{toothNum}</span>
                                <div className="relative">
                                  <div 
                                    onClick={() => setActivePeriodontalTooth(activePeriodontalTooth === i ? null : i)}
                                    className={cn(
                                      "h-16 w-12 rounded-xl border-2 flex flex-col items-center justify-center gap-1 transition-all cursor-pointer",
                                      (toothData.bleeding || (toothData.calculus as number) > 0 || toothData.pocketShallow || toothData.pocketDeep || (toothData.extrinsicStains as number) > 0 || toothData.attachmentLoss) 
                                        ? "border-blue-500 bg-blue-50/50 shadow-sm" 
                                        : "border-slate-100 bg-slate-50 hover:border-blue-200"
                                    )}
                                  >
                                    <div className="relative h-full w-full flex items-center justify-center">
                                      {((toothData.calculus as number) > 0 || (toothData.extrinsicStains as number) > 0) && (
                                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-800 text-[11px] font-black text-white z-10 shadow-md border-2 border-white">
                                          {Number(toothData.calculus || 0) + Number(toothData.extrinsicStains || 0)}
                                        </div>
                                      )}
                                      <div className="absolute inset-0 grid grid-cols-2 grid-rows-2 p-1">
                                        <div className="flex items-start justify-start">
                                          {toothData.bleeding && <div className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_rgba(239,68,68,0.5)]" />}
                                        </div>
                                        <div className="flex items-start justify-end">
                                          {(toothData.pocketShallow || toothData.pocketDeep) && <div className="h-2.5 w-2.5 rounded-full bg-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.5)]" />}
                                        </div>
                                        <div className="flex items-end justify-start">
                                          {toothData.attachmentLoss && <div className="h-2.5 w-2.5 rounded-full bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]" />}
                                        </div>
                                        <div className="flex items-end justify-end">
                                          {Number(toothData.extrinsicStains || 0) > 0 && <div className="h-2.5 w-2.5 rounded-full bg-yellow-600 shadow-[0_0_8px_rgba(202,138,4,0.5)]" />}
                                        </div>
                                      </div>
                                    </div>
                                  </div>

                                  {/* Popover Menu */}
                                  {activePeriodontalTooth === i && (
                                    <>
                                      <div 
                                        className="fixed inset-0 z-20" 
                                        onClick={() => setActivePeriodontalTooth(null)}
                                      />
                                      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-64 rounded-[2rem] bg-white p-6 shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 z-30 animate-in fade-in zoom-in slide-in-from-bottom-2 duration-200">
                                        <div className="flex items-center justify-between mb-4 border-b border-slate-50 pb-2">
                                          <p className="text-xs font-black text-slate-900 uppercase tracking-widest">Gigi {toothNum}</p>
                                          <button 
                                            onClick={() => setActivePeriodontalTooth(null)}
                                            className="h-6 w-6 flex items-center justify-center rounded-full hover:bg-slate-50 text-slate-400"
                                          >
                                            <X className="h-3 w-3" />
                                          </button>
                                        </div>
                                        <div className="space-y-3">
                                          {[
                                            { id: "bleeding", label: "Bleeding on Probing (BOP)", color: "text-red-600", bg: "bg-red-50" },
                                            { id: "pocketShallow", label: "Pocket > 4mm", color: "text-purple-600", bg: "bg-purple-50" },
                                            { id: "attachmentLoss", label: "Attachment Loss > 1mm", color: "text-orange-600", bg: "bg-orange-50" },
                                          ].map(cond => (
                                            <label key={cond.id} className={cn(
                                              "flex items-center justify-between gap-3 cursor-pointer p-3 rounded-2xl transition-all border-2",
                                              !!toothData[cond.id as keyof typeof toothData] 
                                                ? `border-blue-500 ${cond.bg} shadow-sm` 
                                                : "border-slate-100 hover:border-slate-200 bg-white"
                                            )}>
                                              <span className={cn("text-[11px] font-black uppercase tracking-tight", cond.color)}>{cond.label}</span>
                                              <input 
                                                type="checkbox" 
                                                checked={!!toothData[cond.id as keyof typeof toothData]}
                                                onChange={(e) => {
                                                  const newData = { ...toothData, [cond.id]: e.target.checked };
                                                  setValue(`periodontal.teeth.${i}` as any, newData as any);
                                                }}
                                                className="h-5 w-5 rounded-lg border-slate-300 text-blue-600 focus:ring-blue-500 transition-all"
                                              />
                                            </label>
                                          ))}

                                          <div className="mt-4 pt-4 border-t border-slate-100 space-y-4">
                                            <div>
                                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-slate-300" />
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
                                                      "h-10 rounded-xl text-xs font-black transition-all border-2",
                                                      toothData.calculus === score 
                                                        ? "bg-slate-800 text-white border-slate-800 shadow-lg scale-105" 
                                                        : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                                    )}
                                                  >
                                                    {score}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>

                                            <div>
                                              <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                <div className="h-1 w-1 rounded-full bg-yellow-400" />
                                                Skor Stain
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
                                                      "h-10 rounded-xl text-xs font-black transition-all border-2",
                                                      toothData.extrinsicStains === score 
                                                        ? "bg-yellow-600 text-white border-yellow-600 shadow-lg scale-105" 
                                                        : "bg-slate-50 text-slate-400 border-transparent hover:border-slate-200"
                                                    )}
                                                  >
                                                    {score}
                                                  </button>
                                                ))}
                                              </div>
                                            </div>
                                          </div>
                                        </div>
                                      </div>
                                    </>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
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
                <PatientHeader name={watch("demographics.fullName")} />
                
                <div>
                  <SectionHeader title="Ringkasan AI & Rekomendasi" icon={Sparkles} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-10 border border-slate-100 shadow-xl shadow-blue-900/5">
                    {!aiSummary ? (
                      <div className="flex flex-col items-center justify-center py-10 text-center">
                        <div className="mb-4 rounded-full bg-blue-50 p-4 text-blue-600">
                          <Sparkles className="h-8 w-8" />
                        </div>
                        <h4 className="text-lg font-bold text-slate-900">Generate Ringkasan AI</h4>
                        <p className="max-w-md text-sm text-slate-500 mb-6">Gunakan AI untuk membuat ringkasan kondisi pasien yang mudah dimengerti untuk dibawa pulang.</p>
                        <button 
                          type="button"
                          onClick={async () => {
                            setIsGeneratingAi(true);
                            const summary = await generatePatientSummary(watch());
                            setAiSummary(summary);
                            setIsGeneratingAi(false);
                          }}
                          disabled={isGeneratingAi}
                          className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 px-8 py-4 font-black text-white shadow-xl shadow-blue-500/20 hover:shadow-blue-500/40 transition-all disabled:opacity-50"
                        >
                          {isGeneratingAi ? (
                            <div className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Sparkles className="h-5 w-5" />
                          )}
                          BUAT RINGKASAN SEKARANG
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        <div className="prose prose-slate max-w-none rounded-3xl bg-slate-50 p-8 border border-slate-100 text-slate-700 leading-relaxed whitespace-pre-wrap">
                          {aiSummary}
                        </div>
                        <div className="flex items-center gap-4">
                          <button 
                            type="button"
                            onClick={() => window.print()}
                            className="flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-black text-white hover:bg-slate-800 transition-all"
                          >
                            <Printer className="h-4 w-4" />
                            CETAK UNTUK PASIEN
                          </button>
                          <button 
                            type="button"
                            onClick={() => setAiSummary("")}
                            className="text-sm font-bold text-slate-400 hover:text-slate-600"
                          >
                            Buat Ulang
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <SectionHeader title="Rincian Biaya & Tindakan" icon={CreditCard} />
                  <div className="mt-6 space-y-6 rounded-[2rem] bg-white p-10 border border-slate-100 shadow-xl shadow-blue-900/5">
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
                            const selected = watch("billing.services") || [];
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
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Footer Navigation */}
          <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 lg:left-0">
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
                  onClick={() => {
                    if (watch("informedConsent.agreed")) {
                      handleSubmit(onSubmit)();
                    } else {
                      alert("Harap setujui Informed Consent terlebih dahulu.");
                    }
                  }}
                  className="flex items-center gap-2 rounded-xl bg-emerald-500 px-8 py-3 font-bold text-white shadow-lg shadow-emerald-200 hover:bg-emerald-600 transition-all"
                >
                  <Save className="h-5 w-5" />
                  SIMPAN DATA
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

function ToothButton({ num, register, watch, setValue, isPrimary = false }: any) {
  const currentData = watch(`odontogram.${num}`) || { condition: "sou", surfaces: [], restoration: "", material: "" };
  const condDetails = TOOTH_CONDITIONS.find(c => c.code === (currentData.condition || currentData));
  
  return (
    <div className="flex flex-col items-center gap-1">
      {!isPrimary && <span className="text-[8px] font-black text-slate-400">{num}</span>}
      <button
        type="button"
        onClick={() => {
          const currentCond = currentData.condition || currentData;
          const nextIdx = (TOOTH_CONDITIONS.findIndex(c => c.code === currentCond) + 1) % TOOTH_CONDITIONS.length;
          const nextCond = TOOTH_CONDITIONS[nextIdx].code;
          setValue(`odontogram.${num}`, { ...currentData, condition: nextCond });
        }}
        className={cn(
          "h-10 w-8 rounded-md border transition-all flex items-center justify-center text-[8px] font-black uppercase shadow-sm relative overflow-hidden",
          condDetails?.color || "border-slate-200 bg-slate-50 text-slate-400",
          isPrimary ? "h-8 w-6 rounded-sm border-dashed" : ""
        )}
      >
        <span className="relative z-10">{(currentData.condition || currentData) === "sou" ? "" : (currentData.condition || currentData)}</span>
        {currentData.restoration && (
          <div className="absolute inset-0 bg-blue-500/20 flex items-center justify-center">
            <div className="h-1 w-full bg-blue-500 rotate-45 absolute" />
          </div>
        )}
      </button>
      {isPrimary && <span className="text-[8px] font-black text-blue-400">{num}</span>}
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
