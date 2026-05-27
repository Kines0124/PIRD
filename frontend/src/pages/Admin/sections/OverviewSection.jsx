import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { severityColor, typeIcon, riskColor, severityBadge, statusBadge } from "../adminTheme.jsx";

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
        const color = severityColor[e.severity] || "#FF6B1A";
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

export default function OverviewSection({ events, criticalPoints, volunteers, collectionPoints, specialists = [], onNewEvent, onNewPoint, onGoToCritical }) {
  const activeEvents  = events.filter(e => e.status === "ativo").length;
  const pendingSpecs  = specialists.filter(s => s.status === "pendente").length;
  const approvedSpecs = specialists.filter(s => s.status === "aprovado").length;
  const pendingCols   = collectionPoints.filter(p => p.status === "pendente").length;
  const totalVictims  = events.reduce((s, e) => s + (e.victims || 0), 0);

  return (
    <>
      {(pendingSpecs > 0 || pendingCols > 0) && (
        <div className="alert-strip">
          <span className="alert-icon">🔴</span>
          <span>
            <b>Atenção:</b>
            {pendingSpecs > 0 && <> <b>{pendingSpecs}</b> especialista(s) aguardando aprovação. </>}
            {pendingCols > 0 && <><b>{pendingCols}</b> ponto(s) de coleta aguardando validação.</>}
          </span>
        </div>
      )}

      <div className="kpi-grid">
        {[
          { label: "Eventos Ativos",    value: activeEvents,                                                 icon: "🌊", color: "#ef4444", delta: `${events.length} total`,             deltaClass: activeEvents > 0 ? "up" : "ok" },
          { label: "Vítimas Afetadas",  value: totalVictims.toLocaleString("pt-BR"),                         icon: "👥", color: "#F5C518", delta: `${events.length} eventos`,             deltaClass: "ok" },
          { label: "Especialistas",     value: approvedSpecs,                                                icon: "⚕️", color: "#22c55e", delta: `${pendingSpecs} pendentes`,            deltaClass: pendingSpecs > 0 ? "up" : "ok" },
          { label: "Pontos de Coleta",  value: collectionPoints.filter(p => p.status === "validado").length, icon: "📦", color: "#3B82F6", delta: `${pendingCols} para validar`,         deltaClass: pendingCols > 0 ? "up" : "ok" },
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
              <div className="card-subtitle">Eventos, pontos críticos e coleta — Mapbox GL</div>
            </div>
            <div className="btn-group">
              <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Evento</button>
              <button className="btn btn-secondary btn-sm" onClick={onNewPoint}>＋ Ponto Crítico</button>
            </div>
          </div>
          <MapView events={events} criticalPoints={criticalPoints} collectionPoints={collectionPoints} onVerMaisCritico={onGoToCritical} />
          <div style={{ display: "flex", gap: 14, marginTop: 10, fontSize: 11, color: "var(--text-muted)", flexWrap: "wrap", alignItems: "center" }}>
            <span>🌊 Evento</span>
            <span style={{ display: "flex", alignItems: "center", gap: 5 }}>
              <span style={{ width: 12, height: 12, borderRadius: "50%", border: "2px solid #FF8C00", background: "#FF8C0022", display: "inline-block" }} />
              Ponto Crítico
            </span>
            <span>📦 Coleta</span>
          </div>
        </div>

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚡ Eventos Recentes</div></div>
            <button className="btn btn-secondary btn-sm" onClick={onNewEvent}>＋ Adicionar</button>
          </div>
          {events.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🌊</div>
              <div className="empty-state-text">Nenhum evento registrado</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {events.map(e => (
                <div key={e.id} style={{ background: "var(--bg-elevated)", borderRadius: "var(--radius-sm)", padding: "12px 14px", border: "1px solid var(--border)" }}>
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

      <div className="grid-2">
        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚠️ Pontos Críticos</div><div className="card-subtitle">{criticalPoints.length} registrados</div></div>
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
                  {criticalPoints.map(p => (
                    <tr key={p.id}>
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

        <div className="card">
          <div className="card-header">
            <div><div className="card-title">⚕️ Especialistas Pendentes</div><div className="card-subtitle">Aguardando aprovação</div></div>
          </div>
          {specialists.filter(s => s.status === "pendente").length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum especialista pendente</div>
            </div>
          ) : specialists.filter(s => s.status === "pendente").map(s => (
            <div className="volunteer-row" key={s.id}>
              <div className="vol-avatar" style={{ background: "linear-gradient(135deg,#FF6B1A,#FF3B3B)" }}>
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
    </>
  );
}
