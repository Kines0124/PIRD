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
  { id: 1, title: "Enchente Rio Paraíba", type: "enchente", status: "ativo", severity: "critico", lat: -23.02, lng: -45.56, city: "Taubaté, SP", date: "2025-04-20", victims: 340, volunteers: 18 },
  { id: 2, title: "Deslizamento Serra", type: "deslizamento", status: "monitoramento", severity: "alto", lat: -23.18, lng: -45.88, city: "Campos do Jordão, SP", date: "2025-04-19", victims: 120, volunteers: 7 },
  { id: 3, title: "Alagamento Centro", type: "alagamento", status: "controlado", severity: "medio", lat: -23.55, lng: -46.63, city: "São Paulo, SP", date: "2025-04-18", victims: 55, volunteers: 30 },
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
    display: flex; align-items: center; gap: 10px;
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
    position: fixed; inset: 0; background: rgba(0,0,0,0.7); z-index: 200;
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

// ─── Modal: Cadastrar/Editar Evento ────────────────────────────────────────────
function EventModal({ event, onClose, onSave }) {
  const [form, setForm] = useState(event || { title: "", type: "enchente", severity: "medio", city: "", lat: "", lng: "", description: "", status: "ativo" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <div className="modal-title">{event ? "Editar Evento" : "Cadastrar Novo Evento"}</div>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label className="form-label">Título do Evento *</label>
            <input className="form-input" value={form.title} onChange={e => set("title", e.target.value)} placeholder="Ex: Enchente Rio Paraíba" />
          </div>
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
              <label className="form-label">Severidade</label>
              <select className="form-select" value={form.severity} onChange={e => set("severity", e.target.value)}>
                <option value="critico">Crítico</option>
                <option value="alto">Alto</option>
                <option value="medio">Médio</option>
                <option value="baixo">Baixo</option>
              </select>
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Status</label>
              <select className="form-select" value={form.status} onChange={e => set("status", e.target.value)}>
                <option value="ativo">Ativo</option>
                <option value="monitoramento">Monitoramento</option>
                <option value="controlado">Controlado</option>
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Cidade / UF</label>
              <input className="form-input" value={form.city} onChange={e => set("city", e.target.value)} placeholder="Ex: Taubaté, SP" />
            </div>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude (PostGIS)</label>
              <input className="form-input mono" value={form.lat} onChange={e => set("lat", e.target.value)} placeholder="-23.0200" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude (PostGIS)</label>
              <input className="form-input mono" value={form.lng} onChange={e => set("lng", e.target.value)} placeholder="-45.5600" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detalhes sobre o evento..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>💾 Salvar Evento</button>
        </div>
      </div>
    </div>
  );
}

// ─── Modal: Cadastrar Ponto Crítico ────────────────────────────────────────────
function CriticalPointModal({ point, onClose, onSave }) {
  const [form, setForm] = useState(point || { name: "", type: "geologico", risk: "alto", lat: "", lng: "", description: "" });
  const set = (k, v) => setForm(f => ({ ...f, [k]: v }));
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
          <div className="form-row">
            <div className="form-group">
              <label className="form-label">Latitude</label>
              <input className="form-input mono" value={form.lat} onChange={e => set("lat", e.target.value)} placeholder="-23.0200" />
            </div>
            <div className="form-group">
              <label className="form-label">Longitude</label>
              <input className="form-input mono" value={form.lng} onChange={e => set("lng", e.target.value)} placeholder="-45.5600" />
            </div>
          </div>
          <div className="form-group">
            <label className="form-label">Descrição / Observações</label>
            <textarea className="form-textarea" value={form.description} onChange={e => set("description", e.target.value)} placeholder="Detalhes sobre o risco..." />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn btn-secondary" onClick={onClose}>Cancelar</button>
          <button className="btn btn-primary" onClick={() => { onSave(form); onClose(); }}>💾 Salvar</button>
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

function EventsSection({ events, setEvents }) {
  const [filter, setFilter] = useState("todos");
  const [search, setSearch] = useState("");
  const [editEvent, setEditEvent] = useState(null);
  const [showNew, setShowNew] = useState(false);

  const filtered = events
    .filter(e => filter === "todos" || e.status === filter)
    .filter(e => e.title.toLowerCase().includes(search.toLowerCase()) || e.city.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">📋 Gerenciar Eventos Oficiais</div><div className="card-subtitle">RF01, RF02 — Cadastro e atualização de desastres</div></div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Evento</button>
      </div>
      <div className="filter-row">
        {["todos", "ativo", "monitoramento", "controlado"].map(f => (
          <span key={f} className={`filter-chip ${filter === f ? "active" : ""}`} onClick={() => setFilter(f)}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </span>
        ))}
        <input className="search-input" placeholder="🔍 Buscar evento..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Evento</th><th>Tipo</th><th>Severidade</th><th>Status</th><th>Vítimas</th><th>Voluntários</th><th>Data</th><th>Ações</th></tr></thead>
          <tbody>
            {filtered.map(e => (
              <tr key={e.id}>
                <td>
                  <div style={{ fontWeight: 600 }}>{e.title}</div>
                  <div className="text-muted text-sm mono">📍 {e.city}</div>
                </td>
                <td><span style={{ fontSize: 18 }}>{typeIcon[e.type]}</span></td>
                <td>{severityBadge(e.severity)}</td>
                <td>{statusBadge(e.status)}</td>
                <td><span className="mono" style={{ color: "var(--warning)" }}>{e.victims}</span></td>
                <td><span className="mono" style={{ color: "var(--success)" }}>{e.volunteers}</span></td>
                <td><span className="mono text-secondary text-sm">{e.date}</span></td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditEvent(e)} title="Editar">✏️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
}

function CriticalPointsSection({ criticalPoints, setCriticalPoints }) {
  const [editPoint, setEditPoint] = useState(null);
  const [showNew, setShowNew] = useState(false);
  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">⚠️ Pontos Críticos</div><div className="card-subtitle">RF14 — Áreas de alto risco cadastradas pelo administrador</div></div>
        <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Ponto</button>
      </div>
      <div className="table-wrap">
        <table>
          <thead><tr><th>Nome</th><th>Tipo</th><th>Nível de Risco</th><th>Coordenadas</th><th>Observação</th><th>Ações</th></tr></thead>
          <tbody>
            {criticalPoints.map(p => (
              <tr key={p.id}>
                <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                <td><span style={{ textTransform: "capitalize", fontSize: 12, color: "var(--text-secondary)" }}>{p.type}</span></td>
                <td>{severityBadge(p.risk)}</td>
                <td><span className="mono text-sm text-muted">{p.lat}, {p.lng}</span></td>
                <td><span className="text-sm text-secondary">{p.description.slice(0, 50)}…</span></td>
                <td>
                  <div className="btn-group">
                    <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditPoint(p)}>✏️</button>
                    <button className="btn btn-danger btn-sm btn-icon" onClick={() => setCriticalPoints(pts => pts.filter(x => x.id !== p.id))}>🗑️</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
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
    </div>
  );
}

function VolunteersSection({ volunteers, setVolunteers }) {
  const [tab, setTab] = useState("pendente");
  const filtered = volunteers.filter(v => v.status === tab);
  const approve = id => setVolunteers(vols => vols.map(v => v.id === id ? { ...v, status: "aprovado" } : v));
  const reject = id => setVolunteers(vols => vols.filter(v => v.id !== id));
  const colors = ["linear-gradient(135deg,#FF6B1A,#FF3B3B)", "linear-gradient(135deg,#3B82F6,#8B5CF6)", "linear-gradient(135deg,#22c55e,#16a34a)", "linear-gradient(135deg,#F5C518,#FF8C00)"];

  return (
    <div className="card">
      <div className="card-header">
        <div><div className="card-title">🙋 Validação de Voluntários</div><div className="card-subtitle">RF10, RF11 — Aprovação de profissionais qualificados</div></div>
        <div className="text-sm text-muted mono">{volunteers.filter(v => v.status === "pendente").length} pendentes</div>
      </div>
      <div className="tabs">
        {["pendente", "aprovado"].map(t => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "pendente" ? "⏳ Aguardando" : "✅ Aprovados"} ({volunteers.filter(v => v.status === t).length})
          </div>
        ))}
      </div>
      {filtered.length === 0 ? (
        <div className="empty-state"><div className="empty-state-icon">{tab === "pendente" ? "✅" : "🙋"}</div><div className="empty-state-text">{tab === "pendente" ? "Nenhum voluntário pendente" : "Nenhum voluntário aprovado ainda"}</div></div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead><tr><th>Profissional</th><th>Especialidade</th><th>Região</th><th>CPF</th><th>Cadastro</th><th>Status</th>{tab === "pendente" && <th>Ações</th>}</tr></thead>
            <tbody>
              {filtered.map((v, i) => (
                <tr key={v.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                      <div className="vol-avatar" style={{ background: colors[i % colors.length] }}>{v.name[0]}</div>
                      <span style={{ fontWeight: 600 }}>{v.name}</span>
                    </div>
                  </td>
                  <td><span className="text-secondary text-sm">{v.specialty}</span></td>
                  <td><span className="text-muted text-sm mono">📍 {v.region}</span></td>
                  <td><span className="mono text-sm text-muted">{v.cpf}</span></td>
                  <td><span className="mono text-sm text-muted">{v.registered}</span></td>
                  <td>{statusBadge(v.status)}</td>
                  {tab === "pendente" && (
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-success btn-sm" onClick={() => approve(v.id)}>✓ Aprovar</button>
                        <button className="btn btn-danger btn-sm" onClick={() => reject(v.id)}>✕ Rejeitar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Seção 1: Validação de Pontos de Coleta ───────────────────────────────────
export function CollectionValidationSection({ collectionPoints, setCollectionPoints }) {
  const [tab, setTab] = useState("pendente");
  const filtered = collectionPoints.filter(p => p.status === tab);
  const validate = id => setCollectionPoints(pts => pts.map(p => p.id === id ? { ...p, status: "validado" } : p));
  const reject   = id => setCollectionPoints(pts => pts.filter(p => p.id !== id));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">✅ Validação de Pontos de Coleta</div>
          <div className="card-subtitle">RF07, RF08 — Aprovação de pontos cadastrados pelos usuários</div>
        </div>
        <div className="text-sm text-muted mono">
          {collectionPoints.filter(p => p.status === "pendente").length} aguardando validação
        </div>
      </div>

      <div className="tabs">
        {["pendente", "validado"].map(t => (
          <div key={t} className={`tab ${tab === t ? "active" : ""}`} onClick={() => setTab(t)}>
            {t === "pendente" ? "⏳ Pendentes" : "✅ Validados"} ({collectionPoints.filter(p => p.status === t).length})
          </div>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">✅</div>
          <div className="empty-state-text">Nenhum ponto {tab}</div>
        </div>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>Nome</th>
                <th>Endereço</th>
                <th>Capacidade</th>
                <th>Itens Aceitos</th>
                <th>Status</th>
                {tab === "pendente" && <th>Ações</th>}
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => (
                <tr key={p.id}>
                  <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                  <td><span className="text-secondary text-sm">📍 {p.address}, {p.city}</span></td>
                  <td><span className="mono" style={{ color: "var(--accent2)" }}>{p.capacity} itens</span></td>
                  <td>
                    <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                      {p.items.map(item => (
                        <span key={item} style={{
                          background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                          border: "1px solid rgba(59,130,246,0.25)", borderRadius: "99px",
                          fontSize: 10, padding: "2px 8px", fontWeight: 600,
                        }}>{item}</span>
                      ))}
                    </div>
                  </td>
                  <td>{statusBadge(p.status)}</td>
                  {tab === "pendente" && (
                    <td>
                      <div className="btn-group">
                        <button className="btn btn-success btn-sm" onClick={() => validate(p.id)}>✓ Validar</button>
                        <button className="btn btn-danger btn-sm"  onClick={() => reject(p.id)}>✕ Recusar</button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Mapa interno (sem dependência de CDN — usa react-leaflet) ────────────────
function CollectionMap({ points, selectedId }) {
  const mapRef      = useRef(null);
  const instanceRef = useRef(null);
  const markersRef  = useRef({});

  useEffect(() => {
    // Aguarda o container existir no DOM
    if (!mapRef.current) return;

    // Inicializa o mapa apenas uma vez
    if (!instanceRef.current) {
      const L = window.L;
      if (!L) return;

      instanceRef.current = L.map(mapRef.current, {
        center: [-23.03, -45.56],
        zoom: 12,
        zoomControl: true,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "© OpenStreetMap",
        maxZoom: 18,
      }).addTo(instanceRef.current);
    }

    const L   = window.L;
    const map = instanceRef.current;

    // Limpa markers anteriores
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};

    // Adiciona markers dos pontos validados
    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const icon = L.divIcon({
        className: "",
        html: `<div style="
          width:26px;height:26px;border-radius:6px;
          background:${selectedId === p.id ? "#FF6B1A" : "#3B82F6"};
          border:2px solid rgba(255,255,255,0.35);
          display:flex;align-items:center;justify-content:center;
          font-size:13px;
          box-shadow:0 0 10px ${selectedId === p.id ? "#FF6B1A88" : "#3B82F688"};
          transition:all 0.2s;
        ">📦</div>`,
        iconSize: [26, 26],
        iconAnchor: [13, 13],
      });

      const marker = L.marker([p.lat, p.lng], { icon })
        .addTo(map)
        .bindPopup(`
          <div style="font-family:sans-serif;min-width:160px">
            <div style="font-weight:700;font-size:13px;margin-bottom:4px">📦 ${p.name}</div>
            <div style="font-size:11px;color:#555;margin-bottom:2px">📍 ${p.address}, ${p.city}</div>
            <div style="font-size:11px;color:#555">Capacidade: ${p.capacity} itens</div>
          </div>
        `);

      markersRef.current[p.id] = marker;
    });

    // Foca no ponto selecionado
    if (selectedId && markersRef.current[selectedId]) {
      const m = markersRef.current[selectedId];
      map.setView(m.getLatLng(), 15, { animate: true });
      m.openPopup();
    }

    return () => {
      // Não destrói o mapa no cleanup de re-render — só no unmount
    };
  }, [points, selectedId]);

  // Destrói o mapa ao desmontar o componente
  useEffect(() => {
    return () => {
      if (instanceRef.current) {
        instanceRef.current.remove();
        instanceRef.current = null;
      }
    };
  }, []);

  return <div ref={mapRef} style={{ height: "100%", width: "100%", borderRadius: 8 }} />;
}

// ─── Seção 2: Visualização de Pontos de Coleta com Mapa ──────────────────────
export function CollectionMapSection({ collectionPoints }) {
  const [search, setSearch] = useState("");
  const validated = collectionPoints
  .filter(p => p.status === "validado")
  .filter(p => p.name.toLowerCase().includes(search.toLowerCase()));
  const [selId, setSelId] = useState(null);
  const selected   = validated.find(p => p.id === selId) || null;

  return (
    <div className="card" style={{ padding: 0, overflow: "hidden" }}>
      {/* Header */}
      <div className="card-header" style={{ padding: "18px 20px 14px" }}>
        <div style={{ padding: "0 20px 14px", borderBottom: "1px solid var(--border)" }}>
          <input
            className="search-input"
            placeholder="🔍 Buscar ponto de coleta..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ width: "100%" }}
          />
        </div>
        <div>
          <div className="card-title">🗺️ Pontos de Coleta</div>
          <div className="card-subtitle">Pontos validados — clique na lista para localizar no mapa</div>
        </div>
        <div className="text-sm text-muted mono">{validated.length} ponto(s) validado(s)</div>
      </div>

      {/* Corpo: lista à esquerda + mapa à direita */}
      <div style={{ display: "flex", height: 480, borderTop: "1px solid var(--border)" }}>

        {/* Lista de pontos validados */}
        <div style={{
          width: 700, flexShrink: 0, overflowY: "auto",
          borderRight: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
        }}>
          {validated.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">Nenhum ponto validado ainda</div>
            </div>
          ) : validated.map(p => (
            <div
              key={p.id}
              onClick={() => setSelId(prev => prev === p.id ? null : p.id)}
              style={{
                padding: "13px 16px",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                background: selId === p.id ? "var(--bg-hover)" : "transparent",
                borderLeft: `3px solid ${selId === p.id ? "var(--accent)" : "transparent"}`,
                transition: "all 0.15s",
              }}
            >
              <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3, color: "var(--text-primary)" }}>
                {p.name}
              </div>
              <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>
                📍 {p.address}, {p.city}
              </div>
              <div style={{ display: "flex", gap: 4, flexWrap: "wrap", marginBottom: 6 }}>
                {p.items.map(item => (
                  <span key={item} style={{
                    background: "rgba(59,130,246,0.1)", color: "#3B82F6",
                    border: "1px solid rgba(59,130,246,0.2)", borderRadius: "99px",
                    fontSize: 9, padding: "1px 7px", fontWeight: 600,
                  }}>{item}</span>
                ))}
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span className="mono text-sm" style={{ color: "var(--accent2)" }}>{p.capacity} itens</span>
                <span style={{ fontSize: 10, color: selId === p.id ? "var(--accent)" : "var(--text-muted)" }}>
                  {selId === p.id ? "📍 no mapa ✓" : "ver no mapa →"}
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* Mapa */}
        <div style={{ flex: 1, position: "relative" }}>
          {validated.length === 0 ? (
            <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
              <div className="empty-state-icon">🗺️</div>
              <div className="empty-state-text">Nenhum ponto para exibir</div>
            </div>
          ) : (
            <CollectionMap points={validated} selectedId={selId} />
          )}
        </div>
      </div>
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
    { id: "volunteers",           icon: "🙋", label: "Voluntários",           badge: pendingVols },
    { id: "collection-validate",  icon: "✅", label: "Validar Coletas",       badge: pendingCols, badgeClass: "blue" },
    { id: "collection-map",       icon: "🗺️", label: "Pontos de Coleta" },
  ];

  const sectionTitles = {
    overview: "Visão Geral",
    events: "Eventos Oficiais",
    critical: "Pontos Críticos",
    volunteers: "Voluntários",
    "collection-validate": "Validação de Pontos de Coleta",
    "collection-map":      "Pontos de Coleta",
  };

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">
        {/* Sidebar */}
        <aside className="sidebar">
          <div className="sidebar-logo">
            <div className="logo-mark">🆘</div>
            <div>
              <div className="logo-text">BASE</div>
              <div className="logo-sub">Operações • Admin</div>
            </div>
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
              <div className="topbar-breadcrumb">RespostaTotal / {sectionTitles[section]}</div>
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
            {section === "events" && <EventsSection events={events} setEvents={setEvents} />}
            {section === "critical" && <CriticalPointsSection criticalPoints={criticalPoints} setCriticalPoints={setCriticalPoints} />}
            {section === "volunteers" && <VolunteersSection volunteers={volunteers} setVolunteers={setVolunteers} />}
            {section === "collection-validate" && <CollectionValidationSection collectionPoints={collectionPoints} setCollectionPoints={setCollectionPoints} />}
            {section === "collection-map"      && <CollectionMapSection collectionPoints={collectionPoints} />}
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
