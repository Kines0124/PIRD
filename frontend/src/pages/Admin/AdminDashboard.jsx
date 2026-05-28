import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { styles } from "./adminTheme.jsx";
import * as adminApi from "../../services/adminApi.js";
import OverviewSection         from "./sections/OverviewSection.jsx";
import DashboardSection        from "./sections/DashboardSection.jsx";
import EventsSection           from "./sections/EventsSection.jsx";
import CampoSection            from "./sections/CampoSection.jsx";
import CriticalPointsSection   from "./sections/CriticalPointsSection.jsx";
import ValidacoesSection       from "./sections/ValidacoesSection.jsx";
import CollectionPointsSection from "./sections/CollectionPointsSection.jsx";
import EspecialistasSection    from "./sections/EspecialistasSection.jsx";
import EventModal              from "./modals/EventModal.jsx";
import CriticalPointModal      from "./modals/CriticalPointModal.jsx";

// ─── Login gate ───────────────────────────────────────────────────────────────

function LoginGate({ onLogin }) {
  const [email,   setEmail]   = useState("");
  const [senha,   setSenha]   = useState("");
  const [error,   setError]   = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

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
                <input className="form-input" type="email" value={email}
                  onChange={e => setEmail(e.target.value)} placeholder="admin@pird.com" autoFocus />
              </div>
              <div className="form-group">
                <label className="form-label">Senha</label>
                <input className="form-input" type="password" value={senha}
                  onChange={e => setSenha(e.target.value)} placeholder="••••••••" />
              </div>
              {error && (
                <div style={{ color: "var(--danger)", fontSize: 13, background: "rgba(255,59,59,0.08)", border: "1px solid rgba(255,59,59,0.25)", borderRadius: 6, padding: "8px 12px" }}>
                  {error}
                </div>
              )}
              <button className="btn btn-primary" type="submit"
                disabled={loading || !email || !senha} style={{ opacity: loading || !email || !senha ? 0.5 : 1 }}>
                {loading ? "Entrando…" : "Entrar"}
              </button>
            </form>
            <button
              onClick={() => navigate("/login")}
              style={{ marginTop: 16, background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em", padding: 0 }}
              onMouseEnter={e => e.currentTarget.style.color = "var(--text-secondary)"}
              onMouseLeave={e => e.currentTarget.style.color = "var(--text-muted)"}
            >
              ← Voltar à tela inicial
            </button>
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
  const [registros,        setRegistros]        = useState([]);
  const [specialists,      setSpecialists]      = useState([]);
  const [loadError,        setLoadError]        = useState(null);

  const [showNewEvent, setShowNewEvent] = useState(false);
  const [showNewPoint, setShowNewPoint] = useState(false);

  // Statuses de campo dos especialistas (local — provisório)
  const [specialistStatuses, setSpecialistStatuses] = useState({});
  // ID de evento a abrir automaticamente em EventsSection
  const [pendingOpenEventId, setPendingOpenEventId] = useState(null);

  // Notifications dropdown
  const [showNotifs, setShowNotifs] = useState(false);

  // Settings modal
  const [showSettings,       setShowSettings]       = useState(false);
  const [settingsNome,       setSettingsNome]       = useState("");
  const [settingsSenhaAtual, setSettingsSenhaAtual] = useState("");
  const [settingsSenha,      setSettingsSenha]      = useState("");
  const [settingsConfirm,    setSettingsConfirm]    = useState("");
  const [settingsEmail,      setSettingsEmail]      = useState("");
  const [settingsSaving,     setSettingsSaving]     = useState(false);
  const [settingsMsg,        setSettingsMsg]        = useState(null);

  async function loadAll() {
    try {
      const [evts, pts, vols, cols, specs, regs] = await Promise.all([
        adminApi.getEventos(),
        adminApi.getPontosCriticos(),
        adminApi.getVoluntarios(),
        adminApi.getPontosColeta(),
        adminApi.getEspecialistas(),
        adminApi.getRegistrosPontoColeta(),
      ]);
      setEvents(evts);
      setCriticalPoints(pts);
      setVolunteers(vols);
      setCollectionPoints(cols);
      setSpecialists(specs);
      setRegistros(regs);
      setLoadError(null);
    } catch (e) {
      setLoadError("Erro ao carregar dados: " + e.message);
    }
  }

  useEffect(() => { loadAll(); }, []);

  async function openSettings() {
    setSettingsSaving(false);
    setSettingsMsg(null);
    setSettingsSenhaAtual("");
    setSettingsSenha("");
    setSettingsConfirm("");
    try {
      const perfil = await adminApi.getAdminPerfil();
      setSettingsNome(perfil.nome || "");
      setSettingsEmail(perfil.email || "");
    } catch {
      setSettingsNome(adminApi.getAdminNome());
      setSettingsEmail("");
    }
    setShowSettings(true);
  }

  async function handleSaveSettings() {
    if (settingsSenha.trim()) {
      if (!settingsSenhaAtual.trim()) {
        setSettingsMsg({ ok: false, text: "Informe a senha atual para alterar a senha." });
        return;
      }
      if (settingsSenha !== settingsConfirm) {
        setSettingsMsg({ ok: false, text: "A nova senha e a confirmação não coincidem." });
        return;
      }
      if (settingsSenha.trim().length < 6) {
        setSettingsMsg({ ok: false, text: "A nova senha deve ter pelo menos 6 caracteres." });
        return;
      }
    }
    setSettingsSaving(true);
    setSettingsMsg(null);
    try {
      const body = {};
      if (settingsNome.trim())       body.nome       = settingsNome.trim();
      if (settingsSenha.trim())      body.senha      = settingsSenha.trim();
      if (settingsSenhaAtual.trim()) body.senhaAtual = settingsSenhaAtual.trim();
      await adminApi.updateAdminPerfil(body);
      if (body.nome) sessionStorage.setItem("admin_nome", body.nome);
      setSettingsMsg({ ok: true, text: "Perfil atualizado com sucesso." });
      setSettingsSenhaAtual("");
      setSettingsSenha("");
      setSettingsConfirm("");
    } catch (e) {
      setSettingsMsg({ ok: false, text: e.message || "Erro ao salvar." });
    } finally {
      setSettingsSaving(false);
    }
  }

  function handleUpdateSpecialistStatus(id, status) {
    setSpecialistStatuses(prev => ({ ...prev, [String(id)]: status }));
  }

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

  async function handleAprovarRegistro(id) {
    try {
      await adminApi.aprovarRegistroPontoColeta(id);
      const [cols, regs] = await Promise.all([
        adminApi.getPontosColeta(),
        adminApi.getRegistrosPontoColeta(),
      ]);
      setCollectionPoints(cols);
      setRegistros(regs);
    } catch (e) { alert("Erro ao aprovar cadastro: " + e.message); }
  }

  async function handleRejeitarRegistro(id, obs) {
    try {
      await adminApi.rejeitarRegistroPontoColeta(id, obs);
      setRegistros(await adminApi.getRegistrosPontoColeta());
    } catch (e) { alert("Erro ao rejeitar cadastro: " + e.message); }
  }

  async function handleAprovarEspecialista(id) {
    try {
      await adminApi.aprovarEspecialista(id);
      setSpecialists(await adminApi.getEspecialistas());
    } catch (e) { alert("Erro ao aprovar especialista: " + e.message); }
  }

  async function handleReprovarEspecialista(id, obs) {
    try {
      await adminApi.reprovarEspecialista(id, obs);
      setSpecialists(await adminApi.getEspecialistas());
    } catch (e) { alert("Erro ao reprovar especialista: " + e.message); }
  }

  async function handleDeletarEspecialista(id) {
    try {
      await adminApi.deletarEspecialista(id);
      setSpecialists(specs => specs.filter(s => s.id !== id));
    } catch (e) { alert("Erro ao deletar especialista: " + e.message); }
  }

  const pendingCols          = registros.filter(r => r.status === "pendente").length;
  const pendingEspecialistas = specialists.filter(s => s.status === "pendente").length;
  const activeEvents         = events.filter(e => e.status === "ativo").length;
  const totalNotifs          = pendingCols + pendingEspecialistas + activeEvents;

  const navItems = [
    { id: "overview",      icon: "◉",  label: "Visão Geral" },
    { id: "dashboard",    icon: "📊", label: "Dashboard" },
    { id: "events",       icon: "🌊", label: "Eventos",          badge: events.filter(e => e.status === "ativo").length },
    { id: "campo",        icon: "🗺️", label: "Campo" },
    { id: "especialistas",icon: "⚕️", label: "Especialistas",    badge: specialists.filter(s => s.status === "aprovado").length, badgeClass: "blue" },
    { id: "critical",     icon: "⚠️", label: "Pontos Críticos",  badge: criticalPoints.length },
    { id: "collection",   icon: "📦", label: "Pontos de Coleta" },
    { id: "validacoes",   icon: "🙋", label: "Validações",       badge: pendingEspecialistas + pendingCols },
  ];

  const sectionTitles = {
    overview:       "Visão Geral",
    dashboard:      "Dashboard",
    events:         "Eventos Oficiais",
    campo:          "Campo",
    especialistas:  "Especialistas Aprovados",
    critical:       "Pontos Críticos",
    collection:     "Pontos de Coleta",
    validacoes:     "Validações de Cadastro",
  };

  const adminNome = adminApi.getAdminNome();

  return (
    <>
      <style>{styles}</style>
      <div className="app-shell">

        <aside className="sidebar">
          <div className="sidebar-logo">
            <img src="/resources/logo.png" alt="Logo"
              style={{ width: 100, height: 100, borderRadius: 8, objectFit: "contain" }} />
          </div>
          <nav className="sidebar-nav">
            <div className="nav-section-label">Painel</div>
            {navItems.map(item => (
              <div key={item.id} className={`nav-item ${section === item.id ? "active" : ""}`}
                onClick={() => setSection(item.id)}>
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
            <button
              onClick={onLogout}
              style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.3)", borderRadius: 6, color: "#ef4444", fontWeight: 700, fontSize: 12, padding: "5px 10px", cursor: "pointer", letterSpacing: "0.05em", transition: "all 0.15s", flexShrink: 0 }}
              onMouseEnter={e => { e.currentTarget.style.background = "rgba(239,68,68,0.22)"; e.currentTarget.style.borderColor = "#ef4444"; }}
              onMouseLeave={e => { e.currentTarget.style.background = "rgba(239,68,68,0.12)"; e.currentTarget.style.borderColor = "rgba(239,68,68,0.3)"; }}
            >
              Sair
            </button>
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
            <div style={{ position: "relative" }}>
              <button
                className="topbar-btn"
                title="Notificações"
                onClick={() => setShowNotifs(v => !v)}
                style={{ position: "relative" }}
              >
                🔔
                {totalNotifs > 0 && (
                  <span style={{ position: "absolute", top: 2, right: 2, minWidth: 16, height: 16, borderRadius: 99, background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 3px" }}>
                    {totalNotifs}
                  </span>
                )}
              </button>
              {showNotifs && (
                <div
                  style={{ position: "absolute", top: "calc(100% + 8px)", right: 0, width: 300, background: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, zIndex: 300, overflow: "hidden", boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
                  onMouseLeave={() => setShowNotifs(false)}
                >
                  <div style={{ padding: "12px 16px 8px", fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", borderBottom: "1px solid var(--border)" }}>
                    Notificações
                  </div>
                  {[
                    { count: pendingEspecialistas, label: "Especialistas aguardando validação", icon: "⚕️", target: "validacoes" },
                    { count: pendingCols,          label: "Pontos de coleta pendentes",         icon: "📦", target: "validacoes" },
                    { count: activeEvents,         label: "Eventos ativos no momento",          icon: "🌊", target: "events" },
                  ].map(n => (
                    <div
                      key={n.target}
                      onClick={() => { setSection(n.target); setShowNotifs(false); }}
                      style={{ padding: "11px 16px", display: "flex", alignItems: "center", gap: 10, cursor: "pointer", borderBottom: "1px solid var(--border)", transition: "background 0.1s" }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-elevated)"}
                      onMouseLeave={e => e.currentTarget.style.background = ""}
                    >
                      <span style={{ fontSize: 18, flexShrink: 0 }}>{n.icon}</span>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12.5, color: "var(--text-primary)", fontWeight: 500 }}>{n.label}</div>
                      </div>
                      <span style={{ minWidth: 22, height: 22, borderRadius: 99, background: n.count > 0 ? (n.target === "events" ? "rgba(59,130,246,0.2)" : "rgba(239,68,68,0.15)") : "var(--bg-elevated)", color: n.count > 0 ? (n.target === "events" ? "#3b82f6" : "#ef4444") : "var(--text-muted)", fontSize: 11, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", padding: "0 5px", flexShrink: 0 }}>
                        {n.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <button className="topbar-btn" title="Configurações" onClick={openSettings}>⚙️</button>
          </div>

          {section === "campo" ? (
            <div style={{ flex: 1, overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <CampoSection
                events={events}
                criticalPoints={criticalPoints}
                specialists={specialists}
                specialistStatuses={specialistStatuses}
                onGoToEvent={(id) => { setPendingOpenEventId(String(id)); setSection("events"); }}
              />
            </div>
          ) : (
            <div className="content">
              {section === "overview" && (
                <OverviewSection
                  events={events}
                  criticalPoints={criticalPoints}
                  volunteers={volunteers}
                  collectionPoints={collectionPoints}
                  specialists={specialists}
                  onNewEvent={() => setShowNewEvent(true)}
                  onNewPoint={() => setShowNewPoint(true)}
                  onGoToCritical={() => setSection("critical")}
                />
              )}
              {section === "dashboard" && (
                <DashboardSection
                  events={events}
                  criticalPoints={criticalPoints}
                  collectionPoints={collectionPoints}
                  specialists={specialists}
                  volunteers={volunteers}
                />
              )}
              {section === "events" && (
                <EventsSection
                  events={events}
                  onSaveEvent={handleSaveEvent}
                  criticalPoints={criticalPoints}
                  collectionPoints={collectionPoints}
                  volunteers={volunteers}
                  specialists={specialists}
                  specialistStatuses={specialistStatuses}
                  onUpdateStatus={handleUpdateSpecialistStatus}
                  openEventId={pendingOpenEventId}
                  onEventOpened={() => setPendingOpenEventId(null)}
                />
              )}
              {section === "critical" && (
                <CriticalPointsSection
                  criticalPoints={criticalPoints}
                  onSavePoint={handleSavePoint}
                  onDeletePoint={handleDeletePoint}
                />
              )}
              {section === "collection" && (
                <CollectionPointsSection
                  collectionPoints={collectionPoints}
                />
              )}
              {section === "especialistas" && (
                <EspecialistasSection
                  specialists={specialists}
                  specialistStatuses={specialistStatuses}
                  onUpdateStatus={handleUpdateSpecialistStatus}
                  onDelete={handleDeletarEspecialista}
                />
              )}
              {section === "validacoes" && (
                <ValidacoesSection
                  specialists={specialists}
                  onAprovar={handleAprovarEspecialista}
                  onReprovar={handleReprovarEspecialista}
                  onDeletar={handleDeletarEspecialista}
                  registros={registros}
                  onAprovarRegistro={handleAprovarRegistro}
                  onRejeitarRegistro={handleRejeitarRegistro}
                />
              )}
            </div>
          )}
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

      {showSettings && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowSettings(false)}>
          <div className="modal" style={{ maxWidth: 440 }}>
            <div className="modal-header">
              <div className="modal-title">⚙️ Configurações do Perfil</div>
              <button className="modal-close" onClick={() => setShowSettings(false)}>✕</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label className="form-label">E-mail (somente leitura)</label>
                <input className="form-input" value={settingsEmail} readOnly
                  style={{ opacity: 0.6, cursor: "default", color: "var(--text-muted)" }} />
              </div>
              <div className="form-group">
                <label className="form-label">Nome</label>
                <input className="form-input" value={settingsNome}
                  onChange={e => setSettingsNome(e.target.value)}
                  placeholder="Seu nome completo" />
              </div>
              <div className="form-group">
                <label className="form-label">Senha Atual</label>
                <input className="form-input" type="password" value={settingsSenhaAtual}
                  onChange={e => { setSettingsSenhaAtual(e.target.value); setSettingsMsg(null); }}
                  placeholder="Digite sua senha atual" />
              </div>
              <div className="form-group">
                <label className="form-label">Nova Senha</label>
                <input className="form-input" type="password" value={settingsSenha}
                  onChange={e => { setSettingsSenha(e.target.value); setSettingsMsg(null); }}
                  placeholder="Deixe em branco para manter a atual" />
              </div>
              <div className="form-group">
                <label className="form-label">Confirmar Nova Senha</label>
                <input className="form-input" type="password" value={settingsConfirm}
                  onChange={e => { setSettingsConfirm(e.target.value); setSettingsMsg(null); }}
                  placeholder="Repita a nova senha"
                  style={{ borderColor: settingsConfirm && settingsSenha !== settingsConfirm ? "var(--danger)" : undefined }} />
              </div>
              {settingsMsg && (
                <div style={{ fontSize: 13, padding: "8px 12px", borderRadius: 6, background: settingsMsg.ok ? "rgba(34,197,94,0.08)" : "rgba(239,68,68,0.08)", border: `1px solid ${settingsMsg.ok ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`, color: settingsMsg.ok ? "#22c55e" : "#ef4444" }}>
                  {settingsMsg.text}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setShowSettings(false)}>Cancelar</button>
              <button className="btn btn-primary" disabled={settingsSaving} style={{ opacity: settingsSaving ? 0.5 : 1 }} onClick={handleSaveSettings}>
                {settingsSaving ? "Salvando..." : "💾 Salvar"}
              </button>
            </div>
          </div>
        </div>
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
