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

const STATUS_LABEL = { pendente: "Aguardando resposta", a_caminho: "A caminho", no_local: "No local", recusada: "Recusada" };
const STATUS_COLOR = { pendente: "#f59e0b", a_caminho: "#3b82f6", no_local: "#22c55e", recusada: "#ef4444" };
const SEV_COLOR    = { moderado: "#22c55e", medio: "#22c55e", baixo: "#22c55e", alto: "#f59e0b", critico: "#ef4444" };
const TIPO_EMOJI   = { enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥", desabamento: "🏚️", intoxicacao: "☣️", outro: "⚠️" };
const RISCO_COLOR  = { critico: "#FF4444", alto: "#FF6B00", medio: "#F5A623" };

function injectCSS() {
  if (document.getElementById("pird-esp-css")) return;
  const s = document.createElement("style");
  s.id = "pird-esp-css";
  s.textContent = `
    @keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
    @keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}
    @keyframes fadeIn{from{opacity:0}to{opacity:1}}
    .esp-sheet{transition:transform 0.35s cubic-bezier(0.32,0.72,0,1);}
    .esp-tab-btn{transition:all 0.15s ease;}
    .esp-card{transition:all 0.15s ease;}
    .bottom-nav-btn { transition: all 0.18s ease; }
    .bottom-nav-btn:active { transform: scale(0.92); }
  `;
  document.head.appendChild(s);
}

function maskCEP(v) {
  const d = v.replace(/\D/g, "").slice(0, 8);
  return d.length > 5 ? d.slice(0, 5) + "-" + d.slice(5) : d;
}

// ── Modal genérico de confirmação ─────────────────────────────────────────────
function ConfirmModal({ title, description, email, onConfirm, onCancel, requirePassword = true, confirmLabel = "Confirmar", confirmColor = "var(--accent)" }) {
  const [senha, setSenha]     = useState("");
  const [error, setError]     = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleConfirm() {
    if (requirePassword) {
      if (!senha) { setError("Digite sua senha para confirmar."); return; }
      setLoading(true); setError(null);
      try {
        const res = await fetch(`${BASE}/auth/login`, {
          method: "POST", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, senha }),
        });
        if (!res.ok) { setError("Senha incorreta. Tente novamente."); return; }
        onConfirm();
      } catch { setError("Erro de conexão. Tente novamente."); }
      finally { setLoading(false); }
    } else {
      onConfirm();
    }
  }

  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "flex-end", justifyContent: "center", padding: "0 0 env(safe-area-inset-bottom,0)" }}>
      <div style={{ background: "var(--bg-elevated)", borderRadius: "20px 20px 0 0", padding: "28px 24px 32px", width: "100%", maxWidth: 480, animation: "slideUp 0.3s ease" }}>
        <div style={{ width: 36, height: 4, borderRadius: 2, background: "var(--border)", margin: "0 auto 20px" }} />
        <h3 style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)", margin: "0 0 6px" }}>{title}</h3>
        <p style={{ fontSize: 13, color: "var(--text-secondary)", margin: "0 0 20px", lineHeight: 1.5 }}>{description}</p>
        {requirePassword && (
          <>
            <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Confirme sua senha</label>
            <input type="password" value={senha} onChange={e => { setSenha(e.target.value); setError(null); }}
              onKeyDown={e => e.key === "Enter" && handleConfirm()}
              placeholder="••••••••" autoFocus
              style={{ width: "100%", padding: "14px", background: "var(--bg-surface)", border: `1.5px solid ${error ? "var(--accent)" : "var(--border)"}`, borderRadius: 12, color: "var(--text-primary)", fontSize: 16, outline: "none", boxSizing: "border-box", marginBottom: 8 }}
            />
            {error && <p style={{ fontSize: 12, color: "var(--accent)", margin: "0 0 12px" }}>{error}</p>}
          </>
        )}
        <div style={{ display: "flex", gap: 10, marginTop: 8 }}>
          <button onClick={onCancel} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "1px solid var(--border)", background: "transparent", color: "var(--text-secondary)", fontSize: 14, cursor: "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 600 }}>Cancelar</button>
          <button onClick={handleConfirm} disabled={loading} style={{ flex: 1, padding: "14px", borderRadius: 12, border: "none", background: loading ? "var(--bg-hover)" : confirmColor, color: loading ? "var(--text-muted)" : "#fff", fontSize: 14, cursor: loading ? "not-allowed" : "pointer", fontFamily: "'Syne', sans-serif", fontWeight: 700 }}>
            {loading ? "Verificando..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Bottom Sheet (apenas para a aba Eventos) ──────────────────────────────────
function BottomSheet({ children, state, onStateChange }) {
  const heights = { peek: "160px", half: "52vh", full: "91vh" };
  const ref = useRef(null);
  const startY = useRef(null);

  function onTouchStart(e) { startY.current = e.touches[0].clientY; }
  function onTouchEnd(e) {
    const dy = startY.current - e.changedTouches[0].clientY;
    if (Math.abs(dy) < 20) return;
    if (dy > 0) {
      if (state === "peek") onStateChange("half");
      if (state === "half") onStateChange("full");
    } else {
      if (state === "full") onStateChange("half");
      if (state === "half") onStateChange("peek");
    }
  }

  return (
    <div
      ref={ref}
      className="esp-sheet"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
      style={{
        position: "fixed", left: 0, right: 0,
        bottom: 64, // above the bottom nav
        height: heights[state],
        background: "var(--bg-base)",
        borderRadius: "20px 20px 0 0",
        boxShadow: "0 -4px 32px rgba(0,0,0,0.35)",
        zIndex: 50,
        display: "flex", flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <div
        onClick={() => onStateChange(state === "peek" ? "half" : state === "half" ? "full" : "half")}
        style={{ flexShrink: 0, padding: "12px 0 4px", display: "flex", alignItems: "center", justifyContent: "center", cursor: "pointer" }}
      >
        <div style={{ width: 40, height: 4, borderRadius: 2, background: "var(--border)" }} />
      </div>
      <div style={{ flex: 1, overflowY: state === "peek" ? "hidden" : "auto", padding: "0 0 8px" }}>
        {children}
      </div>
    </div>
  );
}

// ── Card de convocação ────────────────────────────────────────────────────────
function ConvCard({ c, onResponder, onChegada, userEmail }) {
  const [pendingAction, setPendingAction] = useState(null);
  const sevColor = SEV_COLOR[c.eventoSeveridade?.toLowerCase()] ?? "#94a3b8";
  const stColor  = STATUS_COLOR[c.status] ?? "#94a3b8";
  const isPast   = c.status === "recusada" || c.status === "no_local";

  return (
    <>
      {pendingAction && (
        <ConfirmModal
          title={pendingAction === "aceitar" ? "Aceitar convocação" : pendingAction === "recusar" ? "Recusar convocação" : "Confirmar chegada"}
          description={
            pendingAction === "aceitar" ? `Você está aceitando a convocação para "${c.eventoTitulo}". Confirme sua senha para prosseguir.`
            : pendingAction === "recusar" ? `Você está recusando a convocação para "${c.eventoTitulo}". Confirme sua senha para prosseguir.`
            : `Confirme que você chegou ao local do evento "${c.eventoTitulo}".`
          }
          email={userEmail}
          onConfirm={() => {
            if (pendingAction === "chegada") onChegada(c.id);
            else onResponder(c.id, pendingAction);
            setPendingAction(null);
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}
      <div className="esp-card" style={{ background: "var(--bg-elevated)", border: `1px solid var(--border)`, borderLeft: `4px solid ${isPast ? "var(--border)" : sevColor}`, borderRadius: 14, padding: "16px 18px", margin: "0 16px 12px", opacity: isPast ? 0.65 : 1 }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10, marginBottom: 8 }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, color: "var(--text-primary)", marginBottom: 2, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{c.eventoTitulo}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>
              {c.eventoTipo?.replace(/_/g, " ")} · <span style={{ color: isPast ? "var(--text-muted)" : sevColor, fontWeight: 600 }}>{c.eventoSeveridade}</span>
            </div>
            {c.eventoEndereco && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>📍 {c.eventoEndereco}</div>}
          </div>
          <span style={{ flexShrink: 0, fontSize: 10, fontWeight: 700, padding: "3px 9px", borderRadius: 20, background: `${stColor}18`, color: stColor, letterSpacing: "0.05em" }}>
            {STATUS_LABEL[c.status] ?? c.status}
          </span>
        </div>
        <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: c.status === "pendente" || c.status === "a_caminho" ? 10 : 0 }}>
          {new Date(c.convocadoEm).toLocaleString("pt-BR")}
        </div>
        {c.status === "pendente" && (
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => setPendingAction("aceitar")}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✓ Aceitar
            </button>
            <button onClick={() => setPendingAction("recusar")}
              style={{ flex: 1, padding: "10px", borderRadius: 10, border: "none", background: "rgba(239,68,68,0.10)", color: "#ef4444", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
              ✗ Recusar
            </button>
          </div>
        )}
        {c.status === "a_caminho" && (
          <button onClick={() => setPendingAction("chegada")}
            style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.13)", color: "#22c55e", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
            📍 Confirmar chegada no local
          </button>
        )}
      </div>
    </>
  );
}

// ── Aba: Convocações ──────────────────────────────────────────────────────────
function ConvocacoesTab({ convs, onResponder, onChegada, userEmail }) {
  const pendentes  = convs.filter(c => c.status === "pendente");
  const ativas     = convs.filter(c => c.status === "a_caminho" || c.status === "no_local");
  const historico  = convs.filter(c => c.status === "recusada" || c.status === "no_local");

  const sec = (label, count) => (
    <div style={{ padding: "12px 16px 8px", display: "flex", alignItems: "center", gap: 8 }}>
      <span style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase" }}>{label}</span>
      {count > 0 && <span style={{ fontSize: 10, fontWeight: 800, padding: "2px 7px", borderRadius: 99, background: "var(--bg-elevated)", color: "var(--text-secondary)" }}>{count}</span>}
    </div>
  );

  if (convs.length === 0) return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "80px 32px", gap: 12 }}>
      <span style={{ fontSize: 48 }}>📭</span>
      <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 700, color: "var(--text-primary)" }}>Nenhuma convocação</span>
      <span style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>Quando você for convocado para um evento, ele aparecerá aqui.</span>
    </div>
  );

  return (
    <div style={{ paddingBottom: 20 }}>
      {pendentes.length > 0 && (
        <>
          {sec("Aguardando resposta", pendentes.length)}
          {pendentes.map(c => <ConvCard key={c.id} c={c} onResponder={onResponder} onChegada={onChegada} userEmail={userEmail} />)}
        </>
      )}
      {ativas.length > 0 && (
        <>
          {sec("Em andamento", ativas.length)}
          {ativas.map(c => <ConvCard key={c.id} c={c} onResponder={onResponder} onChegada={onChegada} userEmail={userEmail} />)}
        </>
      )}
      {historico.length > 0 && (
        <>
          {sec("Histórico", historico.length)}
          {historico.map(c => <ConvCard key={c.id} c={c} onResponder={onResponder} onChegada={onChegada} userEmail={userEmail} />)}
        </>
      )}
    </div>
  );
}

// ── Aba: Eventos (mapa + bottom sheet) ────────────────────────────────────────
function EventosTab({ eventos, convs, criticalPoints, userEmail, onRefresh, onResponder, onVoluntariar, onChegada }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef([]);
  const criticoRef   = useRef([]);
  const [mapReady, setMapReady]     = useState(false);
  const [sheetState, setSheetState] = useState("peek");
  const [selEvento, setSelEvento]   = useState(null);
  const [pendingVoluntario, setPendingVoluntario] = useState(null);
  const [pendingAceitar, setPendingAceitar] = useState(null);   // guarda o convPend
  const [pendingChegadaEv, setPendingChegadaEv] = useState(null);

  const convByEvento    = {};
  const convAnyByEvento = {};
  const convAcaminhoByEvento = {};
  convs.forEach(c => {
    convAnyByEvento[c.eventoId] = c;
    if (c.status === "pendente") convByEvento[c.eventoId] = c;
    if (c.status === "a_caminho") convAcaminhoByEvento[c.eventoId] = c;
  });

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    injectCSS();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: TAUBATE, zoom: 12, pitch: 40, antialias: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showZoom: true, showCompass: false }), "top-right");
    map.on("style.load", () => {
      const layers = map.getStyle().layers;
      const labelLayer = layers.find(l => l.type === "symbol" && l.layout?.["text-field"]);
      map.addLayer({
        id: "3d-buildings", source: "composite", "source-layer": "building",
        filter: ["==", "extrude", "true"], type: "fill-extrusion", minzoom: 15,
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
      const color = SEV_COLOR[ev.severity?.toLowerCase()] ?? "#94a3b8";
      const emoji = TIPO_EMOJI[ev.type] ?? "⚠️";
      const isCrit = ev.severity?.toLowerCase() === "critico";
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="position:relative;width:48px;height:48px;">${isCrit ? `<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid ${color};opacity:.5;animation:pulse-ring 1.5s ease-out infinite;"></div>` : ""}<div style="position:absolute;inset:0;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:22px;box-shadow:0 0 14px ${color}66;">${emoji}</div></div>`;
      el.addEventListener("click", () => {
        setSelEvento(ev);
        setSheetState("peek");
        map.flyTo({ center: [ev.lng, ev.lat], zoom: 14, speed: 1.2 });
      });
      markersRef.current.push(new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([ev.lng, ev.lat]).addTo(map));
    });
  }, [eventos, mapReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;
    criticoRef.current.forEach(m => m.remove());
    criticoRef.current = [];
    criticalPoints.forEach(pt => {
      if (!pt.lat || !pt.lng) return;
      const color = RISCO_COLOR[pt.risco] ?? RISCO_COLOR.medio;
      const el = document.createElement("div");
      el.style.cursor = "pointer";
      el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:900;color:${color};box-shadow:0 0 8px ${color}66;">!</div>`;
      criticoRef.current.push(new mapboxgl.Marker({ element: el, anchor: "center" }).setLngLat([parseFloat(pt.lng), parseFloat(pt.lat)]).addTo(map));
    });
  }, [criticalPoints, mapReady]);

  return (
    <div style={{ position: "absolute", inset: 0, bottom: 64 }}>
      {/* Mapa */}
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Popup de evento selecionado */}
      {selEvento && (() => {
        const color = SEV_COLOR[selEvento.severity?.toLowerCase()] ?? "#94a3b8";
        return (
          <div style={{ position: "absolute", top: 16, left: 12, right: 12, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(12px)", borderRadius: 16, padding: "14px 16px", boxShadow: "0 4px 24px rgba(0,0,0,.2)", border: `2px solid ${color}`, animation: "fadeIn 0.2s ease" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 6 }}>
              <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: "uppercase", letterSpacing: "0.06em" }}>{selEvento.severity} · {selEvento.type?.replace(/_/g, " ")}</span>
              <button onClick={() => setSelEvento(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 20, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#111827", marginBottom: 4 }}>{selEvento.title}</div>
            {selEvento.address && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>📍 {selEvento.address}</div>}
            {selEvento.neededProfiles?.length > 0 && (
              <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 8 }}>
                {selEvento.neededProfiles.map(p => (
                  <span key={p} style={{ background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "#4b5563" }}>{p}</span>
                ))}
              </div>
            )}
            {convAcaminhoByEvento[selEvento.id] && (
              <button onClick={() => onChegada(convAcaminhoByEvento[selEvento.id].id)}
                style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.13)", color: "#22c55e", fontSize: 13, fontWeight: 700, cursor: "pointer", fontFamily: "'Syne', sans-serif" }}>
                📍 Confirmar chegada no local
              </button>
            )}
          </div>
        );
      })()}

      {/* FAB atualizar */}
      <button onClick={onRefresh}
        style={{ position: "absolute", top: selEvento ? 150 : 16, left: 16, zIndex: 20, width: 44, height: 44, borderRadius: "50%", border: "none", background: "rgba(255,255,255,0.95)", boxShadow: "0 2px 12px rgba(0,0,0,.2)", fontSize: 18, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", transition: "top 0.2s ease" }}>
        ↺
      </button>

      {/* Bottom Sheet com lista de eventos */}
      <BottomSheet state={sheetState} onStateChange={setSheetState}>
        <div style={{ padding: "4px 16px 8px", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)" }}>Eventos próximos</span>
          <span style={{ fontSize: 11, color: "var(--text-muted)" }}>{eventos.length} ativo{eventos.length !== 1 ? "s" : ""}</span>
        </div>
        {eventos.length === 0 ? (
          <div style={{ textAlign: "center", padding: "24px 16px", color: "var(--text-muted)", fontSize: 13 }}>Nenhum evento para sua especialidade.</div>
        ) : eventos.map(ev => {
          const color = SEV_COLOR[ev.severity?.toLowerCase()] ?? "#94a3b8";
          const emoji = TIPO_EMOJI[ev.type] ?? "⚠️";
          const convPend = convByEvento[ev.id];

          return (
            <div key={ev.id} className="esp-card" style={{ background: "var(--bg-elevated)", border: `1px solid var(--border)`, borderLeft: `4px solid ${color}`, borderRadius: 14, padding: "14px 16px", margin: "0 16px 12px" }}>
              <div style={{ display: "flex", gap: 10, alignItems: "flex-start", marginBottom: 8 }}>
                <span style={{ fontSize: 22, flexShrink: 0 }}>{emoji}</span>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 14, fontWeight: 700, color: "var(--text-primary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{ev.title}</div>
                  <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>
                    <span style={{ color, fontWeight: 600 }}>{ev.severity}</span> · {ev.type?.replace(/_/g, " ")}
                  </div>
                  {ev.address && <div style={{ fontSize: 11, color: "var(--text-muted)", marginTop: 3 }}>📍 {ev.address}</div>}
                </div>
              </div>
              {convPend ? (
                <button onClick={() => setPendingAceitar(convPend)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.12)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  ✓ Aceitar convocação
                </button>
              ) : !convAnyByEvento[ev.id] && (
                <button onClick={() => setPendingVoluntario(ev)}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "1px solid rgba(99,102,241,0.3)", background: "rgba(99,102,241,0.08)", color: "#818cf8", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  🤝 Quero ajudar
                </button>
              )}
              {convAcaminhoByEvento[ev.id] && (
                <button onClick={() => setPendingChegadaEv(convAcaminhoByEvento[ev.id])}
                  style={{ width: "100%", padding: "10px", borderRadius: 10, border: "none", background: "rgba(34,197,94,0.13)", color: "#22c55e", fontFamily: "'Syne', sans-serif", fontSize: 13, fontWeight: 700, cursor: "pointer" }}>
                  📍 Confirmar chegada no local
                </button>
              )}
            </div>
          );
        })}
      </BottomSheet>

      {pendingVoluntario && (
        <ConfirmModal
          title="Quero ajudar"
          description={`Você irá comparecer voluntariamente ao evento "${pendingVoluntario.title}". Confirme sua senha.`}
          email={userEmail}
          onConfirm={() => { onVoluntariar(pendingVoluntario.id); setPendingVoluntario(null); }}
          onCancel={() => setPendingVoluntario(null)}
        />
      )}
      {pendingAceitar && (
        <ConfirmModal
          title="Aceitar convocação"
          description={`Confirme para aceitar a convocação para "${pendingAceitar.eventoTitulo}".`}
          email={userEmail}
          onConfirm={() => { onResponder(pendingAceitar.id, "aceitar"); setPendingAceitar(null); }}
          onCancel={() => setPendingAceitar(null)}
        />
      )}
      {pendingChegadaEv && (
        <ConfirmModal
          title="Confirmar chegada"
          description={`Confirme que você chegou ao local do evento "${pendingChegadaEv.eventoTitulo}".`}
          email={userEmail}
          onConfirm={() => { onChegada(pendingChegadaEv.id); setPendingChegadaEv(null); }}
          onCancel={() => setPendingChegadaEv(null)}
        />
      )}

      {!MAPBOX_TOKEN && (
        <div style={{ position: "absolute", top: "40%", left: "50%", transform: "translate(-50%,-50%)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 16, padding: "32px", textAlign: "center" }}>
          <div style={{ fontSize: 32, marginBottom: 12 }}>🗺️</div>
          <div style={{ fontSize: 13, color: "var(--text-secondary)" }}>Configure <code>VITE_MAPBOX_TOKEN</code></div>
        </div>
      )}
    </div>
  );
}

// ── Aba: Conta (configurações) ────────────────────────────────────────────────
function ContaTab({ user, token, onUpdate }) {
  const [nome,      setNome]      = useState(user?.nome     || "");
  const [telefone,  setTelefone]  = useState(user?.telefone || "");
  const [senhaAtual, setSenhaAtual] = useState("");
  const [senha,      setSenha]     = useState("");
  const [senhaConf,  setSenhaConf] = useState("");
  const [rua,       setRua]       = useState(user?.rua     || "");
  const [numero,    setNumero]    = useState(user?.numero  || "");
  const [bairro,    setBairro]    = useState(user?.bairro  || "");
  const [cidade,    setCidade]    = useState(user?.cidade  || "");
  const [cep,       setCep]       = useState(user?.cep     || "");
  const [cepStatus, setCepStatus] = useState(null);
  const [saving,    setSaving]    = useState(false);
  const [success,   setSuccess]   = useState(false);
  const [error,     setError]     = useState(null);

  const [ruaQuery, setRuaQuery] = useState(false);
  const [ruaFocus, setRuaFocus] = useState(false);
  const { sugestoes: ruaSugs } = useGeocodingAutocomplete(ruaFocus && ruaQuery && rua.length >= 3 ? rua : "");

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

  async function handleSave() {
    if (senha) {
      if (!senhaAtual)         { setError("Informe a senha atual."); return; }
      if (senha !== senhaConf) { setError("As senhas não coincidem."); return; }
      if (senha.length < 6)    { setError("Mínimo 6 caracteres."); return; }
    }
    setSaving(true); setError(null); setSuccess(false);
    try {
      const body = { nome, telefone, rua, numero, bairro, cidade, cep };
      if (senha) { body.senha = senha; body.senhaAtual = senhaAtual; }
      const res = await fetch(`${BASE}/especialistas/aprovados/${user.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error(await res.text().catch(() => "Erro ao salvar."));
      onUpdate(await res.json());
      setSenhaAtual(""); setSenha(""); setSenhaConf("");
      setSuccess(true); setTimeout(() => setSuccess(false), 3000);
    } catch (err) { setError(err.message); }
    finally { setSaving(false); }
  }

  const inp = { width: "100%", padding: "13px 14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" };
  const lbl = { display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 7 };
  const sec = { fontSize: 11, fontWeight: 700, color: "var(--text-muted)", letterSpacing: "0.12em", textTransform: "uppercase", marginBottom: 14, paddingBottom: 8, borderBottom: "1px solid var(--border)" };

  return (
    <div style={{ overflowY: "auto", height: "100%", paddingBottom: 24 }}>
      {/* Perfil header */}
      <div style={{ padding: "24px 20px 20px", borderBottom: "1px solid var(--border)", marginBottom: 4 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: "50%", background: "var(--accent)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700, color: "#fff", flexShrink: 0, fontFamily: "'Syne', sans-serif" }}>
            {user?.nome?.charAt(0)?.toUpperCase() ?? "?"}
          </div>
          <div>
            <div style={{ fontFamily: "'Syne', sans-serif", fontSize: 17, fontWeight: 700, color: "var(--text-primary)" }}>{user?.nome || "Especialista"}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)", marginTop: 2 }}>{user?.email}</div>
            {user?.profissao && <div style={{ fontSize: 11, marginTop: 3, padding: "2px 8px", background: "rgba(99,102,241,0.1)", color: "#818cf8", borderRadius: 99, display: "inline-block", fontWeight: 600 }}>{user.profissao}</div>}
          </div>
        </div>
      </div>

      <div style={{ padding: "16px 20px", display: "flex", flexDirection: "column", gap: 20 }}>
        <div>
          <div style={sec}>Dados pessoais</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={lbl}>Nome completo</label><input style={inp} value={nome} onChange={e => setNome(e.target.value)} /></div>
            <div><label style={lbl}>Telefone</label><input style={inp} inputMode="numeric" value={telefone} onChange={e => setTelefone(maskPhone(e.target.value))} placeholder="(11) 99999-9999" /></div>
          </div>
        </div>

        <div>
          <div style={sec}>Alterar senha <span style={{ fontWeight: 400, textTransform: "none", letterSpacing: 0 }}>(deixe em branco para manter)</span></div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div><label style={lbl}>Senha atual</label><input type="password" style={inp} value={senhaAtual} onChange={e => { setSenhaAtual(e.target.value); setError(null); }} placeholder="••••••••" /></div>
            <div><label style={lbl}>Nova senha</label><input type="password" style={inp} value={senha} onChange={e => { setSenha(e.target.value); setError(null); }} placeholder="••••••••" /></div>
            <div><label style={lbl}>Confirmar nova senha</label><input type="password" style={{ ...inp, borderColor: senhaConf && senha !== senhaConf ? "var(--accent)" : "var(--border)" }} value={senhaConf} onChange={e => { setSenhaConf(e.target.value); setError(null); }} placeholder="••••••••" /></div>
          </div>
        </div>

        <div>
          <div style={sec}>Endereço</div>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <div style={{ display: "flex", gap: 12 }}>
              <div style={{ flex: "0 0 140px" }}>
                <label style={lbl}>CEP</label>
                <div style={{ position: "relative" }}>
                  <input style={{ ...inp, borderColor: cepStatus === "ok" ? "#22c55e" : cepStatus === "error" ? "var(--accent)" : "var(--border)" }}
                    inputMode="numeric" placeholder="00000-000" value={cep}
                    onChange={e => { const v = maskCEP(e.target.value); setCep(v); setCepStatus(null); if (v.replace(/\D/g,"").length === 8) lookupCEP(v); }} />
                  {cepStatus === "loading" && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 11, color: "var(--text-muted)" }}>⟳</span>}
                  {cepStatus === "ok"      && <span style={{ position: "absolute", right: 10, top: "50%", transform: "translateY(-50%)", fontSize: 13, color: "#22c55e" }}>✓</span>}
                </div>
              </div>
              <div style={{ flex: 1 }}><label style={lbl}>Cidade</label><input style={inp} value={cidade} onChange={e => setCidade(e.target.value)} /></div>
            </div>

            <div style={{ position: "relative" }}>
              <label style={lbl}>Rua / Avenida</label>
              <input style={inp} value={rua} onChange={e => { setRua(e.target.value); setRuaQuery(true); }} onFocus={() => setRuaFocus(true)} onBlur={() => setTimeout(() => setRuaFocus(false), 150)} placeholder="Rua das Flores" />
              {ruaFocus && ruaSugs.length > 0 && (
                <div style={{ position: "absolute", top: "100%", left: 0, right: 0, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 12, zIndex: 50, boxShadow: "0 8px 24px rgba(0,0,0,.15)", overflow: "hidden" }}>
                  {ruaSugs.map(s => (
                    <div key={s.id} onMouseDown={() => { setRua(s.shortName || s.placeName.split(",")[0]); setRuaQuery(false); setRuaFocus(false); }}
                      style={{ padding: "10px 14px", cursor: "pointer", borderBottom: "1px solid var(--border)", fontSize: 13 }}
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
              <div style={{ flex: "0 0 100px" }}><label style={lbl}>Número</label><input style={inp} value={numero} onChange={e => setNumero(e.target.value)} /></div>
              <div style={{ flex: 1 }}><label style={lbl}>Bairro</label><input style={inp} value={bairro} onChange={e => setBairro(e.target.value)} /></div>
            </div>
          </div>
        </div>

        {error   && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#ef4444" }}>{error}</div>}
        {success && <div style={{ background: "rgba(34,197,94,0.08)", border: "1px solid rgba(34,197,94,0.3)", borderRadius: 10, padding: "12px 14px", fontSize: 13, color: "#22c55e" }}>✅ Alterações salvas com sucesso.</div>}

        <button onClick={handleSave} disabled={saving}
          style={{ padding: "15px", borderRadius: 12, border: "none", background: saving ? "var(--bg-hover)" : "var(--accent)", color: saving ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: saving ? "not-allowed" : "pointer" }}>
          {saving ? "Salvando..." : "Salvar alterações"}
        </button>
      </div>
    </div>
  );
}

// ── Bottom Navigation Bar ─────────────────────────────────────────────────────
function BottomNav({ activeTab, onTabChange, pendentes, onLogout }) {
  const tabs = [
    { id: "convocacoes", label: "Convocações", icon: "🔔" },
    { id: "eventos",     label: "Eventos",     icon: "🗺️" },
    { id: "conta",       label: "Conta",       icon: "👤" },
  ];

  return (
    <div style={{
      position: "fixed", bottom: 0, left: 0, right: 0,
      height: 64,
      background: "var(--bg-elevated)",
      borderTop: "1px solid var(--border)",
      display: "flex", alignItems: "stretch",
      zIndex: 100,
      paddingBottom: "env(safe-area-inset-bottom, 0)",
    }}>
      {tabs.map(tab => (
        <button
          key={tab.id}
          className="bottom-nav-btn"
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
            border: "none", background: "transparent", cursor: "pointer",
            color: activeTab === tab.id ? "var(--accent)" : "var(--text-muted)",
            position: "relative",
          }}
        >
          <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
          <span style={{ fontSize: 10, fontWeight: activeTab === tab.id ? 700 : 500, fontFamily: "'Syne', sans-serif", letterSpacing: "0.03em" }}>{tab.label}</span>
          {tab.id === "convocacoes" && pendentes > 0 && (
            <span style={{ position: "absolute", top: 8, right: "calc(50% - 18px)", background: "#ef4444", color: "#fff", fontSize: 9, fontWeight: 800, padding: "1px 5px", borderRadius: 99, minWidth: 16, textAlign: "center" }}>
              {pendentes}
            </span>
          )}
          {activeTab === tab.id && (
            <span style={{ position: "absolute", top: 0, left: "20%", right: "20%", height: 2, background: "var(--accent)", borderRadius: "0 0 2px 2px" }} />
          )}
        </button>
      ))}

      {/* Botão Sair */}
      <button
        className="bottom-nav-btn"
        onClick={onLogout}
        style={{
          width: 56, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3,
          border: "none", background: "transparent", cursor: "pointer",
          color: "var(--text-muted)",
          borderLeft: "1px solid var(--border)",
        }}
      >
        <span style={{ fontSize: 18, lineHeight: 1 }}>↩</span>
        <span style={{ fontSize: 9, fontWeight: 500, fontFamily: "'Syne', sans-serif", letterSpacing: "0.03em" }}>Sair</span>
      </button>
    </div>
  );
}

// ── Dashboard principal ───────────────────────────────────────────────────────
export default function EspecialistaDashboard() {
  const [token,          setToken]          = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [user,           setUser]           = useState(() => { try { return JSON.parse(sessionStorage.getItem(USER_KEY)); } catch { return null; } });
  const [activeTab,      setActiveTab]      = useState("eventos");
  const [convs,          setConvs]          = useState([]);
  const [eventos,        setEventos]        = useState([]);
  const [pontosCriticos, setPontosCriticos] = useState([]);
  const [loading,        setLoading]        = useState(false);
  const [fetchErr,       setFetchErr]       = useState(null);
  const [email,          setEmail]          = useState("");
  const [senha,          setSenha]          = useState("");
  const [loginErr,       setLoginErr]       = useState(null);
  const [loggingIn,      setLoggingIn]      = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  useEffect(() => { if (user?.email) window._pirdUserEmail = user.email; }, [user]);

  useEffect(() => {
    if (!token) return;
    fetchConvs(); fetchEventos(); fetchPontosCriticos();
    if (!user?.profissao) fetchPerfil();
    const id = setInterval(fetchConvs, 30_000);
    return () => clearInterval(id);
  }, [token]);

  async function fetchPerfil() {
    try {
      const res = await fetch(`${BASE}/especialistas/aprovados/perfil`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.ok) {
        const data = await res.json();
        setUser(prev => { const u = { ...prev, ...data }; sessionStorage.setItem(USER_KEY, JSON.stringify(u)); return u; });
      }
    } catch {}
  }

  async function fetchConvs() {
    setLoading(true); setFetchErr(null);
    try {
      const res = await fetch(`${BASE}/convocacoes/minhas`, { headers: { Authorization: `Bearer ${token}` } });
      if (res.status === 401) { doLogout(); return; }
      if (!res.ok) throw new Error("Erro ao carregar convocações.");
      setConvs(await res.json());
    } catch (err) { setFetchErr(err.message); }
    finally { setLoading(false); }
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
    e.preventDefault(); setLoggingIn(true); setLoginErr(null);
    try {
      const res = await fetch(`${BASE}/auth/login`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, senha }) });
      if (!res.ok) { setLoginErr("E-mail ou senha inválidos."); return; }
      const data = await res.json();
      const u = { nome: data.nome, email: data.email };
      sessionStorage.setItem(TOKEN_KEY, data.token); sessionStorage.setItem(USER_KEY, JSON.stringify(u));
      setToken(data.token); setUser(u);
    } catch { setLoginErr("Erro de conexão."); }
    finally { setLoggingIn(false); }
  }

  function doLogout() {
    sessionStorage.removeItem(TOKEN_KEY); sessionStorage.removeItem(USER_KEY);
    setToken(null); setUser(null); setConvs([]); setEventos([]); setPontosCriticos([]);
    window._pirdUserEmail = null;
  }

  async function handleResponder(id, acao) {
    try {
      const res = await fetch(`${BASE}/convocacoes/${id}/${acao}`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setConvs(prev => prev.map(c => c.id === id ? { ...c, status: acao === "aceitar" ? "a_caminho" : "recusada", respondidoEm: new Date().toISOString() } : c));
    } catch { alert("Erro ao responder à convocação."); }
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

  async function handleChegada(convId) {
    try {
      const res = await fetch(`${BASE}/convocacoes/${convId}/chegada`, { method: "PATCH", headers: { Authorization: `Bearer ${token}` } });
      if (!res.ok) throw new Error();
      setConvs(prev => prev.map(c => c.id === convId ? { ...c, status: "no_local", chegadaEm: new Date().toISOString() } : c));
    } catch { alert("Erro ao confirmar chegada."); }
  }

  function handleProfileUpdate(updated) {
    const merged = { ...user, ...updated };
    setUser(merged); sessionStorage.setItem(USER_KEY, JSON.stringify(merged));
  }

  if (!token) return <LoginScreen email={email} setEmail={setEmail} senha={senha} setSenha={setSenha} onSubmit={handleLogin} loading={loggingIn} error={loginErr} />;

  const relevantEventos = eventos.filter(ev => !user?.profissao || ev.neededProfiles?.includes(user.profissao));
  const pendentes = convs.filter(c => c.status === "pendente").length;

  return (
    <div style={{ position: "fixed", inset: 0, background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {injectCSS()}

      {/* Header (apenas nas abas não-mapa) */}
      {activeTab !== "eventos" && (
        <div style={{ flexShrink: 0, background: "var(--bg-base)", borderBottom: "1px solid var(--border)", padding: "16px 20px env(safe-area-inset-top, 0)", display: "flex", alignItems: "center", gap: 10 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 26, height: 26, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 16, fontWeight: 800, color: "var(--accent)" }}>BASE</span>
          <span style={{ marginLeft: "auto", fontSize: 13, color: "var(--text-secondary)" }}>
            {user?.nome?.split(" ")[0]}
          </span>
        </div>
      )}

      {/* Conteúdo da aba ativa */}
      <div style={{ flex: 1, overflow: "hidden", position: "relative" }}>
        {activeTab === "convocacoes" && (
          <div style={{ overflowY: "auto", height: "100%", paddingBottom: 20 }}>
            <ConvocacoesTab convs={convs} onResponder={handleResponder} onChegada={handleChegada} userEmail={user?.email} />
          </div>
        )}
        {activeTab === "eventos" && (
          <EventosTab
            eventos={relevantEventos}
            convs={convs}
            criticalPoints={pontosCriticos}
            userEmail={user?.email}
            onRefresh={() => { fetchEventos(); fetchPontosCriticos(); fetchConvs(); }}
            onResponder={handleResponder}
            onVoluntariar={handleVoluntariar}
            onChegada={handleChegada}
          />
        )}
        {activeTab === "conta" && (
          <ContaTab user={user} token={token} onUpdate={handleProfileUpdate} />
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        pendentes={pendentes}
        onLogout={() => setShowLogoutModal(true)}
      />

      {/* Modal de logout */}
      {showLogoutModal && (
        <ConfirmModal
          title="Sair da conta"
          description="Deseja mesmo sair da sua conta? Você precisará fazer login novamente para acessar o painel."
          email={user?.email}
          requirePassword={false}
          confirmLabel="Sair"
          confirmColor="#ef4444"
          onConfirm={() => { setShowLogoutModal(false); doLogout(); }}
          onCancel={() => setShowLogoutModal(false)}
        />
      )}
    </div>
  );
}

// ── Tela de login ─────────────────────────────────────────────────────────────
function LoginScreen({ email, setEmail, senha, setSenha, onSubmit, loading, error }) {
  const navigate = useNavigate();
  return (
    <div style={{ minHeight: "100dvh", background: "var(--bg-base)", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: "24px 20px" }}>
      <div style={{ marginBottom: 40, textAlign: "center" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 10, marginBottom: 8 }}>
          <img src="/resources/logo.png" alt="PIRD" style={{ width: 48, height: 48, objectFit: "contain" }} />
          <span style={{ fontFamily: "'Syne', sans-serif", fontSize: 28, fontWeight: 800, color: "var(--accent)", letterSpacing: "0.1em" }}>BASE</span>
        </div>
        <p style={{ color: "var(--text-secondary)", fontSize: 12, letterSpacing: "0.15em", textTransform: "uppercase" }}>Painel do Especialista</p>
      </div>
      <form onSubmit={onSubmit} style={{ width: "100%", maxWidth: 380, background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 20, padding: "32px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
        <h2 style={{ fontFamily: "'Syne', sans-serif", fontSize: 18, fontWeight: 700, color: "var(--text-primary)", margin: 0 }}>Entrar</h2>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>E-mail</label>
          <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="seu@email.com" required
            style={{ width: "100%", padding: "14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        <div>
          <label style={{ display: "block", fontSize: 11, fontWeight: 600, color: "var(--text-secondary)", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: 8 }}>Senha</label>
          <input type="password" value={senha} onChange={e => setSenha(e.target.value)} placeholder="••••••••" required
            style={{ width: "100%", padding: "14px", background: "var(--bg-surface)", border: "1.5px solid var(--border)", borderRadius: 12, color: "var(--text-primary)", fontSize: 15, outline: "none", boxSizing: "border-box" }} />
        </div>
        {error && <div style={{ background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.25)", borderRadius: 10, padding: "10px 14px", fontSize: 13, color: "#ef4444" }}>{error}</div>}
        <button type="submit" disabled={loading}
          style={{ padding: "15px", borderRadius: 12, border: "none", background: loading ? "var(--bg-hover)" : "var(--accent)", color: loading ? "var(--text-muted)" : "#fff", fontFamily: "'Syne', sans-serif", fontSize: 15, fontWeight: 700, cursor: loading ? "not-allowed" : "pointer" }}>
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