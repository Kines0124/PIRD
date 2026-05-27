import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { statusBadge } from "../adminTheme.jsx";

function CollectionMap({ points, selectedId }) {
  const containerRef = useRef(null);
  const mapRef       = useRef(null);
  const markersRef   = useRef({});

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-45.56, -23.03],
      zoom: 12, pitch: 45, antialias: true,
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
    return () => { if (mapRef.current) { mapRef.current.remove(); mapRef.current = null; } };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    Object.values(markersRef.current).forEach(m => m.remove());
    markersRef.current = {};
    points.forEach(p => {
      if (!p.lat || !p.lng) return;
      const isSelected = selectedId === p.id;
      const el = document.createElement("div");
      el.innerHTML = `<div style="width:26px;height:26px;border-radius:6px;background:${isSelected ? "#FF6B1A" : "#3B82F6"};border:2px solid rgba(255,255,255,0.35);display:flex;align-items:center;justify-content:center;font-size:13px;box-shadow:0 0 10px ${isSelected ? "#FF6B1A88" : "#3B82F688"};cursor:pointer">📦</div>`;
      const popup = new mapboxgl.Popup({ offset: 14 }).setHTML(
        `<div style="font-family:sans-serif;min-width:160px"><div style="font-weight:700;font-size:13px;margin-bottom:4px">📦 ${p.name}</div><div style="font-size:11px;color:#555">📍 ${p.address || ""}, ${p.city || ""}</div></div>`
      );
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([parseFloat(p.lng), parseFloat(p.lat)])
        .setPopup(popup)
        .addTo(map);
      markersRef.current[p.id] = marker;
    });
    if (selectedId && markersRef.current[selectedId]) {
      const m = markersRef.current[selectedId];
      map.flyTo({ center: m.getLngLat(), zoom: 15, duration: 800 });
      m.togglePopup();
    }
  }, [points, selectedId]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-elevated)", borderRadius: 8 }}>
        <div style={{ fontSize: 12, color: "var(--text-muted)", textAlign: "center" }}>Configure VITE_MAPBOX_TOKEN para visualizar o mapa.</div>
      </div>
    );
  }

  return <div ref={containerRef} style={{ height: "100%", width: "100%", borderRadius: 8 }} />;
}

export default function CollectionPointsSection({ collectionPoints, onValidate, onReject }) {
  const [tab, setTab]       = useState("validacao");
  const [selId, setSelId]   = useState(null);
  const [search, setSearch] = useState("");

  const pendingCount   = collectionPoints.filter(p => p.status === "pendente").length;
  const validatedCount = collectionPoints.filter(p => p.status === "validado").length;

  const validate = id => onValidate && onValidate(id);
  const reject   = id => onReject   && onReject(id);

  const validatedFiltered = collectionPoints
    .filter(p => p.status === "validado")
    .filter(p => (p.name || "").toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">📦 Pontos de Coleta</div>
          <div className="card-subtitle">RF07, RF08 — Validação e visualização de pontos de coleta</div>
        </div>
        <div className="text-sm text-muted mono">{pendingCount} pendente(s) · {validatedCount} validado(s)</div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "validacao" ? "active" : ""}`} onClick={() => setTab("validacao")}>
          ⏳ Validação {pendingCount > 0 && <span className="nav-badge blue" style={{ marginLeft: 6 }}>{pendingCount}</span>}
        </div>
        <div className={`tab ${tab === "visualizacao" ? "active" : ""}`} onClick={() => { setTab("visualizacao"); setSelId(null); }}>
          🗺️ Pontos de Coleta ({validatedCount})
        </div>
      </div>

      {tab === "validacao" && (
        <>
          {pendingCount === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">✅</div>
              <div className="empty-state-text">Nenhum ponto pendente</div>
            </div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>Nome</th><th>Endereço</th><th>Status</th><th>Ações</th></tr>
                </thead>
                <tbody>
                  {collectionPoints.filter(p => p.status === "pendente").map(p => (
                    <tr key={p.id}>
                      <td><span style={{ fontWeight: 600 }}>{p.name}</span></td>
                      <td><span className="text-secondary text-sm">📍 {p.address}, {p.city}</span></td>
                      <td>{statusBadge(p.status)}</td>
                      <td>
                        <div className="btn-group">
                          <button className="btn btn-success btn-sm" onClick={() => validate(p.id)}>✓ Validar</button>
                          <button className="btn btn-danger btn-sm"  onClick={() => reject(p.id)}>✕ Recusar</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {tab === "visualizacao" && (
        <div style={{ display: "flex", height: 480 }}>
          <div style={{ width: 300, flexShrink: 0, borderRight: "1px solid var(--border)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
            <div style={{ padding: "12px 14px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
              <input
                className="search-input"
                placeholder="🔍 Buscar ponto..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{ width: "100%" }}
              />
            </div>
            <div style={{ overflowY: "auto", flex: 1 }}>
              {validatedFiltered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">Nenhum ponto validado</div>
                </div>
              ) : validatedFiltered.map(p => (
                <div
                  key={p.id}
                  onClick={() => setSelId(prev => prev === p.id ? null : p.id)}
                  style={{
                    padding: "13px 16px", borderBottom: "1px solid var(--border)",
                    cursor: "pointer", transition: "all 0.15s",
                    background: selId === p.id ? "var(--bg-hover)" : "transparent",
                    borderLeft: `3px solid ${selId === p.id ? "var(--accent)" : "transparent"}`,
                  }}
                >
                  <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 3 }}>{p.name}</div>
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>📍 {p.address}, {p.city}</div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontSize: 10, color: selId === p.id ? "var(--accent)" : "var(--text-muted)" }}>
                      {selId === p.id ? "📍 no mapa ✓" : "ver no mapa →"}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div style={{ flex: 1 }}>
            {validatedFiltered.length === 0 ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon">🗺️</div>
                <div className="empty-state-text">Nenhum ponto para exibir</div>
              </div>
            ) : (
              <CollectionMap points={validatedFiltered} selectedId={selId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
