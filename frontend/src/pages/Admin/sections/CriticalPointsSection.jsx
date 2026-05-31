import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { riskColor, severityBadge } from "../adminTheme.jsx";
import CriticalPointModal from "../modals/CriticalPointModal.jsx";

function CriticalPointMap({ point }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; }
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [parseFloat(point.lng), parseFloat(point.lat)],
      zoom: 15, pitch: 45, antialias: true,
    });
    mapRef.current = map;
    map.addControl(new mapboxgl.NavigationControl({ showCompass: false }), "bottom-right");
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
    });
    const color = riskColor[point.risk] || "#FF8C00";
    const el = document.createElement("div");
    el.innerHTML = `<div style="width:28px;height:28px;border-radius:50%;background:${color}22;border:2.5px solid ${color};display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:900;color:${color};box-shadow:0 0 10px ${color}66;cursor:pointer">!</div>`;
    const popup = new mapboxgl.Popup({ offset: 18, closeOnClick: false }).setHTML(
      `<div style="font-family:sans-serif;min-width:140px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">⚠️ ${point.name}</div>${point.description ? `<div style="font-size:11px;color:#555">${point.description}</div>` : ""}</div>`
    );
    const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
      .setLngLat([parseFloat(point.lng), parseFloat(point.lat)])
      .setPopup(popup)
      .addTo(map);
    map.once("load", () => marker.togglePopup());
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, [point]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Configure VITE_MAPBOX_TOKEN para visualizar o mapa.</div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: 300, borderRadius: 8, overflow: "hidden" }} />;
}

export default function CriticalPointsSection({ criticalPoints, onSavePoint, onDeletePoint }) {
  const [editPoint, setEditPoint]     = useState(null);
  const [detailPoint, setDetailPoint] = useState(null);
  const [showNew, setShowNew]         = useState(false);

  return (
    <>
      <div className="card">
        <div className="card-header">
          <div>
            <div className="card-title">⚠️ Pontos Críticos</div>
            <div className="card-subtitle">RF14 — Áreas de alto risco cadastradas pelo administrador · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Ponto</button>
        </div>

        <div className="table-wrap">
          {criticalPoints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">⚠️</div>
              <div className="empty-state-text">Nenhum ponto crítico registrado</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr><th>Nome</th><th>Tipo</th><th>Nível de Risco</th><th>Coordenadas</th><th>Observação</th><th>Ações</th></tr>
              </thead>
              <tbody>
                {criticalPoints.map(p => (
                  <tr key={p.id} onClick={() => setDetailPoint(p)} style={{ cursor: "pointer" }}>
                    <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                    <td><span style={{ textTransform: "capitalize", fontSize: 12, color: "var(--text-secondary)" }}>{p.type}</span></td>
                    <td>{severityBadge(p.risk)}</td>
                    <td><span className="mono text-sm text-muted">{p.lat}, {p.lng}</span></td>
                    <td><span className="text-sm text-secondary">{(p.description || "").slice(0, 50)}{p.description?.length > 50 ? "…" : ""}</span></td>
                    <td>
                      <div className="btn-group" onClick={e => e.stopPropagation()}>
                        <button className="btn btn-secondary btn-sm btn-icon" onClick={() => setEditPoint(p)}>✏️</button>
                        <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDeletePoint && onDeletePoint(p.id)}>🗑️</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {detailPoint && (
        <div
          style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 1000, display: "flex", justifyContent: "flex-end" }}
          onClick={e => e.target === e.currentTarget && setDetailPoint(null)}
        >
          <div style={{
            width: 480, maxWidth: "95vw", height: "100vh", overflowY: "auto",
            background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
            display: "flex", flexDirection: "column",
            animation: "slideInRight 0.22s ease",
          }}>
            <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
                <div>
                  <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                    ⚠️ {detailPoint.name}
                  </div>
                  <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                    {severityBadge(detailPoint.risk)}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>{detailPoint.type}</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
                  <button className="btn btn-secondary btn-sm" onClick={() => { setEditPoint(detailPoint); setDetailPoint(null); }}>✏️ Editar</button>
                  <button onClick={() => setDetailPoint(null)} style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}>✕</button>
                </div>
              </div>
            </div>

            <div style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>Localização</div>
              <CriticalPointMap point={detailPoint} />
              {detailPoint.description && (
                <div style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
                  <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>Descrição</div>
                  <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{detailPoint.description}</div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {(showNew || editPoint) && (
        <CriticalPointModal
          point={editPoint}
          onClose={() => { setShowNew(false); setEditPoint(null); }}
          onSave={form => onSavePoint && onSavePoint(editPoint, form)}
        />
      )}
    </>
  );
}
