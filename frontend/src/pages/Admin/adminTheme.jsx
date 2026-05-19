// ─── Shared colors / helpers ───────────────────────────────────────────────────
export const severityColor = { critico: "#FF3B3B", alto: "#FF8C00", medio: "#F5C518", baixo: "#4CAF50" };
export const severityBg    = { critico: "rgba(255,59,59,0.12)", alto: "rgba(255,140,0,0.12)", medio: "rgba(245,197,24,0.12)", baixo: "rgba(76,175,80,0.12)" };
export const typeIcon      = { enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥" };
export const riskColor     = { critico: "#FF3B3B", alto: "#FF8C00", medio: "#F5C518" };

export const SEVERITY_OPTIONS = [
  { value: "critico", label: "Crítico", color: "#FF3B3B", bg: "rgba(255,59,59,0.12)" },
  { value: "alto",    label: "Alto",    color: "#FF8C00", bg: "rgba(255,140,0,0.12)"  },
  { value: "medio",   label: "Médio",   color: "#F5C518", bg: "rgba(245,197,24,0.12)" },
  { value: "baixo",   label: "Baixo",   color: "#4CAF50", bg: "rgba(76,175,80,0.12)"  },
];

export function Badge({ color, bg, label, dot = true }) {
  return (
    <span className="badge" style={{ background: bg || "rgba(255,255,255,0.07)", color: color || "var(--text-secondary)" }}>
      {dot && <span className="badge-dot" style={{ background: color }} />}
      {label}
    </span>
  );
}

export function severityBadge(s) {
  const labels = { critico: "Crítico", alto: "Alto", medio: "Médio", baixo: "Baixo" };
  return <Badge color={severityColor[s]} bg={severityBg[s]} label={labels[s]} />;
}

export function statusBadge(s) {
  const map = {
    ativo:         { color: "#ef4444", bg: "rgba(239,68,68,0.1)",    label: "Ativo" },
    monitoramento: { color: "#F5C518", bg: "rgba(245,197,24,0.1)",   label: "Monitoramento" },
    controlado:    { color: "#22c55e", bg: "rgba(34,197,94,0.1)",    label: "Controlado" },
    encerrado:     { color: "#7a8099", bg: "rgba(122,128,153,0.1)",  label: "Encerrado" },
    pendente:      { color: "#F5C518", bg: "rgba(245,197,24,0.1)",   label: "Pendente" },
    aprovado:      { color: "#22c55e", bg: "rgba(34,197,94,0.1)",    label: "Aprovado" },
    validado:      { color: "#3B82F6", bg: "rgba(59,130,246,0.1)",   label: "Validado" },
  };
  const m = map[s] || { color: "var(--text-muted)", bg: "rgba(255,255,255,0.06)", label: s };
  return <Badge color={m.color} bg={m.bg} label={m.label} />;
}

// ─── Global CSS ────────────────────────────────────────────────────────────────
export const styles = `
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
    justify-content: center;
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

  .card {
    background: var(--bg-surface); border: 1px solid var(--border); border-radius: var(--radius);
    padding: 20px; transition: border-color 0.2s;
  }
  .card:hover { border-color: rgba(255,255,255,0.13); }
  .card-header { display: flex; align-items: center; justify-content: space-between; margin-bottom: 16px; }
  .card-title { font-family: var(--font-display); font-weight: 700; font-size: 14px; }
  .card-subtitle { font-size: 11px; color: var(--text-muted); margin-top: 2px; }

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

  .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 16px; }
  .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 16px; }
  .grid-6040 { display: grid; grid-template-columns: 1.4fr 1fr; gap: 16px; }

  .table-wrap { overflow-x: auto; }
  table { width: 100%; border-collapse: collapse; font-size: 12.5px; }
  thead th { text-align: left; padding: 8px 12px; color: var(--text-muted); font-size: 10.5px; text-transform: uppercase; letter-spacing: 0.08em; font-weight: 600; border-bottom: 1px solid var(--border); }
  tbody td { padding: 10px 12px; border-bottom: 1px solid rgba(255,255,255,0.04); vertical-align: middle; }
  tbody tr:hover td { background: var(--bg-hover); }
  tbody tr:last-child td { border-bottom: none; }

  .badge {
    display: inline-flex; align-items: center; gap: 5px; padding: 3px 9px;
    border-radius: 99px; font-size: 10.5px; font-weight: 600; white-space: nowrap; font-family: var(--font-mono);
  }
  .badge-dot { width: 5px; height: 5px; border-radius: 50%; }

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

  #admin-map { width: 100%; height: 320px; border-radius: var(--radius-sm); overflow: hidden; background: #0d1117; }
  .leaflet-container { background: #0d1117 !important; font-family: var(--font-body) !important; }
  .leaflet-tile { filter: brightness(0.75) saturate(0.7) hue-rotate(180deg) !important; }

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

  .tabs { display: flex; gap: 2px; background: var(--bg-elevated); border-radius: var(--radius-sm); padding: 3px; margin-bottom: 18px; }
  .tab { padding: 7px 16px; border-radius: 6px; cursor: pointer; font-size: 12.5px; font-weight: 600; transition: all 0.15s; color: var(--text-secondary); white-space: nowrap; }
  .tab.active { background: var(--bg-surface); color: var(--text-primary); box-shadow: 0 1px 4px rgba(0,0,0,0.3); }
  .tab:hover:not(.active) { color: var(--text-primary); }

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

  .alert-strip {
    background: rgba(255,59,59,0.08); border: 1px solid rgba(255,59,59,0.3); border-radius: var(--radius-sm);
    padding: 10px 14px; display: flex; align-items: center; gap: 10px; margin-bottom: 18px; font-size: 12.5px;
  }
  .alert-icon { font-size: 16px; flex-shrink: 0; }

  .empty-state { text-align: center; padding: 40px 20px; color: var(--text-muted); }
  .empty-state-icon { font-size: 36px; margin-bottom: 10px; opacity: 0.4; }
  .empty-state-text { font-size: 13px; }

  ::-webkit-scrollbar { width: 5px; height: 5px; }
  ::-webkit-scrollbar-track { background: transparent; }
  ::-webkit-scrollbar-thumb { background: var(--border); border-radius: 99px; }

  .section-gap { margin-bottom: 22px; }

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

  @keyframes slideInRight {
    from { transform: translateX(40px); opacity: 0; }
    to   { transform: translateX(0);    opacity: 1; }
  }
`;
