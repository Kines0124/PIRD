import { useState, useEffect, useRef } from "react";

// ─── Leaflet via CDN ───────────────────────────────────────────────────────────
// Load leaflet CSS + JS dynamically so it works inside any JSX sandbox
if (!document.getElementById("leaflet-css")) {
  const link = document.createElement("link");
  link.id = "leaflet-css";
  link.rel = "stylesheet";
  link.href = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.css";
  document.head.appendChild(link);
}
if (!document.getElementById("leaflet-js")) {
  const script = document.createElement("script");
  script.id = "leaflet-js";
  script.src = "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/leaflet.min.js";
  document.head.appendChild(script);
}

// ─── Mock data ─────────────────────────────────────────────────────────────────
const MOCK_EVENTS = [
  {
    id: 1,
    title: "Enchente Rio Paraíba",
    type: "enchente",
    status: "ativo",
    severity: "critico",
    lat: -23.02,
    lng: -45.56,
    city: "Taubaté, SP",
    date: "2025-04-20",
    victims: 340,
    volunteers: 18,
    criticalPointId: 1,
    nearbyCollectionIds: [1, 2],
    volunteerIds: [1, 2],
    photos: [],
  },
  {
    id: 2,
    title: "Deslizamento Serra",
    type: "deslizamento",
    status: "monitoramento",
    severity: "alto",
    lat: -23.18,
    lng: -45.88,
    city: "Campos do Jordão, SP",
    date: "2025-04-19",
    victims: 120,
    volunteers: 7,
    criticalPointId: 2,
    nearbyCollectionIds: [3],
    volunteerIds: [3],
    photos: [],
  },
  {
    id: 3,
    title: "Alagamento Centro",
    type: "alagamento",
    status: "controlado",
    severity: "medio",
    lat: -23.55,
    lng: -46.63,
    city: "São Paulo, SP",
    date: "2025-04-18",
    victims: 55,
    volunteers: 30,
    criticalPointId: null,
    nearbyCollectionIds: [],
    volunteerIds: [4],
    photos: [],
  },
];

const MOCK_CRITICAL_POINTS = [
  { id: 1, name: "Ponte Rio Paraíba KM-12", type: "infraestrutura", risk: "critico", lat: -23.03, lng: -45.54, description: "Estrutura comprometida pela cheia" },
  { id: 2, name: "Encosta Bairro Novo", type: "geologico", risk: "alto", lat: -23.19, lng: -45.85, description: "Risco de deslizamento após chuvas" },
  { id: 3, name: "Depósito de Gás Industrial", type: "quimico", risk: "alto", lat: -23.56, lng: -46.61, description: "Área de contenção sob monitoramento" },
];

const MOCK_VOLUNTEERS = [
  { id: 1, name: "Dr. Carlos Mendes", specialty: "Medicina de Emergência", status: "pendente", region: "Taubaté, SP", cpf: "***.***.***-12", registered: "2025-04-20" },
  { id: 2, name: "Eng. Renata Souza", specialty: "Engenharia Civil", status: "pendente", region: "São Paulo, SP", cpf: "***.***.***-45", registered: "2025-04-19" },
  { id: 3, name: "Psic. André Lima", specialty: "Psicologia de Crise", status: "aprovado", region: "Campos do Jordão, SP", cpf: "***.***.***-78", registered: "2025-04-17" },
  { id: 4, name: "Enf. Juliana Costa", specialty: "Enfermagem", status: "aprovado", region: "Taubaté, SP", cpf: "***.***.***-90", registered: "2025-04-15" },
];

const MOCK_COLLECTION_POINTS = [
  { id: 1, name: "Ginásio Municipal Taubaté", address: "Av. Central, 500", city: "Taubaté, SP", status: "pendente", capacity: 200, items: ["alimentos", "roupas"], lat: -23.025, lng: -45.555 },
  { id: 2, name: "Igreja São Francisco", address: "R. das Flores, 120", city: "Taubaté, SP", status: "validado", capacity: 80, items: ["medicamentos", "higiene"], lat: -23.031, lng: -45.561 },
  { id: 3, name: "Escola Estadual Anhanguera", address: "R. Anhanguera, 300", city: "São Paulo, SP", status: "pendente", capacity: 150, items: ["alimentos", "água"], lat: -23.558, lng: -46.634 },
];

// ─── Color + severity helpers ──────────────────────────────────────────────────
const severityColor = { critico: "#FF3B3B", alto: "#FF8C00", medio: "#F5C518", baixo: "#4CAF50" };
const severityBg = { critico: "rgba(255,59,59,0.12)", alto: "rgba(255,140,0,0.12)", medio: "rgba(245,197,24,0.12)", baixo: "rgba(76,175,80,0.12)" };
const typeIcon = { enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥" };
const riskColor = { critico: "#FF3B3B", alto: "#FF8C00", medio: "#F5C518" };

// ─── Styles ────────────────────────────────────────────────────────────────────
const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=JetBrains+Mono:wght@400;500&family=Inter:wght@300;400;500;600&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  :root {
    --bg-base: #0a0c10;
    --bg-surface: #111318;
    --bg-elevated: #181c23;
    --bg-hover: #1e2330;
    --border: rgba(255,255,255,0.07);
    --border-accent: rgba(255,140,0,0.35);
    --text-primary: #eef0f5;
    --text-secondary: #7a8099;
    --text-muted: #4a5068;
    --accent: #FF6B1A;
    --accent-glow: rgba(255,107,26,0.25);
    --accent2: #3B82F6;
    --accent2-glow: rgba(59,130,246,0.2);
    --success: #22c55e;
    --warning: #F5C518;
    --danger: #ef4444;
    --font-display: 'Syne', sans-serif;
    --font-body: 'Inter', sans-serif;
    --font-mono: 'JetBrains Mono', monospace;
    --radius: 10px;
    --radius-sm: 6px;
    --shadow: 0 4px 24px rgba(0,0,0,0.4);
    --shadow-accent: 0 0 30px rgba(255,107,26,0.15);
  }

  body { background: var(--bg-base); color: var(--text-primary); font-family: var(--font-body); }

  .app-shell { display: flex; min-height: 100vh; }

  /* ── Sidebar ── */
  .sidebar {
    width: 230px; min-width: 230px; background: var(--bg-surface);
    border-right: 1px solid var(--border);
    display: flex; flex-direction: column;
    position: fixed; top: 0; left: 0; height: 100vh; z-index: 100;
    transition: width 0.25s;
  }
  .sidebar-logo {
    padding: 22px 20px 18px;
    border-bottom: 1px solid var(--border);
    display: flex;
    align-items: center;
    gap: 10px;
    justify-content: center; /* ← adicionar */
  }
  .logo-mark {
    width: 34px; height: 34px; background: var(--accent);
    border-radius: 8px; display: flex; align-items: center; justify-content: center;
    font-size: 16px; flex-shrink: 0;
    box-shadow: 0 0 18px var(--accent-glow);
  }
  .logo-text { font-family: var(--font-display); font-weight: 800; font-size: 15px; line-height: 1.2; }
  .logo-sub { font-size: 10px; color: var(--text-muted); font-weight: 400; letter-spacing: 0.05em; text-transform: uppercase; }

  .sidebar-nav { flex: 1; padding: 14px 10px; overflow-y: auto; }
  .nav-section-label {
    font-size: 9.5px; font-weight: 600; letter-spacing: 0.12em; text-transform: uppercase;
    color: var(--text-muted); padding: 10px 10px 6px;
  }
  .nav-item {
    display: flex; align-items: center; gap: 10px; padding: 9px 10px;
    border-radius: var(--radius-sm); cursor: pointer; margin-bottom: 2px;
    transition: all 0.15s; color: var(--text-secondary); font-size: 13.5px; font-weight: 500;
    position: relative;
  }
  .nav-item:hover { background: var(--bg-hover); color: var(--text-primary); }
  .nav-item.active { background: rgba(255,107,26,0.12); color: var(--accent); }
  .nav-item.active::before {
    content: ''; position: absolute; left: 0; top: 20%; height: 60%; width: 3px;
    background: var(--accent); border-radius: 0 3px 3px 0;
  }
  .nav-icon { font-size: 15px; width: 20px; text-align: center; flex-shrink: 0; }
  .nav-badge {
    margin-left: auto; font-size: 10px; font-weight: 600; font-family: var(--font-mono);
    background: var(--accent); color: #fff; padding: 1px 6px; border-radius: 99px;
    min-width: 18px; text-align: center;
  }
  .nav-badge.blue { background: var(--accent2); }

  .sidebar-footer {
    padding: 14px 10px; border-top: 1px solid var(--border);
    display: flex; align-items: center; gap: 10px;
  }
  .avatar { width: 32px; height: 32px; border-radius: 50%; background: linear-gradient(135deg, #FF6B1A, #FF3B3B); display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .avatar-info { flex: 1; overflow: hidden; }
  .avatar-name { font-size: 12.5px; font-weight: 600; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  .avatar-role { font-size: 10px; color: var(--accent); font-family: var(--font-mono); }

  /* ── Main ── */
  .main { margin-left: 230px; flex: 1; display: flex; flex-direction: column; min-height: 100vh; }

  .topbar {
    height: 56px; background: var(--bg-surface); border-bottom: 1px solid var(--border);
    display: flex; align-items: center; padding: 0 24px; gap: 16px;
    position: sticky; top: 0; z-index: 50;
  }
  .topbar-title { font-family: var(--font-display); font-weight: 700; font-size: 17px; }
  .topbar-breadcrumb { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }
  .topbar-spacer { flex: 1; }
  .topbar-status {
    display: flex; align-items: center; gap: 6px; font-size: 11.5px; color: var(--text-secondary);
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: 99px;
    padding: 4px 12px;
  }
  .status-dot { width: 7px; height: 7px; border-radius: 50%; background: var(--success); animation: pulse 2s infinite; }
  @keyframes pulse { 0%,100%{opacity:1;} 50%{opacity:0.4;} }
  .topbar-btn {
    width: 34px; height: 34px; border-radius: var(--radius-sm); border: 1px solid var(--border);
    background: var(--bg-elevated); cursor: pointer; display: flex; align-items: center; justify-content: center;
    font-size: 15px; transition: all 0.15s; color: var(--text-secondary);
  }
  .topbar-btn:hover { border-color: var(--accent); color: var(--accent); background: var(--accent-glow); }

  .content { padding: 24px; flex: 1; }

  /* ── Cards ── */
  .card {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px; transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.13); }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-family: var(--font-display); font-weight: 700; font-size: 14px; }
  .card-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

  /* ── KPI Grid ── */
  .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 22px; }
  .kpi-card {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 18px 20px; position: relative; overflow: hidden; transition: all 0.2s;
  }
  .kpi-card:hover { border-color: var(--border-accent); transform: translateY(-1px); box-shadow: var(--shadow-accent); }
  .kpi-accent-bar { position: absolute; top: 0; left: 0; right: 0; height: 2px; }
  .kpi-label { font-size: 11px; color: var(--text-secondary); font-weight: 500; margin-bottom: 8px; text-transform: uppercase; letter-spacing: 0.06em; }
  .kpi-value { font-family: 'DIN Alternate', 'Oswald', monospace; font-size: 32px; font-weight: 800; line-height: 1; }
  .kpi-delta { font-size: 11px; margin-top: 6px; font-family: var(--font-mono); }
  .kpi-delta.up { color: var(--danger); }
  .kpi-delta.ok { color: var(--success); }
  .kpi-icon { position: absolute; right: 16px; top: 16px; font-size: 22px; opacity: 0.2; }

  /* ── Grid layouts ── */
  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .grid-6040 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }

  /* ── Table ── */
  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th { text-align: left; padding: 8px 12px; color: var(--text-muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; border-bottom: 1px solid var(--border); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  tbody tr:hover td { background: var(--bg-hover); }
  tbody tr:last-child td { border-bottom: none; }

  /* ── Badges ── */
  .badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
    border-radius: 99px; font-size: 10.5px; font-weight: 600; white-space: nowrap; font-family: var(--font-mono);
  }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

  /* ── Buttons ── */
  .btn {
    padding: 7px 14px; border-radius: var(--radius-sm); border: none; cursor: pointer;
    font-size: 12px; font-weight: 600; font-family: var(--font-body); transition: all 0.15s;
    display: inline-flex; align-items: center; gap: 5px; white-space: nowrap;
  }
  .btn-primary { background: var(--accent); color: #fff; }
  .btn-primary:hover { background: #ff7d33; box-shadow: 0 0 16px var(--accent-glow); }
  .btn-secondary { background: var(--bg-elevated); color: var(--text-primary); border: 1px solid var(--border); }
  .btn-secondary:hover { border-color: var(--accent); color: var(--accent); }
  .btn-success { background: rgba(34,197,94,0.15); color: var(--success); border: 1px solid rgba(34,197,94,0.3); }
  .btn-success:hover { background: rgba(34,197,94,0.25); }
  .btn-danger { background: rgba(239,68,68,0.12); color: #ef4444; border: 1px solid rgba(239,68,68,0.3); }
  .btn-danger:hover { background: rgba(239,68,68,0.22); }
  .btn-sm { padding: 4px 10px; font-size: 11px; }
  .btn-icon { width: 28px; height: 28px; padding: 0; border-radius: var(--radius-sm); }
  .btn-group { display: flex; gap: 6px; flex-wrap: wrap; }

  /* ── Map ── */
  #admin-map { width: 100%; height: 320px; border-radius: var(--radius-sm); overflow: hidden; background: #0d1117; }
  .leaflet-container { background: #0d1117 !important; font-family: var(--font-body) !important; }
  .leaflet-tile { filter: brightness(0.75) saturate(0.7) hue-rotate(180deg) !important; }

  /* ── Modal ── */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 1000;
    display: flex; align-items: center; justify-content: center; padding: 20px;
    animation: fadeIn 0.15s;
  }
  @keyframes fadeIn { from { opacity: 0; } }
  .modal {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: 14px;
    width: 100%; max-width: 560px; max-height: 90vh; overflow-y: auto;
    animation: slideUp 0.2s;
    box-shadow: 0 24px 80px rgba(0,0,0,0.6);
  }
  @keyframes slideUp { from { transform: translateY(20px); opacity: 0; } }
  .modal-header { padding: 20px 24px 14px; border-bottom: 1px solid var(--border); display: flex; align-items: center; justify-content: space-between; }
  .modal-title { font-family: var(--font-display); font-weight: 700; font-size: 16px; }
  .modal-body { padding: 20px 24px; display: flex; flex-direction: column; gap: 14px; }
  .modal-footer { padding: 14px 24px 20px; display: flex; gap: 10px; justify-content: flex-end; border-top: 1px solid var(--border); }
  .modal-close { width: 28px; height: 28px; border-radius: 50%; border: 1px solid var(--border); background: none; cursor: pointer; color: var(--text-secondary); font-size: 16px; display: flex; align-items: center; justify-content: center; transition: all 0.15s; }
  .modal-close:hover { color: var(--text-primary); background: var(--bg-elevated); }

  /* ── Form ── */
  .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
  .form-group { display: flex; flex-direction: column; gap: 5px; }
  .form-label { font-size: 11px; color: var(--text-secondary); font-weight: 600; text-transform: uppercase; letter-spacing: 0.06em; }
  .form-input, .form-select, .form-textarea {
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 8px 12px; color: var(--text-primary); font-size: 13px; font-family: var(--font-body);
    transition: border-color 0.15s; width: 100%;
  }
  .form-input:focus, .form-select:focus, .form-textarea:focus { outline: none; border-color: var(--accent); }
  .form-textarea { resize: vertical; min-height: 80px; }
  .form-select { appearance: none; cursor: pointer; }

  /* ── Tabs ── */
  .tabs { display: flex; gap: 2px; background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 3px; margin-bottom: 18px; }
  .tab { padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600; transition: all 0.15s; color: var(--text-secondary); white-space: nowrap; }
  .tab.active { background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .tab:hover:not(.active) { color: var(--text-primary); }

  /* ── Filters ── */
  .filter-row { display: flex; gap: 10px; align-items: center; margin-bottom: 14px; flex-wrap: wrap; }
  .filter-chip {
    padding: 5px 12px; border-radius: 99px; font-size: 11.5px; font-weight: 600; cursor: pointer;
    border: 1px solid var(--border); background: var(--bg-elevated); color: var(--text-secondary); transition: all 0.15s;
  }
  .filter-chip.active { border-color: var(--accent); color: var(--accent); background: rgba(255,107,26,0.1); }
  .search-input {
    background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-sm);
    padding: 6px 12px; color: var(--text-primary); font-size: 12.5px; font-family: var(--font-body);
    width: 200px; transition: border-color 0.15s;
  }
  .search-input:focus { outline: none; border-color: var(--accent); }
  .search-input::placeholder { color: var(--text-muted); }

  /* ── Alert strip ── */
  .alert-strip {
    background: rgba(255,59,59,0.08); border: 1px solid rgba(255,59,59,0.3); border-radius: var(--radius-sm);
    padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; font-size: 12.5px;
  }
  .alert-icon { font-size: 16px; flex-shrink: 0; }

  /* ── Empty state ── */
  .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); }
  .empty-state-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.4; }
  .empty-state-text { font-size: 13px; }

  /* ── Scrollbar ── */
  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  /* ── Section spacing ── */
  .section-gap { margin-bottom: 22px; }

  /* ── Volunteer card ── */
  .volunteer-row { display: flex; align-items: center; gap: 12px; padding: 10px 0; border-bottom: 1px solid rgba(255,255,255,0.04); }
  .volunteer-row:last-child { border-bottom: none; }
  .vol-avatar { width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0; }
  .vol-info { flex: 1; }
  .vol-name { font-size: 13px; font-weight: 600; }
  .vol-spec { font-size: 11px; color: var(--text-secondary); }
  .vol-region { font-size: 11px; color: var(--text-muted); font-family: var(--font-mono); }

  .mono { font-family: var(--font-mono); }
  .text-muted { color: var(--text-muted); }
  .text-secondary { color: var(--text-secondary); }
  .text-sm { font-size: 11.5px; }
  .mt-8 { margin-top: 8px; }
  .mb-4 { margin-bottom: 4px; }
`;

// ─── Badge component ────────────────────────────────────────────────────────────
function Badge({ color, bg, label, dot = true }) {
  return (
    <span className="badge" style={{ background: bg || "rgba(255,255,255,0.07)", color: color || "var(--text-secondary)" }}>
      {dot && <span className="badge-dot" style={{ background: color }} />}
      {label}
    </span>
  );
}

function severityBadge(s) {
  const labels = { critico: "Crítico", alto: "Alto", medio: "Médio", baixo: "Baixo" };
  return <Badge color={severityColor[s]} bg={severityBg[s]} label={labels[s]} />;
}

function statusBadge(s) {
  const map = {
    ativo: { color: "#ef4444", bg: "rgba(239,68,68,0.1)", label: "Ativo" },
    monitoramento: { color: "#F5C518", bg: "rgba(245,197,24,0.1)", label: "Monitoramento" },
    controlado: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Controlado" },
    pendente: { color: "#F5C518", bg: "rgba(245,197,24,0.1)", label: "Pendente" },
    aprovado: { color: "#22c55e", bg: "rgba(34,197,94,0.1)", label: "Aprovado" },
    validado: { color: "#3B82F6", bg: "rgba(59,130,246,0.1)", label: "Validado" },
  };
  const m = map[s] || { color: "var(--text-muted)", bg: "rgba(255,255,255,0.06)", label: s };
  return <Badge color={m.color} bg={m.bg} label={m.label} />;
}

// ─── Map component ──────────────────────────────────────────────────────────────
function MapView({ events, criticalPoints, collectionPoints }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    const init = () => {
      if (!window.L || !mapRef.current) return;
      if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

      const map = window.L.map(mapRef.current, { center: [-23.18, -45.88], zoom: 8, zoomControl: false });
      instanceRef.current = map;

      window.L.control.zoom({ position: "bottomright" }).addTo(map);

      window.L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 18,
      }).addTo(map);

      events.forEach(e => {
        const color = severityColor[e.severity] || "#FF6B1A";
        const icon = window.L.divIcon({
          html: `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 12px ${color}55">${typeIcon[e.type] || "⚠️"}</div>`,
          className: "", iconSize: [28, 28], iconAnchor: [14, 14],
        });
        window.L.marker([e.lat, e.lng], { icon }).addTo(map)
          .bindPopup(`<b>${e.title}</b><br/>${e.city}<br/>Vítimas: ${e.victims}`);
      });

      criticalPoints.forEach(p => {
        const color = riskColor[p.risk] || "#FF8C00";
        const icon = window.L.divIcon({
          html: `<div style="width:22px;height:22px;transform:rotate(45deg);background:${color};border:2px solid rgba(255,255,255,0.25);box-shadow:0 0 10px ${color}44"></div>`,
          className: "", iconSize: [22, 22], iconAnchor: [11, 11],
        });
        window.L.marker([p.lat, p.lng], { icon }).addTo(map)
          .bindPopup(`<b>⚠️ ${p.name}</b><br/>${p.description}`);
      });

      collectionPoints.forEach(p => {
        const icon = window.L.divIcon({
          html: `<div style="width:22px;height:22px;border-radius:4px;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 0 8px #3B82F655">📦</div>`,
          className: "", iconSize: [22, 22], iconAnchor: [11, 11],
        });
        window.L.marker([p.lat, p.lng], { icon }).addTo(map)
          .bindPopup(`<b>📦 ${p.name}</b><br/>${p.address}`);
      });
    };

    if (window.L) { init(); }
    else {
      const interval = setInterval(() => { if (window.L) { clearInterval(interval); init(); } }, 200);
      return () => clearInterval(interval);
    }
    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [events, criticalPoints, collectionPoints]);

  return <div id="admin-map" ref={mapRef} />;
}

const SEVERITY_OPTIONS = [
  { value: "critico", label: "Crítico", color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  { value: "alto",    label: "Alto",    color: "#FF8C00", bg: "rgba(255,140,0,0.12)"  },
  { value: "medio",   label: "Médio",   color: "#F5C518", bg: "rgba(245,197,24,0.12)" },
  { value: "baixo",   label: "Baixo",   color: "#4CAF50", bg: "rgba(76,175,80,0.12)"  },
];

export function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState({
    title: "",
    type: "enchente",
    severity: "medio",
    city: "",
    address: "",
    lat: "",
    lng: "",
    description: "",
    status: "ativo",
    photos: [],
    criticalPointId: null,
    nearbyCollectionIds: [],
    volunteerIds: [],
    ...event,
  });

  const [geoStatus, setGeoStatus] = useState(null); // null | "buscando" | "ok" | "erro"

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function geocodificar() {
    if (!form.address.trim()) return;
    setGeoStatus("buscando");
    try {
      const query = encodeURIComponent(form.address);
      const res   = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      if (data.length === 0) { setGeoStatus("erro"); return; }
      const { lat, lon, display_name } = data[0];
      setForm(f => ({
        ...f,
        lat: parseFloat(lat).toFixed(6),
        lng: parseFloat(lon).toFixed(6),
        // Preenche cidade se estiver vazia
        city: f.city || display_name.split(",").slice(-3, -1).join(",").trim(),
      }));
      setGeoStatus("ok");
    } catch {
      setGeoStatus("erro");
    }
  }

  const canSave = form.title.trim() && form.lat && form.lng;

  return (
    <div
      className="modal-overlay"
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{event ? "Editar Evento" : "Cadastrar Novo Evento"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">

          {/* Título */}
          <div className="form-group">
            <label className="form-label">Título do Evento *</label>
            <input
              className="form-input"
              value={form.title}
              onChange={e => set("title", e.target.value)}
              placeholder="Ex: Enchente Rio Paraíba"
            />
          </div>

          {/* Tipo + Status */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="enchente">🌊 Enchente</option>
                <option value="deslizamento">⛰️ Deslizamento</option>
                <option value="alagamento">💧 Alagamento</option>
                <option value="incendio">🔥 Incêndio</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="monitoramento">Monitoramento</option>
                <option value="controlado">Controlado</option>
              </select>
            </div>
          </div>

          {/* Severidade — seletor visual */}
          <div className="form-group">
            <label className="form-label">Severidade *</label>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 8 }}>
              {SEVERITY_OPTIONS.map(opt => (
                <div
                  key={opt.value}
                  onClick={() => set("severity", opt.value)}
                  style={{
                    padding: "8px 0",
                    borderRadius: 8,
                    border: `2px solid ${form.severity === opt.value ? opt.color : "var(--border)"}`,
                    background: form.severity === opt.value ? opt.bg : "var(--bg-elevated)",
                    color: form.severity === opt.value ? opt.color : "var(--text-muted)",
                    textAlign: "center",
                    fontSize: 12,
                    fontWeight: 700,
                    cursor: "pointer",
                    transition: "all 0.15s",
                    userSelect: "none",
                  }}
                >
                  <div style={{ fontSize: 16, marginBottom: 2 }}>
                    {opt.value === "critico" ? "🔴" : opt.value === "alto" ? "🟠" : opt.value === "medio" ? "🟡" : "🟢"}
                  </div>
                  {opt.label}
                </div>
              ))}
            </div>
          </div>

          {/* Cidade */}
          <div className="form-group">
            <label className="form-label">Cidade / UF</label>
            <input
              className="form-input"
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="Ex: Taubaté, SP"
            />
          </div>

          {/* Endereço + botão geocodificar */}
          <div className="form-group">
            <label className="form-label">Endereço *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                value={form.address}
                onChange={e => { set("address", e.target.value); setGeoStatus(null); }}
                placeholder="Ex: Av. Charles Schnneider"
                onKeyDown={e => e.key === "Enter" && geocodificar()}
              />
              <button
                className="btn btn-secondary"
                onClick={geocodificar}
                disabled={geoStatus === "buscando" || !form.address.trim()}
                style={{ flexShrink: 0, opacity: !form.address.trim() ? 0.4 : 1 }}
              >
                {geoStatus === "buscando" ? "📡…" : "📍 Geocodificar"}
              </button>
            </div>

            {/* Feedback geocodificação */}
            {geoStatus === "ok" && (
              <div style={{ fontSize: 11, color: "var(--success)", marginTop: 5 }}>
                ✓ Coordenadas obtidas com sucesso via OpenStreetMap
              </div>
            )}
            {geoStatus === "erro" && (
              <div style={{ fontSize: 11, color: "var(--danger)", marginTop: 5 }}>
                ✗ Endereço não encontrado — tente ser mais específico ou insira as coordenadas manualmente
              </div>
            )}
            {geoStatus === null && (
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>
                Digite o endereço completo e clique em Geocodificar para obter as coordenadas automaticamente.
              </div>
            )}
          </div>

          {/* Lat / Lng — somente leitura */}
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input
                className="form-input mono"
                value={form.lat}
                readOnly
                placeholder="— preenchido automaticamente —"
                style={{ color: form.lat ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }}
              />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input
                className="form-input mono"
                value={form.lng}
                readOnly
                placeholder="— preenchido automaticamente —"
                style={{ color: form.lng ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }}
              />
            </div>
          </div>

          {/* Descrição */}
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea
              className="form-textarea"
              value={form.description}
              onChange={e => set("description", e.target.value)}
              placeholder="Detalhes sobre o evento..."
            />
          </div>

        </div>

        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.4 }}
            onClick={() => { onSave(form); onClose(); }}
          >
            💾 Salvar Evento
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Cadastrar Ponto Crítico ────────────────────────────────────────────
function CriticalPointModal({ point, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    type: "geologico",
    risk: "alto",
    address: "",
    lat: "",
    lng: "",
    description: "",
    ...point,
  });
  const [geoStatus, setGeoStatus] = useState(null);
  const [detailPoint, setDetailPoint] = useState(null);
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));

  async function geocodificar() {
    if (!form.address.trim()) return;
    setGeoStatus("buscando");
    try {
      const query = encodeURIComponent(form.address);
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${query}&format=json&limit=1`,
        { headers: { "Accept-Language": "pt-BR" } }
      );
      const data = await res.json();
      if (data.length === 0) { setGeoStatus("erro"); return; }
      const { lat, lon } = data[0];
      setForm(f => ({
        ...f,
        lat: parseFloat(lat).toFixed(6),
        lng: parseFloat(lon).toFixed(6),
      }));
      setGeoStatus("ok");
    } catch {
      setGeoStatus("erro");
    }
  }

  const canSave = form.name.trim() && form.lat && form.lng;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{point ? "Editar Ponto Crítico" : "Cadastrar Ponto Crítico"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">

          <div className="form-group">
            <label className="form-label">Nome do Ponto *</label>
            <input className="form-input" value={form.name} onChange={e => set("name", e.target.value)} placeholder="Ex: Encosta Bairro Norte" />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Tipo de Risco</label>
              <select className="form-select" value={form.type} onChange={e => set("type", e.target.value)}>
                <option value="geologico">Geológico</option>
                <option value="hidrologico">Hidrológico</option>
                <option value="infraestrutura">Infraestrutura</option>
                <option value="quimico">Químico</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Nível de Risco</label>
              <select className="form-select" value={form.risk} onChange={e => set("risk", e.target.value)}>
                <option value="critico">Crítico</option>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Cidade / UF</label>
            <input
              className="form-input"
              value={form.city}
              onChange={e => set("city", e.target.value)}
              placeholder="Ex: Taubaté, SP"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Endereço *</label>
            <div style={{ display: "flex", gap: 8 }}>
              <input
                className="form-input"
                style={{ flex: 1 }}
                value={form.address}
                onChange={e => { set("address", e.target.value); setGeoStatus(null); }}
                placeholder="Ex: Encosta Norte"
                onKeyDown={e => e.key === "Enter" && geocodificar()}
              />
              <button
                className="btn btn-secondary"
                onClick={geocodificar}
                disabled={geoStatus === "buscando" || !form.address.trim()}
                style={{ flexShrink: 0, opacity: !form.address.trim() ? 0.4 : 1 }}
              >
                {geoStatus === "buscando" ? "📡…" : "📍 Geocodificar"}
              </button>
            </div>
            {geoStatus === "ok"   && <div style={{ fontSize: 11, color: "var(--success)",   marginTop: 5 }}>✓ Coordenadas obtidas com sucesso</div>}
            {geoStatus === "erro" && <div style={{ fontSize: 11, color: "var(--danger)",    marginTop: 5 }}>✗ Endereço não encontrado — tente ser mais específico</div>}
            {geoStatus === null   && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 5 }}>Digite o endereço e clique em Geocodificar.</div>}
          </div>

          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input mono" value={form.lat} readOnly placeholder="— preenchido automaticamente —"
                style={{ color: form.lat ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }} />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input mono" value={form.lng} readOnly placeholder="— preenchido automaticamente —"
                style={{ color: form.lng ? "var(--accent2)" : "var(--text-muted)", cursor: "default", opacity: 0.8 }} />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Descrição / Observações</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detalhes sobre o risco..." />
          </div>

        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button
            className="btn btn-primary"
            disabled={!canSave}
            style={{ opacity: canSave ? 1 : 0.4 }}
            onClick={() => { onSave(form); onClose(); }}
          >
            💾 Salvar
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Sections ──────────────────────────────────────────────────────────────────
function OverviewSection({ events, criticalPoints, volunteers, collectionPoints, onNewEvent, onNewPoint }) {
  const activeEvents = events.filter(e => e.status === "ativo").length;
  const pendingVols = volunteers.filter(v => v.status === "pendente").length;
  const pendingCols = collectionPoints.filter(p => p.status === "pendente").length;
  const totalVictims = events.reduce((s, e) => s + e.victims, 0);

  return (
    <>
      {(pendingVols > 0 || pendingCols > 0) && (
        <div className="alert-strip">
          <span className="alert-icon">🔴</span>
          <span>
            <b>Atenção:</b> {pendingVols > 0 && <><b>{pendingVols}</b> voluntário(s) aguardando aprovação. </>}
            {pendingCols > 0 && <><b>{pendingCols}</b> ponto(s) de coleta aguardando validação.</>}
          </span>
        </div>
      )}

      <div className="kpi-grid">
        {[
          { label: "Eventos Ativos", value: activeEvents, icon: "🌊", color: "#ef4444", delta: "+2 hoje", deltaClass: "up" },
          { label: "Vítimas Afetadas", value: totalVictims.toLocaleString("pt-BR"), icon: "👥", color: "#F5C518", delta: "3 eventos registrados", deltaClass: "ok" },
          { label: "Voluntários Ativos", value: volunteers.filter(v => v.status === "aprovado").length, icon: "🙋", color: "#22c55e", delta: `${pendingVols} pendentes`, deltaClass: pendingVols > 0 ? "up" : "ok" },
          { label: "Pontos de Coleta", value: collectionPoints.filter(p => p.status === "validado").length, icon: "📦", color: "#3B82F6", delta: `${pendingCols} para validar`, deltaClass: pendingCols > 0 ? "up" : "ok" },
        ].map((k, i) => (
          <div className="kpi-card" key={i}>
            <div className="kpi-accent-bar" style={{ background: k.color }} />
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-label">{k.label}</div>
            <div className="kpi-value" style={{ color: k.color }}>{k.value}</div>
            <div className={`kpi-delta ${k.deltaClass}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      <div className="grid-6040 section-gap">
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Mapa Operacional</div>
              <div className="card-subtitle">Eventos, pontos críticos e coleta — Leaflet + PostGIS</div>
            </div>
            <div className="btn-group">
              <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Evento</button>
              <button className="btn btn-secondary btn-sm" onClick={onNewPoint}>＋ Ponto Crítico</button>
            </div>
          </div>
          <MapView events={events} criticalPoints={criticalPoints} collectionPoints={collectionPoints} />
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
            <span>🌊 Evento</span><span>◆ Ponto Crítico</span><span>📦 Coleta</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚡ Eventos Recentes</div></div>
            <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Adicionar</button>
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {events.map(e => (
              <div key={e.id} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "12px 14px", border: "1px solid var(--border)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 16 }}>{typeIcon[e.type]}</span>
                  <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                  {severityBadge(e.severity)}
                </div>
                <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", alignItems: "center" }}>
                  <span>📍 {e.city}</span>
                  <span>👥 {e.victims} vítimas</span>
                  <span>🙋 {e.volunteers} vol.</span>
                  <span style={{ marginLeft: "auto" }}>{statusBadge(e.status)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚠️ Pontos Críticos</div><div className="card-subtitle">{criticalPoints.length} registrados</div></div>
            <button className="btn btn-secondary btn-sm" onClick={onNewPoint}>＋ Adicionar</button>
          </div>
          <div className="table-wrap">
            <table>
              <thead><tr><th>Local</th><th>Tipo</th><th>Risco</th></tr></thead>
              <tbody>
                {criticalPoints.map(p => (
                  <tr key={p.id}>
                    <td><div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name}</div><div className="text-muted text-sm">{p.description.slice(0, 45)}…</div></td>
                    <td><span style={{ fontSize: 11.5, color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.type}</span></td>
                    <td>{severityBadge(p.risk)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">🙋 Voluntários Pendentes</div><div className="card-subtitle">Aguardando aprovação</div></div>
          </div>
          {volunteers.filter(v => v.status === "pendente").length === 0
            ? <div className="empty-state"><div className="empty-state-icon">✅</div><div className="empty-state-text">Nenhum pendente</div></div>
            : volunteers.filter(v => v.status === "pendente").map(v => (
              <div className="volunteer-row" key={v.id}>
                <div className="vol-avatar" style={{ background: "linear-gradient(135deg,#FF6B1A,#FF3B3B)" }}>{v.name[0]}</div>
                <div className="vol-info">
                  <div className="vol-name">{v.name}</div>
                  <div className="vol-spec">{v.specialty}</div>
                  <div className="vol-region">📍 {v.region}</div>
                </div>
                <div className="btn-group">
                  <button className="btn btn-success btn-sm">✓</button>
                  <button className="btn btn-danger btn-sm">✕</button>
                </div>
              </div>
            ))}
        </div>
      </div>
    </>
  );
}

// ─── Mini-mapa do drawer ──────────────────────────────────────────────────────
function EventDetailMap({ event }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }

    const L = window.L;
    const map = L.map(mapRef.current, {
      center: [event.lat, event.lng],
      zoom: 13,
      zoomControl: true,
    });
    instanceRef.current = map;

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);

    // Marker principal do evento
    const color = severityColor[event.severity] || "#FF6B1A";
    const eventIcon = L.divIcon({
      className: "",
      html: `<div style="
        width:34px;height:34px;border-radius:50%;
        background:${color};border:3px solid rgba(255,255,255,0.4);
        display:flex;align-items:center;justify-content:center;
        font-size:16px;box-shadow:0 0 16px ${color}88;
      ">${typeIcon[event.type] || "⚠️"}</div>`,
      iconSize: [34, 34], iconAnchor: [17, 17],
    });
    L.marker([event.lat, event.lng], { icon: eventIcon })
      .addTo(map)
      .bindPopup(`<b>${event.title}</b><br/>${event.city}`)
      .openPopup();

    // Pontos de coleta próximos
    (event.nearbyCollectionIds || []).forEach(cid => {
      const cp = MOCK_COLLECTION_POINTS.find(p => p.id === cid);
      if (!cp) return;
      const cpIcon = L.divIcon({
        className: "",
        html: `<div style="width:22px;height:22px;border-radius:4px;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;">📦</div>`,
        iconSize: [22, 22], iconAnchor: [11, 11],
      });
      L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(map)
        .bindPopup(`<b>📦 ${cp.name}</b><br/>${cp.address}`);
    });

    // Ponto crítico vinculado
    if (event.criticalPointId) {
      const cp = MOCK_CRITICAL_POINTS.find(p => p.id === event.criticalPointId);
      if (cp) {
        const cpIcon = L.divIcon({
          className: "",
          html: `<div style="width:22px;height:22px;transform:rotate(45deg);background:#FF3B3B;border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 10px #FF3B3B44;"></div>`,
          iconSize: [22, 22], iconAnchor: [11, 11],
        });
        L.marker([cp.lat, cp.lng], { icon: cpIcon }).addTo(map)
          .bindPopup(`<b>⚠️ ${cp.name}</b><br/>${cp.description}`);
      }
    }

    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [event]);

  return (
    <div style={{ borderRadius: 8, overflow: "hidden", height: 300 }}>
      <div ref={mapRef} style={{ height: "100%", width: "100%" }} />
    </div>
  );
}

// ─── Drawer de detalhes do evento ─────────────────────────────────────────────
function EventDetailDrawer({ event, onClose, onEdit }) {
  const [tab, setTab] = useState("mapa");

  const nearbyPoints    = (event.nearbyCollectionIds || []).map(id => MOCK_COLLECTION_POINTS.find(p => p.id === id)).filter(p => p && p.status === "validado");
  const activeVolunteers = (event.volunteerIds || []).map(id => MOCK_VOLUNTEERS.find(v => v.id === id)).filter(v => v && v.status === "aprovado");
  const linkedCritical  = event.criticalPointId ? MOCK_CRITICAL_POINTS.find(p => p.id === event.criticalPointId) : null;

  const tabs = [
    { id: "mapa",      label: "🗺️ Mapa" },
    { id: "fotos",     label: `📷 Fotos${event.photos?.length ? ` (${event.photos.length})` : ""}` },
    { id: "coleta",    label: `📦 Coleta (${nearbyPoints.length})` },
    { id: "voluntarios", label: `🙋 Voluntários (${activeVolunteers.length})` },
  ];

  return (
    <div
      style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", justifyContent: "flex-end" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{
        width: 580, maxWidth: "95vw", height: "100vh", overflowY: "auto",
        background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
        display: "flex", flexDirection: "column",
        animation: "slideInRight 0.22s ease",
      }}>

        {/* Header do drawer */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6, flexWrap: "wrap" }}>
                <span style={{ fontSize: 22 }}>{typeIcon[event.type] || "⚠️"}</span>
                <span style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17 }}>{event.title}</span>
                {linkedCritical && (
                  <span style={{
                    background: "rgba(255,59,59,0.15)", color: "#FF3B3B",
                    border: "1px solid rgba(255,59,59,0.3)", borderRadius: "99px",
                    fontSize: 10, padding: "2px 8px", fontWeight: 700, fontFamily: "var(--font-mono)",
                  }}>⚠️ PONTO CRÍTICO</span>
                )}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {severityBadge(event.severity)}
                {statusBadge(event.status)}
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {event.city}</span>
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📅 {event.date}</span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={onEdit}>✏️ Editar</button>
              <button
                onClick={onClose}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
          </div>

          {/* KPIs rápidos */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 10, marginTop: 14 }}>
            {[
              { label: "Vítimas", value: event.victims, color: "var(--warning)" },
              { label: "Voluntários", value: activeVolunteers.length || event.volunteers, color: "var(--success)" },
              { label: "Pontos de Coleta", value: nearbyPoints.length, color: "var(--accent2)" },
            ].map((k, i) => (
              <div key={i} style={{ background: "var(--bg-elevated)", borderRadius: 8, padding: "10px 14px", border: "1px solid var(--border)" }}>
                <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{k.label}</div>
                <div style={{ fontFamily: "var(--font-display)", fontSize: 22, fontWeight: 800, color: k.color }}>{k.value}</div>
              </div>
            ))}
          </div>

          {/* Ponto crítico vinculado */}
          {linkedCritical && (
            <div style={{
              marginTop: 12, background: "rgba(255,59,59,0.07)", border: "1px solid rgba(255,59,59,0.25)",
              borderRadius: 8, padding: "10px 14px", display: "flex", gap: 10, alignItems: "flex-start",
            }}>
              <span style={{ fontSize: 18, flexShrink: 0 }}>⚠️</span>
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#FF3B3B", marginBottom: 2 }}>{linkedCritical.name}</div>
                <div style={{ fontSize: 11, color: "var(--text-muted)" }}>{linkedCritical.description}</div>
              </div>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div style={{ padding: "14px 24px 0", flexShrink: 0, borderBottom: "1px solid var(--border)" }}>
          <div style={{ display: "flex", gap: 2 }}>
            {tabs.map(t => (
              <div
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  padding: "7px 14px", borderRadius: "6px 6px 0 0", cursor: "pointer",
                  fontSize: 12.5, fontWeight: 600, transition: "all 0.15s",
                  color: tab === t.id ? "var(--text-primary)" : "var(--text-secondary)",
                  background: tab === t.id ? "var(--bg-elevated)" : "transparent",
                  borderBottom: tab === t.id ? "2px solid var(--accent)" : "2px solid transparent",
                }}
              >{t.label}</div>
            ))}
          </div>
        </div>

        {/* Conteúdo das abas */}
        <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>

          {/* Aba: Mapa */}
          {tab === "mapa" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <EventDetailMap event={event} />
              {event.description && (
                <div style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
                    Descrição
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {event.description}
                  </div>
                </div>
              )}
              <div style={{ display: "flex", gap: 14, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap" }}>
                <span>{typeIcon[event.type]} Evento</span>
                {nearbyPoints.length > 0 && <span>📦 Pontos de coleta</span>}
                {linkedCritical && <span>◆ Ponto crítico</span>}
              </div>
            </div>
          )}

          {/* Aba: Fotos */}
          {tab === "fotos" && (
            <div>
              {!event.photos || event.photos.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📷</div>
                  <div className="empty-state-text">Nenhuma foto registrada para este evento</div>
                </div>
              ) : (
                <div style={{ display: "grid", gridTemplateColumns: "repeat(2, 1fr)", gap: 10 }}>
                  {event.photos.map((url, i) => (
                    <div key={i} style={{ borderRadius: 8, overflow: "hidden", border: "1px solid var(--border)", aspectRatio: "16/9", background: "var(--bg-elevated)" }}>
                      <img
                        src={url}
                        alt={`Foto ${i + 1} — ${event.title}`}
                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        onError={e => { e.target.style.display = "none"; }}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Aba: Pontos de Coleta */}
          {tab === "coleta" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {nearbyPoints.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">Nenhum ponto de coleta vinculado</div>
                </div>
              ) : nearbyPoints.map(p => (
                <div key={p.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 4 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 8 }}>📍 {p.address}, {p.city}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {p.items.map(item => (
                      <span key={item} style={{
                        background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                        border: "1px solid rgba(59,130,246,0.2)", borderRadius: "99px",
                        fontSize: 10, padding: "2px 8px", fontWeight: 600,
                      }}>{item}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--accent2)" }}>{p.capacity} itens</span>
                    {statusBadge(p.status)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Aba: Voluntários */}
          {tab === "voluntarios" && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {activeVolunteers.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">🙋</div>
                  <div className="empty-state-text">Nenhum voluntário vinculado a este evento</div>
                </div>
              ) : activeVolunteers.map((v, i) => {
                const colors = [
                  "linear-gradient(135deg,#FF6B1A,#FF3B3B)",
                  "linear-gradient(135deg,#3B82F6,#8B5CF6)",
                  "linear-gradient(135deg,#22c55e,#16a34a)",
                  "linear-gradient(135deg,#F5C518,#FF8C00)",
                ];
                return (
                  <div key={v.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px", display: "flex", alignItems: "center", gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: "50%", background: colors[i % colors.length], display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, fontSize: 14, flexShrink: 0 }}>
                      {v.name[0]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 600, fontSize: 13 }}>{v.name}</div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v.specialty}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {v.region}</div>
                    </div>
                    {statusBadge(v.status)}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes slideInRight {
          from { transform: translateX(40px); opacity: 0; }
          to   { transform: translateX(0);    opacity: 1; }
        }
      `}</style>
    </div>
  );
}

// ─── EventsSection atualizada ─────────────────────────────────────────────────
export function EventsSection({ events, setEvents, criticalPoints }) {
  const [filter, setFilter]       = useState("todos");
  const [search, setSearch]       = useState("");
  const [editEvent, setEditEvent] = useState(null);
  const [showNew, setShowNew]     = useState(false);
  const [detailEvent, setDetailEvent] = useState(null);

  // Ordena: eventos em ponto crítico primeiro, depois por severidade
  const severityOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 };
  const criticalIds   = new Set((criticalPoints || []).map(p => p.id));

  const filtered = events
    .filter(e => filter === "todos" || e.status === filter)
    .filter(e =>
      e.title.toLowerCase().includes(search.toLowerCase()) ||
      e.city.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const aIsCritical = a.criticalPointId && criticalIds.has(a.criticalPointId) ? 0 : 1;
      const bIsCritical = b.criticalPointId && criticalIds.has(b.criticalPointId) ? 0 : 1;
      if (aIsCritical !== bIsCritical) return aIsCritical - bIsCritical;
      return (severityOrder[a.severity] ?? 9) - (severityOrder[b.severity] ?? 9);
    });

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">📋 Gerenciar Eventos Oficiais</div>
            <div className="card-subtitle">RF01, RF02 — Cadastro e atualização de desastres · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Evento</button>
        </div>

        <div className="filter-row">
          {["todos", "ativo", "monitoramento", "controlado"].map(f => (
            <span key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
              {f.charAt(0).toUpperCase() + f.slice(1)}
            </span>
          ))}
          <input
            className="search-input"
            placeholder="🔍 Buscar evento..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Evento</th>
                <th>Tipo</th>
                <th>Severidade</th>
                <th>Status</th>
                <th>Vítimas</th>
                <th>Voluntários</th>
                <th>Data</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(e => {
                const isOnCritical = e.criticalPointId && criticalIds.has(e.criticalPointId);
                return (
                  <tr
                    key={e.id}
                    onClick={() => setDetailEvent(e)}
                    style={{ cursor: "pointer" }}
                    title="Clique para ver detalhes"
                  >
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {isOnCritical && (
                          <span title="Evento em ponto crítico" style={{ fontSize: 12, color: "#FF3B3B", flexShrink: 0 }}>⚠️</span>
                        )}
                        <div>
                          <div style={{ fontWeight: 600 }}>{e.title}</div>
                          <div className="text-muted text-sm mono">📍 {e.city}</div>
                        </div>
                      </div>
                    </td>
                    <td><span style={{ fontSize: 18 }}>{typeIcon[e.type]}</span></td>
                    <td>{severityBadge(e.severity)}</td>
                    <td>{statusBadge(e.status)}</td>
                    <td><span className="mono" style={{ color: "var(--warning)" }}>{e.victims}</span></td>
                    <td><span className="mono" style={{ color: "var(--success)" }}>{e.volunteers}</span></td>
                    <td><span className="mono text-secondary text-sm">{e.date}</span></td>
                    <td>
                      <div className="btn-group" onClick={ev => ev.stopPropagation()}>
                        <button
                          className="btn btn-secondary btn-sm btn-icon"
                          onClick={() => setEditEvent(e)}
                          title="Editar"
                        >✏️</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de detalhes */}
      {detailEvent && (
        <EventDetailDrawer
          event={detailEvent}
          onClose={() => setDetailEvent(null)}
          onEdit={() => { setEditEvent(detailEvent); setDetailEvent(null); }}
        />
      )}

      {/* Modal de cadastro/edição */}
      {(showNew || editEvent) && (
        <EventModal
          event={editEvent}
          onClose={() => { setShowNew(false); setEditEvent(null); }}
          onSave={form => {
            if (editEvent) setEvents(ev => ev.map(e => e.id === editEvent.id ? { ...e, ...form } : e));
            else setEvents(ev => [...ev, { ...form, id: Date.now(), victims: 0, volunteers: 0, date: new Date().toISOString().slice(0, 10) }]);
          }}
        />
      )}
    </>
  );
}

function CriticalPointMap({ point }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }
    const L = window.L;
    const map = L.map(mapRef.current, { center: [point.lat, point.lng], zoom: 15 });
    instanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);
    const color = riskColor[point.risk] || "#FF8C00";
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;transform:rotate(45deg);background:${color};border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 14px ${color}88;"></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    });
    L.marker([point.lat, point.lng], { icon }).addTo(map)
      .bindPopup(`<b>⚠️ ${point.name}</b><br/>${point.description || ""}`)
      .openPopup();
    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [point]);

  return <div ref={mapRef} style={{ height: 300, borderRadius: 8, overflow: "hidden" }} />;
}

function CriticalPointsSection({ criticalPoints, setCriticalPoints }) {
  const [editPoint, setEditPoint]     = useState(null);
  const [detailPoint, setDetailPoint] = useState(null);
  const [showNew, setShowNew]         = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">⚠️ Pontos Críticos</div>
            <div className="card-subtitle">RF14 — Áreas de alto risco cadastradas pelo administrador · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Ponto</button>
        </div>

        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>Nome</th><th>Tipo</th><th>Nível de Risco</th><th>Coordenadas</th><th>Observação</th><th>Ações</th></tr>
            </thead>
            <tbody>
              {criticalPoints.map(p => (
                <tr
                  key={p.id}
                  onClick={() => setDetailPoint(p)}
                  style={{ cursor: "pointer" }}
                >
                  <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                  <td><span style={{ textTransform: "capitalize", fontSize: 12, color: "var(--text-secondary)" }}>{p.type}</span></td>
                  <td>{severityBadge(p.risk)}</td>
                  <td><span className="mono text-sm text-muted">{p.lat}, {p.lng}</span></td>
                  <td><span className="text-sm text-secondary">{p.description.slice(0, 50)}…</span></td>
                  <td>
                    <div className="btn-group" onClick={e => e.stopPropagation()}>
                      <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditPoint(p)}>✏️</button>
                      <button className="btn btn-danger btn-sm btn-icon" onClick={() => setCriticalPoints(pts => pts.filter(x => x.id !== p.id))}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Drawer de detalhes */}
      {detailPoint && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
          onClick={e => e.target === e.currentTarget && setDetailPoint(null)}
        >
          <div style={{
            width: 480, maxWidth: "95vw", height: "100vh", overflowY: "auto",
            background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            animation: "slideInRight 0.22s ease",
          }}>
            {/* Header */}
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                    ⚠️ {detailPoint.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {severityBadge(detailPoint.risk)}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>
                      {detailPoint.type}
                    </span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => { setEditPoint(detailPoint); setDetailPoint(null); }}
                  >✏️ Editar</button>
                  <button
                    onClick={() => setDetailPoint(null)}
                    style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
                  >✕</button>
                </div>
              </div>
            </div>

            {/* Corpo */}
            <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
                Localização
              </div>
              <CriticalPointMap point={detailPoint} />
              {detailPoint.description && (
                <div style={{
                  background: "var(--bg-elevated)",
                  border: "1px solid var(--border)",
                  borderRadius: 8,
                  padding: "12px 14px",
                }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>
                    Descrição
                  </div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>
                    {detailPoint.description}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal de cadastro/edição */}
      {(showNew || editPoint) && (
        <CriticalPointModal
          point={editPoint}
          onClose={() => { setShowNew(false); setEditPoint(null); }}
          onSave={form => {
            if (editPoint) setCriticalPoints(pts => pts.map(p => p.id === editPoint.id ? { ...p, ...form } : p));
            else setCriticalPoints(pts => [...pts, { ...form, id: Date.now() }]);
          }}
        />
      )}
    </>
  );
}

// ─── Mapa de pontos de coleta (igual ao CollectionMapSection anterior) ────────
function CollectionMap({ points, selectedId }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef({});

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (!instanceRef.current) {
      const L = window.L;
      instanceRef.current = L.map(mapRef.current, { center: [-23.03, -45.56], zoom: 12 });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap", maxZoom: 18,
      }).addTo(instanceRef.current);
    }
    const L   = window.L;
    const map = instanceRef.current;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const icon = L.divIcon({
        className: "",
        html: `<div style="width:26px;height:26px;border-radius:6px;background:${selectedId === p.id ? "#FF6B1A" : "#3B82F6"};border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 10px ${selectedId === p.id ? "#FF6B1A88" : "#3B82F688"};">📦</div>`,
        iconSize: [26, 26], iconAnchor: [13, 13],
      });
      const marker = L.marker([p.lat, p.lng], { icon }).addTo(map)
        .bindPopup(`<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">📦 ${p.name}</div><div style="font-size:11px;color:#555">📍 ${p.address}, ${p.city}</div><div style="font-size:11px;color:#555">Capacidade: ${p.capacity} itens</div></div>`);
      markersRef.current[p.id] = marker;
    });
    if (selectedId && markersRef.current[selectedId]) {
      map.setView(markersRef.current[selectedId].getLatLng(), 15, { animate: true });
      markersRef.current[selectedId].openPopup();
    }
  }, [points, selectedId]);

  useEffect(() => {
    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, []);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: 8 }} />;
}

// ─── VolunteersSection ────────────────────────────────────────────────────────
export function VolunteersSection({ volunteers, setVolunteers, events }) {
  const [tab, setTab]     = useState("validacao");
  const [selVol, setSelVol] = useState(null);

  const pendingCount  = volunteers.filter(v => v.status === "pendente").length;
  const approvedCount = volunteers.filter(v => v.status === "aprovado").length;

  const approve = id => setVolunteers(vols => vols.map(v => v.id === id ? { ...v, status: "aprovado" } : v));
  const reject  = id => setVolunteers(vols => vols.filter(v => v.id !== id));

  const volColors = [
    "linear-gradient(135deg,#FF6B1A,#FF3B3B)",
    "linear-gradient(135deg,#3B82F6,#8B5CF6)",
    "linear-gradient(135deg,#22c55e,#16a34a)",
    "linear-gradient(135deg,#F5C518,#FF8C00)",
  ];

  // Eventos associados a um voluntário
  function eventsForVolunteer(volId) {
    return (events || []).filter(e => (e.volunteerIds || []).includes(volId));
  }

  const selectedVolEvents = selVol ? eventsForVolunteer(selVol.id) : [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">🙋 Voluntários</div>
          <div className="card-subtitle">RF10, RF11 — Validação e visualização de voluntários</div>
        </div>
        <div className="text-sm text-muted mono">{pendingCount} pendente(s) · {approvedCount} aprovado(s)</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === "validacao" ? "active" : ""}`} onClick={() => setTab("validacao")}>
          ⏳ Validação {pendingCount > 0 && <span className="nav-badge" style={{ marginLeft: 6 }}>{pendingCount}</span>}
        </div>
        <div className={`tab ${tab === "visualizacao" ? "active" : ""}`} onClick={() => { setTab("visualizacao"); setSelVol(null); }}>
          👥 Voluntários ({approvedCount})
        </div>
      </div>

      {/* ── Aba: Validação ── */}
      {tab === "validacao" && (
        <>
          {volunteers.filter(v => v.status === "pendente").length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum voluntário pendente</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Profissional</th><th>Especialidade</th><th>Região</th><th>CPF</th><th>Cadastro</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {volunteers.filter(v => v.status === "pendente").map((v, i) => (
                    <tr key={v.id}>
                      <td>
                        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                          <div className="vol-avatar" style={{ background: volColors[i % volColors.length] }}>{v.name[0]}</div>
                          <span style={{ fontWeight: 600 }}>{v.name}</span>
                        </div>
                      </td>
                      <td><span className="text-secondary text-sm">{v.specialty}</span></td>
                      <td><span className="text-muted text-sm mono">📍 {v.region}</span></td>
                      <td><span className="mono text-sm text-muted">{v.cpf}</span></td>
                      <td><span className="mono text-sm text-muted">{v.registered}</span></td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-success btn-sm" onClick={() => approve(v.id)}>✓ Aprovar</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => reject(v.id)}>✕ Rejeitar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Aba: Visualização ── */}
      {tab === "visualizacao" && (
        <div style={{ display: "flex", gap: 0, minHeight: 400 }}>

          {/* Lista de voluntários aprovados */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto" }}>
            {volunteers.filter(v => v.status === "aprovado").length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🙋</div>
                <div className="empty-state-text">Nenhum voluntário aprovado</div>
              </div>
            ) : volunteers.filter(v => v.status === "aprovado").map((v, i) => {
              const volEvs  = eventsForVolunteer(v.id);
              const isSelected = selVol?.id === v.id;
              return (
                <div
                  key={v.id}
                  onClick={() => setSelVol(prev => prev?.id === v.id ? null : v)}
                  style={{
                    padding: "13px 16px", borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "all 0.15s",
                    background: isSelected ? "var(--bg-hover)" : "transparent",
                    borderLeft: `3px solid ${isSelected ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <div className="vol-avatar" style={{ background: volColors[i % volColors.length], flexShrink: 0 }}>
                      {v.name[0]}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 1 }}>{v.name}</div>
                      {/* Contagem de eventos logo abaixo do nome */}
                      <div style={{
                        fontSize: 10, fontWeight: 700, fontFamily: "var(--font-mono)",
                        color: volEvs.length > 0 ? "var(--accent)" : "var(--text-muted)",
                        letterSpacing: "0.06em", marginBottom: 3,
                      }}>
                        {volEvs.length > 0 ? `${volEvs.length} EVENTO${volEvs.length > 1 ? "S" : ""} ASSOCIADO${volEvs.length > 1 ? "S" : ""}` : "SEM EVENTOS ATIVOS"}
                      </div>
                      <div style={{ fontSize: 11, color: "var(--text-secondary)" }}>{v.specialty}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {v.region}</div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Painel de detalhe */}
          <div style={{ flex: 1, padding: "20px 24px", overflowY: "auto" }}>
            {!selVol ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon">👈</div>
                <div className="empty-state-text">Selecione um voluntário para ver os detalhes</div>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>

                {/* Header do voluntário */}
                <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                  <div className="vol-avatar" style={{ width: 48, height: 48, fontSize: 18, background: volColors[volunteers.filter(v => v.status === "aprovado").findIndex(v => v.id === selVol.id) % volColors.length] }}>
                    {selVol.name[0]}
                  </div>
                  <div>
                    <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 16 }}>{selVol.name}</div>
                    <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{selVol.specialty}</div>
                    <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>📍 {selVol.region} · cadastro: {selVol.registered}</div>
                  </div>
                </div>

                {/* Eventos associados */}
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 10, fontFamily: "var(--font-mono)" }}>
                    Eventos Associados ({selectedVolEvents.length})
                  </div>
                  {selectedVolEvents.length === 0 ? (
                    <div style={{ fontSize: 12, color: "var(--text-muted)", padding: "16px 0" }}>
                      Este voluntário não está associado a nenhum evento no momento.
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                      {selectedVolEvents.map(e => (
                        <div key={e.id} style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                            <span style={{ fontSize: 16 }}>{typeIcon[e.type] || "⚠️"}</span>
                            <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                            {severityBadge(e.severity)}
                            {statusBadge(e.status)}
                          </div>
                          <div style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)" }}>
                            📍 {e.city} · 📅 {e.date} · 👥 {e.victims} vítimas
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── CollectionPointsSection ──────────────────────────────────────────────────
export function CollectionPointsSection({ collectionPoints, setCollectionPoints }) {
  const [tab, setTab]   = useState("validacao");
  const [selId, setSelId] = useState(null);
  const [search, setSearch] = useState("");

  const pendingCount   = collectionPoints.filter(p => p.status === "pendente").length;
  const validatedCount = collectionPoints.filter(p => p.status === "validado").length;

  const validate = id => setCollectionPoints(pts => pts.map(p => p.id === id ? { ...p, status: "validado" } : p));
  const reject   = id => setCollectionPoints(pts => pts.filter(p => p.id !== id));

  const validatedFiltered = collectionPoints
    .filter(p => p.status === "validado")
    .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">📦 Pontos de Coleta</div>
          <div className="card-subtitle">RF07, RF08 — Validação e visualização de pontos de coleta</div>
        </div>
        <div className="text-sm text-muted mono">{pendingCount} pendente(s) · {validatedCount} validado(s)</div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <div className={`tab ${tab === "validacao" ? "active" : ""}`} onClick={() => setTab("validacao")}>
          ⏳ Validação {pendingCount > 0 && <span className="nav-badge blue" style={{ marginLeft: 6 }}>{pendingCount}</span>}
        </div>
        <div className={`tab ${tab === "visualizacao" ? "active" : ""}`} onClick={() => { setTab("visualizacao"); setSelId(null); }}>
          🗺️ Pontos de Coleta ({validatedCount})
        </div>
      </div>

      {/* ── Aba: Validação ── */}
      {tab === "validacao" && (
        <>
          {collectionPoints.filter(p => p.status === "pendente").length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum ponto pendente</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nome</th><th>Endereço</th><th>Capacidade</th><th>Itens Aceitos</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {collectionPoints.filter(p => p.status === "pendente").map(p => (
                    <tr key={p.id}>
                      <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                      <td><span className="text-secondary text-sm">📍 {p.address}, {p.city}</span></td>
                      <td><span className="mono" style={{ color: "var(--accent2)" }}>{p.capacity} itens</span></td>
                      <td>
                        <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                          {p.items.map(item => (
                            <span key={item} style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "99px", fontSize: 10, padding: "2px 8px", fontWeight: 600 }}>{item}</span>
                          ))}
                        </div>
                      </td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-success btn-sm" onClick={() => validate(p.id)}>✓ Validar</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => reject(p.id)}>✕ Recusar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {/* ── Aba: Visualização com mapa ── */}
      {tab === "visualizacao" && (
        <div style={{ display: "flex", height: 480 }}>

          {/* Lista */}
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            {/* Search */}
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <input
                className="search-input"
                placeholder="🔍 Buscar ponto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {validatedFiltered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">Nenhum ponto validado</div>
                </div>
              ) : validatedFiltered.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelId(prev => prev === p.id ? null : p.id)}
                  style={{
                    padding: "13px 16px", borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "all 0.15s",
                    background: selId === p.id ? "var(--bg-hover)" : "transparent",
                    borderLeft: `3px solid ${selId === p.id ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>📍 {p.address}, {p.city}</div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                    {p.items.map(item => (
                      <span key={item} style={{ background: "rgba(59,130,246,0.1)", color: "#3B82F6", border: "1px solid rgba(59,130,246,0.2)", borderRadius: "99px", fontSize: 9, padding: "1px 7px", fontWeight: 600 }}>{item}</span>
                    ))}
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span className="mono text-sm" style={{ color: "var(--accent2)" }}>{p.capacity} itens</span>
                    <span style={{ fontSize: 10, color: selId === p.id ? "var(--accent)" : "var(--text-muted)" }}>
                      {selId === p.id ? "📍 no mapa ✓" : "ver no mapa →"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Mapa */}
          <div style={{ flex: 1 }}>
            {validatedFiltered.length === 0 ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon">🗺️</div>
                <div className="empty-state-text">Nenhum ponto para exibir</div>
              </div>
            ) : (
              <CollectionMap points={validatedFiltered} selectedId={selId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Main App ───────────────────────────────────────────────────────────────────
export default function AdminDashboard() {
  const [section, setSection] = useState("overview");
  const [events, setEvents] = useState(MOCK_EVENTS);
  const [criticalPoints, setCriticalPoints] = useState(MOCK_CRITICAL_POINTS);
  const [volunteers, setVolunteers] = useState(MOCK_VOLUNTEERS);
  const [collectionPoints, setCollectionPoints] = useState(MOCK_COLLECTION_POINTS);
  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewPoint, setShowNewPoint] = useState(false);

  const pendingVols = volunteers.filter(v => v.status === "pendente").length;
  const pendingCols = collectionPoints.filter(p => p.status === "pendente").length;

  const navItems = [
    { id: "overview",             icon: "◉",  label: "Visão Geral" },
    { id: "events",               icon: "🌊", label: "Eventos",              badge: events.filter(e => e.status === "ativo").length },
    { id: "critical",             icon: "⚠️", label: "Pontos Críticos",       badge: criticalPoints.length },
    { id: "collection", icon: "📦", label: "Pontos de Coleta", badge: pendingCols, badgeClass: "blue" },
    { id: "volunteers", icon: "🙋", label: "Voluntários", badge: pendingVols },
  ];

  const sectionTitles = {
    overview: "Visão Geral",
    events: "Eventos Oficiais",
    critical: "Pontos Críticos",
    "volunteers": "Voluntários",
    "collection": "Pontos de Coleta",
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <img
              src="/resources/logo.png"
              alt="Logo"
              style={{ width: 100, height: 100, borderRadius: 8, objectFit: "contain" }}
            />
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Painel</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`} onClick={() => setSection(item.id)}>
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && <span className={`nav-badge ${item.badgeClass || ""}`}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="avatar">A</div>
            <div className="avatar-info">
              <div className="avatar-name">Administrador</div>
              <div className="avatar-role">ADMIN</div>
            </div>
            <span style={{ color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}>⇤</span>
          </div>
        </aside>

        {/* Main */}
        <main className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{sectionTitles[section]}</div>
              <div className="topbar-breadcrumb">BASE / {sectionTitles[section]}</div>
            </div>
            <div className="topbar-spacer" />
            <div className="topbar-status"><div className="status-dot" />Sistema Online</div>
            <button className="topbar-btn" title="Notificações">🔔</button>
            <button className="topbar-btn" title="Configurações">⚙️</button>
          </div>

          <div className="content">
            {section === "overview" && (
              <OverviewSection
                events={events} criticalPoints={criticalPoints}
                volunteers={volunteers} collectionPoints={collectionPoints}
                onNewEvent={() => setShowNewEvent(true)}
                onNewPoint={() => setShowNewPoint(true)}
              />
            )}
            {section === "events" && (
              <EventsSection
                events={events}
                setEvents={setEvents}
                criticalPoints={criticalPoints}   // ← adicionar esta prop
              />
            )}

            {section === "critical" && <CriticalPointsSection criticalPoints={criticalPoints} setCriticalPoints={setCriticalPoints} />}
            {section === "volunteers"  && <VolunteersSection  volunteers={volunteers}  setVolunteers={setVolunteers}  events={events} />}
            {section === "collection"  && <CollectionPointsSection collectionPoints={collectionPoints} setCollectionPoints={setCollectionPoints} />}
          </div>
        </main>
      </div>

      {showNewEvent && (
        <EventModal
          onClose={() => setShowNewEvent(false)}
          onSave={form => setEvents(ev => [...ev, { ...form, id: Date.now(), victims: 0, volunteers: 0, date: new Date().toISOString().slice(0, 10) }])}
        />
      )}
      {showNewPoint && (
        <CriticalPointModal
          onClose={() => setShowNewPoint(false)}
          onSave={form => setCriticalPoints(pts => [...pts, { ...form, id: Date.now() }])}
        />
      )}
    </>
  );
}
