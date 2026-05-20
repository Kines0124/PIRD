import { useEffect, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import { MAPBOX_TOKEN } from "../../../utils/geocoding";

const TAUBATE = [-45.5533, -23.0268];

const PROF_COLORS = {
  "Médico Clínico Geral": "#2563eb", "Médico Emergencista": "#2563eb",
  "Enfermeiro(a)": "#16a34a", "Bombeiro Civil": "#dc2626", "Bombeiro Militar": "#dc2626",
  "Paramédico / SAMU": "#7c3aed", "Psicólogo": "#0891b2",
  "Engenheiro de Segurança": "#d97706", "Técnico em Resgate": "#71717a",
};

const STATUS_STYLE = {
  a_caminho:  { label: "A caminho",  dot: "#ca8a04" },
  no_local:   { label: "No local",   dot: "#dc2626" },
  disponivel: { label: "Disponível", dot: "#16a34a" },
};

const TIPO_EMOJI = {
  enchente: "🌊", deslizamento: "⛰️", alagamento: "💧", incendio: "🔥",
  desabamento: "🏚️", acidente_transito: "🚗", intoxicacao: "☣️", outro: "⚠️",
};

function alertConfig(a) {
  const isCritico = a.criticidade === "critico";
  const isAlto    = a.criticidade === "alto" || a.criticidade === "grave";
  return {
    color:      isCritico ? "#FF4444" : isAlto ? "#FF6B00" : "#F5A623",
    icon:       TIPO_EMOJI[a.tipo] ?? "⚠️",
    size:       isCritico ? 44 : 36,
    isCritical: isCritico,
  };
}

function injectCSS() {
  if (document.getElementById("pird-mapa-css")) return;
  const s = document.createElement("style");
  s.id = "pird-mapa-css";
  s.textContent = `
    @keyframes pulse-ring{0%{transform:scale(1);opacity:.6}100%{transform:scale(2.2);opacity:0}}
    @keyframes alert-pulse{0%,100%{opacity:1;transform:scale(1)}50%{opacity:.7;transform:scale(1.15)}}
    .mapboxgl-ctrl-group{background:#fff!important;border-radius:8px!important;box-shadow:0 2px 8px rgba(0,0,0,.22)!important;border:1px solid #e5e7eb!important;overflow:hidden}
    .mapboxgl-ctrl-group button{background:#fff!important;border-bottom:1px solid #f0f0f0!important;width:30px!important;height:30px!important}
    .mapboxgl-ctrl-group button:last-child{border-bottom:none!important}
    .mapboxgl-ctrl-group button:hover{background:#f5f7fa!important}
  `;
  document.head.appendChild(s);
}

function createAlertEl(a) {
  const { color, icon, size, isCritical } = alertConfig(a);
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="position:relative;width:${size}px;height:${size}px;">
      ${isCritical ? `<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ${color};opacity:.5;animation:pulse-ring 1.5s ease-out infinite;"></div>` : ""}
      <div style="position:absolute;inset:0;border-radius:50%;background:${color}22;border:2px solid ${color};display:flex;align-items:center;justify-content:center;font-size:${isCritical ? 20 : 16}px;box-shadow:0 0 10px ${color}66;${isCritical ? "animation:alert-pulse 2s ease infinite;" : ""}">${icon}</div>
    </div>`;
  return el;
}

function createProfEl(p) {
  const color = PROF_COLORS[p.profissao] ?? "#71717a";
  const st    = STATUS_STYLE[p.statusCampo ?? "disponivel"] ?? STATUS_STYLE.disponivel;
  const init  = p.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
  const el = document.createElement("div");
  el.style.cursor = "pointer";
  el.innerHTML = `
    <div style="position:relative;width:40px;height:40px;">
      <div style="position:absolute;inset:0;border-radius:50%;background:${color};border:2.5px solid #fff;box-shadow:0 2px 8px rgba(0,0,0,.22);display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:800;color:#fff;letter-spacing:-.5px;">${init}</div>
      <div style="position:absolute;bottom:0;right:0;width:12px;height:12px;border-radius:50%;background:${st.dot};border:2px solid #fff;"></div>
    </div>`;
  return el;
}

export default function MapaCampo({ alertas = [], profissionais = [] }) {
  const containerRef     = useRef(null);
  const mapRef           = useRef(null);
  const alertMarkersRef  = useRef(new Map());
  const profMarkersRef   = useRef([]);
  const [mapReady, setMapReady] = useState(false);
  const [selAlerta, setSelAlerta] = useState(null);
  const [selProf,   setSelProf]   = useState(null);

  useEffect(() => {
    if (!containerRef.current || !MAPBOX_TOKEN) return;
    injectCSS();
    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: TAUBATE, zoom: 12, pitch: 35, antialias: true,
    });
    map.addControl(new mapboxgl.NavigationControl({ showCompass: true, showZoom: true }), "top-right");
    map.on("style.load", () => setMapReady(true));
    mapRef.current = map;
    return () => { map.remove(); setMapReady(false); };
  }, []);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !mapReady) return;

    const activeIds = new Set(alertas.filter(a => a.coordenadas).map(a => a.id));
    alertMarkersRef.current.forEach((m, id) => {
      if (!activeIds.has(id)) { m.remove(); alertMarkersRef.current.delete(id); }
    });

    alertas.filter(a => a.coordenadas && !alertMarkersRef.current.has(a.id)).forEach(a => {
      const el = createAlertEl(a);
      el.addEventListener("click", () => setSelAlerta(a));
      const marker = new mapboxgl.Marker({ element: el, anchor: "center" })
        .setLngLat([a.coordenadas.lng, a.coordenadas.lat]).addTo(map);
      alertMarkersRef.current.set(a.id, marker);
    });

    profMarkersRef.current.forEach(m => m.remove());
    profMarkersRef.current = [];
    profissionais.forEach(p => {
      const el = createProfEl(p);
      el.addEventListener("click", () => setSelProf(p));
      profMarkersRef.current.push(
        new mapboxgl.Marker({ element: el, anchor: "center" })
          .setLngLat([p.coordenadas.lng, p.coordenadas.lat]).addTo(map)
      );
    });
  }, [alertas, profissionais, mapReady]);

  if (!MAPBOX_TOKEN) {
    return (
      <div style={{ flex: 1, borderRadius: 12, overflow: "hidden", minHeight: 400, backgroundColor: "var(--bg-hover)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 12 }}>
        <span style={{ fontSize: 32 }}>🗺️</span>
        <div style={{ fontSize: 13, color: "var(--text-secondary)", textAlign: "center" }}>
          Mapa indisponível.<br />Configure <code>VITE_MAPBOX_TOKEN</code> no arquivo <code>.env.local</code>
        </div>
      </div>
    );
  }

  return (
    <div style={{ flex: 1, position: "relative", borderRadius: 12, overflow: "hidden", minHeight: 400 }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {selAlerta && (() => {
        const cfg = alertConfig(selAlerta);
        return (
          <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.18)", border: `2px solid ${cfg.color}`, maxWidth: 280, minWidth: 220, fontFamily: "system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                <div style={{ width: 9, height: 9, borderRadius: "50%", background: cfg.color }} />
                <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, textTransform: "uppercase" }}>{selAlerta.criticidade}</span>
              </div>
              <button onClick={() => setSelAlerta(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1 }}>×</button>
            </div>
            <div style={{ fontWeight: 700, fontSize: 14, color: "#111827", marginBottom: 5 }}>{selAlerta.titulo}</div>
            {selAlerta.endereco && <div style={{ fontSize: 12, color: "#6b7280", marginBottom: 8 }}>📍 {selAlerta.endereco}</div>}
            {selAlerta.profissionaisNecessarios?.length > 0 && (
              <div style={{ fontSize: 11, background: "#f8fafc", borderRadius: 8, padding: "8px 10px", border: "1px solid #e2e8f0" }}>
                <div style={{ fontWeight: 600, color: "#374151", marginBottom: 4 }}>Profissionais necessários</div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 4 }}>
                  {selAlerta.profissionaisNecessarios.map(p => <span key={p} style={{ background: "#fff", border: "1px solid #e2e8f0", borderRadius: 99, padding: "2px 8px", fontSize: 10, color: "#4b5563" }}>{p}</span>)}
                </div>
              </div>
            )}
          </div>
        );
      })()}

      {selProf && (() => {
        const color = PROF_COLORS[selProf.profissao] ?? "#71717a";
        const st    = STATUS_STYLE[selProf.statusCampo ?? "disponivel"];
        const init  = selProf.nome.split(" ").slice(0, 2).map(n => n[0]).join("").toUpperCase();
        return (
          <div style={{ position: "absolute", bottom: 16, left: 12, zIndex: 20, backgroundColor: "rgba(255,255,255,0.97)", backdropFilter: "blur(10px)", borderRadius: 12, padding: "14px 16px", boxShadow: "0 4px 20px rgba(0,0,0,.18)", border: `2px solid ${color}`, maxWidth: 280, minWidth: 220, fontFamily: "system-ui,sans-serif" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ width: 42, height: 42, borderRadius: "50%", background: color, border: "2px solid #fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 15, fontWeight: 800, color: "#fff", flexShrink: 0 }}>{init}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#111827" }}>{selProf.nome}</div>
                <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>{selProf.profissao}</div>
              </div>
              <button onClick={() => setSelProf(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "#9ca3af", fontSize: 16, lineHeight: 1, alignSelf: "flex-start" }}>×</button>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12, fontWeight: 600, color: st.dot, padding: "6px 9px", background: "#f8fafc", borderRadius: 8 }}>
              <span style={{ width: 8, height: 8, borderRadius: "50%", background: st.dot, display: "inline-block", flexShrink: 0 }} />
              {st.label}
            </div>
          </div>
        );
      })()}

      {/* Legend */}
      <div style={{ position: "absolute", bottom: 16, right: 12, zIndex: 10, backgroundColor: "rgba(255,255,255,0.94)", backdropFilter: "blur(8px)", borderRadius: 10, padding: "10px 13px", boxShadow: "0 2px 10px rgba(0,0,0,.11)", border: "1px solid #e5e7eb", fontSize: 11, lineHeight: 1.9, minWidth: 150 }}>
        <div style={{ fontWeight: 700, fontSize: 10, color: "#6b7280", textTransform: "uppercase", letterSpacing: 0.7, marginBottom: 7 }}>Legenda</div>
        {[{ color: "#FF4444", label: "Evento Crítico" }, { color: "#FF6B00", label: "Evento Grave" }, { color: "#F5A623", label: "Evento Moderado" }].map(i => (
          <div key={i.label} style={{ display: "flex", alignItems: "center", gap: 7, color: "#374151" }}>
            <div style={{ width: 14, height: 14, borderRadius: "50%", background: i.color, border: "2px solid #fff", boxShadow: `0 0 0 1.5px ${i.color}55`, flexShrink: 0 }} />
            {i.label}
          </div>
        ))}
      </div>
    </div>
  );
}
