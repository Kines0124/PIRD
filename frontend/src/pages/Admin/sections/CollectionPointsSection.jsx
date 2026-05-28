import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";

function fmt(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

// ── Mapbox map ──────────────────────────────────────────────────────────────
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
          "fill-extrusion-base":   ["interpolate", ["linear"], ["zoom"], 15, 0, 15.05, ["get", "min_height"]],
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

// ── Detail drawer ───────────────────────────────────────────────────────────
function PontoDetailDrawer({ ponto, onClose }) {
  if (!ponto) return null;

  const rows = (label, value) => (
    <div key={label} style={{ display: "grid", gridTemplateColumns: "120px 1fr", gap: 8, alignItems: "start" }}>
      <span style={{ fontSize: 11, color: "var(--text-muted)", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em", paddingTop: 1 }}>{label}</span>
      <span style={{ fontSize: 13, color: "var(--text-primary)" }}>{value || "—"}</span>
    </div>
  );

  const section = (title, children) => (
    <div>
      <div style={{ fontSize: 10, color: "var(--text-muted)", letterSpacing: "0.1em", textTransform: "uppercase", fontWeight: 600, marginBottom: 10, fontFamily: "var(--font-mono)" }}>
        {title}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>{children}</div>
    </div>
  );

  return (
    <div
      style={{ position: "fixed", inset: 0, zIndex: 500, display: "flex" }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div style={{ flex: 1, background: "rgba(0,0,0,0.5)" }} onClick={onClose} />

      <div style={{ width: 420, background: "var(--bg-surface)", borderLeft: "1px solid var(--border)", display: "flex", flexDirection: "column", animation: "slideInRight 0.2s" }}>

        {/* Header */}
        <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", display: "flex", alignItems: "center", gap: 14 }}>
          <div style={{ width: 52, height: 52, borderRadius: 10, backgroundColor: "rgba(255,107,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, flexShrink: 0 }}>
            📦
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 700, fontSize: 16, color: "var(--text-primary)", marginBottom: 3 }}>{ponto.name}</div>
            <div style={{ fontSize: 12, color: "var(--text-secondary)" }}>{ponto.type || "Ponto de Coleta"}</div>
          </div>
          <button
            onClick={onClose}
            style={{ width: 28, height: 28, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}
          >✕</button>
        </div>

        {/* Status badge */}
        <div style={{ padding: "12px 24px", borderBottom: "1px solid var(--border)", backgroundColor: "var(--bg-elevated)" }}>
          <span style={{ backgroundColor: "rgba(22,163,74,0.12)", color: "#16a34a", borderRadius: 99, fontSize: 12, fontWeight: 600, padding: "4px 12px" }}>
            ✓ Ponto Validado
          </span>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: 18 }}>
          {section("Identificação", [
            rows("Nome",  ponto.name),
            rows("CNPJ",  ponto.cnpj),
            rows("Tipo",  ponto.type),
          ])}

          <div style={{ height: 1, background: "var(--border)" }} />

          {section("Contato", [
            rows("Telefone", ponto.phone),
            rows("E-mail",   ponto.email),
          ])}

          <div style={{ height: 1, background: "var(--border)" }} />

          {section("Endereço", [
            rows("Endereço", ponto.address),
            rows("Cidade",   ponto.city || "—"),
          ])}

          {(ponto.lat || ponto.lng) && (
            <>
              <div style={{ height: 1, background: "var(--border)" }} />
              {section("Localização GPS", [
                rows("Latitude",  ponto.lat ? ponto.lat.toFixed(6) : "—"),
                rows("Longitude", ponto.lng ? ponto.lng.toFixed(6) : "—"),
              ])}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ── Card component ──────────────────────────────────────────────────────────
function PontoCard({ ponto, onClick }) {
  return (
    <div
      onClick={onClick}
      style={{ backgroundColor: "var(--bg-surface)", border: "1px solid var(--border)", borderRadius: 10, padding: 16, cursor: "pointer", transition: "all 0.15s", display: "flex", gap: 14, alignItems: "flex-start" }}
      onMouseEnter={e => { e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)"; e.currentTarget.style.background = "var(--bg-elevated)"; }}
      onMouseLeave={e => { e.currentTarget.style.borderColor = "var(--border)"; e.currentTarget.style.background = "var(--bg-surface)"; }}
    >
      <div style={{ width: 44, height: 44, borderRadius: 8, backgroundColor: "rgba(255,107,26,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 18, flexShrink: 0 }}>
        📦
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 600, fontSize: 13, color: "var(--text-primary)", marginBottom: 3, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
          {ponto.name}
        </div>
        <div style={{ fontSize: 11, color: "var(--text-secondary)", marginBottom: 8 }}>
          📍 {ponto.address || "Sem endereço"}
        </div>
        <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          {ponto.type && (
            <span style={{ fontSize: 10, backgroundColor: "rgba(255,107,26,0.12)", color: "#FF6B1A", borderRadius: 99, padding: "1px 8px", fontWeight: 600 }}>
              {ponto.type}
            </span>
          )}
          {ponto.cnpj && (
            <span style={{ fontSize: 10, color: "var(--text-muted)", background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 6, padding: "1px 6px", fontFamily: "var(--font-mono)" }}>
              {ponto.cnpj}
            </span>
          )}
        </div>
      </div>
      <div style={{ fontSize: 14, color: "var(--text-muted)", flexShrink: 0 }}>›</div>
    </div>
  );
}

// ── Main section ────────────────────────────────────────────────────────────
export default function CollectionPointsSection({ collectionPoints }) {
  const [tab,      setTab]      = useState("informacoes");
  const [selected, setSelected] = useState(null);
  const [selId,    setSelId]    = useState(null);
  const [search,   setSearch]   = useState("");

  const validados = collectionPoints.filter(p => p.status === "validado");
  const filtered  = validados.filter(p =>
    (p.name || "").toLowerCase().includes(search.toLowerCase()) ||
    (p.cnpj || "").toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title">📦 Pontos de Coleta</div>
          <div className="card-subtitle">RF07, RF08 — Visualização e informações dos pontos validados</div>
        </div>
        <div className="text-sm text-muted mono">{validados.length} ponto(s) validado(s)</div>
      </div>

      <div className="tabs">
        <div className={`tab ${tab === "informacoes" ? "active" : ""}`}
          onClick={() => setTab("informacoes")}>
          📋 Informações ({validados.length})
        </div>
        <div className={`tab ${tab === "localizacoes" ? "active" : ""}`}
          onClick={() => { setTab("localizacoes"); setSelId(null); }}>
          🗺️ Localizações
        </div>
      </div>

      {/* ── Informações tab ── */}
      {tab === "informacoes" && (
        <div style={{ padding: "16px 20px" }}>
          {/* Search */}
          <div style={{ marginBottom: 18 }}>
            <input
              className="search-input"
              placeholder="Buscar por nome ou CNPJ..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ width: "100%", maxWidth: 400 }}
            />
          </div>

          {(search) && (
            <div style={{ fontSize: 12, color: "var(--text-muted)", marginBottom: 14 }}>
              {filtered.length} resultado(s) encontrado(s)
            </div>
          )}

          {validados.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">📦</div>
              <div className="empty-state-text">Nenhum ponto validado ainda.</div>
            </div>
          ) : filtered.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🔍</div>
              <div className="empty-state-text">Nenhum ponto encontrado para a busca.</div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: 12 }}>
              {filtered.map(p => (
                <PontoCard key={p.id} ponto={p} onClick={() => setSelected(p)} />
              ))}
            </div>
          )}

          {selected && (
            <PontoDetailDrawer ponto={selected} onClose={() => setSelected(null)} />
          )}
        </div>
      )}

      {/* ── Localizações tab ── */}
      {tab === "localizacoes" && (
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
              {filtered.length === 0 ? (
                <div className="empty-state">
                  <div className="empty-state-icon">📦</div>
                  <div className="empty-state-text">Nenhum ponto validado</div>
                </div>
              ) : filtered.map(p => (
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
                  <div style={{ fontSize: 11, color: "var(--text-muted)", marginBottom: 6 }}>📍 {p.address}</div>
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
            {filtered.length === 0 ? (
              <div className="empty-state" style={{ height: "100%", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                <div className="empty-state-icon">🗺️</div>
                <div className="empty-state-text">Nenhum ponto para exibir</div>
              </div>
            ) : (
              <CollectionMap points={filtered} selectedId={selId} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
