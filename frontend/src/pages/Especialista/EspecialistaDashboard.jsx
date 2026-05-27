import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../utils/geocoding";
import { maskPhone } from "../../utils/cpfValidator";
import { useGeocodingAutocomplete } from "../../hooks/useGeocodingAutocomplete";

const BASE      = "http://localhost:8080";
const TOKEN_KEY = "pird_especialista_token";
const USER_KEY  = "pird_especialista_user";
const TAUBATE   = [-45.5533, -23.0268];

const STATUS_LABEL = { pendente: "Aguardando resposta", a_caminho: "A caminho", recusada: "Recusada" };
const STATUS_COLOR = { pendente: "#f59e0b", a_caminho: "#3b82f6", recusada: "#ef4444" };
const SEV_COLOR    = { moderado: "#22c55e", medio: "#22c55e", baixo: "#22c55e", alto: "#f59e0b", critico: "#ef4444" };
const TIPO_EMOJI   = { enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥", desabamento: "🏚️", intoxicacao: "☣️", outro: "⚠️" };
const RISCO_COLOR  = { critico: "#FF4444", alto: "#FF6B00", medio: "#F5A623" };

function injectPulseCSS() {
  if (document.getElementById("pird-esp-css")) return;
  const s = document.createElement("style");
  s.id = "pird-esp-css";
  s.textContent = `@keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}`;
  document.head.appendChild(s);
}

function maskCEP(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

// ══════════════════════════════════════════════════════════════════════════════
// Modal de confirmação por senha
// ══════════════════════════════════════════════════════════════════════════════

function ConfirmModal({ title, description, email, onConfirm, onCancel }) {
  const [senha,    setSenha]    = useState("");
  const [error,    setError]    = useState(null);
  const [loading,  setLoading]  = useState(false);

  async function handleConfirm() {
    if (!senha) { setError("Digite sua senha para confirmar."); return; }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, senha }),
      });
      if (!res.ok) { setError("Senha incorreta. Tente novamente."); return; }
      onConfirm();
    } catch {
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.6)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 20 }}>
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px", width: "100%", maxWidth: 380 }}>
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px" }}>{description}</p>

        <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>
          Confirme sua senha
        </label>
        <input
          type="password" value={senha} onChange={e => { setSenha(e.target.value); setError(null); }}
          onKeyDown={e => e.key === "Enter" && handleConfirm()}
          placeholder="••••••••" autoFocus
          style={{ width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: `1.5px solid ${error ? "var(--accent)" : "var(--border)"}`, borderRadius: 8, color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
        />
        {error && <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 12px" }}>{error}</p>}

        <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
          <button onClick={onCancel}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 13, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>
            Cancelar
          </button>
          <button onClick={handleConfirm} disabled={loading}
            style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: loading ? "var(--bg-hover)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff", fontSize: 13, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            {loading ? "Verificando..." : "Confirmar"}
          </button>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Card de convocação
// ══════════════════════════════════════════════════════════════════════════════

function ConvCard({ c, onResponder }) {
  const [pendingAction, setPendingAction] = useState(null);
  const sevColor = SEV_COLOR[c.eventoSeveridade?.toLowerCase()] ?? "#94a3b8";
  const stColor  = STATUS_COLOR[c.status] ?? "#94a3b8";

  return (
    <>
      {pendingAction && (
        <ConfirmModal
          title={pendingAction === "aceitar" ? "Aceitar convocação" : "Recusar convocação"}
          description={`Você está ${pendingAction === "aceitar" ? "aceitando" : "recusando"} a convocação para "${c.eventoTitulo}". Confirme sua senha para prosseguir.`}
          email={window._pirdUserEmail}
          onConfirm={() => { onResponder(c.id, pendingAction); setPendingAction(null); }}
          onCancel={() => setPendingAction(null)}
        />
      )}
      <div style={{ background: "var(--bg-surface)", border: `1px solid var(--border)`, borderLeft: `4px solid ${sevColor}`, borderRadius: 10, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2 }}>{c.eventoTitulo}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {c.eventoTipo?.replace(/_/g, " ")} · <span style={{ color: sevColor, fontWeight: 600 }}>{c.eventoSeveridade}</span>
            </div>
            {c.eventoEndereco && <div style={{ fontSize: 12, color: "var(--text-muted)", marginTop: 4 }}>📍 {c.eventoEndereco}</div>}
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
            <button onClick={() => setPendingAction("aceitar")}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✓ Aceitar
            </button>
            <button onClick={() => setPendingAction("recusar")}
              style={{ flex: 1, padding: "10px", borderRadius: 8, border: "none", background: "rgba(239,68,68,0.10)", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✗ Recusar
            </button>
          </div>
        )}
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Mapa de eventos + lista lateral
// ══════════════════════════════════════════════════════════════════════════════

function MapaEventos({ eventos, convs, criticalPoints = [], profissao, onRefresh, onResponder, onVoluntariar }) {
  const containerRef     = useRef(null);
  const mapRef           = useRef(null);
  const markersRef       = useRef([]);
  const criticoMarkersRef = useRef([]);
  const [mapReady,          setMapReady]          = useState(false);
  const [selEvento,         setSelEvento]         = useState(null);
  const [selCritico,        setSelCritico]        = useState(null);
  const [pendingEv,         setPendingEv]         = useState(null);
  const [pendingVoluntario, setPendingVoluntario] = useState(null);

  // Mapeia eventoId → convocação pendente
  const convByEvento = {};
  convs.forEach(c => { if (c.status === "pendente") convByEvento[c.eventoId] = c; });

  // Mapeia eventoId → qualquer convocação (para ocultar "Quero ajudar" se já convocado)
  const convAnyByEvento = {};
  convs.forEach(c => { convAnyByEvento[c.eventoId] = c; });

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    injectPulseCSS();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({ container: containerRef.current, style: "mapbox://styles/mapbox/streets-v12", center: TAUBATE, zoom: 11, pitch: 45, antialias: true });
    map.addControl(new mapboxgl.NavigationControl({ showZoom: true }), "top-right");
    map.on("style.load", () => {
      const layers = map.getStyle().layers;
      const labelLayer = layers.find(l => l.type === "symbol" && l.layout?.["text-field"]);
      map.addLayer({
        id: "3d-buildings",
        source: "composite",
        "source-layer": "building",
        filter: ["==", "extrude", "true"],
        type: "fill-extrusion",
        minzoom: 15,
        paint: {
          "fill-extrusion-color": "#aaa",
          "fill-extrusion-height": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "height"]],
          "fill-extrusion-base": ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
          "fill-extrusion-opacity": 0.6,
        },
      }, labelLayer?.id);
      setMapReady(true);
    });
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
      el.innerHTML = `<div style="position:relative;width:44px;height:44px;">${isCrit ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:.5;animation:pulse-ring 1.5s ease-out infinite;"></div>` : ""}<div style="position:absolute;inset:0;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:20px;box-shadow:0 0 12px ${color}55;">${emoji}</div></div>`;
      el.addEventListener("click", () => { setSelCritico(null); setSelEvento(ev); });
      markersRef.current.push(new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([ev.lng, ev.lat]).addTo(map));
    });
  }, [eventos, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    criticoMarkersRef.current.forEach(m => m.remove());
    criticoMarkersRef.current = [];
    criticalPoints.forEach(pt => {
      if (!pt.lat || !pt.lng) return;
      const color = RISCO_COLOR[pt.risco] ?? RISCO_COLOR.medio;
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="width:26px;height:26px;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${color};box-shadow:0 0 8px ${color}66;">!</div>`;
      el.addEventListener("click", () => { setSelEvento(null); setSelCritico(pt); });
      criticoMarkersRef.current.push(new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([parseFloat(pt.lng), parseFloat(pt.lat)]).addTo(map));
    });
  }, [criticalPoints, mapReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "48px", textAlign: "center" }}>
        <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
        <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Configure <code>VITE_MAPBOX_TOKEN</code> no <code>.env.local</code></div>
      </div>
    );
  }

  return (
    <>
      {pendingEv && convByEvento[pendingEv.id] && (
        <ConfirmModal
          title="Aceitar convocação"
          description={`Confirme para aceitar a convocação para "${pendingEv.title}".`}
          email={window._pirdUserEmail}
          onConfirm={() => { onResponder(convByEvento[pendingEv.id].id, "aceitar"); setPendingEv(null); }}
          onCancel={() => setPendingEv(null)}
        />
      )}

      {pendingVoluntario && (
        <ConfirmModal
          title="Quero ajudar"
          description={`Você irá comparecer voluntariamente ao evento "${pendingVoluntario.title}". Confirme sua senha para ser marcado como "A caminho".`}
          email={window._pirdUserEmail}
          onConfirm={() => { onVoluntariar(pendingVoluntario.id); setPendingVoluntario(null); }}
          onCancel={() => setPendingVoluntario(null)}
        />
      )}

      <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, overflow: "hidden" }}>
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px 20px", borderBottom: "1px solid var(--border)" }}>
          <div>
            <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Eventos Ativos</h2>
            {profissao && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>Filtrado por: <span style={{ color: "var(--accent)" }}>{profissao}</span></div>}
          </div>
          <button onClick={onRefresh}
            style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: "pointer" }}>
            ↺ Atualizar
          </button>
        </div>

        {/* Corpo: lista + mapa */}
        <div style={{ display: "flex", height: 520 }}>

          {/* Lista lateral */}
          <div style={{ width: 260, flexShrink: 0, borderRight: "1px solid var(--border)", overflowY: "auto", padding: "12px 0" }}>
            {eventos.length === 0 ? (
              <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-muted)", fontSize: 13 }}>
                Nenhum evento ativo para sua especialidade.
              </div>
            ) : eventos.map(ev => {
              const color     = SEV_COLOR[ev.severity?.toLowerCase()] ?? "#94a3b8";
              const emoji     = TIPO_EMOJI[ev.type] ?? "⚠️";
              const convPend  = convByEvento[ev.id];
              const isSelected = selEvento?.id === ev.id;
              return (
                <div key={ev.id}
                  onClick={() => {
                    setSelEvento(ev);
                    if (mapRef.current && ev.lat && ev.lng)
                      mapRef.current.flyTo({ center: [ev.lng, ev.lat], zoom: 14, speed: 1.2 });
                  }}
                  style={{ padding: "12px 14px", cursor: "pointer", borderLeft: `3px solid ${isSelected ? color : "transparent"}`, background: isSelected ? `${color}0d` : "transparent", transition: "all 0.15s", borderBottom: "1px solid var(--border)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{emoji}</span>
                    <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.2 }}>{ev.title}</span>
                  </div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: convPend ? 10 : 0 }}>
                    <span style={{ color, fontWeight: 600 }}>{ev.severity}</span> · {ev.type?.replace(/_/g, " ")}
                  </div>
                  {convPend ? (
                    <button
                      onClick={e => { e.stopPropagation(); setPendingEv(ev); }}
                      style={{ width: "100%", marginTop: 2, padding: "7px", borderRadius: 7, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                      ✓ Aceitar convocação
                    </button>
                  ) : !convAnyByEvento[ev.id] && (
                    <button
                      onClick={e => { e.stopPropagation(); setPendingVoluntario(ev); }}
                      style={{ width: "100%", marginTop: 2, padding: "7px", borderRadius: 7, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#818cf8", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                      🤝 Quero ajudar
                    </button>
                  )}
                </div>
              );
            })}
          </div>

          {/* Mapa */}
          <div style={{ flex: 1, position: "relative" }}>
            <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

            {/* Popup de evento selecionado */}
            {selEvento && (() => {
              const color = SEV_COLOR[selEvento.severity?.toLowerCase()] ?? "#94a3b8";
              return (
                <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.18)", border: `2px solid ${color}`, maxWidth: 270, fontFamily: "system-ui,sans-serif" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{selEvento.severity} · {selEvento.type?.replace(/_/g, " ")}</span>
                    <button onClick={() => setSelEvento(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, marginLeft: 8 }}>×</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{selEvento.title}</div>
                  {selEvento.address && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>📍 {selEvento.address}</div>}
                  {selEvento.neededProfiles?.length > 0 && (
                    <div style={{ fontSize: 11, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", border: "1px solid #e2e8f0" }}>
                      <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Necessário</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                        {selEvento.neededProfiles.map(p => <span key={p} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 7px", fontSize: 10, color: "#4b5563" }}>{p}</span>)}
                      </div>
                    </div>
                  )}
                </div>
              );
            })()}

            {/* Critical point popup */}
            {selCritico && (() => {
              const color = RISCO_COLOR[selCritico.risco] ?? RISCO_COLOR.medio;
              return (
                <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.18)", border: `2px solid ${color}`, maxWidth: 270, fontFamily: "system-ui,sans-serif" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
                    <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase" }}>Ponto Crítico · {selCritico.risco}</span>
                    <button onClick={() => setSelCritico(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, marginLeft: 8 }}>×</button>
                  </div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{selCritico.name || selCritico.nome}</div>
                  {selCritico.address && <div style={{ fontSize: 12, color: "#6b7280" }}>📍 {selCritico.address}</div>}
                  {selCritico.description && <div style={{ fontSize: 12, color: "#374151", marginTop: 4 }}>{selCritico.description}</div>}
                </div>
              );
            })()}

            {/* Legenda */}
            <div style={{ position: "absolute", bottom: 16, right: 12, zIndex: 10, background: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 13px", fontSize: 11, lineHeight: 1.9, boxShadow: "0 2px 10px rgba(0,0,0,.11)", border: "1px solid #e5e7eb" }}>
              <div style={{ fontWeight: 700, fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 6 }}>Legenda</div>
              {[
                { color: "#ef4444", label: "Crítico",       shape: "circle" },
                { color: "#f59e0b", label: "Alto",          shape: "circle" },
                { color: "#22c55e", label: "Médio/Baixo",   shape: "circle" },
                { color: "#FF4444", label: "Ponto Crítico", ring: true },
              ].map(i => (
                <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 7, color: "#374151" }}>
                  {i.ring
                    ? <div style={{ width: 12, height: 12, borderRadius: "50%", background: `${i.color}22`, border: `2px solid ${i.color}`, flexShrink: 0 }} />
                    : <div style={{ width: 12, height: 12, borderRadius: "50%", background: i.color, flexShrink: 0 }} />
                  }
                  {i.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Página de configurações
// ══════════════════════════════════════════════════════════════════════════════

function ConfiguracoesPainel({ user, token, onUpdate }) {
  const [nome,     setNome]     = useState(user?.nome     || "");
  const [telefone, setTelefone] = useState(user?.telefone || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha,      setSenha]     = useState("");
  const [senhaConf,  setSenhaConf] = useState("");
  const [rua,      setRua]      = useState(user?.rua      || "");
  const [numero,   setNumero]   = useState(user?.numero   || "");
  const [bairro,   setBairro]   = useState(user?.bairro   || "");
  const [cidade,   setCidade]   = useState(user?.cidade   || "");
  const [cep,      setCep]      = useState(user?.cep      || "");

  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState(false);
  const [error,    setError]    = useState(null);

  // CEP lookup
  const [cepStatus, setCepStatus] = useState(null);
  async function lookupCEP(raw) {
    const d = raw.replace(/\D/g, "");
    if (d.length !== 8) return;
    setCepStatus("loading");
    try {
      const res = await fetch(`https://viacep.com.br/ws/${d}/json/`);
      const data = await res.json();
      if (data.erro) { setCepStatus("error"); return; }
      setRua(data.logradouro || rua);
      setBairro(data.bairro || bairro);
      setCidade(data.localidade || cidade);
      setCepStatus("ok");
    } catch { setCepStatus("error"); }
  }

  // Rua autocomplete
  const [ruaQuery, setRuaQuery] = useState(false);
  const [ruaFocus, setRuaFocus] = useState(false);
  const { sugestoes: ruaSugs } = useGeocodingAutocomplete(ruaFocus && ruaQuery && rua.length >= 3 ? rua : "");

  async function handleSave() {
    if (senha) {
      if (!senhaAtual)          { setError("Informe a senha atual para alterar a senha."); return; }
      if (senha !== senhaConf)  { setError("A nova senha e a confirmação não coincidem."); return; }
      if (senha.length < 6)     { setError("A nova senha deve ter pelo menos 6 caracteres."); return; }
    }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const body = { nome, telefone, rua, numero, bairro, cidade, cep };
      if (senha) { body.senha = senha; body.senhaAtual = senhaAtual; }
      const res = await fetch(`${BASE}/especialistas/aprovados/${user.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "Erro ao salvar alterações.");
        throw new Error(msg || "Erro ao salvar alterações.");
      }
      const updated = await res.json();
      onUpdate(updated);
      setSenhaAtual(""); setSenha(""); setSenhaConf("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  }

  const inpSt = { width: "100%", padding: "11px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 8, color: "var(--text-primary)", fontSize: 14, outline: "none", boxSizing: "border-box" };
  const lbl   = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 };

  return (
    <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "28px 24px" }}>
      <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 24px" }}>Configurações</h2>

      <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>

        {/* Dados pessoais */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
            Dados pessoais
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div>
              <label style={lbl}>Nome completo</label>
              <input style={inpSt} value={nome} onChange={e => setNome(e.target.value)} placeholder="Seu nome" />
            </div>
            <div>
              <label style={lbl}>Telefone</label>
              <input style={inpSt} inputMode="numeric" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" />
            </div>
          </div>
        </div>

        {/* Senha */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
            Alterar senha <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(deixe em branco para manter)</span>
          </div>
          <div>
            <label style={lbl}>Senha Atual</label>
            <input type="password" style={inpSt} value={senhaAtual}
              onChange={e => { setSenhaAtual(e.target.value); setError(null); }}
              placeholder="••••••••" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Nova senha</label>
              <input type="password" style={inpSt} value={senha}
                onChange={e => { setSenha(e.target.value); setError(null); }}
                placeholder="••••••••" />
            </div>
            <div style={{ flex: 1 }}>
              <label style={lbl}>Confirmar nova senha</label>
              <input type="password" style={{ ...inpSt, borderColor: senhaConf && senha !== senhaConf ? "var(--accent)" : "var(--border)" }}
                value={senhaConf} onChange={e => { setSenhaConf(e.target.value); setError(null); }}
                placeholder="••••••••" />
            </div>
          </div>
        </div>

        {/* Endereço */}
        <div>
          <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" }}>
            Endereço
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              {/* CEP */}
              <div style={{ flex: "0 0 150px" }}>
                <label style={lbl}>CEP</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inpSt, borderColor: cepStatus === "ok" ? "#22c55e" : cepStatus === "error" ? "var(--accent)" : "var(--border)" }}
                    inputMode="numeric" placeholder="00000-000" value={cep}
                    onChange={e => { const v = maskCEP(e.target.value); setCep(v); setCepStatus(null); if (v.replace(/\D/g,"").length === 8) lookupCEP(v); }} />
                  {cepStatus === "loading" && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>⟳</span>}
                  {cepStatus === "ok"      && <span style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#22c55e" }}>✓</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Cidade</label>
                <input style={inpSt} value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" />
              </div>
            </div>

            {/* Rua com autocomplete */}
            <div style={{ position: "relative" }}>
              <label style={lbl}>Rua / Avenida</label>
              <input style={inpSt} value={rua}
                onChange={e => { setRua(e.target.value); setRuaQuery(true); }}
                onFocus={() => setRuaFocus(true)}
                onBlur={() => setTimeout(() => setRuaFocus(false), 150)}
                placeholder="Rua das Flores" />
              {ruaFocus && ruaSugs.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,.15)", overflow: "hidden" }}>
                  {ruaSugs.map(s => (
                    <div key={s.id} onMouseDown={() => { setRua(s.shortName || s.placeName.split(",")[0]); setRuaQuery(false); setRuaFocus(false); }}
                      style={{ padding: "9px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13 }}
                      onMouseEnter={e => e.currentTarget.style.background = "var(--bg-hover)"}
                      onMouseLeave={e => e.currentTarget.style.background = "transparent"}>
                      <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>{s.shortName}</div>
                      <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 2 }}>{s.placeName}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 100px" }}>
                <label style={lbl}>Número</label>
                <input style={inpSt} value={numero} onChange={e => setNumero(e.target.value)} placeholder="123" />
              </div>
              <div style={{ flex: 1 }}>
                <label style={lbl}>Bairro</label>
                <input style={inpSt} value={bairro} onChange={e => setBairro(e.target.value)} placeholder="Centro" />
              </div>
            </div>
          </div>
        </div>

        {/* Feedback */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{error}</div>
        )}
        {success && (
          <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#22c55e" }}>✅ Alterações salvas com sucesso.</div>
        )}

        <button onClick={handleSave} disabled={saving}
          style={{ padding: "13px", borderRadius: 10, border: "none", background: saving ? "var(--bg-hover)" : "var(--accent)", color: saving ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Dashboard principal
// ══════════════════════════════════════════════════════════════════════════════

export default function EspecialistaDashboard() {
  const [token,          setToken]          = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user,           setUser]           = useState(() => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } });
  const [activeTab,      setActiveTab]      = useState("convocacoes");
  const [convs,          setConvs]          = useState([]);
  const [eventos,        setEventos]        = useState([]);
  const [pontosCriticos, setPontosCriticos] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [fetchErr,       setFetchErr]       = useState(null);

  const [email,     setEmail]     = useState("");
  const [senha,     setSenha]     = useState("");
  const [loginErr,  setLoginErr]  = useState(null);
  const [loggingIn, setLoggingIn] = useState(false);

  // Expõe email globalmente para o ConfirmModal (evita prop drilling profundo)
  useEffect(() => { if (user?.email) window._pirdUserEmail = user.email; }, [user]);

  // Fetch inicial + polling a cada 30s
  useEffect(() => {
    if (!token) return;
    fetchConvs();
    fetchEventos();
    fetchPontosCriticos();
    if (!user?.profissao) fetchPerfil();
    const id = setInterval(fetchConvs, 30_000);
    return () => clearInterval(id);
  }, [token]);

  async function fetchPerfil() {
    try {
      const res = await fetch(`${BASE}/especialistas/aprovados/perfil`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => {
          const updated = { ...prev, ...data };
          sessionStorage.setItem(USER_KEY, JSON.stringify(updated));
          return updated;
        });
      }
    } catch {}
  }

  async function fetchConvs() {
    setLoading(true); setFetchErr(null);
    try {
      const res = await fetch(`${BASE}/convocacoes/minhas`, { headers: { Authorization: `Bearer ${token}` } });
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
      const res = await fetch(`${BASE}/eventos/ativos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setEventos(await res.json());
    } catch {}
  }

  async function fetchPontosCriticos() {
    try {
      const res = await fetch(`${BASE}/pontos-criticos`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) setPontosCriticos(await res.json());
    } catch {}
  }

  async function handleLogin(e) {
    e.preventDefault();
    setLoggingIn(true); setLoginErr(null);
    try {
      const res = await fetch(`${BASE}/auth/login`, {
        method: "POST", headers: { "Content-Type": "application/json" },
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
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
    setToken(null); setUser(null); setConvs([]); setEventos([]); setPontosCriticos([]);
    window._pirdUserEmail = null;
  }

  async function handleResponder(id, acao) {
    try {
      const res = await fetch(`${BASE}/convocacoes/${id}/${acao}`, {
        method: "PATCH", headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error();
      setConvs(prev => prev.map(c => c.id === id ? { ...c, status: acao === "aceitar" ? "a_caminho" : "recusada", respondidoEm: new Date().toISOString() } : c));
    } catch {
      alert("Erro ao responder à convocação.");
    }
  }

  async function handleVoluntariar(eventoId) {
    try {
      const res = await fetch(`${BASE}/convocacoes/evento/${eventoId}/voluntario`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const msg = await res.text().catch(() => "");
        alert(msg || "Erro ao registrar presença no evento.");
        return;
      }
      const data = await res.json();
      setConvs(prev => [...prev, data]);
    } catch {
      alert("Erro de conexão ao registrar presença.");
    }
  }

  function handleProfileUpdate(updated) {
    const merged = { ...user, ...updated };
    setUser(merged);
    sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  if (!token) return (
    <LoginScreen email={email} setEmail={setEmail} senha={senha} setSenha={setSenha}
      onSubmit={handleLogin} loading={loggingIn} error={loginErr} />
  );

  const relevantEventos = eventos.filter(ev =>
    !user?.profissao || ev.neededProfiles?.includes(user.profissao)
  );
  const pendentes = convs.filter(c => c.status === "pendente").length;

  const TABS = [
    { id: "convocacoes", label: "Convocações",        badge: pendentes || null },
    { id: "mapa",        label: "Eventos Relevantes", badge: relevantEventos.length || null },
    { id: "config",      label: "Configurações",      badge: null },
  ];

  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", padding: "32px 20px" }}>
      <div style={{ maxWidth: 960, margin: "0 auto" }}>

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
          {TABS.map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{ display: "flex", alignItems: "center", gap: 7, padding: "10px 18px", border: "none", background: "transparent", cursor: "pointer", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)", borderBottom: activeTab === tab.id ? "2px solid var(--accent)" : "2px solid transparent", marginBottom: -1 }}>
              {tab.label}
              {tab.badge != null && (
                <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99, background: activeTab === tab.id ? "var(--accent)" : "var(--bg-elevated)", color: activeTab === tab.id ? "#fff" : "var(--text-secondary)" }}>
                  {tab.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Conteúdo das tabs */}
        {activeTab === "convocacoes" && (
          <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 20 }}>
              <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Minhas Convocações</h2>
              <button onClick={fetchConvs} disabled={loading}
                style={{ padding: "6px 12px", borderRadius: 7, border: "1px solid var(--border)", background: "transparent", color: "var(--accent)", fontSize: 12, cursor: loading ? "not-allowed" : "pointer" }}>
                {loading ? "..." : "↺ Atualizar"}
              </button>
            </div>

            {fetchErr && (
              <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444", marginBottom: 16 }}>{fetchErr}</div>
            )}

            {!loading && convs.length === 0 && (
              <div style={{ textAlign: "center", padding: "40px 0", color: "var(--text-muted)", fontSize: 14 }}>Nenhuma convocação no momento.</div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
              {convs.map(c => <ConvCard key={c.id} c={c} onResponder={handleResponder} />)}
            </div>
          </div>
        )}

        {activeTab === "mapa" && (
          <MapaEventos
            eventos={relevantEventos}
            convs={convs}
            criticalPoints={pontosCriticos}
            profissao={user?.profissao}
            onRefresh={() => { fetchEventos(); fetchPontosCriticos(); }}
            onResponder={handleResponder}
            onVoluntariar={handleVoluntariar}
          />
        )}

        {activeTab === "config" && (
          <ConfiguracoesPainel
            user={{ ...user, id: user?.id }}
            token={token}
            onUpdate={handleProfileUpdate}
          />
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Tela de login
// ══════════════════════════════════════════════════════════════════════════════

function LoginScreen({ email, setEmail, senha, setSenha, onSubmit, loading, error }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>PIRD</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>Painel do Especialista</p>
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
          <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 8, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{error}</div>
        )}

        <button type="submit" disabled={loading}
          style={{ marginTop: 4, padding: "14px", borderRadius: 10, border: "none", background: loading ? "var(--bg-hover)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer", letterSpacing: "0.08em" }}>
          {loading ? "Entrando..." : "Entrar →"}
        </button>

        <button type="button" onClick={() => navigate("/login")}
          style={{ background: "none", border: "none", color: "var(--text-muted)", fontSize: 12, cursor: "pointer", fontFamily: "monospace", letterSpacing: "0.04em", padding: 0, alignSelf: "flex-start" }}>
          ← Voltar à tela inicial
        </button>
      </form>
    </div>
  );
}
