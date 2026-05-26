import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding";

const BASE = "http://localhost:8080";
const TOKEN_KEY = "pird_especialista_token";
const USER_KEY  = "pird_especialista_user";
const TAUBATE   = [-45.5533, -23.0268];

const STATUS_LABEL = { pendente: "Aguardando resposta", aceita: "Aceita", recusada: "Recusada" };
const STATUS_COLOR = { pendente: "#f59e0b", aceita: "#22c55e", recusada: "#ef4444" };

const SEV_COLOR = {
  moderado: "#22c55e", medio: "#22c55e", baixo: "#22c55e",
  alto: "#f59e0b",
  critico: "#ef4444",
};

const TIPO_EMOJI = {
  enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥",
  desabamento: "🏚️", acidente_transito: "🚗", intoxicacao: "☣️", outro: "⚠️",
};

function injectPulseCSS() {
  if (document.getElementById("pird-esp-css")) return;
  const s = document.createElement("style");
  s.id = "pird-esp-css";
  s.textContent = `@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}`;
  document.head.appendChild(s);
}

export default function EspecialistaDashboard() {
  const [token,     setToken]     = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user,      setUser]      = useState(() => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } });
  const [activeTab, setActiveTab] = useState("convocacoes");
  const [convs,     setConvs]     = useState([]);
  const [eventos,   setEventos]   = useState([]);
  const [loading,   setLoading]   = useState(false);
  const [fetchErr,  setFetchErr]  = useState(null);

  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [loginErr,  setLoginErr]  = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  useEffect(() => {
    if (token) {
      fetchConvs();
      fetchEventos();
      if (!user?.profissao) fetchPerfil();
    }
  }, [token]);

  async function fetchPerfil() {
    try {
      const res = await fetch(`${BASE}/especialistas/aprovados/perfil`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => {
          const updated = { ...prev, profissao: data.profissao };
          sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch {}
  }

  async function fetchConvs() {
    setLoading(true);
    setFetchErr(null);
    try {
      const res = await fetch(`${BASE}/convocacoes/minhas`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.status === 401) { handleLogout(); return; }
      if (!res.ok) throw new Error("Erro ao carregar convocações.");
      setConvs(await res.json());
    } catch (err) {
      setFetchErr(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function fetchEventos() {
    try {
      const res = await fetch(`${BASE}/eventos/ativos`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setEventos(await res.json());
    } catch {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true);
    setLoginErr(null);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) { setLoginErr("E-mail ou senha inválidos."); return; }
      const data = await res.json();
      const userObj = { nome: data.nome, email: data.email };
      sessionStorage.setItem(TOKEN_KEY, data.token);
      sessionStorage.setItem(USER_KEY, JSON.stringify(userObj));
      setToken(data.token);
      setUser(userObj);
    } catch {
      setLoginErr("Erro de conexão com o servidor.");
    } finally {
      setLoggingIn(false);
    }
  }

  function handleLogout() {
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(USER_KEY);
    setToken(null); setUser(null); setConvs([]); setEventos([]);
  }

  async function handleResponder(id, acao) {
    try {
      const res = await fetch(`${BASE}/convocacoes/${id}/${acao}`, {
        method: "PATCH",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setConvs(prev => prev.map(c =>
        c.id === id ? { ...c, status: acao === "aceitar" ? "aceita" : "recusada" } : c
      ));
    } catch {
      alert("Erro ao responder à convocação.");
    }
  }

  if (!token) return (
    <LoginScreen email={email} setEmail={setEmail} senha={senha} setSenha={setSenha}
      onSubmit={handleLogin} loading={loggingIn} error={loginErr} />
  );

  const relevantEventos = eventos.filter(ev =>
    !user?.profissao || ev.neededProfiles?.includes(user.profissao)
  );

  const pendentes = convs.filter(c => c.status === "pendente").length;

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", padding: "32px 20px" }}>
      <div style={{ maxWidth: 920, margin: "0 auto" }}>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 28 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <img src="/resources/logo.png" alt="PIRD" style={{ width: 36, height: 36, objectFit: "contain" }} />
            <div>
              <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 20, fontWeight: 800, color: "var(--accent)" }}>PIRD</div>
              <div style={{ fontSize: 11, color: "var(--text-secondary)", letterSpacing: "0.1em" }}>PAINEL DO ESPECIALISTA</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 13, color: "var(--text-secondary)" }}>
              Olá, <strong style={{ color: "var(--text-primary)" }}>{user?.nome?.split(" ")[0]}</strong>
              {user?.profissao && <span style={{ color: "var(--text-muted)", marginLeft: 6 }}>· {user.profissao}</span>}
            </span>
            <button onClick={handleLogout}
              style={{ padding: "6px 14px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-muted)", fontSize: 12, cursor: "pointer" }}>
              Sair
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: "flex", gap: 2, marginBottom: 20, borderBottom: "1px solid var(--border)" }}>
          {[
            { id: "convocacoes", label: "Convocações", badge: pendentes || null },
            { id: "mapa", label: "Eventos Relevantes", badge: relevantEventos.length || null },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                display: "flex", alignItems: "center", gap: 7,
                padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer",
                fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700,
                color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
                borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent",
                marginBottom: -1,
              }}>
              {tab.label}
              {tab.badge != null && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99,
                  background: activeTab === tab.id ? "var(--accent)" : "var(--bg-elevated)",
                  color: activeTab === tab.id ? "#fff" : "var(--text-secondary)" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Convocações tab */}
        {activeTab === "convocacoes" && (
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
                Minhas Convocações
              </h2>
              <button onClick={fetchConvs} disabled={loading}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "..." : "↺ Atualizar"}
              </button>
            </div>

            {fetchErr && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 16 }}>
                {fetchErr}
              </div>
            )}

            {!loading && convs.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>
                Nenhuma convocação no momento.
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {convs.map(c => <ConvCard key={c.id} c={c} onResponder={handleResponder} />)}
            </div>
          </div>
        )}

        {/* Mapa tab */}
        {activeTab === "mapa" && (
          <MapaEventos
            eventos={relevantEventos}
            profissao={user?.profissao}
            onRefresh={fetchEventos}
          />
        )}
      </div>
    </div>
  );
}

// ── Convocação card ────────────────────────────────────────────────────────────

function ConvCard({ c, onResponder }) {
  const sevColor = SEV_COLOR[c.eventoSeveridade?.toLowerCase()] ?? "#94a3b8";
  const stColor  = STATUS_COLOR[c.status] ?? "#94a3b8";

  return (
    <div style={{ background: "var(--bg-surface)", border: `1px solid var(--border)`, borderLeft: `4px solid ${sevColor}`, borderRadius: 10, padding: "16px 18px" }}>
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
        <div>
          <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>
            {c.eventoTitulo}
          </div>
          <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
            {c.eventoTipo} · <span style={{ color: sevColor, fontWeight: 600 }}>{c.eventoSeveridade}</span>
          </div>
          {c.eventoEndereco && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>📍 {c.eventoEndereco}</div>
          )}
        </div>
        <span style={{ flexShrink: 0, fontSize: 11, fontWeight: 700, padding: "4px 10px", borderRadius: 20, background: `${stColor}18`, color: stColor, letterSpacing: "0.05em" }}>
          {STATUS_LABEL[c.status] ?? c.status}
        </span>
      </div>

      <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: c.status === "pendente" ? 12 : 0 }}>
        Convocado em {new Date(c.convocadoEm).toLocaleString("pt-BR")}
        {c.respondidoEm && ` · Respondido em ${new Date(c.respondidoEm).toLocaleString("pt-BR")}`}
      </div>

      {c.status === "pendente" && (
        <div style={{ display: "flex", gap: 10 }}>
          <button onClick={() => onResponder(c.id, "aceitar")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✓ Aceitar
          </button>
          <button onClick={() => onResponder(c.id, "recusar")}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.10)", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
            ✗ Recusar
          </button>
        </div>
      )}
    </div>
  );
}

// ── Map of relevant events ─────────────────────────────────────────────────────

function MapaEventos({ eventos, profissao, onRefresh }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const [mapReady,   setMapReady]   = useState(false);
  const [selEvento,  setSelEvento]  = useState(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    injectPulseCSS();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: TAUBATE, zoom: 11,
    });
    map.addControl(new mapboxgl.NavigationControl({ showZoom: true }), "top-right");
    map.on("style.load", () => setMapReady(true));
    mapRef.current = map;
    return () => { map.remove(); setMapReady(false); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    eventos.forEach(ev => {
      if (!ev.lat || !ev.lng) return;
      const color  = SEV_COLOR[ev.severity?.toLowerCase()] ?? "#94a3b8";
      const emoji  = TIPO_EMOJI[ev.type] ?? "⚠️";
      const isCrit = ev.severity?.toLowerCase() === "critico";

      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `
        <div style="position:relative;width:44px;height:44px;">
          ${isCrit ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:.5;animation:pulse-ring 1.5s ease-out infinite;"></div>` : ""}
          <div style="position:absolute;inset:0;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 12px ${color}55;">${emoji}</div>
        </div>`;

      el.addEventListener("click", () => setSelEvento(ev));

      markersRef.current.push(
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([ev.lng, ev.lat])
          .addTo(map)
      );
    });

    if (eventos.length > 0 && eventos[0].lat && eventos[0].lng) {
      map.flyTo({ center: [eventos[0].lng, eventos[0].lat], zoom: 12, speed: 1.2 });
    }
  }, [eventos, mapReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>
          Mapa indisponível. Configure <code>VITE_MAPBOX_TOKEN</code> no <code>.env.local</code>
        </div>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
        <div>
          <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>
            Eventos Ativos
          </h2>
          {profissao && (
            <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>
              Filtrado por: <span style={{ color: "var(--accent)" }}>{profissao}</span>
            </div>
          )}
        </div>
        <button onClick={onRefresh}
          style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>
          ↺ Atualizar
        </button>
      </div>

      <div style={{ position: "relative", height: 500 }}>
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

        {mapReady && eventos.length === 0 && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", zIndex: 10, pointerEvents: "none" }}>
            <div style={{ background: "var(--bg-elevated)", borderRadius: 12, padding: "20px 28px", textAlign: "center", border: "1px solid var(--border)", boxShadow: "0 4px 20px rgba(0,0,0,.2)" }}>
              <div style={{ fontSize: 24, marginBottom: 8 }}>✅</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Nenhum evento ativo para sua especialidade.</div>
            </div>
          </div>
        )}

        {selEvento && (() => {
          const color = SEV_COLOR[selEvento.severity?.toLowerCase()] ?? "#94a3b8";
          return (
            <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.18)", border: `2px solid ${color}`, maxWidth: 290, fontFamily: "system-ui,sans-serif" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {selEvento.severity} · {selEvento.type?.replace(/_/g, " ")}
                </span>
                <button onClick={() => setSelEvento(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, marginLeft: 8 }}>×</button>
              </div>
              <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{selEvento.title}</div>
              {selEvento.address && (
                <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>📍 {selEvento.address}</div>
              )}
              {selEvento.neededProfiles?.length > 0 && (
                <div style={{ fontSize: 11, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", border: "1px solid #e2e8f0" }}>
                  <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Profissionais necessários</div>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                    {selEvento.neededProfiles.map(p => (
                      <span key={p} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "#4b5563" }}>{p}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* Legend */}
        <div style={{ position: "absolute", bottom: 16, right: 12, zIndex: 10, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 13px", fontSize: 11, lineHeight: 1.9, boxShadow: "0 2px 10px rgba(0,0,0,.11)", border: "1px solid #e5e7eb" }}>
          <div style={{ fontWeight: 700, fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Severidade</div>
          {[{ color: "#ef4444", label: "Crítico" }, { color: "#f59e0b", label: "Alto" }, { color: "#22c55e", label: "Médio/Baixo" }].map(i => (
            <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 7, color: "#374151" }}>
              <div style={{ width: 12, height: 12, borderRadius: "50%", background: i.color, flexShrink: 0 }} />
              {i.label}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Login screen ───────────────────────────────────────────────────────────────

function LoginScreen({ email, setEmail, senha, setSenha, onSubmit, loading, error }) {
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>PIRD</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>
          Painel do Especialista
        </p>
      </div>

      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px 28px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Entrar</h2>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>

        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
            style={{ width: "100%", padding: "12px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>

        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>
            {error}
          </div>
        )}

        <button type="submit" disabled={loading}
          style={{ marginTop: 4, padding: "14px", borderRadius: 10, border: "none", background: loading ? "var(--bg-hover)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
          {loading ? "Entrando..." : "Entrar →"}
        </button>
      </form>
    </div>
  );
}
