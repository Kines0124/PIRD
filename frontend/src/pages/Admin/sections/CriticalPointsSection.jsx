import { useState, useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { gsap } from "gsap";
import { MAPBOX_TOKEN } from "../../../utils/geocoding.js";
import { riskColor, severityBadge } from "../adminTheme.jsx";
import CriticalPointModal from "../modals/CriticalPointModal.jsx";
import { IoWarningOutline }    from "react-icons/io5";
import { CiEdit } from "react-icons/ci";
import { FaTrash, FaMapMarkedAlt } from "react-icons/fa";

// ---------- Mapa (sem alterações) ----------
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

// ---------- Linha animada da tabela ----------
function CriticalPointRow({ point, index, onDetail, onEdit, onDelete }) {
  const rowRef = useRef(null);

  useEffect(() => {
    if (!rowRef.current) return;
    gsap.fromTo(
      rowRef.current,
      { x: 32, opacity: 0 },
      {
        x: 0,
        opacity: 1,
        duration: 0.42,
        ease: "power3.out",
        delay: index * 0.06,
      }
    );
  }, []); // só na montagem

  function handleMouseEnter() {
    gsap.to(rowRef.current, {
      x: 2,
      duration: 0.2,
      ease: "power2.out",
      overwrite: "auto",
    });
  }
  function handleMouseLeave() {
    gsap.to(rowRef.current, {
      x: 0,
      duration: 0.25,
      ease: "power2.inOut",
      overwrite: "auto",
    });
  }

  return (
    <tr
      ref={rowRef}
      onClick={() => onDetail(point)}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{ cursor: "pointer", opacity: 0, willChange: "transform, opacity" }}
    >
      <td><span style={{ fontWeight: 600 }}>{point.name}</span></td>
      <td><span style={{ textTransform: "capitalize", fontSize: 12, color: "var(--text-secondary)" }}>{point.type}</span></td>
      <td>{severityBadge(point.risk)}</td>
      <td><span className="mono text-sm text-muted">{point.lat}, {point.lng}</span></td>
      <td><span className="text-sm text-secondary">{(point.description || "").slice(0, 50)}{point.description?.length > 50 ? "…" : ""}</span></td>
      <td>
        <div className="btn-group" onClick={e => e.stopPropagation()}>
          <button className="btn btn-secondary btn-sm btn-icon" onClick={() => onEdit(point)}><CiEdit style={{color:"white", fontSize:18}}/></button>
          <button className="btn btn-danger btn-sm btn-icon" onClick={() => onDelete && onDelete(point.id)}><FaTrash style={{ color:"gray", fontSize:18}}/></button>
        </div>
      </td>
    </tr>
  );
}

// ---------- Drawer de detalhe ----------
function DetailDrawer({ point, onClose, onEdit }) {
  const overlayRef = useRef(null);
  const panelRef   = useRef(null);
  const contentRef = useRef(null);

  // Entrada
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power3.out" } });
    tl.fromTo(overlayRef.current, { opacity: 0 }, { opacity: 1, duration: 0.25 });
    tl.fromTo(panelRef.current,   { x: 48, opacity: 0 }, { x: 0, opacity: 1, duration: 0.35 }, "<0.06");
    tl.fromTo(
      contentRef.current?.querySelectorAll(".drawer-item") || [],
      { x: 16, opacity: 0 },
      { x: 0, opacity: 1, stagger: 0.07, duration: 0.3 },
      "-=0.18"
    );
  }, []);

  function handleClose() {
    const tl = gsap.timeline({ onComplete: onClose });
    tl.to(panelRef.current,   { x: 48, opacity: 0, duration: 0.24, ease: "power2.in" });
    tl.to(overlayRef.current, { opacity: 0, duration: 0.18 }, "<0.04");
  }

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1000, display: "flex", justifyContent: "flex-end" }}>
      {/* Overlay */}
      <div
        ref={overlayRef}
        style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", opacity: 0 }}
        onClick={handleClose}
      />

      {/* Painel */}
      <div
        ref={panelRef}
        style={{
          position: "relative",
          width: 480, maxWidth: "95vw", height: "100vh", overflowY: "auto",
          background: "var(--bg-surface)", borderLeft: "1px solid var(--border)",
          display: "flex", flexDirection: "column",
          opacity: 0, willChange: "transform, opacity",
        }}
      >
        {/* Header */}
        <div style={{ padding: "20px 24px 16px", borderBottom: "1px solid var(--border)", flexShrink: 0 }}>
          <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 12 }}>
            <div>
              <div style={{ fontFamily: "var(--font-display)", fontWeight: 700, fontSize: 17, marginBottom: 6 }}>
                <IoWarningOutline style={{color: "yellow"}}/> {point.name}
              </div>
              <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
                {severityBadge(point.risk)}
                <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-mono)", textTransform: "capitalize" }}>
                  {point.type}
                </span>
              </div>
            </div>
            <div style={{ display: "flex", gap: 8, flexShrink: 0 }}>
              <button className="btn btn-secondary btn-sm" onClick={() => { onEdit(point); handleClose(); }}><CiEdit style={{color:"white", fontSize:18}} /> Editar</button>
              <button
                onClick={handleClose}
                style={{ width: 30, height: 30, borderRadius: "50%", border: "1px solid var(--border)", background: "none", cursor: "pointer", color: "var(--text-secondary)", fontSize: 16, display: "flex", alignItems: "center", justifyContent: "center" }}
              >✕</button>
            </div>
          </div>
        </div>

        {/* Body */}
        <div ref={contentRef} style={{ flex: 1, padding: "20px 24px", display: "flex", flexDirection: "column", gap: 12 }}>
          <div className="drawer-item" style={{ fontSize: 11, fontWeight: 700, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontFamily: "var(--font-mono)" }}>
            Localização
          </div>
          <div className="drawer-item">
            <CriticalPointMap point={point} />
          </div>
          {point.description && (
            <div className="drawer-item" style={{ background: "var(--bg-elevated)", border: "1px solid var(--border)", borderRadius: 8, padding: "12px 14px" }}>
              <div style={{ fontSize: 10, color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 6, fontFamily: "var(--font-mono)" }}>Descrição</div>
              <div style={{ fontSize: 13, color: "var(--text-secondary)", lineHeight: 1.6 }}>{point.description}</div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ---------- Seção principal ----------
export default function CriticalPointsSection({ criticalPoints, onSavePoint, onDeletePoint }) {
  const [editPoint,   setEditPoint]   = useState(null);
  const [detailPoint, setDetailPoint] = useState(null);
  const [showNew,     setShowNew]     = useState(false);

  const headerRef  = useRef(null);
  const tableRef   = useRef(null);
  const prevCount  = useRef(criticalPoints.length);

  // Entrada da seção
  useEffect(() => {
    const tl = gsap.timeline({ defaults: { ease: "power2.out" } });
    tl.fromTo(headerRef.current, { y: -10, opacity: 0 }, { y: 0, opacity: 1, duration: 0.32 });
    tl.fromTo(tableRef.current,  { y: 8,   opacity: 0 }, { y: 0, opacity: 1, duration: 0.28 }, "-=0.1");
  }, []);

  // Flash suave quando um item é adicionado/removido
  useEffect(() => {
    if (!tableRef.current || prevCount.current === criticalPoints.length) return;
    prevCount.current = criticalPoints.length;
    gsap.fromTo(
      tableRef.current,
      { opacity: 0.5 },
      { opacity: 1, duration: 0.3, ease: "power1.out" }
    );
  }, [criticalPoints.length]);

  return (
    <>
          <style>{`
        @keyframes warning-pulse {
          0%, 100% { color: yellow; opacity: 1; }
          50%       { color: #b8860b; opacity: 0.45; }
        }
        .icon-warning-pulse { animation: warning-pulse 1.4s ease-in-out infinite; }
      `}</style>
    <>
      <div className="card">
        {/* Header */}
        <div ref={headerRef} className="card-header" style={{ opacity: 0 }}>
          <div>
            <div className="card-title"><IoWarningOutline style={{color: "yellow"}}/> Pontos Críticos</div>
            <div className="card-subtitle">Áreas de alto risco cadastradas pelo administrador · clique na linha para detalhes</div>
          </div>
          <button className="btn btn-primary" onClick={() => setShowNew(true)}>＋ Novo Ponto</button>
        </div>

        {/* Tabela */}
        <div ref={tableRef} className="table-wrap" style={{ opacity: 0 }}>
          {criticalPoints.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon"><IoWarningOutline style={{color: "yellow"}}/></div>
              <div className="empty-state-text">Nenhum ponto crítico registrado</div>
            </div>
          ) : (
            <table>
              <thead>
                <tr>
                  <th>Nome</th><th>Tipo</th><th>Nível de Risco</th>
                  <th>Coordenadas</th><th>Observação</th><th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {criticalPoints.map((p, i) => (
                  <CriticalPointRow
                    key={p.id}
                    point={p}
                    index={i}
                    onDetail={setDetailPoint}
                    onEdit={setEditPoint}
                    onDelete={onDeletePoint}
                  />
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Drawer */}
      {detailPoint && (
        <DetailDrawer
          point={detailPoint}
          onClose={() => setDetailPoint(null)}
          onEdit={p => { setEditPoint(p); }}
        />
      )}

      {/* Modal de criação/edição */}
      {(showNew || editPoint) && (
        <CriticalPointModal
          point={editPoint}
          onClose={() => { setShowNew(false); setEditPoint(null); }}
          onSave={form => onSavePoint && onSavePoint(editPoint, form)}
        />
      )}
    </>
    </>
  );
}