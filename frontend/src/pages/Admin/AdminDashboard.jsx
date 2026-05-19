import { useState, useEffect } from "react";
import { styles } from "./adminTheme.jsx";
import * as adminApi from "../../services/adminApi.js";
import OverviewSection         from "./sections/OverviewSection.jsx";
import EventsSection           from "./sections/EventsSection.jsx";
import CriticalPointsSection   from "./sections/CriticalPointsSection.jsx";
import VolunteersSection       from "./sections/VolunteersSection.jsx";
import CollectionPointsSection from "./sections/CollectionPointsSection.jsx";
import EventModal              from "./modals/EventModal.jsx";
import CriticalPointModal      from "./modals/CriticalPointModal.jsx";

// ─── Login gate ───────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const [email,    setEmail]    = useState("");
  const [senha,    setSenha]    = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await adminApi.login(email, senha);
      onLogin();
    } catch (err) {
      const msg = err?.message || "";
      if (msg.includes("Failed to fetch") || msg.includes("NetworkError") || msg.includes("ERR_CONNECTION")) {
        setError("Não foi possível conectar ao servidor. Verifique se o backend está rodando na porta 8080.");
      } else {
        setError("Credenciais inválidas. Verifique e-mail e senha.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell" style={{ alignItems: "center", justifyContent: "center" }}>
        <div className="card" style={{ width: 400, maxWidth: "90vw" }}>
          <div className="card-header">
            <div className="card-title">🔐 Acesso — Defesa Civil</div>
          </div>
          <div style={{ padding: "20px 24px" }}>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
              <div className="form-group">
                <label className="form-label">E-mail</label>
                <input
                  className="form-input"
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="admin@pird.com"
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input
                  className="form-input"
                  type="password"
                  value={senha}
                  onChange={e => setSenha(e.target.value)}
                  placeholder="••••••••"
                />
              </div>
              {error && (
                <div style={{ color: "var(--danger)", fontSize: 13, background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.25)", borderRadius: 6, padding: "8px 12px" }}>
                  {error}
                </div>
              )}
              <button
                className="btn btn-primary"
                type="submit"
                disabled={loading || !email || !senha}
                style={{ opacity: loading || !email || !senha ? 0.5 : 1 }}
              >
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Admin panel ──────────────────────────────────────────────────────────────

function AdminPanel({ onLogout }) {
  const [section, setSection] = useState("overview");

  const [events,           setEvents]           = useState([]);
  const [criticalPoints,   setCriticalPoints]   = useState([]);
  const [volunteers,       setVolunteers]       = useState([]);
  const [collectionPoints, setCollectionPoints] = useState([]);
  const [loadError,        setLoadError]        = useState(null);

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewPoint, setShowNewPoint] = useState(false);

  async function loadAll() {
    try {
      const [evts, pts, vols, cols] = await Promise.all([
        adminApi.getEventos(),
        adminApi.getPontosCriticos(),
        adminApi.getVoluntarios(),
        adminApi.getPontosColeta(),
      ]);
      setEvents(evts);
      setCriticalPoints(pts);
      setVolunteers(vols);
      setCollectionPoints(cols);
      setLoadError(null);
    } catch (e) {
      setLoadError("Erro ao carregar dados: " + e.message);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function handleSaveEvent(editEvent, form) {
    try {
      if (editEvent) await adminApi.updateEvento(editEvent.id, form);
      else           await adminApi.createEvento(form);
      setEvents(await adminApi.getEventos());
    } catch (e) { alert("Erro ao salvar evento: " + e.message); }
  }

  async function handleSavePoint(editPoint, form) {
    try {
      if (editPoint) await adminApi.updatePontoCritico(editPoint.id, form);
      else           await adminApi.createPontoCritico(form);
      setCriticalPoints(await adminApi.getPontosCriticos());
    } catch (e) { alert("Erro ao salvar ponto crítico: " + e.message); }
  }

  async function handleDeletePoint(id) {
    try {
      await adminApi.deletePontoCritico(id);
      setCriticalPoints(pts => pts.filter(p => p.id !== id));
    } catch (e) { alert("Erro ao deletar ponto crítico: " + e.message); }
  }

  async function handleApproveVol(id) {
    try {
      await adminApi.validarVoluntario(id);
      setVolunteers(await adminApi.getVoluntarios());
    } catch (e) { alert("Erro ao aprovar voluntário: " + e.message); }
  }

  async function handleRejectVol(id) {
    try {
      await adminApi.deletarVoluntario(id);
      setVolunteers(vols => vols.filter(v => v.id !== id));
    } catch (e) { alert("Erro ao rejeitar voluntário: " + e.message); }
  }

  async function handleValidateColeta(id) {
    try {
      await adminApi.validarPontoColeta(id);
      setCollectionPoints(await adminApi.getPontosColeta());
    } catch (e) { alert("Erro ao validar ponto de coleta: " + e.message); }
  }

  async function handleRejectColeta(id) {
    try {
      await adminApi.deletarPontoColeta(id);
      setCollectionPoints(cols => cols.filter(p => p.id !== id));
    } catch (e) { alert("Erro ao recusar ponto de coleta: " + e.message); }
  }

  const pendingVols = volunteers.filter(v => v.status === "pendente").length;
  const pendingCols = collectionPoints.filter(p => p.status === "pendente").length;

  const navItems = [
    { id: "overview",   icon: "◉",  label: "Visão Geral" },
    { id: "events",     icon: "🌊", label: "Eventos",          badge: events.filter(e => e.status === "ativo").length },
    { id: "critical",   icon: "⚠️", label: "Pontos Críticos",  badge: criticalPoints.length },
    { id: "collection", icon: "📦", label: "Pontos de Coleta", badge: pendingCols,  badgeClass: "blue" },
    { id: "volunteers", icon: "🙋", label: "Voluntários",      badge: pendingVols },
  ];

  const sectionTitles = {
    overview:   "Visão Geral",
    events:     "Eventos Oficiais",
    critical:   "Pontos Críticos",
    volunteers: "Voluntários",
    collection: "Pontos de Coleta",
  };

  const adminNome = adminApi.getAdminNome();

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">

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
              <div
                key={item.id}
                className={`nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}
              >
                <span className="nav-icon">{item.icon}</span>
                <span>{item.label}</span>
                {item.badge > 0 && <span className={`nav-badge ${item.badgeClass || ""}`}>{item.badge}</span>}
              </div>
            ))}
          </nav>
          <div className="sidebar-footer">
            <div className="avatar">A</div>
            <div className="avatar-info">
              <div className="avatar-name">{adminNome}</div>
              <div className="avatar-role">ADMIN</div>
            </div>
            <span
              title="Sair"
              onClick={onLogout}
              style={{ color: "var(--text-muted)", cursor: "pointer", fontSize: 14 }}
            >
              ⇤
            </span>
          </div>
        </aside>

        <main className="main">
          <div className="topbar">
            <div>
              <div className="topbar-title">{sectionTitles[section]}</div>
              <div className="topbar-breadcrumb">BASE / {sectionTitles[section]}</div>
            </div>
            <div className="topbar-spacer" />
            {loadError && (
              <div style={{ fontSize: 12, color: "var(--danger)", display: "flex", alignItems: "center", gap: 6 }}>
                ⚠️ {loadError}
                <button className="btn btn-secondary btn-sm" onClick={loadAll}>↺ Retry</button>
              </div>
            )}
            <div className="topbar-status"><div className="status-dot" />Sistema Online</div>
            <button className="topbar-btn" title="Notificações">🔔</button>
            <button className="topbar-btn" title="Configurações">⚙️</button>
          </div>

          <div className="content">
            {section === "overview" && (
              <OverviewSection
                events={events}
                criticalPoints={criticalPoints}
                volunteers={volunteers}
                collectionPoints={collectionPoints}
                onNewEvent={() => setShowNewEvent(true)}
                onNewPoint={() => setShowNewPoint(true)}
              />
            )}
            {section === "events" && (
              <EventsSection
                events={events}
                onSaveEvent={handleSaveEvent}
                criticalPoints={criticalPoints}
                collectionPoints={collectionPoints}
                volunteers={volunteers}
              />
            )}
            {section === "critical" && (
              <CriticalPointsSection
                criticalPoints={criticalPoints}
                onSavePoint={handleSavePoint}
                onDeletePoint={handleDeletePoint}
              />
            )}
            {section === "volunteers" && (
              <VolunteersSection
                volunteers={volunteers}
                onApprove={handleApproveVol}
                onReject={handleRejectVol}
                events={events}
              />
            )}
            {section === "collection" && (
              <CollectionPointsSection
                collectionPoints={collectionPoints}
                onValidate={handleValidateColeta}
                onReject={handleRejectColeta}
              />
            )}
          </div>
        </main>
      </div>

      {showNewEvent && (
        <EventModal
          onClose={() => setShowNewEvent(false)}
          onSave={form => { handleSaveEvent(null, form); setShowNewEvent(false); }}
        />
      )}
      {showNewPoint && (
        <CriticalPointModal
          onClose={() => setShowNewPoint(false)}
          onSave={form => { handleSavePoint(null, form); setShowNewPoint(false); }}
        />
      )}
    </>
  );
}

// ─── Root component ───────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(adminApi.isAuthenticated());

  function handleLogout() {
    adminApi.logout();
    setAuthed(false);
  }

  if (!authed) return <LoginGate onLogin={() => setAuthed(true)} />;
  return <AdminPanel onLogout={handleLogout} />;
}
