import { useEffect, useRef } from "react";
import { severityColor, typeIcon, riskColor, severityBadge, statusBadge } from "../adminTheme.jsx";

// ─── Leaflet via CDN ───────────────────────────────────────────────────────────
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

export default function OverviewSection({ events, criticalPoints, volunteers, collectionPoints, onNewEvent, onNewPoint }) {
  const activeEvents  = events.filter(e => e.status === "ativo").length;
  const pendingVols   = volunteers.filter(v => v.status === "pendente").length;
  const pendingCols   = collectionPoints.filter(p => p.status === "pendente").length;
  const totalVictims  = events.reduce((s, e) => s + (e.victims || 0), 0);

  return (
    <>
      {(pendingVols > 0 || pendingCols > 0) && (
        <div className="alert-strip">
          <span className="alert-icon">🔴</span>
          <span>
            <b>Atenção:</b>
            {pendingVols > 0 && <> <b>{pendingVols}</b> voluntário(s) aguardando aprovação. </>}
            {pendingCols > 0 && <><b>{pendingCols}</b> ponto(s) de coleta aguardando validação.</>}
          </span>
        </div>
      )}

      <div className="kpi-grid">
        {[
          { label: "Eventos Ativos",    value: activeEvents,                                                  icon: "🌊", color: "#ef4444", delta: `${events.length} total`,            deltaClass: activeEvents > 0 ? "up" : "ok" },
          { label: "Vítimas Afetadas",  value: totalVictims.toLocaleString("pt-BR"),                          icon: "👥", color: "#F5C518", delta: `${events.length} eventos`,           deltaClass: "ok" },
          { label: "Voluntários Ativos",value: volunteers.filter(v => v.status === "aprovado").length,        icon: "🙋", color: "#22c55e", delta: `${pendingVols} pendentes`,           deltaClass: pendingVols > 0 ? "up" : "ok" },
          { label: "Pontos de Coleta",  value: collectionPoints.filter(p => p.status === "validado").length,  icon: "📦", color: "#3B82F6", delta: `${pendingCols} para validar`,       deltaClass: pendingCols > 0 ? "up" : "ok" },
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
                    <span style={{ fontSize: 16 }}>{typeIcon[e.type]}</span>
                    <span style={{ fontWeight: 600, fontSize: 13, flex: 1 }}>{e.title}</span>
                    {severityBadge(e.severity)}
                  </div>
                  <div style={{ display: "flex", gap: 10, fontSize: 11, color: "var(--text-muted)", alignItems: "center" }}>
                    <span>📍 {e.city}</span>
                    <span>👥 {e.victims} vítimas</span>
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
            <div><div className="card-title">🙋 Voluntários Pendentes</div><div className="card-subtitle">Aguardando aprovação</div></div>
          </div>
          {volunteers.filter(v => v.status === "pendente").length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum pendente</div>
            </div>
          ) : volunteers.filter(v => v.status === "pendente").map(v => (
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
