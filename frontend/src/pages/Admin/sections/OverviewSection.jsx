import { useEffect, useLayoutEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { gsap } from "gsap";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { severityColor, typeIcon, riskColor, severityBadge, statusBadge } from "../adminTheme.jsx";

// ─── Constantes ────────────────────────────────────────────────────────────────
const SEVERITY_ORDER = { critico: 0, alto: 1, medio: 2, baixo: 3 };

// ─── MapView (sem alterações) ──────────────────────────────────────────────────
function MapView({ events, criticalPoints, collectionPoints, onVerMaisCritico }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const [selCritico, setSelCritico] = useState(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-45.88, -23.18],
      zoom: 8, pitch: 45, antialias: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");

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

      events.forEach(e => {
        if (!e.lat || !e.lng) return;
        const color = severityColor[e.severity] || "var(--accent)";
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color};border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 12px ${color}55;cursor:pointer">${typeIcon[e.type] || "⚠️"}</div>`;
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([parseFloat(e.lng), parseFloat(e.lat)])
          .setPopup(new mapboxgl.Popup().setHTML(`<b>${e.title}</b><br/>${e.city || ""}<br/>Vítimas: ${e.victims || 0}`))
          .addTo(map);
      });

      criticalPoints.forEach(p => {
        if (!p.lat || !p.lng) return;
        const color = riskColor[p.risk] || "#FF8C00";
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:${color};box-shadow:0 0 10px ${color}66;cursor:pointer">!</div>`;
        el.addEventListener("click", () => setSelCritico(p));
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
          .addTo(map);
      });

      collectionPoints.forEach(p => {
        if (!p.lat || !p.lng) return;
        const el = document.createElement("div");
        el.innerHTML = `<div style="width:22px;height:22px;border-radius:4px;background:#3B82F6;border:2px solid rgba(255,255,255,0.3);display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 0 8px #3B82F655;cursor:pointer">📦</div>`;
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
          .setPopup(new mapboxgl.Popup().setHTML(`<b>📦 ${p.name}</b><br/>${p.address || ""}`))
          .addTo(map);
      });
    });

    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [events, criticalPoints, collectionPoints]);

  if (!MAPBOX_TOKEN) {
    return (
      <div id="admin-map" style={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 8 }}>
        <span style={{ fontSize: 28 }}>🗺️</span>
        <div style={{ fontSize: 12, color: "var(--text-secondary)", textAlign: "center" }}>
          Configure <code>VITE_MAPBOX_TOKEN</code> para visualizar o mapa.
        </div>
      </div>
    );
  }

  const cardColor = selCritico ? (riskColor[selCritico.risk] || "#FF8C00") : null;

  return (
    <div style={{ position: "relative" }}>
      <div id="admin-map" ref={containerRef} />
      {selCritico && (
        <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, background: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.25)", border: `2px solid ${cardColor}`, maxWidth: 270, fontFamily: "system-ui,sans-serif" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
            <span style={{ fontSize: 11, fontWeight: 700, color: cardColor, textTransform: "uppercase", letterSpacing: "0.06em" }}>
              Ponto Crítico · {selCritico.risk}
            </span>
            <button onClick={() => setSelCritico(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 18, lineHeight: 1, marginLeft: 8 }}>×</button>
          </div>
          <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 4 }}>{selCritico.name}</div>
          {selCritico.address && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 6 }}>📍 {selCritico.address}</div>}
          {selCritico.description && <div style={{ fontSize: 12, color: "#374151", marginBottom: 8 }}>{selCritico.description}</div>}
          <button
            onClick={() => { onVerMaisCritico(); setSelCritico(null); }}
            style={{ width: "100%", background: cardColor, color: "#fff", border: "none", borderRadius: 6, padding: "6px 12px", fontSize: 11, fontWeight: 700, cursor: "pointer" }}>
            Ver mais →
          </button>
        </div>
      )}
    </div>
  );
}

// ─── OverviewSection ───────────────────────────────────────────────────────────
export default function OverviewSection({ events, criticalPoints, volunteers, collectionPoints, specialists = [], onNewEvent, onNewPoint, onGoToCritical }) {
  // Refs para animação — um por grupo de elementos
  const kpiCardsRef    = useRef([]);
  const accentBarsRef  = useRef([]);
  const kpiValuesRef   = useRef([]);
  const grid60Ref      = useRef([]);
  const eventItemsRef  = useRef([]);
  const grid2Ref       = useRef([]);
  const tableRowsRef   = useRef([]);
  const volRowsRef     = useRef([]);
  const volAvatarsRef  = useRef([]);
  const alertRef       = useRef(null);
  const prevAlertRef   = useRef(false);

  // Helpers para popular os ref arrays via callback ref
  const setKpiCardRef   = i => el => { kpiCardsRef.current[i]   = el; };
  const setAccentBarRef = i => el => { accentBarsRef.current[i] = el; };
  const setKpiValueRef  = i => el => { kpiValuesRef.current[i]  = el; };
  const setGrid60Ref    = i => el => { grid60Ref.current[i]     = el; };
  const setEventRef     = i => el => { eventItemsRef.current[i] = el; };
  const setGrid2Ref     = i => el => { grid2Ref.current[i]      = el; };
  const setTableRowRef  = i => el => { tableRowsRef.current[i]  = el; };
  const setVolRowRef    = i => el => { volRowsRef.current[i]    = el; };
  const setVolAvatarRef = i => el => { volAvatarsRef.current[i] = el; };

  // ── Dados derivados ──────────────────────────────────────────────────────
  const activeEvents  = events.filter(e => e.status === "ativo").length;
  const pendingSpecs  = specialists.filter(s => s.status === "pendente").length;
  const approvedSpecs = specialists.filter(s => s.status === "aprovado").length;
  const pendingCols   = collectionPoints.filter(p => p.status === "pendente").length;
  const totalVictims  = events.reduce((s, e) => s + (e.victims || 0), 0);
  const hasAlert      = pendingSpecs > 0 || pendingCols > 0;

  // Máx. 4 eventos, sem encerrados, críticos primeiro
  const recentEvents = events
    .filter(e => e.status !== "encerrado")
    .sort((a, b) => (SEVERITY_ORDER[a.severity] ?? 99) - (SEVERITY_ORDER[b.severity] ?? 99))
    .slice(0, 4);

  const kpiData = [
    { label: "Eventos Ativos",    value: activeEvents,  locale: false, icon: "🌊", color: "#ef4444", delta: `${events.length} total`,          deltaClass: activeEvents > 0 ? "up" : "ok" },
    { label: "Vítimas Afetadas",  value: totalVictims,  locale: true,  icon: "👥", color: "#F5C518", delta: `${events.length} eventos`,         deltaClass: "ok" },
    { label: "Especialistas",     value: approvedSpecs, locale: false, icon: "⚕️", color: "#22c55e", delta: `${pendingSpecs} pendentes`,        deltaClass: pendingSpecs > 0 ? "up" : "ok" },
    { label: "Pontos de Coleta",  value: collectionPoints.filter(p => p.status === "validado").length, locale: false, icon: "📦", color: "#3B82F6", delta: `${pendingCols} para validar`, deltaClass: pendingCols > 0 ? "up" : "ok" },
  ];

  const pendingSpecialists = specialists.filter(s => s.status === "pendente");

  // ── Animação principal ───────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!events.length && !criticalPoints.length && !specialists.length) return;

    // Filtra nulls (elementos que não montaram)
    const kpiCards   = kpiCardsRef.current.filter(Boolean);
    const accentBars = accentBarsRef.current.filter(Boolean);
    const kpiValues  = kpiValuesRef.current.filter(Boolean);
    const grid60     = grid60Ref.current.filter(Boolean);
    const eventItems = eventItemsRef.current.filter(Boolean);
    const grid2      = grid2Ref.current.filter(Boolean);
    const tableRows  = tableRowsRef.current.filter(Boolean);
    const volRows    = volRowsRef.current.filter(Boolean);
    const volAvatars = volAvatarsRef.current.filter(Boolean);

    // Estado inicial — evita flicker
    gsap.set([...kpiCards, ...grid60, ...grid2], { opacity: 0, y: 18 });
    gsap.set(accentBars,  { scaleX: 0, transformOrigin: "left center" });
    gsap.set(eventItems,  { opacity: 0, x: 20 });
    gsap.set(tableRows,   { opacity: 0, y: 6 });
    gsap.set(volRows,     { opacity: 0, x: -16 });
    gsap.set(volAvatars,  { scale: 0.7 });

    const ease = "power3.out";

    // Todos os grupos disparam simultaneamente, com delays mínimos escalonados
    gsap.to(kpiCards,   { opacity: 1, y: 0, duration: 0.4, stagger: 0.07, ease });
    gsap.to(accentBars, { scaleX: 1,  duration: 0.45, stagger: 0.07, ease });
    gsap.to(grid60,     { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease, delay: 0.05 });
    gsap.to(grid2,      { opacity: 1, y: 0, duration: 0.4, stagger: 0.08, ease, delay: 0.05 });
    gsap.to(eventItems, { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease, delay: 0.1 });
    gsap.to(tableRows,  { opacity: 1, y: 0, duration: 0.3,  stagger: 0.05, ease, delay: 0.1 });
    gsap.to(volRows,    { opacity: 1, x: 0, duration: 0.35, stagger: 0.06, ease, delay: 0.1 });
    gsap.to(volAvatars, { scale: 1,   duration: 0.35, stagger: 0.06, ease: "back.out(1.8)", delay: 0.1 });

    // Contadores dos KPIs
    kpiValues.forEach(el => {
      const end = parseFloat(el.dataset.target);
      if (isNaN(end) || end === 0) return;
      const isLocale = el.dataset.locale === "true";
      const fmt = v => isLocale ? Math.round(v).toLocaleString("pt-BR") : Math.round(v);
      el.textContent = "0";
      gsap.to({ val: 0 }, {
        val: end, duration: 0.9, ease: "power2.out",
        onUpdate() { el.textContent = fmt(this.targets()[0].val); },
        onComplete() { el.textContent = isLocale ? end.toLocaleString("pt-BR") : end; },
      });
    });

    // Cleanup: reverte transforms ao desmontar
    return () => {
      gsap.killTweensOf([
        ...kpiCards, ...accentBars, ...kpiValues,
        ...grid60, ...eventItems, ...grid2,
        ...tableRows, ...volRows, ...volAvatars,
      ]);
    };
  }, [events.length, criticalPoints.length, specialists.length]);

  // ── Alert strip ──────────────────────────────────────────────────────────
  useLayoutEffect(() => {
    if (!alertRef.current) return;
    const wasVisible = prevAlertRef.current;
    prevAlertRef.current = hasAlert;

    if (hasAlert && !wasVisible) {
      gsap.fromTo(alertRef.current,
        { opacity: 0, y: -16 },
        { opacity: 1, y: 0, duration: 0.4, ease: "power3.out" }
      );
    } else if (!hasAlert && wasVisible) {
      gsap.to(alertRef.current, { opacity: 0, y: -16, duration: 0.3, ease: "power2.in" });
    }
  }, [hasAlert]);

  // ── Render ───────────────────────────────────────────────────────────────
  return (
    <div>
      {hasAlert && (
        <div ref={alertRef} className="alert-strip">
          <span className="alert-icon">🔴</span>
          <span>
            <b>Atenção:</b>
            {pendingSpecs > 0 && <> <b>{pendingSpecs}</b> especialista(s) aguardando aprovação. </>}
            {pendingCols  > 0 && <><b>{pendingCols}</b> ponto(s) de coleta aguardando validação.</>}
          </span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="kpi-grid">
        {kpiData.map((k, i) => (
          <div className="kpi-card" key={i} ref={setKpiCardRef(i)}>
            <div className="kpi-accent-bar" ref={setAccentBarRef(i)} style={{ background: k.color }} />
            <span className="kpi-icon">{k.icon}</span>
            <div className="kpi-label">{k.label}</div>
            <div
              className="kpi-value"
              ref={setKpiValueRef(i)}
              data-target={k.value}
              data-locale={k.locale ? "true" : "false"}
              style={{ color: k.color }}
            >
              {k.locale ? k.value.toLocaleString("pt-BR") : k.value}
            </div>
            <div className={`kpi-delta ${k.deltaClass}`}>{k.delta}</div>
          </div>
        ))}
      </div>

      {/* Grid 60/40 — Mapa + Eventos Recentes */}
      <div className="grid-6040 section-gap">

        {/* Card: Mapa Operacional */}
        <div className="card" ref={setGrid60Ref(0)}>
          <div className="card-header">
            <div>
              <div className="card-title">🗺️ Mapa Operacional</div>
              <div className="card-subtitle">Eventos, pontos críticos e coleta — Mapbox GL</div>
            </div>
            <div className="btn-group">
              <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Evento</button>
              <button className="btn btn-secondary btn-sm" onClick={onNewPoint}>＋ Ponto Crítico</button>
            </div>
          </div>
          <MapView
            events={events}
            criticalPoints={criticalPoints}
            collectionPoints={collectionPoints}
            onVerMaisCritico={onGoToCritical}
          />
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap", alignItems: "center" }}>
            <span>🌊 Evento</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #FF8C00", background: "#FF8C0022", display: "inline-block" }} />
              Ponto Crítico
            </span>
            <span>📦 Coleta</span>
          </div>
        </div>

        {/* Card: Eventos Recentes (máx. 4, sem encerrados, críticos primeiro) */}
        <div className="card" ref={setGrid60Ref(1)}>
          <div className="card-header">
            <div><div className="card-title">⚡ Eventos Recentes</div></div>
            <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Adicionar</button>
          </div>
          {recentEvents.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌊</div>
              <div className="empty-state-text">Nenhum evento ativo registrado</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {recentEvents.map((e, i) => (
                <div
                  key={e.id}
                  ref={setEventRef(i)}
                  className="event-recent-item"
                  style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "12px 14px", border: "1px solid var(--border)" }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                    <span style={{ fontSize: 16 }}>{typeIcon[e.type] || "⚠️"}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                    {severityBadge(e.severity)}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", alignItems: "center" }}>
                    <span>📍 {e.address || e.city}</span>
                    <span>👥 {e.victims || 0} vítimas</span>
                    <span style={{ marginLeft: "auto" }}>{statusBadge(e.status)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Grid 2 — Pontos Críticos + Especialistas Pendentes */}
      <div className="grid-2">

        {/* Card: Pontos Críticos */}
        <div className="card" ref={setGrid2Ref(0)}>
          <div className="card-header">
            <div>
              <div className="card-title">⚠️ Pontos Críticos</div>
              <div className="card-subtitle">{criticalPoints.length} registrados</div>
            </div>
            <button className="btn btn-secondary btn-sm" onClick={onNewPoint}>＋ Adicionar</button>
          </div>
          {criticalPoints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-text">Nenhum ponto crítico registrado</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead><tr><th>Local</th><th>Tipo</th><th>Risco</th></tr></thead>
                <tbody>
                  {criticalPoints.map((p, i) => (
                    <tr key={p.id} ref={setTableRowRef(i)} className="critical-table-row">
                      <td>
                        <div style={{ fontWeight: 600, fontSize: 12.5 }}>{p.name}</div>
                        <div className="text-muted text-sm">{(p.description || "").slice(0, 45)}{p.description?.length > 45 ? "…" : ""}</div>
                      </td>
                      <td><span style={{ fontSize: 11.5, color: "var(--text-secondary)", textTransform: "capitalize" }}>{p.type}</span></td>
                      <td>{severityBadge(p.risk)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Card: Especialistas Pendentes */}
        <div className="card" ref={setGrid2Ref(1)}>
          <div className="card-header">
            <div>
              <div className="card-title">⚕️ Especialistas Pendentes</div>
              <div className="card-subtitle">Aguardando aprovação</div>
            </div>
          </div>
          {pendingSpecialists.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum especialista pendente</div>
            </div>
          ) : pendingSpecialists.map((s, i) => (
            <div className="volunteer-row" key={s.id} ref={setVolRowRef(i)}>
              <div
                className="vol-avatar"
                ref={setVolAvatarRef(i)}
                style={{ background: "linear-gradient(135deg,var(--accent),#FF3B3B)" }}
              >
                {(s.nome || "?")[0].toUpperCase()}
              </div>
              <div className="vol-info">
                <div className="vol-name">{s.nome}</div>
                <div className="vol-spec">{s.profissao}</div>
                <div className="vol-region">📍 {s.uf || "—"}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}