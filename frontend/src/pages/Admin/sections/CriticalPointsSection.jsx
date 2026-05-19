import { useState, useEffect, useRef } from "react";
import { riskColor, severityBadge } from "../adminTheme.jsx";
import CriticalPointModal from "../modals/CriticalPointModal.jsx";

function CriticalPointMap({ point }) {
  const mapRef = useRef(null);
  const instanceRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current || !window.L) return;
    if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; }
    const L = window.L;
    const map = L.map(mapRef.current, { center: [point.lat, point.lng], zoom: 15 });
    instanceRef.current = map;
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap", maxZoom: 18,
    }).addTo(map);
    const color = riskColor[point.risk] || "#FF8C00";
    const icon = L.divIcon({
      className: "",
      html: `<div style="width:28px;height:28px;transform:rotate(45deg);background:${color};border:2px solid rgba(255,255,255,0.3);box-shadow:0 0 14px ${color}88;"></div>`,
      iconSize: [28, 28], iconAnchor: [14, 14],
    });
    L.marker([point.lat, point.lng], { icon }).addTo(map)
      .bindPopup(`<b>⚠️ ${point.name}</b><br/>${point.description || ""}`)
      .openPopup();
    return () => { if (instanceRef.current) { instanceRef.current.remove(); instanceRef.current = null; } };
  }, [point]);

  return <div ref={mapRef} style={{ height: 300, borderRadius: 8, overflow: "hidden" }} />;
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
