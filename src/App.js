import React, { useState, useEffect, useCallback, useRef, createContext, useContext } from "react";
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area } from "recharts";

// ─── Fonts ────────────────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600;9..40,700&display=swap";
document.head.appendChild(fontLink);

// ─── School Constants ─────────────────────────────────────────────────────────
const SCHOOL = {
  name:    "Still Waters Learning Academy",
  group:   "Still Waters Group of Schools",
  motto:   "Restoring values, morals and identity through education",
  address: "P.O Box 76 Ruwa, 6319 Mutunduru, Zimre Park, Ruwa",
  tel:     "+263 772 323 602 / +263 774 971 512",
  email:   "stillwaters2013@gmail.com",
  bank:    "Ecobank · Account: 576700023470",
  website: "www.stillwatergroupofschools.co.zw",
  campuses: [
    { id:"swla", name:"Still Waters Learning Academy",       short:"SWLA" },
    { id:"swchs", name:"Still Waters Christian High School", short:"SWCHS" },
  ],
};

const FORMS = ["1","2","3C","3Z","4C","4Z","5","6"];
const FORM_LABEL = { "1":"Form 1","2":"Form 2","3C":"Form 3 Cambridge","3Z":"Form 3 ZIMSEC","4C":"Form 4 Cambridge","4Z":"Form 4 ZIMSEC","5":"Form 5","6":"Form 6" };
const TERMS = ["Term 1","Term 2","Term 3"];
const CURRENT_YEAR = 2026;

// Role-based navigation
const NAV_BY_ROLE = {
  admin:      ["dashboard","students","results","attendance","billing","discipline","registration","reports","assets","notices","timetable","hr","users"],
  principal:  ["dashboard","students","results","attendance","discipline","reports","notices","timetable","hr"],
  teacher:    ["dashboard","students","results","attendance","discipline","notices","timetable"],
  accountant: ["dashboard","billing","students","reports","assets","hr"],
  parent:     ["dashboard","results","attendance","billing","notices"],
};

// ─── API ──────────────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || "https://edusphere-backend-1pcs.onrender.com/api";
const api = {
  _token: () => localStorage.getItem("sw_token"),
  _campus: () => localStorage.getItem("sw_campus") || "swla",
  async request(method, path, body = null) {
    const headers = { "Content-Type": "application/json", "X-Campus": this._campus() };
    const token = this._token();
    if (token) headers["Authorization"] = `Bearer ${token}`;
    const res = await fetch(`${API_BASE}${path}`, { method, headers, body: body ? JSON.stringify(body) : null });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Request failed");
    return data;
  },
  get:    (path)         => api.request("GET",    path),
  post:   (path, body)   => api.request("POST",   path, body),
  put:    (path, body)   => api.request("PUT",    path, body),
  delete: (path)         => api.request("DELETE", path),
  login:          (b)    => api.post("/auth/login", b),
  me:             ()     => api.get("/auth/me"),
  changePassword: (b)    => api.put("/auth/change-password", b),
  dashboardStats: ()     => api.get("/dashboard/stats"),
  students:       (q)    => api.get(`/students?${new URLSearchParams(q)}`),
  createStudent:  (b)    => api.post("/students", b),
  updateStudent:  (id,b) => api.put(`/students/${id}`, b),
  deleteStudent:  (id)   => api.delete(`/students/${id}`),
  results:        (q)    => api.get(`/results?${new URLSearchParams(q)}`),
  saveResult:     (b)    => api.post("/results", b),
  updateResult:   (id,b) => api.put(`/results/${id}`, b),
  deleteResult:   (id)   => api.delete(`/results/${id}`),
  subjects:       ()     => api.get("/results/subjects/all"),
  attendance:     (q)    => api.get(`/attendance?${new URLSearchParams(q)}`),
  attendanceSummary:(q)  => api.get(`/attendance/summary?${new URLSearchParams(q)}`),
  markAttendance: (b)    => api.post("/attendance", b),
  bulkAttendance: (b)    => api.post("/attendance/bulk", b),
  attendanceReport:(q)   => api.get(`/attendance/report?${new URLSearchParams(q)}`),
  invoices:       (q)    => api.get(`/billing/invoices?${new URLSearchParams(q)}`),
  invoice:        (id)   => api.get(`/billing/invoices/${id}`),
  createInvoice:  (b)    => api.post("/billing/invoices", b),
  recordPayment:  (b)    => api.post("/billing/payments", b),
  billingSummary: ()     => api.get("/billing/summary"),
  billingDefaulters: ()  => api.get("/billing/defaulters"),
  installmentPlan: (b)   => api.post("/billing/installments", b),
  // Notices
  notices:         ()    => api.get("/notices"),
  createNotice:    (b)   => api.post("/notices", b),
  deleteNotice:    (id)  => api.delete(`/notices/${id}`),
  // Assets
  assets:          (q)   => api.get(`/assets?${new URLSearchParams(q)}`),
  createAsset:     (b)   => api.post("/assets", b),
  updateAsset:     (id,b)=> api.put(`/assets/${id}`, b),
  deleteAsset:     (id)  => api.delete(`/assets/${id}`),
  // Users
  users:           (q)    => api.get(`/auth/users?${new URLSearchParams(q)}`),
  userProfile:     (id)   => api.get(`/auth/users/${id}`),
  createUser:      (b)    => api.post("/auth/users", b),
  updateUser:      (id,b) => api.put(`/auth/users/${id}`, b),
  approveUser:     (id,b) => api.put(`/auth/users/${id}/approve`, b),
  // Teacher subject assignments
  teacherSubjects:       (tid)   => api.get(`/teacher-subjects?teacher_id=${tid}`),
  allSubjectsForForm:    (form)  => api.get(`/teacher-subjects/subjects${form?`?form=${form}`:""}`),
  addTeacherSubject:     (b)     => api.post("/teacher-subjects", b),
  removeTeacherSubject:  (id)    => api.delete(`/teacher-subjects/${id}`),
  // HR / Staff
  staffList:       (q)    => api.get(`/hr/staff?${new URLSearchParams(q||{})}`),
  staffMember:     (id)   => api.get(`/hr/staff/${id}`),
  createStaff:     (b)    => api.post("/hr/staff", b),
  updateStaff:     (id,b) => api.put(`/hr/staff/${id}`, b),
  staffLeave:      (id)   => api.get(`/hr/staff/${id}/leave`),
  applyLeave:      (b)    => api.post("/hr/leave", b),
  updateLeave:     (id,b) => api.put(`/hr/leave/${id}`, b),
  linkParentStudent:(b)  => api.post("/auth/link-parent", b),
  // Parent-scoped endpoints — only return data for their linked children
  myChildren:       ()      => api.get("/students/my-children"),
  myStudents:       ()      => api.get("/students/my-students"),
  // Timetable
  timetable:        (q)  => api.get(`/timetable?${new URLSearchParams(q)}`),
  timetableTeachers:()   => api.get("/timetable/teachers"),
  saveTimetableSlot:(b)  => api.post("/timetable", b),
  deleteTimetableSlot:(id)=>api.delete(`/timetable/${id}`),
  // PDF downloads (returns URL — opens in new tab)
  reportCardURL:  (studentId, q) => `${API_BASE}/pdf/report-card/${studentId}?${new URLSearchParams(q)}&token=${api._token()}`,
  invoicePdfURL:  (invoiceId)    => `${API_BASE}/pdf/invoice/${invoiceId}?token=${api._token()}`,
};

// ─── Theme — Still Waters: Red · Turquoise · Grey ─────────────────────────────
const theme = {
  red:        "#C41E3A",  redDark:   "#9B1530",  redLight: "#E53E5A",
  turquoise:  "#0891B2",  tqLight:   "#06B6D4",
  grey:       "#6B7280",  greyLight: "#9CA3AF",
  sidebarTop: "#1A0508",  sidebarBt: "#2D0A10",
  bg:         "#F5F5F5",  card:      "#FFFFFF",
  text:       "#1A1A1A",  textMuted: "#6B7280",  border: "#E5E7EB",
  green:      "#10B981",  amber:     "#F59E0B",  danger: "#EF4444",
  purple:     "#8B5CF6",
};

// ─── Global Styles ────────────────────────────────────────────────────────────
const globalStyles = `
  *{box-sizing:border-box;margin:0;padding:0;}
  body{font-family:'DM Sans',sans-serif;background:${theme.bg};color:${theme.text};}
  ::-webkit-scrollbar{width:6px;height:6px;}
  ::-webkit-scrollbar-thumb{background:#D1D5DB;border-radius:3px;}
  .sidebar-item{transition:all 0.2s;}
  .sidebar-item:hover{background:rgba(255,255,255,0.08)!important;}
  .sidebar-item.active{background:rgba(196,30,58,0.85)!important;border-left:3px solid rgba(255,255,255,0.6);}
  .card{transition:box-shadow 0.2s,transform 0.2s;}
  .card:hover{transform:translateY(-1px);box-shadow:0 8px 24px rgba(196,30,58,0.1);}
  .btn{transition:all 0.15s;cursor:pointer;}
  .btn:hover:not(:disabled){opacity:0.88;transform:translateY(-1px);}
  .btn:active:not(:disabled){transform:translateY(0);}
  .fade-in{animation:fadeIn 0.3s ease;}
  @keyframes fadeIn{from{opacity:0;transform:translateY(8px);}to{opacity:1;transform:translateY(0);}}
  input,select,textarea{outline:none;}
  input:focus,select:focus,textarea:focus{border-color:${theme.turquoise}!important;box-shadow:0 0 0 3px rgba(8,145,178,0.15)!important;}
  table{border-collapse:collapse;width:100%;}
  th{font-weight:600;font-size:11px;text-transform:uppercase;letter-spacing:0.06em;color:${theme.textMuted};}
  td,th{padding:12px 16px;border-bottom:1px solid ${theme.border};text-align:left;}
  tr:last-child td{border-bottom:none;}
  tr:hover td{background:#FAFAFA;}
  .badge{display:inline-flex;align-items:center;padding:2px 10px;border-radius:999px;font-size:11px;font-weight:600;letter-spacing:0.04em;}
  .modal-overlay{position:fixed;inset:0;background:rgba(26,5,8,0.55);backdrop-filter:blur(4px);z-index:1000;display:flex;align-items:center;justify-content:center;animation:fadeIn 0.2s;}
  .modal{background:white;border-radius:16px;padding:32px;width:90%;max-width:580px;max-height:88vh;overflow-y:auto;animation:fadeIn 0.25s;}
  .modal-lg{max-width:740px;}
  .form-group{margin-bottom:16px;}
  .form-group label{display:block;font-size:13px;font-weight:600;color:${theme.textMuted};margin-bottom:6px;}
  .form-input{width:100%;padding:10px 14px;border:1.5px solid ${theme.border};border-radius:8px;font-size:14px;font-family:'DM Sans',sans-serif;transition:all 0.15s;background:white;}
  .form-row{display:grid;grid-template-columns:1fr 1fr;gap:12px;}
  @media(max-width:768px){.form-row{grid-template-columns:1fr;}}
  .spinner{width:18px;height:18px;border:2px solid rgba(255,255,255,0.3);border-top-color:white;border-radius:50%;animation:spin 0.6s linear infinite;display:inline-block;}
  .spinner-dark{border-color:rgba(26,5,8,0.12);border-top-color:${theme.red};}
  @keyframes spin{to{transform:rotate(360deg);}}
  .skeleton{background:linear-gradient(90deg,#f5f5f5 25%,#e5e7eb 50%,#f5f5f5 75%);background-size:200% 100%;animation:shimmer 1.5s infinite;border-radius:6px;}
  @keyframes shimmer{0%{background-position:200% 0;}100%{background-position:-200% 0;}}
  .toast-container{position:fixed;bottom:24px;right:24px;z-index:9999;display:flex;flex-direction:column;gap:10px;}
  .toast{padding:12px 18px;border-radius:10px;font-size:13px;font-weight:600;color:white;box-shadow:0 4px 16px rgba(0,0,0,0.18);animation:slideIn 0.3s ease;display:flex;align-items:center;gap:10px;min-width:240px;}
  @keyframes slideIn{from{opacity:0;transform:translateX(40px);}to{opacity:1;transform:translateX(0);}}
  .role-badge{display:inline-flex;align-items:center;padding:3px 10px;border-radius:6px;font-size:11px;font-weight:700;letter-spacing:0.06em;text-transform:uppercase;}
`;

// ─── Icons ────────────────────────────────────────────────────────────────────
const Icon = ({d,size=18,color="currentColor",style={}}) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={style}>
    {Array.isArray(d)?d.map((p,i)=><path key={i} d={p}/>):<path d={d}/>}
  </svg>
);
const icons = {
  dashboard:   "M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z M9 22V12h6v10",
  students:    "M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M23 21v-2a4 4 0 00-3-3.87 M16 3.13a4 4 0 010 7.75 M9 7a4 4 0 100 8 4 4 0 000-8z",
  results:     "M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2 M9 5a2 2 0 002 2h2a2 2 0 002-2 M9 5a2 2 0 012-2h2a2 2 0 012 2 M9 12l2 2 4-4",
  attendance:  "M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z",
  billing:     "M14 2H6a2 2 0 00-2 2v16l4-2 4 2 4-2 4 2V4a2 2 0 00-2-2z M10 9h4m-4 4h4m-4 4h2",
  discipline:  "M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z",
  registration:"M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2 M8.5 7a3.5 3.5 0 107 0 3.5 3.5 0 00-7 0M20 8v6m3-3h-6",
  reports:     "M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z M14 2v6h6 M16 13H8m8 4H8m2-8H8",
  assets:      "M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4",
  menu:        "M4 6h16M4 12h16M4 18h16",
  close:       "M18 6L6 18M6 6l12 12",
  search:      "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  plus:        "M12 5v14M5 12h14",
  edit:        "M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7 M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z",
  trash:       "M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6",
  user:        "M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2 M12 11a4 4 0 100-8 4 4 0 000 8z",
  logout:      "M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4 M16 17l5-5-5-5 M21 12H9",
  check:       "M20 6L9 17l-5-5",
  download:    "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
  alert:       "M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z M12 9v4m0 4h.01",
  refresh:     "M23 4v6h-6 M1 20v-6h6 M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15",
  money:       "M12 1v22M17 5H9.5a3.5 3.5 0 100 7h5a3.5 3.5 0 110 7H6",
  settings:    "M12 15a3 3 0 100-6 3 3 0 000 6z M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z",
  eye:         "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z M12 9a3 3 0 100 6 3 3 0 000-6z",
  lock:        "M19 11H5a2 2 0 00-2 2v7a2 2 0 002 2h14a2 2 0 002-2v-7a2 2 0 00-2-2z M7 11V7a5 5 0 0110 0v4",
  book:        "M4 19.5A2.5 2.5 0 016.5 17H20 M6.5 2H20v20H6.5A2.5 2.5 0 014 19.5v-15A2.5 2.5 0 016.5 2z",
  chart:       "M18 20V10 M12 20V4 M6 20v-6",
  bell:        "M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9 M13.73 21a2 2 0 01-3.46 0",
  crest:       "M12 2L4 6v6c0 5.5 3.5 10.7 8 12 4.5-1.3 8-6.5 8-12V6l-8-4z",
  campus:      "M3 21h18M3 7v14M21 7v14M9 21V7M15 21V7M3 7l9-4 9 4M9 7v4M15 7v4",
};

// ─── Role Colours ─────────────────────────────────────────────────────────────
const ROLE_STYLE = {
  admin:      { bg:"#FEE2E2", text:"#991B1B", label:"Administrator" },
  principal:  { bg:"#EDE9FE", text:"#5B21B6", label:"Principal" },
  teacher:    { bg:"#D1FAE5", text:"#065F46", label:"Teacher" },
  accountant: { bg:"#FEF3C7", text:"#92400E", label:"Accountant" },
  parent:     { bg:"#E0F2FE", text:"#0C4A6E", label:"Parent" },
};

// ─── Toast ────────────────────────────────────────────────────────────────────
const ToastContext = createContext(null);
function ToastProvider({children}) {
  const [toasts,setToasts] = useState([]);
  const addToast = useCallback((message,type="success")=>{
    const id=Date.now();
    setToasts(t=>[...t,{id,message,type}]);
    setTimeout(()=>setToasts(t=>t.filter(x=>x.id!==id)),3500);
  },[]);
  const colors={success:theme.green,error:theme.danger,info:theme.turquoise,warning:theme.amber};
  const ticons={success:icons.check,error:icons.alert,info:icons.bell,warning:icons.alert};
  return (
    <ToastContext.Provider value={addToast}>
      {children}
      <div className="toast-container">
        {toasts.map(t=>(
          <div key={t.id} className="toast" style={{background:colors[t.type]||theme.turquoise}}>
            <Icon d={ticons[t.type]||icons.check} size={16} color="white"/>
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}
const useToast = ()=>useContext(ToastContext);

// ─── Reusable UI ──────────────────────────────────────────────────────────────
const Badge = ({children,color="tq"})=>{
  const c={tq:{bg:"#CFFAFE",text:"#0E7490"},green:{bg:"#D1FAE5",text:"#065F46"},red:{bg:"#FEE2E2",text:"#991B1B"},amber:{bg:"#FEF3C7",text:"#92400E"},purple:{bg:"#EDE9FE",text:"#5B21B6"},gray:{bg:"#F3F4F6",text:"#374151"}}[color]||{bg:"#F3F4F6",text:"#374151"};
  return <span className="badge" style={{background:c.bg,color:c.text}}>{children}</span>;
};

const RoleBadge = ({role})=>{
  const s=ROLE_STYLE[role]||{bg:"#F3F4F6",text:"#374151",label:role};
  return <span className="role-badge" style={{background:s.bg,color:s.text}}>{s.label}</span>;
};

const Btn = ({children,onClick,variant="primary",size="md",icon,loading,disabled,style={}})=>{
  const vs={
    primary:{background:theme.red,color:"white",border:"none"},
    secondary:{background:"white",color:theme.text,border:`1.5px solid ${theme.border}`},
    tq:{background:theme.turquoise,color:"white",border:"none"},
    danger:{background:theme.danger,color:"white",border:"none"},
    success:{background:theme.green,color:"white",border:"none"},
    ghost:{background:"transparent",color:theme.red,border:`1.5px solid ${theme.red}`},
  };
  const ss={sm:{padding:"6px 14px",fontSize:12},md:{padding:"9px 18px",fontSize:14},lg:{padding:"12px 24px",fontSize:15}};
  return (
    <button className="btn" onClick={onClick} disabled={loading||disabled}
      style={{...vs[variant],...ss[size],borderRadius:8,fontWeight:600,fontFamily:"'DM Sans',sans-serif",display:"inline-flex",alignItems:"center",gap:6,opacity:(loading||disabled)?0.65:1,...style}}>
      {loading?<span className={`spinner${variant==="secondary"?" spinner-dark":""}`}/>:icon?<Icon d={icons[icon]} size={14}/>:null}
      {children}
    </button>
  );
};

const SearchInput = ({value,onChange,placeholder})=>(
  <div style={{position:"relative"}}>
    <Icon d={icons.search} size={16} color={theme.textMuted} style={{position:"absolute",left:12,top:"50%",transform:"translateY(-50%)"}}/>
    <input className="form-input" style={{paddingLeft:38}} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder||"Search..."}/>
  </div>
);

const StatCard = ({icon,label,value,sub,color,trend})=>(
  <div className="card" style={{background:theme.card,borderRadius:14,padding:"20px 24px",boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
    <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start"}}>
      <div>
        <p style={{fontSize:12,fontWeight:600,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:6}}>{label}</p>
        <p style={{fontSize:28,fontWeight:700,color:theme.text,fontFamily:"'Playfair Display',serif"}}>{value??<span className="skeleton" style={{width:60,height:28,display:"inline-block"}}/>}</p>
        {sub&&<p style={{fontSize:12,color:trend==="up"?theme.green:trend==="down"?theme.danger:theme.textMuted,marginTop:4}}>{sub}</p>}
      </div>
      <div style={{width:44,height:44,borderRadius:12,background:`${color}18`,display:"flex",alignItems:"center",justifyContent:"center"}}>
        <Icon d={icons[icon]} size={20} color={color}/>
      </div>
    </div>
  </div>
);

const ErrorBox = ({message,onRetry})=>(
  <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:16,display:"flex",alignItems:"center",gap:12,marginBottom:16}}>
    <Icon d={icons.alert} size={18} color={theme.danger}/>
    <p style={{fontSize:13,color:theme.danger,flex:1}}>{message}</p>
    {onRetry&&<Btn size="sm" variant="secondary" icon="refresh" onClick={onRetry}>Retry</Btn>}
  </div>
);

const EmptyState = ({message="No records found"})=>(
  <div style={{textAlign:"center",padding:"48px 24px",color:theme.textMuted}}>
    <Icon d={icons.search} size={32} color={theme.border} style={{marginBottom:12}}/>
    <p style={{fontSize:14,fontWeight:500}}>{message}</p>
  </div>
);

const Modal = ({title,onClose,children,large})=>(
  <div className="modal-overlay" onClick={e=>{if(e.target===e.currentTarget)onClose();}}>
    <div className={`modal${large?" modal-lg":""}`}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20,paddingBottom:16,borderBottom:`1px solid ${theme.border}`}}>
        <h2 style={{fontSize:18,fontWeight:700,fontFamily:"'Playfair Display',serif",color:theme.text}}>{title}</h2>
        <button onClick={onClose} style={{background:"none",border:"none",cursor:"pointer",padding:4}}>
          <Icon d={icons.close} size={20} color={theme.textMuted}/>
        </button>
      </div>
      {children}
    </div>
  </div>
);

// ─── Hooks ────────────────────────────────────────────────────────────────────
function useFetch(fetchFn,deps=[]) {
  const [data,setData]=useState(null);const [loading,setLoading]=useState(true);const [error,setError]=useState(null);
  const load=useCallback(async()=>{setLoading(true);setError(null);try{setData(await fetchFn());}catch(e){setError(e.message);}finally{setLoading(false);}},deps);
  useEffect(()=>{load();},[load]);
  return {data,loading,error,reload:load};
}
function useDebounce(value,delay=400) {
  const [dv,setDv]=useState(value);
  useEffect(()=>{const t=setTimeout(()=>setDv(value),delay);return()=>clearTimeout(t);},[value,delay]);
  return dv;
}
function exportCSV(rows,filename) {
  if(!rows?.length)return;
  const h=Object.keys(rows[0]);
  const csv=[h.join(","),...rows.map(r=>h.map(k=>JSON.stringify(r[k]??"")))].join("\n");
  const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([csv],{type:"text/csv"}));a.download=filename;a.click();
}

// ─── School Logo ─────────────────────────────────────────────────────────────
const LOGO_FULL  = "data:image/png;base64,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";
const LOGO_SMALL = "data:image/png;base64,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";

const SchoolCrest = ({size=40,style={}})=>(
  <img src={LOGO_SMALL} alt="Still Waters Group of Schools" style={{width:size,height:"auto",...style}}/>
);
const SchoolLogo = ({width=160,style={}})=>(
  <img src={LOGO_FULL} alt="Still Waters Group of Schools" style={{width,height:"auto",...style}}/>
);

// ─── Login Screen ─────────────────────────────────────────────────────────────
function LoginScreen({onLogin}) {
  const [campus,  setCampus]  = useState("swla");
  const [username,setUsername]= useState("");
  const [password,setPassword]= useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [show,    setShow]    = useState(false);

  const handleSubmit = async e => {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const d = await api.login({username, password, campus});
      localStorage.setItem("sw_token",  d.token);
      localStorage.setItem("sw_campus", campus);
      onLogin(d.user);
    } catch(e) { setError(e.message || "Invalid credentials"); }
    finally    { setLoading(false); }
  };

  return (
    <div style={{minHeight:"100vh",background:`linear-gradient(135deg,${theme.sidebarTop} 0%,${theme.red} 50%,${theme.turquoise} 100%)`,display:"flex",alignItems:"center",justifyContent:"center",padding:24,position:"relative",overflow:"hidden"}}>
      <div style={{position:"absolute",top:-80,right:-80,width:300,height:300,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
      <div style={{position:"absolute",bottom:-60,left:-60,width:220,height:220,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>

      <div style={{width:"100%",maxWidth:440,position:"relative",zIndex:1}}>
        {/* School branding */}
        <div style={{textAlign:"center",marginBottom:28}}>
          <SchoolLogo width={180} style={{marginBottom:14}}/>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.6)",letterSpacing:"0.1em",textTransform:"uppercase",marginBottom:2}}>School Information System</p>
          <p style={{fontSize:11,color:"rgba(255,255,255,0.45)",fontStyle:"italic"}}>"{SCHOOL.motto}"</p>
        </div>

        <div style={{background:"white",borderRadius:20,padding:36,boxShadow:"0 24px 64px rgba(26,5,8,0.4)"}}>
          <h2 style={{fontSize:19,fontWeight:700,marginBottom:2,fontFamily:"'Playfair Display',serif"}}>Welcome back</h2>
          <p style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>Sign in to access your portal</p>

          {/* Campus selector */}
          <div style={{marginBottom:20}}>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.06em"}}>Select Campus</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
              {SCHOOL.campuses.map(c=>(
                <button key={c.id} type="button" onClick={()=>setCampus(c.id)}
                  style={{padding:"10px 8px",borderRadius:10,border:`2px solid ${campus===c.id?theme.red:theme.border}`,background:campus===c.id?"#FEF2F2":"white",cursor:"pointer",transition:"all 0.15s",textAlign:"center"}}>
                  <p style={{fontSize:11,fontWeight:700,color:campus===c.id?theme.red:theme.text,lineHeight:1.3}}>{c.name}</p>
                  <p style={{fontSize:10,color:theme.textMuted,marginTop:1}}>{c.short}</p>
                </button>
              ))}
            </div>
          </div>

          {error&&(
            <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:16,display:"flex",alignItems:"center",gap:8}}>
              <Icon d={icons.alert} size={16} color={theme.danger}/>
              <p style={{fontSize:13,color:theme.danger}}>{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Username</label>
              <input className="form-input" value={username} onChange={e=>setUsername(e.target.value)} placeholder="Enter your username" required autoFocus/>
            </div>
            <div className="form-group">
              <label>Password</label>
              <div style={{position:"relative"}}>
                <input className="form-input" type={show?"text":"password"} value={password} onChange={e=>setPassword(e.target.value)} placeholder="••••••••" required style={{paddingRight:44}}/>
                <button type="button" onClick={()=>setShow(s=>!s)} style={{position:"absolute",right:12,top:"50%",transform:"translateY(-50%)",background:"none",border:"none",cursor:"pointer"}}>
                  <Icon d={icons.eye} size={16} color={theme.textMuted}/>
                </button>
              </div>
            </div>
            <Btn style={{width:"100%",justifyContent:"center",marginTop:8}} loading={loading}>
              {loading?"Signing in...":"Sign In"}
            </Btn>
          </form>

          <div style={{marginTop:20,padding:12,background:"#FEF2F2",borderRadius:8,fontSize:12,color:theme.textMuted,borderLeft:`3px solid ${theme.red}`}}>
            <p style={{fontWeight:700,marginBottom:4,color:theme.red}}>Demo Credentials</p>
            <p>Admin: <strong>admin</strong> / <strong>admin123</strong></p>
            <p>Teacher: <strong>teacher1</strong> / <strong>password123</strong></p>
            <p>Accountant: <strong>accountant</strong> / <strong>accounts123</strong></p>
          </div>
        </div>

        <p style={{textAlign:"center",marginTop:20,fontSize:11,color:"rgba(255,255,255,0.4)"}}>{SCHOOL.tel} · {SCHOOL.email}</p>
      </div>
    </div>
  );
}


// ─── App Shell ────────────────────────────────────────────────────────────────
function AppShell() {
  const [user,setUser]=useState(null);const [authLoading,setAuthLoading]=useState(true);
  const [page,setPage]=useState("dashboard");const [sidebarOpen,setSidebarOpen]=useState(true);
  const [profileOpen,setProfileOpen]=useState(false);
  const campus=SCHOOL.campuses.find(c=>c.id===localStorage.getItem("sw_campus"))||SCHOOL.campuses[0];

  useEffect(()=>{
    const style=document.createElement("style");style.textContent=globalStyles;document.head.appendChild(style);
    return()=>document.head.removeChild(style);
  },[]);

  useEffect(()=>{
    const token=localStorage.getItem("sw_token");
    if(!token){setAuthLoading(false);return;}
    api.me().then(d=>setUser(d.user)).catch(()=>localStorage.removeItem("sw_token")).finally(()=>setAuthLoading(false));
  },[]);

  const logout=()=>{localStorage.removeItem("sw_token");localStorage.removeItem("sw_campus");setUser(null);setPage("dashboard");};

  if(authLoading) return(
    <div style={{minHeight:"100vh",display:"flex",alignItems:"center",justifyContent:"center",background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`}}>
      <div style={{textAlign:"center",color:"white"}}>
        <SchoolLogo width={120} style={{marginBottom:16}}/>
        <div style={{width:36,height:36,border:"3px solid rgba(255,255,255,0.25)",borderTopColor:"white",borderRadius:"50%",animation:"spin 0.6s linear infinite",margin:"0 auto 12px"}}/>
        <p style={{fontSize:13,opacity:0.7}}>Loading Still Waters SIS...</p>
      </div>
    </div>
  );
  if(!user) return <LoginScreen onLogin={setUser}/>;

  const allowedPages = NAV_BY_ROLE[user.role] || NAV_BY_ROLE.teacher;
  const allNavItems=[
    {id:"dashboard",   label:"Dashboard",    icon:"dashboard"},
    {id:"students",    label:"Learners",      icon:"students"},
    {id:"results",     label:"Results & Marks",icon:"results"},
    {id:"attendance",  label:"Attendance",    icon:"attendance"},
    {id:"billing",     label:"Accounts",      icon:"billing"},
    {id:"discipline",  label:"Discipline",    icon:"discipline"},
    {id:"registration",label:"Registration",  icon:"registration"},
    {id:"reports",     label:"Reports",       icon:"reports"},
    {id:"assets",      label:"Asset Register",icon:"assets"},
    {id:"notices",     label:"Notice Board",   icon:"bell"},
    {id:"timetable",   label:"Timetable",       icon:"attendance"},
    {id:"hr",          label:"HR & Staff",      icon:"user"},
    {id:"users",       label:"User Management", icon:"lock"},
  ];
  const navItems = allNavItems.filter(n=>allowedPages.includes(n.id));
  if(!allowedPages.includes(page)) setPage("dashboard");

  return (
    <div style={{display:"flex",minHeight:"100vh",background:theme.bg}}>
      {/* ── Sidebar ── */}
      <aside style={{width:sidebarOpen?248:72,background:`linear-gradient(180deg,${theme.sidebarTop} 0%,${theme.sidebarBt} 100%)`,minHeight:"100vh",position:"sticky",top:0,height:"100vh",overflow:"hidden",transition:"width 0.25s ease",flexShrink:0,display:"flex",flexDirection:"column",boxShadow:"4px 0 20px rgba(26,5,8,0.25)"}}>
        {/* Logo area */}
        <div style={{padding:"20px 14px 16px",borderBottom:"1px solid rgba(255,255,255,0.07)"}}>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <SchoolLogo width={38} style={{flexShrink:0,objectFit:"contain"}}/>
            {sidebarOpen&&(
              <div style={{overflow:"hidden"}}>
                <p style={{color:"white",fontWeight:700,fontSize:13,fontFamily:"'Playfair Display',serif",lineHeight:1.2,whiteSpace:"nowrap"}}>Still Waters</p>
                <p style={{color:"rgba(255,255,255,0.45)",fontSize:9,letterSpacing:"0.08em",textTransform:"uppercase",whiteSpace:"nowrap"}}>Group of Schools</p>
              </div>
            )}
          </div>
          {/* Campus badge */}
          {sidebarOpen&&(
            <div style={{marginTop:10,padding:"5px 10px",background:"rgba(8,145,178,0.2)",borderRadius:6,border:"1px solid rgba(8,145,178,0.3)"}}>
              <p style={{fontSize:10,color:theme.tqLight,fontWeight:600,letterSpacing:"0.05em"}}>{campus.short} — {campus.name.split(" ").slice(2).join(" ")}</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav style={{flex:1,padding:"10px 8px",overflowY:"auto",overflowX:"hidden"}}>
          {navItems.map(item=>(
            <div key={item.id} className={`sidebar-item${page===item.id?" active":""}`} onClick={()=>setPage(item.id)}
              style={{display:"flex",alignItems:"center",gap:12,padding:"10px 12px",borderRadius:10,cursor:"pointer",marginBottom:2,color:page===item.id?"white":"rgba(255,255,255,0.6)",borderLeft:"3px solid transparent"}}>
              <Icon d={icons[item.icon]} size={17} style={{flexShrink:0}}/>
              {sidebarOpen&&<span style={{fontSize:13,fontWeight:500,whiteSpace:"nowrap"}}>{item.label}</span>}
            </div>
          ))}
        </nav>

        {/* User footer */}
        {sidebarOpen&&(
          <div style={{padding:"12px 14px",borderTop:"1px solid rgba(255,255,255,0.07)"}}>
            <div style={{display:"flex",alignItems:"center",gap:10,marginBottom:10}}>
              <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.redLight})`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,fontSize:12,fontWeight:700,color:"white"}}>
                {(user.full_name||user.fullName||"U").charAt(0).toUpperCase()}
              </div>
              <div style={{overflow:"hidden",flex:1}}>
                <p style={{fontSize:12,fontWeight:600,color:"white",whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis"}}>{user.full_name||user.fullName}</p>
                <RoleBadge role={user.role}/>
              </div>
            </div>
            <div style={{display:"flex",gap:6}}>
              <button onClick={()=>setProfileOpen(true)} className="btn" style={{flex:1,background:"rgba(255,255,255,0.07)",border:"none",borderRadius:7,padding:"7px 6px",color:"rgba(255,255,255,0.65)",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer"}}>
                <Icon d={icons.settings} size={12}/>Settings
              </button>
              <button onClick={logout} className="btn" style={{flex:1,background:"rgba(196,30,58,0.2)",border:"none",borderRadius:7,padding:"7px 6px",color:"rgba(255,100,100,0.9)",fontSize:11,fontWeight:500,display:"flex",alignItems:"center",justifyContent:"center",gap:5,cursor:"pointer"}}>
                <Icon d={icons.logout} size={12}/>Sign Out
              </button>
            </div>
          </div>
        )}
      </aside>

      {/* ── Main ── */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"auto",minWidth:0}}>
        {/* Header */}
        <header style={{background:"white",borderBottom:`1px solid ${theme.border}`,padding:"12px 24px",display:"flex",alignItems:"center",justifyContent:"space-between",position:"sticky",top:0,zIndex:100,boxShadow:"0 1px 4px rgba(196,30,58,0.06)"}}>
          <div style={{display:"flex",alignItems:"center",gap:14}}>
            <button onClick={()=>setSidebarOpen(o=>!o)} style={{background:"none",border:"none",cursor:"pointer",padding:6,borderRadius:8,display:"flex"}}>
              <Icon d={icons.menu} size={20} color={theme.textMuted}/>
            </button>
            <div>
              <h1 style={{fontSize:15,fontWeight:700,color:theme.text,fontFamily:"'Playfair Display',serif"}}>{navItems.find(n=>n.id===page)?.label||"Dashboard"}</h1>
              <p style={{fontSize:11,color:theme.textMuted}}>{campus.name} · {CURRENT_YEAR}</p>
            </div>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:10}}>
            <RoleBadge role={user.role}/>
            <div onClick={()=>setProfileOpen(true)} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 12px",borderRadius:10,background:theme.bg,cursor:"pointer",border:`1px solid ${theme.border}`}}>
              <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white"}}>
                {(user.full_name||user.fullName||"U").charAt(0)}
              </div>
              <p style={{fontSize:12,fontWeight:600,color:theme.text}}>{user.full_name||user.fullName}</p>
            </div>
          </div>
        </header>

        {/* Content */}
        <main style={{flex:1,padding:24}} className="fade-in" key={page}>
          {page==="dashboard"    && (user.role==="parent" ? <ParentPortal user={user}/> : <Dashboard user={user} campus={campus}/>)}
          {page==="students"     && <Students  user={user}/>}
          {page==="results"      && (user.role==="parent" ? <ParentPortal user={user} tab="results"/> : <Results user={user}/>)}
          {page==="attendance"   && (user.role==="parent" ? <ParentPortal user={user} tab="attendance"/> : <Attendance user={user}/>)}
          {page==="billing"      && (user.role==="parent" ? <ParentPortal user={user} tab="billing"/> : <Billing user={user}/>)}
          {page==="discipline"   && <Discipline user={user}/>}
          {page==="registration" && <Registration user={user}/>}
          {page==="reports"      && <Reports   user={user}/>}
          {page==="assets"       && <Assets    user={user}/>}
          {page==="notices"      && <Notices    user={user}/>}
          {page==="timetable"    && <Timetable  user={user}/>}
          {page==="hr"           && <HRModule   user={user}/>}
          {page==="users"        && <UserManagement user={user}/>}
        </main>
      </div>

      {profileOpen&&<ProfileModal user={user} campus={campus} onClose={()=>setProfileOpen(false)} onLogout={logout}/>}
    </div>
  );
}

export default function App() {
  return <ToastProvider><AppShell/></ToastProvider>;
}

// ─── Profile Modal ────────────────────────────────────────────────────────────
function ProfileModal({user,campus,onClose,onLogout}) {
  const toast=useToast();
  const [tab,setTab]=useState("profile");
  const [form,setForm]=useState({currentPassword:"",newPassword:"",confirmPassword:""});
  const [saving,setSaving]=useState(false);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const changePassword=async()=>{
    if(form.newPassword!==form.confirmPassword){toast("Passwords do not match","error");return;}
    if(form.newPassword.length<6){toast("Password must be at least 6 characters","error");return;}
    setSaving(true);
    try{await api.changePassword({currentPassword:form.currentPassword,newPassword:form.newPassword});toast("Password updated successfully");setForm({currentPassword:"",newPassword:"",confirmPassword:""});}
    catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };

  return (
    <Modal title="Account Settings" onClose={onClose}>
      <div style={{display:"flex",gap:6,marginBottom:20}}>
        {["profile","password"].map(t=>(
          <button key={t} onClick={()=>setTab(t)} style={{padding:"6px 16px",borderRadius:8,border:"none",cursor:"pointer",fontWeight:600,fontSize:13,background:tab===t?theme.red:"transparent",color:tab===t?"white":theme.textMuted}}>
            {t==="profile"?"My Profile":"Change Password"}
          </button>
        ))}
      </div>
      {tab==="profile"&&(
        <div>
          <div style={{display:"flex",gap:16,alignItems:"center",padding:20,background:"#FEF2F2",borderRadius:12,marginBottom:20,borderLeft:`4px solid ${theme.red}`}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white"}}>
              {(user.full_name||user.fullName||"U").charAt(0)}
            </div>
            <div>
              <p style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{user.full_name||user.fullName}</p>
              <RoleBadge role={user.role}/>
              <p style={{fontSize:11,color:theme.turquoise,marginTop:2}}>{campus.name}</p>
            </div>
          </div>
          {[["Username",user.username],["Email",user.email],["Role",ROLE_STYLE[user.role]?.label||user.role],["Campus",campus.name]].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"9px 0",borderBottom:`1px solid ${theme.border}`,fontSize:13}}>
              <span style={{color:theme.textMuted,fontWeight:600}}>{l}</span>
              <span style={{fontWeight:500}}>{v||"—"}</span>
            </div>
          ))}
          <div style={{marginTop:16}}><Btn variant="danger" icon="logout" onClick={onLogout}>Sign Out</Btn></div>
        </div>
      )}
      {tab==="password"&&(
        <div>
          <div className="form-group"><label>Current Password</label><input type="password" className="form-input" value={form.currentPassword} onChange={f("currentPassword")}/></div>
          <div className="form-group"><label>New Password</label><input type="password" className="form-input" value={form.newPassword} onChange={f("newPassword")}/></div>
          <div className="form-group"><label>Confirm New Password</label><input type="password" className="form-input" value={form.confirmPassword} onChange={f("confirmPassword")}/></div>
          <Btn onClick={changePassword} loading={saving} icon="lock">Update Password</Btn>
        </div>
      )}
    </Modal>
  );
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
function Dashboard({user,campus}) {
  const {data,loading,error,reload}=useFetch(()=>api.dashboardStats());
  const stats=data||{};const students=stats.students||{};const attendance=stats.attendance||{};const billing=stats.billing||{};
  const trendData=stats.attendanceTrend||[];const gradeData=stats.gradeBreakdown||[];
  const attRate=attendance.total>0?Math.round(attendance.present/attendance.total*100):0;

  // Role-specific dashboard cards
  const adminCards=[
    {icon:"students",  label:"Total Learners",   value:loading?null:students.total,   sub:`${students.active||0} active`,          color:theme.red},
    {icon:"billing",   label:"Outstanding Accs", value:loading?null:billing.overdue_count||0, sub:"accounts with balance due",   color:theme.danger},
    {icon:"attendance",label:"Present Today",    value:loading?null:attendance.present,sub:`${attRate}% attendance rate`,           color:theme.turquoise},
    {icon:"results",   label:"Avg Score",        value:loading?null:`${stats.avgScore||0}%`,sub:"Current term",                     color:theme.green},
  ];
  const principalCards=[
    {icon:"attendance",label:"Today's Attendance",value:loading?null:`${attRate}%`,sub:`${attendance.present||0} present today`,color:theme.turquoise},
    {icon:"students",  label:"Total Learners",    value:loading?null:students.total,  sub:`${students.active||0} active`,           color:theme.red},
    {icon:"results",   label:"Avg Score",         value:loading?null:`${stats.avgScore||0}%`,sub:"Current term",                    color:theme.green},
    {icon:"discipline",label:"Open Cases",        value:loading?null:stats.openDiscipline||0,sub:"discipline incidents",            color:theme.amber},
  ];
  const teacherCards=[
    {icon:"students",  label:"My Learners",    value:loading?null:students.myStudents||students.total,sub:"in your classes", color:theme.red},
    {icon:"attendance",label:"Present Today",  value:loading?null:attendance.present,sub:`${attRate}% rate`,                 color:theme.turquoise},
    {icon:"results",   label:"Results Entered",value:loading?null:stats.myResults||0,sub:"this term",                        color:theme.green},
    {icon:"book",      label:"Pending Marks",  value:loading?null:stats.pendingMarks||0,sub:"subjects awaiting entry",       color:theme.amber},
  ];
  const accountantCards=[
    {icon:"billing",   label:"Total Collected", value:loading?null:`$${parseFloat(billing.total_collected||0).toLocaleString()}`,sub:"this term",      color:theme.green},
    {icon:"billing",   label:"Outstanding",     value:loading?null:`$${parseFloat(billing.total_outstanding||0).toLocaleString()}`,sub:"balance due",  color:theme.danger},
    {icon:"students",  label:"Fee Defaulters",  value:loading?null:billing.overdue_count||0,sub:"overdue accounts",                                    color:theme.amber},
    {icon:"chart",     label:"Total Billed",    value:loading?null:`$${parseFloat(billing.total_billed||0).toLocaleString()}`,sub:"all invoices",      color:theme.turquoise},
  ];
  const cards=user.role==="principal"?principalCards:user.role==="teacher"?teacherCards:user.role==="accountant"?accountantCards:adminCards;

  return (
    <div>
      {/* Welcome banner */}
      <div style={{background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,borderRadius:16,padding:"24px 28px",marginBottom:24,display:"flex",alignItems:"center",justifyContent:"space-between",color:"white",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div style={{position:"absolute",right:60,bottom:-30,width:80,height:80,borderRadius:"50%",background:"rgba(255,255,255,0.04)"}}/>
        <div>
          <p style={{fontSize:13,opacity:0.7,marginBottom:4,letterSpacing:"0.05em"}}>WELCOME BACK</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:22,marginBottom:4}}>{user.full_name||user.fullName}</h2>
          <p style={{fontSize:12,opacity:0.6}}>{campus.name} · {ROLE_STYLE[user.role]?.label}</p>
        </div>
        <SchoolLogo width={110} style={{opacity:0.55}}/>
      </div>

      {error&&<ErrorBox message={error} onRetry={reload}/>}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(200px,1fr))",gap:16,marginBottom:24}}>
        {cards.map((c,i)=><StatCard key={i} {...c}/>)}
      </div>

      {/* Charts — only for admin and principal */}
      {["admin","principal"].includes(user.role)&&(
        <div style={{display:"grid",gridTemplateColumns:"2fr 1fr",gap:16,marginBottom:16}}>
          <div style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
            <h3 style={{fontSize:14,fontWeight:700,marginBottom:4,fontFamily:"'Playfair Display',serif"}}>Attendance Trend</h3>
            <p style={{fontSize:12,color:theme.textMuted,marginBottom:16}}>Last 7 school days</p>
            {loading?<div className="skeleton" style={{height:200}}/>:
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={trendData.map(d=>({day:d.date?.slice(5),present:parseInt(d.present||0),absent:parseInt(d.absent||0)}))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis dataKey="day" tick={{fontSize:11}}/><YAxis tick={{fontSize:11}}/>
                <Tooltip/><Legend/>
                <Bar dataKey="present" fill={theme.turquoise} radius={[4,4,0,0]} name="Present"/>
                <Bar dataKey="absent"  fill={theme.red}       radius={[4,4,0,0]} name="Absent"/>
              </BarChart>
            </ResponsiveContainer>}
          </div>
          <div style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
            <h3 style={{fontSize:14,fontWeight:700,marginBottom:4,fontFamily:"'Playfair Display',serif"}}>Enrolment by Form</h3>
            <p style={{fontSize:12,color:theme.textMuted,marginBottom:16}}>Active learners</p>
            {loading?<div className="skeleton" style={{height:200}}/>:
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={gradeData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#F3F4F6"/>
                <XAxis type="number" tick={{fontSize:10}}/><YAxis dataKey="grade" type="category" tick={{fontSize:10}} width={36}/>
                <Tooltip/>
                <Bar dataKey="count" fill={theme.red} radius={[0,4,4,0]} name="Learners"/>
              </BarChart>
            </ResponsiveContainer>}
          </div>
        </div>
      )}

      {/* Billing summary — admin and accountant */}
      {["admin","accountant"].includes(user.role)&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:16}}>
          {[["Total Billed",`$${parseFloat(billing.total_billed||0).toLocaleString()}`,theme.turquoise],["Total Collected",`$${parseFloat(billing.total_collected||0).toLocaleString()}`,theme.green],["Outstanding",`$${parseFloat(billing.total_outstanding||0).toLocaleString()}`,theme.danger]].map(([l,v,c])=>(
            <div key={l} style={{background:"white",borderRadius:12,padding:"20px 24px",boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`}}>
              <p style={{fontSize:12,fontWeight:600,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:4}}>{l}</p>
              <p style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif",color:c}}>{loading?"…":v}</p>
            </div>
          ))}
        </div>
      )}

      {/* Notice Board preview */}
      <NoticesTicker/>
    </div>
  );
}

// ─── Notices Ticker (dashboard widget) ───────────────────────────────────────
function NoticesTicker() {
  const {data} = useFetch(()=>api.notices());
  const notices = (data?.notices||[]).slice(0,3);
  if (!notices.length) return null;
  return (
    <div style={{background:"white",borderRadius:14,padding:20,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
      <div style={{display:"flex",alignItems:"center",gap:8,marginBottom:14}}>
        <Icon d={icons.bell} size={16} color={theme.red}/>
        <p style={{fontWeight:700,fontSize:14,fontFamily:"'Playfair Display',serif"}}>Latest Notices</p>
      </div>
      {notices.map(n=>(
        <div key={n.id} style={{padding:"10px 0",borderBottom:`1px solid ${theme.border}`,display:"flex",gap:12,alignItems:"flex-start"}}>
          <div style={{width:6,height:6,borderRadius:"50%",background:theme.red,marginTop:6,flexShrink:0}}/>
          <div>
            <p style={{fontSize:13,fontWeight:600}}>{n.title}</p>
            <p style={{fontSize:12,color:theme.textMuted,marginTop:2,lineHeight:1.5}}>{n.content.slice(0,100)}{n.content.length>100?"…":""}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Students (Learners) ──────────────────────────────────────────────────────
function Students({user}) {
  const toast=useToast();
  const isTeacher = user.role === "teacher";

  // ── Teacher view: only their assigned students via timetable ─────────────
  const {data:myData, loading:myLoading, error:myError} = useFetch(
    ()=> isTeacher ? api.myStudents() : Promise.resolve(null), []
  );

  // ── Admin/Principal view: full student list ───────────────────────────────
  const [search,setSearch]=useState("");const [form_filter,setFormFilter]=useState("");const [pg,setPg]=useState(1);
  const [modal,setModal]=useState(null);const [selected,setSelected]=useState(null);
  const [saving,setSaving]=useState(false);const [formError,setFormError]=useState("");const [form,setForm]=useState({});
  const [createParent,setCreateParent]=useState(false);
  const [parentForm,setParentForm]=useState({username:"",password:"",fullName:""});
  const dSearch=useDebounce(search,400);
  const {data,loading,error,reload}=useFetch(
    ()=> !isTeacher ? api.students({search:dSearch,grade:form_filter,page:pg,limit:20}) : Promise.resolve(null),
    [dSearch,form_filter,pg,isTeacher]
  );
  const students=data?.students||[];const pagination=data?.pagination||{};
  const canEdit=["admin","principal"].includes(user.role);
  const canDelete=user.role==="admin";
  const f=v=>e=>setForm(p=>({...p,[v]:e.target.value}));
  const pf=v=>e=>setParentForm(p=>({...p,[v]:e.target.value}));
  const openAdd=()=>{setForm({});setFormError("");setCreateParent(false);setParentForm({username:"",password:"",fullName:""});setModal("add");};
  const openEdit=s=>{setSelected(s);setForm({firstName:s.first_name,lastName:s.last_name,dateOfBirth:s.date_of_birth?.split("T")[0],gender:s.gender,grade:s.grade||s.form,class:s.class,email:s.email,phone:s.phone,address:s.address,parentName:s.parent_name,parentPhone:s.parent_phone,status:s.status});setFormError("");setCreateParent(false);setModal("edit");};
  const handleSave=async()=>{
    setFormError(""); setSaving(true);
    try {
      const studentRes = modal==="add" ? await api.createStudent(form) : await api.updateStudent(selected.id,form);
      if(modal==="add" && createParent && parentForm.username && parentForm.password && parentForm.fullName) {
        if(parentForm.password.length<6){setFormError("Parent password must be at least 6 characters");setSaving(false);return;}
        const newStudentId = studentRes.student?.id;
        const parentRes = await api.createUser({username:parentForm.username,password:parentForm.password,full_name:parentForm.fullName,email:form.parentEmail||"",role:"parent",campus:localStorage.getItem("sw_campus")||"swla",is_approved:true});
        if(newStudentId && parentRes.user?.id) await api.linkParentStudent({parentUserId:parentRes.user.id,studentId:newStudentId});
        toast(`Learner enrolled & parent login created for ${parentForm.fullName}`);
      } else {
        toast(modal==="add"?"Learner enrolled successfully":"Learner record updated");
      }
      setModal(null); reload();
    } catch(e){setFormError(e.message);}
    finally{setSaving(false);}
  };
  const handleDelete=async id=>{if(!window.confirm("Delete this learner record? This cannot be undone."))return;try{await api.deleteStudent(id);toast("Record deleted","info");reload();}catch(e){toast(e.message,"error");}};
  React.useEffect(()=>{
    if(createParent && form.parentName && !parentForm.username){
      const sug=form.parentName.toLowerCase().replace(/\s+/g,"").slice(0,12);
      setParentForm(p=>({...p,username:sug,fullName:form.parentName}));
    }
  },[createParent,form.parentName]);

  // ── TEACHER VIEW ─────────────────────────────────────────────────────────
  if (isTeacher) {
    const myStudents   = myData?.students    || [];
    const assignments  = myData?.assignments || [];

    // Build subject groupings: { "Form 1 — Biology": [...students] }
    const subjectMap = {}; // subjectId+form -> {label, students}
    assignments.forEach(a => {
      const key = `${a.form}__${a.subject_id}`;
      if (!subjectMap[key]) {
        subjectMap[key] = {
          key, form: a.form, subjectId: a.subject_id,
          subjectName: a.subject_name || "—",
          label: `${FORM_LABEL[a.form]||`Form ${a.form}`} — ${a.subject_name||"—"}`,
          students: [],
        };
      }
    });

    // Assign students to their form groups
    myStudents.forEach(s => {
      Object.values(subjectMap).forEach(grp => {
        if (grp.form === (s.grade||s.form)) {
          if (!grp.students.find(x=>x.id===s.id)) grp.students.push(s);
        }
      });
    });

    const groups = Object.values(subjectMap).sort((a,b)=>a.form.localeCompare(b.form)||a.subjectName.localeCompare(b.subjectName));
    const uniqueForms = [...new Set(groups.map(g=>g.form))];

    return (
      <div>
        <div style={{marginBottom:20}}>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>My Classes & Learners</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>Showing only learners in forms where you are assigned on the timetable</p>
        </div>

        {myLoading && <div style={{padding:32,textAlign:"center"}}><span className="spinner spinner-dark"/></div>}
        {myError   && <ErrorBox message={myError}/>}

        {!myLoading && groups.length === 0 && (
          <div style={{background:"white",borderRadius:14,padding:48,textAlign:"center",border:`1px solid ${theme.border}`}}>
            <Icon d={icons.attendance} size={36} color={theme.border} style={{marginBottom:12}}/>
            <h3 style={{fontSize:16,fontWeight:700,marginBottom:8}}>No classes assigned yet</h3>
            <p style={{fontSize:13,color:theme.textMuted}}>You have not been assigned to any timetable slots yet.</p>
            <p style={{fontSize:12,color:theme.textMuted,marginTop:4}}>Contact the admin or principal to set up your timetable.</p>
          </div>
        )}

        {/* Stats strip */}
        {groups.length > 0 && (
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
            {[
              ["My Forms",    uniqueForms.length,      theme.red],
              ["My Subjects", groups.length,            theme.turquoise],
              ["Total Learners", myStudents.length,     theme.green],
            ].map(([l,v,c])=>(
              <div key={l} style={{background:"white",padding:18,borderRadius:12,textAlign:"center",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`}}>
                <p style={{fontSize:26,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</p>
                <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
              </div>
            ))}
          </div>
        )}

        {/* Groups */}
        {groups.map(grp=>(
          <div key={grp.key} style={{marginBottom:20,background:"white",borderRadius:14,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",overflow:"hidden"}}>
            <div style={{padding:"12px 20px",background:"linear-gradient(135deg,#FEF2F2,white)",borderBottom:`1px solid ${theme.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
              <div>
                <p style={{fontWeight:700,fontSize:14,fontFamily:"'Playfair Display',serif",color:theme.red}}>{grp.label}</p>
                <p style={{fontSize:11,color:theme.textMuted,marginTop:1}}>{grp.students.length} learner{grp.students.length!==1?"s":""}</p>
              </div>
              <Badge color="tq">{grp.form}</Badge>
            </div>
            {grp.students.length === 0 ? (
              <div style={{padding:"20px 24px"}}><p style={{fontSize:13,color:theme.textMuted}}>No active learners in this form.</p></div>
            ) : (
              <div style={{overflowX:"auto"}}>
                <table>
                  <thead><tr style={{background:"#FAFAFA"}}><th>Learner</th><th>Form</th><th>Gender</th><th>Parent Phone</th><th>Status</th><th>Actions</th></tr></thead>
                  <tbody>{grp.students.map(s=>(
                    <tr key={s.id}>
                      <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>{s.first_name[0]}{s.last_name[0]}</div>
                        <div><p style={{fontWeight:600,fontSize:13}}>{s.last_name}, {s.first_name}</p><p style={{fontSize:11,color:theme.turquoise,fontFamily:"monospace"}}>{s.student_id}</p></div>
                      </div></td>
                      <td><Badge color="tq">{FORM_LABEL[s.grade||s.form]||s.grade||s.form}</Badge></td>
                      <td style={{fontSize:13,color:theme.textMuted}}>{s.gender}</td>
                      <td style={{fontSize:13}}>{s.parent_phone||"—"}</td>
                      <td><Badge color={s.status==="Active"?"green":"gray"}>{s.status}</Badge></td>
                      <td>
                        <button className="btn" onClick={()=>{setSelected(s);setModal("view");}} style={{background:theme.bg,border:`1px solid ${theme.border}`,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500}}>View</button>
                      </td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            )}
          </div>
        ))}

        {/* View modal (read-only for teachers) */}
        {modal==="view" && selected && (
          <Modal title="Learner Details" onClose={()=>setModal(null)}>
            <div style={{display:"flex",gap:16,alignItems:"center",padding:20,background:"#FEF2F2",borderRadius:12,marginBottom:20,borderLeft:`4px solid ${theme.red}`}}>
              <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"white"}}>{selected.first_name[0]}{selected.last_name[0]}</div>
              <div>
                <h3 style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{selected.last_name}, {selected.first_name}</h3>
                <p style={{fontSize:13,color:theme.textMuted}}>{selected.student_id} · {FORM_LABEL[selected.grade||selected.form]||selected.grade} · {selected.class}</p>
                <Badge color={selected.status==="Active"?"green":"gray"}>{selected.status}</Badge>
              </div>
            </div>
            {[["Gender",selected.gender],["Parent/Guardian",selected.parent_name],["Parent Phone",selected.parent_phone],["Status",selected.status]].map(([l,v])=>(
              <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${theme.border}`,fontSize:13}}>
                <span style={{color:theme.textMuted,fontWeight:600}}>{l}</span><span style={{fontWeight:500}}>{v||"—"}</span>
              </div>
            ))}
            <div style={{marginTop:14}}>
              <Btn size="sm" icon="download" variant="tq" onClick={()=>window.open(api.reportCardURL(selected.id,{term:"Term 1",year:CURRENT_YEAR,report_type:"term_report"}),"_blank")}>View Report Card</Btn>
            </div>
          </Modal>
        )}
      </div>
    );
  }

  // ── ADMIN / PRINCIPAL VIEW ────────────────────────────────────────────────
  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Learner Records</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>{pagination.total||0} learners enrolled · {SCHOOL.name}</p>
        </div>
        {canEdit&&<Btn icon="plus" onClick={openAdd}>Enrol Learner</Btn>}
      </div>
      {error&&<ErrorBox message={error} onRetry={reload}/>}
      <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,overflow:"hidden"}}>
        <div style={{padding:16,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:12,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}><SearchInput value={search} onChange={v=>{setSearch(v);setPg(1);}} placeholder="Search by name, ID..."/></div>
          <select className="form-input" style={{width:160}} value={form_filter} onChange={e=>{setFormFilter(e.target.value);setPg(1);}}>
            <option value="">All Forms</option>
            {FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}
          </select>
          <Btn variant="secondary" size="sm" icon="download" onClick={()=>exportCSV(students.map(s=>({ID:s.student_id,Surname:s.last_name,Firstname:s.first_name,Form:FORM_LABEL[s.grade]||s.grade,Class:s.class,Gender:s.gender,Status:s.status})),"learners.csv")}>Export CSV</Btn>
        </div>
        {loading?<div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:52,marginBottom:8}}/>)}</div>
        :students.length===0?<EmptyState message="No learners found"/>:(
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr style={{background:"#FEF2F2"}}><th>Learner</th><th>Form / Class</th><th>Gender</th><th>Parent Phone</th><th>Status</th><th>Actions</th></tr></thead>
              <tbody>{students.map(s=>(
                <tr key={s.id}>
                  <td><div style={{display:"flex",alignItems:"center",gap:10}}>
                    <div style={{width:34,height:34,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:11,fontWeight:700,color:"white",flexShrink:0}}>{s.first_name[0]}{s.last_name[0]}</div>
                    <div><p style={{fontWeight:600,fontSize:13}}>{s.last_name}, {s.first_name}</p><p style={{fontSize:11,color:theme.turquoise,fontFamily:"monospace"}}>{s.student_id}</p></div>
                  </div></td>
                  <td><Badge color="tq">{FORM_LABEL[s.grade]||s.grade}</Badge> <span style={{fontSize:12,color:theme.textMuted,marginLeft:4}}>{s.class}</span></td>
                  <td style={{fontSize:13,color:theme.textMuted}}>{s.gender}</td>
                  <td style={{fontSize:13}}>{s.parent_phone}</td>
                  <td><Badge color={s.status==="Active"?"green":s.status==="Graduated"?"purple":"gray"}>{s.status}</Badge></td>
                  <td><div style={{display:"flex",gap:5}}>
                    <button className="btn" onClick={()=>{setSelected(s);setModal("view");}} style={{background:theme.bg,border:`1px solid ${theme.border}`,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500}}>View</button>
                    {canEdit&&<button className="btn" onClick={()=>openEdit(s)} style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500,color:"#1D4ED8"}}>Edit</button>}
                    {canDelete&&<button className="btn" onClick={()=>handleDelete(s.id)} style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500,color:theme.danger}}>Del</button>}
                  </div></td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
        {pagination.pages>1&&(
          <div style={{padding:16,display:"flex",justifyContent:"center",gap:6,borderTop:`1px solid ${theme.border}`}}>
            {[...Array(pagination.pages)].map((_,i)=>(
              <button key={i} className="btn" onClick={()=>setPg(i+1)} style={{width:32,height:32,borderRadius:6,border:`1px solid ${pg===i+1?theme.red:theme.border}`,background:pg===i+1?theme.red:"white",color:pg===i+1?"white":theme.text,fontSize:13,cursor:"pointer",fontWeight:600}}>{i+1}</button>
            ))}
          </div>
        )}
      </div>

      {modal&&(
        <Modal title={modal==="view"?"Learner Details":modal==="edit"?"Edit Learner":"Enrol New Learner"} onClose={()=>setModal(null)}>
          {modal==="view"&&selected?(
            <div>
              <div style={{display:"flex",gap:16,alignItems:"center",padding:20,background:"#FEF2F2",borderRadius:12,marginBottom:20,borderLeft:`4px solid ${theme.red}`}}>
                <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:16,fontWeight:700,color:"white"}}>{selected.first_name[0]}{selected.last_name[0]}</div>
                <div>
                  <h3 style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{selected.last_name}, {selected.first_name}</h3>
                  <p style={{fontSize:13,color:theme.textMuted}}>{selected.student_id} · {FORM_LABEL[selected.grade]||selected.grade} · {selected.class}</p>
                  <Badge color={selected.status==="Active"?"green":selected.status==="Graduated"?"purple":"gray"}>{selected.status}</Badge>
                </div>
              </div>
              {[["Date of Birth",selected.date_of_birth?.split("T")[0]],["Gender",selected.gender],["Email",selected.email],["Phone",selected.phone],["Address",selected.address],["Parent/Guardian",selected.parent_name],["Parent Phone",selected.parent_phone],["Enrolled",selected.enroll_date?.split("T")[0]]].map(([l,v])=>(
                <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${theme.border}`,fontSize:13}}>
                  <span style={{color:theme.textMuted,fontWeight:600}}>{l}</span><span style={{fontWeight:500}}>{v||"—"}</span>
                </div>
              ))}
              <div style={{display:"flex",gap:8,marginTop:16,flexWrap:"wrap"}}>
                <Btn size="sm" icon="download" variant="tq" onClick={()=>window.open(api.reportCardURL(selected.id,{term:"Term 1",year:CURRENT_YEAR,report_type:"term_report"}),"_blank")}>Term Report PDF</Btn>
                <Btn size="sm" icon="download" variant="secondary" onClick={()=>window.open(api.reportCardURL(selected.id,{term:"Term 1",year:CURRENT_YEAR,report_type:"mark_reader"}),"_blank")}>Mark Reader PDF</Btn>
              </div>
            </div>
          ):(
            <>
              {formError&&<div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:8,padding:"10px 14px",marginBottom:16,fontSize:13,color:theme.danger}}>{formError}</div>}
              <div className="form-row">
                <div className="form-group"><label>Surname *</label><input className="form-input" value={form.lastName||""} onChange={f("lastName")}/></div>
                <div className="form-group"><label>First Name(s) *</label><input className="form-input" value={form.firstName||""} onChange={f("firstName")}/></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Date of Birth *</label><input type="date" className="form-input" value={form.dateOfBirth||""} onChange={f("dateOfBirth")}/></div>
                <div className="form-group"><label>Gender</label><select className="form-input" value={form.gender||""} onChange={f("gender")}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label>Form *</label><select className="form-input" value={form.grade||""} onChange={f("grade")}><option value="">Select</option>{FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}</select></div>
                <div className="form-group"><label>Class</label><input className="form-input" placeholder="e.g. 3C" value={form.class||""} onChange={f("class")}/></div>
              </div>
              <div className="form-group"><label>Email</label><input type="email" className="form-input" value={form.email||""} onChange={f("email")}/></div>
              <div className="form-group"><label>Home Address</label><input className="form-input" value={form.address||""} onChange={f("address")}/></div>
              <div className="form-row">
                <div className="form-group"><label>Parent/Guardian Name</label><input className="form-input" value={form.parentName||""} onChange={f("parentName")}/></div>
                <div className="form-group"><label>Parent Phone</label><input className="form-input" value={form.parentPhone||""} onChange={f("parentPhone")}/></div>
              </div>
              {modal==="edit"&&<div className="form-group"><label>Status</label><select className="form-input" value={form.status||"Active"} onChange={f("status")}><option>Active</option><option>Inactive</option><option>Graduated</option></select></div>}
              {modal==="add"&&(
                <div style={{marginTop:8,padding:16,borderRadius:10,border:`2px dashed ${createParent?theme.turquoise:theme.border}`,background:createParent?"#F0FDFF":"#FAFAFA",transition:"all 0.2s"}}>
                  <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:createParent?14:0}}>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <Icon d={icons.user} size={16} color={createParent?theme.turquoise:theme.textMuted}/>
                      <div>
                        <p style={{fontSize:13,fontWeight:700,color:createParent?theme.turquoise:theme.text}}>Create Parent Login Account</p>
                        <p style={{fontSize:11,color:theme.textMuted}}>Give the parent access to the portal right now</p>
                      </div>
                    </div>
                    <button type="button" onClick={()=>setCreateParent(v=>!v)} style={{width:44,height:24,borderRadius:12,border:"none",cursor:"pointer",background:createParent?theme.turquoise:theme.border,transition:"all 0.2s",position:"relative"}}>
                      <div style={{width:18,height:18,borderRadius:"50%",background:"white",position:"absolute",top:3,left:createParent?23:3,transition:"all 0.2s",boxShadow:"0 1px 3px rgba(0,0,0,0.2)"}}/>
                    </button>
                  </div>
                  {createParent&&(
                    <>
                      <div className="form-group" style={{marginBottom:10}}><label>Parent Full Name *</label><input className="form-input" placeholder="e.g. Blessing Moyo" value={parentForm.fullName} onChange={pf("fullName")}/></div>
                      <div className="form-row">
                        <div className="form-group" style={{marginBottom:10}}><label>Username *</label><input className="form-input" placeholder="e.g. bmoyo" value={parentForm.username} onChange={pf("username")}/></div>
                        <div className="form-group" style={{marginBottom:10}}><label>Password *</label><input type="password" className="form-input" placeholder="Min 6 characters" value={parentForm.password} onChange={pf("password")}/></div>
                      </div>
                      <div style={{padding:"8px 12px",background:"#CFFAFE",borderRadius:8,fontSize:11,color:"#0E7490"}}>✓ Account will be <strong>immediately active</strong> — parent can log in straight away.</div>
                    </>
                  )}
                </div>
              )}
              <div style={{display:"flex",gap:10,marginTop:12}}>
                <Btn onClick={handleSave} loading={saving}>{modal==="add"?"Enrol Learner":"Save Changes"}</Btn>
                <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
              </div>
            </>
          )}
        </Modal>
      )}
    </div>
  );
}

// ─── Grading helpers (client-side preview) ────────────────────────────────────
const GRADE_COLOR = {"A*":theme.green,"A":theme.green,"B":theme.turquoise,"C":theme.amber,"D":theme.grey,"E":theme.danger,"F":theme.danger,"G":theme.danger,"U":theme.danger};

function previewGrade(mark, curriculum) {
  const m = parseFloat(mark);
  if (isNaN(m)) return null;
  if (curriculum === "ZIMSEC_O") {
    if (m>=75) return {g:"A",  r:"Distinction"};
    if (m>=65) return {g:"B",  r:"Merit"};
    if (m>=50) return {g:"C",  r:"Credit"};
    if (m>=40) return {g:"D",  r:"Satisfactory"};
    if (m>=30) return {g:"E",  r:"Fail"};
    return             {g:"U",  r:"Unclassified"};
  }
  if (curriculum === "ZIMSEC_A") {
    if (m>=80) return {g:"A",  r:"Excellent"};
    if (m>=70) return {g:"B",  r:"Very Good"};
    if (m>=60) return {g:"C",  r:"Good"};
    if (m>=50) return {g:"D",  r:"Satisfactory"};
    if (m>=40) return {g:"E",  r:"Pass"};
    return             {g:"F",  r:"Fail"};
  }
  if (m>=90) return {g:"A*", r:"Outstanding"};
  if (m>=80) return {g:"A",  r:"Excellent"};
  if (m>=70) return {g:"B",  r:"Very Good"};
  if (m>=60) return {g:"C",  r:"Good"};
  if (m>=50) return {g:"D",  r:"Satisfactory"};
  if (m>=40) return {g:"E",  r:"Pass"};
  if (m>=30) return {g:"F",  r:"Below Pass"};
  if (m>=20) return {g:"G",  r:"Poor"};
  return             {g:"U",  r:"Ungraded"};
}

const EFFORT_LABEL = {4:"Excellent",3:"Good",2:"Satisfactory",1:"Can Improve",0:"Poor","-1":"Unacceptable"};

// ─── Results ──────────────────────────────────────────────────────────────────
function Results({user}) {
  const toast = useToast();
  const [reportType, setReportType] = useState("term_report"); // term_report | mark_reader
  const [term,  setTerm]  = useState("Term 1");
  const [year,  setYear]  = useState(CURRENT_YEAR.toString());
  const [formF, setFormF] = useState("");
  const [search,setSearch]= useState("");
  const [modal, setModal] = useState(null);
  const [saving,setSaving]= useState(false);
  const [form,  setForm]  = useState({});
  const [showGrading, setShowGrading] = useState(false);

  const {data,loading,error,reload} = useFetch(
    ()=>api.results({term, year, grade:formF, report_type:reportType, limit:80}),
    [term, year, formF, reportType]
  );
  const {data:subjData} = useFetch(()=>api.subjects(form.formForSubject ? {form:form.formForSubject} : {}), [form.formForSubject]);
  const subjects = subjData?.subjects || [];

  const results = (data?.results||[]).filter(r=>
    search===""||`${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase())
  );

  const canEdit = ["admin","teacher"].includes(user.role);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleSave = async () => {
    if (!form.studentId || !form.subjectId || !form.mark) {
      toast("Learner ID, subject and mark are required","error"); return;
    }
    setSaving(true);
    try {
      await api.saveResult({
        studentId: form.studentId,
        subjectId: form.subjectId,
        term, year: parseInt(year),
        report_type: reportType,
        mark: parseFloat(form.mark),
        effort: form.effort ? parseInt(form.effort) : undefined,
        class_average: form.classAverage ? parseFloat(form.classAverage) : undefined,
        remarks: form.remarks,
      });
      toast(reportType==="mark_reader" ? "Mark Reader entry saved" : "Result saved");
      setModal(null); reload();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Delete this result?")) return;
    try { await api.deleteResult(id); toast("Result deleted","info"); reload(); }
    catch(e) { toast(e.message,"error"); }
  };

  // Grade preview when typing mark
  const selectedSubj = subjects.find(s=>String(s.id)===String(form.subjectId));
  const gradePreview = form.mark ? previewGrade(form.mark, selectedSubj?.curriculum||"ZIMSEC_O") : null;

  const summary = {
    A:    results.filter(r=>["A","A*"].includes(r.grade)).length,
    B:    results.filter(r=>r.grade==="B").length,
    C:    results.filter(r=>r.grade==="C").length,
    fail: results.filter(r=>["D","E","U","F","G"].includes(r.grade)).length,
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Results & Marks</h2>
          <p style={{fontSize:12,color:theme.textMuted}}>ZIMSEC O-Level · ZIMSEC A-Level · Cambridge</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <button onClick={()=>setShowGrading(s=>!s)} style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${theme.border}`,background:showGrading?theme.turquoise:"white",color:showGrading?"white":theme.textMuted,fontSize:12,fontWeight:600,cursor:"pointer"}}>
            Grade Scale
          </button>
          <Btn variant="secondary" size="sm" icon="download" onClick={()=>exportCSV(
            results.map(r=>({Learner:`${r.last_name} ${r.first_name}`,Form:r.student_grade,Subject:r.subject_name,Mark:r.mark||r.total,Grade:r.grade,Effort:r.effort||"",ClassAvg:r.class_average||"",Term:r.term,Year:r.year,Type:r.report_type})),
            `results-${reportType}-${term}-${year}.csv`
          )}>Export</Btn>
          {canEdit&&<Btn icon="plus" onClick={()=>{setForm({term,year:CURRENT_YEAR,mark:""});setModal("add");}}>
            {reportType==="mark_reader"?"Add Mark Reader":"Add Result"}
          </Btn>}
        </div>
      </div>

      {/* Grading scale reference */}
      {showGrading&&(
        <div style={{background:"white",borderRadius:12,padding:20,marginBottom:16,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
          <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:20}}>
            {[
              {label:"ZIMSEC O-Level",grades:[{g:"A",r:"Distinction",range:"75–100%"},{g:"B",r:"Merit",range:"65–74%"},{g:"C",r:"Credit",range:"50–64%"},{g:"D",r:"Satisfactory",range:"40–49%"},{g:"E",r:"Fail",range:"30–39%"},{g:"U",r:"Unclassified",range:"Below 30%"}]},
              {label:"ZIMSEC A-Level",grades:[{g:"A",r:"Excellent",range:"80–100%"},{g:"B",r:"Very Good",range:"70–79%"},{g:"C",r:"Good",range:"60–69%"},{g:"D",r:"Satisfactory",range:"50–59%"},{g:"E",r:"Pass",range:"40–49%"},{g:"F",r:"Fail",range:"Below 40%"}]},
              {label:"Cambridge",grades:[{g:"A*",r:"Outstanding",range:"90–100%"},{g:"A",r:"Excellent",range:"80–89%"},{g:"B",r:"Very Good",range:"70–79%"},{g:"C",r:"Good",range:"60–69%"},{g:"D",r:"Satisfactory",range:"50–59%"},{g:"E",r:"Pass",range:"40–49%"},{g:"U",r:"Ungraded",range:"0–39%"}]},
            ].map(({label,grades})=>(
              <div key={label}>
                <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{label}</p>
                {grades.map(({g,r,range})=>(
                  <div key={g} style={{display:"flex",justifyContent:"space-between",padding:"4px 0",borderBottom:`1px solid ${theme.border}`,fontSize:12}}>
                    <span className="badge" style={{background:`${GRADE_COLOR[g]||"#64748B"}20`,color:GRADE_COLOR[g]||"#64748B",fontWeight:700,padding:"1px 8px"}}>{g}</span>
                    <span style={{color:theme.textMuted}}>{r}</span>
                    <span style={{fontWeight:600}}>{range}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div style={{marginTop:12,padding:10,background:"#FEF3C7",borderRadius:8,fontSize:12,color:"#92400E"}}>
            <strong>Effort symbols (Mark Reader only):</strong> 4=Excellent · 3=Good · 2=Satisfactory · 1=Can Improve · 0=Poor · -1=Unacceptable
          </div>
        </div>
      )}

      {error&&<ErrorBox message={error} onRetry={reload}/>}

      {/* Report type tabs */}
      <div style={{display:"flex",gap:8,marginBottom:16}}>
        {[["term_report","📋 Full Term Report","End of term exam marks"],["mark_reader","📊 Half Term Mark Reader","Mid-term continuous assessment"]].map(([id,label,desc])=>(
          <div key={id} onClick={()=>setReportType(id)} style={{flex:1,padding:"12px 16px",borderRadius:12,border:`2px solid ${reportType===id?theme.red:theme.border}`,background:reportType===id?"#FEF2F2":"white",cursor:"pointer",transition:"all 0.15s"}}>
            <p style={{fontWeight:700,fontSize:13,color:reportType===id?theme.red:theme.text}}>{label}</p>
            <p style={{fontSize:11,color:theme.textMuted,marginTop:2}}>{desc}</p>
          </div>
        ))}
      </div>

      {/* Summary cards - term report only */}
      {reportType==="term_report"&&(
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:16}}>
          {[["A / A*","Distinction",theme.green,summary.A],["B","Merit",theme.turquoise,summary.B],["C","Credit",theme.amber,summary.C],["D–U","Needs Support",theme.danger,summary.fail]].map(([g,l,c,v])=>(
            <div key={g} style={{background:"white",borderRadius:12,padding:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`}}>
              <p style={{fontSize:20,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{loading?"…":v}</p>
              <p style={{fontSize:11,fontWeight:600,color:theme.text}}>{l} <span style={{color:theme.textMuted}}>({g})</span></p>
            </div>
          ))}
        </div>
      )}

      {/* Results table */}
      <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,overflow:"hidden"}}>
        <div style={{padding:14,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}><SearchInput value={search} onChange={setSearch} placeholder="Search learner..."/></div>
          <select className="form-input" style={{width:110}} value={term} onChange={e=>setTerm(e.target.value)}>{TERMS.map(t=><option key={t}>{t}</option>)}</select>
          <select className="form-input" style={{width:96}} value={year} onChange={e=>setYear(e.target.value)}><option>{CURRENT_YEAR}</option><option>{CURRENT_YEAR-1}</option></select>
          <select className="form-input" style={{width:160}} value={formF} onChange={e=>setFormF(e.target.value)}>
            <option value="">All Forms</option>
            {FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}
          </select>
        </div>

        {loading ? <div style={{padding:24}}>{[...Array(6)].map((_,i)=><div key={i} className="skeleton" style={{height:48,marginBottom:8}}/>)}</div>
        : results.length===0 ? <EmptyState message={`No ${reportType==="mark_reader"?"Mark Reader":"Term Report"} entries found`}/>
        : (
          <div style={{overflowX:"auto"}}>
            <table>
              {reportType==="term_report"?(
                <thead><tr style={{background:"#FEF2F2"}}>
                  <th>Learner</th><th>Form</th><th>Subject</th><th>Curriculum</th><th>Mark %</th><th>Grade</th><th>Remarks</th>
                  {canEdit&&<th>Action</th>}
                </tr></thead>
              ):(
                <thead><tr style={{background:"#FEF2F2"}}>
                  <th>Learner</th><th>Form</th><th>Subject</th><th>Mark %</th><th>Class Avg</th><th>Effort</th><th>Grade</th>
                  {canEdit&&<th>Action</th>}
                </tr></thead>
              )}
              <tbody>
                {results.map((r,i)=>(
                  <tr key={i}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:8}}>
                        <div style={{width:28,height:28,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white",flexShrink:0}}>
                          {r.first_name[0]}{r.last_name[0]}
                        </div>
                        <span style={{fontSize:13,fontWeight:500}}>{r.last_name}, {r.first_name}</span>
                      </div>
                    </td>
                    <td><Badge color="tq">{FORM_LABEL[r.student_grade]||r.student_grade}</Badge></td>
                    <td style={{fontSize:13}}>{r.subject_name}</td>
                    {reportType==="term_report"&&(
                      <td><span style={{fontSize:11,padding:"2px 8px",borderRadius:4,background:theme.bg,color:theme.textMuted,fontWeight:600}}>{r.curriculum?.replace("_"," ")}</span></td>
                    )}
                    <td style={{fontWeight:700,fontSize:14}}>{parseFloat(r.mark||r.total||0).toFixed(0)}%</td>
                    {reportType==="mark_reader"&&(
                      <td style={{fontSize:13,color:theme.textMuted}}>{r.class_average?`${parseFloat(r.class_average).toFixed(0)}%`:"—"}</td>
                    )}
                    {reportType==="mark_reader"&&(
                      <td>
                        {r.effort!=null?(
                          <span style={{fontSize:12,fontWeight:600,color:r.effort>=3?theme.green:r.effort>=1?theme.amber:theme.danger}}>
                            {r.effort} — {EFFORT_LABEL[r.effort]||""}
                          </span>
                        ):"—"}
                      </td>
                    )}
                    <td>
                      <span className="badge" style={{background:`${GRADE_COLOR[r.grade]||"#64748B"}20`,color:GRADE_COLOR[r.grade]||"#64748B",fontWeight:700,fontSize:13}}>
                        {r.grade}
                      </span>
                    </td>
                    {canEdit&&(
                      <td>
                        <button className="btn" onClick={()=>handleDelete(r.id)}
                          style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",color:theme.danger,fontWeight:500}}>
                          Del
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Add Result Modal */}
      {modal==="add"&&(
        <Modal title={reportType==="mark_reader"?"Add Mark Reader Entry":"Add Term Report Result"} onClose={()=>setModal(null)}>
          <div style={{padding:12,background:"#FEF2F2",borderRadius:8,marginBottom:16,fontSize:12,color:theme.red,borderLeft:`3px solid ${theme.red}`}}>
            {reportType==="mark_reader"
              ? "Half-term entry: enter the learner's percentage, effort rating, and class average."
              : "End-of-term entry: enter the learner's final examination mark. Grade is auto-calculated."}
          </div>

          <div className="form-row">
            <div className="form-group"><label>Learner ID *</label>
              <input className="form-input" placeholder="e.g. 0001" value={form.studentId||""} onChange={f("studentId")}/>
            </div>
            <div className="form-group"><label>Form (for subject list)</label>
              <select className="form-input" value={form.formForSubject||""} onChange={e=>setForm(p=>({...p,formForSubject:e.target.value,subjectId:""}))}>
                <option value="">Select form first</option>
                {FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}
              </select>
            </div>
          </div>

          <div className="form-group"><label>Subject *</label>
            <select className="form-input" value={form.subjectId||""} onChange={f("subjectId")}>
              <option value="">— Select subject —</option>
              {subjects.map(s=>(
                <option key={s.id} value={s.id}>{s.name} ({s.curriculum.replace("_"," ")})</option>
              ))}
            </select>
          </div>

          <div className="form-row">
            <div className="form-group"><label>Mark % *</label>
              <input type="number" min="0" max="100" step="0.5" className="form-input"
                placeholder="0 – 100" value={form.mark||""} onChange={f("mark")}/>
            </div>
            <div className="form-group"><label>Term</label>
              <select className="form-input" value={form.term||term} onChange={f("term")}>
                {TERMS.map(t=><option key={t}>{t}</option>)}
              </select>
            </div>
          </div>

          {/* Grade preview */}
          {gradePreview&&(
            <div style={{padding:"10px 14px",background:`${GRADE_COLOR[gradePreview.g]||"#64748B"}15`,borderRadius:8,marginBottom:12,display:"flex",alignItems:"center",gap:12}}>
              <span className="badge" style={{background:`${GRADE_COLOR[gradePreview.g]}25`,color:GRADE_COLOR[gradePreview.g],fontWeight:700,fontSize:16,padding:"4px 12px"}}>{gradePreview.g}</span>
              <div>
                <p style={{fontSize:13,fontWeight:600,color:GRADE_COLOR[gradePreview.g]}}>{gradePreview.r}</p>
                <p style={{fontSize:11,color:theme.textMuted}}>Auto-calculated · {selectedSubj?.curriculum?.replace("_"," ")}</p>
              </div>
            </div>
          )}

          {/* Mark Reader extra fields */}
          {reportType==="mark_reader"&&(
            <div className="form-row">
              <div className="form-group"><label>Effort (−1 to 4)</label>
                <select className="form-input" value={form.effort??""} onChange={f("effort")}>
                  <option value="">Select</option>
                  {Object.entries(EFFORT_LABEL).map(([k,v])=>(
                    <option key={k} value={k}>{k} — {v}</option>
                  ))}
                </select>
              </div>
              <div className="form-group"><label>Class Average %</label>
                <input type="number" min="0" max="100" className="form-input"
                  placeholder="e.g. 57" value={form.classAverage||""} onChange={f("classAverage")}/>
              </div>
            </div>
          )}

          <div className="form-group"><label>Teacher Comments</label>
            <input className="form-input" placeholder="Optional" value={form.remarks||""} onChange={f("remarks")}/>
          </div>

          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleSave} loading={saving}>Save Entry</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Attendance ───────────────────────────────────────────────────────────────
function Attendance({user}) {
  const toast=useToast();
  const today=new Date().toISOString().split("T")[0];
  const [date,setDate]=useState(today);const [search,setSearch]=useState("");const [modal,setModal]=useState(null);
  const [bulkForm,setBulkForm]=useState("1");const [bulkDate,setBulkDate]=useState(today);
  const [bulkRecords,setBulkRecords]=useState([]);const [loadingBulk,setLoadingBulk]=useState(false);const [saving,setSaving]=useState(false);
  const {data:sumData,loading:sumLoading,reload:reloadSum}=useFetch(()=>api.attendanceSummary({date}),[date]);
  const {data:recData,loading:recLoading,error,reload:reloadRec}=useFetch(()=>api.attendance({date,limit:100}),[date]);
  const summary=sumData?.summary||{};
  const records=(recData?.attendance||[]).filter(r=>search===""||`${r.first_name} ${r.last_name}`.toLowerCase().includes(search.toLowerCase()));
  const reload=()=>{reloadSum();reloadRec();};
  const canEdit=["admin","teacher"].includes(user.role);
  const belowThreshold=summary.rate&&parseFloat(summary.rate)<80;

  const loadBulk=async()=>{
    setLoadingBulk(true);
    try{const d=await api.students({grade:bulkForm,limit:100,status:"Active"});setBulkRecords((d.students||[]).map(s=>({studentId:s.id,name:`${s.last_name}, ${s.first_name}`,form:FORM_LABEL[s.grade]||s.grade,status:"Present",remarks:""})));}
    catch(e){toast(e.message,"error");}finally{setLoadingBulk(false);}
  };
  const submitBulk=async()=>{
    setSaving(true);
    try{await api.bulkAttendance({date:bulkDate,records:bulkRecords.map(r=>({studentId:r.studentId,status:r.status,remarks:r.remarks}))});toast(`Register marked for ${bulkRecords.length} learners`);setModal(null);reload();}
    catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Attendance Register</h2></div>
        <div style={{display:"flex",gap:10}}>
          <input type="date" className="form-input" value={date} onChange={e=>setDate(e.target.value)} style={{width:160}}/>
          {canEdit&&<Btn icon="check" onClick={()=>{setBulkRecords([]);setModal("bulk");}}>Mark Register</Btn>}
        </div>
      </div>

      {belowThreshold&&<div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:"10px 16px",marginBottom:16,display:"flex",alignItems:"center",gap:10}}><Icon d={icons.alert} size={16} color={theme.amber}/><p style={{fontSize:13,color:"#92400E",fontWeight:600}}>Attendance is below 80% threshold today ({summary.rate}%). Parents should be notified.</p></div>}

      {error&&<ErrorBox message={error} onRetry={reload}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,marginBottom:20}}>
        {[["Present",summary.present,theme.green],["Absent",summary.absent,theme.danger],["Rate",`${summary.rate||0}%`,summary.rate>=80?theme.turquoise:theme.amber],["Total",summary.total,theme.grey]].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:20,borderRadius:12,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,textAlign:"center"}}>
            <p style={{fontSize:28,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{sumLoading?"…":v||0}</p>
            <p style={{fontSize:12,fontWeight:600,color:theme.textMuted,textTransform:"uppercase",letterSpacing:"0.05em"}}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,overflow:"hidden"}}>
        <div style={{padding:16,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:12,alignItems:"center"}}>
          <div style={{flex:1}}><SearchInput value={search} onChange={setSearch} placeholder="Search learner..."/></div>
          <Btn variant="secondary" size="sm" icon="download" onClick={()=>exportCSV(records.map(r=>({Learner:`${r.last_name} ${r.first_name}`,Form:r.grade,Date:date,Status:r.status,Remarks:r.remarks||""})),"attendance.csv")}>Export</Btn>
        </div>
        {recLoading?<div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:48,marginBottom:8}}/>)}</div>
        :records.length===0?<EmptyState message={`No register for ${date}`}/>:(
          <div style={{overflowX:"auto"}}><table>
            <thead><tr style={{background:"#FEF2F2"}}><th>Learner</th><th>Form</th><th>Status</th><th>Remarks</th></tr></thead>
            <tbody>{records.map((a,i)=>(
              <tr key={i}>
                <td style={{fontWeight:500,fontSize:13}}>{a.last_name}, {a.first_name}</td>
                <td><Badge color="tq">{FORM_LABEL[a.grade]||a.grade}</Badge></td>
                <td><Badge color={a.status==="Present"?"green":"red"}>{a.status}</Badge></td>
                <td style={{fontSize:12,color:theme.textMuted}}>{a.remarks||"—"}</td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {modal==="bulk"&&(
        <Modal title="Mark Class Register" onClose={()=>setModal(null)} large>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,marginBottom:16,alignItems:"flex-end"}}>
            <div className="form-group" style={{margin:0}}><label>Form / Class</label><select className="form-input" value={bulkForm} onChange={e=>setBulkForm(e.target.value)}>{FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}</select></div>
            <div className="form-group" style={{margin:0}}><label>Date</label><input type="date" className="form-input" value={bulkDate} onChange={e=>setBulkDate(e.target.value)}/></div>
            <Btn onClick={loadBulk} loading={loadingBulk} icon="search">Load</Btn>
          </div>
          {bulkRecords.length>0&&(
            <>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
                <p style={{fontSize:13,fontWeight:600,color:theme.textMuted}}>{bulkRecords.length} learners — {FORM_LABEL[bulkForm]}</p>
                <div style={{display:"flex",gap:8}}>
                  <button onClick={()=>setBulkRecords(r=>r.map(s=>({...s,status:"Present"})))} style={{fontSize:12,padding:"4px 12px",borderRadius:6,border:`1px solid ${theme.green}`,background:`${theme.green}11`,color:theme.green,cursor:"pointer",fontWeight:600}}>All Present</button>
                  <button onClick={()=>setBulkRecords(r=>r.map(s=>({...s,status:"Absent"})))} style={{fontSize:12,padding:"4px 12px",borderRadius:6,border:`1px solid ${theme.danger}`,background:`${theme.danger}11`,color:theme.danger,cursor:"pointer",fontWeight:600}}>All Absent</button>
                </div>
              </div>
              <div style={{maxHeight:340,overflowY:"auto",border:`1px solid ${theme.border}`,borderRadius:10,marginBottom:16}}>
                <table>
                  <thead><tr style={{background:"#FEF2F2",position:"sticky",top:0}}><th>Learner</th><th>Form</th><th>Status</th><th>Remarks</th></tr></thead>
                  <tbody>{bulkRecords.map((r,i)=>(
                    <tr key={i}>
                      <td style={{fontSize:13,fontWeight:500}}>{r.name}</td>
                      <td style={{fontSize:12}}>{r.form}</td>
                      <td><select className="form-input" style={{width:110,padding:"5px 10px",fontSize:12}} value={r.status} onChange={e=>setBulkRecords(rr=>rr.map((x,j)=>j===i?{...x,status:e.target.value}:x))}><option>Present</option><option>Absent</option></select></td>
                      <td><input className="form-input" style={{padding:"5px 10px",fontSize:12}} placeholder="Optional" value={r.remarks} onChange={e=>setBulkRecords(rr=>rr.map((x,j)=>j===i?{...x,remarks:e.target.value}:x))}/></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
              <div style={{display:"flex",gap:10}}><Btn onClick={submitBulk} loading={saving} icon="check">Submit Register</Btn><Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn></div>
            </>
          )}
          {bulkRecords.length===0&&!loadingBulk&&<EmptyState message="Select a form and click Load to begin"/>}
        </Modal>
      )}
    </div>
  );
}

// ─── Billing & Accounts ───────────────────────────────────────────────────────
function Billing({user}) {
  const toast=useToast();
  const [search,setSearch]=useState("");const [status,setStatus]=useState("");
  const [modal,setModal]=useState(null);const [selected,setSelected]=useState(null);
  const [saving,setSaving]=useState(false);const [form,setForm]=useState({});
  const [invoiceDetail,setInvoiceDetail]=useState(null);const [loadingDetail,setLoadingDetail]=useState(false);
  const {data,loading,error,reload}=useFetch(()=>api.invoices({search,status,limit:25}),[search,status]);
  const {data:sumData,reload:reloadSum}=useFetch(()=>api.billingSummary());
  const invoices=data?.invoices||[];const sum=sumData?.summary||{};
  const canEdit=["admin","accountant"].includes(user.role);
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));

  const FEE_LINES=["Tuition","Levy","Boarding","Bond Paper","Registration","Uniforms","Medical Aid","Fine","Other"];
  const PAYMENT_METHODS=["Cash","Bank Transfer","EcoCash","Cheque","Card"];

  const openInvoice=async inv=>{setSelected(inv);setModal("view");setLoadingDetail(true);try{const d=await api.invoice(inv.id);setInvoiceDetail(d);}catch(e){toast(e.message,"error");}finally{setLoadingDetail(false);}};
  const openPay=inv=>{setSelected(inv);setForm({amount:"",method:"Cash",notes:""});setModal("pay");};
  const submitPayment=async()=>{
    if(!form.amount||parseFloat(form.amount)<=0){toast("Enter a valid amount","warning");return;}
    setSaving(true);
    try{await api.recordPayment({invoiceId:selected.id,amount:parseFloat(form.amount),method:form.method,notes:form.notes});toast(`Payment of $${form.amount} recorded via ${form.method}`);setModal(null);reload();reloadSum();}
    catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };
  const submitInvoice=async()=>{
    setSaving(true);
    try{await api.createInvoice(form);toast("Invoice created successfully");setModal(null);reload();reloadSum();}
    catch(e){toast(e.message,"error");}finally{setSaving(false);}
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div><h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Accounts & Billing</h2><p style={{fontSize:12,color:theme.textMuted}}>Bank: Ecobank · Acc: 576700023470</p></div>
        <div style={{display:"flex",gap:10}}>
          <Btn variant="secondary" size="sm" icon="download" onClick={()=>exportCSV(invoices.map(i=>({Invoice:i.invoice_no,Learner:`${i.last_name} ${i.first_name}`,Form:i.grade,Term:i.term,Due:i.amount_due,Paid:i.amount_paid,Balance:i.balance,Status:i.status})),"billing.csv")}>Export</Btn>
          {canEdit&&<Btn icon="plus" onClick={()=>{setForm({term:"Term 1",year:CURRENT_YEAR,amountDue:""});setModal("new");}}>New Invoice</Btn>}
        </div>
      </div>
      {error&&<ErrorBox message={error} onRetry={reload}/>}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:16,marginBottom:20}}>
        <div style={{background:`linear-gradient(135deg,${theme.turquoise},#06B6D4)`,padding:24,borderRadius:14,color:"white"}}><p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>Total Collected</p><p style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${parseFloat(sum.total_collected||0).toLocaleString()}</p></div>
        <div style={{background:`linear-gradient(135deg,${theme.red},${theme.redLight})`,padding:24,borderRadius:14,color:"white"}}><p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>Outstanding</p><p style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${parseFloat(sum.total_outstanding||0).toLocaleString()}</p></div>
        <div style={{background:`linear-gradient(135deg,#374151,#6B7280)`,padding:24,borderRadius:14,color:"white"}}><p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase",letterSpacing:"0.08em"}}>Overdue Accounts</p><p style={{fontSize:28,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>{sum.overdue_count||0}</p></div>
      </div>
      <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,overflow:"hidden"}}>
        <div style={{padding:16,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:12}}>
          <div style={{flex:1}}><SearchInput value={search} onChange={setSearch} placeholder="Search learner or invoice no..."/></div>
          <select className="form-input" style={{width:130}} value={status} onChange={e=>setStatus(e.target.value)}><option value="">All Status</option><option>Paid</option><option>Unpaid</option><option>Partial</option><option>Overdue</option></select>
        </div>
        {loading?<div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:52,marginBottom:8}}/>)}</div>
        :invoices.length===0?<EmptyState/>:(
          <div style={{overflowX:"auto"}}><table>
            <thead><tr style={{background:"#FEF2F2"}}><th>Invoice</th><th>Learner</th><th>Term</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th><th>Actions</th></tr></thead>
            <tbody>{invoices.map((inv,i)=>(
              <tr key={i}>
                <td style={{fontFamily:"monospace",fontSize:12,color:theme.turquoise,fontWeight:600}}>{inv.invoice_no}</td>
                <td><p style={{fontWeight:600,fontSize:13}}>{inv.last_name||inv.first_name}, {inv.first_name}</p><p style={{fontSize:11,color:theme.textMuted}}>{FORM_LABEL[inv.grade]||inv.grade}</p></td>
                <td style={{fontSize:13}}>{inv.term}</td>
                <td style={{fontFamily:"monospace",fontWeight:600}}>${parseFloat(inv.amount_due).toFixed(2)}</td>
                <td style={{fontFamily:"monospace",color:theme.green,fontWeight:600}}>${parseFloat(inv.amount_paid).toFixed(2)}</td>
                <td style={{fontFamily:"monospace",color:parseFloat(inv.balance)>0?theme.danger:theme.textMuted,fontWeight:600}}>${parseFloat(inv.balance).toFixed(2)}</td>
                <td><Badge color={inv.status==="Paid"?"green":inv.status==="Partial"?"amber":"red"}>{inv.status}</Badge></td>
                <td><div style={{display:"flex",gap:5}}>
                  <button className="btn" onClick={()=>openInvoice(inv)} style={{background:theme.bg,border:`1px solid ${theme.border}`,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500}}>View</button>
                  {canEdit&&inv.status!=="Paid"&&<button className="btn" onClick={()=>openPay(inv)} style={{background:"#FEF3C7",border:`1px solid ${theme.amber}`,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#92400E"}}>Pay</button>}
                </div></td>
              </tr>
            ))}</tbody>
          </table></div>
        )}
      </div>

      {/* Invoice detail */}
      {modal==="view"&&selected&&(
        <Modal title={`Invoice — ${selected.invoice_no}`} onClose={()=>{setModal(null);setInvoiceDetail(null);}} large>
          {loadingDetail?<div style={{textAlign:"center",padding:40}}><span className="spinner spinner-dark"/></div>:invoiceDetail?(
            <div>
              {/* Receipt header matching their format */}
              <div style={{border:`2px solid ${theme.red}`,borderRadius:12,overflow:"hidden",marginBottom:20}}>
                <div style={{background:theme.red,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div><p style={{fontFamily:"'Playfair Display',serif",fontSize:16,fontWeight:700,color:"white"}}>{SCHOOL.name}</p><p style={{fontSize:11,color:"rgba(255,255,255,0.7)",fontStyle:"italic"}}>"{SCHOOL.motto}"</p></div>
                  <div style={{textAlign:"right"}}><p style={{fontSize:13,fontWeight:700,color:"white",fontFamily:"monospace"}}>{invoiceDetail.invoice?.invoice_no}</p><Badge color="green">{invoiceDetail.invoice?.status}</Badge></div>
                </div>
                <div style={{padding:20,background:"#FEF2F2"}}>
                  <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:12,marginBottom:16}}>
                    {[["Learner",`${invoiceDetail.invoice?.last_name||""}, ${invoiceDetail.invoice?.first_name||""}`],["Form",FORM_LABEL[invoiceDetail.invoice?.grade]||invoiceDetail.invoice?.grade],["Term",`${invoiceDetail.invoice?.term} ${invoiceDetail.invoice?.year}`]].map(([l,v])=>(
                      <div key={l}><p style={{fontSize:10,color:theme.textMuted,fontWeight:600,textTransform:"uppercase"}}>{l}</p><p style={{fontWeight:600,fontSize:13}}>{v||"—"}</p></div>
                    ))}
                  </div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10}}>
                    {[["Amount Due",`$${parseFloat(invoiceDetail.invoice?.amount_due||0).toFixed(2)}`,theme.text],["Amount Paid",`$${parseFloat(invoiceDetail.invoice?.amount_paid||0).toFixed(2)}`,theme.green],["Balance",`$${parseFloat(invoiceDetail.invoice?.balance||0).toFixed(2)}`,parseFloat(invoiceDetail.invoice?.balance||0)>0?theme.danger:theme.green]].map(([l,v,c])=>(
                      <div key={l} style={{padding:12,background:"white",borderRadius:8,textAlign:"center",border:`1px solid ${theme.border}`}}>
                        <p style={{fontSize:10,color:theme.textMuted,fontWeight:600,textTransform:"uppercase",marginBottom:4}}>{l}</p>
                        <p style={{fontSize:18,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
              {invoiceDetail.payments?.length>0&&(
                <>
                  <h3 style={{fontSize:14,fontWeight:700,marginBottom:10}}>Payment History</h3>
                  <table><thead><tr style={{background:"#FEF2F2"}}><th>Date</th><th>Amount</th><th>Method</th><th>Notes</th></tr></thead>
                    <tbody>{invoiceDetail.payments.map((p,i)=>(
                      <tr key={i}><td style={{fontSize:13}}>{p.payment_date?.split("T")[0]}</td><td style={{fontFamily:"monospace",color:theme.green,fontWeight:600}}>${parseFloat(p.amount).toFixed(2)}</td><td style={{fontSize:13}}>{p.payment_method}</td><td style={{fontSize:12,color:theme.textMuted}}>{p.notes||"—"}</td></tr>
                    ))}</tbody>
                  </table>
                </>
              )}
              {canEdit&&invoiceDetail.invoice?.status!=="Paid"&&<div style={{marginTop:16}}><Btn onClick={()=>{openPay(selected);}}>Record Payment</Btn></div>}
              <div style={{marginTop:10}}>
                <Btn variant="secondary" size="sm" icon="download"
                  onClick={()=>window.open(api.invoicePdfURL(selected.id),"_blank")}>
                  Download PDF Invoice
                </Btn>
              </div>
            </div>
          ):null}
        </Modal>
      )}

      {/* Pay modal */}
      {modal==="pay"&&selected&&(
        <Modal title={`Record Payment — ${selected.invoice_no}`} onClose={()=>setModal(null)}>
          <div style={{padding:14,background:"#FEF2F2",borderRadius:10,marginBottom:20,fontSize:13,borderLeft:`3px solid ${theme.red}`}}>
            <p style={{fontWeight:600}}>{selected.last_name||selected.first_name}, {selected.first_name}</p>
            <p style={{color:theme.textMuted}}>Outstanding balance: <strong style={{color:theme.danger}}>${parseFloat(selected.balance||0).toFixed(2)}</strong></p>
          </div>
          <div className="form-group"><label>Amount *</label><input type="number" step="0.01" min="0.01" className="form-input" placeholder={`Max $${parseFloat(selected.balance||0).toFixed(2)}`} value={form.amount||""} onChange={f("amount")}/></div>
          <div className="form-group"><label>Payment Method</label><select className="form-input" value={form.method||"Cash"} onChange={f("method")}>{PAYMENT_METHODS.map(m=><option key={m}>{m}</option>)}</select></div>
          <div className="form-group"><label>Reference / Notes</label><input className="form-input" placeholder="Receipt number, bank ref, etc." value={form.notes||""} onChange={f("notes")}/></div>
          <div style={{display:"flex",gap:10}}><Btn onClick={submitPayment} loading={saving} icon="check">Confirm Payment</Btn><Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn></div>
        </Modal>
      )}

      {/* New invoice */}
      {modal==="new"&&(
        <Modal title="Create Invoice" onClose={()=>setModal(null)}>
          <div className="form-group"><label>Learner ID *</label><input className="form-input" placeholder="e.g. 0001" value={form.studentId||""} onChange={f("studentId")}/></div>
          <div className="form-row">
            <div className="form-group"><label>Term *</label><select className="form-input" value={form.term||"Term 1"} onChange={f("term")}>{TERMS.map(t=><option key={t}>{t}</option>)}</select></div>
            <div className="form-group"><label>Year</label><select className="form-input" value={form.year||CURRENT_YEAR} onChange={f("year")}><option value={CURRENT_YEAR}>{CURRENT_YEAR}</option><option value={CURRENT_YEAR-1}>{CURRENT_YEAR-1}</option></select></div>
          </div>
          <div className="form-group"><label>Fee Lines</label>
            {FEE_LINES.map(line=>(
              <div key={line} style={{display:"flex",alignItems:"center",gap:10,marginBottom:8}}>
                <label style={{width:140,fontSize:13,color:theme.text,fontWeight:500,flexShrink:0}}>{line}</label>
                <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form[`fee_${line}`]||""} onChange={f(`fee_${line}`)} style={{flex:1}}/>
              </div>
            ))}
          </div>
          <div className="form-group"><label>Due Date</label><input type="date" className="form-input" value={form.dueDate||""} onChange={f("dueDate")}/></div>
          <div style={{display:"flex",gap:10}}><Btn onClick={submitInvoice} loading={saving}>Create Invoice</Btn><Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn></div>
        </Modal>
      )}
    </div>
  );
}

// ─── Discipline ───────────────────────────────────────────────────────────────
function Discipline({user}) {
  const toast = useToast();
  const [modal,  setModal]  = useState(null);
  const [selected,setSelected]=useState(null);
  const [saving, setSaving] = useState(false);
  const [form,   setForm]   = useState({severity:"Low"});
  const [search, setSearch] = useState("");
  const [statusF,setStatusF]= useState("");
  const [formF,  setFormF]  = useState("");
  const dSearch = useDebounce(search, 400);
  const canEdit = ["admin","teacher","principal"].includes(user.role);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const {data,loading,error,reload} = useFetch(()=>{
    const q = {};
    if (statusF) q.status = statusF;
    if (formF)   q.form   = formF;
    if (dSearch) q.search = dSearch;
    q.limit = 50;
    return api.get(`/discipline?${new URLSearchParams(q)}`);
  }, [dSearch,statusF,formF]);
  const incidents = data?.incidents || [];
  const openCount     = incidents.filter(i=>i.status==="Open").length;
  const resolvedCount = incidents.filter(i=>i.status==="Resolved").length;

  const openAdd = () => {
    setForm({severity:"Low", date:new Date().toISOString().split("T")[0]});
    setModal("add");
  };

  const openView = (inc) => { setSelected(inc); setModal("view"); };

  const handleSave = async () => {
    if (!form.studentId && !form.studentName) { toast("Enter a learner ID or name","warning"); return; }
    if (!form.incident_type) { toast("Incident type is required","warning"); return; }
    setSaving(true);
    try {
      await api.post("/discipline", {
        student_id:   form.studentId   || null,
        incident_type:form.incident_type,
        description:  form.description  || "",
        severity:     form.severity     || "Low",
        action_taken: form.action_taken || "",
        date:         form.date || new Date().toISOString().split("T")[0],
        fine_amount:  form.fine_amount  || 0,
      });
      toast("Incident logged successfully");
      setModal(null); setForm({severity:"Low"}); reload();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleResolve = async (id) => {
    try {
      await api.put(`/discipline/${id}`, {status:"Resolved"});
      toast("Incident marked as resolved","info");
      setModal(null); reload();
    } catch(e) { toast(e.message,"error"); }
  };

  const INCIDENT_TYPES = [
    "Absence without excuse","Bullying","Cheating / Plagiarism","Defiance",
    "Destruction of property","Disruption in class","Fighting","Insubordination",
    "Mobile phone violation","Tardiness","Theft","Uniform infringement","Other",
  ];

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Discipline Management</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>Incident register · {SCHOOL.name}</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" size="sm" icon="download"
            onClick={()=>exportCSV(incidents.map(i=>({ID:i.incident_id,Learner:`${i.last_name||""} ${i.first_name||""}`,Form:i.form,Incident:i.incident_type,Date:i.date,Severity:i.severity,Action:i.action_taken,Status:i.status})),"discipline.csv")}>
            Export
          </Btn>
          {canEdit&&<Btn icon="plus" onClick={openAdd}>Log Incident</Btn>}
        </div>
      </div>

      {error&&<ErrorBox message={error} onRetry={reload}/>}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[
          ["Open Cases",    openCount,          theme.danger],
          ["Resolved",      resolvedCount,       theme.green],
          ["Total This Term",incidents.length,   theme.amber],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:20,borderRadius:12,textAlign:"center",boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`}}>
            <p style={{fontSize:28,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{loading?"…":v}</p>
            <p style={{fontSize:12,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",overflow:"hidden"}}>
        <div style={{padding:14,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:180}}><SearchInput value={search} onChange={setSearch} placeholder="Search learner name..."/></div>
          <select className="form-input" style={{width:130}} value={statusF} onChange={e=>setStatusF(e.target.value)}>
            <option value="">All Status</option><option>Open</option><option>Resolved</option>
          </select>
          <select className="form-input" style={{width:150}} value={formF} onChange={e=>setFormF(e.target.value)}>
            <option value="">All Forms</option>
            {FORMS.map(f=><option key={f} value={f}>{FORM_LABEL[f]}</option>)}
          </select>
        </div>

        {loading ? <div style={{padding:24}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:52,marginBottom:8}}/>)}</div>
        : incidents.length===0 ? <EmptyState message="No incidents found"/>
        : (
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr style={{background:"#FEF2F2"}}>
                <th>ID</th><th>Learner</th><th>Incident</th><th>Date</th><th>Severity</th><th>Status</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {incidents.map(d=>(
                  <tr key={d.id}>
                    <td style={{fontFamily:"monospace",fontSize:12,color:theme.turquoise,fontWeight:600}}>{d.incident_id}</td>
                    <td>
                      <p style={{fontWeight:500,fontSize:13}}>{d.last_name?`${d.last_name}, ${d.first_name}`:d.first_name||"—"}</p>
                      <p style={{fontSize:11,color:theme.textMuted}}>{FORM_LABEL[d.form]||d.form||"—"} · {d.class||""}</p>
                    </td>
                    <td style={{fontSize:13,maxWidth:200}}>
                      <p style={{fontWeight:500}}>{d.incident_type}</p>
                      {d.description&&<p style={{fontSize:11,color:theme.textMuted}}>{d.description.slice(0,60)}{d.description.length>60?"…":""}</p>}
                    </td>
                    <td style={{fontSize:12,color:theme.textMuted}}>{d.date?.split("T")[0]||"—"}</td>
                    <td><Badge color={d.severity==="High"?"red":d.severity==="Medium"?"amber":"tq"}>{d.severity||"Low"}</Badge></td>
                    <td><Badge color={d.status==="Open"?"red":"green"}>{d.status}</Badge></td>
                    <td>
                      <div style={{display:"flex",gap:5}}>
                        <button className="btn" onClick={()=>openView(d)}
                          style={{background:theme.bg,border:`1px solid ${theme.border}`,borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:500}}>
                          View
                        </button>
                        {canEdit&&d.status==="Open"&&(
                          <button className="btn" onClick={()=>handleResolve(d.id)}
                            style={{background:"#D1FAE5",border:"1px solid #6EE7B7",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#065F46"}}>
                            Resolve
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* View incident */}
      {modal==="view"&&selected&&(
        <Modal title={`Incident — ${selected.incident_id}`} onClose={()=>setModal(null)}>
          <div style={{padding:"14px 20px",background:"#FEF2F2",borderRadius:10,marginBottom:16,borderLeft:`4px solid ${theme.red}`}}>
            <p style={{fontWeight:700,fontSize:15}}>{selected.last_name}, {selected.first_name}</p>
            <p style={{fontSize:12,color:theme.textMuted}}>{FORM_LABEL[selected.form]||selected.form} · {selected.class}</p>
          </div>
          {[
            ["Incident Type",selected.incident_type],
            ["Description",  selected.description||"—"],
            ["Severity",     selected.severity],
            ["Date",         selected.date?.split("T")[0]||"—"],
            ["Action Taken", selected.action_taken||"Pending"],
            ["Fine Amount",  selected.fine_amount>0?`$${selected.fine_amount}`:"None"],
            ["Reported By",  selected.reported_by_name||"—"],
            ["Status",       selected.status],
          ].map(([l,v])=>(
            <div key={l} style={{display:"flex",justifyContent:"space-between",padding:"8px 0",borderBottom:`1px solid ${theme.border}`,fontSize:13}}>
              <span style={{color:theme.textMuted,fontWeight:600}}>{l}</span>
              <span style={{fontWeight:500,maxWidth:260,textAlign:"right"}}>{v}</span>
            </div>
          ))}
          {canEdit&&selected.status==="Open"&&(
            <div style={{marginTop:14}}>
              <Btn onClick={()=>handleResolve(selected.id)} icon="check">Mark as Resolved</Btn>
            </div>
          )}
        </Modal>
      )}

      {/* Log incident */}
      {modal==="add"&&(
        <Modal title="Log Discipline Incident" onClose={()=>setModal(null)}>
          <div className="form-row">
            <div className="form-group">
              <label>Learner ID <span style={{fontSize:10,color:theme.textMuted}}>(from student record)</span></label>
              <input className="form-input" placeholder="e.g. 0001" value={form.studentId||""} onChange={f("studentId")}/>
            </div>
            <div className="form-group">
              <label>Form</label>
              <select className="form-input" value={form.form||""} onChange={f("form")}>
                <option value="">Select</option>
                {FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Incident Type *</label>
            <select className="form-input" value={form.incident_type||""} onChange={f("incident_type")}>
              <option value="">— Select —</option>
              {INCIDENT_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea className="form-input" rows={3} placeholder="Provide details of the incident..." value={form.description||""} onChange={f("description")}/>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Severity</label>
              <select className="form-input" value={form.severity||"Low"} onChange={f("severity")}>
                <option>Low</option><option>Medium</option><option>High</option>
              </select>
            </div>
            <div className="form-group">
              <label>Date</label>
              <input type="date" className="form-input" value={form.date||new Date().toISOString().split("T")[0]} onChange={f("date")}/>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Action Taken</label>
              <input className="form-input" placeholder="e.g. Detention, Parent contacted" value={form.action_taken||""} onChange={f("action_taken")}/>
            </div>
            <div className="form-group">
              <label>Fine Amount (USD)</label>
              <input type="number" step="1" min="0" className="form-input" placeholder="0" value={form.fine_amount||""} onChange={f("fine_amount")}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleSave} loading={saving} icon="check">Log Incident</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Registration ─────────────────────────────────────────────────────────────
function Registration({user}) {
  const [step,setStep]=useState(1);const [done,setDone]=useState(false);const [form,setForm]=useState({campus:"swla"});
  const f=k=>e=>setForm(p=>({...p,[k]:e.target.value}));
  const steps=["Personal Details","Academic Info","Family Details","Declaration"];
  if(done) return(
    <div style={{maxWidth:540,margin:"40px auto",textAlign:"center",background:"white",borderRadius:16,padding:48,boxShadow:"0 4px 24px rgba(196,30,58,0.1)",border:`1px solid ${theme.border}`}}>
      <div style={{width:72,height:72,borderRadius:"50%",background:"#D1FAE5",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}><Icon d={icons.check} size={32} color={theme.green}/></div>
      <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:24,marginBottom:8}}>Registration Submitted!</h2>
      <p style={{color:theme.textMuted,marginBottom:24}}>The application has been received and is pending review by the Administrator. A decision will be communicated to the parent/guardian.</p>
      <p style={{fontSize:12,color:theme.textMuted,marginBottom:24,fontStyle:"italic"}}>"{SCHOOL.motto}"</p>
      <Btn onClick={()=>{setDone(false);setStep(1);setForm({campus:"swla"});}}>Register Another Learner</Btn>
    </div>
  );
  return (
    <div style={{maxWidth:660,margin:"0 auto"}}>
      <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:4}}>Learner Enrolment Form</h2>
      <p style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>{SCHOOL.group} · The completion of this form is not a guarantee of acceptance.</p>
      <div style={{display:"flex",gap:6,marginBottom:24}}>{steps.map((s,i)=><div key={i} style={{flex:1,textAlign:"center"}}><div style={{height:4,borderRadius:2,background:step>i+1?theme.red:step===i+1?theme.red:theme.border,opacity:step===i+1?1:step>i+1?1:0.3,marginBottom:6,transition:"all 0.3s"}}/><p style={{fontSize:11,fontWeight:step===i+1?700:500,color:step===i+1?theme.red:theme.textMuted}}>{s}</p></div>)}</div>
      <div style={{background:"white",borderRadius:14,padding:32,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
        {step===1&&<>
          <div className="form-group"><label>Campus *</label><select className="form-input" value={form.campus||"swla"} onChange={f("campus")}>{SCHOOL.campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
          <div className="form-row"><div className="form-group"><label>Surname *</label><input className="form-input" value={form.surname||""} onChange={f("surname")}/></div><div className="form-group"><label>First Name(s) *</label><input className="form-input" value={form.firstname||""} onChange={f("firstname")}/></div></div>
          <div className="form-row"><div className="form-group"><label>Date of Birth *</label><input type="date" className="form-input" value={form.dob||""} onChange={f("dob")}/></div><div className="form-group"><label>Gender *</label><select className="form-input" value={form.gender||""} onChange={f("gender")}><option value="">Select</option><option>Male</option><option>Female</option></select></div></div>
          <div className="form-group"><label>Home Address</label><textarea className="form-input" rows={2} value={form.address||""} onChange={f("address")}/></div>
          <div className="form-group"><label>Transport to School</label><select className="form-input" value={form.transport||""} onChange={f("transport")}><option value="">Select</option><option>Car</option><option>Walk</option><option>Public Transport</option><option>School Bus</option><option>Bicycle</option></select></div>
        </>}
        {step===2&&<>
          <div className="form-row"><div className="form-group"><label>Form Applying For *</label><select className="form-input" value={form.form||""} onChange={f("form")}><option value="">Select</option>{FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}</select></div><div className="form-group"><label>Academic Year</label><select className="form-input" value={form.year||CURRENT_YEAR} onChange={f("year")}><option value={CURRENT_YEAR}>{CURRENT_YEAR}</option><option value={CURRENT_YEAR+1}>{CURRENT_YEAR+1}</option></select></div></div>
          <div className="form-group"><label>Previous School Attended</label><input className="form-input" value={form.prevSchool||""} onChange={f("prevSchool")}/></div>
          <div className="form-group"><label>Any other information we should know?</label><textarea className="form-input" rows={3} value={form.notes||""} onChange={f("notes")}/></div>
        </>}
        {step===3&&<>
          <p style={{fontSize:13,fontWeight:600,color:theme.red,marginBottom:12,textTransform:"uppercase",letterSpacing:"0.05em"}}>Father / Primary Guardian</p>
          <div className="form-row"><div className="form-group"><label>Surname *</label><input className="form-input" value={form.fatherSurname||""} onChange={f("fatherSurname")}/></div><div className="form-group"><label>First Names</label><input className="form-input" value={form.fatherFirst||""} onChange={f("fatherFirst")}/></div></div>
          <div className="form-row"><div className="form-group"><label>Cell *</label><input className="form-input" value={form.fatherCell||""} onChange={f("fatherCell")}/></div><div className="form-group"><label>Email</label><input type="email" className="form-input" value={form.fatherEmail||""} onChange={f("fatherEmail")}/></div></div>
          <div className="form-group"><label>Occupation</label><input className="form-input" value={form.fatherOccupation||""} onChange={f("fatherOccupation")}/></div>
          <p style={{fontSize:13,fontWeight:600,color:theme.turquoise,marginBottom:12,marginTop:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Mother / Secondary Guardian</p>
          <div className="form-row"><div className="form-group"><label>Surname</label><input className="form-input" value={form.motherSurname||""} onChange={f("motherSurname")}/></div><div className="form-group"><label>Cell</label><input className="form-input" value={form.motherCell||""} onChange={f("motherCell")}/></div></div>
        </>}
        {step===4&&<>
          <div style={{background:"#FEF2F2",border:`1px solid ${theme.red}`,borderRadius:10,padding:16,marginBottom:20,fontSize:12,color:theme.text,lineHeight:1.7}}>
            <p style={{fontWeight:700,marginBottom:8,color:theme.red}}>Declaration</p>
            <p>I understand that completion of this form is not a guarantee of acceptance. By submitting this form I agree to abide by the School Rules and Regulations of <strong>{SCHOOL.name}</strong>, including the fee payment terms and code of discipline. I acknowledge that school fees are payable in advance on or before the first day of each term.</p>
          </div>
          <div className="form-row"><div className="form-group"><label>Parent/Guardian Signature (type full name)</label><input className="form-input" value={form.signature||""} onChange={f("signature")}/></div><div className="form-group"><label>Date</label><input type="date" className="form-input" value={form.signDate||new Date().toISOString().split("T")[0]} onChange={f("signDate")}/></div></div>
        </>}
        <div style={{display:"flex",justifyContent:"space-between",marginTop:20}}>
          {step>1?<Btn variant="secondary" onClick={()=>setStep(s=>s-1)}>← Back</Btn>:<div/>}
          {step<4?<Btn onClick={()=>setStep(s=>s+1)}>Continue →</Btn>:<Btn variant="success" icon="check" onClick={()=>setDone(true)}>Submit Application</Btn>}
        </div>
      </div>
    </div>
  );
}

// ─── Reports ──────────────────────────────────────────────────────────────────
function Reports({user}) {
  const toast=useToast();
  const [reportType,setReportType]=useState(null);const [genForm,setGenForm]=useState("");const [term,setTerm]=useState("Term 1");
  const [loading,setLoading]=useState(false);const [preview,setPreview]=useState(null);const [error,setError]=useState("");

  // Role-specific report types
  const allReportTypes=[
    {id:"performance",title:"Performance Report",   desc:"Academic marks by form",            icon:"results",     color:theme.turquoise, roles:["admin","principal","teacher","accountant"]},
    {id:"attendance", title:"Attendance Report",    desc:"Attendance rates per learner",       icon:"attendance",  color:theme.green,     roles:["admin","principal","teacher"]},
    {id:"billing",    title:"Fee Defaulters",       desc:"Outstanding & overdue accounts",     icon:"billing",     color:theme.red,       roles:["admin","accountant"]},
    {id:"enrollment", title:"Enrolment Report",     desc:"Learner count by form",              icon:"students",    color:theme.grey,      roles:["admin","principal"]},
    {id:"remedial",   title:"Remedial List",        desc:"Learners needing extra support",     icon:"book",        color:theme.amber,     roles:["admin","principal","teacher"]},
    {id:"ed46",       title:"ED46 Government Form",  desc:"Official MoE learner register",      icon:"results",     color:"#7C3AED",       roles:["admin","principal"]},
  ];
  const reportTypes=allReportTypes.filter(r=>r.roles.includes(user.role));

  const generate=async()=>{
    setLoading(true);setError("");setPreview(null);
    try{
      if(reportType==="attendance"){const d=await api.attendanceReport({grade:genForm});setPreview({type:"attendance",rows:d.report});}
      else if(reportType==="performance"){const d=await api.results({term,year:CURRENT_YEAR.toString(),grade:genForm,limit:100});setPreview({type:"performance",rows:d.results});}
      else if(reportType==="billing"){const d=await api.invoices({grade:genForm,limit:100,status:"Unpaid,Overdue"});setPreview({type:"billing",rows:d.invoices});}
      else if(reportType==="enrollment"){const d=await api.students({grade:genForm,limit:100});setPreview({type:"enrollment",rows:d.students,total:d.pagination.total});}
      else if(reportType==="remedial"){const d=await api.results({term,year:CURRENT_YEAR.toString(),grade:genForm,limit:100});setPreview({type:"remedial",rows:d.results?.filter(r=>["D","E","U","F","G"].includes(r.grade))});}
      else if(reportType==="ed46"){const d=await api.students({grade:genForm,limit:500,status:"Active"});setPreview({type:"ed46",rows:d.students,form:genForm});}
    }catch(e){setError(e.message);}
    finally{setLoading(false);}
  };

  const handleExport=()=>{
    if(!preview?.rows?.length){toast("No data to export","warning");return;}
    const maps={
      attendance:  r=>({Learner:`${r.last_name||r.first_name} ${r.first_name}`,Form:FORM_LABEL[r.grade]||r.grade,PresentDays:r.present_days,AbsentDays:r.absent_days,Rate:`${r.attendance_rate}%`}),
      performance: r=>({Learner:`${r.last_name||r.first_name} ${r.first_name}`,Form:r.student_grade,Subject:r.subject_name,Mark:r.total,Grade:r.grade}),
      billing:     r=>({Invoice:r.invoice_no,Learner:`${r.last_name||r.first_name} ${r.first_name}`,Form:r.grade,Term:r.term,Due:r.amount_due,Paid:r.amount_paid,Balance:r.balance,Status:r.status}),
      enrollment:  r=>({ID:r.student_id,Surname:r.last_name,Firstname:r.first_name,Form:FORM_LABEL[r.grade]||r.grade,Status:r.status}),
      ed46:        r=>({RegNo:r.student_id,"Surname":r.last_name,"First Names":r.first_name,"DOB":r.date_of_birth?.split("T")[0]||"","Gender":r.gender||"","Form":FORM_LABEL[r.grade]||r.grade,"Parent/Guardian":r.parent_name||"","Contact":r.parent_phone||"","Status":r.status}),
      remedial:    r=>({Learner:`${r.last_name||r.first_name} ${r.first_name}`,Form:r.student_grade,Subject:r.subject_name,Mark:r.total,Grade:r.grade}),
    };
    exportCSV(preview.rows.map(maps[reportType]),`${reportType}-report-${CURRENT_YEAR}.csv`);
    toast("CSV report downloaded");
  };

  return (
    <div>
      <div style={{marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Reports Centre</h2>
        <p style={{fontSize:13,color:theme.textMuted}}>{SCHOOL.name} · Live reports from the database</p>
      </div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))",gap:14,marginBottom:24}}>
        {reportTypes.map(r=>(
          <div key={r.id} className="card" onClick={()=>{setReportType(r.id);setPreview(null);}}
            style={{background:"white",borderRadius:12,padding:20,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`2px solid ${reportType===r.id?r.color:theme.border}`,cursor:"pointer",borderTop:`3px solid ${r.color}`}}>
            <div style={{width:40,height:40,borderRadius:10,background:`${r.color}18`,display:"flex",alignItems:"center",justifyContent:"center",marginBottom:12}}><Icon d={icons[r.icon]} size={18} color={r.color}/></div>
            <h3 style={{fontSize:13,fontWeight:700,marginBottom:4}}>{r.title}</h3>
            <p style={{fontSize:12,color:theme.textMuted}}>{r.desc}</p>
          </div>
        ))}
      </div>
      {reportType&&(
        <div style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`}}>
          <h3 style={{fontSize:16,fontWeight:700,marginBottom:16,fontFamily:"'Playfair Display',serif"}}>{reportTypes.find(r=>r.id===reportType)?.title}</h3>
          {error&&<ErrorBox message={error}/>}
          <div style={{display:"flex",gap:12,marginBottom:20,flexWrap:"wrap",alignItems:"flex-end"}}>
            <select className="form-input" style={{width:160}} value={genForm} onChange={e=>setGenForm(e.target.value)}><option value="">All Forms</option>{FORMS.map(fm=><option key={fm} value={fm}>{FORM_LABEL[fm]}</option>)}</select>
            {["performance","remedial"].includes(reportType)&&<select className="form-input" style={{width:120}} value={term} onChange={e=>setTerm(e.target.value)}>{TERMS.map(t=><option key={t}>{t}</option>)}</select>}
            <Btn onClick={generate} loading={loading} icon="chart">{loading?"Generating…":"Generate"}</Btn>
            {preview&&<Btn variant="secondary" icon="download" onClick={handleExport}>Export CSV</Btn>}
          </div>
          {preview&&(
            <div style={{border:`1px solid ${theme.border}`,borderRadius:10,overflow:"hidden"}}>
              <div style={{background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center",color:"white"}}>
                <div>
                  <p style={{fontFamily:"'Playfair Display',serif",fontSize:15,fontWeight:700}}>{SCHOOL.name}</p>
                  <p style={{fontSize:11,opacity:0.6}}>{reportTypes.find(r=>r.id===reportType)?.title} · {new Date().toLocaleDateString()} {genForm?`· ${FORM_LABEL[genForm]}`:""}</p>
                </div>
                <Badge color="tq">{preview.rows?.length||preview.total||0} records</Badge>
              </div>
              <div style={{overflowX:"auto"}}>
                {["performance","remedial"].includes(preview.type)&&<table><thead><tr style={{background:"#FEF2F2"}}><th>Learner</th><th>Form</th><th>Subject</th><th>Mark</th><th>Grade</th></tr></thead><tbody>{preview.rows?.map((r,i)=><tr key={i}><td style={{fontWeight:500,fontSize:13}}>{r.last_name||r.first_name}, {r.first_name}</td><td><Badge color="tq">{FORM_LABEL[r.student_grade]||r.student_grade}</Badge></td><td style={{fontSize:13}}>{r.subject_name}</td><td style={{fontWeight:700}}>{parseFloat(r.total||0).toFixed(0)}%</td><td style={{fontWeight:700,color:["A","A*"].includes(r.grade)?theme.green:["D","E","U"].includes(r.grade)?theme.danger:theme.amber}}>{r.grade}</td></tr>)}</tbody></table>}
                {preview.type==="attendance"&&<table><thead><tr style={{background:"#FEF2F2"}}><th>Learner</th><th>Form</th><th>Present</th><th>Absent</th><th>Rate</th></tr></thead><tbody>{preview.rows?.map((r,i)=><tr key={i}><td style={{fontWeight:500,fontSize:13}}>{r.last_name||r.first_name}, {r.first_name}</td><td><Badge color="tq">{FORM_LABEL[r.grade]||r.grade}</Badge></td><td style={{color:theme.green,fontWeight:600}}>{r.present_days}</td><td style={{color:theme.danger,fontWeight:600}}>{r.absent_days}</td><td><Badge color={parseFloat(r.attendance_rate)>=80?"green":"red"}>{r.attendance_rate}%</Badge></td></tr>)}</tbody></table>}
                {preview.type==="billing"&&<table><thead><tr style={{background:"#FEF2F2"}}><th>Learner</th><th>Invoice</th><th>Due</th><th>Paid</th><th>Balance</th><th>Status</th></tr></thead><tbody>{preview.rows?.map((r,i)=><tr key={i}><td style={{fontWeight:500,fontSize:13}}>{r.last_name||r.first_name}, {r.first_name}</td><td style={{fontFamily:"monospace",fontSize:12}}>{r.invoice_no}</td><td style={{fontFamily:"monospace"}}>${parseFloat(r.amount_due).toFixed(2)}</td><td style={{fontFamily:"monospace",color:theme.green}}>${parseFloat(r.amount_paid).toFixed(2)}</td><td style={{fontFamily:"monospace",color:parseFloat(r.balance)>0?theme.danger:theme.textMuted,fontWeight:600}}>${parseFloat(r.balance).toFixed(2)}</td><td><Badge color={r.status==="Paid"?"green":r.status==="Partial"?"amber":"red"}>{r.status}</Badge></td></tr>)}</tbody></table>}
                {preview.type==="enrollment"&&<table><thead><tr style={{background:"#FEF2F2"}}><th>ID</th><th>Learner</th><th>Form</th><th>Status</th></tr></thead><tbody>{preview.rows?.map((r,i)=><tr key={i}><td style={{fontFamily:"monospace",fontSize:12,color:theme.turquoise}}>{r.student_id}</td><td style={{fontWeight:500,fontSize:13}}>{r.last_name}, {r.first_name}</td><td><Badge color="tq">{FORM_LABEL[r.grade]||r.grade}</Badge></td><td><Badge color={r.status==="Active"?"green":"gray"}>{r.status}</Badge></td></tr>)}</tbody></table>}
                {preview.type==="ed46"&&(
                  <div>
                    <div style={{padding:"10px 16px",background:"#7C3AED08",borderBottom:`1px solid ${theme.border}`,display:"flex",gap:16,flexWrap:"wrap",fontSize:12,color:"#7C3AED",fontWeight:600}}>
                      <span>REPUBLIC OF ZIMBABWE — MINISTRY OF EDUCATION</span>
                      <span>ED46 — FORM REGISTER</span>
                      <span>{SCHOOL.name} — {SCHOOL.campuses[0].name}</span>
                      <span>Academic Year: {CURRENT_YEAR}</span>
                      {preview.form&&<span>Form: {FORM_LABEL[preview.form]||preview.form}</span>}
                    </div>
                    <div style={{overflowX:"auto"}}>
                      <table>
                        <thead><tr style={{background:"#7C3AED18"}}>
                          <th style={{fontSize:11}}>No.</th>
                          <th style={{fontSize:11}}>Reg No.</th>
                          <th style={{fontSize:11}}>SURNAME</th>
                          <th style={{fontSize:11}}>FIRST NAMES</th>
                          <th style={{fontSize:11}}>DATE OF BIRTH</th>
                          <th style={{fontSize:11}}>GENDER</th>
                          <th style={{fontSize:11}}>FORM</th>
                          <th style={{fontSize:11}}>PARENT/GUARDIAN</th>
                          <th style={{fontSize:11}}>CONTACT</th>
                          <th style={{fontSize:11}}>STATUS</th>
                        </tr></thead>
                        <tbody>
                          {preview.rows?.map((r,i)=>(
                            <tr key={r.id} style={{background:i%2===0?"white":"#FAFAFA"}}>
                              <td style={{fontSize:11,color:theme.textMuted,width:32}}>{i+1}</td>
                              <td style={{fontFamily:"monospace",fontSize:11,color:"#7C3AED",fontWeight:600}}>{r.student_id}</td>
                              <td style={{fontWeight:600,fontSize:12,textTransform:"uppercase"}}>{r.last_name}</td>
                              <td style={{fontSize:12}}>{r.first_name}</td>
                              <td style={{fontSize:11,color:theme.textMuted}}>{r.date_of_birth?.split("T")[0]||"—"}</td>
                              <td style={{fontSize:11}}>{r.gender||"—"}</td>
                              <td><Badge color="tq">{FORM_LABEL[r.grade]||r.grade}</Badge></td>
                              <td style={{fontSize:11}}>{r.parent_name||"—"}</td>
                              <td style={{fontSize:11,fontFamily:"monospace"}}>{r.parent_phone||"—"}</td>
                              <td><Badge color={r.status==="Active"?"green":"gray"}>{r.status}</Badge></td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div style={{padding:"10px 16px",borderTop:`1px solid ${theme.border}`,display:"flex",justifyContent:"space-between",fontSize:11,color:theme.textMuted}}>
                      <span>Total Learners: <strong>{preview.rows?.length}</strong></span>
                      <span>Male: <strong>{preview.rows?.filter(r=>r.gender==="Male").length||0}</strong></span>
                      <span>Female: <strong>{preview.rows?.filter(r=>r.gender==="Female").length||0}</strong></span>
                      <span>Active: <strong>{preview.rows?.filter(r=>r.status==="Active").length||0}</strong></span>
                      <span>Generated: {new Date().toLocaleDateString("en-GB")}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Asset Register ───────────────────────────────────────────────────────────
function Assets({user}) {
  const toast = useToast();
  const [modal,  setModal]  = useState(null);
  const [form,   setForm]   = useState({});
  const [search, setSearch] = useState("");
  const dSearch = useDebounce(search, 400);
  const {data, loading, error, reload} = useFetch(
    () => api.assets(dSearch ? {search:dSearch} : {}), [dSearch]
  );
  const assets = data?.assets || [];
  const canEdit = ["admin","accountant"].includes(user.role);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handleAdd = async () => {
    if (!form.name) { toast("Asset name is required","warning"); return; }
    try {
      await api.createAsset(form);
      toast("Asset added to register");
      setModal(null); setForm({}); reload();
    } catch(e) { toast(e.message,"error"); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Remove this asset from the register?")) return;
    try { await api.deleteAsset(id); toast("Asset removed","info"); reload(); }
    catch(e) { toast(e.message,"error"); }
  };

  const stats = {
    total:  assets.length,
    ict:    assets.filter(a=>a.category==="ICT Equipment").length,
    good:   assets.filter(a=>a.condition==="Good").length,
    fair:   assets.filter(a=>["Fair","Poor"].includes(a.condition)).length,
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Asset Register</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>School property & equipment inventory</p>
        </div>
        {canEdit&&(
          <div style={{display:"flex",gap:10}}>
            <Btn variant="secondary" size="sm" icon="download"
              onClick={()=>exportCSV(assets.map(a=>({ID:a.asset_id,Name:a.name,Category:a.category,Condition:a.condition,Location:a.location,Value:a.value,DateAdded:a.date_added})),"asset-register.csv")}>
              Export
            </Btn>
            <Btn icon="plus" onClick={()=>{setForm({condition:"Good"});setModal("add");}}>Add Asset</Btn>
          </div>
        )}
      </div>

      {error && <ErrorBox message={error} onRetry={reload}/>}

      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[["Total Assets",stats.total,theme.turquoise],["ICT Equipment",stats.ict,theme.red],["Good Condition",stats.good,theme.green],["Fair / Poor",stats.fair,theme.amber]].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:18,borderRadius:12,textAlign:"center",boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`}}>
            <p style={{fontSize:24,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{loading?"…":v}</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:14,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,overflow:"hidden"}}>
        <div style={{padding:14,borderBottom:`1px solid ${theme.border}`}}>
          <SearchInput value={search} onChange={setSearch} placeholder="Search assets..."/>
        </div>
        {loading ? <div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:48,marginBottom:8}}/>)}</div>
        : assets.length===0 ? <EmptyState message="No assets in register"/>
        : (
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr style={{background:"#FEF2F2"}}>
                <th>Asset ID</th><th>Name</th><th>Category</th><th>Condition</th><th>Location</th><th>Value</th><th>Date Added</th>
                {canEdit&&<th>Action</th>}
              </tr></thead>
              <tbody>
                {assets.map(a=>(
                  <tr key={a.id}>
                    <td style={{fontFamily:"monospace",fontSize:12,color:theme.turquoise,fontWeight:600}}>{a.asset_id}</td>
                    <td style={{fontWeight:500,fontSize:13}}>{a.name}</td>
                    <td style={{fontSize:13}}>{a.category||"—"}</td>
                    <td><Badge color={a.condition==="Good"?"green":a.condition==="Fair"?"amber":"red"}>{a.condition}</Badge></td>
                    <td style={{fontSize:13,color:theme.textMuted}}>{a.location||"—"}</td>
                    <td style={{fontFamily:"monospace",fontWeight:600,fontSize:13}}>{a.value?`$${parseFloat(a.value).toFixed(2)}`:"—"}</td>
                    <td style={{fontSize:12,color:theme.textMuted}}>{a.date_added?.split("T")[0]||"—"}</td>
                    {canEdit&&(
                      <td>
                        <button className="btn" onClick={()=>handleDelete(a.id)}
                          style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",color:theme.danger,fontWeight:500}}>
                          Del
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {modal==="add"&&(
        <Modal title="Add Asset to Register" onClose={()=>setModal(null)}>
          <div className="form-group"><label>Asset Name *</label>
            <input className="form-input" placeholder="e.g. Dell Laptop — Admin Office" value={form.name||""} onChange={f("name")}/>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Category</label>
              <select className="form-input" value={form.category||""} onChange={f("category")}>
                <option value="">Select</option>
                {["ICT Equipment","AV Equipment","Furniture","Books","Sports Equipment","Laboratory Equipment","Medical","Transport","Other"].map(c=><option key={c}>{c}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Condition</label>
              <select className="form-input" value={form.condition||"Good"} onChange={f("condition")}>
                <option>Good</option><option>Fair</option><option>Poor</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Location</label>
              <input className="form-input" placeholder="e.g. Computer Lab" value={form.location||""} onChange={f("location")}/>
            </div>
            <div className="form-group"><label>Value (USD)</label>
              <input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.value||""} onChange={f("value")}/>
            </div>
          </div>
          <div className="form-group"><label>Notes</label>
            <textarea className="form-input" rows={2} value={form.notes||""} onChange={f("notes")}/>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleAdd}>Add to Register</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Notice Board ─────────────────────────────────────────────────────────────
function Notices({user}) {
  const toast = useToast();
  const [modal,  setModal]  = useState(false);
  const [form,   setForm]   = useState({});
  const [saving, setSaving] = useState(false);
  const {data, loading, error, reload} = useFetch(() => api.notices());
  const notices = data?.notices || [];
  const canPost = ["admin","principal"].includes(user.role);
  const f = k => e => setForm(p=>({...p,[k]:e.target.value}));

  const handlePost = async () => {
    if (!form.title || !form.content) { toast("Title and content are required","warning"); return; }
    setSaving(true);
    try {
      await api.createNotice(form);
      toast("Notice posted successfully");
      setModal(false); setForm({}); reload();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleDelete = async id => {
    if (!window.confirm("Remove this notice?")) return;
    try { await api.deleteNotice(id); toast("Notice removed","info"); reload(); }
    catch(e) { toast(e.message,"error"); }
  };

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Notice Board</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>{SCHOOL.name} · School announcements</p>
        </div>
        {canPost && <Btn icon="plus" onClick={()=>{setForm({target_roles:"all"});setModal(true);}}>Post Notice</Btn>}
      </div>

      {error && <ErrorBox message={error} onRetry={reload}/>}

      {loading ? (
        <div>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:120,marginBottom:12,borderRadius:12}}/>)}</div>
      ) : notices.length===0 ? (
        <div style={{textAlign:"center",padding:"60px 24px",background:"white",borderRadius:14,border:`1px solid ${theme.border}`}}>
          <Icon d={icons.bell} size={36} color={theme.border} style={{marginBottom:12}}/>
          <p style={{fontSize:14,fontWeight:500,color:theme.textMuted}}>No notices posted yet</p>
          {canPost && <p style={{fontSize:13,color:theme.textMuted,marginTop:4}}>Click "Post Notice" to add an announcement</p>}
        </div>
      ) : (
        <div style={{display:"flex",flexDirection:"column",gap:14}}>
          {notices.map(n=>(
            <div key={n.id} style={{background:"white",borderRadius:14,padding:24,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",border:`1px solid ${theme.border}`,borderLeft:`4px solid ${theme.red}`}}>
              <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:10}}>
                <div>
                  <h3 style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif",marginBottom:4}}>{n.title}</h3>
                  <p style={{fontSize:11,color:theme.textMuted}}>
                    Posted by {n.posted_by} · {new Date(n.created_at).toLocaleDateString("en-GB",{day:"numeric",month:"long",year:"numeric"})}
                    {n.target_roles&&n.target_roles!=="all"&&<span style={{marginLeft:8,padding:"1px 8px",background:theme.bg,borderRadius:4,fontWeight:600}}>{n.target_roles}</span>}
                  </p>
                </div>
                {canPost && (
                  <button onClick={()=>handleDelete(n.id)} className="btn"
                    style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",color:theme.danger,fontWeight:500}}>
                    Remove
                  </button>
                )}
              </div>
              <p style={{fontSize:13,color:theme.text,lineHeight:1.7}}>{n.content}</p>
              {n.expires_at&&(
                <p style={{fontSize:11,color:theme.amber,marginTop:8,fontWeight:600}}>
                  ⏰ Expires: {new Date(n.expires_at).toLocaleDateString()}
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {modal&&(
        <Modal title="Post Notice" onClose={()=>setModal(false)}>
          <div className="form-group"><label>Title *</label>
            <input className="form-input" placeholder="e.g. Term 2 Opening Date" value={form.title||""} onChange={f("title")}/>
          </div>
          <div className="form-group"><label>Message *</label>
            <textarea className="form-input" rows={5} placeholder="Type your announcement here..." value={form.content||""} onChange={f("content")}/>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Visible To</label>
              <select className="form-input" value={form.target_roles||"all"} onChange={f("target_roles")}>
                <option value="all">All Users</option>
                <option value="teacher">Teachers Only</option>
                <option value="parent">Parents Only</option>
                <option value="accountant">Accountant Only</option>
                <option value="teacher,principal">Staff Only</option>
              </select>
            </div>
            <div className="form-group"><label>Expires (optional)</label>
              <input type="date" className="form-input" value={form.expires_at||""} onChange={f("expires_at")}/>
            </div>
          </div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handlePost} loading={saving} icon="bell">Post Notice</Btn>
            <Btn variant="secondary" onClick={()=>setModal(false)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── Parent Portal ────────────────────────────────────────────────────────────
// ─── Parent Portal ─────────────────────────────────────────────────────────────
function ParentPortal({user, tab="dashboard"}) {
  const [activeTab, setActiveTab] = useState(tab);
  const [selectedChild, setSelectedChild] = useState(null);

  // Fetch ONLY this parent's linked children — nothing else
  const {data:childrenData, loading:childrenLoading, error:childrenError, reload:reloadChildren} =
    useFetch(() => api.myChildren());

  const children = childrenData?.students || [];

  // Auto-select first child
  React.useEffect(() => {
    if (children.length > 0 && !selectedChild) {
      setSelectedChild(children[0]);
    }
  }, [children.length]);

  const portalTabs = [
    {id:"overview",    label:"Overview",    icon:"dashboard"},
    {id:"results",     label:"Results",     icon:"results"},
    {id:"attendance",  label:"Attendance",  icon:"attendance"},
    {id:"discipline",  label:"Discipline",  icon:"discipline"},
    {id:"billing",     label:"Fees",        icon:"billing"},
    {id:"notices",     label:"Notices",     icon:"bell"},
  ];

  if (childrenLoading) return (
    <div style={{textAlign:"center",padding:60}}>
      <div style={{width:40,height:40,border:`3px solid ${theme.border}`,borderTopColor:theme.red,borderRadius:"50%",animation:"spin 0.6s linear infinite",margin:"0 auto 16px"}}/>
      <p style={{color:theme.textMuted,fontSize:13}}>Loading your child's information...</p>
    </div>
  );

  return (
    <div>
      {/* Welcome banner */}
      <div style={{background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,borderRadius:16,padding:"20px 24px",marginBottom:20,color:"white",display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",overflow:"hidden"}}>
        <div style={{position:"absolute",right:-20,top:-20,width:120,height:120,borderRadius:"50%",background:"rgba(255,255,255,0.05)"}}/>
        <div>
          <p style={{fontSize:11,opacity:0.65,letterSpacing:"0.08em",marginBottom:4}}>PARENT PORTAL</p>
          <h2 style={{fontFamily:"'Playfair Display',serif",fontSize:20,marginBottom:2}}>{user.full_name||user.fullName}</h2>
          <p style={{fontSize:12,opacity:0.6}}>{SCHOOL.name}</p>
        </div>
        <SchoolLogo width={80} style={{opacity:0.5}}/>
      </div>

      {/* Error state */}
      {childrenError && <ErrorBox message={childrenError} onRetry={reloadChildren}/>}

      {/* No children linked */}
      {!childrenLoading && children.length === 0 && !childrenError && (
        <div style={{background:"white",borderRadius:14,padding:56,textAlign:"center",border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
          <div style={{width:64,height:64,borderRadius:"50%",background:"#FEF2F2",margin:"0 auto 16px",display:"flex",alignItems:"center",justifyContent:"center"}}>
            <Icon d={icons.students} size={28} color={theme.red}/>
          </div>
          <h3 style={{fontFamily:"'Playfair Display',serif",fontSize:18,marginBottom:8}}>No learner linked to your account</h3>
          <p style={{fontSize:13,color:theme.textMuted,marginBottom:4}}>Your account has not yet been linked to a learner's profile.</p>
          <p style={{fontSize:13,color:theme.textMuted,marginBottom:20}}>Please contact the school office to have your child linked to your account.</p>
          <div style={{padding:"12px 20px",background:"#FEF2F2",borderRadius:10,display:"inline-block",fontSize:12}}>
            <p style={{fontWeight:700,color:theme.red,marginBottom:2}}>Still Waters Learning Academy</p>
            <p style={{color:theme.textMuted}}>{SCHOOL.tel}</p>
            <p style={{color:theme.textMuted}}>{SCHOOL.email}</p>
          </div>
        </div>
      )}

      {/* Child selector — when parent has multiple children */}
      {children.length > 1 && (
        <div style={{marginBottom:16}}>
          <p style={{fontSize:12,fontWeight:600,color:theme.textMuted,marginBottom:8,textTransform:"uppercase",letterSpacing:"0.05em"}}>Select Child</p>
          <div style={{display:"flex",gap:10,flexWrap:"wrap"}}>
            {children.map(c=>(
              <button key={c.id} onClick={()=>setSelectedChild(c)}
                style={{padding:"10px 18px",borderRadius:10,border:`2px solid ${selectedChild?.id===c.id?theme.red:theme.border}`,background:selectedChild?.id===c.id?"#FEF2F2":"white",cursor:"pointer",fontWeight:600,fontSize:13,color:selectedChild?.id===c.id?theme.red:theme.text,transition:"all 0.15s"}}>
                <p style={{marginBottom:2}}>{c.last_name}, {c.first_name}</p>
                <p style={{fontSize:11,fontWeight:400,color:theme.textMuted}}>{FORM_LABEL[c.form]||`Form ${c.form}`}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Main portal — scoped to selectedChild only */}
      {selectedChild && (
        <>
          {/* Child info card */}
          <div style={{background:"white",borderRadius:14,padding:18,marginBottom:16,border:`1px solid ${theme.border}`,display:"flex",alignItems:"center",gap:16,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,fontWeight:700,color:"white",flexShrink:0}}>
              {selectedChild.first_name[0]}{selectedChild.last_name[0]}
            </div>
            <div style={{flex:1}}>
              <p style={{fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{selectedChild.last_name}, {selectedChild.first_name}</p>
              <p style={{fontSize:12,color:theme.textMuted,marginTop:2}}>{FORM_LABEL[selectedChild.form]||`Form ${selectedChild.form}`} · Student ID: {selectedChild.student_id}</p>
              <p style={{fontSize:12,color:theme.textMuted}}>Class: {selectedChild.class} · Campus: {SCHOOL.campuses.find(c=>c.id===selectedChild.campus)?.short||selectedChild.campus}</p>
            </div>
            <div style={{textAlign:"right"}}>
              <Badge color={selectedChild.status==="Active"?"green":"gray"}>{selectedChild.status}</Badge>
              <p style={{fontSize:11,color:theme.textMuted,marginTop:4}}>Enrolled {selectedChild.enroll_date?.split("T")[0]||"—"}</p>
            </div>
          </div>

          {/* Tab nav */}
          <div style={{display:"flex",gap:0,marginBottom:20,borderBottom:`2px solid ${theme.border}`,overflowX:"auto"}}>
            {portalTabs.map(t=>(
              <button key={t.id} onClick={()=>setActiveTab(t.id)}
                style={{display:"flex",alignItems:"center",gap:6,padding:"10px 18px",border:"none",background:"none",cursor:"pointer",borderBottom:`2px solid ${activeTab===t.id?theme.red:"transparent"}`,marginBottom:"-2px",fontWeight:activeTab===t.id?700:500,fontSize:13,color:activeTab===t.id?theme.red:theme.textMuted,whiteSpace:"nowrap",transition:"all 0.15s"}}>
                <Icon d={icons[t.icon]} size={14}/>
                {t.label}
              </button>
            ))}
          </div>

          {/* Tab content — all scoped to selectedChild.id */}
          {activeTab==="overview"   && <ParentOverview   child={selectedChild}/>}
          {activeTab==="results"    && <ParentResults    child={selectedChild}/>}
          {activeTab==="attendance" && <ParentAttendance child={selectedChild}/>}
          {activeTab==="discipline" && <ParentDiscipline child={selectedChild}/>}
          {activeTab==="billing"    && <ParentBilling    child={selectedChild}/>}
          {activeTab==="notices"    && <Notices user={user}/>}
        </>
      )}
    </div>
  );
}

// ─── Parent Overview Tab ──────────────────────────────────────────────────────
function ParentOverview({child}) {
  const {data:resData}  = useFetch(()=>api.results({student_id:child.id,term:"Term 1",year:CURRENT_YEAR,report_type:"term_report",limit:30}),[child.id]);
  const {data:attData}  = useFetch(()=>api.attendanceSummary({student_id:child.id}),[child.id]);
  const {data:invData}  = useFetch(()=>api.invoices({student_id:child.id,limit:5}),[child.id]);

  const results  = resData?.results  || [];
  const att      = attData?.summary  || {};
  const invoices = invData?.invoices || [];
  const avgMark  = results.length ? (results.reduce((s,r)=>s+parseFloat(r.mark||0),0)/results.length).toFixed(1) : null;
  const balance  = invoices.reduce((s,i)=>s+parseFloat(i.balance||0),0);
  const isLowAtt = att.rate && parseFloat(att.rate) < 80;

  return (
    <div>
      {/* Alerts */}
      {isLowAtt && (
        <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
          <Icon d={icons.alert} size={18} color={theme.amber}/>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:"#92400E"}}>⚠️ Attendance Below Threshold</p>
            <p style={{fontSize:12,color:"#92400E"}}>{child.first_name}'s attendance is at {att.rate}% — below the required 80%. Please contact the school.</p>
          </div>
        </div>
      )}
      {balance > 0 && (
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
          <Icon d={icons.billing} size={18} color={theme.danger}/>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:theme.danger}}>Outstanding Balance</p>
            <p style={{fontSize:12,color:theme.danger}}>${balance.toFixed(2)} outstanding. Please settle before the next term.</p>
          </div>
        </div>
      )}

      {/* Summary stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(160px,1fr))",gap:14,marginBottom:20}}>
        {[
          {icon:"results",   label:"Average Mark",     value:avgMark?`${avgMark}%`:"—",      color:theme.turquoise, sub:"Term 1 · "+CURRENT_YEAR},
          {icon:"attendance",label:"Attendance Rate",  value:att.rate?`${att.rate}%`:"—",    color:isLowAtt?theme.danger:theme.green, sub:`${att.present||0} days present`},
          {icon:"billing",   label:"Fee Balance",      value:`$${balance.toFixed(2)}`,        color:balance>0?theme.danger:theme.green, sub:balance>0?"Outstanding":"Fully paid"},
        ].map((s,i)=><StatCard key={i} {...s}/>)}
      </div>

      {/* Recent results */}
      {results.length > 0 && (
        <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,marginBottom:16,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
          <div style={{padding:"16px 20px",borderBottom:`1px solid ${theme.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <h3 style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Latest Results — Term 1</h3>
            <Btn size="sm" variant="tq" icon="download" onClick={()=>window.open(api.reportCardURL(child.id,{term:"Term 1",year:CURRENT_YEAR,report_type:"term_report"}),"_blank")}>
              Download Report Card
            </Btn>
          </div>
          {results.slice(0,6).map((r,i)=>(
            <div key={i} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 20px",borderBottom:i<5?`1px solid ${theme.border}`:"none"}}>
              <span style={{fontSize:13}}>{r.subject_name}</span>
              <div style={{display:"flex",alignItems:"center",gap:12}}>
                <span style={{fontSize:13,fontWeight:600,color:theme.textMuted}}>{parseFloat(r.mark||0).toFixed(0)}%</span>
                <span className="badge" style={{background:`${GRADE_COLOR[r.grade]||"#64748B"}20`,color:GRADE_COLOR[r.grade]||"#64748B",fontWeight:700,fontSize:13,minWidth:28,justifyContent:"center"}}>{r.grade}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Recent attendance */}
      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
        <div style={{padding:"16px 20px",borderBottom:`1px solid ${theme.border}`}}>
          <h3 style={{fontSize:15,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Attendance Summary</h3>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)"}}>
          {[["Present",att.present,theme.green],["Absent",att.absent,theme.danger],["Total Days",att.total,theme.turquoise],["Rate",`${att.rate||0}%`,isLowAtt?theme.danger:theme.green]].map(([l,v,c])=>(
            <div key={l} style={{padding:"20px 0",textAlign:"center",borderRight:"1px solid "+theme.border}}>
              <p style={{fontSize:24,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{v||0}</p>
              <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Parent Results Tab ───────────────────────────────────────────────────────
function ParentResults({child}) {
  const [term,  setTerm]  = useState("Term 1");
  const [rtype, setRtype] = useState("term_report");
  const {data,loading,error,reload} = useFetch(
    ()=>api.results({student_id:child.id, term, year:CURRENT_YEAR, report_type:rtype, limit:50}),
    [child.id, term, rtype]
  );
  const results = data?.results || [];
  const avg = results.length ? (results.reduce((s,r)=>s+parseFloat(r.mark||0),0)/results.length).toFixed(1) : null;

  return (
    <div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16,flexWrap:"wrap",gap:10}}>
        <div style={{display:"flex",gap:8}}>
          <select className="form-input" style={{width:110}} value={term} onChange={e=>setTerm(e.target.value)}>
            {TERMS.map(t=><option key={t}>{t}</option>)}
          </select>
          <select className="form-input" style={{width:170}} value={rtype} onChange={e=>setRtype(e.target.value)}>
            <option value="term_report">Full Term Report</option>
            <option value="mark_reader">Half Term Mark Reader</option>
          </select>
        </div>
        <Btn size="sm" icon="download" variant="tq"
          onClick={()=>window.open(api.reportCardURL(child.id,{term,year:CURRENT_YEAR,report_type:rtype}),"_blank")}>
          Download PDF
        </Btn>
      </div>

      {error && <ErrorBox message={error} onRetry={reload}/>}

      {avg && (
        <div style={{padding:14,background:"#F0FDF4",borderRadius:10,marginBottom:14,border:"1px solid #BBF7D0",display:"flex",gap:10,alignItems:"center"}}>
          <Icon d={icons.chart} size={16} color={theme.green}/>
          <p style={{fontSize:13,fontWeight:600,color:"#065F46"}}>
            {rtype==="mark_reader"?"Half Term":"Term"} Average: {avg}% — {parseFloat(avg)>=75?"Distinction":parseFloat(avg)>=65?"Merit":parseFloat(avg)>=50?"Credit":parseFloat(avg)>=40?"Satisfactory":"Needs Improvement"}
          </p>
        </div>
      )}

      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
        {loading ? <div style={{padding:24}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:44,marginBottom:8}}/>)}</div>
        : results.length===0 ? <EmptyState message="No results recorded for this period yet"/>
        : (
          <table>
            <thead><tr style={{background:"#FEF2F2"}}>
              <th>Subject</th><th>Curriculum</th><th>Mark %</th>
              {rtype==="mark_reader"&&<><th>Class Avg</th><th>Effort</th></>}
              <th>Grade</th><th>Remarks</th>
            </tr></thead>
            <tbody>
              {results.map((r,i)=>(
                <tr key={i}>
                  <td style={{fontWeight:500,fontSize:13}}>{r.subject_name}</td>
                  <td style={{fontSize:11}}><span style={{padding:"2px 7px",borderRadius:4,background:theme.bg,color:theme.textMuted,fontWeight:600}}>{(r.curriculum||"").replace("_"," ")}</span></td>
                  <td style={{fontWeight:700,fontSize:14}}>{parseFloat(r.mark||0).toFixed(0)}%</td>
                  {rtype==="mark_reader"&&(
                    <>
                      <td style={{fontSize:13,color:theme.textMuted}}>{r.class_average?`${parseFloat(r.class_average).toFixed(0)}%`:"—"}</td>
                      <td style={{fontSize:12,fontWeight:600,color:r.effort>=3?theme.green:r.effort>=1?theme.amber:theme.danger}}>
                        {r.effort!=null?`${r.effort} — ${EFFORT_LABEL[r.effort]||""}`:"—"}
                      </td>
                    </>
                  )}
                  <td><span className="badge" style={{background:`${GRADE_COLOR[r.grade]||"#64748B"}20`,color:GRADE_COLOR[r.grade]||"#64748B",fontWeight:700,fontSize:13}}>{r.grade||"—"}</span></td>
                  <td style={{fontSize:12,color:theme.textMuted}}>{r.remarks||"—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Parent Attendance Tab ────────────────────────────────────────────────────
function ParentAttendance({child}) {
  const {data:sumData,reload:reloadSum}   = useFetch(()=>api.attendanceSummary({student_id:child.id}),[child.id]);
  const {data:recData,loading,error,reload:reloadRec} = useFetch(()=>api.attendance({student_id:child.id,limit:90}),[child.id]);
  const summary = sumData?.summary || {};
  const records = recData?.attendance || [];
  const isLow   = summary.rate && parseFloat(summary.rate) < 80;
  const reload  = ()=>{ reloadSum(); reloadRec(); };

  // Group records by month for better readability
  const byMonth = records.reduce((acc,r)=>{
    const m = r.date?.slice(0,7); // YYYY-MM
    if(!acc[m]) acc[m]=[];
    acc[m].push(r);
    return acc;
  },{});

  return (
    <div>
      {isLow && (
        <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"flex-start"}}>
          <Icon d={icons.alert} size={18} color={theme.amber} style={{flexShrink:0,marginTop:2}}/>
          <div>
            <p style={{fontSize:13,fontWeight:700,color:"#92400E"}}>⚠️ Low Attendance Warning</p>
            <p style={{fontSize:12,color:"#92400E",marginTop:2}}>
              {child.first_name}'s attendance is {summary.rate}% — below the 80% minimum requirement.
              Please ensure your child attends school regularly. Contact the school if there are medical or personal circumstances.
            </p>
          </div>
        </div>
      )}

      {/* Summary cards */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:14,marginBottom:20}}>
        {[
          ["Days Present", summary.present, theme.green],
          ["Days Absent",  summary.absent,  theme.danger],
          ["Total Days",   summary.total,   theme.turquoise],
          ["Rate",         `${summary.rate||0}%`, isLow?theme.danger:theme.green],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:18,borderRadius:12,textAlign:"center",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
            <p style={{fontSize:26,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{v||0}</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Attendance records */}
      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
        <div style={{padding:"14px 20px",borderBottom:`1px solid ${theme.border}`,display:"flex",justifyContent:"space-between",alignItems:"center"}}>
          <h3 style={{fontSize:14,fontWeight:700}}>Attendance Record</h3>
          <Btn size="sm" variant="secondary" icon="refresh" onClick={reload}>Refresh</Btn>
        </div>
        {error && <ErrorBox message={error} onRetry={reload}/>}
        {loading ? <div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:40,marginBottom:6}}/>)}</div>
        : records.length===0 ? <EmptyState message="No attendance records found"/>
        : (
          <table>
            <thead><tr style={{background:"#FEF2F2"}}>
              <th>Date</th><th>Day</th><th>Status</th><th>Remarks</th>
            </tr></thead>
            <tbody>
              {records.map((a,i)=>{
                const d = new Date(a.date);
                return (
                  <tr key={i}>
                    <td style={{fontSize:13,fontWeight:500}}>{d.toLocaleDateString("en-GB",{day:"numeric",month:"short",year:"numeric"})}</td>
                    <td style={{fontSize:12,color:theme.textMuted}}>{d.toLocaleDateString("en-GB",{weekday:"long"})}</td>
                    <td><Badge color={a.status==="Present"?"green":"red"}>{a.status}</Badge></td>
                    <td style={{fontSize:12,color:theme.textMuted}}>{a.remarks||"—"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Parent Discipline Tab ────────────────────────────────────────────────────
function ParentDiscipline({child}) {
  const {data,loading,error,reload} = useFetch(
    ()=>api.get(`/discipline?student_id=${child.id}&limit=30`),
    [child.id]
  );
  const incidents = data?.incidents || [];
  const open      = incidents.filter(i=>i.status==="Open").length;

  return (
    <div>
      {open > 0 && (
        <div style={{background:"#FEF2F2",border:"1px solid #FECACA",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
          <Icon d={icons.alert} size={18} color={theme.danger}/>
          <p style={{fontSize:13,fontWeight:600,color:theme.danger}}>
            {child.first_name} has {open} open discipline case{open>1?"s":""}. Please follow up with the school.
          </p>
        </div>
      )}

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[
          ["Total Incidents", incidents.length, theme.textMuted],
          ["Open Cases",      open,              open>0?theme.danger:theme.green],
          ["Resolved",        incidents.filter(i=>i.status==="Resolved").length, theme.green],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:18,borderRadius:12,textAlign:"center",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
            <p style={{fontSize:26,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{v}</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
          </div>
        ))}
      </div>

      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
        {error&&<ErrorBox message={error} onRetry={reload}/>}
        {loading ? <div style={{padding:24}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:48,marginBottom:8}}/>)}</div>
        : incidents.length===0 ? (
          <div style={{textAlign:"center",padding:"40px 24px"}}>
            <div style={{width:56,height:56,borderRadius:"50%",background:"#D1FAE5",margin:"0 auto 12px",display:"flex",alignItems:"center",justifyContent:"center"}}>
              <Icon d={icons.check} size={24} color={theme.green}/>
            </div>
            <p style={{fontSize:14,fontWeight:600,color:theme.green}}>No discipline incidents on record</p>
            <p style={{fontSize:12,color:theme.textMuted,marginTop:4}}>Keep up the great behaviour!</p>
          </div>
        ) : (
          <table>
            <thead><tr style={{background:"#FEF2F2"}}>
              <th>Date</th><th>Incident</th><th>Severity</th><th>Action Taken</th><th>Status</th>
            </tr></thead>
            <tbody>
              {incidents.map((d,i)=>(
                <tr key={i}>
                  <td style={{fontSize:12,color:theme.textMuted}}>{new Date(d.date||d.created_at).toLocaleDateString("en-GB")}</td>
                  <td style={{fontSize:13,maxWidth:200}}>{d.incident_type||d.description||"—"}</td>
                  <td><Badge color={d.severity==="High"?"red":d.severity==="Medium"?"amber":"tq"}>{d.severity||"Low"}</Badge></td>
                  <td style={{fontSize:12,color:theme.textMuted}}>{d.action_taken||"Pending"}</td>
                  <td><Badge color={d.status==="Open"?"red":"green"}>{d.status}</Badge></td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

// ─── Parent Billing Tab ───────────────────────────────────────────────────────
function ParentBilling({child}) {
  const {data,loading,error,reload} = useFetch(()=>api.invoices({student_id:child.id,limit:20}),[child.id]);
  const invoices  = data?.invoices || [];
  const totalDue  = invoices.reduce((s,i)=>s+parseFloat(i.amount_due||0),0);
  const totalPaid = invoices.reduce((s,i)=>s+parseFloat(i.amount_paid||0),0);
  const totalBal  = totalDue - totalPaid;

  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        <div style={{background:`linear-gradient(135deg,${theme.turquoise},#06B6D4)`,padding:20,borderRadius:12,color:"white"}}>
          <p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase"}}>Total Billed</p>
          <p style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${totalDue.toFixed(2)}</p>
        </div>
        <div style={{background:`linear-gradient(135deg,${theme.green},#34D399)`,padding:20,borderRadius:12,color:"white"}}>
          <p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase"}}>Total Paid</p>
          <p style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${totalPaid.toFixed(2)}</p>
        </div>
        <div style={{background:`linear-gradient(135deg,${totalBal>0?theme.danger:"#059669"},${totalBal>0?"#FF6B6B":"#34D399"})`,padding:20,borderRadius:12,color:"white"}}>
          <p style={{fontSize:11,fontWeight:600,opacity:0.8,marginBottom:4,textTransform:"uppercase"}}>Balance Due</p>
          <p style={{fontSize:24,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>${totalBal.toFixed(2)}</p>
        </div>
      </div>

      {totalBal > 0 && (
        <div style={{padding:14,background:"#FEF3C7",borderRadius:10,marginBottom:16,border:"1px solid #FCD34D",fontSize:13,color:"#92400E"}}>
          <p style={{fontWeight:700,marginBottom:2}}>⏰ Payment Reminder</p>
          <p>You have an outstanding balance of <strong>${totalBal.toFixed(2)}</strong>. Please settle before the next term opening date.</p>
        </div>
      )}

      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,overflow:"hidden",boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
        {error&&<ErrorBox message={error} onRetry={reload}/>}
        {loading ? <div style={{padding:24}}>{[...Array(3)].map((_,i)=><div key={i} className="skeleton" style={{height:52,marginBottom:8}}/>)}</div>
        : invoices.length===0 ? <EmptyState message="No invoices found"/>
        : (
          <table>
            <thead><tr style={{background:"#FEF2F2"}}>
              <th>Invoice #</th><th>Term</th><th>Amount Due</th><th>Paid</th><th>Balance</th><th>Status</th><th>PDF</th>
            </tr></thead>
            <tbody>
              {invoices.map((inv,i)=>(
                <tr key={i}>
                  <td style={{fontFamily:"monospace",fontSize:12,color:theme.turquoise,fontWeight:600}}>{inv.invoice_no}</td>
                  <td style={{fontSize:13}}>{inv.term} {inv.year}</td>
                  <td style={{fontFamily:"monospace",fontWeight:600}}>${parseFloat(inv.amount_due).toFixed(2)}</td>
                  <td style={{fontFamily:"monospace",color:theme.green,fontWeight:600}}>${parseFloat(inv.amount_paid).toFixed(2)}</td>
                  <td style={{fontFamily:"monospace",color:parseFloat(inv.balance||0)>0?theme.danger:theme.textMuted,fontWeight:600}}>${parseFloat(inv.balance||0).toFixed(2)}</td>
                  <td><Badge color={inv.status==="Paid"?"green":inv.status==="Partial"?"amber":"red"}>{inv.status}</Badge></td>
                  <td>
                    <button className="btn" onClick={()=>window.open(api.invoicePdfURL(inv.id),"_blank")}
                      style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,padding:"4px 10px",fontSize:11,cursor:"pointer",color:"#1D4ED8",fontWeight:600}}>
                      PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <div style={{marginTop:16,padding:14,background:"#F0FDF4",borderRadius:10,border:"1px solid #BBF7D0",fontSize:12,color:"#065F46"}}>
        <p style={{fontWeight:700,marginBottom:4}}>Banking Details</p>
        <p>Bank: <strong>Ecobank</strong> · Account Name: <strong>Still Waters Learning Academy</strong> · Account Number: <strong>576700023470</strong></p>
        <p style={{marginTop:2}}>Accepted: Cash · Bank Transfer · EcoCash · Please bring proof of payment to the school office.</p>
      </div>
    </div>
  );
}


// ─── User Management ──────────────────────────────────────────────────────────
function UserManagement({user}) {
  const toast = useToast();
  const [tab,         setTab]         = useState("all");
  const [roleFilter,  setRoleFilter]  = useState("all");
  const [search,      setSearch]      = useState("");
  const [modal,       setModal]       = useState(null);
  const [selectedUser,setSelectedUser]= useState(null);
  const [profileData, setProfileData] = useState(null);
  const [profileLoading,setProfileLoading]=useState(false);
  const [editForm,    setEditForm]    = useState({});
  const [saving,      setSaving]      = useState(false);
  const [createForm,  setCreateForm]  = useState({role:"teacher",campus:"swla"});
  const [linkStudentId,setLinkStudentId]=useState("");
  const [linkResults, setLinkResults] = useState([]);
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError,   setLinkError]   = useState("");

  const {data:allData,  loading:allLoading,  reload:reloadAll}     = useFetch(()=>api.users({approved:"true"}),  []);
  const {data:pendData, loading:pendLoading, reload:reloadPending} = useFetch(()=>api.users({approved:"false"}), []);
  const allUsers     = allData?.users  || [];
  const pendingUsers = pendData?.users || [];

  const ROLE_PILLS = [
    {id:"all",       label:"All"},
    {id:"admin",     label:"Admin"},
    {id:"principal", label:"Principal"},
    {id:"teacher",   label:"Teachers"},
    {id:"accountant",label:"Accountants"},
    {id:"parent",    label:"Parents"},
  ];

  const ROLE_OPTIONS = [
    {value:"teacher",    label:"Teacher"},
    {value:"accountant", label:"Accountant"},
    {value:"parent",     label:"Parent / Guardian"},
    {value:"principal",  label:"Principal"},
  ];

  const cf = k => e => setCreateForm(p=>({...p,[k]:e.target.value}));
  const ef = k => e => setEditForm(p=>({...p,[k]:e.target.value}));

  // Filter users
  const baseList = tab==="pending" ? pendingUsers : allUsers;
  const displayUsers = baseList.filter(u=>{
    const matchRole   = roleFilter==="all" || u.role===roleFilter;
    const matchSearch = !search || u.full_name?.toLowerCase().includes(search.toLowerCase()) || u.username?.toLowerCase().includes(search.toLowerCase());
    return matchRole && matchSearch;
  });

  // Role counts for pills
  const roleCounts = allUsers.reduce((acc,u)=>{ acc[u.role]=(acc[u.role]||0)+1; return acc; }, {});

  // Open user profile
  const openProfile = async (u) => {
    setSelectedUser(u);
    setEditForm({ full_name:u.full_name, email:u.email||"", username:u.username, role:u.role, campus:u.campus, newPassword:"" });
    setProfileData(null);
    setModal("view");
    setProfileLoading(true);
    try {
      const d = await api.userProfile(u.id);
      setProfileData(d);
    } catch(e) { toast(e.message,"error"); }
    finally { setProfileLoading(false); }
  };

  const handleApprove = async (id, approve) => {
    try {
      await api.approveUser(id, {approved: approve});
      toast(approve?"✅ Account approved — user can now log in":"Account suspended", approve?"success":"info");
      reloadAll(); reloadPending();
    } catch(e) { toast(e.message,"error"); }
  };

  const handleSaveEdit = async () => {
    if (!editForm.full_name || !editForm.username) { toast("Name and username are required","warning"); return; }
    if (editForm.newPassword && editForm.newPassword.length < 6) { toast("Password must be at least 6 characters","warning"); return; }
    setSaving(true);
    try {
      const payload = {
        full_name:  editForm.full_name,
        email:      editForm.email || "",
        username:   editForm.username,
        role:       editForm.role,
        campus:     editForm.campus,
      };
      if (editForm.newPassword) payload.newPassword = editForm.newPassword;
      await api.updateUser(selectedUser.id, payload);
      toast("User profile updated successfully");
      setModal(null); reloadAll(); reloadPending();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  // Search students for parent link
  const searchForLink = async () => {
    const q = linkStudentId.trim();
    if (!q) { setLinkError("Enter a learner name or ID"); return; }
    setLinkLoading(true); setLinkError(""); setLinkResults([]);
    try {
      const res = await api.get("/students?search=" + encodeURIComponent(q) + "&limit=10");
      if (!res.students?.length) setLinkError(`No learners found for "${q}"`);
      else setLinkResults(res.students);
    } catch(e) { setLinkError(e.message||"Search failed"); }
    finally { setLinkLoading(false); }
  };

  const handleCreate = async () => {
    if (!createForm.fullName||!createForm.username||!createForm.password) { toast("Full name, username and password are required","warning"); return; }
    if (createForm.password.length < 6) { toast("Password must be at least 6 characters","warning"); return; }
    setSaving(true);
    try {
      const res = await api.createUser({ full_name:createForm.fullName, username:createForm.username, email:createForm.email||"", password:createForm.password, role:createForm.role, campus:createForm.campus, is_approved:true });
      if (createForm.role==="parent" && createForm.linkedStudentId && res.user?.id) {
        await api.linkParentStudent({parentUserId:res.user.id, studentId:createForm.linkedStudentId});
        toast(`Parent account created & linked to ${createForm.linkedStudentName||"learner"}`);
      } else {
        toast(`${ROLE_STYLE[createForm.role]?.label||createForm.role} account created`);
      }
      setModal(null);
      setCreateForm({role:"teacher",campus:"swla"});
      setLinkStudentId(""); setLinkResults([]);
      reloadAll();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>User Management</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>{allUsers.length} accounts · {pendingUsers.length} pending approval</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {pendingUsers.length>0&&(
            <div style={{padding:"6px 14px",borderRadius:8,background:"#FEF3C7",border:"1px solid #FCD34D",fontSize:12,fontWeight:700,color:"#92400E",display:"flex",alignItems:"center",gap:6}}>
              <Icon d={icons.bell} size={14} color="#92400E"/>
              {pendingUsers.length} pending
            </div>
          )}
          <Btn icon="plus" onClick={()=>{setCreateForm({role:"teacher",campus:"swla"});setLinkStudentId("");setLinkResults([]);setModal("create");}}>Create Account</Btn>
        </div>
      </div>

      {/* Tabs */}
      <div style={{display:"flex",gap:0,marginBottom:16,borderBottom:`1px solid ${theme.border}`}}>
        {[["all",`All Users (${allUsers.length})`],["pending",`⏳ Pending (${pendingUsers.length})`]].map(([id,label])=>(
          <button key={id} onClick={()=>setTab(id)}
            style={{padding:"10px 18px",border:"none",background:"none",cursor:"pointer",fontWeight:tab===id?700:500,fontSize:13,color:tab===id?theme.red:theme.textMuted,borderBottom:`2px solid ${tab===id?theme.red:"transparent"}`,marginBottom:"-1px",transition:"all 0.15s"}}>
            {label}
          </button>
        ))}
      </div>

      {/* Role filter pills */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap",alignItems:"center"}}>
        <span style={{fontSize:12,fontWeight:600,color:theme.textMuted}}>Filter by role:</span>
        {ROLE_PILLS.map(p=>(
          <button key={p.id} onClick={()=>setRoleFilter(p.id)}
            style={{padding:"5px 14px",borderRadius:999,border:`1.5px solid ${roleFilter===p.id?theme.red:theme.border}`,background:roleFilter===p.id?theme.red:"white",color:roleFilter===p.id?"white":theme.textMuted,fontSize:12,fontWeight:600,cursor:"pointer",transition:"all 0.15s"}}>
            {p.label}{p.id!=="all"&&roleCounts[p.id]?` (${roleCounts[p.id]})`:p.id==="all"?` (${allUsers.length})`:""}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{marginBottom:16,maxWidth:340}}>
        <SearchInput value={search} onChange={setSearch} placeholder="Search name or username..."/>
      </div>

      {/* Pending notice */}
      {tab==="pending"&&pendingUsers.length>0&&(
        <div style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:10,padding:14,marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
          <Icon d={icons.bell} size={16} color={theme.amber}/>
          <p style={{fontSize:13,color:"#92400E",fontWeight:600}}>{pendingUsers.length} account{pendingUsers.length>1?"s":""} waiting for your approval.</p>
        </div>
      )}

      {/* Users table — clickable rows */}
      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",overflow:"hidden"}}>
        {(tab==="all"?allLoading:pendLoading) ? (
          <div style={{padding:24}}>{[...Array(5)].map((_,i)=><div key={i} className="skeleton" style={{height:56,marginBottom:8}}/>)}</div>
        ) : displayUsers.length===0 ? (
          <EmptyState message={tab==="pending"?"No accounts pending approval":"No users match this filter"}/>
        ) : (
          <table>
            <thead><tr style={{background:"#FEF2F2"}}>
              <th>User</th><th>Role</th><th>Campus</th><th>Status</th><th>Joined</th><th>Actions</th>
            </tr></thead>
            <tbody>
              {displayUsers.map(u=>(
                <tr key={u.id} onClick={()=>openProfile(u)} style={{cursor:"pointer"}}
                  onMouseOver={e=>e.currentTarget.style.background="#F8FAFC"}
                  onMouseOut={e=>e.currentTarget.style.background="white"}>
                  <td>
                    <div style={{display:"flex",alignItems:"center",gap:10}}>
                      <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",flexShrink:0}}>
                        {(u.full_name||"U").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p style={{fontWeight:600,fontSize:13}}>{u.full_name}</p>
                        <p style={{fontSize:11,color:theme.textMuted}}>@{u.username}{u.email?` · ${u.email}`:""}</p>
                      </div>
                    </div>
                  </td>
                  <td><RoleBadge role={u.role}/></td>
                  <td style={{fontSize:13}}>{SCHOOL.campuses.find(c=>c.id===u.campus)?.short||u.campus||"—"}</td>
                  <td><Badge color={u.is_approved?"green":"amber"}>{u.is_approved?"Active":"Pending"}</Badge></td>
                  <td style={{fontSize:12,color:theme.textMuted}}>{u.created_at?new Date(u.created_at).toLocaleDateString("en-GB"):"—"}</td>
                  <td onClick={e=>e.stopPropagation()}>
                    <div style={{display:"flex",gap:6}}>
                      <button className="btn" onClick={()=>openProfile(u)}
                        style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#1D4ED8"}}>
                        View / Edit
                      </button>
                      {!u.is_approved&&(
                        <button className="btn" onClick={()=>handleApprove(u.id,true)}
                          style={{background:"#D1FAE5",border:"1px solid #6EE7B7",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:700,color:"#065F46"}}>
                          ✓ Approve
                        </button>
                      )}
                      {u.is_approved&&u.id!==user.id&&(
                        <button className="btn" onClick={()=>handleApprove(u.id,false)}
                          style={{background:"#FEF3C7",border:"1px solid #FCD34D",borderRadius:6,padding:"4px 10px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#92400E"}}>
                          Suspend
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* ── User Profile / Edit Modal ── */}
      {modal==="view"&&selectedUser&&(
        <Modal title="User Profile" onClose={()=>setModal(null)} large>
          {/* Profile banner */}
          <div style={{display:"flex",gap:16,alignItems:"center",padding:"16px 20px",background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,borderRadius:12,marginBottom:20}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.turquoise},white)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:theme.red,flexShrink:0}}>
              {(selectedUser.full_name||"U").charAt(0)}
            </div>
            <div>
              <p style={{color:"white",fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{selectedUser.full_name}</p>
              <RoleBadge role={selectedUser.role}/>
              <p style={{color:"rgba(255,255,255,0.6)",fontSize:11,marginTop:2}}>@{selectedUser.username} · Joined {selectedUser.created_at?new Date(selectedUser.created_at).toLocaleDateString("en-GB"):"—"}</p>
            </div>
            <div style={{marginLeft:"auto"}}>
              <Badge color={selectedUser.is_approved?"green":"amber"}>{selectedUser.is_approved?"Active":"Pending"}</Badge>
            </div>
          </div>

          {/* Edit form */}
          <div style={{marginBottom:20}}>
            <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Edit Profile</p>
            <div className="form-row">
              <div className="form-group"><label>Full Name *</label><input className="form-input" value={editForm.full_name||""} onChange={ef("full_name")}/></div>
              <div className="form-group"><label>Username *</label><input className="form-input" value={editForm.username||""} onChange={ef("username")}/></div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Email</label><input type="email" className="form-input" value={editForm.email||""} onChange={ef("email")}/></div>
              <div className="form-group"><label>Campus</label>
                <select className="form-input" value={editForm.campus||"swla"} onChange={ef("campus")}>
                  {SCHOOL.campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-group"><label>Role</label>
                <select className="form-input" value={editForm.role||"teacher"} onChange={ef("role")} disabled={selectedUser.id===user.id}>
                  {["admin","principal","teacher","accountant","parent"].map(r=>(
                    <option key={r} value={r}>{ROLE_STYLE[r]?.label||r}</option>
                  ))}
                </select>
              </div>
              <div className="form-group">
                <label>Reset Password <span style={{fontSize:10,color:theme.textMuted}}>(leave blank to keep)</span></label>
                <input type="password" className="form-input" placeholder="New password (min 6 chars)" value={editForm.newPassword||""} onChange={ef("newPassword")}/>
              </div>
            </div>
            <div style={{display:"flex",gap:10}}>
              <Btn onClick={handleSaveEdit} loading={saving} icon="check">Save Changes</Btn>
              {selectedUser.id!==user.id&&(
                selectedUser.is_approved
                  ? <Btn variant="ghost" onClick={()=>handleApprove(selectedUser.id,false)}>Suspend Account</Btn>
                  : <Btn variant="success" onClick={()=>handleApprove(selectedUser.id,true)}>✓ Approve Account</Btn>
              )}
            </div>
          </div>

          {/* Teacher Subject Assignments */}
          {(selectedUser.role==="teacher"||editForm.role==="teacher")&&(
            <TeacherSubjectAssignments
              teacherId={selectedUser.id}
              teacherName={selectedUser.full_name}
              profileData={profileData}
              profileLoading={profileLoading}
              onRefresh={()=>{
                setProfileLoading(true);
                api.userProfile(selectedUser.id)
                  .then(d=>setProfileData(d))
                  .catch(e=>toast(e.message,"error"))
                  .finally(()=>setProfileLoading(false));
              }}
            />
          )}

          {/* Parent linked children section */}
          {selectedUser.role==="parent"&&(
            <div style={{borderTop:`1px solid ${theme.border}`,paddingTop:16,marginTop:4}}>
              <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Linked Children</p>
              {profileLoading ? (
                <div>{[...Array(2)].map((_,i)=><div key={i} className="skeleton" style={{height:44,marginBottom:6}}/>)}</div>
              ) : !profileData?.children?.length ? (
                <div style={{padding:"14px 16px",background:"#FEF3C7",borderRadius:8,fontSize:13,color:"#92400E"}}>
                  ⚠️ No children linked to this parent account. Enrol a learner and create a parent account to link them.
                </div>
              ) : (
                <div style={{border:`1px solid ${theme.border}`,borderRadius:10,overflow:"hidden"}}>
                  {profileData.children.map((c,i)=>(
                    <div key={c.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 16px",borderBottom:i<profileData.children.length-1?`1px solid ${theme.border}`:"none"}}>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:30,height:30,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:10,fontWeight:700,color:"white"}}>{c.first_name[0]}{c.last_name[0]}</div>
                        <div>
                          <p style={{fontWeight:600,fontSize:13}}>{c.last_name}, {c.first_name}</p>
                          <p style={{fontSize:11,color:theme.textMuted}}>{FORM_LABEL[c.grade]||c.grade} · {c.student_id}</p>
                        </div>
                      </div>
                      <Badge color={c.status==="Active"?"green":"gray"}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </Modal>
      )}

      {/* ── Create Account Modal ── */}
      {modal==="create"&&(
        <Modal title="Create User Account" onClose={()=>setModal(null)} large>
          <div style={{padding:12,background:"#F0FDFF",borderRadius:8,marginBottom:16,fontSize:12,color:"#0E7490",borderLeft:`3px solid ${theme.turquoise}`}}>
            Accounts created here are <strong>immediately active</strong> — no approval queue.
          </div>
          <div className="form-row">
            <div className="form-group"><label>Role *</label>
              <select className="form-input" value={createForm.role||"teacher"} onChange={cf("role")}>
                {ROLE_OPTIONS.map(r=><option key={r.value} value={r.value}>{r.label}</option>)}
              </select>
            </div>
            <div className="form-group"><label>Campus *</label>
              <select className="form-input" value={createForm.campus||"swla"} onChange={cf("campus")}>
                {SCHOOL.campuses.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>
          <div className="form-group"><label>Full Name *</label><input className="form-input" placeholder="e.g. Mrs. T. Moyo" value={createForm.fullName||""} onChange={cf("fullName")}/></div>
          <div className="form-group"><label>Email</label><input type="email" className="form-input" placeholder="e.g. tmoyo@stillwaters.co.zw" value={createForm.email||""} onChange={cf("email")}/></div>
          <div className="form-row">
            <div className="form-group"><label>Username *</label><input className="form-input" placeholder="e.g. tmoyo" value={createForm.username||""} onChange={cf("username")}/></div>
            <div className="form-group"><label>Password * <span style={{fontSize:10,color:theme.textMuted}}>(min 6)</span></label><input type="password" className="form-input" value={createForm.password||""} onChange={cf("password")}/></div>
          </div>
          {createForm.role==="parent"&&(
            <div style={{padding:14,borderRadius:10,background:"#F0FDFF",border:`1px solid ${theme.turquoise}`,marginTop:4}}>
              <p style={{fontSize:13,fontWeight:700,color:theme.turquoise,marginBottom:8}}>Link to Learner (optional)</p>
              <div style={{display:"flex",gap:8,marginBottom:8}}>
                <input className="form-input" style={{flex:1}} placeholder="Search learner by surname..." value={linkStudentId} onChange={e=>{setLinkStudentId(e.target.value);setLinkError("");}} onKeyDown={e=>e.key==="Enter"&&searchForLink()}/>
                <Btn size="sm" variant="tq" onClick={searchForLink} loading={linkLoading} icon="search">Search</Btn>
              </div>
              {linkError&&<div style={{padding:"8px 12px",background:"#FEF2F2",borderRadius:8,fontSize:12,color:theme.danger,marginBottom:8}}>{linkError}</div>}
              {linkResults.length>0&&(
                <div style={{border:`1px solid ${theme.border}`,borderRadius:8,overflow:"hidden",marginBottom:8}}>
                  {linkResults.map(s=>(
                    <div key={s.id} onClick={()=>{setCreateForm(p=>({...p,linkedStudentId:s.id,linkedStudentName:`${s.last_name}, ${s.first_name}`}));setLinkResults([]);setLinkStudentId(`${s.last_name}, ${s.first_name}`);}}
                      style={{padding:"10px 14px",cursor:"pointer",display:"flex",justifyContent:"space-between",alignItems:"center",borderBottom:`1px solid ${theme.border}`,background:createForm.linkedStudentId===s.id?"#F0FDFF":"white"}}>
                      <div><p style={{fontWeight:600,fontSize:13}}>{s.last_name}, {s.first_name}</p><p style={{fontSize:11,color:theme.textMuted}}>{FORM_LABEL[s.grade]||s.grade} · {s.student_id}</p></div>
                      {createForm.linkedStudentId===s.id&&<Icon d={icons.check} size={16} color={theme.turquoise}/>}
                    </div>
                  ))}
                </div>
              )}
              {createForm.linkedStudentName&&(
                <div style={{padding:"8px 12px",background:"#D1FAE5",borderRadius:8,fontSize:12,fontWeight:600,color:"#065F46",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  ✓ Linked: {createForm.linkedStudentName}
                  <button onClick={()=>setCreateForm(p=>({...p,linkedStudentId:null,linkedStudentName:null}))} style={{background:"none",border:"none",cursor:"pointer",fontSize:11,color:"#065F46"}}>Remove ×</button>
                </div>
              )}
            </div>
          )}
          <div style={{display:"flex",gap:10,marginTop:16}}>
            <Btn onClick={handleCreate} loading={saving} icon="check">Create Account</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}


// ─── Teacher Subject Assignments Component ────────────────────────────────────
// Self-contained panel embedded inside the UserManagement profile modal.
// Lets admin assign/remove subject+form combinations for any teacher.
function TeacherSubjectAssignments({teacherId, teacherName, profileData, profileLoading, onRefresh}) {
  const toast = useToast();
  const [adding,     setAdding]     = useState(false);
  const [newForm,    setNewForm]    = useState("");
  const [newSubject, setNewSubject] = useState("");
  const [subjects,   setSubjects]   = useState([]);
  const [loadingSubj,setLoadingSubj]= useState(false);
  const [removing,   setRemoving]   = useState(null); // id being deleted

  const assignments = profileData?.subjectAssignments || [];

  // Load subjects when form changes
  React.useEffect(()=>{
    if (!newForm) { setSubjects([]); setNewSubject(""); return; }
    setLoadingSubj(true); setNewSubject("");
    api.allSubjectsForForm(newForm)
      .then(d=>setSubjects(d.subjects||[]))
      .catch(e=>toast(e.message,"error"))
      .finally(()=>setLoadingSubj(false));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  },[newForm]);

  const handleAdd = async () => {
    if (!newForm || !newSubject) { toast("Select both a form and a subject","warning"); return; }
    // Check for duplicate
    const already = assignments.find(a=>a.form===newForm && String(a.subject_id)===String(newSubject));
    if (already) { toast("This assignment already exists","warning"); return; }
    setAdding(true);
    try {
      await api.addTeacherSubject({ teacher_user_id: teacherId, subject_id: parseInt(newSubject), form: newForm });
      toast("Subject assignment added ✅");
      setNewForm(""); setNewSubject(""); setSubjects([]);
      onRefresh();
    } catch(e) { toast(e.message,"error"); }
    finally { setAdding(false); }
  };

  const handleRemove = async (id) => {
    setRemoving(id);
    try {
      await api.removeTeacherSubject(id);
      toast("Assignment removed","info");
      onRefresh();
    } catch(e) { toast(e.message,"error"); }
    finally { setRemoving(null); }
  };

  // Group assignments by form for display
  const grouped = assignments.reduce((acc, a) => {
    if (!acc[a.form]) acc[a.form] = [];
    acc[a.form].push(a);
    return acc;
  }, {});

  const SUBJ_COLORS_MAP = {
    "ZIMSEC_O":   {bg:"#DBEAFE",text:"#1E40AF"},
    "ZIMSEC_A":   {bg:"#D1FAE5",text:"#065F46"},
    "CAMBRIDGE_O":{bg:"#EDE9FE",text:"#5B21B6"},
    "CAMBRIDGE_A":{bg:"#FEF3C7",text:"#92400E"},
  };

  return (
    <div style={{borderTop:`1px solid ${theme.border}`,paddingTop:20,marginTop:8}}>
      {/* Section header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div>
          <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em"}}>
            Subject Assignments
          </p>
          <p style={{fontSize:11,color:theme.textMuted,marginTop:2}}>
            These define which learners {teacherName?.split(" ")[0]||"this teacher"} can see and mark.
          </p>
        </div>
        <Badge color={assignments.length>0?"green":"amber"}>
          {assignments.length} assignment{assignments.length!==1?"s":""}
        </Badge>
      </div>

      {profileLoading ? (
        <div>{[...Array(2)].map((_,i)=><div key={i} className="skeleton" style={{height:44,marginBottom:8,borderRadius:8}}/>)}</div>
      ) : (
        <>
          {/* Existing assignments */}
          {assignments.length===0 ? (
            <div style={{padding:"14px 16px",background:"#FEF3C7",borderRadius:10,fontSize:13,color:"#92400E",marginBottom:16,display:"flex",gap:10,alignItems:"center"}}>
              <Icon d={icons.alert} size={16} color={theme.amber}/>
              No subjects assigned yet. Use the form below to assign subjects and forms to this teacher.
            </div>
          ) : (
            <div style={{marginBottom:16}}>
              {FORMS.filter(f=>grouped[f]).map(form=>(
                <div key={form} style={{marginBottom:12}}>
                  <p style={{fontSize:12,fontWeight:700,color:theme.turquoise,marginBottom:6,textTransform:"uppercase",letterSpacing:"0.05em"}}>
                    {FORM_LABEL[form]||`Form ${form}`}
                  </p>
                  <div style={{display:"flex",flexWrap:"wrap",gap:8}}>
                    {grouped[form].map(a=>{
                      const col = SUBJ_COLORS_MAP[a.curriculum]||{bg:"#F3F4F6",text:"#374151"};
                      return (
                        <div key={a.id} style={{display:"flex",alignItems:"center",gap:6,padding:"6px 12px",borderRadius:8,background:col.bg,border:`1px solid ${col.text}33`}}>
                          <span style={{fontSize:13,fontWeight:600,color:col.text}}>{a.subject_name}</span>
                          <span style={{fontSize:10,color:col.text,opacity:0.7}}>({(a.curriculum||"").replace("_"," ")})</span>
                          <button
                            onClick={()=>handleRemove(a.id)}
                            disabled={removing===a.id}
                            style={{background:"none",border:"none",cursor:"pointer",padding:"1px 3px",borderRadius:4,color:col.text,fontWeight:700,fontSize:13,opacity:removing===a.id?0.4:1,marginLeft:2}}
                            title="Remove assignment">
                            {removing===a.id?"…":"×"}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Timetable slots summary (read-only reference) */}
          {profileData?.timetable?.length>0&&(
            <div style={{padding:"10px 14px",background:"#F0FDFF",borderRadius:8,marginBottom:16,border:`1px solid ${theme.turquoise}33`}}>
              <p style={{fontSize:11,fontWeight:700,color:theme.turquoise,marginBottom:6}}>
                TIMETABLE SLOTS ({profileData.timetable.length} periods assigned)
              </p>
              <div style={{display:"flex",flexWrap:"wrap",gap:6}}>
                {profileData.timetable.map((t,i)=>(
                  <span key={i} style={{fontSize:11,padding:"3px 8px",borderRadius:5,background:"white",border:`1px solid ${theme.border}`,color:theme.textMuted}}>
                    <strong>{t.form}</strong> · {t.day?.slice(0,3)} P{t.period} · {t.subject_name||"—"}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Add new assignment */}
          <div style={{padding:16,borderRadius:12,background:"#F8FAFC",border:`1px solid ${theme.border}`}}>
            <p style={{fontSize:12,fontWeight:700,color:theme.text,marginBottom:12}}>➕ Add New Assignment</p>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr auto",gap:10,alignItems:"flex-end"}}>
              <div className="form-group" style={{margin:0}}>
                <label>Form *</label>
                <select className="form-input" value={newForm} onChange={e=>setNewForm(e.target.value)}>
                  <option value="">— Select Form —</option>
                  {FORMS.map(f=><option key={f} value={f}>{FORM_LABEL[f]}</option>)}
                </select>
              </div>
              <div className="form-group" style={{margin:0}}>
                <label>Subject *</label>
                <select className="form-input" value={newSubject} onChange={e=>setNewSubject(e.target.value)} disabled={!newForm||loadingSubj}>
                  <option value="">{!newForm?"Select form first":loadingSubj?"Loading…":"— Select Subject —"}</option>
                  {subjects.map(s=>(
                    <option key={s.id} value={s.id}>{s.name} ({(s.curriculum||"").replace("_"," ")})</option>
                  ))}
                </select>
              </div>
              <Btn onClick={handleAdd} loading={adding} icon="plus" disabled={!newForm||!newSubject}>
                Assign
              </Btn>
            </div>
            {newForm&&subjects.length===0&&!loadingSubj&&(
              <p style={{fontSize:11,color:theme.textMuted,marginTop:8}}>No subjects found for this form. Check that subjects are seeded in the database.</p>
            )}
          </div>
        </>
      )}
    </div>
  );
}


// ─── Timetable ────────────────────────────────────────────────────────────────
const DAYS    = ["Monday","Tuesday","Wednesday","Thursday","Friday"];
// eslint-disable-next-line no-unused-vars
const DAY_SHORT = {"Monday":"Mon","Tuesday":"Tue","Wednesday":"Wed","Thursday":"Thu","Friday":"Fri"};
const PERIODS = [1,2,3,4,5,6,7,8];
const PERIOD_TIMES = {
  1:"07:30–08:25", 2:"08:25–09:20", 3:"09:20–10:15",
  4:"10:30–11:25", 5:"11:25–12:20",
  6:"13:00–13:55", 7:"13:55–14:50", 8:"14:50–15:45",
};
// Break markers (periods after which there is a break)
const BREAK_AFTER = {3:"BREAK 10:15–10:30", 5:"LUNCH 12:20–13:00"};

// Subject colour palette — cycles through for visual distinction
const SUBJ_COLORS = [
  {bg:"#DBEAFE",text:"#1E40AF"},{bg:"#D1FAE5",text:"#065F46"},{bg:"#FEF3C7",text:"#92400E"},
  {bg:"#FCE7F3",text:"#9D174D"},{bg:"#EDE9FE",text:"#5B21B6"},{bg:"#CFFAFE",text:"#0E7490"},
  {bg:"#FEE2E2",text:"#991B1B"},{bg:"#D1FAE5",text:"#065F46"},{bg:"#FEF9C3",text:"#713F12"},
  {bg:"#E0F2FE",text:"#0C4A6E"},{bg:"#F3E8FF",text:"#6B21A8"},{bg:"#DCFCE7",text:"#14532D"},
];

function Timetable({user}) {
  const toast = useToast();
  const canEdit = ["admin","principal"].includes(user.role);

  const [viewMode,    setViewMode]    = useState("class");   // class | teacher | print
  const [selForm,     setSelForm]     = useState("1");
  const [selTeacher,  setSelTeacher]  = useState(user.role==="teacher" ? String(user.id) : "");
  const [modal,       setModal]       = useState(null);
  const [slot,        setSlot]        = useState(null);      // {form, day, period} being edited
  const [slotForm,    setSlotForm]    = useState({});
  const [saving,      setSaving]      = useState(false);

  // Fetch timetable data
  const ttQuery = viewMode==="teacher" && selTeacher
    ? {teacher_id: selTeacher}
    : {form: selForm};
  const {data:ttData, loading:ttLoading, reload:reloadTT} =
    useFetch(()=>api.timetable(ttQuery), [selForm, selTeacher, viewMode]);

  const {data:teachersData} = useFetch(()=>api.timetableTeachers());
  const {data:subjData}     = useFetch(()=>api.subjects(), []);

  const ttSlots    = ttData?.timetable  || [];
  const teachers   = teachersData?.teachers || [];
  const subjects   = subjData?.subjects  || [];

  // Build a lookup: day+period -> slot
  const slotMap = {};
  ttSlots.forEach(s => { slotMap[`${s.day}-${s.period}`] = s; });

  // Assign consistent colours to subjects
  const subjColorMap = {};
  let colorIdx = 0;
  ttSlots.forEach(s => {
    if (s.subject_id && !subjColorMap[s.subject_id]) {
      subjColorMap[s.subject_id] = SUBJ_COLORS[colorIdx % SUBJ_COLORS.length];
      colorIdx++;
    }
  });

  const sf = k => e => setSlotForm(p=>({...p,[k]:e.target.value}));

  const openAdd = (day, period) => {
    if (!canEdit) return;
    const existing = slotMap[`${day}-${period}`];
    setSlot({day, period, form: selForm});
    setSlotForm(existing ? {
      subjectId:   String(existing.subject_id   || ""),
      teacherId:   String(existing.teacher_user_id || ""),
      room:        existing.room || "",
    } : {subjectId:"", teacherId:"", room:""});
    setModal("edit");
  };

  const handleSave = async () => {
    if (!slotForm.subjectId) { toast("Please select a subject","warning"); return; }
    setSaving(true);
    try {
      await api.saveTimetableSlot({
        form:            slot.form,
        day:             slot.day,
        period:          slot.period,
        subject_id:      slotForm.subjectId   || null,
        teacher_user_id: slotForm.teacherId   || null,
        room:            slotForm.room        || null,
      });
      toast("Timetable updated");
      setModal(null); reloadTT();
    } catch(e) { toast(e.message,"error"); }
    finally    { setSaving(false); }
  };

  const handleDelete = async () => {
    const existing = slotMap[`${slot.day}-${slot.period}`];
    if (!existing) { setModal(null); return; }
    try {
      await api.deleteTimetableSlot(existing.id);
      toast("Slot cleared","info");
      setModal(null); reloadTT();
    } catch(e) { toast(e.message,"error"); }
  };

  // Export timetable as CSV
  const exportTT = () => {
    const rows = [];
    DAYS.forEach(day => {
      PERIODS.forEach(p => {
        const s = slotMap[`${day}-${p}`];
        rows.push({
          Form:    selForm, Day: day, Period: p,
          Time:    PERIOD_TIMES[p],
          Subject: s?.subject_name  || "",
          Teacher: s?.teacher_name  || "",
          Room:    s?.room          || "",
        });
      });
    });
    exportCSV(rows, `timetable-form${selForm}-${CURRENT_YEAR}.csv`);
  };

  // ── Slot Cell ──────────────────────────────────────────────────────────────
  const SlotCell = ({day, period}) => {
    const s    = slotMap[`${day}-${period}`];
    const col  = s?.subject_id ? (subjColorMap[s.subject_id] || SUBJ_COLORS[0]) : null;
    return (
      <td
        onClick={()=>openAdd(day, period)}
        style={{
          padding:0, verticalAlign:"top",
          cursor: canEdit ? "pointer" : "default",
          minWidth:110, maxWidth:130,
        }}
      >
        <div style={{
          margin:2, borderRadius:7, minHeight:68, padding:"6px 8px",
          background: s ? col?.bg : canEdit ? "#FAFAFA" : "white",
          border: s ? `1.5px solid ${col?.text}33` : `1px dashed ${canEdit?"#D1D5DB":"#F3F4F6"}`,
          transition:"all 0.15s",
          position:"relative",
        }}
          onMouseOver={e=>canEdit&&(e.currentTarget.style.background=s?col?.bg+"CC":"#F0F9FF")}
          onMouseOut={e=>canEdit&&(e.currentTarget.style.background=s?col?.bg:"#FAFAFA")}
        >
          {s ? (
            <>
              <p style={{fontSize:11,fontWeight:700,color:col?.text,lineHeight:1.3,marginBottom:2}}>
                {s.subject_name?.length>22 ? s.subject_name.slice(0,21)+"…" : s.subject_name}
              </p>
              {s.teacher_name && (
                <p style={{fontSize:10,color:theme.textMuted,lineHeight:1.3}}>
                  {s.teacher_name.split(" ").pop()}
                </p>
              )}
              {s.room && (
                <p style={{fontSize:10,color:theme.textMuted,lineHeight:1.3}}>📍 {s.room}</p>
              )}
            </>
          ) : canEdit ? (
            <div style={{display:"flex",alignItems:"center",justifyContent:"center",height:56,color:"#D1D5DB"}}>
              <Icon d={icons.plus} size={16}/>
            </div>
          ) : null}
        </div>
      </td>
    );
  };

  // ── Teacher view: list all their slots ────────────────────────────────────
  const TeacherView = () => {
    const grouped = {};
    ttSlots.forEach(s => {
      if (!grouped[s.day]) grouped[s.day] = {};
      grouped[s.day][s.period] = s;
    });
    return (
      <div>
        {ttSlots.length===0 ? <EmptyState message="No timetable slots assigned to this teacher"/> : (
          DAYS.filter(d=>grouped[d]).map(day=>(
            <div key={day} style={{marginBottom:16}}>
              <h3 style={{fontSize:13,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>{day}</h3>
              <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
                {PERIODS.filter(p=>grouped[day]?.[p]).map(p=>{
                  const s   = grouped[day][p];
                  const col = s.subject_id ? (subjColorMap[s.subject_id]||SUBJ_COLORS[0]) : SUBJ_COLORS[0];
                  return (
                    <div key={p} style={{padding:"10px 14px",borderRadius:10,background:col.bg,border:`1.5px solid ${col.text}33`,minWidth:140}}>
                      <p style={{fontSize:10,fontWeight:600,color:theme.textMuted,marginBottom:2}}>Period {p} · {PERIOD_TIMES[p]}</p>
                      <p style={{fontSize:13,fontWeight:700,color:col.text}}>{s.subject_name}</p>
                      <p style={{fontSize:11,color:theme.textMuted}}>Form {s.form} {s.room?`· ${s.room}`:""}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          ))
        )}
      </div>
    );
  };

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:18,flexWrap:"wrap",gap:10}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>Timetable</h2>
          <p style={{fontSize:12,color:theme.textMuted}}>
            {SCHOOL.name} · Academic Year {CURRENT_YEAR}
            {canEdit && " · Click any cell to add or edit"}
          </p>
        </div>
        <div style={{display:"flex",gap:8}}>
          {viewMode==="class" && (
            <Btn variant="secondary" size="sm" icon="download" onClick={exportTT}>Export CSV</Btn>
          )}
        </div>
      </div>

      {/* View mode + filters */}
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        {/* View tabs */}
        <div style={{display:"flex",background:"white",borderRadius:10,border:`1px solid ${theme.border}`,overflow:"hidden"}}>
          {[["class","📋 By Class"],["teacher","👤 By Teacher"]].map(([m,l])=>(
            <button key={m} onClick={()=>setViewMode(m)}
              style={{padding:"8px 16px",border:"none",cursor:"pointer",fontWeight:viewMode===m?700:500,fontSize:13,background:viewMode===m?theme.red:"white",color:viewMode===m?"white":theme.textMuted,transition:"all 0.15s"}}>
              {l}
            </button>
          ))}
        </div>

        {viewMode==="class" && (
          <select className="form-input" style={{width:180}} value={selForm} onChange={e=>setSelForm(e.target.value)}>
            {FORMS.map(f=><option key={f} value={f}>{FORM_LABEL[f]}</option>)}
          </select>
        )}

        {viewMode==="teacher" && (
          <select className="form-input" style={{width:220}} value={selTeacher} onChange={e=>setSelTeacher(e.target.value)}>
            <option value="">— Select Teacher —</option>
            {teachers.map(t=><option key={t.id} value={String(t.id)}>{t.full_name}</option>)}
          </select>
        )}
      </div>

      {/* Stats strip */}
      {viewMode==="class" && (
        <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:18}}>
          {[
            ["Periods/Week", PERIODS.length * DAYS.length, theme.turquoise],
            ["Assigned",     ttSlots.length,               theme.green],
            ["Empty Slots",  PERIODS.length*DAYS.length - ttSlots.length, ttSlots.length<PERIODS.length*DAYS.length?theme.amber:theme.green],
            ["Teachers",     [...new Set(ttSlots.filter(s=>s.teacher_user_id).map(s=>s.teacher_user_id))].length, theme.red],
          ].map(([l,v,c])=>(
            <div key={l} style={{background:"white",padding:"14px 18px",borderRadius:12,border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`,boxShadow:"0 2px 8px rgba(196,30,58,0.05)"}}>
              <p style={{fontSize:22,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{ttLoading?"…":v}</p>
              <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
            </div>
          ))}
        </div>
      )}

      {/* Main content */}
      {ttLoading ? (
        <div style={{background:"white",borderRadius:14,padding:24,border:`1px solid ${theme.border}`}}>
          {[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:72,marginBottom:8,borderRadius:8}}/>)}
        </div>
      ) : viewMode==="teacher" ? (
        <div style={{background:"white",borderRadius:14,padding:24,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)"}}>
          {!selTeacher ? (
            <EmptyState message="Select a teacher above to view their timetable"/>
          ) : (
            <TeacherView/>
          )}
        </div>
      ) : (
        /* ── Class Grid View ── */
        <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",overflow:"hidden"}}>
          {/* Form title bar */}
          <div style={{background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,padding:"14px 20px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
            <div>
              <p style={{color:"white",fontWeight:700,fontSize:15,fontFamily:"'Playfair Display',serif"}}>
                {FORM_LABEL[selForm]} — Weekly Timetable
              </p>
              <p style={{color:"rgba(255,255,255,0.6)",fontSize:11}}>
                {SCHOOL.name} · {CURRENT_YEAR}
              </p>
            </div>
            <div style={{display:"flex",gap:6}}>
              {FORMS.map(f=>(
                <button key={f} onClick={()=>setSelForm(f)}
                  style={{padding:"5px 10px",borderRadius:6,border:`1px solid ${f===selForm?"white":"rgba(255,255,255,0.25)"}`,background:f===selForm?"white":"transparent",color:f===selForm?theme.red:"rgba(255,255,255,0.75)",fontSize:11,fontWeight:700,cursor:"pointer"}}>
                  {f}
                </button>
              ))}
            </div>
          </div>

          <div style={{overflowX:"auto"}}>
            <table style={{minWidth:700}}>
              <thead>
                <tr style={{background:"#FEF2F2"}}>
                  <th style={{width:90,textAlign:"center",padding:"10px 8px",fontSize:11}}>Period</th>
                  {DAYS.map(d=>(
                    <th key={d} style={{textAlign:"center",padding:"10px 8px",fontSize:12,fontWeight:700,color:theme.red}}>
                      {d}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {PERIODS.map(p=>(
                  <React.Fragment key={p}>
                    <tr>
                      {/* Period label */}
                      <td style={{textAlign:"center",padding:"4px 8px",verticalAlign:"middle",background:"#FAFAFA",borderRight:`1px solid ${theme.border}`}}>
                        <p style={{fontSize:12,fontWeight:700,color:theme.text}}>P{p}</p>
                        <p style={{fontSize:10,color:theme.textMuted}}>{PERIOD_TIMES[p]}</p>
                      </td>
                      {/* Day cells */}
                      {DAYS.map(d=><SlotCell key={d} day={d} period={p}/>)}
                    </tr>
                    {/* Break / Lunch row */}
                    {BREAK_AFTER[p] && (
                      <tr>
                        <td colSpan={6} style={{padding:"6px 16px",background:"#FEF3C7",borderTop:`1px solid #FCD34D`,borderBottom:`1px solid #FCD34D`,textAlign:"center"}}>
                          <p style={{fontSize:11,fontWeight:700,color:"#92400E",letterSpacing:"0.08em"}}>{BREAK_AFTER[p]}</p>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>

          {/* Legend */}
          {Object.keys(subjColorMap).length > 0 && (
            <div style={{padding:"12px 16px",borderTop:`1px solid ${theme.border}`,display:"flex",flexWrap:"wrap",gap:8,alignItems:"center"}}>
              <span style={{fontSize:11,fontWeight:600,color:theme.textMuted,marginRight:4}}>SUBJECTS:</span>
              {[...new Set(ttSlots.map(s=>s.subject_id))].filter(Boolean).map(sid=>{
                const s   = ttSlots.find(t=>t.subject_id===sid);
                const col = subjColorMap[sid]||SUBJ_COLORS[0];
                return (
                  <span key={sid} className="badge" style={{background:col.bg,color:col.text,fontSize:11}}>
                    {s?.subject_name?.split(" ").slice(0,2).join(" ")}
                  </span>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Edit/Add Modal */}
      {modal==="edit"&&slot&&(
        <Modal title={`${slotMap[`${slot.day}-${slot.period}`]?"Edit":"Add"} Slot — ${slot.day}, Period ${slot.period}`} onClose={()=>setModal(null)}>
          <div style={{padding:"10px 14px",background:"#FEF2F2",borderRadius:8,marginBottom:16,fontSize:12,color:theme.red,borderLeft:`3px solid ${theme.red}`}}>
            <strong>{FORM_LABEL[slot.form]}</strong> · {slot.day} · Period {slot.period} · {PERIOD_TIMES[slot.period]}
          </div>

          <div className="form-group">
            <label>Subject *</label>
            <select className="form-input" value={slotForm.subjectId||""} onChange={sf("subjectId")}>
              <option value="">— Select Subject —</option>
              {subjects
                .filter(s=>{
                  // Filter to curriculum appropriate for this form
                  const f=slot.form;
                  if(["3C","4C"].includes(f)) return s.curriculum==="CAMBRIDGE_O";
                  if(["5","6"].includes(f))   return ["ZIMSEC_A","CAMBRIDGE_A"].includes(s.curriculum);
                  return s.curriculum==="ZIMSEC_O";
                })
                .map(s=>(
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))
              }
            </select>
          </div>

          <div className="form-group">
            <label>Teacher</label>
            <select className="form-input" value={slotForm.teacherId||""} onChange={sf("teacherId")}>
              <option value="">— Select Teacher —</option>
              {teachers.map(t=><option key={t.id} value={t.id}>{t.full_name}</option>)}
            </select>
          </div>

          <div className="form-group">
            <label>Room / Venue</label>
            <input className="form-input" placeholder="e.g. Room 5, Science Lab, Computer Lab"
              value={slotForm.room||""} onChange={sf("room")}/>
          </div>

          <div style={{display:"flex",gap:10,marginTop:4}}>
            <Btn onClick={handleSave} loading={saving} icon="check">
              {slotMap[`${slot.day}-${slot.period}`] ? "Update Slot" : "Add Slot"}
            </Btn>
            {slotMap[`${slot.day}-${slot.period}`] && (
              <Btn variant="danger" onClick={handleDelete} icon="trash">Clear Slot</Btn>
            )}
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─── HR & Staff Module ────────────────────────────────────────────────────────
function HRModule({user}) {
  const toast = useToast();
  const [modal,    setModal]    = useState(null);
  const [selected, setSelected] = useState(null);
  const [saving,   setSaving]   = useState(false);
  const [form,     setForm]     = useState({employment_type:"Full-Time",nationality:"Zimbabwean"});
  const [leaveForm,setLeaveForm]= useState({leave_type:"Annual Leave"});
  const [search,   setSearch]   = useState("");
  const [deptF,    setDeptF]    = useState("");
  const dSearch = useDebounce(search, 400);
  const canEdit = ["admin","principal"].includes(user.role);
  const f  = k => e => setForm(p=>({...p,[k]:e.target.value}));
  const lf = k => e => setLeaveForm(p=>({...p,[k]:e.target.value}));

  const {data,loading,error,reload} = useFetch(()=>{
    const q = {};
    if (dSearch) q.search     = dSearch;
    if (deptF)   q.department = deptF;
    return api.staffList(q);
  }, [dSearch,deptF]);
  const staff = data?.staff || [];

  // Leave data for selected staff member
  const {data:leaveData, reload:reloadLeave} = useFetch(
    ()=> selected?.id ? api.staffMember(selected.id) : Promise.resolve(null),
    [selected?.id]
  );
  const leaveRecords = leaveData?.leave || [];

  const DEPARTMENTS = ["Teaching","Administration","Accounts","Maintenance","ICT","Library","Sport","Other"];
  const LEAVE_TYPES = ["Annual Leave","Sick Leave","Compassionate Leave","Maternity Leave","Paternity Leave","Study Leave","Unpaid Leave"];

  const openAdd = () => {
    setForm({employment_type:"Full-Time", nationality:"Zimbabwean", hire_date:new Date().toISOString().split("T")[0]});
    setModal("add");
  };

  const openView = (s) => { setSelected(s); setModal("view"); };

  const handleSaveStaff = async () => {
    if (!form.first_name||!form.last_name||!form.job_title) {
      toast("First name, last name and job title are required","warning"); return;
    }
    setSaving(true);
    try {
      if (modal==="add") {
        await api.createStaff(form);
        toast("Staff record created");
      } else {
        await api.updateStaff(selected.id, form);
        toast("Staff record updated");
      }
      setModal(null); reload();
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleLeave = async () => {
    if (!leaveForm.start_date||!leaveForm.end_date||!leaveForm.leave_type) {
      toast("Leave type and dates are required","warning"); return;
    }
    setSaving(true);
    try {
      await api.applyLeave({...leaveForm, staff_id:selected.id});
      toast("Leave application submitted");
      reloadLeave();
      setModal("view");
    } catch(e) { toast(e.message,"error"); }
    finally { setSaving(false); }
  };

  const handleLeaveStatus = async (leaveId, status) => {
    try {
      await api.updateLeave(leaveId, {status});
      toast(status==="Approved"?"Leave approved":"Leave rejected", status==="Approved"?"success":"info");
      reloadLeave();
    } catch(e) { toast(e.message,"error"); }
  };

  // eslint-disable-next-line no-unused-vars
  const departments = [...new Set(staff.map(s=>s.department).filter(Boolean))].sort();

  const activeCount     = staff.filter(s=>s.employment_status==="Active").length;
  const teachingCount   = staff.filter(s=>s.department==="Teaching").length;
  const contractCount   = staff.filter(s=>s.employment_type==="Contract").length;

  return (
    <div>
      {/* Header */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{fontSize:20,fontWeight:700,fontFamily:"'Playfair Display',serif"}}>HR & Staff Management</h2>
          <p style={{fontSize:13,color:theme.textMuted}}>{SCHOOL.name} · {staff.length} staff on record</p>
        </div>
        <div style={{display:"flex",gap:8}}>
          <Btn variant="secondary" size="sm" icon="download"
            onClick={()=>exportCSV(staff.map(s=>({ID:s.employee_id,Surname:s.last_name,Firstname:s.first_name,Title:s.job_title,Dept:s.department,Type:s.employment_type,Status:s.employment_status,Hire:s.hire_date?.split("T")[0],Phone:s.phone,Email:s.email})),"staff.csv")}>
            Export CSV
          </Btn>
          {canEdit&&<Btn icon="plus" onClick={openAdd}>Add Staff Member</Btn>}
        </div>
      </div>

      {error&&<ErrorBox message={error} onRetry={reload}/>}

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:14,marginBottom:20}}>
        {[
          ["Active Staff",    activeCount,   theme.green],
          ["Teaching Staff",  teachingCount, theme.turquoise],
          ["Contract Staff",  contractCount, theme.amber],
        ].map(([l,v,c])=>(
          <div key={l} style={{background:"white",padding:18,borderRadius:12,textAlign:"center",border:`1px solid ${theme.border}`,borderTop:`3px solid ${c}`,boxShadow:"0 2px 8px rgba(196,30,58,0.05)"}}>
            <p style={{fontSize:26,fontWeight:700,color:c,fontFamily:"'Playfair Display',serif"}}>{loading?"…":v}</p>
            <p style={{fontSize:11,fontWeight:600,color:theme.textMuted,textTransform:"uppercase"}}>{l}</p>
          </div>
        ))}
      </div>

      {/* Filters + table */}
      <div style={{background:"white",borderRadius:14,border:`1px solid ${theme.border}`,boxShadow:"0 2px 8px rgba(196,30,58,0.06)",overflow:"hidden"}}>
        <div style={{padding:14,borderBottom:`1px solid ${theme.border}`,display:"flex",gap:10,flexWrap:"wrap"}}>
          <div style={{flex:1,minWidth:200}}><SearchInput value={search} onChange={setSearch} placeholder="Search by name, ID, job title..."/></div>
          <select className="form-input" style={{width:160}} value={deptF} onChange={e=>setDeptF(e.target.value)}>
            <option value="">All Departments</option>
            {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
          </select>
        </div>

        {loading ? <div style={{padding:24}}>{[...Array(4)].map((_,i)=><div key={i} className="skeleton" style={{height:56,marginBottom:8}}/>)}</div>
        : staff.length===0 ? <EmptyState message="No staff records found. Click 'Add Staff Member' to get started."/>
        : (
          <div style={{overflowX:"auto"}}>
            <table>
              <thead><tr style={{background:"#FEF2F2"}}>
                <th>Staff Member</th><th>Job Title</th><th>Department</th><th>Type</th><th>Status</th><th>Hire Date</th><th>Actions</th>
              </tr></thead>
              <tbody>
                {staff.map(s=>(
                  <tr key={s.id}>
                    <td>
                      <div style={{display:"flex",alignItems:"center",gap:10}}>
                        <div style={{width:36,height:36,borderRadius:"50%",background:`linear-gradient(135deg,${theme.red},${theme.turquoise})`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:13,fontWeight:700,color:"white",flexShrink:0}}>
                          {s.first_name[0]}{s.last_name[0]}
                        </div>
                        <div>
                          <p style={{fontWeight:600,fontSize:13}}>{s.last_name}, {s.first_name}</p>
                          <p style={{fontSize:11,color:theme.turquoise,fontFamily:"monospace"}}>{s.employee_id} {s.phone?`· ${s.phone}`:""}</p>
                        </div>
                      </div>
                    </td>
                    <td style={{fontSize:13}}>{s.job_title}</td>
                    <td style={{fontSize:13,color:theme.textMuted}}>{s.department||"—"}</td>
                    <td><Badge color={s.employment_type==="Full-Time"?"green":s.employment_type==="Part-Time"?"tq":"amber"}>{s.employment_type}</Badge></td>
                    <td><Badge color={s.employment_status==="Active"?"green":s.employment_status==="Terminated"?"red":"amber"}>{s.employment_status}</Badge></td>
                    <td style={{fontSize:12,color:theme.textMuted}}>{s.hire_date?.split("T")[0]||"—"}</td>
                    <td>
                      <button className="btn" onClick={()=>openView(s)}
                        style={{background:"#EFF6FF",border:"1px solid #BFDBFE",borderRadius:6,padding:"4px 12px",fontSize:12,cursor:"pointer",fontWeight:600,color:"#1D4ED8"}}>
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Staff Profile Modal */}
      {modal==="view"&&selected&&(
        <Modal title="Staff Profile" onClose={()=>setModal(null)} large>
          {/* Banner */}
          <div style={{display:"flex",gap:16,alignItems:"center",padding:"16px 20px",background:`linear-gradient(135deg,${theme.sidebarTop},${theme.red})`,borderRadius:12,marginBottom:20}}>
            <div style={{width:52,height:52,borderRadius:"50%",background:`linear-gradient(135deg,${theme.turquoise},white)`,display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,fontWeight:700,color:theme.red,flexShrink:0}}>
              {selected.first_name[0]}{selected.last_name[0]}
            </div>
            <div style={{flex:1}}>
              <p style={{color:"white",fontWeight:700,fontSize:16,fontFamily:"'Playfair Display',serif"}}>{selected.last_name}, {selected.first_name}</p>
              <p style={{color:"rgba(255,255,255,0.7)",fontSize:13}}>{selected.job_title} · {selected.department||"—"}</p>
              <p style={{color:"rgba(255,255,255,0.55)",fontSize:11}}>{selected.employee_id} · {selected.employment_type}</p>
            </div>
            <Badge color={selected.employment_status==="Active"?"green":"red"}>{selected.employment_status}</Badge>
          </div>

          {/* Details */}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8,marginBottom:20}}>
            {[
              ["Phone",         selected.phone||"—"],
              ["Email",         selected.email||"—"],
              ["ID Number",     selected.id_number||"—"],
              ["Nationality",   selected.nationality||"—"],
              ["Qualification", selected.qualification||"—"],
              ["Hire Date",     selected.hire_date?.split("T")[0]||"—"],
              ["Contract End",  selected.contract_end_date?.split("T")[0]||"—"],
              ["Bank",          selected.bank_name?`${selected.bank_name} · ${selected.bank_account||"—"}`:"—"],
              ["Salary",        selected.salary?`$${parseFloat(selected.salary).toLocaleString()}/month`:"—"],
              ["Emergency",     selected.emergency_contact?`${selected.emergency_contact} · ${selected.emergency_phone||""}`:"-"],
            ].map(([l,v])=>(
              <div key={l} style={{padding:"8px 12px",background:"#FAFAFA",borderRadius:6,fontSize:13}}>
                <p style={{fontSize:10,fontWeight:600,color:theme.textMuted,textTransform:"uppercase",marginBottom:2}}>{l}</p>
                <p style={{fontWeight:500}}>{v}</p>
              </div>
            ))}
          </div>

          {/* Action buttons */}
          {canEdit&&(
            <div style={{display:"flex",gap:8,marginBottom:20}}>
              <Btn size="sm" icon="edit" onClick={()=>{
                setForm({
                  first_name:selected.first_name, last_name:selected.last_name,
                  date_of_birth:selected.date_of_birth?.split("T")[0], gender:selected.gender,
                  id_number:selected.id_number, nationality:selected.nationality||"Zimbabwean",
                  email:selected.email, phone:selected.phone, address:selected.address,
                  job_title:selected.job_title, department:selected.department,
                  employment_type:selected.employment_type||"Full-Time",
                  hire_date:selected.hire_date?.split("T")[0],
                  contract_end_date:selected.contract_end_date?.split("T")[0],
                  salary:selected.salary, bank_name:selected.bank_name, bank_account:selected.bank_account,
                  qualification:selected.qualification,
                  emergency_contact:selected.emergency_contact, emergency_phone:selected.emergency_phone,
                  employment_status:selected.employment_status||"Active",
                });
                setModal("edit");
              }}>Edit Record</Btn>
              <Btn size="sm" variant="tq" icon="plus" onClick={()=>{setLeaveForm({leave_type:"Annual Leave",start_date:new Date().toISOString().split("T")[0],end_date:new Date().toISOString().split("T")[0]});setModal("leave");}}>Apply Leave</Btn>
            </div>
          )}

          {/* Leave history */}
          <div style={{borderTop:`1px solid ${theme.border}`,paddingTop:14}}>
            <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:10}}>Leave History</p>
            {leaveRecords.length===0 ? (
              <p style={{fontSize:13,color:theme.textMuted}}>No leave records yet.</p>
            ) : (
              <div style={{border:`1px solid ${theme.border}`,borderRadius:8,overflow:"hidden"}}>
                {leaveRecords.map((l,i)=>(
                  <div key={l.id} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"10px 14px",borderBottom:i<leaveRecords.length-1?`1px solid ${theme.border}`:"none"}}>
                    <div>
                      <p style={{fontSize:13,fontWeight:600}}>{l.leave_type}</p>
                      <p style={{fontSize:11,color:theme.textMuted}}>{l.start_date?.split("T")[0]} — {l.end_date?.split("T")[0]} · {l.days} day{l.days!==1?"s":""}</p>
                      {l.reason&&<p style={{fontSize:11,color:theme.textMuted,fontStyle:"italic"}}>{l.reason}</p>}
                    </div>
                    <div style={{display:"flex",gap:6,alignItems:"center"}}>
                      <Badge color={l.status==="Approved"?"green":l.status==="Rejected"?"red":"amber"}>{l.status}</Badge>
                      {canEdit&&l.status==="Pending"&&(
                        <>
                          <button onClick={()=>handleLeaveStatus(l.id,"Approved")} style={{padding:"3px 10px",borderRadius:6,border:"1px solid #6EE7B7",background:"#D1FAE5",fontSize:11,cursor:"pointer",fontWeight:700,color:"#065F46"}}>✓</button>
                          <button onClick={()=>handleLeaveStatus(l.id,"Rejected")} style={{padding:"3px 10px",borderRadius:6,border:"1px solid #FECACA",background:"#FEE2E2",fontSize:11,cursor:"pointer",fontWeight:700,color:theme.danger}}>✕</button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Modal>
      )}

      {/* Leave application modal */}
      {modal==="leave"&&selected&&(
        <Modal title={`Apply Leave — ${selected.first_name} ${selected.last_name}`} onClose={()=>setModal("view")}>
          <div className="form-group"><label>Leave Type *</label>
            <select className="form-input" value={leaveForm.leave_type||"Annual Leave"} onChange={lf("leave_type")}>
              {LEAVE_TYPES.map(t=><option key={t}>{t}</option>)}
            </select>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Start Date *</label><input type="date" className="form-input" value={leaveForm.start_date||""} onChange={lf("start_date")}/></div>
            <div className="form-group"><label>End Date *</label><input type="date" className="form-input" value={leaveForm.end_date||""} onChange={lf("end_date")}/></div>
          </div>
          <div className="form-group"><label>Reason</label><textarea className="form-input" rows={3} value={leaveForm.reason||""} onChange={lf("reason")}/></div>
          <div style={{display:"flex",gap:10}}>
            <Btn onClick={handleLeave} loading={saving} icon="check">Submit Application</Btn>
            <Btn variant="secondary" onClick={()=>setModal("view")}>Cancel</Btn>
          </div>
        </Modal>
      )}

      {/* Add / Edit staff modal */}
      {(modal==="add"||modal==="edit")&&(
        <Modal title={modal==="add"?"Add Staff Member":"Edit Staff Record"} onClose={()=>setModal(null)} large>
          <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12}}>Personal Details</p>
          <div className="form-row">
            <div className="form-group"><label>Surname *</label><input className="form-input" value={form.last_name||""} onChange={f("last_name")}/></div>
            <div className="form-group"><label>First Name(s) *</label><input className="form-input" value={form.first_name||""} onChange={f("first_name")}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Date of Birth</label><input type="date" className="form-input" value={form.date_of_birth||""} onChange={f("date_of_birth")}/></div>
            <div className="form-group"><label>Gender</label><select className="form-input" value={form.gender||""} onChange={f("gender")}><option value="">Select</option><option>Male</option><option>Female</option></select></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>National ID</label><input className="form-input" placeholder="63-123456A78" value={form.id_number||""} onChange={f("id_number")}/></div>
            <div className="form-group"><label>Nationality</label><input className="form-input" value={form.nationality||"Zimbabwean"} onChange={f("nationality")}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Phone</label><input className="form-input" value={form.phone||""} onChange={f("phone")}/></div>
            <div className="form-group"><label>Email</label><input type="email" className="form-input" value={form.email||""} onChange={f("email")}/></div>
          </div>
          <div className="form-group"><label>Address</label><input className="form-input" value={form.address||""} onChange={f("address")}/></div>
          <div className="form-group"><label>Highest Qualification</label><input className="form-input" placeholder="e.g. B.Ed. Mathematics, University of Zimbabwe" value={form.qualification||""} onChange={f("qualification")}/></div>

          <p style={{fontSize:12,fontWeight:700,color:theme.red,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:12,marginTop:16}}>Employment Details</p>
          <div className="form-row">
            <div className="form-group"><label>Job Title *</label><input className="form-input" placeholder="e.g. Mathematics Teacher" value={form.job_title||""} onChange={f("job_title")}/></div>
            <div className="form-group"><label>Department</label>
              <select className="form-input" value={form.department||""} onChange={f("department")}>
                <option value="">Select</option>
                {DEPARTMENTS.map(d=><option key={d}>{d}</option>)}
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Employment Type</label>
              <select className="form-input" value={form.employment_type||"Full-Time"} onChange={f("employment_type")}>
                <option>Full-Time</option><option>Part-Time</option><option>Contract</option><option>Temporary</option>
              </select>
            </div>
            <div className="form-group"><label>Status</label>
              <select className="form-input" value={form.employment_status||"Active"} onChange={f("employment_status")}>
                <option>Active</option><option>On Leave</option><option>Suspended</option><option>Terminated</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Hire Date</label><input type="date" className="form-input" value={form.hire_date||""} onChange={f("hire_date")}/></div>
            <div className="form-group"><label>Contract End Date</label><input type="date" className="form-input" value={form.contract_end_date||""} onChange={f("contract_end_date")}/></div>
          </div>
          <div className="form-row">
            <div className="form-group"><label>Monthly Salary (USD)</label><input type="number" step="0.01" className="form-input" placeholder="0.00" value={form.salary||""} onChange={f("salary")}/></div>
            <div className="form-group"><label>Bank Name</label><input className="form-input" placeholder="e.g. Ecobank" value={form.bank_name||""} onChange={f("bank_name")}/></div>
          </div>
          <div className="form-group"><label>Bank Account Number</label><input className="form-input" value={form.bank_account||""} onChange={f("bank_account")}/></div>
          <div className="form-row">
            <div className="form-group"><label>Emergency Contact</label><input className="form-input" value={form.emergency_contact||""} onChange={f("emergency_contact")}/></div>
            <div className="form-group"><label>Emergency Phone</label><input className="form-input" value={form.emergency_phone||""} onChange={f("emergency_phone")}/></div>
          </div>
          <div style={{display:"flex",gap:10,marginTop:4}}>
            <Btn onClick={handleSaveStaff} loading={saving} icon="check">{modal==="add"?"Add Staff Member":"Save Changes"}</Btn>
            <Btn variant="secondary" onClick={()=>setModal(null)}>Cancel</Btn>
          </div>
        </Modal>
      )}
    </div>
  );
}
